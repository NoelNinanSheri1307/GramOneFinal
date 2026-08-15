"""Community Information & Safety endpoints.

Read endpoints serve published content to every authenticated user. Management
endpoints (create/update/publish/archive) are Panchayat-only and jurisdiction
scoped. Citizens can never modify Panchayat-managed content; CSR partners and
Panchayat employees have no management privileges here.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models import User
from app.models.enums import (
    NoticeSource,
    NoticeType,
    SafetyResourceType,
    SafetySection,
    SchemeCategory,
    SchemeStatus,
    UserRole,
)
from app.schemas.community import (
    NoticeCreate,
    NoticeListResponse,
    NoticeResponse,
    NoticeUpdate,
    SafetyResourceCreate,
    SafetyResourceListResponse,
    SafetyResourceResponse,
    SafetyResourceUpdate,
    SchemeCreate,
    SchemeListResponse,
    SchemeResponse,
    SchemeUpdate,
)
from app.services.community import CommunityService
from app.core.config import get_settings
from app.services.news_provider import NewsProviderService

router = APIRouter(prefix="/community", tags=["community"])


# --------------------------------------------------------------------------- #
# Government schemes
# --------------------------------------------------------------------------- #
@router.get("/schemes", response_model=SchemeListResponse)
def list_schemes(
    q: str | None = Query(default=None),
    category: SchemeCategory | None = Query(default=None),
    target_group: str | None = Query(default=None),
    state: str | None = Query(default=None),
    status: SchemeStatus | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SchemeListResponse:
    result = CommunityService(db).list_schemes(
        user,
        q=q,
        category=category,
        target_group=target_group,
        state=state,
        status=status,
        limit=limit or 20,
        offset=offset or 0,
    )
    return SchemeListResponse(**result)


@router.post("/schemes", response_model=SchemeResponse, status_code=201)
def create_scheme(
    payload: SchemeCreate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> SchemeResponse:
    return CommunityService(db).create_scheme(user, payload)


@router.get("/schemes/{scheme_id}", response_model=SchemeResponse)
def get_scheme(
    scheme_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SchemeResponse:
    return CommunityService(db).get_scheme(user, scheme_id)


@router.patch("/schemes/{scheme_id}", response_model=SchemeResponse)
def update_scheme(
    scheme_id: int,
    payload: SchemeUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> SchemeResponse:
    return CommunityService(db).update_scheme(user, scheme_id, payload)


# --------------------------------------------------------------------------- #
# Community notices / local news
# --------------------------------------------------------------------------- #
@router.get("/notices", response_model=NoticeListResponse)
def list_notices(
    q: str | None = Query(default=None),
    notice_type: NoticeType | None = Query(default=None),
    source_type: NoticeSource | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoticeListResponse:
    result = CommunityService(db).list_notices(
        user,
        q=q,
        notice_type=notice_type,
        source_type=source_type,
        category=category,
        limit=limit or 20,
        offset=offset or 0,
    )
    return NoticeListResponse(**result)


@router.get("/news")
def get_external_news(
    q: str | None = Query(default=None),
    language: str = Query(default="en"),
    category: str | None = Query(default=None),
    settings = Depends(get_settings),
):
    provider = NewsProviderService(settings)
    return provider.fetch_latest_news(q=q, language=language, category=category)


@router.post("/notices", response_model=NoticeResponse, status_code=201)
def create_notice(
    payload: NoticeCreate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    return CommunityService(db).create_notice(user, payload)


@router.get("/notices/{notice_id}", response_model=NoticeResponse)
def get_notice(
    notice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    return CommunityService(db).get_notice(user, notice_id)


@router.patch("/notices/{notice_id}", response_model=NoticeResponse)
def update_notice(
    notice_id: int,
    payload: NoticeUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> NoticeResponse:
    return CommunityService(db).update_notice(user, notice_id, payload)


# --------------------------------------------------------------------------- #
# Safety resources
# --------------------------------------------------------------------------- #
@router.get("/safety", response_model=SafetyResourceListResponse)
def list_safety_resources(
    section: SafetySection | None = Query(default=None),
    resource_type: SafetyResourceType | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
    offset: int | None = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SafetyResourceListResponse:
    result = CommunityService(db).list_safety_resources(
        user,
        section=section,
        resource_type=resource_type,
        q=q,
        limit=limit or 20,
        offset=offset or 0,
    )
    return SafetyResourceListResponse(**result)


@router.post("/safety", response_model=SafetyResourceResponse, status_code=201)
def create_safety_resource(
    payload: SafetyResourceCreate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> SafetyResourceResponse:
    return CommunityService(db).create_safety_resource(user, payload)


@router.get("/safety/{resource_id}", response_model=SafetyResourceResponse)
def get_safety_resource(
    resource_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SafetyResourceResponse:
    return CommunityService(db).get_safety_resource(user, resource_id)


@router.patch("/safety/{resource_id}", response_model=SafetyResourceResponse)
def update_safety_resource(
    resource_id: int,
    payload: SafetyResourceUpdate,
    user: User = Depends(require_role(UserRole.PANCHAYAT)),
    db: Session = Depends(get_db),
) -> SafetyResourceResponse:
    return CommunityService(db).update_safety_resource(user, resource_id, payload)
