import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import NotificationRecord, NotificationType, NotificationChannel
from app.schemas import NotificationCreate, NotificationDispatchResult

logger = logging.getLogger("notification_service")

class NotificationService:
    @staticmethod
    def create_and_dispatch(
        db: Session,
        payload: NotificationCreate
    ) -> NotificationRecord:
        """
        Record a notification and simulate/execute transmission over the requested channel (Email, SMS, Push, In-App).
        """
        notification = NotificationRecord(
            notification_type=payload.notification_type,
            channel=payload.channel or NotificationChannel.IN_APP,
            recipient=payload.recipient,
            title=payload.title,
            message=payload.message,
            reference_id=payload.reference_id,
            status="SENT",
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Multi-channel transmission dispatch simulation
        NotificationService._dispatch_channel(notification)
        return notification

    @staticmethod
    def _dispatch_channel(notification: NotificationRecord) -> None:
        """Simulate real-time external gateway transmission (SMTP / Twilio SMS / FCM Push)."""
        channel = notification.channel.value if hasattr(notification.channel, "value") else str(notification.channel)
        logger.info(
            f"[{channel.upper()} GATEWAY DISPATCH] To: {notification.recipient} | "
            f"Subject: {notification.title} | Ref: {notification.reference_id}"
        )

    @staticmethod
    def send_maintenance_alert(
        db: Session,
        vehicle_id: str,
        message: str,
        recipient: str = "fleet-maintenance@fleetflow.io",
        channel: NotificationChannel = NotificationChannel.EMAIL
    ) -> NotificationRecord:
        return NotificationService.create_and_dispatch(
            db,
            NotificationCreate(
                notification_type=NotificationType.MAINTENANCE_ALERT,
                channel=channel,
                recipient=recipient,
                title=f"Maintenance Alert: Vehicle {vehicle_id}",
                message=message,
                reference_id=vehicle_id
            )
        )

    @staticmethod
    def send_delivery_notification(
        db: Session,
        tracking_number: str,
        status: str,
        recipient: str,
        channel: NotificationChannel = NotificationChannel.SMS
    ) -> NotificationRecord:
        return NotificationService.create_and_dispatch(
            db,
            NotificationCreate(
                notification_type=NotificationType.DELIVERY_NOTIFICATION,
                channel=channel,
                recipient=recipient,
                title=f"Shipment Update: {tracking_number}",
                message=f"Consignment {tracking_number} is now marked as {status}.",
                reference_id=tracking_number
            )
        )

    @staticmethod
    def send_driver_assignment_alert(
        db: Session,
        driver_name: str,
        vehicle_id: str,
        recipient: str,
        channel: NotificationChannel = NotificationChannel.PUSH
    ) -> NotificationRecord:
        return NotificationService.create_and_dispatch(
            db,
            NotificationCreate(
                notification_type=NotificationType.DRIVER_ASSIGNMENT,
                channel=channel,
                recipient=recipient,
                title=f"Vehicle Assignment: {vehicle_id}",
                message=f"Driver {driver_name} has been assigned to fleet asset {vehicle_id}.",
                reference_id=vehicle_id
            )
        )

    @staticmethod
    def send_route_change_alert(
        db: Session,
        trip_code: str,
        reason: str,
        recipient: str = "dispatch@fleetflow.io",
        channel: NotificationChannel = NotificationChannel.PUSH
    ) -> NotificationRecord:
        return NotificationService.create_and_dispatch(
            db,
            NotificationCreate(
                notification_type=NotificationType.ROUTE_CHANGE,
                channel=channel,
                recipient=recipient,
                title=f"Route Recalculated: Trip {trip_code}",
                message=f"Trip route dynamically updated due to: {reason}",
                reference_id=trip_code
            )
        )

    @staticmethod
    def get_notifications(
        db: Session,
        notification_type: Optional[str] = None,
        channel: Optional[str] = None,
        recipient: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[NotificationRecord]:
        query = db.query(NotificationRecord)
        if notification_type:
            for nt in NotificationType:
                if notification_type.lower() in [nt.value.lower(), nt.name.lower()]:
                    query = query.filter(NotificationRecord.notification_type == nt)
                    break
        if channel:
            for ch in NotificationChannel:
                if channel.lower() in [ch.value.lower(), ch.name.lower()]:
                    query = query.filter(NotificationRecord.channel == ch)
                    break
        if recipient:
            query = query.filter(NotificationRecord.recipient.ilike(f"%{recipient.strip()}%"))
        if unread_only:
            query = query.filter(NotificationRecord.is_read == False)

        return query.order_by(NotificationRecord.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> Optional[NotificationRecord]:
        record = db.query(NotificationRecord).filter(NotificationRecord.id == notification_id).first()
        if record:
            record.is_read = True
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    def mark_all_as_read(db: Session, recipient: Optional[str] = None) -> int:
        query = db.query(NotificationRecord).filter(NotificationRecord.is_read == False)
        if recipient:
            query = query.filter(NotificationRecord.recipient == recipient)
        count = query.count()
        query.update({NotificationRecord.is_read: True})
        db.commit()
        return count
