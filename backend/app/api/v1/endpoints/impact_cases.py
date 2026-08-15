"""Impact Case workflow endpoints.

Manual/deterministic creation from related Issues by Panchayat users, with a
basic case lifecycle. Automatic correlation arrives with the Correlation Engine
milestone.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import User
from app.models.enums import ImpactCaseStatus, IssueCategory, UserRole
from app.schemas.impact_case import (
    ImpactCaseCreate,
    ImpactCaseListResponse,
    ImpactCaseResponse,
    ImpactCaseUpdate,
)
from app.services.impact_cases import ImpactCaseService

router = APIRouter(prefix="/impact-cases", tags=["impact-cases"])


@router.post("", response_model=ImpactCaseResponse, status_code=201)
def create_impact_case(
    payload: ImpactCaseCreate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> ImpactCaseResponse:
    return ImpactCaseService(db).create(user, payload)


@router.get("", response_model=ImpactCaseListResponse)
def list_impact_cases(
    village_id: int | None = Query(default=None),
    category: IssueCategory | None = Query(default=None),
    status: ImpactCaseStatus | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImpactCaseListResponse:
    return ImpactCaseService(db).list(
        user,
        village_id=village_id,
        category=category,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/{case_id}", response_model=ImpactCaseResponse)
def get_impact_case(
    case_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImpactCaseResponse:
    return ImpactCaseService(db).get(case_id, user)


@router.patch("/{case_id}", response_model=ImpactCaseResponse)
def update_impact_case(
    case_id: int,
    payload: ImpactCaseUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> ImpactCaseResponse:
    return ImpactCaseService(db).update(case_id, user, payload)