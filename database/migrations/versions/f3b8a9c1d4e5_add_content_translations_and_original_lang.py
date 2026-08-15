"""add content translations and original_language columns

Revision ID: f3b8a9c1d4e5
Revises: e457a57f8afe
Create Date: 2026-08-13 12:00:00.000000

Adds the content translation cache table and records the language each
dynamic piece of user content was authored in. Original content columns are
never touched; translated variants live only in content_translations.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f3b8a9c1d4e5"
down_revision: Union[str, None] = "e457a57f8afe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_translations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("field_name", sa.String(length=40), nullable=False),
        sa.Column("source_language", sa.String(length=8), nullable=False),
        sa.Column("target_language", sa.String(length=8), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_translations")),
        sa.UniqueConstraint(
            "entity_type",
            "entity_id",
            "field_name",
            "source_language",
            "target_language",
            name=op.f("uq_content_translations_lookup"),
        ),
    )
    op.create_index(
        op.f("ix_content_translations_entity_type"),
        "content_translations",
        ["entity_type", "field_name"],
        unique=False,
    )
    op.add_column(
        "issues", sa.Column("original_language", sa.String(length=8), nullable=True)
    )
    op.add_column(
        "impact_cases", sa.Column("original_language", sa.String(length=8), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("impact_cases", "original_language")
    op.drop_column("issues", "original_language")
    op.drop_index(op.f("ix_content_translations_entity_type"), table_name="content_translations")
    op.drop_table("content_translations")