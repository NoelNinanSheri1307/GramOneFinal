"""Logging configuration for the backend."""
import logging

from .config import Settings

_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"


def configure_logging(settings: Settings) -> None:
    level: int = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(level=level, format=_FORMAT)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)