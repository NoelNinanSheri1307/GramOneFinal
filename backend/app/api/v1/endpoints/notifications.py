from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.models.enums import NotificationType
from app.schemas.notification import (
    NotificationList,
    NotificationResponse,
    NotificationUnreadCount,
)
from app.services.notification import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
def list_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    is_read: bool | None = Query(None),
    type: NotificationType | None = Query(None),
):
    """Retrieve paginated notifications for the authenticated user."""
    items, total = NotificationService.get_user_notifications(
        db,
        user_id=user.id,
        limit=limit,
        offset=offset,
        is_read=is_read,
        type=type,
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/unread-count", response_model=NotificationUnreadCount)
def get_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get the total count of unread notifications for the authenticated user."""
    count = NotificationService.get_unread_count(db, user_id=user.id)
    return {"count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark a specific notification as read, validating user ownership."""
    notification = NotificationService.mark_as_read(
        db, user_id=user.id, notification_id=notification_id
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied",
        )
    return notification


@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Mark all notifications for the authenticated user as read."""
    count = NotificationService.mark_all_as_read(db, user_id=user.id)
    return {"status": "success", "marked_count": count}