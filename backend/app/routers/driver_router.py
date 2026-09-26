from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Driver, DriverStatus, DriverAssignmentHistory
from app.schemas import (
    DriverCreate, DriverUpdate, DriverStatusUpdate, DriverResponse,
    DriverAssignmentRequest, DriverAssignmentHistoryResponse
)
from app.services.driver_service import DriverService
from app.auth import get_current_user

router = APIRouter(prefix="/drivers", tags=["Driver Management"])

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def register_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    """Register a new commercial fleet driver into the roster."""
    try:
        driver = DriverService.register_driver(db, payload)
        return driver
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register driver: {str(e)}")

@router.get("/", response_model=List[DriverResponse])
def list_drivers(
    status_filter: Optional[str] = Query(None, description="Filter by driver status (Available, On Duty, Off Duty, On Trip)"),
    vehicle_filter: Optional[str] = Query(None, description="Filter by assigned vehicle ID"),
    db: Session = Depends(get_db)
):
    """Retrieve all drivers with optional filtering by duty status and assigned vehicle."""
    return DriverService.get_drivers(db, status_filter=status_filter, vehicle_filter=vehicle_filter)

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver_profile(driver_id: int, db: Session = Depends(get_db)):
    """Retrieve complete profile of a commercial driver."""
    driver = DriverService.get_driver_by_id(db, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver ID {driver_id} not found.")
    return driver

@router.patch("/{driver_id}", response_model=DriverResponse)
def update_driver_profile(driver_id: int, payload: DriverUpdate, db: Session = Depends(get_db)):
    """Update driver personal information, license endorsements, or safety rating."""
    driver = DriverService.update_driver(db, driver_id, payload)
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver ID {driver_id} not found.")
    return driver

@router.patch("/{driver_id}/status", response_model=DriverResponse)
def update_driver_status(driver_id: int, payload: DriverStatusUpdate, db: Session = Depends(get_db)):
    """Update driver duty status (Available, On Duty, Off Duty, On Trip)."""
    driver = DriverService.update_status(db, driver_id, payload.status)
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver ID {driver_id} not found.")
    return driver

@router.post("/{driver_id}/assign", response_model=DriverResponse)
def assign_vehicle_to_driver(
    driver_id: int,
    payload: DriverAssignmentRequest,
    db: Session = Depends(get_db)
):
    """
    Assign a specific vehicle asset to a driver.
    Validates vehicle maintenance status, ensures vehicle availability, and updates assignment history.
    """
    try:
        driver = DriverService.assign_vehicle_to_driver(
            db=db,
            driver_id=driver_id,
            vehicle_id=payload.vehicle_id,
            notes=payload.notes
        )
        return driver
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(e)}")

@router.post("/{driver_id}/unassign", response_model=DriverResponse)
def unassign_vehicle_from_driver(driver_id: int, db: Session = Depends(get_db)):
    """Unassign currently allocated vehicle asset from driver."""
    try:
        driver = DriverService.assign_vehicle_to_driver(
            db=db,
            driver_id=driver_id,
            vehicle_id=None,
            notes="Driver unassigned via FleetFlow Console"
        )
        return driver
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/{driver_id}/history", response_model=List[DriverAssignmentHistoryResponse])
def get_driver_assignment_history(driver_id: int, db: Session = Depends(get_db)):
    """Retrieve full historical vehicle assignment log for a driver."""
    return DriverService.get_assignment_history(db, driver_id)
