"""Project endpoints.

Projects are the fundable execution unit tied to an Impact Case. Panchayat
users create and manage them; CSR users sponsor them.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.errors import GramOneError
from app.db.session import get_db
from app.models import ImpactCase, Project, Sponsorship, User, Village
from app.models.enums import ProjectStatus, SponsorshipStatus, UserRole
from app.schemas.csr import ProjectBrief, ProjectUpdate
from app.services.csr import CSRService

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise GramOneError(
            code="project_not_found", message="Project not found.", status_code=404
        )
    return project


@router.get("", response_model=None)
def list_projects(
    status: ProjectStatus | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    stmt = select(Project)
    if status is not None:
        stmt = stmt.where(Project.status == status)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    limit_value = min(limit or 20, 100)
    rows = db.scalars(
        stmt.order_by(Project.updated_at.desc()).offset(offset).limit(limit_value)
    ).all()
    items = [CSRService(db)._project_brief(p) for p in rows]
    return {"items": items, "total": total}


@router.post("", response_model=ProjectBrief, status_code=201)
def create_project(
    payload: dict,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> ProjectBrief:
    name = (payload.get("name") or "").strip()
    if not name:
        raise GramOneError(
            code="invalid_project", message="Project name is required.", status_code=400
        )
    impact_case = db.get(ImpactCase, payload.get("impact_case_id"))
    if impact_case is None:
        raise GramOneError(
            code="impact_case_not_found", message="Impact Case not found.", status_code=404
        )
    village_id = payload.get("village_id") or impact_case.village_id
    if village_id is None:
        raise GramOneError(
            code="invalid_project",
            message="A village is required for the project.",
            status_code=400,
        )
    if db.get(Village, village_id) is None:
        raise GramOneError(
            code="invalid_project", message=f"Village {village_id} does not exist.", status_code=400
        )
    project = Project(
        name=name,
        description=payload.get("description"),
        impact_case_id=impact_case.id,
        village_id=village_id,
        estimated_budget=payload.get("estimated_budget"),
        status=ProjectStatus.CREATED,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return CSRService(db)._project_brief(project)


@router.get("/{project_id}", response_model=ProjectBrief)
def get_project(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectBrief:
    project = _get_or_404(db, project_id)
    return CSRService(db)._project_brief(project)


@router.patch("/{project_id}", response_model=ProjectBrief)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> ProjectBrief:
    project = _get_or_404(db, project_id)
    if payload.status is not None:
        project.status = payload.status
        if payload.status == ProjectStatus.COMPLETED:
            from datetime import datetime, timezone

            project.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    return CSRService(db)._project_brief(project)