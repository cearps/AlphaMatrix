import yfinance as yf
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from datetime import datetime
import pandas as pd
from alphamatrix.etl.utils.logging import get_logger
from .base_adapter import DataSourceAdapter

logger = get_logger(__name__)

_INTERVALS = {
    "1m":"1m","2m":"2m","5m":"5m","15m":"15m","30m":"30m","60m":"60m","90m":"90m",
    "1h":"60m","1d":"1d","5d":"5d","1wk":"1wk","1mo":"1mo"
}

class YahooFinanceAdapter(DataSourceAdapter):
    @retry(reraise=True, stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
           retry=retry_if_exception_type(Exception))
    def fetch_ohlcv(self, symbol: str, start: datetime, end: datetime, interval: str) -> pd.DataFrame:
        if interval not in _INTERVALS:
            raise ValueError(f"Unsupported interval: {interval}")
        yf_interval = _INTERVALS[interval]
        logger.info(f"Downloading {symbol} {start}->{end} interval={interval} (yf={yf_interval})")

        df = yf.download(
            tickers=symbol,
            start=start,
            end=end,
            interval=yf_interval,
            auto_adjust=False,
            progress=False,
            threads=False
        )
        logger.info(f"Downloaded rows={0 if df is None else len(df)} for {symbol}")
        return df if df is not None else pd.DataFrame()
