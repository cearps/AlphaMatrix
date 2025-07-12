CREATE DATABASE IF NOT EXISTS alpha;

CREATE TABLE IF NOT EXISTS alpha.option_chain_raw
(
    ts                DateTime,
    underlying        LowCardinality(String),
    expiry            Date,
    strike            Float64,
    option_type       Enum8('C' = 1, 'P' = 2),
    bid              Decimal32(4),
    ask              Decimal32(4),
    iv               Nullable(Float32),
    greeks           JSON,                -- raw JSON blob for deltas, vegas, etc.
    provider         LowCardinality(String),
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(expiry)
ORDER BY (underlying, expiry, strike, option_type)
TTL ts + INTERVAL 18 MONTH DELETE
SETTINGS index_granularity = 8192;
