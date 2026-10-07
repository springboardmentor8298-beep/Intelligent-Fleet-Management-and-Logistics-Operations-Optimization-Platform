from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Vehicle, VehicleStatus, UserRole
from app.schemas import VehicleCreate, VehicleResponse, FleetMetrics
from app.auth import require_roles, get_current_user
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/vehicles", tags=["Fleet Management"])

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def register_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.FLEET_MANAGER]))
):
    if db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle.vehicle_id).first():
        raise HTTPException(status_code=400, detail="Vehicle ID already exists")
    if db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first():
        raise HTTPException(status_code=400, detail="Registration number already registered")

    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).order_by(Vehicle.id.desc()).all()

@router.get("/metrics", response_model=FleetMetrics)
def get_fleet_metrics(db: Session = Depends(get_db)):
    overview = AnalyticsService.get_operational_overview(db)
    total = overview["total_fleet_size"]
    in_transit = overview["active_fleet_count"]
    maintenance = overview["maintenance_fleet_count"]
    available = max(0, total - in_transit - maintenance)
    utilization = overview["fleet_utilization_rate"]

    return FleetMetrics(
        total_vehicles=total,
        available_vehicles=available,
        in_transit_vehicles=in_transit,
        maintenance_vehicles=maintenance,
        fleet_utilization_rate=round(utilization, 2)
    )