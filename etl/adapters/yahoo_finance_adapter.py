from datetime import datetime
import pandas as pd
import yfinance as yf
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from .base_adapter import DataSourceAdapter

_INTERVALS = {
    "1m":"1m","2m":"2m","5m":"5m","15m":"15m","30m":"30m","60m":"60m","90m":"90m",
    "1h":"60m","1d":"1d","5d":"5d","1wk":"1wk","1mo":"1mo"
}

class YahooFinanceAdapter(DataSourceAdapter):
    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        retry=retry_if_exception_type(Exception),
    )
    def fetch_ohlcv(self, symbol: str, start: datetime, end: datetime, interval: str) -> pd.DataFrame:
        if interval not in _INTERVALS:
            raise ValueError(f"Unsupported interval: {interval}")
        yf_interval = _INTERVALS[interval]

        print(f"[YahooFinanceAdapter] downloading {symbol} {start}→{end} interval={interval} (yf={yf_interval})")

        df = yf.download(
            tickers=symbol,
            start=start,
            end=end,
            interval=yf_interval,
            auto_adjust=False,
            progress=False,
            threads=False
        )

        if df is None or df.empty:
            print(f"[YahooFinanceAdapter] no data returned for {symbol}")
            return pd.DataFrame(columns=["ts","open","high","low","close","volume","symbol"])

        # Handle MultiIndex columns from yfinance
        if isinstance(df.columns, pd.MultiIndex):
            print(f"[YahooFinanceAdapter] handling MultiIndex columns: {df.columns}")
            # Flatten the MultiIndex columns
            df.columns = df.columns.get_level_values(0)
        
        df = df.rename(columns={"Open":"open","High":"high","Low":"low","Close":"close","Volume":"volume"})
        df = df[["open","high","low","close","volume"]]

        ts = pd.to_datetime(df.index, utc=True).tz_convert("UTC").tz_localize(None)
        df = df.copy()
        df.insert(0, "ts", ts)
        df["symbol"] = symbol

        # Ensure we have the correct column order
        df = df[["ts","open","high","low","close","volume","symbol"]]
        
        # Only process if we have data
        if len(df) > 0:
            print(f"[YahooFinanceAdapter] processing {len(df)} rows, columns: {list(df.columns)}")
            # Check if required columns exist
            required_cols = ["symbol", "ts"]
            if not all(col in df.columns for col in required_cols):
                print(f"[YahooFinanceAdapter] missing required columns: {required_cols}")
                return pd.DataFrame(columns=["ts","open","high","low","close","volume","symbol"])
            
            df = df.sort_values("ts").drop_duplicates(subset=["symbol","ts"])
            df = df[df["volume"].notna() & (df["volume"] >= 0)]
            print(f"[YahooFinanceAdapter] after cleanup: {len(df)} rows")
        else:
            print(f"[YahooFinanceAdapter] no data to process")

        return df.reset_index(drop=True)
