from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import MaintenanceLog, MaintenanceAlert, MaintenanceStatus, UserRole
from app.schemas import (
    MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse,
    MaintenanceAlertResponse, MaintenanceReportSummary
)
from app.services.maintenance_service import MaintenanceService
from app.auth import get_current_user

router = APIRouter(prefix="/maintenance", tags=["Maintenance Management"])

@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def schedule_service_job(payload: MaintenanceCreate, db: Session = Depends(get_db)):
    """Schedule a new preventive maintenance or repair servicing job for a fleet vehicle."""
    try:
        log = MaintenanceService.schedule_maintenance(db, payload)
        return log
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule maintenance: {str(e)}")

@router.get("/", response_model=List[MaintenanceResponse])
def list_maintenance_jobs(
    status_filter: Optional[str] = Query(None, description="Filter by status (Scheduled, In Progress, Completed, Cancelled)"),
    vehicle_id: Optional[str] = Query(None, description="Filter by vehicle ID"),
    category: Optional[str] = Query(None, description="Filter by service category"),
    db: Session = Depends(get_db)
):
    """Retrieve all maintenance service records with optional status, vehicle, and category filters."""
    query = db.query(MaintenanceLog)

    if status_filter:
        for s in MaintenanceStatus:
            if status_filter.lower() in [s.value.lower(), s.name.lower()]:
                query = query.filter(MaintenanceLog.status == s)
                break
    if vehicle_id:
        query = query.filter(MaintenanceLog.vehicle_id == vehicle_id.strip())
    if category:
        query = query.filter(MaintenanceLog.category.ilike(f"%{category.strip()}%"))

    return query.order_by(MaintenanceLog.scheduled_date.desc(), MaintenanceLog.id.desc()).all()

@router.get("/alerts/active", response_model=List[MaintenanceAlertResponse])
def get_active_maintenance_alerts(db: Session = Depends(get_db)):
    """Retrieve active unresolved maintenance alerts (overdue jobs, critical mechanical warnings, high mileage)."""
    # Trigger an on-the-fly alert check first
    MaintenanceService.scan_all_maintenance_alerts(db)
    return db.query(MaintenanceAlert).filter(
        MaintenanceAlert.is_resolved == False
    ).order_by(MaintenanceAlert.created_at.desc()).all()

@router.patch("/alerts/{alert_id}/resolve", response_model=MaintenanceAlertResponse)
def resolve_maintenance_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark a maintenance alert as resolved."""
    alert = MaintenanceService.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert ID {alert_id} not found.")
    return alert

@router.get("/reports/summary", response_model=MaintenanceReportSummary)
def get_maintenance_report_summary(db: Session = Depends(get_db)):
    """Retrieve aggregated maintenance metrics, categorized costs, and job counts."""
    return MaintenanceService.get_summary_report(db)

@router.get("/{job_id}", response_model=MaintenanceResponse)
def get_maintenance_job(job_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific maintenance service job."""
    log = db.query(MaintenanceLog).filter(MaintenanceLog.job_id == job_id.strip()).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Maintenance job '{job_id}' not found.")
    return log

@router.patch("/{job_id}", response_model=MaintenanceResponse)
def update_maintenance_job(job_id: str, payload: MaintenanceUpdate, db: Session = Depends(get_db)):
    """Update maintenance job status (In Progress, Completed), costs, completion date, and notes."""
    log = MaintenanceService.update_maintenance(db, job_id.strip(), payload)
    if not log:
        raise HTTPException(status_code=404, detail=f"Maintenance job '{job_id}' not found.")
    return log

@router.delete("/{job_id}")
def cancel_maintenance_job(job_id: str, db: Session = Depends(get_db)):
    """Cancel and delete a scheduled maintenance job."""
    log = db.query(MaintenanceLog).filter(MaintenanceLog.job_id == job_id.strip()).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Maintenance job '{job_id}' not found.")
    db.delete(log)
    db.commit()
    return {"message": f"Maintenance job '{job_id}' successfully removed."}
