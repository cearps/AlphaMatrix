import uuid
from alphamatrix.etl.io.clickhouse_client import ClickHouseClient
from alphamatrix.api.config import load_config

def get_clickhouse_client():
    cfg = load_config()
    return ClickHouseClient(
        host=cfg["ch_host"], 
        port=cfg["ch_port"], 
        user=cfg["ch_user"], 
        password=cfg["ch_pass"],
        database=cfg["ch_db"], 
        protocol=cfg["protocol"], 
        secure=cfg["secure"],
        async_insert=cfg["async_insert"], 
        wait_async=cfg["wait_async"], 
        batch_size=cfg["batch_size"]
    )

def new_run_id() -> uuid.UUID:
    return uuid.uuid4()
