import pandas as pd
import pytest
from etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv, REQUIRED_COLS

@pytest.mark.unit
def test_mapper_normalizes_and_orders(sample_ohlcv_df_daily):
    out = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    assert list(out.columns)[:7] == ["ts","open","high","low","close","volume","symbol"]
    assert "adjusted_close" in out.columns
    assert out["symbol"].nunique() == 1 and out["symbol"].iloc[0] == "AAPL"
    assert pd.api.types.is_datetime64_ns_dtype(out["ts"])
    assert out["ts"].is_monotonic_increasing
    assert len(out) == 3

@pytest.mark.unit
def test_mapper_handles_missing_adj_close(sample_ohlcv_df_intraday):
    out = map_yfinance_to_ohlcv(sample_ohlcv_df_intraday, "MSFT")
    assert "adjusted_close" in out.columns
    assert out["adjusted_close"].isna().all()

@pytest.mark.unit
def test_mapper_handles_empty_df():
    empty_df = pd.DataFrame()
    out = map_yfinance_to_ohlcv(empty_df, "AAPL")
    assert list(out.columns) == REQUIRED_COLS + ["adjusted_close"]
    assert len(out) == 0

@pytest.mark.unit
def test_mapper_handles_none_df():
    out = map_yfinance_to_ohlcv(None, "AAPL")
    assert list(out.columns) == REQUIRED_COLS + ["adjusted_close"]
    assert len(out) == 0

@pytest.mark.unit
def test_mapper_handles_multiindex_columns():
    # Create a MultiIndex DataFrame like yfinance sometimes returns
    idx = pd.to_datetime(["2024-01-02T00:00:00Z"])
    multi_idx = pd.MultiIndex.from_tuples([
        ('Open', 'AAPL'), ('High', 'AAPL'), ('Low', 'AAPL'), 
        ('Close', 'AAPL'), ('Volume', 'AAPL'), ('Adj Close', 'AAPL')
    ], names=['Price', 'Ticker'])
    
    df = pd.DataFrame({
        ('Open', 'AAPL'): [100.0],
        ('High', 'AAPL'): [102.0],
        ('Low', 'AAPL'): [99.0],
        ('Close', 'AAPL'): [101.5],
        ('Volume', 'AAPL'): [1000],
        ('Adj Close', 'AAPL'): [101.4],
    }, index=idx)
    
    out = map_yfinance_to_ohlcv(df, "AAPL")
    assert list(out.columns)[:7] == ["ts","open","high","low","close","volume","symbol"]
    assert len(out) == 1
