from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth_router, vehicle_router, shipments, trip_router, maintenance_router, driver_router, analytics_router, tasks_router

# Auto-generate DB schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FleetFlow Logistics Platform",
    description="Intelligent Fleet Management & Logistics Operations Optimization Platform (Milestones 1, 2, & 3)",
    version="3.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router.router)
app.include_router(vehicle_router.router)
app.include_router(shipments.router)
app.include_router(trip_router.router)
app.include_router(maintenance_router.router)
app.include_router(driver_router.router)
app.include_router(analytics_router.router)
app.include_router(tasks_router.router)

@app.get("/")
def root():
    return {
        "platform": "FleetFlow Logistics Platform",
        "status": "Operational",
        "version": "3.0.0",
        "milestones_active": [
            "Milestone 1: Core Setup & Fleet Monitoring",
            "Milestone 2: Shipment Tracking & Route Optimization",
            "Milestone 3: Maintenance Management & Analytics"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}