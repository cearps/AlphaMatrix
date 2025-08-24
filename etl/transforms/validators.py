import pandas as pd

def validate_ohlcv_schema(df: pd.DataFrame):
    required = {"ts","open","high","low","close","volume","symbol"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

def validate_ohlcv_values(df: pd.DataFrame):
    if df.empty:
        return
    # non-negatives
    if (df[["open","high","low","close","volume"]] < 0).any().any():
        raise ValueError("Negative values found in price/volume columns")
    # high/low guards (tolerate NaNs already filtered upstream)
    bad_hi = df[(df["high"] < df[["open","close"]].max(axis=1))]
    bad_lo = df[(df["low"]  > df[["open","close"]].min(axis=1))]
    if len(bad_hi) or len(bad_lo):
        raise ValueError("High/Low bounds violated")

def validate_no_dups(df: pd.DataFrame):
    dups = df.duplicated(subset=["symbol","ts"]).sum()
    if dups:
        raise ValueError(f"Duplicate (symbol, ts) keys found: {dups}")

def validate_ohlcv(df: pd.DataFrame):
    validate_ohlcv_schema(df)
    validate_ohlcv_values(df)
    validate_no_dups(df)
