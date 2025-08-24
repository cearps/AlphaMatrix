from fastapi import APIRouter, Depends, HTTPException
from alphamatrix.api.models.requests import OhlcvQuery
from alphamatrix.api.models.responses import OhlcvResponse, Bar
from alphamatrix.api.deps import get_clickhouse_client
from alphamatrix.api.config import load_config
from datetime import datetime

router = APIRouter(prefix="/v1", tags=["ohlcv"])

@router.get("/ohlcv", response_model=OhlcvResponse)
def get_ohlcv(q: OhlcvQuery = Depends(), ch = Depends(get_clickhouse_client)):
    cfg = load_config()
    if q.limit > cfg["max_rows"]:
        raise HTTPException(status_code=400, detail=f"limit > max_rows ({cfg['max_rows']})")
    if q.end <= q.start:
        raise HTTPException(status_code=400, detail="end must be after start")

    # Basic aggregation switch (optional)
    agg = (q.aggregate or "none").lower()
    if agg == "none":
        sql = f"""
        SELECT timestamp, open, high, low, close, volume
        FROM {cfg['ch_table_prices']}
        WHERE symbol=%(s)s AND interval=%(i)s
          AND timestamp BETWEEN %(st)s AND %(en)s
        ORDER BY timestamp
        LIMIT %(lim)s
        """
    elif agg in ("minute","hour","day"):
        bucket_fn = {"minute":"toStartOfMinute","hour":"toStartOfHour","day":"toStartOfDay"}[agg]
        sql = f"""
        SELECT
          {bucket_fn}(timestamp) AS timestamp,
          anyLast(open)  AS open,
          max(high)      AS high,
          min(low)       AS low,
          anyLast(close) AS close,
          sum(volume)    AS volume
        FROM {cfg['ch_table_prices']}
        WHERE symbol=%(s)s AND interval=%(i)s
          AND timestamp BETWEEN %(st)s AND %(en)s
        GROUP BY timestamp
        ORDER BY timestamp
        LIMIT %(lim)s
        """
    else:
        raise HTTPException(status_code=400, detail="invalid aggregate")

    rows = ch.client.query(sql, parameters={
        "s": q.symbol, "i": q.interval, "st": q.start, "en": q.end, "lim": q.limit
    }).result_rows

    data = [Bar(ts=r[0], open=float(r[1]), high=float(r[2]), low=float(r[3]), close=float(r[4]), volume=int(r[5])) for r in rows]
    return OhlcvResponse(symbol=q.symbol, interval=q.interval, rows=len(data), data=data)
