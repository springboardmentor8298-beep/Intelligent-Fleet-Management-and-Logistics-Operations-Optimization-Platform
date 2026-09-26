import socket
import logging
from urllib.parse import urlparse
from fastapi import APIRouter, BackgroundTasks, status
from app.tasks.maintenance_tasks import (
    check_maintenance_alerts_task,
    detect_fuel_anomalies_task,
    generate_operational_analytics_report_task,
    run_maintenance_alerts_job,
    run_fuel_anomalies_job,
    run_operational_report_job
)
from app.celery_app import celery_app, CELERY_BROKER_URL

logger = logging.getLogger("tasks_router")
router = APIRouter(prefix="/tasks", tags=["Background Jobs & Celery Orchestration"])

def is_redis_available() -> bool:
    try:
        parsed = urlparse(CELERY_BROKER_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=0.15):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

@router.get("/status")
def get_tasks_status():
    """Retrieve Celery background task engine status and active periodic schedules."""
    redis_active = is_redis_available()
    return {
        "engine": "Celery 5.4+ with Redis Broker",
        "broker_url": CELERY_BROKER_URL.split("@")[-1],  # redact credentials if any
        "broker_connected": redis_active,
        "periodic_schedules": [
            {
                "name": "check-maintenance-alerts-every-30-mins",
                "task": "check_maintenance_alerts_task",
                "interval": "Every 30 minutes",
                "purpose": "Audits fleet maintenance schedules, overdue servicing, and generates high-priority alerts."
            },
            {
                "name": "detect-fuel-anomalies-every-2-hours",
                "task": "detect_fuel_anomalies_task",
                "interval": "Every 2 hours",
                "purpose": "Analyzes fuel consumption variances, flags potential fuel theft, sensor errors, and leaks."
            },
            {
                "name": "generate-daily-operational-report",
                "task": "generate_operational_analytics_report_task",
                "interval": "Daily at 00:00 UTC",
                "purpose": "Compiles end-of-day fleet KPI metrics, asset utilization summaries, and cost distributions."
            }
        ],
        "status": "Configured & Active"
    }

@router.post("/run-maintenance-checks")
def trigger_maintenance_checks(background_tasks: BackgroundTasks):
    """
    On-demand trigger for Celery maintenance schedule check.
    Attempts Celery async dispatch if Redis is active; otherwise runs gracefully in background worker.
    """
    if is_redis_available():
        try:
            async_result = check_maintenance_alerts_task.apply_async(retry=False)
            return {
                "message": "Maintenance alerts evaluation job dispatched to Celery worker.",
                "task_id": async_result.id,
                "mode": "celery_async"
            }
        except Exception as e:
            logger.warning(f"Celery dispatch failed ({e}); falling back to background worker.")

    background_tasks.add_task(run_maintenance_alerts_job)
    return {
        "message": "Maintenance alerts evaluation job running in background task worker.",
        "mode": "background_fallback"
    }

@router.post("/detect-fuel-anomalies")
def trigger_fuel_anomaly_scan(background_tasks: BackgroundTasks):
    """
    On-demand trigger for Celery fuel anomaly detection.
    Attempts Celery async dispatch if Redis is active; otherwise runs gracefully in background worker.
    """
    if is_redis_available():
        try:
            async_result = detect_fuel_anomalies_task.apply_async(retry=False)
            return {
                "message": "Fuel anomaly detection scan dispatched to Celery worker.",
                "task_id": async_result.id,
                "mode": "celery_async"
            }
        except Exception as e:
            logger.warning(f"Celery dispatch failed ({e}); falling back to background worker.")

    background_tasks.add_task(run_fuel_anomalies_job)
    return {
        "message": "Fuel anomaly detection scan running in background task worker.",
        "mode": "background_fallback"
    }

@router.post("/generate-daily-report")
def trigger_operational_report(background_tasks: BackgroundTasks):
    """
    On-demand trigger for operational report compilation.
    """
    if is_redis_available():
        try:
            async_result = generate_operational_analytics_report_task.apply_async(retry=False)
            return {
                "message": "Operational analytics report compilation dispatched to Celery worker.",
                "task_id": async_result.id,
                "mode": "celery_async"
            }
        except Exception as e:
            logger.warning(f"Celery dispatch failed ({e}); falling back to background worker.")

    background_tasks.add_task(run_operational_report_job)
    return {
        "message": "Operational analytics report running in background task worker.",
        "mode": "background_fallback"
    }
