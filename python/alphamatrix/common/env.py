"""
Shared environment configuration for AlphaMatrix.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from alphamatrix.common.logging import get_logger

logger = get_logger(__name__)

def load_env():
    """Load environment variables from infra/.env"""
    env_path = Path("infra/.env")
    logger.info(f"Loading environment from {env_path.resolve()}")
    load_dotenv(dotenv_path=env_path)

def clickhouse_config():
    """Get ClickHouse configuration from environment variables."""
    load_env()
    
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
        "protocol": os.getenv("CLICKHOUSE_PROTOCOL", "native"),
    }
    logger.info(f"ClickHouse config: {cfg['host']}:{cfg['port']} db={cfg['database']} table={cfg['table']}")
    return cfg

def api_config():
    """Get API configuration from environment variables."""
    load_env()
    
    cfg = {
        "max_rows": int(os.getenv("API_MAX_ROWS", "200000")),
        "uds_rpc_path": os.getenv("API_UDS_RPC_PATH", ""),
        "worker_concurrency": int(os.getenv("API_WORKERS", "2")),
        "host": os.getenv("API_HOST", "0.0.0.0"),
        "port": int(os.getenv("API_PORT", "8000")),
    }
    logger.info(f"API config: max_rows={cfg['max_rows']}, workers={cfg['worker_concurrency']}")
    return cfg
