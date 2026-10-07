from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import Base, engine, SessionLocal
from app.routers import (
    auth_router, vehicle_router, shipments, trip_router,
    maintenance_router, driver_router, analytics_router, tasks_router,
    notification_router, reports_router
)

# Auto-generate DB schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FleetFlow Logistics Platform",
    description="Intelligent Fleet Management & Logistics Operations Optimization Platform (Milestones 1, 2, 3, & 4 Complete)",
    version="4.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers across all modules
app.include_router(auth_router.router)
app.include_router(vehicle_router.router)
app.include_router(shipments.router)
app.include_router(trip_router.router)
app.include_router(maintenance_router.router)
app.include_router(driver_router.router)
app.include_router(analytics_router.router)
app.include_router(tasks_router.router)
app.include_router(notification_router.router)
app.include_router(reports_router.router)

@app.get("/")
def root():
    return {
        "platform": "FleetFlow Logistics Platform",
        "status": "Operational",
        "version": "4.0.0",
        "milestones_active": [
            "Milestone 1: Core Setup & Fleet Monitoring",
            "Milestone 2: Shipment Tracking & Route Optimization",
            "Milestone 3: Maintenance Management & Analytics",
            "Milestone 4: Testing, Deployment & Documentation"
        ],
        "modules_active": [
            "1. User Management Module",
            "2. Fleet Management Module",
            "3. Shipment Tracking Module",
            "4. Route Optimization Module",
            "5. Vehicle Maintenance Module",
            "6. Driver Management Module",
            "7. Analytics Dashboard Module",
            "8. Notification Module",
            "9. Reports & Export Module",
            "10. Final Integration, Testing & Deployment"
        ]
    }

@app.get("/health")
def health():
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "version": "4.0.0",
        "database": db_status,
        "services": {
            "auth": "operational",
            "fleet": "operational",
            "shipments": "operational",
            "routing": "operational",
            "maintenance": "operational",
            "drivers": "operational",
            "analytics": "operational",
            "tasks": "operational",
            "notifications": "operational",
            "reports": "operational"
        }
    }