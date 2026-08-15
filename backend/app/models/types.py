"""Reusable column type helpers for GramOne models."""
from sqlalchemy import Enum as SAEnum


def db_enum(enum_cls: type, name: str) -> SAEnum:
    """Map a Python enum to a native PostgreSQL ENUM type.

    Values are persisted and compared using each member's ``.value`` (e.g.
    ``reported`` rather than ``REPORTED``) and the ordering/typing lives in the
    database, so application state vocabularies are explicit everywhere.
    """
    return SAEnum(
        enum_cls,
        name=name,
        native_enum=True,
        values_callable=lambda obj: [member.value for member in obj],
    )