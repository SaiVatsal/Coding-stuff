"""
Structured Logging Utility
"""

import sys
import logging
from datetime import datetime, timezone


class EyefindFormatter(logging.Formatter):
    COLORS = {
        logging.DEBUG: "\033[36m",    # Cyan
        logging.INFO: "\033[32m",     # Green
        logging.WARNING: "\033[33m",  # Yellow
        logging.ERROR: "\033[31m",    # Red
        logging.CRITICAL: "\033[35m", # Magenta
    }
    RESET = "\033[0m"

    def format(self, record):
        iso_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        color = self.COLORS.get(record.levelno, self.RESET)
        level_name = f"[{record.levelname}]"
        prefix = f"\033[2m[{iso_time}]\033[0m {color}{level_name:<8}\033[0m \033[36m[Eyefind]\033[0m"
        return f"{prefix} {record.getMessage()}"


def setup_logger(name: str = "eyefind") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(EyefindFormatter())
        logger.addHandler(handler)

    logger.propagate = False
    return logger


logger = setup_logger()
