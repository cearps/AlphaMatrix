"""
Test OHLCV endpoint functionality.
"""
import pytest
from datetime import datetime, timedelta

@pytest.mark.unit
def test_get_ohlcv_ok(client):
    """Test successful OHLCV data retrieval."""
    start = "2024-01-01T00:00:00Z"
    end = "2024-01-10T00:00:00Z"
    
    r = client.get("/v1/ohlcv", params={
        "symbol": "AAPL",
        "interval": "1d",
        "start": start,
        "end": end,
        "limit": 1000
    })
    
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["symbol"] == "AAPL"
    assert body["interval"] == "1d"
    assert body["rows"] == 3
    assert len(body["data"]) == 3
    
    # Check data structure
    for item in body["data"]:
        assert "ts" in item
        assert "open" in item
        assert "high" in item
        assert "low" in item
        assert "close" in item
        assert "volume" in item

@pytest.mark.unit
def test_get_ohlcv_missing_params(client):
    """Test OHLCV endpoint with missing required parameters."""
    # Missing symbol
    r = client.get("/v1/ohlcv", params={
        "interval": "1d",
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-10T00:00:00Z"
    })
    assert r.status_code == 422  # Validation error
    
    # Missing start date
    r = client.get("/v1/ohlcv", params={
        "symbol": "AAPL",
        "interval": "1d",
        "end": "2024-01-10T00:00:00Z"
    })
    assert r.status_code == 422  # Validation error

@pytest.mark.unit
def test_get_ohlcv_invalid_date_range(client):
    """Test OHLCV endpoint with invalid date range."""
    r = client.get("/v1/ohlcv", params={
        "symbol": "AAPL",
        "interval": "1d",
        "start": "2024-01-10T00:00:00Z",  # End date
        "end": "2024-01-01T00:00:00Z",    # Start date (reversed)
        "limit": 1000
    })
    assert r.status_code == 400, r.text
    assert "end must be after start" in r.text

@pytest.mark.unit
def test_get_ohlcv_limit_exceeded(client):
    """Test OHLCV endpoint with limit exceeding max_rows."""
    r = client.get("/v1/ohlcv", params={
        "symbol": "AAPL",
        "interval": "1d",
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-10T00:00:00Z",
        "limit": 300000  # Exceeds default max_rows of 200000
    })
    assert r.status_code == 400, r.text
    assert "limit > max_rows" in r.text
