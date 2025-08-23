# ETL Infrastructure

This folder contains infrastructure files specifically for the AlphaMatrix ETL system.

## 📁 Files

### **Dockerfile**

- **Purpose**: Container configuration for the ETL system
- **Usage**: `docker build -f infra/etl/Dockerfile -t alphamatrix-etl-skel .`
- **Features**:
  - Python 3.11-slim base image
  - Uses `pyproject.toml` for dependency management
  - Non-root user for security
  - Health checks for ClickHouse connectivity

## 🚀 Quick Commands

### Build ETL Container

```bash
# From repo root
docker build -f infra/etl/Dockerfile -t alphamatrix-etl-skel .
```

### Run ETL Container

```bash
# Show help
docker run --rm alphamatrix-etl-skel

# Run backfill job
docker run --rm \
  -v "$(pwd)/infra/.env:/app/infra/.env:ro" \
  alphamatrix-etl-skel \
  python -m etl.jobs.backfill_ohlcv \
    --symbol AAPL \
    --start 2020-01-01 \
    --end 2020-01-10 \
    --interval 1d

# Run incremental job
docker run --rm \
  -v "$(pwd)/infra/.env:/app/infra/.env:ro" \
  alphamatrix-etl-skel \
  python -m etl.jobs.incremental_ohlcv \
    --symbol AAPL \
    --interval 1d \
    --lookback-days 5
```

## 🔗 Related Files

- **ETL Package**: `../etl/` - Core ETL implementation
- **Environment**: `../.env` - ClickHouse configuration
- **Design Doc**: `../../docs/etl-ohlcv-yahoo-clickhouse.md` - Complete design
- **Docker Compose**: `../docker-compose.yml` - Service orchestration

## 📋 Development Notes

### Current State (Skeleton)

- ✅ Container builds successfully
- ✅ Runs ETL jobs with print-only output
- ✅ No external API calls or database writes
- ✅ Environment configuration working
- ✅ Uses `pyproject.toml` for dependency management

### Next Steps

1. **Add production dependencies** to `etl/pyproject.toml`:

   ```toml
   dependencies = [
     "pandas>=2.2",
     "python-dotenv>=1.0",
     "yfinance>=0.2",
     "clickhouse-connect>=0.7",
   ]
   ```

2. **Update Dockerfile** for production:

   - Add health checks
   - Optimize layer caching
   - Add security hardening

3. **Integration** with `docker-compose.yml`:
   - Add ETL service definition
   - Configure networking with ClickHouse
   - Set up volume mounts for logs
