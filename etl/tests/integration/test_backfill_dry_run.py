import pytest
from datetime import datetime
from etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv
from etl.transforms.validators import validate_ohlcv

@pytest.mark.integration
def test_extract_map_validate_dry_run(monkeypatch, sample_ohlcv_df_daily):
    def fake_download(*a, **k): 
        return sample_ohlcv_df_daily
    
    import yfinance as yf
    monkeypatch.setattr(yf, "download", fake_download)

    ad = YahooFinanceAdapter()
    raw = ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), "1d")
    df = map_yfinance_to_ohlcv(raw, "AAPL")
    validate_ohlcv(df)

    assert len(df) == len(sample_ohlcv_df_daily)
    assert {"ts","open","high","low","close","volume","symbol","adjusted_close"} <= set(df.columns)

@pytest.mark.integration
def test_full_pipeline_with_intraday_data(monkeypatch, sample_ohlcv_df_intraday):
    def fake_download(*a, **k): 
        return sample_ohlcv_df_intraday
    
    import yfinance as yf
    monkeypatch.setattr(yf, "download", fake_download)

    ad = YahooFinanceAdapter()
    raw = ad.fetch_ohlcv("MSFT", datetime(2024,2,1), datetime(2024,2,2), "1h")
    df = map_yfinance_to_ohlcv(raw, "MSFT")
    validate_ohlcv(df)

    assert len(df) == len(sample_ohlcv_df_intraday)
    assert df["symbol"].iloc[0] == "MSFT"
    assert "adjusted_close" in df.columns
    assert df["adjusted_close"].isna().all()  # intraday data doesn't have adj close
