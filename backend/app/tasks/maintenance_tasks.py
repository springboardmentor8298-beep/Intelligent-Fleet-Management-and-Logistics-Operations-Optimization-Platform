import logging
from datetime import datetime
from app.celery_app import celery_app
from app.database import SessionLocal
from app.services.maintenance_service import MaintenanceService
from app.services.analytics_service import AnalyticsService
from app.models import FuelLog, Vehicle

logger = logging.getLogger("celery_tasks")

@celery_app.task(name="check_maintenance_alerts_task")
def check_maintenance_alerts_task():
    """
    Background job that evaluates fleet maintenance schedules,
    flags overdue service jobs, high-mileage thresholds, and generates alerts.
    """
    logger.info("Executing periodic maintenance alerts evaluation task...")
    db = SessionLocal()
    try:
        alerts_count = MaintenanceService.scan_all_maintenance_alerts(db)
        logger.info(f"Maintenance check completed: {alerts_count} new alerts generated.")
        return {
            "status": "success",
            "task": "check_maintenance_alerts_task",
            "alerts_generated": alerts_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error executing maintenance alerts task: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="detect_fuel_anomalies_task")
def detect_fuel_anomalies_task():
    """
    Background job that analyzes historical fuel logs, checks for
    consumption rate outliers or abnormal variances, and updates anomaly flags.
    """
    logger.info("Executing background fuel anomaly detection scan...")
    db = SessionLocal()
    try:
        logs = db.query(FuelLog).all()
        flagged = 0
        for l in logs:
            if l.fuel_efficiency_km_per_l and l.fuel_efficiency_km_per_l < 1.8 and not l.is_anomaly:
                l.is_anomaly = True
                l.anomaly_reason = f"Abnormally high consumption rate ({l.fuel_efficiency_km_per_l} km/L) identified during background audit."
                flagged += 1
            elif l.liters_filled > 300.0 and not l.is_anomaly:
                l.is_anomaly = True
                l.anomaly_reason = f"Excessive tank fill volume ({l.liters_filled}L) exceeded baseline threshold."
                flagged += 1
        db.commit()
        logger.info(f"Fuel anomaly scan completed: {flagged} new anomalies flagged.")
        return {
            "status": "success",
            "task": "detect_fuel_anomalies_task",
            "anomalies_flagged": flagged,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in fuel anomaly detection task: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="generate_operational_analytics_report_task")
def generate_operational_analytics_report_task():
    """
    Background job that aggregates end-of-day operational metrics,
    calculates fleet performance, and archives operations report.
    """
    logger.info("Executing operational analytics report generation...")
    db = SessionLocal()
    try:
        report_data = AnalyticsService.get_operational_overview(db)
        logger.info(f"Operational report aggregated successfully: {report_data}")
        return {
            "status": "success",
            "task": "generate_operational_analytics_report_task",
            "summary": report_data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error generating operational report: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# Direct execution handlers for development/fallback when Celery worker is offline
def run_maintenance_alerts_job():
    return check_maintenance_alerts_task()

def run_fuel_anomalies_job():
    return detect_fuel_anomalies_task()

def run_operational_report_job():
    return generate_operational_analytics_report_task()
