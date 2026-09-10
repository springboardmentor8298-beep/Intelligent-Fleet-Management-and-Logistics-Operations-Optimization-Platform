import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime
from datetime import datetime
from app.database import Base

class UserRole(str, enum.Enum):
    ADMINISTRATOR = "Administrator"
    FLEET_MANAGER = "Fleet Manager"
    DRIVER = "Driver"
    DISPATCHER = "Dispatcher"

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    IN_TRANSIT = "In Transit"
    MAINTENANCE = "Maintenance"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FLEET_MANAGER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, unique=True, index=True, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)