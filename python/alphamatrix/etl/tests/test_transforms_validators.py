import pytest
import pandas as pd
from alphamatrix.etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv
from alphamatrix.etl.transforms.validators import validate_ohlcv, validate_ohlcv_schema, validate_ohlcv_values, validate_no_dups

@pytest.mark.unit
def test_validate_ok(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    validate_ohlcv(df)  # should not raise

@pytest.mark.unit
def test_validate_detects_negatives(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL").copy()
    df.loc[0, "close"] = -1.0
    with pytest.raises(ValueError, match="Negative values found"):
        validate_ohlcv(df)

@pytest.mark.unit
def test_validate_detects_bad_high_low(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL").copy()
    df.loc[0, "high"] = 0.1  # high < open/close
    with pytest.raises(ValueError, match="High/Low bounds violated"):
        validate_ohlcv(df)

@pytest.mark.unit
def test_validate_detects_missing_columns():
    df = pd.DataFrame({
        "ts": pd.to_datetime(["2024-01-01"]),
        "open": [100.0],
        "high": [102.0],
        "low": [99.0],
        "close": [101.0],
        # missing volume and symbol
    })
    with pytest.raises(ValueError, match="Missing required columns"):
        validate_ohlcv(df)

@pytest.mark.unit
def test_validate_detects_duplicates(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    # Add a duplicate row
    duplicate_row = df.iloc[0].copy()
    df = pd.concat([df, pd.DataFrame([duplicate_row])], ignore_index=True)
    
    with pytest.raises(ValueError, match="Duplicate.*keys found"):
        validate_ohlcv(df)

@pytest.mark.unit
def test_validate_empty_df():
    df = pd.DataFrame(columns=["ts","open","high","low","close","volume","symbol"])
    validate_ohlcv(df)  # should not raise for empty df

@pytest.mark.unit
def test_validate_schema_ok(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    validate_ohlcv_schema(df)  # should not raise

@pytest.mark.unit
def test_validate_values_ok(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    validate_ohlcv_values(df)  # should not raise

@pytest.mark.unit
def test_validate_no_dups_ok(sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    validate_no_dups(df)  # should not raise
