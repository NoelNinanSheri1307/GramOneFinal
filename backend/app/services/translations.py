"""TranslationService — cached dynamic-content translation.

Original user-generated content is never modified. Translated variants of a
dynamic field are cached in ``content_translations`` keyed by
``(entity_type, entity_id, field_name, source_language, target_language)`` so
the same content is translated at most once and can be recovered at any time.

Fallback contract:
- translation cached -> return it;
- translation missing -> translate via the AI provider, cache, return;
- provider unavailable/fails -> return ``None`` (caller shows the original).
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ContentTranslation

logger = logging.getLogger(__name__)

#: Languages the UI can display content in (matches web/src/i18n).
SUPPORTED_CONTENT_LANGUAGES = {
    "en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa", "or", "as", "ur"
}


class TranslationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def build_localized(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        original_text: str | None,
        original_language: str | None = None,
        translations: dict[str, str] | None = None,
    ) -> str | dict[str, str] | None:
        """Assemble a ``{language: text}`` map from cached translations.

        Returns the plain original string when nothing is translated yet so
        existing clients that expect plain strings keep working. ``translations``
        may be a preloaded ``{target_language: text}`` map to avoid re-querying.
        """
        if original_text is None:
            return None
        if translations is None:
            translations = self.load_translation_map(
                entity_type, [entity_id], field_name
            ).get(entity_id, {})
        if not translations:
            return original_text
        return {(original_language or "en"): original_text, **translations}

    def load_translation_map(
        self, entity_type: str, entity_ids: list[int], field_name: str
    ) -> dict[int, dict[str, str]]:
        """Return ``{entity_id: {target_language: text}}`` for a batch of ids."""
        ids = [entity_id for entity_id in entity_ids if entity_id is not None]
        if not ids:
            return {}
        rows = self.db.scalars(
            select(ContentTranslation).where(
                ContentTranslation.entity_type == entity_type,
                ContentTranslation.entity_id.in_(ids),
                ContentTranslation.field_name == field_name,
            )
        ).all()
        result: dict[int, dict[str, str]] = {}
        for row in rows:
            result.setdefault(row.entity_id, {})[row.target_language] = row.translated_text
        return result

    def store(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        source_language: str,
        translations: dict[str, str],
    ) -> None:
        """Upsert a ``{target_language: text}`` map for a field."""
        if not translations:
            return
        for target, text in translations.items():
            target = target.lower()
            if target == source_language or not text or not text.strip():
                continue
            existing = self.db.scalar(
                select(ContentTranslation).where(
                    ContentTranslation.entity_type == entity_type,
                    ContentTranslation.entity_id == entity_id,
                    ContentTranslation.field_name == field_name,
                    ContentTranslation.source_language == source_language,
                    ContentTranslation.target_language == target,
                )
            )
            if existing is not None:
                existing.translated_text = text
            else:
                self.db.add(
                    ContentTranslation(
                        entity_type=entity_type,
                        entity_id=entity_id,
                        field_name=field_name,
                        source_language=source_language,
                        target_language=target,
                        translated_text=text,
                    )
                )
        self.db.commit()

    def clear_field(self, entity_type: str, entity_id: int, field_name: str) -> None:
        """Drop cached translations for a field (used when the original changes).

        Does not commit; the caller's transaction commit persists the deletion.
        """
        rows = self.db.scalars(
            select(ContentTranslation).where(
                ContentTranslation.entity_type == entity_type,
                ContentTranslation.entity_id == entity_id,
                ContentTranslation.field_name == field_name,
            )
        ).all()
        for row in rows:
            self.db.delete(row)

    def get_cached(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        source_language: str,
        target_language: str,
    ) -> str | None:
        row = self.db.scalar(
            select(ContentTranslation).where(
                ContentTranslation.entity_type == entity_type,
                ContentTranslation.entity_id == entity_id,
                ContentTranslation.field_name == field_name,
                ContentTranslation.source_language == source_language,
                ContentTranslation.target_language == target_language,
            )
        )
        return row.translated_text if row is not None else None

    async def ensure_translation(
        self,
        provider,
        entity_type: str,
        entity_id: int,
        field_name: str,
        source_language: str,
        target_language: str,
        original_text: str | None,
    ) -> str | None:
        """Return a cached translation, translating + caching on a miss.

        Never raises: on provider failure it logs and returns ``None`` so the
        UI gracefully falls back to the original text.
        """
        if not original_text or not original_text.strip():
            return None
        if source_language == target_language:
            return original_text
        cached = self.get_cached(
            entity_type, entity_id, field_name, source_language, target_language
        )
        if cached:
            return cached
        try:
            translated = await provider.translate(
                original_text, source_language, target_language
            )
        except Exception as exc:  # noqa: BLE001 - graceful fallback contract
            logger.warning(
                "Translation failed %s->%s for %s:%s:%s (%s): %s",
                source_language,
                target_language,
                entity_type,
                entity_id,
                field_name,
                type(exc).__name__,
                str(exc),
            )
            return None
        if not translated or not translated.strip():
            return None
        self.store(
            entity_type,
            entity_id,
            field_name,
            source_language,
            {target_language: translated},
        )
        return translated
