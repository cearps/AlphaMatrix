#!/usr/bin/env python3
"""
Basic functionality test for AlphaMatrix.
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_common_functions():
    """Test common utility functions."""
    print("Testing common utility functions...")
    
    try:
        from alphamatrix.common.logging import get_logger, init_logging
        from alphamatrix.common.env import clickhouse_config, api_config
        from alphamatrix.common.ids import new_run_id
        
        # Test logging
        logger = get_logger(__name__)
        logger.info("Logging test successful")
        
        # Test environment config
        ch_config = clickhouse_config()
        api_config_result = api_config()
        
        print(f"✅ ClickHouse config: {ch_config['host']}:{ch_config['port']}")
        print(f"✅ API config: max_rows={api_config_result['max_rows']}")
        
        # Test ID generation
        run_id = new_run_id()
        print(f"✅ Generated run ID: {run_id}")
        
        return True
    except Exception as e:
        print(f"❌ Common functions test failed: {e}")
        return False

def test_api_imports():
    """Test API imports."""
    print("\nTesting API imports...")
    
    try:
        from alphamatrix.api.app import app
        from alphamatrix.api.config import load_config
        
        # Test app import
        print(f"✅ FastAPI app imported: {type(app)}")
        
        # Test config loading
        config = load_config()
        print(f"✅ Config loaded: {len(config)} items")
        
        return True
    except Exception as e:
        print(f"❌ API imports test failed: {e}")
        return False

def test_etl_imports():
    """Test ETL imports."""
    print("\nTesting ETL imports...")
    
    try:
        from alphamatrix.etl.jobs.backfill_ohlcv import main as backfill_main
        from alphamatrix.etl.jobs.incremental_ohlcv import main as incremental_main
        from alphamatrix.etl.adapters.yahoo_finance_adapter import YahooFinanceAdapter
        from alphamatrix.etl.io.clickhouse_client import ClickHouseClient
        
        print("✅ ETL job modules imported")
        print("✅ ETL adapters imported")
        print("✅ ETL IO modules imported")
        
        return True
    except Exception as e:
        print(f"❌ ETL imports test failed: {e}")
        return False

def test_test_imports():
    """Test test module imports."""
    print("\nTesting test module imports...")
    
    try:
        import alphamatrix.api.tests
        import alphamatrix.etl.tests
        
        print("✅ API tests package imported")
        print("✅ ETL tests package imported")
        
        # Test specific test modules
        from alphamatrix.api.tests.test_app_import import test_imports_ok
        from alphamatrix.etl.tests.test_imports import test_etl_imports
        
        print("✅ Test functions imported")
        
        return True
    except Exception as e:
        print(f"❌ Test imports test failed: {e}")
        return False

def main():
    print("AlphaMatrix Basic Functionality Test")
    print("=" * 50)
    
    tests = [
        test_common_functions,
        test_api_imports,
        test_etl_imports,
        test_test_imports,
    ]
    
    success_count = 0
    total_count = len(tests)
    
    for test_func in tests:
        if test_func():
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"Results: {success_count}/{total_count} tests passed")
    
    if success_count == total_count:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
