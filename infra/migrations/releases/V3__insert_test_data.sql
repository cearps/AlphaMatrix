-- Test Data for AlphaMatrix Backtesting System
-- Migration V4: Insert sample data for development and testing
-- WARNING: This data is for testing only and should be removed before production

USE alpha;

---------------------------------------------
-- 1) EQUITY PRICES (sample AAPL + MSFT daily bars)
---------------------------------------------
INSERT INTO equity_prices
(symbol, exchange, interval, timestamp, open, high, low, close, volume, adjusted_close, source)
VALUES
('AAPL','NASDAQ','1d','2024-01-02 00:00:00',189.95,190.60,187.20,189.20,80235000,189.20,'yahoo'),
('AAPL','NASDAQ','1d','2024-01-03 00:00:00',189.25,191.90,188.40,190.80,74211000,190.80,'yahoo'),
('MSFT','NASDAQ','1d','2024-01-02 00:00:00',374.10,377.50,373.20,376.20,25644000,376.20,'yahoo'),
('MSFT','NASDAQ','1d','2024-01-03 00:00:00',376.25,378.00,374.70,375.10,22987000,375.10,'yahoo');

---------------------------------------------
-- 2) CORPORATE ACTIONS (sample dividend + split)
---------------------------------------------
INSERT INTO corporate_actions
(symbol, action_type, action_date, ex_date, amount, split_num, split_den, raw_ratio, description, source)
VALUES
('AAPL','dividend','2024-02-15','2024-02-14',0.24,NULL,NULL,NULL,'Quarterly dividend','yahoo'),
('TSLA','split','2020-08-31','2020-08-28',NULL,5,1,'5-for-1','Tesla 5-for-1 stock split','yahoo');

---------------------------------------------
-- 3) FUNDAMENTALS (sample quarterly reports)
---------------------------------------------
INSERT INTO fundamentals
(symbol, report_date, market_cap, shares_outstanding, revenue, eps, pe_ratio, book_value, debt_to_equity, sector, industry, source)
VALUES
('AAPL','2023-12-31',3000000000000,15600000000,119000000000,2.15,28.5,3.75,1.6,'Technology','Consumer Electronics','yahoo'),
('MSFT','2023-12-31',2800000000000,7450000000,62000000000,2.95,34.2,20.1,0.9,'Technology','Software Infrastructure','yahoo');

---------------------------------------------
-- 4) INDEX DATA (sample S&P 500 daily bars)
---------------------------------------------
INSERT INTO index_data
(index_symbol, timestamp, open, high, low, close, volume, source)
VALUES
('^GSPC','2024-01-02 00:00:00',4770.25,4795.10,4745.60,4780.20,3200000000,'yahoo'),
('^GSPC','2024-01-03 00:00:00',4780.50,4802.75,4758.90,4762.35,2950000000,'yahoo');

---------------------------------------------
-- 5) ECONOMIC DATA (sample CPI + GDP)
---------------------------------------------
INSERT INTO economic_data
(indicator_name, timestamp, value, unit, source)
VALUES
('US_CPI','2023-12-01 00:00:00',304.20,'Index (1982-84=100)','FRED'),
('US_GDP','2023-10-01 00:00:00',26950.50,'USD Billions','BEA');

---------------------------------------------
-- 6) DATA QUALITY LOG (sample entry)
---------------------------------------------
INSERT INTO data_quality_log
(table_name, check_date, total_rows, missing_data_count, invalid_data_count, data_source)
VALUES
('equity_prices','2024-01-03',4,0,0,'yahoo'),
('fundamentals','2023-12-31',2,0,0,'yahoo');
