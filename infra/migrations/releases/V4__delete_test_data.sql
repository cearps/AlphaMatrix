-- Delete test data for AlphaMatrix Backtesting System
-- Delete test data from equity_prices table
DELETE FROM alpha.equity_prices WHERE symbol LIKE 'TEST_%';

-- Delete test data from corporate_actions table
DELETE FROM alpha.corporate_actions WHERE symbol LIKE 'TEST_%';

-- Delete test data from index_data table
DELETE FROM alpha.index_data WHERE index_symbol LIKE 'TEST_%';

-- Delete test data from fundamentals table
DELETE FROM alpha.fundamentals WHERE symbol LIKE 'TEST_%';

-- Delete test data from economic_data table
DELETE FROM alpha.economic_data WHERE indicator_name LIKE 'TEST_%';
