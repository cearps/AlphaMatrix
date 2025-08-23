# AlphaMatrix – Backend Testing Program

> **Mission:** give quants and engineers an open, hack‑friendly playground to design, back‑test, and (eventually) execute multi‑leg options strategies at low latency.

---

## 1  Project Overview

AlphaMatrix stitches together fast C++ analytics, flexible Python APIs and a modern React front‑end to make option‑strategy research feel as slick as running a unit test.

- **Back‑test first** – every trading idea is a reproducible test‑case.
- **Plug‑in later** – swap data feeds, models or brokers via clean adapters.
- **Showcase skills** – contributors practise real‑world DevOps, C++ optimisation and data‑engineering patterns.

---

## 2  Core Philosophy

| Principle                   | What it means                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------- |
| **Test‑driven alpha**       | Strategies are code + fixtures; CI tells us if new commits break Sharpe or latency. |
| **Vertical slices**         | Ship tiny, end‑to‑end features (data → model → UI) rather than big‑bang layers.     |
| **Teach & learn**           | Each PR includes a short _What I learned_ note; weekly “Alpha Hour” shares tips.    |
| **Performance with safety** | Fast C++ where latency matters, Python for iteration, typed interfaces between.     |

---

## 3  System Architecture (bird’s‑eye)

```
┌─────────────┐  ticks/greeks  ┌──────────────────────────┐  REST/gRPC   ┌──────────────┐
│  C++ GATEWAY│───────────────▶│      Python FastAPI      │──────────────▶│   React UI   │
│  (risk + FIX)│               │   (back‑test + auth)     │   JSON/WS    │ (charts,map) │
└──────┬──────┘                └──────────┬───────────────┘               └────┬─────────┘
       │  Arrow IPC                        │ SQL
       ▼                                   ▼
 ┌─────────────┐        CDC        ┌────────────────┐
 │  ClickHouse │◀──────────────────│ Parquet Landing │
 └─────────────┘                   └────────────────┘
```

- **C++ Gateway** — ultra‑low‑latency FIX/Aeron service; enforces risk before orders hit the street.
- **FastAPI Service** — back‑tester, auth, REST & WebSocket endpoints.
- **ClickHouse** — columnar store for ticks, option chains, and back‑test results.
- **React + Tailwind UI** — strategy wizard, run monitor, greeks heat‑map.

---

## 4  Module Details

| Dir        | Responsibility                                            | Key Tech                                     |
| ---------- | --------------------------------------------------------- | -------------------------------------------- |
| `core/`    | Back‑test engine, analytics libs, C++ greeks via pybind11 | C++20, Python 3.12                           |
| `api/`     | FastAPI app, auth, orchestration of runs                  | FastAPI, Pydantic, Alembic                   |
| `web/`     | Front‑end dashboard & wizard                              | React 19, Vite, shadcn/ui, Recharts          |
| `scripts/` | One‑off ETL, benchmarks, dev helpers                      | Python CLI, Rich                             |
| `ci/`      | GitHub Actions workflows, lint, latency tests             | actions‑python, clang‑tidy, pytest‑benchmark |
| `infra/`   | Docker Compose, k8s Helm charts                           | ClickHouse, Postgres, Grafana                |
| `etl/`     | **ETL Pipeline** - Yahoo Finance → ClickHouse             | Python, pandas, yfinance, clickhouse-connect |

---

## 4.1 ETL System

The ETL system provides data ingestion from Yahoo Finance to ClickHouse for backtesting.

### **Quick Start (ETL)**

```bash
# Install dependencies
conda install pandas python-dotenv -y
pip install -e ./etl

# Run ETL jobs
python -m etl.jobs.backfill_ohlcv --symbol AAPL --start 2020-01-01 --end 2020-01-10 --interval 1d
python -m etl.jobs.incremental_ohlcv --symbol AAPL --interval 1d --lookback-days 5

# Docker (from repo root)
docker build -f infra/etl/Dockerfile -t alphamatrix-etl-skel .
docker run --rm -v "$(pwd)/infra/.env:/app/infra/.env:ro" alphamatrix-etl-skel python -m etl.jobs.backfill_ohlcv --symbol AAPL --start 2020-01-01 --end 2020-01-10 --interval 1d
```

### **ETL File Organization**

```
etl/                    # Core ETL package
├── adapters/          # Data source adapters (Yahoo Finance, etc.)
├── io/               # ClickHouse client
├── transforms/       # Data validation & mapping
├── jobs/             # ETL job runners
└── utils/            # Environment & logging

infra/etl/            # ETL infrastructure
└── Dockerfile        # ETL container

docs/
└── etl-ohlcv-yahoo-clickhouse.md  # Complete ETL design
```

**📖 Full ETL Documentation:** See [`etl/README.md`](etl/README.md) for detailed usage and development guide.

---

## 5  Tech Stack

- **Python (API & glue)** – rapid iteration, great data libs.
- **C++ (Core analytics & gateway)** – micro‑second greeks, FIX adapter.
- **React + TypeScript (Front‑end)** – modern, componentised UI with shadcn/ui.
- **ClickHouse (DB)** – ingest millions of rows/sec and query TBs in < 1 s  ([benchmark](https://clickhouse.com/blog/json-bench-clickhouse-vs-mongodb-elasticsearch-duckdb-postgresql)).

---

## 6  Example Workflow

1. **Clone & setup**

   ```bash
   git clone https://github.com/alphamatrix/alphamatrix.git && cd alphamatrix
   ```

   **Quick Setup:**

- **Windows:** Run `scripts/setup-windows.ps1` as Administrator (interactive credential setup)
- **macOS/Linux:** Run `scripts/setup-unix.sh` (interactive credential setup)

**Manual Setup:** See [SETUP.md](SETUP.md) for detailed database setup instructions

2. **Create a strategy YAML** – e.g. `examples/straddle.yml`.
3. **Run a back‑test**
   ```bash
   curl -X POST localhost:8000/backtests         -d '{"strategy": "straddle", "start": "2023-01-01", "end": "2023-12-31"}'
   ```
4. **Watch progress** – open `http://localhost:3000`; equity curve updates live.
5. **Inspect results** – query ClickHouse:
   ```sql
   SELECT sharpe, max_drawdown
   FROM backtest_runs
   ORDER BY created_ts DESC
   LIMIT 5;
   ```

---

## 7  MVP Strategy — 30‑Day ATM Straddle

| Aspect         | Spec                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| **Objective**  | Exploit implied‑volatility mispricing by holding delta‑neutral long straddles.               |
| **Universe**   | Top‑100 US equities by average daily option volume (e.g., AAPL, MSFT, TSLA).                 |
| **Legs**       | 1 × Long ATM Call **+** 1 × Long ATM Put, opened 30 calendar days before expiry.             |
| **Entry**      | Each trading day 16:00 ET: select next monthly expiry; choose ATM strike (closest to spot).  |
| **Exit**       | First hit of:  1️⃣ T‑1 (day before expiry)  2️⃣ Loss ≤ ‑50 % premium  3️⃣ Gain ≥ +100 % premium |
| **Risk**       | Max premium per trade = 1 % of portfolio NAV; portfolio max = 10 simultaneous positions.     |
| **Data**       | Daily OHLC spot prices; option chain mid prices & greeks (Δ, Γ, Θ, Vega).                    |
| **Metrics**    | P&L, Sharpe, max drawdown, IV crush %, realised – implied vol spread.                        |
| **Validation** | Unit test: back‑test on AAPL 2023 reproduces reference P&L within ± 1 ¢.                     |

This focused strategy powers our first CLI, API, and UI demos—keeping scope tight while exercising every layer of the stack.

---

## 8  Glossary & Definitions

| Term              | Meaning in AlphaMatrix                                              |
| ----------------- | ------------------------------------------------------------------- |
| **Back‑test run** | A single simulation with fixed parameters and market data slice.    |
| **Strategy YAML** | Declarative file describing option legs, entry/exit criteria, risk. |
| **Greeks**        | Δ, Γ, Θ, Vega calculated per‑leg per‑bar by `core/greeks.cpp`.      |
| **Projection**    | ClickHouse pre‑aggregated table speeding up common queries.         |
| **Alpha Hour**    | Weekly 30‑min community call to sync & share learnings.             |

---

## 9  Contribution Guide (TL;DR)

1. **Pick an issue** – `good first issue` is ideal for new joiners.
2. **Fork & branch** – `git checkout -b feat/<topic>-<initials>`.
3. **Code & test** – `pre-commit run -a`, `pytest`, `ctest`.
4. **Open PR** – include _What I learned_ section; we review on a call if you like.
5. **Merge** – green CI + one maintainer approval.

_Full guidelines live in [`CONTRIBUTING.md`](CONTRIBUTING.md)._

## 10  Disclaimers

1. **Not financial advice**: All information, code, and examples provided in this repository are for demonstration and educational purposes only. They should not be interpreted as investment, trading, or financial advice.
2. **No Ownership of Third-Party Research/Data**: Any referenced market data, research, or external content remains the property of its respective owners. This repository does not claim authorship or rights to such materials.
3. **Educational Use Only**: The code and documentation are intended solely to illustrate technical concepts in quantitative finance and data processing. They are not intended for live trading or commercial deployment without independent review and validation.
4. **Exercise Answers Not Guaranteed Correct**: Any solutions provided to exercises are based on the author’s understanding at the time of writing. They may contain errors and should not be relied upon as authoritative answers without independent verification.
