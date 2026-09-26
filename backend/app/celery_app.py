import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# Broker and backend configuration with sensible defaults
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

celery_app = Celery(
    "fleetflow_celery",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks.maintenance_tasks"]
)

# Celery Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    task_publish_retry=False,
    broker_transport_options={
        "max_retries": 1,
        "socket_timeout": 0.8,
        "socket_connect_timeout": 0.8
    },
    # Periodic background beat schedules for Milestone 3 operational workflows
    beat_schedule={
        "check-maintenance-alerts-every-30-mins": {
            "task": "check_maintenance_alerts_task",
            "schedule": 1800.0,  # every 30 minutes
        },
        "detect-fuel-anomalies-every-2-hours": {
            "task": "detect_fuel_anomalies_task",
            "schedule": 7200.0,  # every 2 hours
        },
        "generate-daily-operational-report": {
            "task": "generate_operational_analytics_report_task",
            "schedule": crontab(hour=0, minute=0),  # midnight UTC daily
        }
    }
)
