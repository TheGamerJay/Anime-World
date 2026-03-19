"""
Notification routes.

Endpoints:
    GET    /api/v1/notifications
    PUT    /api/v1/notifications/read
    PUT    /api/v1/notifications/{notif_id}/read
    DELETE /api/v1/notifications/{notif_id}
"""

import logging

from fastapi import APIRouter, Depends

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import NotificationRepository
from backend.schemas import MessageResponse, NotificationsListResponse, NotificationResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=NotificationsListResponse, status_code=200)
async def get_notifications(user=Depends(get_current_user), db=Depends(get_db)):
    """Return the 50 most recent notifications for the authenticated user."""
    repo = NotificationRepository(db)
    notifications = await repo.list_for_user(user["id"])
    unread_count = await repo.unread_count(user["id"])
    return NotificationsListResponse(
        notifications=[NotificationResponse(**n) for n in notifications],
        unread_count=unread_count,
    )


@router.put("/notifications/read", response_model=MessageResponse, status_code=200)
async def mark_all_notifications_read(user=Depends(get_current_user), db=Depends(get_db)):
    """Mark all unread notifications as read."""
    repo = NotificationRepository(db)
    await repo.mark_all_read(user["id"])
    return MessageResponse(message="All notifications marked as read.")


@router.put("/notifications/{notif_id}/read", response_model=MessageResponse, status_code=200)
async def mark_notification_read(
    notif_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Mark a single notification as read."""
    repo = NotificationRepository(db)
    await repo.mark_one_read(notif_id, user["id"])
    return MessageResponse(message="Notification marked as read.")


@router.delete("/notifications/{notif_id}", response_model=MessageResponse, status_code=200)
async def delete_notification(
    notif_id: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Delete a notification."""
    repo = NotificationRepository(db)
    await repo.delete(notif_id, user["id"])
    return MessageResponse(message="Notification deleted.")
