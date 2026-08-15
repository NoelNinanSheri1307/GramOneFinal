from __future__ import annotations

import logging
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.models import Notification, User
from app.models.enums import NotificationType

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        *,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str | None = None,
        payload: dict | None = None,
    ) -> Notification | None:
        """Create and persist a notification for a user, preventing duplicates."""
        # Prevent duplicates by checking recent notifications for this user/type
        if payload and "target_id" in payload and "target_type" in payload:
            target_id = payload["target_id"]
            target_type = payload["target_type"]
            recent = db.scalars(
                select(Notification)
                .where(Notification.user_id == user_id, Notification.type == type)
                .order_by(desc(Notification.created_at))
                .limit(5)
            ).all()
            for n in recent:
                if n.payload and n.payload.get("target_id") == target_id and n.payload.get("target_type") == target_type:
                    logger.info(f"Duplicate notification prevented for user {user_id}, type {type.value}")
                    return None

        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            payload=payload,
            is_read=False,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        logger.info(
            f"Created notification {notification.id} for user {user_id} of type {type.value}"
        )
        return notification

    @classmethod
    def notify_new_issue(cls, db: Session, issue) -> None:
        """Notify Panchayat admins when a citizen reports a new issue."""
        from app.models import User, Village
        from app.models.enums import UserRole, IssueCategory

        # Determine notification type
        is_emergency = issue.category == IssueCategory.DISASTER
        is_urgent = issue.category == IssueCategory.HEALTH or any(
            w in (issue.title or "").lower() or w in (issue.description or "").lower()
            for w in ["urgent", "emergency", "danger", "hazard", "immediate"]
        )

        ntype = NotificationType.INFO
        title = "New Issue Reported"
        msg = f"A new issue '{issue.title}' was reported."
        i18n_key = "notifications.messages.new_issue"

        if is_emergency:
            ntype = NotificationType.EMERGENCY_ISSUE
            title = "Emergency Issue Reported"
            msg = f"EMERGENCY issue '{issue.title}' was reported!"
            i18n_key = "notifications.messages.emergency_issue"
        elif is_urgent:
            ntype = NotificationType.URGENT_ISSUE
            title = "Urgent Issue Reported"
            msg = f"Urgent issue '{issue.title}' was reported."
            i18n_key = "notifications.messages.urgent_issue"

        # Find Panchayat admins in scope
        query = select(User).where(User.role == UserRole.PANCHAYAT)
        if issue.village_id is not None:
            query = query.where(User.village_id == issue.village_id)
        panchayats = db.scalars(query).all()

        payload = {
            "target_id": issue.id,
            "target_type": "issue",
            "i18nKey": i18n_key,
            "i18nParams": {"title": issue.title, "reference": issue.reference or f"ISSUE-{issue.id:06d}"},
        }

        for p in panchayats:
            cls.create_notification(
                db,
                user_id=p.id,
                type=ntype,
                title=title,
                message=msg,
                payload=payload,
            )

    @classmethod
    def notify_issue_status_changed(cls, db: Session, issue, previous_status, new_status, actor) -> None:
        """Notify citizen/assigned employee when an issue's status changes."""
        from app.models.enums import IssueStatus, UserRole

        # 1. If FIELD_COMPLETED, notify Panchayat admins that verification is required
        if new_status == IssueStatus.FIELD_COMPLETED:
            from app.models import User
            query = select(User).where(User.role == UserRole.PANCHAYAT)
            if issue.village_id is not None:
                query = query.where(User.village_id == issue.village_id)
            panchayats = db.scalars(query).all()
            for p in panchayats:
                cls.create_notification(
                    db,
                    user_id=p.id,
                    type=NotificationType.PANCHAYAT_VERIFICATION_REQUIRED,
                    title="Panchayat Verification Required",
                    message=f"Field work completed for issue '{issue.title}'. Verification required.",
                    payload={
                        "target_id": issue.id,
                        "target_type": "issue",
                        "i18nKey": "notifications.messages.verification_required",
                        "i18nParams": {"title": issue.title},
                    },
                )

        # 2. Notify Citizen reporter
        if issue.reported_by:
            title = "Issue Status Updated"
            msg = f"Issue '{issue.title}' status updated to {new_status.value}."
            i18n_key = "notifications.messages.issue_status"

            if new_status == IssueStatus.RESOLVED:
                title = "Issue Resolved"
                msg = f"Your issue '{issue.title}' has been resolved!"
                i18n_key = "notifications.messages.issue_resolved"
            elif new_status == IssueStatus.VERIFIED:
                title = "Issue Verified"
                msg = f"Your issue '{issue.title}' has been verified."
                i18n_key = "notifications.messages.issue_verified"

            cls.create_notification(
                db,
                user_id=issue.reported_by,
                type=NotificationType.ISSUE_STATUS,
                title=title,
                message=msg,
                payload={
                    "target_id": issue.id,
                    "target_type": "issue",
                    "i18nKey": i18n_key,
                    "i18nParams": {"title": issue.title, "status": new_status.value, "reference": issue.reference},
                },
            )

        # 3. Notify Assigned Employee if status changed by someone else
        if issue.assigned_to and actor.id != issue.assigned_to:
            cls.create_notification(
                db,
                user_id=issue.assigned_to,
                type=NotificationType.ASSIGNMENT_CHANGED,
                title="Assignment Status Changed",
                message=f"Status of your assigned issue '{issue.title}' changed to {new_status.value}.",
                payload={
                    "target_id": issue.id,
                    "target_type": "issue",
                    "i18nKey": "notifications.messages.assignment_changed",
                    "i18nParams": {"title": issue.title, "status": new_status.value},
                },
            )

    @classmethod
    def notify_issue_assigned(cls, db: Session, issue) -> None:
        """Notify employee and citizen when an issue is assigned."""
        # Notify Assigned Employee
        if issue.assigned_to:
            from app.models.enums import IssueCategory
            is_urgent = issue.category == IssueCategory.HEALTH or issue.category == IssueCategory.DISASTER
            cls.create_notification(
                db,
                user_id=issue.assigned_to,
                type=NotificationType.URGENT_ISSUE if is_urgent else NotificationType.EMPLOYEE_ASSIGNED,
                title="Urgent Assignment" if is_urgent else "New Assignment Received",
                message=f"You have been assigned to issue '{issue.title}'.",
                payload={
                    "target_id": issue.id,
                    "target_type": "issue",
                    "i18nKey": "notifications.messages.employee_assigned",
                    "i18nParams": {"title": issue.title},
                },
            )

        # Notify Citizen reporter
        if issue.reported_by:
            cls.create_notification(
                db,
                user_id=issue.reported_by,
                type=NotificationType.ISSUE_STATUS,
                title="Issue Assigned",
                message=f"Your issue '{issue.title}' has been assigned to a field worker.",
                payload={
                    "target_id": issue.id,
                    "target_type": "issue",
                    "i18nKey": "notifications.messages.issue_assigned",
                    "i18nParams": {"title": issue.title},
                },
            )

    @classmethod
    def notify_sponsorship_submitted(cls, db: Session, sponsorship) -> None:
        """Notify Panchayat admins and CSR partner about sponsorship submission."""
        from app.models import User
        from app.models.enums import UserRole

        project = sponsorship.project
        profile = sponsorship.csr_profile
        project_name = project.name if project else "Project"
        org_name = profile.org_name if profile else "CSR Partner"

        # 1. Notify CSR Partner
        if profile and profile.user_id:
            cls.create_notification(
                db,
                user_id=profile.user_id,
                type=NotificationType.SPONSORSHIP_UPDATE,
                title="Sponsorship Submitted",
                message=f"Your sponsorship for project '{project_name}' has been submitted.",
                payload={
                    "target_id": sponsorship.id,
                    "target_type": "sponsorship",
                    "i18nKey": "notifications.messages.sponsorship_submitted_csr",
                    "i18nParams": {"title": project_name},
                },
            )

        # 2. Notify Panchayat admins
        query = select(User).where(User.role == UserRole.PANCHAYAT)
        if project and project.village_id:
            query = query.where(User.village_id == project.village_id)
        panchayats = db.scalars(query).all()

        for p in panchayats:
            cls.create_notification(
                db,
                user_id=p.id,
                type=NotificationType.SPONSORSHIP_UPDATE,
                title="New CSR Sponsorship",
                message=f"New sponsorship for project '{project_name}' submitted by {org_name}.",
                payload={
                    "target_id": sponsorship.id,
                    "target_type": "sponsorship",
                    "i18nKey": "notifications.messages.sponsorship_submitted",
                    "i18nParams": {"title": project_name, "org_name": org_name},
                },
            )

    @classmethod
    def notify_sponsorship_status_changed(cls, db: Session, sponsorship, old_status, new_status) -> None:
        """Notify CSR partner and Panchayat about sponsorship updates, and citizens about project updates."""
        from app.models import User
        from app.models.enums import UserRole

        project = sponsorship.project
        profile = sponsorship.csr_profile
        project_name = project.name if project else "Project"

        # 1. Notify CSR Partner
        if profile and profile.user_id:
            cls.create_notification(
                db,
                user_id=profile.user_id,
                type=NotificationType.SPONSORSHIP_UPDATE,
                title="Sponsorship Status Updated",
                message=f"Your sponsorship for project '{project_name}' was {new_status.value}.",
                payload={
                    "target_id": sponsorship.id,
                    "target_type": "sponsorship",
                    "i18nKey": "notifications.messages.sponsorship_status",
                    "i18nParams": {"status": new_status.value, "title": project_name},
                },
            )

        # 2. If status change affects project status, notify village citizens
        if project:
            from app.models.enums import ProjectStatus
            p_status_msg = f"Project '{project_name}' status updated."
            p_i18n_key = "notifications.messages.project_status"

            # Query all citizens in the project's village
            query = select(User).where(User.role == UserRole.CITIZEN)
            if project.village_id:
                query = query.where(User.village_id == project.village_id)
            citizens = db.scalars(query).all()

            for c in citizens:
                cls.create_notification(
                    db,
                    user_id=c.id,
                    type=NotificationType.PROJECT_UPDATE,
                    title="Village Project Update",
                    message=p_status_msg,
                    payload={
                        "target_id": project.id,
                        "target_type": "project",
                        "i18nKey": p_i18n_key,
                        "i18nParams": {"title": project_name, "status": project.status.value},
                    },
                )

    @classmethod
    def notify_community_published(cls, db: Session, entity_type: str, entity) -> None:
        """Notify citizens when community notices, schemes, or safety resources are published."""
        from app.models import User
        from app.models.enums import UserRole

        query = select(User).where(User.role == UserRole.CITIZEN)
        # Filter by village if applicable
        if hasattr(entity, "village_id") and entity.village_id:
            query = query.where(User.village_id == entity.village_id)
        citizens = db.scalars(query).all()

        ntype = NotificationType.INFO
        title = "Community Update"
        msg = f"New community update: {entity.title}"
        i18n_key = "notifications.messages.community_notice"

        if entity_type == "notice":
            ntype = NotificationType.COMMUNITY_NOTICE
            title = "New Notice Published"
            msg = f"New notice: {entity.title}"
            i18n_key = "notifications.messages.community_notice"
        elif entity_type == "scheme":
            ntype = NotificationType.SCHEME_UPDATE
            title = "New Scheme Published"
            msg = f"New government scheme: {entity.title}"
            i18n_key = "notifications.messages.scheme_update"
        elif entity_type == "safety_resource":
            ntype = NotificationType.SAFETY_NOTICE
            title = "New Safety Resource"
            msg = f"New safety awareness resource: {entity.title}"
            i18n_key = "notifications.messages.safety_notice"

        for c in citizens:
            cls.create_notification(
                db,
                user_id=c.id,
                type=ntype,
                title=title,
                message=msg,
                payload={
                    "target_id": entity.id,
                    "target_type": entity_type,
                    "i18nKey": i18n_key,
                    "i18nParams": {"title": entity.title},
                },
            )


    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        *,
        limit: int = 20,
        offset: int = 0,
        is_read: bool | None = None,
        type: NotificationType | None = None,
    ) -> tuple[list[Notification], int]:
        """Retrieve paginated notifications for the authenticated user, filtered by read/unread status and type."""
        query = select(Notification).where(Notification.user_id == user_id)

        if is_read is not None:
            query = query.where(Notification.is_read == is_read)
        if type is not None:
            query = query.where(Notification.type == type)

        # Count query
        count_query = select(sa_func_count()).select_from(query.subquery())
        # Wait, let's use a cleaner count method
        total = db.scalar(select(sa_func_count(Notification.id)).where(Notification.user_id == user_id))
        # Let's adjust count query with filters
        filter_conditions = [Notification.user_id == user_id]
        if is_read is not None:
            filter_conditions.append(Notification.is_read == is_read)
        if type is not None:
            filter_conditions.append(Notification.type == type)
        total = db.scalar(select(sa_func_count(Notification.id)).where(*filter_conditions))

        # Retrieve items
        query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
        items = db.scalars(query).all()

        return list(items), total

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get the count of unread notifications for a user."""
        from sqlalchemy import func
        return db.scalar(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read == False
            )
        ) or 0

    @staticmethod
    def mark_as_read(db: Session, user_id: int, notification_id: int) -> Notification | None:
        """Mark a specific notification as read, validating ownership."""
        notification = db.scalar(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        if not notification:
            return None
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all notifications of a user as read."""
        from sqlalchemy import update
        result = db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        db.commit()
        return result.rowcount


# Helper function for count import
def sa_func_count(*args, **kwargs):
    from sqlalchemy import func
    return func.count(*args, **kwargs)
