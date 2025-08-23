import os
from typing import Optional
import pandas as pd

class ClickHouseClient:
    def __init__(self, host: str, port: int, user: str, password: str, database: str):
        print(f"[ClickHouseClient.__init__] host={host}, port={port}, db={database} (user only for auth)")
        # TODO: wire up actual clickhouse-connect client later

    def healthcheck(self) -> bool:
        print("[ClickHouseClient.healthcheck] SKELETON true")
        return True

    def latest_timestamp(self, symbol: str, table: str) -> Optional[str]:
        print(f"[ClickHouseClient.latest_timestamp] symbol={symbol} table={table} SKELETON None")
        # TODO: query ClickHouse for latest ts
        return None

    def upsert_ohlcv(self, df: pd.DataFrame, table: str) -> int:
        print(f"[ClickHouseClient.upsert_ohlcv] table={table}, rows={len(df)} SKELETON no-op")
        # TODO: implement columnar insert / dedupe
        return len(df)
