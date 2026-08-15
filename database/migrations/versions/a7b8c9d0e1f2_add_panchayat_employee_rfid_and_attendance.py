"""add panchayat_employee role, rfid_card_id, attendances table, and enum updates

Revision ID: a7b8c9d0e1f2
Revises: f3b8a9c1d4e5
Create Date: 2026-08-13 13:00:00.000000

Adds PANCHAYAT_EMPLOYEE role, rfid_card_id to users table, attendances table for RFID sign-in,
and updates postgres enum values for user_role, issue_category, issue_status, evidence_type,
device_type, and notification_type.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "f3b8a9c1d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add rfid_card_id to users
    op.add_column("users", sa.Column("rfid_card_id", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_users_rfid_card_id", "users", ["rfid_card_id"])
    op.create_index("ix_users_rfid_card_id", "users", ["rfid_card_id"])

    # 2. Create attendances table
    op.create_table(
        "attendances",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rfid_card_id", sa.String(length=64), nullable=False),
        sa.Column("village_id", sa.Integer(), nullable=True),
        sa.Column("sign_in_time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("sign_out_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["village_id"], ["villages.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attendances_user_id", "attendances", ["user_id"])
    op.create_index("ix_attendances_rfid_card_id", "attendances", ["rfid_card_id"])
    op.create_index("ix_attendances_village_id", "attendances", ["village_id"])
    op.create_index("ix_attendances_sign_in_time", "attendances", ["sign_in_time"])


def downgrade() -> None:
    op.drop_index("ix_attendances_sign_in_time", table_name="attendances")
    op.drop_index("ix_attendances_village_id", table_name="attendances")
    op.drop_index("ix_attendances_rfid_card_id", table_name="attendances")
    op.drop_index("ix_attendances_user_id", table_name="attendances")
    op.drop_table("attendances")
    op.drop_index("ix_users_rfid_card_id", table_name="users")
    op.drop_constraint("uq_users_rfid_card_id", "users", type_="unique")
    op.drop_column("users", "rfid_card_id")
