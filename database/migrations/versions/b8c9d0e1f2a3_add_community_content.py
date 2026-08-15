"""add community information & safety content tables

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-14 12:00:00.000000

Adds the Panchayat-managed Community Information & Safety layer:
- schemes (government scheme listings)
- community_notices (Panchayat announcements / local news)
- safety_resources (drug awareness, community safety, women's safety)

Also extends the notification_type enum with community/safety notification
kinds. The physical emergency-button workflow is intentionally NOT part of this
migration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend notification_type enum (postgres cannot drop enum values later).
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community_notice'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'scheme_update'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'safety_notice'")

    # 2. Schemes table
    op.create_table(
        "schemes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category", sa.Enum("education", "health", "agriculture", "housing", "livelihood", "womens_empowerment", "pension", "water_sanitation", "disaster_relief", "other", name="scheme_category"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=False),
        sa.Column("detailed_description", sa.Text(), nullable=True),
        sa.Column("eligibility", sa.Text(), nullable=True),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column("required_documents", sa.Text(), nullable=True),
        sa.Column("application_instructions", sa.Text(), nullable=True),
        sa.Column("official_url", sa.String(length=500), nullable=True),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("village_id", sa.Integer(), nullable=True),
        sa.Column("target_groups", sa.String(length=255), nullable=True),
        sa.Column("status", sa.Enum("draft", "published", "archived", name="scheme_status"), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("original_language", sa.String(length=8), server_default=sa.text("'en'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_schemes_created_by_users"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["village_id"], ["villages.id"], name=op.f("fk_schemes_village_id_villages"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schemes")),
    )
    op.create_index(op.f("ix_schemes_village_id"), "schemes", ["village_id"], unique=False)

    # 3. Community notices table (also reuses the publish_status enum created
    #    when the safety_resources table below is created, so publish_status is
    #    defined inline and shared across both tables by name).
    op.create_table(
        "community_notices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("notice_type", sa.Enum("announcement", "news", "notice", name="notice_type"), nullable=False),
        sa.Column("source_type", sa.Enum("panchayat", "external", name="notice_source"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=80), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("village_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.Enum("draft", "published", name="publish_status"), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("original_language", sa.String(length=8), server_default=sa.text("'en'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_community_notices_created_by_users"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["village_id"], ["villages.id"], name=op.f("fk_community_notices_village_id_villages"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_community_notices")),
    )
    op.create_index(op.f("ix_community_notices_village_id"), "community_notices", ["village_id"], unique=False)

    # 4. Safety resources table
    op.create_table(
        "safety_resources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("section", sa.Enum("womens_safety", "drug_awareness", "community_safety", name="safety_section"), nullable=False),
        sa.Column("resource_type", sa.Enum("article", "notice", "help_resource", name="safety_resource_type"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("external_url", sa.String(length=500), nullable=True),
        sa.Column("contact_label", sa.String(length=120), nullable=True),
        sa.Column("contact_phone", sa.String(length=40), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("village_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.Enum("draft", "published", name="publish_status"), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("original_language", sa.String(length=8), server_default=sa.text("'en'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_safety_resources_created_by_users"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["village_id"], ["villages.id"], name=op.f("fk_safety_resources_village_id_villages"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_safety_resources")),
    )
    op.create_index(op.f("ix_safety_resources_village_id"), "safety_resources", ["village_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_safety_resources_village_id"), table_name="safety_resources")
    op.drop_table("safety_resources")
    op.drop_index(op.f("ix_community_notices_village_id"), table_name="community_notices")
    op.drop_table("community_notices")
    op.drop_index(op.f("ix_schemes_village_id"), table_name="schemes")
    op.drop_table("schemes")

    # PostgreSQL enum types created for the new tables.
    for enum_name in (
        "safety_resource_type",
        "safety_section",
        "publish_status",
        "notice_source",
        "notice_type",
        "scheme_status",
        "scheme_category",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")

    # note: notification_type enum values (community_notice, scheme_update,
    # safety_notice) cannot be dropped in PostgreSQL; they remain unused.
