from datetime import datetime
from pydantic import BaseModel
from app.models.enums import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str | None = None
    payload: dict | None = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str | None = None
    is_read: bool
    created_at: datetime
    payload: dict | None = None

    class Config:
        from_attributes = True


class NotificationUnreadCount(BaseModel):
    count: int


class NotificationList(BaseModel):
    items: list[NotificationResponse]
    total: int
    limit: int
    offset: int
