import uuid
import pytest
import pandas as pd
from etl.transforms.ohlcv_mapper import map_yfinance_to_ohlcv

@pytest.mark.unit
def test_upsert_signature(fake_ch_client, sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    inserted = fake_ch_client.upsert_ohlcv(
        df=df,
        table="alpha.equity_prices",
        interval="1d",
        source="yahoo",
        ingest_run_id=uuid.uuid4(),
        exchange_default="NASDAQ"
    )
    assert inserted == len(df)
    assert fake_ch_client.insert_calls[-1]["table"] == "alpha.equity_prices"

@pytest.mark.unit
def test_upsert_captures_all_parameters(fake_ch_client, sample_ohlcv_df_daily):
    df = map_yfinance_to_ohlcv(sample_ohlcv_df_daily, "AAPL")
    run_id = uuid.uuid4()
    
    inserted = fake_ch_client.upsert_ohlcv(
        df=df,
        table="test_table",
        interval="1h",
        source="test_source",
        ingest_run_id=run_id,
        exchange_default="TEST_EXCHANGE"
    )
    
    call = fake_ch_client.insert_calls[-1]
    assert call["rows"] == len(df)
    assert call["table"] == "test_table"
    assert call["interval"] == "1h"
    assert call["source"] == "test_source"
    assert call["run_id"] == str(run_id)
    assert call["exchange"] == "TEST_EXCHANGE"

@pytest.mark.unit
def test_healthcheck_returns_boolean(fake_ch_client):
    assert fake_ch_client.healthcheck() == True
    
    # Test unhealthy state
    fake_ch_client.health = False
    assert fake_ch_client.healthcheck() == False

@pytest.mark.unit
def test_latest_timestamp_returns_none_by_default(fake_ch_client):
    result = fake_ch_client.latest_timestamp("AAPL", "test_table", "1d")
    assert result is None

@pytest.mark.unit
def test_upsert_handles_empty_dataframe(fake_ch_client):
    empty_df = map_yfinance_to_ohlcv(pd.DataFrame(), "AAPL")
    inserted = fake_ch_client.upsert_ohlcv(
        df=empty_df,
        table="test_table",
        interval="1d",
        source="test_source",
        ingest_run_id=uuid.uuid4(),
        exchange_default="NASDAQ"
    )
    assert inserted == 0
    assert len(fake_ch_client.insert_calls) == 1
