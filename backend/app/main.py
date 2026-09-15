from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth_router, vehicle_router, shipments, trip_router

# Auto-generate DB schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FleetFlow Logistics Platform",
    description="Intelligent Fleet Management & Logistics Operations Optimization Platform (Milestone 1 & 2)",
    version="2.0.0"
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

@app.get("/")
def root():
    return {
        "platform": "FleetFlow Logistics Platform",
        "status": "Operational",
        "version": "2.0.0",
        "milestones_active": ["Milestone 1: Core Setup & Fleet Monitoring", "Milestone 2: Shipment Tracking & Route Optimization"]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}