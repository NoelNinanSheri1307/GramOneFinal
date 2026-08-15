"""CSR workflow endpoints.

CSR organization profile, opportunity discovery over Impact Cases, deterministic
matching, and the Sponsorship lifecycle. Sponsorship creation is CSR-only;
confirmation/closure stays under Panchayat control.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_role, get_current_user
from app.db.session import get_db
from app.models import User
from app.models.enums import ImpactCaseStatus, UserRole
from app.core.errors import GramOneError
from app.schemas.csr import (
    CSRProfileResponse,
    CSRProfileUpdate,
    OpportunityItem,
    OpportunityListResponse,
    SponsorshipCreate,
    SponsorshipListResponse,
    SponsorshipResponse,
    SponsorshipStatusUpdate,
)
from app.services.csr import CSRService

router = APIRouter(prefix="/csr", tags=["csr"])

# ------------------------------------------------------------------- profile


@router.get("/me", response_model=CSRProfileResponse)
def get_csr_profile(
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> CSRProfileResponse:
    return CSRService(db).get_profile(user.id)


@router.patch("/me", response_model=CSRProfileResponse)
def update_csr_profile(
    payload: CSRProfileUpdate,
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> CSRProfileResponse:
    return CSRService(db).update_profile(user, payload)


# ------------------------------------------------------------- opportunities


@router.get("/opportunities", response_model=OpportunityListResponse)
def list_opportunities(
    village_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    status: ImpactCaseStatus | None = Query(default=None),
    state: str | None = Query(default=None),
    district: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=160),
    sort: str | None = Query(default=None, pattern="^(impact|recent)$"),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> OpportunityListResponse:
    service = CSRService(db)
    response = service.list_opportunities(
        user.id,
        village_id=village_id,
        category=category,
        status=status,
        state=state,
        district=district,
        q=q,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    if sort == "impact":
        response.items.sort(key=lambda item: item.impact_score.overall_score, reverse=True)
    return response


@router.get("/opportunities/{case_id}", response_model=OpportunityItem)
def get_opportunity(
    case_id: int,
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> OpportunityItem:
    return CSRService(db).get_opportunity(case_id, user.id)


@router.get("/matches")
def list_matches(
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> dict:
    return CSRService(db).list_matches(user.id)


# -------------------------------------------------------------- sponsorship


@router.post("/sponsorships", response_model=SponsorshipResponse, status_code=201)
def create_sponsorship(
    payload: SponsorshipCreate,
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> SponsorshipResponse:
    return CSRService(db).create_sponsorship(user, payload)


@router.get("/sponsorships", response_model=SponsorshipListResponse)
def list_sponsorships(
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> SponsorshipListResponse:
    return CSRService(db).list_sponsorships(user.id, limit, offset)


# Panchayat retains control over sponsorship confirmation/closure.
@router.patch("/sponsorships/{sponsorship_id}/status", response_model=SponsorshipResponse)
def update_sponsorship_status(
    sponsorship_id: int,
    payload: SponsorshipStatusUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> SponsorshipResponse:
    return CSRService(db).update_sponsorship_status(sponsorship_id, payload.status)


class SponsorPayload(BaseModel):
    impact_case_id: str | int
    amount: float


@router.post("/sponsor", response_model=SponsorshipResponse, status_code=201)
def sponsor_project_direct(
    payload: SponsorPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SponsorshipResponse:
    raw_id = payload.impact_case_id
    if isinstance(raw_id, int):
        parsed_id = raw_id
    else:
        import re
        match = re.search(r'\d+', str(raw_id))
        if match:
            parsed_id = int(match.group())
        else:
            raise GramOneError(
                code="invalid_impact_case_id",
                message="Impact case ID must contain an integer reference.",
                status_code=400,
            )
            
    from app.models.project import Project
    from app.models.impact import ImpactCase
    from app.models.enums import ProjectStatus
    
    project = db.scalar(select(Project).where(Project.impact_case_id == parsed_id))
    if project is None:
        case = db.get(ImpactCase, parsed_id)
        if case is None:
            raise GramOneError(
                code="impact_case_not_found",
                message="Impact case not found.",
                status_code=404,
            )
        project = Project(
            name=case.title,
            description=case.description,
            impact_case_id=case.id,
            village_id=case.village_id,
            estimated_budget=case.estimated_cost or 0,
            status=ProjectStatus.CREATED,
        )
        db.add(project)
        db.flush()
        
    sponsorship_payload = SponsorshipCreate(
        project_id=project.id,
        amount=payload.amount,
        support_type="financial",
        note="Sponsored via Mobile App"
    )
    return CSRService(db).create_sponsorship(user, sponsorship_payload)


# ------------------------------------------------------------- supported work


@router.get("/projects")
def list_supported_projects(
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> dict:
    items = CSRService(db).list_supported_projects(user.id)
    return {"items": items, "total": len(items)}


# ------------------------------------------------------------- notifications


@router.get("/notifications")
def list_notifications(
    limit: int | None = Query(default=20, ge=1, le=50),
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> dict:
    items = CSRService(db).list_notifications(user.id, limit)
    return {"items": items}


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    user: User = Depends(require_role(UserRole.CSR)),
    db: Session = Depends(get_db),
) -> dict:
    CSRService(db).mark_notification_read(user.id, notification_id)
    return {"ok": True}