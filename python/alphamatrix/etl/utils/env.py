from alphamatrix.common.env import clickhouse_config
from alphamatrix.common.logging import get_logger

logger = get_logger(__name__)

def load_clickhouse_env():
    """Load ClickHouse environment configuration."""
    return clickhouse_config()
