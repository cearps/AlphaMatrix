import logging
import sys
from typing import Optional

_LOGGING_INITIALIZED = False

def init_logging(level: str = "INFO"):
    global _LOGGING_INITIALIZED
    if _LOGGING_INITIALIZED:
        return
    root = logging.getLogger()
    root.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    handler.setFormatter(formatter)
    root.handlers = [handler]
    _LOGGING_INITIALIZED = True

def get_logger(name: Optional[str] = None) -> logging.Logger:
    return logging.getLogger(name if name else __name__)
