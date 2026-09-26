import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    MaintenanceLog, MaintenanceAlert, Vehicle, VehicleStatus,
    MaintenanceStatus, MaintenancePriority, AlertSeverity
)
from app.schemas import MaintenanceCreate, MaintenanceUpdate

class MaintenanceService:

    @staticmethod
    def generate_job_id(db: Session) -> str:
        last = db.query(MaintenanceLog).order_by(MaintenanceLog.id.desc()).first()
        next_num = 401 if not last else last.id + 401
        return f"MNT-{next_num}"

    @staticmethod
    def schedule_maintenance(db: Session, data: MaintenanceCreate) -> MaintenanceLog:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == data.vehicle_id).first()
        if not vehicle:
            raise ValueError(f"Vehicle '{data.vehicle_id}' not found in registry.")

        job_id = MaintenanceService.generate_job_id(db)
        scheduled_dt = data.scheduled_date or datetime.utcnow()

        log = MaintenanceLog(
            job_id=job_id,
            vehicle_id=data.vehicle_id,
            category=data.category,
            service_center=data.service_center or "Central Fleet Depot",
            status=MaintenanceStatus.SCHEDULED,
            priority=data.priority or MaintenancePriority.MEDIUM,
            scheduled_date=scheduled_dt,
            estimated_cost=data.estimated_cost or 0.0,
            odometer_reading=data.odometer_reading or vehicle.odometer_km or 0.0,
            notes=data.notes
        )

        db.add(log)
        db.commit()
        db.refresh(log)

        # Trigger alert check for upcoming/immediate service
        MaintenanceService.check_and_create_alerts_for_job(db, log)

        return log

    @staticmethod
    def update_maintenance(db: Session, job_id: str, data: MaintenanceUpdate) -> Optional[MaintenanceLog]:
        log = db.query(MaintenanceLog).filter(MaintenanceLog.job_id == job_id).first()
        if not log:
            return None

        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == log.vehicle_id).first()

        if data.status:
            old_status = log.status
            log.status = data.status

            if data.status == MaintenanceStatus.IN_PROGRESS and vehicle:
                vehicle.status = VehicleStatus.MAINTENANCE
            elif data.status == MaintenanceStatus.COMPLETED:
                log.completed_date = data.completed_date or datetime.utcnow()
                if vehicle:
                    # Vehicle returns to available once maintenance is completed
                    vehicle.status = VehicleStatus.AVAILABLE
                    if log.next_service_odometer:
                        vehicle.odometer_km = max(vehicle.odometer_km, log.odometer_reading)

        if data.priority:
            log.priority = data.priority
        if data.actual_cost is not None:
            log.actual_cost = data.actual_cost
        if data.completed_date is not None:
            log.completed_date = data.completed_date
        if data.performed_by is not None:
            log.performed_by = data.performed_by
        if data.notes is not None:
            log.notes = data.notes
        if data.next_service_odometer is not None:
            log.next_service_odometer = data.next_service_odometer
        if data.next_service_date is not None:
            log.next_service_date = data.next_service_date

        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def check_and_create_alerts_for_job(db: Session, log: MaintenanceLog):
        now = datetime.utcnow()
        if log.status == MaintenanceStatus.SCHEDULED and log.scheduled_date < now:
            existing = db.query(MaintenanceAlert).filter(
                MaintenanceAlert.vehicle_id == log.vehicle_id,
                MaintenanceAlert.alert_type == "OVERDUE_SERVICE",
                MaintenanceAlert.is_resolved == False
            ).first()
            if not existing:
                alert = MaintenanceAlert(
                    vehicle_id=log.vehicle_id,
                    alert_type="OVERDUE_SERVICE",
                    severity=AlertSeverity.HIGH,
                    message=f"Overdue {log.category} servicing for vehicle {log.vehicle_id} (Scheduled: {log.scheduled_date.strftime('%Y-%m-%d')})."
                )
                db.add(alert)
                db.commit()

    @staticmethod
    def scan_all_maintenance_alerts(db: Session) -> int:
        now = datetime.utcnow()
        alerts_created = 0

        # 1. Overdue maintenance checks
        overdue_jobs = db.query(MaintenanceLog).filter(
            MaintenanceLog.status == MaintenanceStatus.SCHEDULED,
            MaintenanceLog.scheduled_date < now
        ).all()

        for job in overdue_jobs:
            exists = db.query(MaintenanceAlert).filter(
                MaintenanceAlert.vehicle_id == job.vehicle_id,
                MaintenanceAlert.alert_type == "OVERDUE_SERVICE",
                MaintenanceAlert.is_resolved == False
            ).first()
            if not exists:
                db.add(MaintenanceAlert(
                    vehicle_id=job.vehicle_id,
                    alert_type="OVERDUE_SERVICE",
                    severity=AlertSeverity.HIGH,
                    message=f"Urgent: Scheduled {job.category} for {job.vehicle_id} is overdue since {job.scheduled_date.strftime('%Y-%m-%d')}."
                ))
                alerts_created += 1

        # 2. Critical priority maintenance checks
        critical_jobs = db.query(MaintenanceLog).filter(
            MaintenanceLog.priority == MaintenancePriority.CRITICAL,
            MaintenanceLog.status.in_([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS])
        ).all()

        for c_job in critical_jobs:
            exists = db.query(MaintenanceAlert).filter(
                MaintenanceAlert.vehicle_id == c_job.vehicle_id,
                MaintenanceAlert.alert_type == "CRITICAL_INSPECTION",
                MaintenanceAlert.is_resolved == False
            ).first()
            if not exists:
                db.add(MaintenanceAlert(
                    vehicle_id=c_job.vehicle_id,
                    alert_type="CRITICAL_INSPECTION",
                    severity=AlertSeverity.CRITICAL,
                    message=f"Critical Maintenance Alert on {c_job.vehicle_id}: {c_job.category} requires immediate mechanical intervention."
                ))
                alerts_created += 1

        # 3. High mileage inspection warning
        vehicles = db.query(Vehicle).all()
        for v in vehicles:
            if v.odometer_km and v.odometer_km >= 25000:
                exists = db.query(MaintenanceAlert).filter(
                    MaintenanceAlert.vehicle_id == v.vehicle_id,
                    MaintenanceAlert.alert_type == "HIGH_MILEAGE",
                    MaintenanceAlert.is_resolved == False
                ).first()
                if not exists:
                    db.add(MaintenanceAlert(
                        vehicle_id=v.vehicle_id,
                        alert_type="HIGH_MILEAGE",
                        severity=AlertSeverity.MEDIUM,
                        message=f"Vehicle {v.vehicle_id} exceeded {int(v.odometer_km):,} km. Comprehensive mechanical review recommended."
                    ))
                    alerts_created += 1

        db.commit()
        return alerts_created

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[MaintenanceAlert]:
        alert = db.query(MaintenanceAlert).filter(MaintenanceAlert.id == alert_id).first()
        if not alert:
            return None
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_summary_report(db: Session) -> Dict[str, Any]:
        total_jobs = db.query(MaintenanceLog).count()
        scheduled_jobs = db.query(MaintenanceLog).filter(MaintenanceLog.status == MaintenanceStatus.SCHEDULED).count()
        in_progress_jobs = db.query(MaintenanceLog).filter(MaintenanceLog.status == MaintenanceStatus.IN_PROGRESS).count()
        completed_jobs = db.query(MaintenanceLog).filter(MaintenanceLog.status == MaintenanceStatus.COMPLETED).count()

        # Sum of actual cost where completed, or estimated cost
        logs = db.query(MaintenanceLog).all()
        total_cost = sum(log.actual_cost if log.actual_cost is not None else log.estimated_cost for log in logs)

        cost_by_category = {}
        for log in logs:
            c = log.category or "Other"
            amt = log.actual_cost if log.actual_cost is not None else log.estimated_cost
            cost_by_category[c] = cost_by_category.get(c, 0.0) + amt

        active_alerts = db.query(MaintenanceAlert).filter(MaintenanceAlert.is_resolved == False).count()

        return {
            "total_jobs": total_jobs,
            "scheduled_jobs": scheduled_jobs,
            "in_progress_jobs": in_progress_jobs,
            "completed_jobs": completed_jobs,
            "total_maintenance_cost": round(total_cost, 2),
            "active_alerts_count": active_alerts,
            "cost_by_category": {k: round(v, 2) for k, v in cost_by_category.items()}
        }
