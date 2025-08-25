import argparse
from datetime import datetime, timedelta

from alphamatrix.etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
from alphamatrix.etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv
from alphamatrix.etl.transforms.validators import validate_ohlcv
from alphamatrix.common.env import clickhouse_config
from alphamatrix.common.logging import init_logging, get_logger
from alphamatrix.etl.io.clickhouse_client import ClickHouseClient

def main():
    init_logging()
    logger = get_logger(__name__)
    parser = argparse.ArgumentParser(description="Incremental OHLCV")
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--interval", default="1d")
    parser.add_argument("--lookback-days", type=int, default=7, help="fallback if no watermark in DB")
    parser.add_argument("--exchange", default=None, help="Exchange identifier (overrides DEFAULT_EXCHANGE from .env, e.g., NASDAQ, ASX)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print summary only, no DB writes")
    args = parser.parse_args()
    logger.info(f"args={args}")

    # For dry-run mode, use lookback days directly
    if args.dry_run:
        start = datetime.utcnow() - timedelta(days=args.lookback_days)
        logger.info(f"dry-run mode; using start={start.isoformat()}")
    else:
        # Load ClickHouse client to get latest timestamp
        cfg = clickhouse_config()
        ch = ClickHouseClient(
            host=cfg["host"], port=cfg["port"], user=cfg["user"], password=cfg["password"], database=cfg["database"],
            protocol=cfg["protocol"], secure=cfg["secure"], async_insert=cfg["async_insert"],
            wait_async=cfg["wait_async"], batch_size=cfg["batch_size"]
        )
        
        last_ts = ch.latest_timestamp(args.symbol, cfg["table"], args.interval)
        if last_ts is None:
            start = datetime.utcnow() - timedelta(days=args.lookback_days)
            logger.info(f"no watermark; using start={start.isoformat()}")
        else:
            # Convert ClickHouse timestamp to datetime
            if isinstance(last_ts, str):
                start = datetime.fromisoformat(last_ts)
            else:
                start = last_ts
            
            # Check if the timestamp is too old (epoch start or very old)
            epoch_start = datetime(1970, 1, 1)
            if start <= epoch_start or start < datetime.utcnow() - timedelta(days=args.lookback_days * 2):
                start = datetime.utcnow() - timedelta(days=args.lookback_days)
                logger.info(f"watermark too old; using start={start.isoformat()}")
            else:
                logger.info(f"watermark found; start={start.isoformat()}")

    end = datetime.utcnow()

    adapter = YahooFinanceAdapter()
    raw = adapter.fetch_ohlcv(args.symbol, start, end, args.interval)
    df = map_yfinance_to_ohlcv(raw, args.symbol)
    validate_ohlcv(df)

    if args.dry_run:
        from alphamatrix.etl.utils.summary import print_ohlcv_summary
        print_ohlcv_summary(df, args.symbol)
        return

    # ClickHouse client already initialized above for non-dry-run mode
    import uuid
    run_id = uuid.uuid4()
    
    exchange = args.exchange if args.exchange else cfg["exchange_default"]
    
    inserted = ch.upsert_ohlcv(
        df=df,
        table=cfg["table"],
        interval=args.interval,
        source="yahoo",
        ingest_run_id=run_id,
        exchange_default=exchange
    )
    logger.info(f"committed rows={inserted} to {cfg['database']}.{cfg['table']} (exchange={exchange}, run_id={run_id})")

if __name__ == "__main__":
    main()
