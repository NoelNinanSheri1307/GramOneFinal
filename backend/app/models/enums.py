"""Domain enums for GramOne.

Application state and category values live in one place so the database, the
API contracts and the deterministic engines share the same vocabulary. Values
are stored in PostgreSQL as native ENUM types using each member's ``.value``.
"""
from enum import Enum


class UserRole(str, Enum):
    """The principal actors on the platform."""

    CITIZEN = "citizen"
    PANCHAYAT = "panchayat"
    PANCHAYAT_EMPLOYEE = "panchayat_employee"
    CSR = "csr"


class AppRole(str, Enum):
    """Internal/system roles (extend as needed, e.g. admin)."""

    SYSTEM = "system"


class IssueCategory(str, Enum):
    """Top-level domain for a problem report."""

    WATER = "water"
    SANITATION = "sanitation"
    EDUCATION = "education"
    AGRICULTURE = "agriculture"
    CIVIC = "civic"
    WASTE = "waste"
    HEALTH = "health"
    DISASTER = "disaster"
    ENVIRONMENT = "environment"
    OTHER = "other"


class IssueSource(str, Enum):
    """How an issue entered the platform."""

    CITIZEN = "citizen"
    PANCHAYAT = "panchayat"
    HARDWARE = "hardware"
    SYSTEM = "system"


class IssueStatus(str, Enum):
    """Lifecycle states of an Issue. State transitions are enforced by a
    future workflow engine, not by the schema."""

    REPORTED = "reported"
    AI_PROCESSED = "ai_processed"
    CORRELATED = "correlated"
    VERIFIED = "verified"
    PRIORITIZED = "prioritized"
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    FIELD_COMPLETED = "field_completed"
    RESOLVED = "resolved"
    IMPACT_VERIFIED = "impact_verified"


class EvidenceType(str, Enum):
    """The kind of evidence attached to an Issue."""

    CITIZEN_REPORT = "citizen_report"
    MULTIPLE_CITIZEN_REPORTS = "multiple_citizen_reports"
    PANCHAYAT_VERIFICATION = "panchayat_verification"
    HARDWARE_TELEMETRY = "hardware_telemetry"
    UPLOADED_IMAGE = "uploaded_image"
    BEFORE_FIELD_IMAGE = "before_field_image"
    AFTER_FIELD_IMAGE = "after_field_image"
    FIELD_INSPECTION_NOTE = "field_inspection_note"
    RELATED_ISSUE = "related_issue"


class ImpactCaseStatus(str, Enum):
    """Lifecycle states of an Impact Case."""

    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PRIORITIZED = "prioritized"
    SPONSORED = "sponsored"
    RESOLVED = "resolved"
    IMPACT_VERIFIED = "impact_verified"


class ProjectStatus(str, Enum):
    """Lifecycle states of a Project."""

    CREATED = "created"
    OPEN_FOR_COLLABORATION = "open_for_collaboration"
    SPONSORED = "sponsored"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    IMPACT_VERIFIED = "impact_verified"


class SponsorshipStatus(str, Enum):
    """Lifecycle states of a Sponsorship funding commitment."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DeviceType(str, Enum):
    """Kinds of physical GramOne nodes."""

    WATER_NODE = "water_node"
    RFID_NODE = "rfid_node"
    WASTE_NODE = "waste_node"
    ENVIRONMENT_NODE = "environment_node"


class NotificationType(str, Enum):
    """Kinds of system notifications."""

    INFO = "info"
    ISSUE_STATUS = "issue_status"
    IMPACT_UPDATE = "impact_update"
    PROJECT_UPDATE = "project_update"
    SPONSORSHIP_UPDATE = "sponsorship_update"
    EMPLOYEE_ASSIGNED = "employee_assigned"
    ASSIGNMENT_CHANGED = "assignment_changed"
    URGENT_ISSUE = "urgent_issue"
    EMERGENCY_ISSUE = "emergency_issue"
    FIELD_WORK_COMPLETED = "field_work_completed"
    PANCHAYAT_VERIFICATION_REQUIRED = "panchayat_verification_required"
    COMMUNITY_NOTICE = "community_notice"
    SCHEME_UPDATE = "scheme_update"
    SAFETY_NOTICE = "safety_notice"


class SchemeStatus(str, Enum):
    """Lifecycle states of a Panchayat-managed government scheme listing."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SchemeCategory(str, Enum):
    """Domain category of a government scheme listing."""

    EDUCATION = "education"
    HEALTH = "health"
    AGRICULTURE = "agriculture"
    HOUSING = "housing"
    LIVELIHOOD = "livelihood"
    WOMENS_EMPOWERMENT = "womens_empowerment"
    PENSION = "pension"
    WATER_SANITATION = "water_sanitation"
    DISASTER_RELIEF = "disaster_relief"
    OTHER = "other"


class PublishStatus(str, Enum):
    """Draft/published lifecycle shared by community content."""

    DRAFT = "draft"
    PUBLISHED = "published"


class NoticeType(str, Enum):
    """Kinds of community notices / local news items."""

    ANNOUNCEMENT = "announcement"
    NEWS = "news"
    NOTICE = "notice"


class NoticeSource(str, Enum):
    """Where a community notice originates. External items are only ever
    references — GramOne never fabricates live external news."""

    PANCHAYAT = "panchayat"
    EXTERNAL = "external"


class SafetySection(str, Enum):
    """Top-level section of the Community Safety layer."""

    WOMENS_SAFETY = "womens_safety"
    DRUG_AWARENESS = "drug_awareness"
    COMMUNITY_SAFETY = "community_safety"


class SafetyResourceType(str, Enum):
    """Kinds of safety/awareness content."""

    ARTICLE = "article"
    NOTICE = "notice"
    HELP_RESOURCE = "help_resource"