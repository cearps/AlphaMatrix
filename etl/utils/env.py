import os
from pathlib import Path
from dotenv import load_dotenv

def load_clickhouse_env():
    # Load from infra/.env (do not recreate)
    env_path = Path("infra/.env")
    print(f"[env] loading {env_path.resolve()}")
    load_dotenv(dotenv_path=env_path)

    cfg = {
        "host": os.getenv("CLICKHOUSE_HOST", "localhost"),
        "port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
        "user": os.getenv("CLICKHOUSE_USER", "default"),
        "password": os.getenv("CLICKHOUSE_PASSWORD", ""),
        "database": os.getenv("CLICKHOUSE_DB", "default"),
        "table": os.getenv("CLICKHOUSE_TABLE", "ohlcv"),
    }
    print(f"[env] loaded CLICKHOUSE_HOST={cfg['host']} CLICKHOUSE_DB={cfg['database']} TABLE={cfg['table']}")
    return cfg
