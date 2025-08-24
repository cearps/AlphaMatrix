import pandas as pd
import pytest
from datetime import datetime, timezone, timedelta
from freezegun import freeze_time

@pytest.fixture
def sample_ohlcv_df_daily() -> pd.DataFrame:
    # ts as index (yfinance-style), columns Open/High/Low/Close/Volume[, Adj Close]
    idx = pd.to_datetime([
        "2024-01-02T00:00:00Z",
        "2024-01-03T00:00:00Z",
        "2024-01-04T00:00:00Z",
    ])
    df = pd.DataFrame({
        "Open":  [100.0, 101.0, 103.0],
        "High":  [102.0, 103.0, 104.0],
        "Low":   [ 99.0, 100.5, 101.0],
        "Close": [101.5, 102.7, 102.9],
        "Volume":[1000, 1500, 1100],
        "Adj Close":[101.4, 102.6, 102.8],
    }, index=idx)
    return df

@pytest.fixture
def sample_ohlcv_df_intraday() -> pd.DataFrame:
    idx = pd.to_datetime([
        "2024-02-01T10:00:00Z",
        "2024-02-01T11:00:00Z",
        "2024-02-01T12:00:00Z",
    ])
    df = pd.DataFrame({
        "Open":  [10.0, 10.5, 10.2],
        "High":  [10.7, 10.8, 10.4],
        "Low":   [ 9.9, 10.3, 10.1],
        "Close": [10.6, 10.4, 10.3],
        "Volume":[200, 220, 180],
    }, index=idx)
    return df

@pytest.fixture
def freeze_utc_now():
    with freeze_time("2024-03-01 12:00:00", tz_offset=0):
        yield

class FakeClickHouseClient:
    def __init__(self, *a, **kw):
        self.insert_calls = []
        self.health = True

    def healthcheck(self) -> bool:
        return self.health

    def latest_timestamp(self, symbol: str, table: str, interval: str | None = None):
        return None

    def upsert_ohlcv(self, df, table, interval, source, ingest_run_id, exchange_default):
        self.insert_calls.append({
            "rows": len(df),
            "table": table,
            "interval": interval,
            "source": source,
            "run_id": str(ingest_run_id),
            "exchange": exchange_default,
        })
        return len(df)

@pytest.fixture
def fake_ch_client():
    return FakeClickHouseClient()
