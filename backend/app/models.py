import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text, JSON, TypeDecorator, Boolean
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

class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class MaintenancePriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    ON_DUTY = "On Duty"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"

class AlertSeverity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

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
    odometer_km = Column(Float, default=15000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    shipments = relationship("Shipment", back_populates="vehicle")
    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_alerts = relationship("MaintenanceAlert", back_populates="vehicle", cascade="all, delete-orphan")
    fuel_logs = relationship("FuelLog", back_populates="vehicle", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="current_vehicle")

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

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    category = Column(String, nullable=False)
    service_center = Column(String, default="Central Fleet Depot")
    status = Column(FlexibleEnum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED, nullable=False)
    priority = Column(FlexibleEnum(MaintenancePriority), default=MaintenancePriority.MEDIUM, nullable=False)
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    completed_date = Column(DateTime, nullable=True)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, nullable=True)
    odometer_reading = Column(Float, default=0.0)
    next_service_odometer = Column(Float, nullable=True)
    next_service_date = Column(DateTime, nullable=True)
    performed_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class MaintenanceAlert(Base):
    __tablename__ = "maintenance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    alert_type = Column(String, nullable=False)
    severity = Column(FlexibleEnum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    message = Column(String, nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_alerts")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    license_type = Column(String, default="CDL-A")
    license_expiry = Column(DateTime, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    status = Column(FlexibleEnum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False)
    current_vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=True)
    rating = Column(Float, default=4.9)
    total_trips = Column(Integer, default=0)
    total_hours_driven = Column(Float, default=0.0)
    safety_score = Column(Float, default=98.0)
    last_assigned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    current_vehicle = relationship("Vehicle", back_populates="drivers")
    assignment_history = relationship("DriverAssignmentHistory", back_populates="driver", cascade="all, delete-orphan")

class DriverAssignmentHistory(Base):
    __tablename__ = "driver_assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    unassigned_at = Column(DateTime, nullable=True)
    assigned_by = Column(String, default="Fleet Manager")
    notes = Column(String, nullable=True)

    driver = relationship("Driver", back_populates="assignment_history")

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, ForeignKey("vehicles.vehicle_id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters_filled = Column(Float, nullable=False)
    cost_per_liter = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    odometer_reading = Column(Float, default=0.0)
    fuel_type = Column(String, default="Diesel")
    fuel_station = Column(String, nullable=True)
    fuel_efficiency_km_per_l = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip")

class NotificationType(str, enum.Enum):
    MAINTENANCE_ALERT = "Maintenance Alert"
    DELIVERY_NOTIFICATION = "Delivery Notification"
    DRIVER_ASSIGNMENT = "Driver Assignment Alert"
    SHIPMENT_STATUS = "Shipment Status Update"
    ROUTE_CHANGE = "Route Change Alert"
    SYSTEM_ALERT = "System Alert"

class NotificationChannel(str, enum.Enum):
    EMAIL = "Email"
    SMS = "SMS"
    PUSH = "Push"
    IN_APP = "In-App"

class NotificationRecord(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_type = Column(FlexibleEnum(NotificationType), nullable=False)
    channel = Column(FlexibleEnum(NotificationChannel), default=NotificationChannel.IN_APP, nullable=False)
    recipient = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(String, nullable=True)
    status = Column(String, default="SENT")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)