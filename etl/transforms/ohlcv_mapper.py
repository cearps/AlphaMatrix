import pandas as pd

REQUIRED_COLS = ["ts","open","high","low","close","volume","symbol"]

def map_yfinance_to_ohlcv(df: pd.DataFrame, symbol: str) -> pd.DataFrame:
    """
    Accepts a raw yfinance DataFrame (index=datetimes, columns include Open/High/Low/Close/Volume[, Adj Close]).
    Returns normalized df with columns REQUIRED_COLS + optional adjusted_close, UTC-naive ts, sorted & deduped.
    """
    if df is None or df.empty:
        return pd.DataFrame(columns=REQUIRED_COLS + ["adjusted_close"])

    # Handle MultiIndex columns from yfinance
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    out = df.rename(columns={
        "Open":"open","High":"high","Low":"low","Close":"close","Volume":"volume","Adj Close":"adjusted_close"
    }).copy()

    # Ensure required numeric cols exist
    for c in ["open","high","low","close","volume"]:
        if c not in out.columns:
            out[c] = pd.Series(dtype="float64")

    # Index -> UTC naive 'ts'
    idx = pd.to_datetime(out.index, utc=True)
    out.insert(0, "ts", idx.tz_convert("UTC").tz_localize(None))

    # Optional adjusted_close
    if "adjusted_close" not in out.columns:
        out["adjusted_close"] = None

    out["symbol"] = symbol

    # Order, sort, dedupe
    cols = ["ts","open","high","low","close","volume","symbol","adjusted_close"]
    out = out[cols]
    out = out.sort_values("ts").drop_duplicates(subset=["symbol","ts"]).reset_index(drop=True)

    return out
