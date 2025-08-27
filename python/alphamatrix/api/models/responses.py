from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Bar(BaseModel):
    ts: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

class OhlcvResponse(BaseModel):
    symbol: str
    interval: str
    rows: int
    data: List[Bar]

class JobStatus(BaseModel):
    run_id: str
    status: str           # queued|running|succeeded|failed
    detail: Optional[str] = None
    rows_processed: Optional[int] = None

class BulkJobStatus(BaseModel):
    run_ids: List[str]
    status: str = "queued"