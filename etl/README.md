# AlphaMatrix ETL Skeleton

This is a skeleton implementation of the ETL pipeline for Yahoo Finance OHLCV data to ClickHouse, as designed in `docs/etl-ohlcv-yahoo-clickhouse.md`.

## 📁 ETL File Organization

### **Core ETL Package** (`etl/`)

```
etl/
├── adapters/           # Data source adapters
│   ├── __init__.py
│   ├── base_adapter.py
│   └── yahoo_finance_adapter.py
├── io/                 # Input/Output interfaces
│   ├── __init__.py
│   └── clickhouse_client.py
├── transforms/         # Data transformations
│   ├── __init__.py
│   ├── ohlcv_mapper.py
│   └── validators.py
├── jobs/               # ETL job runners
│   ├── __init__.py
│   ├── backfill_ohlcv.py
│   └── incremental_ohlcv.py
├── utils/              # Utilities
│   ├── __init__.py
│   ├── env.py
│   └── logging.py
├── __init__.py
├── pyproject.toml      # Package configuration
└── README.md          # This file
```

### **Infrastructure Files** (`infra/`)

```
infra/
├── etl/                # ETL-specific infrastructure
│   └── Dockerfile     # ETL container configuration
├── .env               # Environment configuration (shared)
├── docker-compose.yml # Service orchestration (includes ETL)
└── migrations/        # Database schema (shared)
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker (optional)
- `infra/.env` file with ClickHouse configuration

### Local Development

1. **Install dependencies:**

   ```bash
   # Using conda (recommended)
   conda install pandas python-dotenv -y

   # Or using pip
   pip install pandas python-dotenv
   ```

2. **Install the ETL package:**
   ```bash
   pip install -e ./etl
   ```

### Running ETL Jobs

#### Backfill Job (Historical Data)

```bash
python -m etl.jobs.backfill_ohlcv \
  --symbol AAPL \
  --start 2020-01-01 \
  --end 2020-01-10 \
  --interval 1d
```

#### Incremental Job (New Data)

```bash
python -m etl.jobs.incremental_ohlcv \
  --symbol AAPL \
  --interval 1d \
  --lookback-days 5
```

### Docker Usage

1. **Build the ETL image:**

   ```bash
   # Build from repo root (infra/etl/Dockerfile)
   docker build -f infra/etl/Dockerfile -t alphamatrix-etl-skel .
   ```

2. **Run ETL help:**

   ```bash
   docker run --rm alphamatrix-etl-skel
   ```

3. **Run ETL backfill job:**

   ```bash
   docker run --rm \
     -v "$(pwd)/infra/.env:/app/infra/.env:ro" \
     alphamatrix-etl-skel \
     python -m etl.jobs.backfill_ohlcv \
       --symbol AAPL \
       --start 2020-01-01 \
       --end 2020-01-10 \
       --interval 1d
   ```

4. **Run ETL incremental job:**
   ```bash
   docker run --rm \
     -v "$(pwd)/infra/.env:/app/infra/.env:ro" \
     alphamatrix-etl-skel \
     python -m etl.jobs.incremental_ohlcv \
       --symbol AAPL \
       --interval 1d \
       --lookback-days 5
   ```

## ⚙️ Configuration

### Environment Variables

The ETL reads ClickHouse configuration from `infra/.env`:

```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DB=alpha
CLICKHOUSE_TABLE=ohlcv
```

### Expected Output

Both ETL jobs will print skeleton messages showing the flow:

```
[logging] basic logging initialized (SKELETON)
[backfill] args=Namespace(symbol='AAPL', start='2020-01-01', end='2020-01-10', interval='1d')
[env] loading /path/to/infra/.env
[env] loaded CLICKHOUSE_HOST=localhost CLICKHOUSE_DB=alpha TABLE=ohlcv
[ClickHouseClient.__init__] host=localhost, port=8123, db=alpha (user only for auth)
[YahooFinanceAdapter] fetch_ohlcv(symbol=AAPL, start=2020-01-01 00:00:00, end=2020-01-10 00:00:00, interval=1d)
[validate_ohlcv] rows=0 SKELETON no validation
[map_to_clickhouse] input rows=0 SKELETON passthrough
[ClickHouseClient.upsert_ohlcv] table=ohlcv, rows=0 SKELETON no-op
[backfill] done symbol=AAPL rows_upserted=0 (SKELETON)
```

## 📋 Implementation Notes

### Current State

- ✅ Skeleton structure implemented
- ✅ All interfaces defined
- ✅ Print statements show data flow
- ✅ No external API calls or DB writes
- ✅ Docker containerization working
- ✅ Environment configuration working

### Next Steps

1. **Implement Yahoo Finance adapter:**

   - Add `yfinance` dependency
   - Implement actual API calls
   - Add rate limiting and error handling

2. **Implement ClickHouse client:**

   - Add `clickhouse-connect` dependency
   - Implement actual database operations
   - Add connection pooling and retries

3. **Implement data validation:**

   - Add OHLC bounds checking
   - Add timestamp validation
   - Add duplicate detection

4. **Add comprehensive testing:**
   - Unit tests for each component
   - Integration tests with mock data
   - End-to-end tests

## 🏗️ Design Compliance

This skeleton follows the design document `docs/etl-ohlcv-yahoo-clickhouse.md`:

- ✅ **Extensible:** Pluggable adapter pattern via `DataSourceAdapter`
- ✅ **Containerizable:** Docker image with minimal dependencies
- ✅ **Low friction:** Simple CLI interface with clear help text
- ✅ **Environment config:** Reads from `infra/.env` only
- ✅ **No external I/O:** Skeleton prints only, no network calls
- ✅ **Clear structure:** Adapters ↔ Transforms ↔ IO ↔ Jobs

## 🔧 Troubleshooting

### Import Errors

If you get `ModuleNotFoundError: No module named 'pandas'`:

```bash
conda install pandas python-dotenv -y
```

### Docker Issues

If Docker can't find the `.env` file:

```bash
# Ensure the file exists
ls -la infra/.env

# Use absolute path on Windows
docker run --rm -v "C:\path\to\AlphaMatrix\infra\.env:/app/infra/.env:ro" ...
```

### Permission Issues

If you get permission errors with Docker:

```bash
# On Windows, ensure Docker Desktop is running
# On Linux, you might need to add your user to the docker group
```

## 📚 Related Files

### **Design Documentation**

- `docs/etl-ohlcv-yahoo-clickhouse.md` - Complete ETL design document

### **Infrastructure**

- `infra/etl/Dockerfile` - ETL container configuration
- `etl/pyproject.toml` - ETL package configuration and dependencies
- `infra/.env` - Environment configuration (shared)
- `infra/docker-compose.yml` - Service orchestration (includes ETL)

### **Database Schema**

- `infra/migrations/` - ClickHouse schema migrations
