"""
Test that ETL modules can be imported successfully.
"""
import pytest

@pytest.mark.unit
def test_etl_imports():
    """Test that ETL modules can be imported."""
    import alphamatrix.etl.jobs.backfill_ohlcv as backfill
    import alphamatrix.etl.jobs.incremental_ohlcv as incremental
    import alphamatrix.etl.transforms.ohlcv_mapper as mapper
    import alphamatrix.etl.transforms.validators as validators
    import alphamatrix.etl.adapters.yahoo_finance_adapter as adapter
    import alphamatrix.etl.io.clickhouse_client as client
    
    # Test that key functions exist
    assert callable(mapper.map_yfinance_to_ohlcv)
    assert hasattr(validators, 'validate_ohlcv')
    assert hasattr(adapter, 'YahooFinanceAdapter')
    assert hasattr(client, 'ClickHouseClient')

@pytest.mark.unit
def test_common_imports():
    """Test that common modules can be imported."""
    import alphamatrix.common.logging as logging
    import alphamatrix.common.env as env
    import alphamatrix.common.ids as ids
    
    # Test that key functions exist
    assert callable(logging.get_logger)
    assert callable(logging.init_logging)
    assert callable(env.clickhouse_config)
    assert callable(env.api_config)
    assert callable(ids.new_run_id)
