"""Issue workflow endpoints.

Citizen reporting, retrieval/list, controlled updates and evidence/history.
Source and reporter are set server-side; clients cannot forge them.
"""
from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.models.enums import IssueCategory, IssueSource, IssueStatus
from app.schemas.ai import InterpretRequest
from app.schemas.issue import (
    EvidenceCreate,
    EvidenceResponse,
    IssueCreate,
    IssueHistoryResponse,
    IssueListResponse,
    IssueResponse,
    IssueUpdate,
)
from app.services.ai import AIProvider, get_ai_provider
from app.services.ai.contracts import IssueInterpretation
from app.services.ai_interpretation import AIIssueInterpretationService
from app.services.issue_evidence import EvidenceService
from app.services.issues import IssueService
from app.services.storage import StorageService

router = APIRouter(prefix="/issues", tags=["issues"])


@router.post("/upload-photo")
def upload_evidence_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Upload a real evidence photo file (JPEG/PNG/WEBP up to 10MB)."""
    storage = StorageService()
    relative_path = storage.upload_file(file, folder="evidence")
    return {
        "source_reference": relative_path,
        "filename": file.filename or "uploaded_photo.jpg",
        "url": f"/api/v1/issues/evidence-file/{relative_path}",
    }


@router.get("/evidence-file/{folder}/{filename}")
def get_evidence_file(
    folder: str,
    filename: str,
    user: User = Depends(get_current_user),
) -> FileResponse:
    """Safely stream stored evidence photo file to authenticated users."""
    storage = StorageService()
    path = storage.get_file_path(f"{folder}/{filename}")
    return FileResponse(path)


@router.post("", response_model=IssueResponse, status_code=201)
def create_issue(
    payload: IssueCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueResponse:
    return IssueService(db).create_issue(user, payload)


@router.get("", response_model=IssueListResponse)
def list_issues(
    village_id: int | None = Query(default=None),
    category: IssueCategory | None = Query(default=None),
    status: IssueStatus | None = Query(default=None),
    source: IssueSource | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueListResponse:
    return IssueService(db).list_issues(
        user,
        village_id=village_id,
        category=category,
        status=status,
        source=source,
        limit=limit,
        offset=offset,
    )


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(
    issue_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueResponse:
    return IssueService(db).get_issue(issue_id, user)


@router.patch("/{issue_id}", response_model=IssueResponse)
def update_issue(
    issue_id: int,
    payload: IssueUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueResponse:
    return IssueService(db).update_issue(issue_id, user, payload)


@router.get("/{issue_id}/evidence", response_model=list[EvidenceResponse])
def list_evidence(
    issue_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EvidenceResponse]:
    return EvidenceService(db).list(issue_id, user)


@router.post("/{issue_id}/evidence", response_model=EvidenceResponse, status_code=201)
def create_evidence(
    issue_id: int,
    payload: EvidenceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    return EvidenceService(db).create(issue_id, user, payload)


@router.get("/{issue_id}/history", response_model=list[IssueHistoryResponse])
def issue_history(
    issue_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[IssueHistoryResponse]:
    return IssueService(db).list_history(issue_id, user)


@router.post("/interpret", response_model=IssueInterpretation)
async def interpret_issue(
    payload: InterpretRequest,
    user: User = Depends(get_current_user),
    provider: AIProvider = Depends(get_ai_provider),
) -> IssueInterpretation:
    """AI-assisted interpretation of a natural-language report.

    Returns a validated interpretation only — no Issue is created. The client
    shows the citizen what GramOne understood before final submission.
    """
    return await AIIssueInterpretationService(provider).interpret(payload.text, payload.language)


@router.post("/from-interpretation", response_model=IssueResponse, status_code=201)
def create_issue_from_interpretation(
    payload: IssueInterpretation,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueResponse:
    """Create an Issue from a confirmed, validated interpretation.

    Uses the existing IssueService; the interpretation schema is strict
    (extra=forbid) so arbitrary fields cannot be smuggled through.
    """
    return AIIssueInterpretationService(get_ai_provider()).create_from_interpretation(
        user, payload, db
    )


class AssignPayload(BaseModel):
    employee_id: str | int


@router.post("/{issue_id}/assign", response_model=IssueResponse)
def assign_issue(
    issue_id: int,
    payload: AssignPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IssueResponse:
    raw_id = payload.employee_id
    if isinstance(raw_id, int):
        parsed_id = raw_id
    else:
        import re
        match = re.search(r'\d+', str(raw_id))
        if match:
            parsed_id = int(match.group())
        else:
            from app.core.errors import GramOneError
            raise GramOneError(
                code="invalid_employee_id",
                message="Employee ID must contain an integer reference.",
                status_code=400,
            )
    
    from app.schemas.issue import IssueUpdate
    update_payload = IssueUpdate(assigned_to=parsed_id, status=IssueStatus.ASSIGNED)
    return IssueService(db).update_issue(issue_id, user, update_payload)