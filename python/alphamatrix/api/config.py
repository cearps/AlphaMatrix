from pathlib import Path
import os
from dotenv import load_dotenv

def load_config():
    env_path = Path("infra/.env")
    load_dotenv(dotenv_path=env_path)

    return {
        "ch_host": os.getenv("CLICKHOUSE_HOST", "localhost"),
        "ch_port": int(os.getenv("CLICKHOUSE_PORT", "8123")),
        "ch_user": os.getenv("CLICKHOUSE_USER", "default"),
        "ch_pass": os.getenv("CLICKHOUSE_PASSWORD", ""),
        "ch_db": os.getenv("CLICKHOUSE_DB", "alpha"),
        "ch_table_prices": os.getenv("CLICKHOUSE_TABLE", "equity_prices"),
        "default_exchange": os.getenv("DEFAULT_EXCHANGE", "UNKNOWN"),
        "batch_size": int(os.getenv("CH_BATCH_SIZE", "25000")),
        "async_insert": os.getenv("CH_ASYNC_INSERT", "1") == "1",
        "wait_async": os.getenv("CH_WAIT_ASYNC", "1") == "1",
        "secure": os.getenv("CLICKHOUSE_SECURE", "0") == "1",
        "protocol": os.getenv("CLICKHOUSE_PROTOCOL", "native"),
        # API specific
        "max_rows": int(os.getenv("API_MAX_ROWS", "200000")),
        "uds_rpc_path": os.getenv("API_UDS_RPC_PATH", ""),  # e.g., /tmp/alphamatrix_etl.sock
        "worker_concurrency": int(os.getenv("API_WORKERS", "2")),
    }
