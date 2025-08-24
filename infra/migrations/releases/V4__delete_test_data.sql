-- AlphaMatrix Migration V5: Delete test data inserted in V4
-- This targets ONLY the specific rows created by the test migration.

CREATE DATABASE IF NOT EXISTS alpha;

-- Enable lightweight delete for this session (safe no-op if already enabled)
SET allow_experimental_lightweight_delete = 1;

------------------------------
-- 1) EQUITY PRICES (AAPL/MSFT, 2024-01-02 and 2024-01-03, interval=1d)
------------------------------
ALTER TABLE alpha.equity_prices
    DELETE WHERE symbol IN ('AAPL','MSFT')
      AND interval = '1d'
      AND timestamp IN (
          toDateTime64('2024-01-02 00:00:00', 3, 'UTC'),
          toDateTime64('2024-01-03 00:00:00', 3, 'UTC')
      )
      AND source = 'yahoo';

------------------------------
-- 2) CORPORATE ACTIONS (AAPL dividend 2024-02-15, TSLA split 2020-08-31)
------------------------------
ALTER TABLE alpha.corporate_actions
    DELETE WHERE (symbol = 'AAPL' AND action_type = 'dividend' AND action_date = toDate('2024-02-15'))
               OR (symbol = 'TSLA' AND action_type = 'split' AND action_date = toDate('2020-08-31'));

------------------------------
-- 3) FUNDAMENTALS (AAPL/MSFT @ 2023-12-31)
------------------------------
ALTER TABLE alpha.fundamentals
    DELETE WHERE symbol IN ('AAPL','MSFT') AND report_date = toDate('2023-12-31');

------------------------------
-- 4) INDEX DATA (^GSPC, 2024-01-02 and 2024-01-03)
------------------------------
ALTER TABLE alpha.index_data
    DELETE WHERE index_symbol = '^GSPC'
      AND timestamp IN (
          toDateTime64('2024-01-02 00:00:00', 3, 'UTC'),
          toDateTime64('2024-01-03 00:00:00', 3, 'UTC')
      )
      AND source = 'yahoo';

------------------------------
-- 5) ECONOMIC DATA (US_CPI 2023-12-01, US_GDP 2023-10-01)
------------------------------
ALTER TABLE alpha.economic_data
    DELETE WHERE (indicator_name = 'US_CPI' AND timestamp = toDateTime64('2023-12-01 00:00:00', 3, 'UTC'))
               OR (indicator_name = 'US_GDP' AND timestamp = toDateTime64('2023-10-01 00:00:00', 3, 'UTC'));

------------------------------
-- 6) DATA QUALITY LOG (equity_prices 2024-01-03, fundamentals 2023-12-31)
------------------------------
ALTER TABLE alpha.data_quality_log
    DELETE WHERE (table_name = 'equity_prices' AND check_date = toDate('2024-01-03'))
               OR (table_name = 'fundamentals' AND check_date = toDate('2023-12-31'));

-- Optional verification (uncomment to check; Flyway generally expects pure DDL/DML)
-- SELECT count() FROM alpha.equity_prices WHERE symbol IN ('AAPL','MSFT') AND interval='1d'
--   AND timestamp IN (toDateTime64('2024-01-02 00:00:00',3,'UTC'), toDateTime64('2024-01-03 00:00:00',3,'UTC')) AND source='yahoo';
-- SELECT count() FROM alpha.corporate_actions WHERE (symbol='AAPL' AND action_type='dividend' AND action_date=toDate('2024-02-15'))
--   OR (symbol='TSLA' AND action_type='split' AND action_date=toDate('2020-08-31'));
-- SELECT count() FROM alpha.fundamentals WHERE symbol IN ('AAPL','MSFT') AND report_date=toDate('2023-12-31');
-- SELECT count() FROM alpha.index_data WHERE index_symbol='^GSPC' AND timestamp IN
--   (toDateTime64('2024-01-02 00:00:00',3,'UTC'), toDateTime64('2024-01-03 00:00:00',3,'UTC')) AND source='yahoo';
-- SELECT count() FROM alpha.economic_data WHERE (indicator_name='US_CPI' AND timestamp=toDateTime64('2023-12-01 00:00:00',3,'UTC'))
--   OR (indicator_name='US_GDP' AND timestamp=toDateTime64('2023-10-01 00:00:00',3,'UTC'));
-- SELECT count() FROM alpha.data_quality_log WHERE (table_name='equity_prices' AND check_date=toDate('2024-01-03'))
--   OR (table_name='fundamentals' AND check_date=toDate('2023-12-31'));
