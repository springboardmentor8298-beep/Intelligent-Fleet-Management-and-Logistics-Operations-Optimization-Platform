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
    def deduplicate_and_trim_alerts(db: Session, target_count: int = 15) -> int:
        """
        Deduplicates active maintenance alerts and trims the total active count
        to a manageable, healthy volume (default 15, within 10-20), resolving duplicates and excess alerts.
        """
        unresolved = db.query(MaintenanceAlert).filter(MaintenanceAlert.is_resolved == False).all()
        if not unresolved:
            return 0

        def get_priority(a):
            sev = a.severity.value if hasattr(a.severity, 'value') else str(a.severity)
            if sev.lower() == "critical":
                return 0
            if sev.lower() == "high":
                return 1
            if sev.lower() == "medium":
                return 2
            return 3

        # Sort: Highest severity first, then newest first
        sorted_alerts = sorted(unresolved, key=lambda a: (get_priority(a), -a.id))

        seen_keys = set()
        kept = []
        to_resolve = []

        for a in sorted_alerts:
            key = (a.vehicle_id, a.alert_type)
            # Eliminate duplicate alerts for the same vehicle and alert_type
            if key in seen_keys:
                to_resolve.append(a)
            else:
                seen_keys.add(key)
                if len(kept) < target_count:
                    kept.append(a)
                else:
                    to_resolve.append(a)

        now = datetime.utcnow()
        resolved_count = 0
        for alt in to_resolve:
            alt.is_resolved = True
            alt.resolved_at = now
            resolved_count += 1

        if resolved_count > 0:
            db.commit()

        return resolved_count

    @staticmethod
    def scan_all_maintenance_alerts(db: Session, max_active_alerts: int = 15) -> int:
        """
        Evaluates fleet maintenance schedules and generates alerts without exceeding
        the configured threshold (default 15, between 10-20), eliminating alert fatigue.
        """
        now = datetime.utcnow()

        # 1. Clean up existing duplicates and trim to target threshold
        MaintenanceService.deduplicate_and_trim_alerts(db, target_count=max_active_alerts)

        current_active = db.query(MaintenanceAlert).filter(MaintenanceAlert.is_resolved == False).count()
        if current_active >= max_active_alerts:
            return 0

        # Existing active alert keys to prevent duplication in this run
        existing_keys = set(
            (a.vehicle_id, a.alert_type) for a in db.query(MaintenanceAlert.vehicle_id, MaintenanceAlert.alert_type).filter(
                MaintenanceAlert.is_resolved == False
            ).all()
        )

        # All existing messages (active or resolved) to prevent resurrecting previously resolved alerts
        previous_messages = set(
            m[0] for m in db.query(MaintenanceAlert.message).all()
        )

        alerts_created = 0

        # 2. Critical priority maintenance checks (highest importance)
        critical_jobs = db.query(MaintenanceLog).filter(
            MaintenanceLog.priority == MaintenancePriority.CRITICAL,
            MaintenanceLog.status.in_([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS])
        ).all()

        for c_job in critical_jobs:
            if current_active + alerts_created >= max_active_alerts:
                break
            key = (c_job.vehicle_id, "CRITICAL_INSPECTION")
            msg = f"Critical Maintenance Alert on {c_job.vehicle_id}: {c_job.category} requires immediate mechanical intervention."
            if key not in existing_keys and msg not in previous_messages:
                db.add(MaintenanceAlert(
                    vehicle_id=c_job.vehicle_id,
                    alert_type="CRITICAL_INSPECTION",
                    severity=AlertSeverity.CRITICAL,
                    message=msg
                ))
                existing_keys.add(key)
                previous_messages.add(msg)
                alerts_created += 1

        # 3. Overdue maintenance checks
        overdue_jobs = db.query(MaintenanceLog).filter(
            MaintenanceLog.status == MaintenanceStatus.SCHEDULED,
            MaintenanceLog.scheduled_date < now
        ).all()

        for job in overdue_jobs:
            if current_active + alerts_created >= max_active_alerts:
                break
            key = (job.vehicle_id, "OVERDUE_SERVICE")
            msg = f"Urgent: Scheduled {job.category} for {job.vehicle_id} is overdue since {job.scheduled_date.strftime('%Y-%m-%d')}."
            if key not in existing_keys and msg not in previous_messages:
                db.add(MaintenanceAlert(
                    vehicle_id=job.vehicle_id,
                    alert_type="OVERDUE_SERVICE",
                    severity=AlertSeverity.HIGH,
                    message=msg
                ))
                existing_keys.add(key)
                previous_messages.add(msg)
                alerts_created += 1

        # 4. High mileage inspection warning
        vehicles = db.query(Vehicle).all()
        high_mileage_vehicles = set(
            v[0] for v in db.query(MaintenanceAlert.vehicle_id).filter(
                MaintenanceAlert.alert_type == "HIGH_MILEAGE"
            ).all()
        )
        for v in vehicles:
            if current_active + alerts_created >= max_active_alerts:
                break
            if v.odometer_km and v.odometer_km >= 25000:
                key = (v.vehicle_id, "HIGH_MILEAGE")
                if key not in existing_keys and v.vehicle_id not in high_mileage_vehicles:
                    msg = f"Vehicle {v.vehicle_id} exceeded {int(v.odometer_km):,} km. Comprehensive mechanical review recommended."
                    db.add(MaintenanceAlert(
                        vehicle_id=v.vehicle_id,
                        alert_type="HIGH_MILEAGE",
                        severity=AlertSeverity.MEDIUM,
                        message=msg
                    ))
                    existing_keys.add(key)
                    high_mileage_vehicles.add(v.vehicle_id)
                    alerts_created += 1

        if alerts_created > 0:
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
    def resolve_all_alerts(db: Session) -> int:
        now = datetime.utcnow()
        unresolved = db.query(MaintenanceAlert).filter(MaintenanceAlert.is_resolved == False).all()
        count = len(unresolved)
        for a in unresolved:
            a.is_resolved = True
            a.resolved_at = now
        db.commit()
        return count

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
