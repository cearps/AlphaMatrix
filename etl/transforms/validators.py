import pandas as pd

def validate_ohlcv(df: pd.DataFrame) -> None:
    print(f"[validate_ohlcv] rows={len(df)} SKELETON no validation")
    # TODO: add monotonic time, bounds, duplicates checks
