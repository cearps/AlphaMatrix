import pandas as pd

def print_ohlcv_summary(df: pd.DataFrame, symbol: str):
    print("\n=== DRY RUN SUMMARY ===")
    print(f"symbol: {symbol}")
    print(f"rows: {len(df)}")
    if len(df) == 0:
        return
    print(f"date range: {df['ts'].min()} -> {df['ts'].max()}")

    print("\nhead(5):")
    print(df.head(5).to_string(index=False))
    print("\ntail(5):")
    print(df.tail(5).to_string(index=False))

    print("\n[describe numeric columns]")
    print(df[["open","high","low","close","volume"]].describe().to_string())

    print("\n[missing values per column]")
    print(df.isna().sum().to_string())

    dups = df.duplicated(subset=["symbol","ts"]).sum()
    print(f"\nduplicates by (symbol, ts): {dups}")

    try:
        g = df.groupby(df["ts"].dt.date)["close"].agg(["count","min","max"])
        print("\n[by-day close stats]")
        print(g.tail(7).to_string())
    except Exception as e:
        print(f"[warn] daily aggregation failed: {e}")
