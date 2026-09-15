from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models import UserRole, VehicleStatus, ShipmentStatus, TripStatus, RouteOptimizationType

# --- User Schemas ---
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

# --- Vehicle Schemas ---
class VehicleCreate(BaseModel):
    vehicle_id: str
    registration_number: str
    vehicle_type: str
    capacity: float
    fuel_type: str
    status: Optional[VehicleStatus] = VehicleStatus.AVAILABLE

class VehicleResponse(VehicleCreate):
    id: int
    current_lat: Optional[float] = 13.0827
    current_lng: Optional[float] = 80.2707

    class Config:
        from_attributes = True

class FleetMetrics(BaseModel):
    total_vehicles: int
    available_vehicles: int
    in_transit_vehicles: int
    maintenance_vehicles: int
    fleet_utilization_rate: float

# --- Milestone 2: Shipment & Tracking Schemas ---
class ShipmentCreate(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    vehicle_id: Optional[str] = None
    sender_name: Optional[str] = "FleetFlow Dispatch"
    recipient_name: Optional[str] = "Customer"
    recipient_phone: Optional[str] = None
    weight_kg: Optional[float] = 100.0
    origin_lat: Optional[float] = 13.0827
    origin_lng: Optional[float] = 80.2707
    destination_lat: Optional[float] = 6.9271
    destination_lng: Optional[float] = 79.8612
    delivery_notes: Optional[str] = None

class ShipmentResponse(ShipmentCreate):
    id: int
    status: ShipmentStatus
    eta: Optional[str] = None
    distance_km: Optional[float] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    speed_kmh: Optional[float] = 0.0
    trip_id: Optional[int] = None
    created_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ShipmentEventResponse(BaseModel):
    id: int
    shipment_id: int
    status: ShipmentStatus
    location_desc: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ShipmentDetailResponse(ShipmentResponse):
    events: List[ShipmentEventResponse] = []

class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus
    location_desc: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None

# --- Milestone 2: Trip & Route Optimization Schemas ---
class RouteOptimizeRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    waypoints: Optional[List[List[float]]] = []
    optimization_type: Optional[RouteOptimizationType] = RouteOptimizationType.FASTEST

class RouteOptimizeResponse(BaseModel):
    optimization_type: str
    total_distance_km: float
    estimated_duration_mins: float
    eta_formatted: str
    estimated_fuel_liters: float
    profile_description: str
    waypoints: List[Any]
    full_path: List[List[float]]

class TripScheduleRequest(BaseModel):
    trip_code: Optional[str] = None
    vehicle_id: str
    driver_id: Optional[int] = None
    shipment_ids: List[int]
    route_type: Optional[RouteOptimizationType] = RouteOptimizationType.FASTEST
    scheduled_start: Optional[datetime] = None

class TripResponse(BaseModel):
    id: int
    trip_code: str
    vehicle_id: Optional[str]
    driver_id: Optional[int]
    status: TripStatus
    route_type: RouteOptimizationType
    total_distance_km: float
    estimated_duration_mins: float
    estimated_fuel_liters: float
    planned_waypoints: Optional[List[Any]] = []
    scheduled_start: datetime
    actual_start: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    shipments: List[ShipmentResponse] = []

    class Config:
        from_attributes = True

class LiveTelemetryPayload(BaseModel):
    trip_code: Optional[str] = None
    tracking_number: Optional[str] = None
    latitude: float
    longitude: float
    speed_kmh: Optional[float] = 45.0
    heading_deg: Optional[float] = 0.0