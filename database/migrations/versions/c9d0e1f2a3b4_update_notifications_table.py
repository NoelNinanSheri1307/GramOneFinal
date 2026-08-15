"""update notifications table: add payload column and missing enum values

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-08-14 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add missing notification_type values to the enum
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'employee_assigned'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'assignment_changed'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'urgent_issue'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'emergency_issue'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'field_work_completed'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'panchayat_verification_required'")

    # 2. Add payload JSONB column to notifications
    op.add_column("notifications", sa.Column("payload", JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("notifications", "payload")
