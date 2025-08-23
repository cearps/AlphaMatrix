import pandas as pd

def map_to_clickhouse(df: pd.DataFrame) -> pd.DataFrame:
    print(f"[map_to_clickhouse] input rows={len(df)} SKELETON passthrough")
    # TODO: enforce schema, coerce dtypes, add missing columns
    return df
