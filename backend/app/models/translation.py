"""ContentTranslation: cached translations for dynamic user-generated content.

Original content is never overwritten. Translated variants of a dynamic field
(issue title/description, evidence description, history note, impact case
title/summary, village name, ...) are stored as separate rows keyed by
``(entity_type, entity_id, field_name, source_language, target_language)`` so
the original text, the translated text, the source language and the target
language stay explicitly separated and recoverable.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContentTranslation(Base):
    __tablename__ = "content_translations"
    __table_args__ = (
        UniqueConstraint(
            "entity_type",
            "entity_id",
            "field_name",
            "source_language",
            "target_language",
            name="uq_content_translations_lookup",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[int] = mapped_column(nullable=False)
    field_name: Mapped[str] = mapped_column(String(40), nullable=False)
    source_language: Mapped[str] = mapped_column(String(8), nullable=False)
    target_language: Mapped[str] = mapped_column(String(8), nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
