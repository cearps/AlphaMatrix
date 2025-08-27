from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from alphamatrix.api.deps import get_clickhouse_client
from alphamatrix.api.config import load_config

router = APIRouter(prefix="/v1", tags=["symbols"])


@router.get("/symbols", response_model=dict)
def list_symbols(
    q: Optional[str] = Query(default=None, description="Optional search substring (case-insensitive)"),
    limit: int = Query(default=200, ge=1, le=10000),
    interval: Optional[str] = Query(default=None, description="Optional interval to filter by"),
    ch=Depends(get_clickhouse_client),
):
    cfg = load_config()
    table = cfg["ch_table_prices"]

    base = f"SELECT DISTINCT symbol FROM {table}"
    where: List[str] = []
    params = {}
    if interval:
        where.append("interval=%(i)s")
        params["i"] = interval
    if q:
        # ILIKE with ClickHouse can be case insensitive with positionCaseInsensitive
        where.append("positionCaseInsensitive(symbol, %(q)s) > 0")
        params["q"] = q
    sql = base + (" WHERE " + " AND ".join(where) if where else "") + " ORDER BY symbol LIMIT %(lim)s"
    params["lim"] = limit

    res = ch.client.query(sql, parameters=params)
    symbols = [r[0] for r in res.result_rows]
    return {"symbols": symbols}


