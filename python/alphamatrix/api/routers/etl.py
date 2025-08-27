from fastapi import APIRouter, Depends
from alphamatrix.api.models.requests import BackfillRequest, IncrementalRequest
from alphamatrix.api.models.responses import JobStatus, BulkJobStatus
from alphamatrix.api.deps import get_clickhouse_client, new_run_id
from alphamatrix.api.config import load_config
from alphamatrix.api.jobrunner import JobRunner, Job
from datetime import datetime
import asyncio

router = APIRouter(prefix="/v1", tags=["etl"])

# JobRunner singleton (lives in app state; see app.py)
job_runner: JobRunner = None

def set_job_runner(r: JobRunner):
    global job_runner
    job_runner = r

@router.post("/etl/backfill", response_model=BulkJobStatus)
async def etl_backfill(req: BackfillRequest):
    cfg = load_config()
    exchange = req.exchange or cfg["default_exchange"]
    symbols = req.symbols or ([req.symbol] if req.symbol else [])
    run_ids = []
    for sym in symbols:
        run_id = new_run_id()
        job = Job(
            run_id=run_id,
            kind="backfill",
            params={
                "symbol": sym,
                "start": req.start,
                "end": req.end,
                "interval": req.interval,
                "exchange": exchange,
                "dry_run": req.dry_run,
                "table": cfg["ch_table_prices"],
            },
        )
        run_ids.append(str(run_id))
        await job_runner.submit(job)
    return BulkJobStatus(run_ids=run_ids)

@router.post("/etl/incremental", response_model=BulkJobStatus)
async def etl_incremental(req: IncrementalRequest):
    cfg = load_config()
    exchange = req.exchange or cfg["default_exchange"]
    symbols = req.symbols or ([req.symbol] if req.symbol else [])
    run_ids: list[str] = []
    for sym in symbols:
        run_id = new_run_id()
        job = Job(
            run_id=run_id,
            kind="incremental",
            params={
                "symbol": sym,
                "interval": req.interval,
                "lookback_days": req.lookback_days,
                "exchange": exchange,
                "dry_run": req.dry_run,
                "table": cfg["ch_table_prices"],
            },
        )
        run_ids.append(str(run_id))
        await job_runner.submit(job)
    return BulkJobStatus(run_ids=run_ids)

@router.get("/etl/runs/{run_id}", response_model=JobStatus)
def etl_status(run_id: str):
    j = job_runner.status(run_id)
    if not j:
        return JobStatus(run_id=run_id, status="not_found")
    return JobStatus(run_id=run_id, status=j.status, detail=j.detail, rows_processed=j.rows_processed)
