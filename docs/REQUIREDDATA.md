# Required Data for Backtesting System

## Overview

This document outlines the raw data requirements for the AlphaMatrix backtesting system, focusing on equities data collection and storage design.

## Raw Data Requirements

### 1. Historical Price Data

#### Priority: High

#### OHLCV Data (Essential)

- **Open Price**: Opening price for each period
- **High Price**: Highest price during the period
- **Low Price**: Lowest price during the period
- **Close Price**: Closing price for each period
- **Volume**: Trading volume for the period
- **Timestamp**: Precise timestamp for each data point
- **Symbol/Ticker**: Stock identifier
- **Exchange**: Source exchange (NYSE, NASDAQ, etc.)

#### Data Frequency Options

- **Daily**: Standard for most backtesting (recommended starting point)
- **Intraday**: 1-minute, 5-minute, 15-minute bars (for more granular analysis)
- **Tick Data**: High-frequency data (consider later for advanced strategies)

### 2. Corporate Actions Data

#### Priority: Medium-High

#### Dividend Data

- Dividend amount per share
- Ex-dividend date
- Payment date
- Dividend type (regular, special, etc.)

#### Stock Splits

- Split ratio (e.g., 2:1, 3:1)
- Split date
- Adjustment factor

#### Mergers & Acquisitions

- Merger dates
- Acquisition terms
- Symbol changes

### 3. Fundamental Data

#### Priority: Medium

#### Company Information

- Company name
- Sector/Industry classification
- Market cap
- Shares outstanding
- Float (publicly traded shares)

#### Financial Metrics

- Revenue
- Earnings per share (EPS)
- Price-to-earnings ratio (P/E)
- Book value
- Debt-to-equity ratio

### 4. Market Data

#### Priority: Medium

#### Index Data

- Major indices (S&P 500, NASDAQ, DJIA)
- Sector indices
- Volatility indices (VIX)

#### Market Microstructure

- Bid/Ask spreads
- Order book depth (if available)
- Market maker activity

### 5. Economic Data

#### Priority: Low-Medium

#### Macroeconomic Indicators

- Interest rates (Fed funds rate, Treasury yields)
- Inflation data (CPI, PPI)
- GDP growth
- Unemployment rates

## Data Sources Recommendations

### Primary Sources

1. **Yahoo Finance API** - Free, good for basic OHLCV data
2. **Alpha Vantage** - Free tier available, comprehensive data
3. **IEX Cloud** - Real-time and historical data
4. **Polygon.io** - High-quality data, paid service

### Secondary Sources

1. **FRED (Federal Reserve)** - Economic data
2. **SEC EDGAR** - Fundamental data
3. **Company Investor Relations** - Corporate actions

## Database Design

### ClickHouse Schema Design

#### 1. Main Price Data Table

```sql
CREATE TABLE alpha.equity_prices
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
```

#### 2. Corporate Actions Table

```sql
CREATE TABLE alpha.corporate_actions
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
```

#### 3. Fundamental Data Table

```sql
CREATE TABLE alpha.fundamentals
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
```

#### 4. Index Data Table

```sql
CREATE TABLE alpha.index_data
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
```

### Data Ingestion Strategy

#### 1. Initial Data Load

- Start with daily OHLCV data for major indices and top 500 stocks
- Historical data: 5-10 years minimum
- Use batch ingestion for historical data

#### 2. Real-time Updates

- Implement streaming ingestion for new data
- Use ClickHouse's real-time capabilities
- Set up automated data collection scripts

#### 3. Data Quality Checks

- Implement data validation rules
- Check for missing data points
- Validate price consistency (high >= low, etc.)

### Derived Data Strategy

Since you're using ClickHouse, you can efficiently compute derived metrics in real-time:

#### 1. Technical Indicators

- Moving averages (SMA, EMA)
- RSI, MACD, Bollinger Bands
- GARCH volatility models
- Custom indicators

#### 2. Aggregations

- Rolling statistics
- Cross-sectional rankings
- Factor exposures

#### 3. Implementation

```sql
-- Example: 20-day moving average
SELECT
    symbol,
    timestamp,
    close,
    avg(close) OVER (PARTITION BY symbol ORDER BY timestamp ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) as sma_20
FROM alpha.equity_prices
WHERE symbol = 'AAPL';
```

## Data Collection Timeline

### Phase 1 (Weeks 1-2)

- Set up data sources and APIs
- Implement basic OHLCV data collection
- Create database schema
- Load historical data for top 100 stocks

### Phase 2 (Weeks 3-4)

- Add corporate actions data
- Implement data validation
- Set up automated daily updates
- Expand to top 500 stocks

### Phase 3 (Weeks 5-6)

- Add fundamental data
- Implement derived calculations
- Performance optimization
- Data quality monitoring

## Storage Considerations

### ClickHouse Optimizations

- Use appropriate data types (Decimal64 for prices)
- Implement partitioning by month
- Set up TTL for data retention
- Use compression for historical data

### Estimated Storage Requirements

- Daily OHLCV for 500 stocks, 10 years: ~50MB
- Intraday data (1-minute): ~500MB per year
- Corporate actions: ~1MB
- Fundamentals: ~10MB

## Next Steps

1. **Immediate**: Start with daily OHLCV data collection
2. **Short-term**: Implement corporate actions tracking
3. **Medium-term**: Add fundamental data and derived calculations
4. **Long-term**: Consider high-frequency data and derivatives

## Notes

- Focus on data quality over quantity initially
- Implement proper error handling and logging
- Consider data backup and recovery strategies
- Monitor data source reliability and costs
- Plan for data source redundancy
