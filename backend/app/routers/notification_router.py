from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NotificationRecord, NotificationType, NotificationChannel
from app.schemas import NotificationCreate, NotificationResponse, NotificationDispatchResult
from app.services.notification_service import NotificationService
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notification Module"])

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db)
):
    """
    Dispatch a new system notification across multi-channel endpoints (Email, SMS, Push, In-App).
    Supports Maintenance Alerts, Delivery Notifications, Driver Assignment Alerts, Shipment Updates, Route Change Alerts.
    """
    try:
        return NotificationService.create_and_dispatch(db, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch notification: {str(e)}")

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    notification_type: Optional[str] = Query(None, description="Filter by NotificationType"),
    channel: Optional[str] = Query(None, description="Filter by Channel (Email, SMS, Push, In-App)"),
    recipient: Optional[str] = Query(None, description="Filter by recipient"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, description="Max notifications to retrieve"),
    db: Session = Depends(get_db)
):
    """Retrieve system notification audit log with filtering by channel, type, and unread state."""
    return NotificationService.get_notifications(
        db=db,
        notification_type=notification_type,
        channel=channel,
        recipient=recipient,
        unread_only=unread_only,
        limit=limit
    )

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Mark a specific notification as acknowledged / read."""
    record = NotificationService.mark_as_read(db, notification_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Notification #{notification_id} not found")
    return record

@router.post("/mark-all-read")
def mark_all_read(
    recipient: Optional[str] = Query(None, description="Optional recipient filter"),
    db: Session = Depends(get_db)
):
    """Mark all active notifications as read."""
    count = NotificationService.mark_all_as_read(db, recipient)
    return {"message": f"{count} notifications marked as read."}

@router.post("/simulate-dispatch")
def simulate_multi_channel_dispatch(
    channel: str = Query("push", description="Channel: email, sms, push"),
    recipient: str = Query("driver@fleetflow.io", description="Recipient identifier"),
    title: str = Query("Fleet Alert", description="Notification headline"),
    message: str = Query("Operational update delivered successfully.", description="Body"),
    db: Session = Depends(get_db)
):
    """Simulate instant gateway dispatch across Email, SMS, or Push notification infrastructures."""
    ch_enum = NotificationChannel.PUSH
    for ch in NotificationChannel:
        if channel.lower() == ch.value.lower() or channel.lower() == ch.name.lower():
            ch_enum = ch
            break

    payload = NotificationCreate(
        notification_type=NotificationType.SYSTEM_ALERT,
        channel=ch_enum,
        recipient=recipient,
        title=title,
        message=message
    )
    rec = NotificationService.create_and_dispatch(db, payload)
    return {
        "dispatch_id": rec.id,
        "channel": rec.channel.value,
        "recipient": rec.recipient,
        "status": "DELIVERED_TO_GATEWAY",
        "timestamp": rec.created_at.isoformat()
    }
