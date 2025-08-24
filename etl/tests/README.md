# ETL Test Suite

This directory contains the pytest test suite for the AlphaMatrix ETL system.

## Test Structure

- **Unit Tests** (`@pytest.mark.unit`): Fast, no network/DB dependencies
- **Integration Tests** (`@pytest.mark.integration`): Test component interactions (offline)
- **E2E Tests** (`@pytest.mark.e2e`): Full end-to-end tests (require services)

## Test Files

- `conftest.py` - Common fixtures and test utilities
- `test_transforms_mapper.py` - OHLCV data mapping tests
- `test_transforms_validators.py` - Data validation tests
- `test_adapters_yahoo_stubbed.py` - Yahoo Finance adapter tests (stubbed)
- `test_io_clickhouse_client_fake.py` - ClickHouse client interface tests
- `integration/test_backfill_dry_run.py` - Full pipeline integration tests

## Running Tests

### Install Test Dependencies

```bash
pip install -e ./etl[test]
```

### Run All Tests

```bash
pytest
```

### Run Unit Tests Only (CI default)

```bash
pytest -m "unit"
```

### Run Integration Tests

```bash
pytest -m "integration"
```

### Run with Coverage

```bash
pytest --cov=etl --cov-report=term-missing
```

## Test Fixtures

- `sample_ohlcv_df_daily` - Sample daily OHLCV data
- `sample_ohlcv_df_intraday` - Sample intraday OHLCV data
- `fake_ch_client` - Mock ClickHouse client
- `freeze_utc_now` - Time freezing utility

## Key Features

- **No Network Calls**: All external dependencies are stubbed
- **No Database**: Uses fake ClickHouse client
- **Fast Execution**: Unit tests run in ~2-3 seconds
- **Comprehensive Coverage**: Tests all major components
- **CI Ready**: GitHub Actions workflow included

## Organization

Tests are co-located with the ETL code in `etl/tests/` for better organization and to keep them separate from other system tests that may be added to the repository in the future.
