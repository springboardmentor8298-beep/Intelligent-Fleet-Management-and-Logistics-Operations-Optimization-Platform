import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text, JSON, TypeDecorator
from sqlalchemy.orm import relationship
from app.database import Base

class FlexibleEnum(TypeDecorator):
    """
    Robust Enum type decorator that accepts both enum member names (e.g. 'IN_TRANSIT')
    and display values (e.g. 'In Transit'), handling case and whitespace variations.
    """
    impl = String
    cache_ok = True

    def __init__(self, enum_cls, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_cls = enum_cls

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_cls):
            return value.name
        val_str = str(value).strip()
        for member in self.enum_cls:
            if val_str == member.name or val_str == member.value:
                return member.name
            if val_str.upper().replace(" ", "_") == member.name:
                return member.name
        return val_str

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_cls):
            return value
        val_str = str(value).strip()
        for member in self.enum_cls:
            if val_str == member.name or val_str == member.value:
                return member
            if val_str.upper().replace(" ", "_") == member.name:
                return member
        try:
            return self.enum_cls[val_str]
        except (KeyError, ValueError):
            try:
                return self.enum_cls(val_str)
            except (KeyError, ValueError):
                return val_str

class UserRole(str, enum.Enum):
    ADMINISTRATOR = "Administrator"
    FLEET_MANAGER = "Fleet Manager"
    DRIVER = "Driver"
    DISPATCHER = "Dispatcher"

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    IN_TRANSIT = "In Transit"
    MAINTENANCE = "Maintenance"

class ShipmentStatus(str, enum.Enum):
    CREATED = "Created"
    ASSIGNED = "Assigned"
    IN_TRANSIT = "In Transit"
    DELAYED = "Delayed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class TripStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_TRANSIT = "In Transit"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class RouteOptimizationType(str, enum.Enum):
    SHORTEST = "Shortest Route"
    FASTEST = "Fastest Route"
    TRAFFIC_AVOIDANCE = "Traffic Avoidance"
    FUEL_EFFICIENT = "Fuel Efficient Route"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(FlexibleEnum(UserRole), default=UserRole.FLEET_MANAGER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trips = relationship("Trip", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, unique=True, index=True, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)
    status = Column(FlexibleEnum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False)
    current_lat = Column(Float, default=13.0827)
    current_lng = Column(Float, default=80.2707)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    shipments = relationship("Shipment", back_populates="vehicle")
    trips = relationship("Trip", back_populates="vehicle")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    trip_code = Column(String, unique=True, index=True, nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(FlexibleEnum(TripStatus), default=TripStatus.SCHEDULED, nullable=False)
    route_type = Column(FlexibleEnum(RouteOptimizationType), default=RouteOptimizationType.FASTEST, nullable=False)
    
    total_distance_km = Column(Float, default=0.0)
    estimated_duration_mins = Column(Float, default=0.0)
    estimated_fuel_liters = Column(Float, default=0.0)
    planned_waypoints = Column(JSON, default=list)  # list of [lat, lng]
    
    scheduled_start = Column(DateTime, default=datetime.utcnow)
    actual_start = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("User", back_populates="trips")
    shipments = relationship("Shipment", back_populates="trip")
    breadcrumbs = relationship("GPSBreadcrumb", back_populates="trip", cascade="all, delete-orphan")

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=False)
    sender_name = Column(String, default="FleetFlow Dispatch")
    recipient_name = Column(String, default="Customer")
    recipient_phone = Column(String, nullable=True)
    weight_kg = Column(Float, default=100.0)
    
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    origin_lat = Column(Float, default=13.0827)
    origin_lng = Column(Float, default=80.2707)
    destination_lat = Column(Float, default=6.9271)
    destination_lng = Column(Float, default=79.8612)

    status = Column(FlexibleEnum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False)
    eta = Column(String, nullable=True)
    distance_km = Column(Float, nullable=True)
    current_lat = Column(Float, default=13.0827)
    current_lng = Column(Float, default=80.2707)
    speed_kmh = Column(Float, default=0.0)
    delivery_notes = Column(Text, nullable=True)
    
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="shipments")
    trip = relationship("Trip", back_populates="shipments")
    events = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")

class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    status = Column(FlexibleEnum(ShipmentStatus), nullable=False)
    location_desc = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    note = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    shipment = relationship("Shipment", back_populates="events")

class GPSBreadcrumb(Base):
    __tablename__ = "gps_breadcrumbs"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    vehicle_id = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="breadcrumbs")