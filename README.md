# AlphaMatrix

> **Open-source platform for researching, back-testing, and executing multi-leg options strategies – built with fast-path C++ and flexible Python.**

AlphaMatrix started as my personal “show-what-I-can-do” project for quant interviews. It’s grown into an excuse to **learn together, practise clean architecture, and move real code to production standards**—while demystifying volatility models, greeks, and low-latency market plumbing.

If you like solving tough engineering problems **and** debating why a straddle blows up under earnings IV crush, you’ll feel at home here.

---

## Why you might want to join

| What’s in it for **you** | How AlphaMatrix delivers |
|---------------------------|--------------------------|
| **💼 Portfolio piece** – stand out with a public, production-ready quant stack. | Modern C++20 gateway + Python analytics + React dashboard, Dockerised & CI-tested. |
| **🧠 Cross-disciplinary learning** – stats ↔️ systems ↔️ UX. | Volatility modelling (GARCH, SABR), FIX/Aeron gateways, FastAPI, Tailwind/react-viz. |
| **🤝 Mentorship culture** – pair programming & code reviews. | Weekly “alpha hour” calls, good-first-issue labelling, doc sprints. |
| **🚀 Ownership** – pick a module and drive it end-to-end. | Well-scoped epics (data ingestion, risk checks, IV surface fitter, etc.). |

---

## Current feature map

* **Market Data ETL** – free Yahoo/Polygon feeds → Parquet → ClickHouse.
* **Analytics Core** – GARCH(1,1) & EGARCH, IV surface fit, greeks via pybind11-wrapped C++.
* **Back-tester** – vectorised daily/1-min event engine, portfolio P&L with margin/haircuts.
* **Execution Layer** – C++ FIX gateway (Fix8) with risk guards, optional Alpaca paper trading.
* **Dashboard UI** – React + Vite; equity curve, drawdown, live greeks heat-map.

*(Check the* [`/docs/roadmap.md`](docs/roadmap.md) *for full backlog.)*

---

## Quick start

```bash
git clone https://github.com/cearps/alphamatrix.git
cd alphamatrix
make dev            # spins up ClickHouse, API, React, and a sample strategy in Docker
open http://localhost:3000   # dashboard
```
