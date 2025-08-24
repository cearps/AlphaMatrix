from __future__ import annotations
from typing import Optional, Iterable, List, Dict
from datetime import datetime
import uuid

import pandas as pd
import clickhouse_connect
from alphamatrix.etl.utils.logging import get_logger

logger = get_logger(__name__)

class ClickHouseClient:
    def __init__(self, host: str, port: int, user: str, password: str, database: str,
                 protocol: str = "native", secure: bool = False,
                 async_insert: bool = True, wait_async: bool = True,
                 batch_size: int = 25000):
        logger.info(f"init host={host} port={port} db={database} protocol={protocol} secure={secure}")
        self.batch_size = int(batch_size)
        self.async_insert = async_insert
        self.wait_async = wait_async

        # clickhouse-connect client
        self.client = clickhouse_connect.get_client(
            host=host,
            port=port,
            username=user,
            password=password,
            database=database,
            # clickhouse-connect doesn't use interface parameter, it auto-detects
            secure=secure,
            query_limit=0
        )

    def healthcheck(self) -> bool:
        try:
            pong = self.client.command("SELECT 1")
            logger.info(f"healthcheck ok={pong == 1}")
            return pong == 1
        except Exception as e:
            logger.error(f"healthcheck fail: {e}")
            return False

    def latest_timestamp(self, symbol: str, table: str, interval: Optional[str] = None) -> Optional[str]:
        try:
            if interval:
                sql = f"SELECT max(timestamp) FROM {table} WHERE symbol=%(s)s AND interval=%(i)s"
                res = self.client.query(sql, parameters={"s": symbol, "i": interval})
            else:
                sql = f"SELECT max(timestamp) FROM {table} WHERE symbol=%(s)s"
                res = self.client.query(sql, parameters={"s": symbol})
            val = res.result_rows[0][0] if res.result_rows else None
            logger.info(f"latest_timestamp symbol={symbol} interval={interval} -> {val}")
            return val
        except Exception as e:
            logger.error(f"latest_timestamp error: {e}")
            return None

    def upsert_ohlcv(
        self,
        df: pd.DataFrame,
        table: str,
        interval: str,
        source: str,
        ingest_run_id: uuid.UUID,
        exchange_default: str = "UNKNOWN",
    ) -> int:
        """Insert rows into equity_prices. ReplacingMergeTree(version) will dedupe on merges.
        Assumes df columns: ts, open, high, low, close, volume, symbol, [optional adjusted_close]
        """
        if df is None or df.empty:
            logger.info("upsert_ohlcv empty df, nothing to insert")
            return 0

        # prepare rows as tuples in target column order; let version/created_at default
        if "adjusted_close" not in df.columns:
            df = df.assign(adjusted_close=pd.Series([None] * len(df)))

        df = df.rename(columns={"ts": "timestamp"})
        df = df[["symbol", "timestamp", "open", "high", "low", "close", "volume", "adjusted_close"]]

        # build payload
        rows: List[tuple] = []
        ingest_ts = datetime.utcnow()
        run_id_str = str(ingest_run_id)

        for r in df.itertuples(index=False):
            rows.append((
                r.symbol,
                exchange_default,    # exchange
                interval,            # interval Enum value as string, e.g. '1d'
                r.timestamp,         # DateTime64(3) compatible; pandas ts -> python datetime
                float(r.open),
                float(r.high),
                float(r.low),
                float(r.close),
                int(r.volume),
                None if r.adjusted_close is None or pd.isna(r.adjusted_close) else float(r.adjusted_close),
                ingest_ts,
                run_id_str,
                source
            ))

        # column order must match INSERT list
        insert_sql = f"""
            INSERT INTO {table}
            (symbol, exchange, interval, timestamp, open, high, low, close, volume, adjusted_close, ingest_ts, ingest_run_id, source)
            VALUES
        """

        # settings
        settings = {}
        if self.async_insert:
            settings["async_insert"] = 1
        if self.wait_async:
            settings["wait_for_async_insert"] = 1

        # batch insert
        inserted = 0
        for i in range(0, len(rows), self.batch_size):
            batch = rows[i:i+self.batch_size]
            self.client.insert(
                table=table,
                data=batch,
                column_names=["symbol","exchange","interval","timestamp","open","high","low","close","volume","adjusted_close","ingest_ts","ingest_run_id","source"],
                settings=settings
            )
            inserted += len(batch)
            logger.info(f"upsert_ohlcv inserted batch {i}-{i+len(batch)-1} rows={len(batch)}")

        logger.info(f"upsert_ohlcv total_inserted={inserted}")
        return inserted
