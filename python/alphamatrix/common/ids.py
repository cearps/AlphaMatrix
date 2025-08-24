"""
Shared ID generation utilities for AlphaMatrix.
"""
import uuid
from datetime import datetime

def new_run_id() -> str:
    """
    Generate a new unique run ID.
    
    Returns:
        A unique string identifier for ETL runs
    """
    return str(uuid.uuid4())

def new_run_id_with_timestamp() -> str:
    """
    Generate a new run ID with timestamp prefix.
    
    Returns:
        A unique string identifier with timestamp prefix
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{uuid.uuid4().hex[:8]}"
