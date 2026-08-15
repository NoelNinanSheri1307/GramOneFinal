"""add_csr_support_types_and_domains

Revision ID: b7b41b9c7e0b
Revises: c9d0e1f2a3b4
Create Date: 2026-08-14 15:36:44.885481

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7b41b9c7e0b'
down_revision: Union[str, None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('csr_profiles', sa.Column('preferred_support_types', sa.ARRAY(sa.String(length=40)), nullable=True))
    op.add_column('csr_profiles', sa.Column('preferred_domains', sa.ARRAY(sa.String(length=40)), nullable=True))
    op.add_column('sponsorships', sa.Column('support_type', sa.String(length=40), nullable=True))


def downgrade() -> None:
    op.drop_column('sponsorships', 'support_type')
    op.drop_column('csr_profiles', 'preferred_domains')
    op.drop_column('csr_profiles', 'preferred_support_types')