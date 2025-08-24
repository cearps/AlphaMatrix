import os
from pathlib import Path
from dotenv import load_dotenv
from alphamatrix.etl.utils.logging import get_logger

logger = get_logger(__name__)

def load_clickhouse_env():
    # Load from infra/.env (do not recreate)
    env_path = Path("infra/.env")
    logger.info(f"loading {env_path.resolve()}")
    load_dotenv(dotenv_path=env_path)

    cfg = {
        "host": os.getenv("CLICKHOUSE_HOST", "localhost"),
        "port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
        "user": os.getenv("CLICKHOUSE_USER", "default"),
        "password": os.getenv("CLICKHOUSE_PASSWORD", ""),
        "database": os.getenv("CLICKHOUSE_DB", "alpha"),
        "table": os.getenv("CLICKHOUSE_TABLE", "equity_prices"),
        "exchange_default": os.getenv("DEFAULT_EXCHANGE", "UNKNOWN"),
        "batch_size": int(os.getenv("CH_BATCH_SIZE", "25000")),
        "async_insert": os.getenv("CH_ASYNC_INSERT", "1") == "1",
        "wait_async": os.getenv("CH_WAIT_ASYNC", "1") == "1",
        "secure": os.getenv("CLICKHOUSE_SECURE", "0") == "1",
        "protocol": os.getenv("CLICKHOUSE_PROTOCOL", "native"),  # 'native' or 'http'
    }
    logger.info(f"CLICKHOUSE {cfg['host']}:{cfg['port']} db={cfg['database']} table={cfg['table']}")
    return cfg
