from celery import Celery
from datetime import datetime
from database import SessionLocal
from models import Maintenance


celery_app = Celery(
    "fleet_management",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)


# Celery Beat configuration
# For testing: run the maintenance check every 60 seconds.
celery_app.conf.timezone = "Asia/Kolkata"

celery_app.conf.beat_schedule = {
    "run-maintenance-check-daily": {
        "task": "celery_app.maintenance_check",
        "schedule": 60.0,
    },
}


@celery_app.task
def maintenance_check():
    db = SessionLocal()

    try:
        maintenance_records = db.query(Maintenance).all()

        today = datetime.now().date()
        due_maintenance = []

        for record in maintenance_records:
            try:
                maintenance_date = datetime.fromisoformat(
                    str(record.maintenance_date)
                ).date()

            except ValueError:
                print(
                    f"Could not read maintenance date for "
                    f"{record.vehicle_number}: {record.maintenance_date}"
                )
                continue

            if maintenance_date <= today and record.status != "Completed":
                due_maintenance.append(record)

        print("===== MAINTENANCE CHECK =====")

        if due_maintenance:
            print(
                f"Found {len(due_maintenance)} maintenance "
                f"record(s) that are due or overdue."
            )

            for record in due_maintenance:
                print(
                    f"Vehicle: {record.vehicle_number} | "
                    f"Type: {record.maintenance_type} | "
                    f"Date: {record.maintenance_date} | "
                    f"Status: {record.status}"
                )

        else:
            print("No maintenance is currently due.")

        print("=============================")

        return {
            "status": "completed",
            "due_count": len(due_maintenance)
        }

    finally:
        db.close()
