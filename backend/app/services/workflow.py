"""State-transition validation for the core GramOne workflow.

Explicit and small on purpose: the full workflow/state-machine framework is a
later milestone. IMPACT_VERIFIED transitions are deliberately not allowed yet —
impact verification arrives with a future milestone.
"""
from app.core.errors import GramOneError
from app.models.enums import ImpactCaseStatus, IssueStatus

ISSUE_TRANSITIONS: dict[IssueStatus, set[IssueStatus]] = {
    IssueStatus.REPORTED: {IssueStatus.VERIFIED, IssueStatus.OPEN, IssueStatus.ASSIGNED},
    IssueStatus.VERIFIED: {IssueStatus.OPEN, IssueStatus.ASSIGNED},
    IssueStatus.OPEN: {IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS},
    IssueStatus.ASSIGNED: {IssueStatus.IN_PROGRESS},
    IssueStatus.IN_PROGRESS: {IssueStatus.FIELD_COMPLETED, IssueStatus.RESOLVED},
    IssueStatus.FIELD_COMPLETED: {IssueStatus.RESOLVED, IssueStatus.IN_PROGRESS},
    IssueStatus.RESOLVED: set(),
}

IMPACT_CASE_TRANSITIONS: dict[ImpactCaseStatus, set[ImpactCaseStatus]] = {
    ImpactCaseStatus.OPEN: {ImpactCaseStatus.ASSIGNED},
    ImpactCaseStatus.ASSIGNED: {ImpactCaseStatus.IN_PROGRESS, ImpactCaseStatus.SPONSORED},
    ImpactCaseStatus.IN_PROGRESS: {ImpactCaseStatus.SPONSORED, ImpactCaseStatus.RESOLVED},
    ImpactCaseStatus.SPONSORED: {ImpactCaseStatus.RESOLVED},
    ImpactCaseStatus.RESOLVED: set(),
}


def validate_issue_transition(current: IssueStatus, new: IssueStatus) -> None:
    allowed = ISSUE_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise GramOneError(
            code="invalid_status_transition",
            message=f"Cannot move issue from '{current.value}' to '{new.value}'.",
            status_code=400,
        )


def validate_impact_case_transition(
    current: ImpactCaseStatus, new: ImpactCaseStatus
) -> None:
    allowed = IMPACT_CASE_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise GramOneError(
            code="invalid_status_transition",
            message=f"Cannot move impact case from '{current.value}' to '{new.value}'.",
            status_code=400,
        )