import asyncio
import uuid
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from alphamatrix.etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from alphamatrix.etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv
from alphamatrix.etl.transforms.validators import validate_ohlcv
from alphamatrix.etl.utils.summary import print_ohlcv_summary
from alphamatrix.etl.io.clickhouse_client import ClickHouseClient

@dataclass
class Job:
    run_id: uuid.UUID
    kind: str  # 'backfill' | 'incremental'
    params: Dict[str, Any]
    status: str = "queued"
    detail: Optional[str] = None
    rows_processed: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.utcnow())

class JobRunner:
    def __init__(self, ch_factory: Callable[[], ClickHouseClient], concurrency: int = 2):
        self.queue: "asyncio.Queue[Job]" = asyncio.Queue()
        self.jobs: Dict[str, Job] = {}
        self.ch_factory = ch_factory
        self.concurrency = concurrency
        self.workers = []

    async def start(self):
        for i in range(self.concurrency):
            self.workers.append(asyncio.create_task(self._worker(i)))

    async def stop(self):
        for _ in self.workers:
            await self.queue.put(None)  # sentinel
        await asyncio.gather(*self.workers, return_exceptions=True)

    async def submit(self, job: Job):
        self.jobs[str(job.run_id)] = job
        await self.queue.put(job)

    def status(self, run_id: str) -> Optional[Job]:
        return self.jobs.get(run_id)

    async def _worker(self, worker_id: int):
        while True:
            job = await self.queue.get()
            if job is None:
                break
            await self._execute(job)
            self.queue.task_done()

    async def _execute(self, job: Job):
        job.status = "running"
        try:
            ch = self.ch_factory()
            adapter = YahooFinanceAdapter()

            if job.kind == "backfill":
                symbol = job.params["symbol"]
                start = job.params["start"]
                end = job.params["end"]
                interval = job.params["interval"]
                exchange = job.params["exchange"]
                dry_run = job.params["dry_run"]
                run_id = job.run_id

                raw = adapter.fetch_ohlcv(symbol, start, end, interval)
                df = map_yfinance_to_ohlcv(raw, symbol)
                validate_ohlcv(df)

                if dry_run:
                    print_ohlcv_summary(df, symbol)
                else:
                    rows = ch.upsert_ohlcv(
                        df=df,
                        table=job.params["table"],
                        interval=interval,
                        source="yahoo",
                        ingest_run_id=run_id,
                        exchange_default=exchange
                    )
                    job.rows_processed = rows

            elif job.kind == "incremental":
                symbol = job.params["symbol"]
                interval = job.params["interval"]
                lookback_days = job.params["lookback_days"]
                exchange = job.params["exchange"]
                dry_run = job.params["dry_run"]
                run_id = job.run_id
                table = job.params["table"]

                last_ts = ch.latest_timestamp(symbol, table, interval=interval)
                if last_ts is None:
                    start = datetime.utcnow() - timedelta(days=lookback_days)
                else:
                    start = last_ts
                end = datetime.utcnow()

                raw = adapter.fetch_ohlcv(symbol, start, end, interval)
                df = map_yfinance_to_ohlcv(raw, symbol)
                validate_ohlcv(df)

                if dry_run:
                    print_ohlcv_summary(df, symbol)
                else:
                    rows = ch.upsert_ohlcv(
                        df=df,
                        table=table,
                        interval=interval,
                        source="yahoo",
                        ingest_run_id=run_id,
                        exchange_default=exchange
                    )
                    job.rows_processed = rows
            else:
                raise ValueError(f"Unknown job kind: {job.kind}")

            job.status = "succeeded"
        except Exception as e:
            job.status = "failed"
            job.detail = str(e)
