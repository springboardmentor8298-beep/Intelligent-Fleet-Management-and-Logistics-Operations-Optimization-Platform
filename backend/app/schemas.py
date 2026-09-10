from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models import UserRole, VehicleStatus

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class VehicleCreate(BaseModel):
    vehicle_id: str
    registration_number: str
    vehicle_type: str
    capacity: float
    fuel_type: str
    status: Optional[VehicleStatus] = VehicleStatus.AVAILABLE

class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        from_attributes = True

class FleetMetrics(BaseModel):
    total_vehicles: int
    available_vehicles: int
    in_transit_vehicles: int
    maintenance_vehicles: int
    fleet_utilization_rate: float