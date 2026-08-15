"""SQLAlchemy models for the GramOne core domain.

The declarative base and every model are exported here so imports keep working
under both ``import app.models`` and ``from app.models import User``. Alembic
imports this package (via ``database/migrations/env.py``) so autogenerate sees
the full schema.
"""
from app.models.attendance import Attendance
from app.models.community import CommunityNotice, SafetyResource, Scheme
from app.models.device import Device, Telemetry
from app.models.enums import (
    AppRole,
    DeviceType,
    EvidenceType,
    ImpactCaseStatus,
    IssueCategory,
    IssueSource,
    IssueStatus,
    NoticeSource,
    NoticeType,
    NotificationType,
    ProjectStatus,
    PublishStatus,
    SafetyResourceType,
    SafetySection,
    SchemeCategory,
    SchemeStatus,
    SponsorshipStatus,
    UserRole,
)
from app.models.impact import ImpactCase, ImpactScore
from app.models.issue import Issue, IssueEvidence, IssueHistory
from app.models.notification import Notification
from app.models.project import CSRMatch, CSRProfile, Project, Sponsorship
from app.models.translation import ContentTranslation
from app.models.user import User
from app.models.village import Village

__all__ = [
    "AppRole",
    "Attendance",
    "Base",
    "CommunityNotice",
    "ContentTranslation",
    "CSRMatch",
    "CSRProfile",
    "Device",
    "DeviceType",
    "EvidenceType",
    "ImpactCase",
    "ImpactCaseStatus",
    "ImpactScore",
    "Issue",
    "IssueCategory",
    "IssueEvidence",
    "IssueHistory",
    "IssueSource",
    "IssueStatus",
    "NoticeSource",
    "NoticeType",
    "Notification",
    "NotificationType",
    "Project",
    "ProjectStatus",
    "PublishStatus",
    "SafetyResource",
    "SafetyResourceType",
    "SafetySection",
    "Scheme",
    "SchemeCategory",
    "SchemeStatus",
    "Sponsorship",
    "SponsorshipStatus",
    "Telemetry",
    "User",
    "UserRole",
    "Village",
]