import argparse
from datetime import datetime, timedelta

from etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from etl.transforms.ohlcv_mapper import map_to_clickhouse
from etl.transforms.validators import validate_ohlcv
from etl.utils.env import load_clickhouse_env
from etl.utils.logging import init_logging
from etl.io.clickhouse_client import ClickHouseClient

def main():
    init_logging()
    parser = argparse.ArgumentParser(description="Incremental OHLCV (SKELETON)")
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--interval", default="1d")
    parser.add_argument("--lookback-days", type=int, default=7, help="fallback if no watermark in DB")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print summary only, no DB writes")
    args = parser.parse_args()
    print(f"[incremental] args={args}")

    cfg = load_clickhouse_env()
    ch = ClickHouseClient(**{k: cfg[k] for k in ["host","port","user","password","database"]})

    last_ts = ch.latest_timestamp(args.symbol, cfg["table"])
    if last_ts is None:
        start = datetime.utcnow() - timedelta(days=args.lookback_days)
        print(f"[incremental] no watermark; using start={start.isoformat()}")
    else:
        start = datetime.fromisoformat(last_ts)
        print(f"[incremental] watermark found; start={start.isoformat()}")

    end = datetime.utcnow()

    adapter = YahooFinanceAdapter()
    df = adapter.fetch_ohlcv(args.symbol, start, end, args.interval)
    validate_ohlcv(df)
    df = map_to_clickhouse(df)

    if args.dry_run:
        from etl.utils.summary import print_ohlcv_summary
        print_ohlcv_summary(df, args.symbol)
        return

    rows = ch.upsert_ohlcv(df, cfg["table"])
    print(f"[incremental] done symbol={args.symbol} rows_upserted={rows}")

if __name__ == "__main__":
    main()
