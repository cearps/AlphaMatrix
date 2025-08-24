import pandas as pd
import pytest
from datetime import datetime
from etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter

@pytest.mark.unit
def test_yahoo_adapter_calls_yfinance(monkeypatch, sample_ohlcv_df_daily):
    calls = {}
    def fake_download(tickers, start, end, interval, auto_adjust, progress, threads):
        calls["args"] = (tickers, start, end, interval)
        return sample_ohlcv_df_daily

    import yfinance as yf
    monkeypatch.setattr(yf, "download", fake_download)

    ad = YahooFinanceAdapter()
    df = ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), "1d")
    assert isinstance(df, pd.DataFrame)
    assert "AAPL" in calls["args"][0]

@pytest.mark.unit
def test_yahoo_adapter_handles_none_response(monkeypatch):
    def fake_download(tickers, start, end, interval, auto_adjust, progress, threads):
        return None

    import yfinance as yf
    monkeypatch.setattr(yf, "download", fake_download)

    ad = YahooFinanceAdapter()
    df = ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), "1d")
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 0

@pytest.mark.unit
def test_yahoo_adapter_handles_empty_response(monkeypatch):
    def fake_download(tickers, start, end, interval, auto_adjust, progress, threads):
        return pd.DataFrame()

    import yfinance as yf
    monkeypatch.setattr(yf, "download", fake_download)

    ad = YahooFinanceAdapter()
    df = ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), "1d")
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 0

@pytest.mark.unit
def test_yahoo_adapter_validates_interval():
    ad = YahooFinanceAdapter()
    with pytest.raises(ValueError, match="Unsupported interval"):
        ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), "invalid")

@pytest.mark.unit
def test_yahoo_adapter_supported_intervals():
    ad = YahooFinanceAdapter()
    # Test that supported intervals don't raise errors (with stubbed download)
    supported_intervals = ["1d", "1h", "5m", "1wk"]
    
    def fake_download(tickers, start, end, interval, auto_adjust, progress, threads):
        return pd.DataFrame()
    
    import yfinance as yf
    from unittest.mock import patch
    with patch.object(yf, 'download', fake_download):
        for interval in supported_intervals:
            df = ad.fetch_ohlcv("AAPL", datetime(2024,1,1), datetime(2024,1,10), interval)
            assert isinstance(df, pd.DataFrame)
