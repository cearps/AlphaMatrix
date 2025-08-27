from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from datetime import datetime
from alphamatrix.api.routers import ohlcv, etl
from alphamatrix.api.routers import symbols as symbols_router
from alphamatrix.api.jobrunner import JobRunner
from alphamatrix.api.deps import get_clickhouse_client
from alphamatrix.api.config import load_config

app = FastAPI(title="AlphaMatrix API", version="0.1.0")

# CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0"
    }

# Create runner and start workers on startup
@app.on_event("startup")
async def startup_event():
    cfg = load_config()
    runner = JobRunner(ch_factory=get_clickhouse_client, concurrency=cfg["worker_concurrency"])
    await runner.start()
    etl.set_job_runner(runner)
    app.state.runner = runner

@app.on_event("shutdown")
async def shutdown_event():
    runner: JobRunner = app.state.runner
    await runner.stop()

app.include_router(ohlcv.router)
app.include_router(etl.router)
app.include_router(symbols_router.router)