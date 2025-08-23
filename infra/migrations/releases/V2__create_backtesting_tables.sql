-- AlphaMatrix Migration V2: Fresh schema with idempotent upserts + lineage
-- This will DROP old tables if they exist. Use only if no data needs preserving.

CREATE DATABASE IF NOT EXISTS alpha;

---------------------------------------------
-- 1) EQUITY PRICES
---------------------------------------------
DROP TABLE IF EXISTS alpha.equity_prices;

CREATE TABLE alpha.equity_prices
(
    symbol LowCardinality(String),
    exchange LowCardinality(String),
    interval Enum8('1m'=1,'5m'=2,'15m'=3,'30m'=4,'1h'=5,'1d'=6,'1wk'=7,'1mo'=8),

    timestamp DateTime64(3, 'UTC'),

    open Decimal64(6),
    high Decimal64(6),
    low  Decimal64(6),
    close Decimal64(6),
    volume UInt64,
    adjusted_close Nullable(Decimal64(6)),

    -- Idempotency / lineage
    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),
    source LowCardinality(String) DEFAULT 'yahoo',

    created_at DateTime64(3, 'UTC') DEFAULT now64(3),

    CONSTRAINT ch_price_bounds CHECK (high >= greatest(open, close) AND low <= least(open, close)),
    CONSTRAINT ch_vol_nonneg CHECK (volume >= 0)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (symbol, interval, timestamp)
TTL timestamp + INTERVAL 10 YEAR;


---------------------------------------------
-- 2) CORPORATE ACTIONS
---------------------------------------------
DROP TABLE IF EXISTS alpha.corporate_actions;

CREATE TABLE alpha.corporate_actions
(
    symbol LowCardinality(String),
    action_type Enum8('dividend'=1, 'split'=2, 'merger'=3, 'symbol_change'=4),

    action_date Date,
    ex_date Nullable(Date),

    -- dividends
    amount Nullable(Decimal64(6)),

    -- splits (2-for-1 => split_num=2, split_den=1)
    split_num Nullable(UInt16),
    split_den Nullable(UInt16),

    raw_ratio Nullable(String),
    description String,

    -- lineage / idempotency
    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),
    source LowCardinality(String) DEFAULT 'yahoo',

    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(action_date)
ORDER BY (symbol, action_date);


---------------------------------------------
-- 3) FUNDAMENTALS
---------------------------------------------
DROP TABLE IF EXISTS alpha.fundamentals;

CREATE TABLE alpha.fundamentals
(
    symbol LowCardinality(String),
    report_date Date,

    market_cap UInt64,
    shares_outstanding UInt64,
    revenue UInt64,
    eps Nullable(Decimal64(6)),
    pe_ratio Nullable(Decimal64(6)),
    book_value Nullable(Decimal64(6)),
    debt_to_equity Nullable(Decimal64(6)),
    sector LowCardinality(String),
    industry LowCardinality(String),

    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),
    source LowCardinality(String) DEFAULT 'unknown',

    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(report_date)
ORDER BY (symbol, report_date);


---------------------------------------------
-- 4) INDEX DATA
---------------------------------------------
DROP TABLE IF EXISTS alpha.index_data;

CREATE TABLE alpha.index_data
(
    index_symbol LowCardinality(String),
    timestamp DateTime64(3, 'UTC'),

    open Decimal64(6),
    high Decimal64(6),
    low  Decimal64(6),
    close Decimal64(6),
    volume UInt64,

    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),
    source LowCardinality(String) DEFAULT 'yahoo',

    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (index_symbol, timestamp);


---------------------------------------------
-- 5) ECONOMIC DATA
---------------------------------------------
DROP TABLE IF EXISTS alpha.economic_data;

CREATE TABLE alpha.economic_data
(
    indicator_name LowCardinality(String),
    timestamp DateTime64(3, 'UTC'),
    value Decimal64(6),
    unit LowCardinality(String),
    source LowCardinality(String),

    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),

    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (indicator_name, timestamp);


---------------------------------------------
-- 6) DATA QUALITY LOG
---------------------------------------------
DROP TABLE IF EXISTS alpha.data_quality_log;

CREATE TABLE alpha.data_quality_log
(
    table_name LowCardinality(String),
    check_date Date,
    total_rows UInt64,
    missing_data_count UInt64,
    invalid_data_count UInt64,
    data_source LowCardinality(String),

    version UInt64 DEFAULT toUInt64(toUnixTimestamp64Milli(now64(3))),
    ingest_ts DateTime64(3, 'UTC') DEFAULT now64(3),
    ingest_run_id UUID DEFAULT generateUUIDv4(),

    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(version)
PARTITION BY toYYYYMM(check_date)
ORDER BY (table_name, check_date);
