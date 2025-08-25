import argparse
from datetime import datetime
import pandas as pd

from alphamatrix.etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from alphamatrix.etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv
from alphamatrix.etl.transforms.validators import validate_ohlcv
from alphamatrix.common.env import clickhouse_config
from alphamatrix.common.logging import init_logging, get_logger
from alphamatrix.etl.io.clickhouse_client import ClickHouseClient

def main():
    init_logging()
    logger = get_logger(__name__)
    parser = argparse.ArgumentParser(description="Backfill OHLCV")
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--start", required=True, help="YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="YYYY-MM-DD")
    parser.add_argument("--interval", default="1d")
    parser.add_argument("--exchange", default=None, help="Exchange identifier (overrides DEFAULT_EXCHANGE from .env, e.g., NASDAQ, ASX)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print summary only, no DB writes")
    args = parser.parse_args()

    logger.info(f"args={args}")

    adapter = YahooFinanceAdapter()
    start = datetime.fromisoformat(args.start)
    end = datetime.fromisoformat(args.end)

    raw = adapter.fetch_ohlcv(args.symbol, start, end, args.interval)
    df = map_yfinance_to_ohlcv(raw, args.symbol)
    validate_ohlcv(df)

    if args.dry_run:
        from alphamatrix.etl.utils.summary import print_ohlcv_summary
        print_ohlcv_summary(df, args.symbol)
        return

    # load env + CH client (only when not in dry-run mode)
    cfg = clickhouse_config()
    ch = ClickHouseClient(
        host=cfg["host"], port=cfg["port"], user=cfg["user"], password=cfg["password"], database=cfg["database"],
        protocol=cfg["protocol"], secure=cfg["secure"], async_insert=cfg["async_insert"],
        wait_async=cfg["wait_async"], batch_size=cfg["batch_size"]
    )

    # one run id per job execution
    import uuid
    run_id = uuid.uuid4()
    
    exchange = args.exchange if args.exchange else cfg["exchange_default"]

    inserted = ch.upsert_ohlcv(
        df=df,
        table=cfg["table"],
        interval=args.interval,            # '1d', '1h', etc.
        source="yahoo",
        ingest_run_id=run_id,
        exchange_default=exchange
    )
    logger.info(f"committed rows={inserted} to {cfg['database']}.{cfg['table']} (exchange={exchange}, run_id={run_id})")

if __name__ == "__main__":
    main()
