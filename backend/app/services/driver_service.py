from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Driver, DriverAssignmentHistory, Vehicle, VehicleStatus, DriverStatus
from app.schemas import DriverCreate, DriverUpdate, DriverStatusUpdate

class DriverService:

    @staticmethod
    def generate_driver_code(db: Session) -> str:
        last = db.query(Driver).order_by(Driver.id.desc()).first()
        next_num = 101 if not last else last.id + 101
        return f"DRV-{next_num}"

    @staticmethod
    def register_driver(db: Session, data: DriverCreate) -> Driver:
        if db.query(Driver).filter(Driver.license_number == data.license_number).first():
            raise ValueError(f"License number '{data.license_number}' is already registered to another driver.")

        code = data.driver_code or DriverService.generate_driver_code(db)
        if db.query(Driver).filter(Driver.driver_code == code).first():
            code = DriverService.generate_driver_code(db)

        driver = Driver(
            driver_code=code,
            name=data.name,
            license_number=data.license_number,
            license_type=data.license_type or "CDL-A",
            phone=data.phone,
            email=data.email,
            status=DriverStatus.AVAILABLE,
            current_vehicle_id=None,
            rating=5.0,
            safety_score=98.0
        )

        db.add(driver)
        db.commit()
        db.refresh(driver)

        if data.current_vehicle_id and data.current_vehicle_id != "None":
            DriverService.assign_vehicle_to_driver(db, driver.id, data.current_vehicle_id, "System Initial Registration")

        return driver

    @staticmethod
    def get_drivers(db: Session, status_filter: Optional[str] = None, vehicle_filter: Optional[str] = None) -> List[Driver]:
        query = db.query(Driver)
        if status_filter:
            for s in DriverStatus:
                if status_filter.lower() in [s.value.lower(), s.name.lower()]:
                    query = query.filter(Driver.status == s)
                    break
        if vehicle_filter:
            query = query.filter(Driver.current_vehicle_id == vehicle_filter)
        return query.order_by(Driver.id.asc()).all()

    @staticmethod
    def get_driver_by_id(db: Session, driver_id: int) -> Optional[Driver]:
        return db.query(Driver).filter(Driver.id == driver_id).first()

    @staticmethod
    def update_driver(db: Session, driver_id: int, data: DriverUpdate) -> Optional[Driver]:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None

        if data.name is not None:
            driver.name = data.name
        if data.license_type is not None:
            driver.license_type = data.license_type
        if data.phone is not None:
            driver.phone = data.phone
        if data.email is not None:
            driver.email = data.email
        if data.status is not None:
            driver.status = data.status
        if data.rating is not None:
            driver.rating = data.rating

        db.commit()
        db.refresh(driver)
        return driver

    @staticmethod
    def update_status(db: Session, driver_id: int, new_status: DriverStatus) -> Optional[Driver]:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            return None

        driver.status = new_status
        db.commit()
        db.refresh(driver)
        return driver

    @staticmethod
    def assign_vehicle_to_driver(
        db: Session,
        driver_id: int,
        vehicle_id: Optional[str],
        assigned_by: str = "Fleet Manager",
        notes: Optional[str] = None
    ) -> Driver:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if not driver:
            raise ValueError(f"Driver ID {driver_id} not found.")

        # Unassign scenario
        if not vehicle_id or vehicle_id.strip() in ["", "None", "unassigned"]:
            if driver.current_vehicle_id:
                old_v = driver.current_vehicle_id
                # Record unassignment in history
                history = db.query(DriverAssignmentHistory).filter(
                    DriverAssignmentHistory.driver_id == driver.id,
                    DriverAssignmentHistory.vehicle_id == old_v,
                    DriverAssignmentHistory.unassigned_at == None
                ).first()
                if history:
                    history.unassigned_at = datetime.utcnow()

                driver.current_vehicle_id = None
                if driver.status == DriverStatus.ON_DUTY:
                    driver.status = DriverStatus.AVAILABLE
                db.commit()
                db.refresh(driver)
            return driver

        # Assignment scenario
        clean_vid = vehicle_id.strip()
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == clean_vid).first()
        if not vehicle:
            raise ValueError(f"Fleet vehicle '{clean_vid}' does not exist in registry.")

        if vehicle.status == VehicleStatus.MAINTENANCE:
            raise ValueError(f"Vehicle '{clean_vid}' is currently under MAINTENANCE. Allocation blocked until servicing completes.")

        if driver.status == DriverStatus.SUSPENDED:
            raise ValueError(f"Driver {driver.name} is currently SUSPENDED and cannot be assigned a vehicle asset.")

        # If vehicle is currently assigned to another driver, release it
        current_occupant = db.query(Driver).filter(
            Driver.current_vehicle_id == clean_vid,
            Driver.id != driver.id
        ).first()

        if current_occupant:
            current_occupant.current_vehicle_id = None
            if current_occupant.status == DriverStatus.ON_DUTY:
                current_occupant.status = DriverStatus.AVAILABLE
            # close occupant history
            occ_history = db.query(DriverAssignmentHistory).filter(
                DriverAssignmentHistory.driver_id == current_occupant.id,
                DriverAssignmentHistory.vehicle_id == clean_vid,
                DriverAssignmentHistory.unassigned_at == None
            ).first()
            if occ_history:
                occ_history.unassigned_at = datetime.utcnow()

        # If driver had a previous vehicle, close its history
        if driver.current_vehicle_id and driver.current_vehicle_id != clean_vid:
            prev_history = db.query(DriverAssignmentHistory).filter(
                DriverAssignmentHistory.driver_id == driver.id,
                DriverAssignmentHistory.vehicle_id == driver.current_vehicle_id,
                DriverAssignmentHistory.unassigned_at == None
            ).first()
            if prev_history:
                prev_history.unassigned_at = datetime.utcnow()

        # Assign to new vehicle
        driver.current_vehicle_id = clean_vid
        driver.last_assigned_at = datetime.utcnow()
        if driver.status == DriverStatus.OFF_DUTY:
            driver.status = DriverStatus.ON_DUTY

        # Create history entry
        new_history = DriverAssignmentHistory(
            driver_id=driver.id,
            vehicle_id=clean_vid,
            assigned_at=datetime.utcnow(),
            assigned_by=assigned_by,
            notes=notes or f"Assigned to {clean_vid}"
        )
        db.add(new_history)
        db.commit()
        db.refresh(driver)
        return driver

    @staticmethod
    def get_assignment_history(db: Session, driver_id: int) -> List[DriverAssignmentHistory]:
        return db.query(DriverAssignmentHistory).filter(
            DriverAssignmentHistory.driver_id == driver_id
        ).order_by(DriverAssignmentHistory.assigned_at.desc()).all()
