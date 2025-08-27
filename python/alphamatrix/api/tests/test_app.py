"""
Test-specific FastAPI app that doesn't require ClickHouse during startup.
"""
from fastapi import FastAPI
from datetime import datetime
from alphamatrix.api.routers import ohlcv, etl
from alphamatrix.api.routers import symbols as symbols_router
from alphamatrix.api.deps import get_clickhouse_client

# Create a test app without startup/shutdown events
test_app = FastAPI(title="AlphaMatrix API Test", version="0.1.0")

@test_app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0"
    }

# Override the dependency injection for testing
def get_fake_clickhouse_client():
    """Fake ClickHouse client for testing."""
    class FakeCHResult:
        def __init__(self, rows):
            self.result_rows = rows

    class FakeCHClient:
        def __init__(self):
            self.queries = []

        def command(self, sql):
            return 1

        def query(self, sql, parameters=None):
            self.queries.append((sql, parameters))
            sql_upper = (sql or "").upper()
            if "SELECT DISTINCT SYMBOL" in sql_upper:
                symbols = ["AAPL", "MSFT", "GOOGL"]
                q = (parameters or {}).get("q")
                if q:
                    q_u = str(q).upper()
                    symbols = [s for s in symbols if q_u in s.upper()]
                lim = (parameters or {}).get("lim", len(symbols))
                symbols = symbols[: int(lim)]
                return FakeCHResult([(s,) for s in symbols])
            # default: Return 3 rows for ohlcv
            return FakeCHResult([
                ("2024-01-01 00:00:00", 100.0, 101.0, 99.5, 100.5, 1000),
                ("2024-01-02 00:00:00", 100.5, 102.0, 100.0, 101.0, 1500),
                ("2024-01-03 00:00:00", 101.0, 103.0, 100.2, 102.5, 1200),
            ])

    class FakeCHWrapper:
        def __init__(self):
            self.client = FakeCHClient()
            
        def latest_timestamp(self, *args, **kwargs):
            return None
            
        def upsert_ohlcv(self, **kwargs):
            return 0

    return FakeCHWrapper()

# Create a fake job runner for ETL endpoints
class FakeJobRunner:
    def __init__(self):
        self.jobs = {}
    
    async def submit(self, job):
        self.jobs[str(job.run_id)] = job
    
    def status(self, run_id: str):
        return self.jobs.get(run_id)

# Set up the fake job runner in the ETL router
fake_job_runner = FakeJobRunner()
etl.set_job_runner(fake_job_runner)

# Override the dependency
test_app.dependency_overrides[get_clickhouse_client] = get_fake_clickhouse_client

# Include routers
test_app.include_router(ohlcv.router)
test_app.include_router(etl.router)
test_app.include_router(symbols_router.router)
