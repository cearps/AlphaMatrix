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
# Normal mode (loads to ClickHouse)
python -m etl.jobs.backfill_ohlcv \
  --symbol AAPL \
  --start 2020-01-01 \
  --end 2020-01-10 \
  --interval 1d

# Dry-run mode (prints summary only)
python -m etl.jobs.backfill_ohlcv \
  --symbol AAPL \
  --start 2020-01-01 \
  --end 2020-01-10 \
  --interval 1d \
  --dry-run
```

#### Incremental Job (New Data)

```bash
# Normal mode (loads to ClickHouse)
python -m etl.jobs.incremental_ohlcv \
  --symbol AAPL \
  --interval 1d \
  --lookback-days 5

# Dry-run mode (prints summary only)
python -m etl.jobs.incremental_ohlcv \
  --symbol AAPL \
  --interval 1d \
  --lookback-days 5 \
  --dry-run
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

#### Normal Mode (without --dry-run)

Both ETL jobs will print skeleton messages showing the flow:

```
[logging] basic logging initialized (SKELETON)
[backfill] args=Namespace(symbol='AAPL', start='2020-01-01', end='2020-01-10', interval='1d')
[env] loading /path/to/infra/.env
[env] loaded CLICKHOUSE_HOST=localhost CLICKHOUSE_DB=alpha TABLE=ohlcv
[ClickHouseClient.__init__] host=localhost, port=8123, db=alpha (user only for auth)
[YahooFinanceAdapter] downloading AAPL 2020-01-01 00:00:00→2020-01-10 00:00:00 interval=1d (yf=1d)
[validate_ohlcv] rows=3 SKELETON no validation
[map_to_clickhouse] input rows=3 SKELETON passthrough
[ClickHouseClient.upsert_ohlcv] table=ohlcv, rows=3 SKELETON no-op
[backfill] done symbol=AAPL rows_upserted=3
```

#### Dry-Run Mode (with --dry-run)

Shows detailed data summary without database writes:

```
=== DRY RUN SUMMARY ===
symbol: AAPL
rows: 3
date range: 2024-01-02 00:00:00 -> 2024-01-04 00:00:00

head(5):
        ts       open       high        low      close   volume symbol
2024-01-02 187.149994 188.440002 183.889999 185.639999 82488700   AAPL
2024-01-03 184.220001 185.880005 183.429993 184.250000 58414500   AAPL
2024-01-04 182.149994 183.089996 180.880005 181.910004 71983600   AAPL

[describe numeric columns]
Price        open        high         low       close        volume
count    3.000000    3.000000    3.000000    3.000000  3.000000e+00
mean   184.506663  185.803335  182.733332  183.933334  7.096227e+07
...
```

## 📋 Implementation Notes

### Current State

- ✅ **Real Yahoo Finance integration** - Fetches actual OHLCV data
- ✅ **Real ClickHouse integration** - Writes to `alpha.equity_prices` table
- ✅ **Data normalization** - Handles MultiIndex columns, UTC timestamps
- ✅ **Retry logic** - Exponential backoff for API failures
- ✅ **Data cleanup** - Deduplication, NaN removal, volume validation
- ✅ **Dry-run mode** - `--dry-run` flag for data preview without DB writes
- ✅ **Comprehensive summaries** - Detailed data statistics and validation
- ✅ **Batch processing** - Configurable batch sizes with async inserts
- ✅ **Idempotent writes** - UUID run tracking and ReplacingMergeTree deduplication
- ✅ **Docker containerization** - Works in both local and containerized environments
- ✅ **Environment configuration** - Reads from `infra/.env`

### Next Steps

1. **Implement data validation:**

   - Add OHLC bounds checking (high >= max(open, close))
   - Add timestamp validation (monotonic, no gaps)
   - Add duplicate detection and handling

2. **Add comprehensive testing:**

   - Unit tests for each component
   - Integration tests with mock data
   - End-to-end tests with real data

3. **Performance optimizations:**
   - Batch processing for multiple symbols
   - Parallel downloads for different time periods
   - Caching for frequently accessed data

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
