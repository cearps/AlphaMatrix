from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OhlcvQuery(BaseModel):
    symbol: str
    interval: str = Field("1d", description="1m/5m/1h/1d/1wk/1mo")
    start: datetime
    end: datetime
    limit: int = 200000
    aggregate: Optional[str] = Field(default=None, description="none|minute|hour|day")

class BackfillRequest(BaseModel):
    symbol: str
    interval: str = "1d"
    start: datetime
    end: datetime
    exchange: Optional[str] = None
    dry_run: bool = False

class IncrementalRequest(BaseModel):
    symbol: str
    interval: str = "1d"
    lookback_days: int = 7
    exchange: Optional[str] = None
    dry_run: bool = False
