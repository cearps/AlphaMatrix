from datetime import datetime
from typing import Protocol
import pandas as pd

class DataSourceAdapter(Protocol):
    def fetch_ohlcv(self, symbol: str, start: datetime, end: datetime, interval: str) -> pd.DataFrame:
        """Return df with columns: [ts, open, high, low, close, volume, symbol]. UTC timestamps. No dups.
        SKELETON: do not implement. Just print and return empty DataFrame."""
        ...
