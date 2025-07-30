# Yahoo Finance to ClickHouse ETL

This ETL script fetches historical OHLCV equity pricing data from Yahoo Finance and loads it into a ClickHouse database, following the schema in `docs/REQUIREDDATA.md`.

## Requirements
- Python 3.8+
- ClickHouse server (see `infra/docker-compose.yml`)

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure ClickHouse connection (optional):

Set environment variables as needed:
- `CLICKHOUSE_HOST` (default: localhost)
- `CLICKHOUSE_PORT` (default: 8123)
- `CLICKHOUSE_USER` (default: default)
- `CLICKHOUSE_PASSWORD` (default: empty)

3. Ensure the ClickHouse schema exists (see `docs/REQUIREDDATA.md`). Example for price table:

```sql
CREATE DATABASE IF NOT EXISTS alpha;

CREATE TABLE IF NOT EXISTS alpha.equity_prices (
    symbol String,
    exchange String,
    timestamp DateTime64(3),
    open Decimal64(4),
    high Decimal64(4),
    low Decimal64(4),
    close Decimal64(4),
    volume UInt64,
    adjusted_close Decimal64(4),
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (symbol, timestamp)
TTL timestamp + INTERVAL 10 YEAR;
```

## Usage

Edit the `tickers`, `exchange`, `start_date`, and `end_date` variables in `scrape_yahoo_to_clickhouse.py` as needed.

Run the ETL script:

```bash
python scrape_yahoo_to_clickhouse.py
```

## Notes
- The script uses the `yfinance` package for data collection and `clickhouse-connect` for database insertion.
- Extend the script to handle more tickers, error handling, or scheduling as needed.