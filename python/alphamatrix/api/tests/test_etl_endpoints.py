"""
Test ETL endpoint functionality.
"""
import pytest
from datetime import datetime

@pytest.mark.unit
def test_backfill_enqueue(client):
    """Test backfill ETL job enqueuing."""
    r = client.post("/v1/etl/backfill", json={
        "symbol": "AAPL",
        "interval": "1d",
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-02T00:00:00Z",
        "dry_run": True
    })
    
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") in ("queued", "running", "succeeded", "failed")
    assert "run_ids" in body and isinstance(body["run_ids"], list)
    assert len(body["run_ids"]) >= 1
    assert isinstance(body["run_ids"][0], str)

@pytest.mark.unit
def test_incremental_enqueue(client):
    """Test incremental ETL job enqueuing."""
    r = client.post("/v1/etl/incremental", json={
        "symbol": "TSLA",
        "interval": "1d",
        "lookback_days": 7,
        "dry_run": True
    })
    
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") in ("queued", "running", "succeeded", "failed")
    assert "run_ids" in body and isinstance(body["run_ids"], list)
    assert len(body["run_ids"]) >= 1
    assert isinstance(body["run_ids"][0], str)

@pytest.mark.unit
def test_backfill_missing_params(client):
    """Test backfill endpoint with missing required parameters."""
    # Missing symbol
    r = client.post("/v1/etl/backfill", json={
        "interval": "1d",
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-02T00:00:00Z",
        "dry_run": True
    })
    assert r.status_code == 422  # Validation error
    
    # Missing start date
    r = client.post("/v1/etl/backfill", json={
        "symbol": "AAPL",
        "interval": "1d",
        "end": "2024-01-02T00:00:00Z",
        "dry_run": True
    })
    assert r.status_code == 422  # Validation error

@pytest.mark.unit
def test_incremental_missing_params(client):
    """Test incremental endpoint with missing required parameters."""
    # Missing symbol
    r = client.post("/v1/etl/incremental", json={
        "interval": "1d",
        "lookback_days": 7,
        "dry_run": True
    })
    assert r.status_code == 422  # Validation error

@pytest.mark.unit
def test_job_status_not_found(client):
    """Test job status endpoint with non-existent job ID."""
    r = client.get("/v1/etl/runs/non-existent-id")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "not_found"
    assert body["run_id"] == "non-existent-id"

@pytest.mark.unit
def test_backfill_with_exchange(client):
    """Test backfill endpoint with custom exchange."""
    r = client.post("/v1/etl/backfill", json={
        "symbol": "AAPL",
        "interval": "1d",
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-02T00:00:00Z",
        "exchange": "NASDAQ",
        "dry_run": True
    })
    
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") in ("queued", "running", "succeeded", "failed")
    assert "run_ids" in body and isinstance(body["run_ids"], list)
