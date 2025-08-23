import argparse
from datetime import datetime
import pandas as pd

from etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from etl.transforms.ohlcv_mapper import map_to_clickhouse
from etl.transforms.validators import validate_ohlcv
from etl.utils.env import load_clickhouse_env
from etl.utils.logging import init_logging
from etl.io.clickhouse_client import ClickHouseClient

def main():
    init_logging()
    parser = argparse.ArgumentParser(description="Backfill OHLCV (SKELETON)")
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--start", required=True, help="YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="YYYY-MM-DD")
    parser.add_argument("--interval", default="1d")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print summary only, no DB writes")
    args = parser.parse_args()

    print(f"[backfill] args={args}")

    cfg = load_clickhouse_env()
    ch = ClickHouseClient(**{k: cfg[k] for k in ["host","port","user","password","database"]})

    adapter = YahooFinanceAdapter()
    start = datetime.fromisoformat(args.start)
    end = datetime.fromisoformat(args.end)

    df = adapter.fetch_ohlcv(args.symbol, start, end, args.interval)
    validate_ohlcv(df)
    df = map_to_clickhouse(df)

    if args.dry_run:
        from etl.utils.summary import print_ohlcv_summary
        print_ohlcv_summary(df, args.symbol)
        return

    rows = ch.upsert_ohlcv(df, cfg["table"])
    print(f"[backfill] done symbol={args.symbol} rows_upserted={rows}")

if __name__ == "__main__":
    main()
