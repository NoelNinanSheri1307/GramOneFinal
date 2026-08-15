"""Community Service — Panchayat-managed schemes, notices, and safety resources.

Read access is public (published content only) for every authenticated user;
management (create/update/publish/archive) is Panchayat-only and scoped to the
Panchayat's village jurisdiction. No citizen can modify Panchayat-managed
content, and no CSR / employee management privileges are granted here.

All user-generated content flows through the existing TranslationService so the
original text is preserved and localized variants stay cacheable.
"""
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import (
    CommunityNotice,
    Notification,
    SafetyResource,
    Scheme,
    User,
    Village,
)
from app.models.enums import (
    NotificationType,
    PublishStatus,
    SafetySection,
    SchemeStatus,
    UserRole,
)
from app.schemas.common import LocalizedString, VillageBrief
from app.schemas.community import (
    NoticeCreate,
    NoticeResponse,
    NoticeUpdate,
    SafetyResourceCreate,
    SafetyResourceResponse,
    SafetyResourceUpdate,
    SchemeCreate,
    SchemeResponse,
    SchemeUpdate,
)
from app.services.access import panchayat_in_scope
from app.services.translations import TranslationService

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


class CommunityService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.translations = TranslationService(db)

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _localize(
        self,
        entity_type: str,
        entity_id: int,
        field_name: str,
        original: str | None,
        source_language: str | None,
    ) -> str | LocalizedString | None:
        return self.translations.build_localized(
            entity_type, entity_id, field_name, original, source_language
        )

    def _village_brief(self, village: Village | None) -> VillageBrief | None:
        if village is None:
            return None
        name = self._localize("village", village.id, "name", village.name, "en")
        return VillageBrief(
            id=village.id, name=name, district=village.district, state=village.state
        )

    @staticmethod
    def _require_manager(user: User) -> None:
        if user.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="insufficient_permissions",
                message="Only a Panchayat officer can manage community content.",
                status_code=403,
            )

    def _ensure_scope(self, user: User, village_id: int | None) -> None:
        self._require_manager(user)
        if not panchayat_in_scope(user, village_id):
            raise GramOneError(
                code="out_of_jurisdiction",
                message="This content is outside your Panchayat jurisdiction.",
                status_code=403,
            )

    def _notify_panchayat(
        self, ntype: NotificationType, title: str, message: str, village_id: int | None
    ) -> None:
        """Notify active Panchayat officers whose jurisdiction covers ``village_id``.

        Citizens are never spammed: there is no subscription model yet, and this
        keeps notifications scoped to the officers responsible for the content.
        """
        stmt = select(User).where(
            User.role == UserRole.PANCHAYAT,
            User.is_active == True,  # noqa: E712
        )
        if village_id is not None:
            stmt = stmt.where(
                User.village_id.is_(None) | (User.village_id == village_id)
            )
        officers = self.db.scalars(stmt).all()
        for officer in officers:
            self.db.add(
                Notification(
                    user_id=officer.id,
                    type=ntype,
                    title=title,
                    message=message,
                )
            )

    @staticmethod
    def _newly_published(current_status: object, new_status: object | None) -> bool:
        return (
            new_status is not None
            and new_status == PublishStatus.PUBLISHED
            and current_status != PublishStatus.PUBLISHED
        )

    # ------------------------------------------------------------------ #
    # Schemes
    # ------------------------------------------------------------------ #
    def create_scheme(self, user: User, payload: SchemeCreate) -> SchemeResponse:
        self._ensure_scope(user, payload.village_id)
        scheme = Scheme(
            category=payload.category,
            title=payload.title,
            short_description=payload.short_description,
            detailed_description=payload.detailed_description,
            eligibility=payload.eligibility,
            benefits=payload.benefits,
            required_documents=payload.required_documents,
            application_instructions=payload.application_instructions,
            official_url=payload.official_url,
            deadline=payload.deadline,
            state=payload.state,
            district=payload.district,
            village_id=payload.village_id,
            target_groups=payload.target_groups,
            status=payload.status,
            created_by=user.id,
            original_language=payload.original_language,
        )
        if payload.status == SchemeStatus.PUBLISHED:
            scheme.published_at = datetime.now(timezone.utc)
        self.db.add(scheme)
        self.db.flush()
        if payload.status == SchemeStatus.PUBLISHED:
            self._notify_panchayat(
                NotificationType.SCHEME_UPDATE,
                f"New scheme published: {scheme.title}",
                f"A government scheme listing '{scheme.title}' was published.",
                scheme.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "scheme", scheme)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify scheme publish: {e}")
        self.db.commit()
        self.db.refresh(scheme)
        return self._scheme_response(scheme)

    def list_schemes(
        self,
        user: User,
        *,
        q: str | None = None,
        category: object | None = None,
        target_group: str | None = None,
        state: str | None = None,
        status: SchemeStatus | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict:
        is_manager = user.role == UserRole.PANCHAYAT
        stmt = select(Scheme)

        if is_manager:
            if status is not None:
                stmt = stmt.where(Scheme.status == status)
            if user.village_id is not None:
                stmt = stmt.where(
                    Scheme.village_id.is_(None) | (Scheme.village_id == user.village_id)
                )
        else:
            stmt = stmt.where(Scheme.status == SchemeStatus.PUBLISHED)

        if q:
            like = f"%{q}%"
            stmt = stmt.where(Scheme.title.ilike(like) | Scheme.short_description.ilike(like))
        if category is not None:
            stmt = stmt.where(Scheme.category == category)
        if target_group:
            stmt = stmt.where(Scheme.target_groups.ilike(f"%{target_group}%"))
        if state:
            stmt = stmt.where(Scheme.state.ilike(f"%{state}%"))

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(Scheme.published_at.desc().nulls_last(), Scheme.created_at.desc())
            .limit(min(limit, MAX_LIMIT))
            .offset(offset)
        ).all()
        return {
            "items": [self._scheme_response(s) for s in rows],
            "total": total,
            "limit": min(limit, MAX_LIMIT),
            "offset": offset,
        }

    def get_scheme(self, user: User, scheme_id: int) -> SchemeResponse:
        scheme = self.db.get(Scheme, scheme_id)
        if scheme is None:
            raise GramOneError(
                code="scheme_not_found", message="Scheme not found.", status_code=404
            )
        if scheme.status != SchemeStatus.PUBLISHED and user.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="scheme_not_found", message="Scheme not found.", status_code=404
            )
        if user.role == UserRole.PANCHAYAT:
            self._ensure_scope(user, scheme.village_id)
        return self._scheme_response(scheme)

    def update_scheme(self, user: User, scheme_id: int, payload: SchemeUpdate) -> SchemeResponse:
        scheme = self.db.get(Scheme, scheme_id)
        if scheme is None:
            raise GramOneError(
                code="scheme_not_found", message="Scheme not found.", status_code=404
            )
        self._ensure_scope(user, scheme.village_id)

        data = payload.model_dump(exclude_unset=True)
        newly_published = self._newly_published(scheme.status, data.get("status"))
        for field, value in data.items():
            if field == "status":
                continue
            setattr(scheme, field, value)
        if newly_published:
            scheme.published_at = datetime.now(timezone.utc)
        elif data.get("status") == SchemeStatus.DRAFT:
            scheme.published_at = None

        self.db.add(scheme)
        self.db.flush()
        if newly_published:
            self._notify_panchayat(
                NotificationType.SCHEME_UPDATE,
                f"Scheme published: {scheme.title}",
                f"Government scheme '{scheme.title}' is now live for citizens.",
                scheme.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "scheme", scheme)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify scheme publish: {e}")
        self.db.commit()
        self.db.refresh(scheme)
        return self._scheme_response(scheme)

    def _scheme_response(self, scheme: Scheme) -> SchemeResponse:
        source = scheme.original_language or "en"
        return SchemeResponse(
            id=scheme.id,
            category=scheme.category,
            title=self._localize("scheme", scheme.id, "title", scheme.title, source),
            short_description=self._localize(
                "scheme", scheme.id, "short_description", scheme.short_description, source
            ),
            detailed_description=self._localize(
                "scheme", scheme.id, "detailed_description", scheme.detailed_description, source
            ),
            eligibility=self._localize(
                "scheme", scheme.id, "eligibility", scheme.eligibility, source
            ),
            benefits=self._localize("scheme", scheme.id, "benefits", scheme.benefits, source),
            required_documents=scheme.required_documents,
            application_instructions=self._localize(
                "scheme",
                scheme.id,
                "application_instructions",
                scheme.application_instructions,
                source,
            ),
            official_url=scheme.official_url,
            deadline=scheme.deadline,
            state=scheme.state,
            district=scheme.district,
            village=self._village_brief(scheme.village),
            target_groups=scheme.target_groups,
            status=scheme.status,
            published_at=scheme.published_at,
            created_at=scheme.created_at,
            updated_at=scheme.updated_at,
            original_language=scheme.original_language,
        )

    # ------------------------------------------------------------------ #
    # Community notices
    # ------------------------------------------------------------------ #
    def create_notice(self, user: User, payload: NoticeCreate) -> NoticeResponse:
        self._ensure_scope(user, payload.village_id)
        notice = CommunityNotice(
            notice_type=payload.notice_type,
            source_type=payload.source_type,
            title=payload.title,
            summary=payload.summary,
            content=payload.content,
            category=payload.category,
            is_featured=payload.is_featured,
            state=payload.state,
            district=payload.district,
            village_id=payload.village_id,
            status=payload.status,
            expires_at=payload.expires_at,
            created_by=user.id,
            original_language=payload.original_language,
        )
        if payload.status == PublishStatus.PUBLISHED:
            notice.published_at = datetime.now(timezone.utc)
        self.db.add(notice)
        self.db.flush()
        if payload.status == PublishStatus.PUBLISHED:
            self._notify_panchayat(
                NotificationType.COMMUNITY_NOTICE,
                f"New community notice: {notice.title}",
                f"A new announcement/notice '{notice.title}' was published.",
                notice.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "notice", notice)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify notice publish: {e}")
        self.db.commit()
        self.db.refresh(notice)
        return self._notice_response(notice)

    def list_notices(
        self,
        user: User,
        *,
        q: str | None = None,
        notice_type: object | None = None,
        source_type: object | None = None,
        category: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict:
        is_manager = user.role == UserRole.PANCHAYAT
        stmt = select(CommunityNotice)

        if is_manager:
            if user.village_id is not None:
                stmt = stmt.where(
                    CommunityNotice.village_id.is_(None)
                    | (CommunityNotice.village_id == user.village_id)
                )
        else:
            stmt = stmt.where(CommunityNotice.status == PublishStatus.PUBLISHED)

        if q:
            like = f"%{q}%"
            stmt = stmt.where(
                CommunityNotice.title.ilike(like) | CommunityNotice.summary.ilike(like)
            )
        if notice_type is not None:
            stmt = stmt.where(CommunityNotice.notice_type == notice_type)
        if source_type is not None:
            stmt = stmt.where(CommunityNotice.source_type == source_type)
        if category:
            stmt = stmt.where(CommunityNotice.category == category)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(
                CommunityNotice.published_at.desc().nulls_last(),
                CommunityNotice.created_at.desc(),
            )
            .limit(min(limit, MAX_LIMIT))
            .offset(offset)
        ).all()
        return {
            "items": [self._notice_response(n) for n in rows],
            "total": total,
            "limit": min(limit, MAX_LIMIT),
            "offset": offset,
        }

    def get_notice(self, user: User, notice_id: int) -> NoticeResponse:
        notice = self.db.get(CommunityNotice, notice_id)
        if notice is None:
            raise GramOneError(
                code="notice_not_found", message="Notice not found.", status_code=404
            )
        if notice.status != PublishStatus.PUBLISHED and user.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="notice_not_found", message="Notice not found.", status_code=404
            )
        if user.role == UserRole.PANCHAYAT:
            self._ensure_scope(user, notice.village_id)
        return self._notice_response(notice)

    def update_notice(self, user: User, notice_id: int, payload: NoticeUpdate) -> NoticeResponse:
        notice = self.db.get(CommunityNotice, notice_id)
        if notice is None:
            raise GramOneError(
                code="notice_not_found", message="Notice not found.", status_code=404
            )
        self._ensure_scope(user, notice.village_id)

        data = payload.model_dump(exclude_unset=True)
        newly_published = self._newly_published(notice.status, data.get("status"))
        for field, value in data.items():
            if field == "status":
                continue
            setattr(notice, field, value)
        if newly_published:
            notice.published_at = datetime.now(timezone.utc)

        self.db.add(notice)
        self.db.flush()
        if newly_published:
            self._notify_panchayat(
                NotificationType.COMMUNITY_NOTICE,
                f"New community notice: {notice.title}",
                f"A new announcement/notice '{notice.title}' was published.",
                notice.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "notice", notice)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify notice publish: {e}")
        self.db.commit()
        self.db.refresh(notice)
        return self._notice_response(notice)

    def _notice_response(self, notice: CommunityNotice) -> NoticeResponse:
        source = notice.original_language or "en"
        return NoticeResponse(
            id=notice.id,
            notice_type=notice.notice_type,
            source_type=notice.source_type,
            title=self._localize("community_notice", notice.id, "title", notice.title, source),
            summary=self._localize(
                "community_notice", notice.id, "summary", notice.summary, source
            ),
            content=self._localize(
                "community_notice", notice.id, "content", notice.content, source
            ),
            category=notice.category,
            is_featured=notice.is_featured,
            state=notice.state,
            district=notice.district,
            village=self._village_brief(notice.village),
            status=notice.status,
            published_at=notice.published_at,
            expires_at=notice.expires_at,
            created_at=notice.created_at,
            updated_at=notice.updated_at,
            original_language=notice.original_language,
        )

    # ------------------------------------------------------------------ #
    # Safety resources
    # ------------------------------------------------------------------ #
    def create_safety_resource(
        self, user: User, payload: SafetyResourceCreate
    ) -> SafetyResourceResponse:
        self._ensure_scope(user, payload.village_id)
        resource = SafetyResource(
            section=payload.section,
            resource_type=payload.resource_type,
            title=payload.title,
            summary=payload.summary,
            content=payload.content,
            external_url=payload.external_url,
            contact_label=payload.contact_label,
            contact_phone=payload.contact_phone,
            is_featured=payload.is_featured,
            state=payload.state,
            district=payload.district,
            village_id=payload.village_id,
            status=payload.status,
            expires_at=payload.expires_at,
            created_by=user.id,
            original_language=payload.original_language,
        )
        if payload.status == PublishStatus.PUBLISHED:
            resource.published_at = datetime.now(timezone.utc)
        self.db.add(resource)
        self.db.flush()
        if payload.status == PublishStatus.PUBLISHED:
            self._notify_panchayat(
                NotificationType.SAFETY_NOTICE,
                f"New safety notice: {resource.title}",
                f"A new safety/awareness resource '{resource.title}' was published.",
                resource.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "safety_resource", resource)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify safety resource publish: {e}")
        self.db.commit()
        self.db.refresh(resource)
        return self._safety_response(resource)

    def list_safety_resources(
        self,
        user: User,
        *,
        section: SafetySection | None = None,
        resource_type: object | None = None,
        q: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict:
        is_manager = user.role == UserRole.PANCHAYAT
        stmt = select(SafetyResource)

        if is_manager:
            if user.village_id is not None:
                stmt = stmt.where(
                    SafetyResource.village_id.is_(None)
                    | (SafetyResource.village_id == user.village_id)
                )
        else:
            stmt = stmt.where(SafetyResource.status == PublishStatus.PUBLISHED)

        if section is not None:
            stmt = stmt.where(SafetyResource.section == section)
        if resource_type is not None:
            stmt = stmt.where(SafetyResource.resource_type == resource_type)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(SafetyResource.title.ilike(like) | SafetyResource.summary.ilike(like))

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(
                SafetyResource.published_at.desc().nulls_last(),
                SafetyResource.created_at.desc(),
            )
            .limit(min(limit, MAX_LIMIT))
            .offset(offset)
        ).all()
        return {
            "items": [self._safety_response(r) for r in rows],
            "total": total,
            "limit": min(limit, MAX_LIMIT),
            "offset": offset,
        }

    def get_safety_resource(self, user: User, resource_id: int) -> SafetyResourceResponse:
        resource = self.db.get(SafetyResource, resource_id)
        if resource is None:
            raise GramOneError(
                code="safety_resource_not_found",
                message="Safety resource not found.",
                status_code=404,
            )
        if resource.status != PublishStatus.PUBLISHED and user.role != UserRole.PANCHAYAT:
            raise GramOneError(
                code="safety_resource_not_found",
                message="Safety resource not found.",
                status_code=404,
            )
        if user.role == UserRole.PANCHAYAT:
            self._ensure_scope(user, resource.village_id)
        return self._safety_response(resource)

    def update_safety_resource(
        self, user: User, resource_id: int, payload: SafetyResourceUpdate
    ) -> SafetyResourceResponse:
        resource = self.db.get(SafetyResource, resource_id)
        if resource is None:
            raise GramOneError(
                code="safety_resource_not_found",
                message="Safety resource not found.",
                status_code=404,
            )
        self._ensure_scope(user, resource.village_id)

        data = payload.model_dump(exclude_unset=True)
        newly_published = self._newly_published(resource.status, data.get("status"))
        for field, value in data.items():
            if field == "status":
                continue
            setattr(resource, field, value)
        if newly_published:
            resource.published_at = datetime.now(timezone.utc)

        self.db.add(resource)
        self.db.flush()
        if newly_published:
            self._notify_panchayat(
                NotificationType.SAFETY_NOTICE,
                f"New safety notice: {resource.title}",
                f"A new safety/awareness resource '{resource.title}' was published.",
                resource.village_id,
            )
            try:
                from app.services.notification import NotificationService
                NotificationService.notify_community_published(self.db, "safety_resource", resource)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to notify safety resource publish: {e}")
        self.db.commit()
        self.db.refresh(resource)
        return self._safety_response(resource)

    def _safety_response(self, resource: SafetyResource) -> SafetyResourceResponse:
        source = resource.original_language or "en"
        return SafetyResourceResponse(
            id=resource.id,
            section=resource.section,
            resource_type=resource.resource_type,
            title=self._localize("safety_resource", resource.id, "title", resource.title, source),
            summary=self._localize(
                "safety_resource", resource.id, "summary", resource.summary, source
            ),
            content=self._localize(
                "safety_resource", resource.id, "content", resource.content, source
            ),
            external_url=resource.external_url,
            contact_label=resource.contact_label,
            contact_phone=resource.contact_phone,
            is_featured=resource.is_featured,
            state=resource.state,
            district=resource.district,
            village=self._village_brief(resource.village),
            status=resource.status,
            published_at=resource.published_at,
            expires_at=resource.expires_at,
            created_at=resource.created_at,
            updated_at=resource.updated_at,
            original_language=resource.original_language,
        )
