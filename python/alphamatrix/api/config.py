from alphamatrix.common.env import clickhouse_config, api_config

def load_config():
    """Load combined configuration for API."""
    ch_cfg = clickhouse_config()
    api_cfg = api_config()
    
    return {
        # ClickHouse config
        "ch_host": ch_cfg["host"],
        "ch_port": ch_cfg["port"],
        "ch_user": ch_cfg["user"],
        "ch_pass": ch_cfg["password"],
        "ch_db": ch_cfg["database"],
        "ch_table_prices": ch_cfg["table"],
        "default_exchange": ch_cfg["exchange_default"],
        "batch_size": ch_cfg["batch_size"],
        "async_insert": ch_cfg["async_insert"],
        "wait_async": ch_cfg["wait_async"],
        "secure": ch_cfg["secure"],
        "protocol": ch_cfg["protocol"],
        # API specific
        "max_rows": api_cfg["max_rows"],
        "uds_rpc_path": api_cfg["uds_rpc_path"],
        "worker_concurrency": api_cfg["worker_concurrency"],
    }
