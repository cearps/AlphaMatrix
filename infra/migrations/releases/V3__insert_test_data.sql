-- Test Data for AlphaMatrix Backtesting System
-- Migration V3: Insert sample data for development and testing
-- WARNING: This data is for testing only and should be removed before production

-- Insert sample equity price data (using future dates to avoid conflicts)
INSERT INTO alpha.equity_prices (symbol, exchange, timestamp, open, high, low, close, volume, adjusted_close)
VALUES 
    ('TEST_AAPL', 'NASDAQ', '2025-01-02 09:30:00', 185.50, 186.20, 184.80, 185.90, 50000000, 185.90),
    ('TEST_MSFT', 'NASDAQ', '2025-01-02 09:30:00', 375.00, 376.50, 374.20, 375.80, 30000000, 375.80),
    ('TEST_GOOGL', 'NASDAQ', '2025-01-02 09:30:00', 140.25, 141.10, 139.80, 140.95, 25000000, 140.95);

-- Insert sample corporate actions (using TEST_ prefix)
INSERT INTO alpha.corporate_actions (symbol, action_type, action_date, ex_date, amount, ratio, description)
VALUES 
    ('TEST_AAPL', 'dividend', '2025-02-15', '2025-02-12', 0.24, NULL, 'TEST: Quarterly dividend payment'),
    ('TEST_TSLA', 'split', '2025-08-25', '2025-08-24', NULL, '3:1', 'TEST: 3:1 stock split');

-- Insert sample index data (using TEST_ prefix)
INSERT INTO alpha.index_data (index_symbol, timestamp, open, high, low, close, volume)
VALUES 
    ('TEST_SPY', '2025-01-02 09:30:00', 470.50, 471.20, 469.80, 470.90, 100000000),
    ('TEST_QQQ', '2025-01-02 09:30:00', 405.00, 406.50, 404.20, 405.80, 80000000);

-- Insert sample fundamental data (using TEST_ prefix)
INSERT INTO alpha.fundamentals (symbol, report_date, market_cap, shares_outstanding, revenue, eps, pe_ratio, book_value, debt_to_equity, sector, industry)
VALUES 
    ('TEST_AAPL', '2024-12-31', 3000000000000, 15700000000, 394328000000, 6.16, 30.18, 4.26, 1.45, 'Technology', 'Consumer Electronics'),
    ('TEST_MSFT', '2024-12-31', 2800000000000, 7500000000, 211915000000, 9.81, 38.31, 15.67, 0.89, 'Technology', 'Software');

-- Insert sample economic data
INSERT INTO alpha.economic_data (indicator_name, timestamp, value, unit, source)
VALUES 
    ('TEST_FED_FUNDS_RATE', '2025-01-02 00:00:00', 5.25, 'percent', 'TEST_FRED'),
    ('TEST_CPI_YOY', '2025-01-02 00:00:00', 3.1, 'percent', 'TEST_BLS'); 