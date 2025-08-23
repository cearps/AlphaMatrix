# SKELETON image: no heavy deps yet
FROM python:3.11-slim

WORKDIR /app

# Copy ETL package (build context should be from repo root)
COPY etl/ /app/etl/

# Install minimal runtime only (no clickhouse/yfinance yet)
RUN pip install --no-cache-dir -e ./etl

# Keep runtime clean; .env will be mounted/read from infra/.env by the runner
ENV PYTHONUNBUFFERED=1

# Default: show help for backfill job
CMD ["python", "-m", "etl.jobs.backfill_ohlcv", "--help"]
