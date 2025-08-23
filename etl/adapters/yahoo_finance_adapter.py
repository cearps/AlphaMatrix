from datetime import datetime
import pandas as pd
from .base_adapter import DataSourceAdapter

class YahooFinanceAdapter(DataSourceAdapter):
    def fetch_ohlcv(self, symbol: str, start: datetime, end: datetime, interval: str) -> pd.DataFrame:
        print(f"[YahooFinanceAdapter] fetch_ohlcv(symbol={symbol}, start={start}, end={end}, interval={interval})")
        # TODO: implement actual Yahoo pull (yfinance or direct)
        # For now return an empty DataFrame with the expected columns.
        return pd.DataFrame(columns=["ts","open","high","low","close","volume","symbol"])
