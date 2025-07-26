-- AlphaMatrix Backtesting System Database Schema
-- Migration V2: Create core tables for backtesting data

-- Ensure database exists
CREATE DATABASE IF NOT EXISTS alpha;

-- 1. Main Price Data Table
CREATE TABLE IF NOT EXISTS alpha.equity_prices
(
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
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (symbol, timestamp)
TTL timestamp + INTERVAL 10 YEAR;

-- 2. Corporate Actions Table
CREATE TABLE IF NOT EXISTS alpha.corporate_actions
(
    symbol String,
    action_type Enum8('dividend' = 1, 'split' = 2, 'merger' = 3, 'symbol_change' = 4),
    action_date Date,
    ex_date Date,
    amount Decimal64(4),
    ratio String,
    description String,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(action_date)
ORDER BY (symbol, action_date);

-- 3. Fundamental Data Table
CREATE TABLE IF NOT EXISTS alpha.fundamentals
(
    symbol String,
    report_date Date,
    market_cap UInt64,
    shares_outstanding UInt64,
    revenue UInt64,
    eps Decimal64(4),
    pe_ratio Decimal64(4),
    book_value Decimal64(4),
    debt_to_equity Decimal64(4),
    sector String,
    industry String,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(report_date)
ORDER BY (symbol, report_date);

-- 4. Index Data Table
CREATE TABLE IF NOT EXISTS alpha.index_data
(
    index_symbol String,
    timestamp DateTime64(3),
    open Decimal64(4),
    high Decimal64(4),
    low Decimal64(4),
    close Decimal64(4),
    volume UInt64,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (index_symbol, timestamp);

-- 5. Economic Data Table
CREATE TABLE IF NOT EXISTS alpha.economic_data
(
    indicator_name String,
    timestamp DateTime64(3),
    value Decimal64(4),
    unit String,
    source String,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (indicator_name, timestamp);

-- 6. Data Quality Log Table
CREATE TABLE IF NOT EXISTS alpha.data_quality_log
(
    table_name String,
    check_date Date,
    total_rows UInt64,
    missing_data_count UInt64,
    invalid_data_count UInt64,
    data_source String,
    created_at DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(check_date)
ORDER BY (table_name, check_date);

-- Create indexes for better query performance
-- Note: ClickHouse automatically creates indexes based on ORDER BY clause 