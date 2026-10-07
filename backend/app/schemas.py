from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models import (
    UserRole, VehicleStatus, ShipmentStatus, TripStatus, RouteOptimizationType,
    MaintenanceStatus, MaintenancePriority, DriverStatus, AlertSeverity,
    NotificationType, NotificationChannel
)

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

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class AccountSettingsResponse(BaseModel):
    email: str
    role: str
    notifications_enabled: bool = True
    sms_alerts_enabled: bool = True
    email_digests_enabled: bool = True
    theme_preference: str = "dark"
    language: str = "en"
    timezone: str = "UTC"

class AccountSettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    sms_alerts_enabled: Optional[bool] = None
    email_digests_enabled: Optional[bool] = None
    theme_preference: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

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

# --- Milestone 3: Maintenance Management Schemas ---
class MaintenanceCreate(BaseModel):
    vehicle_id: str
    category: str
    service_center: Optional[str] = "Central Fleet Depot"
    priority: Optional[MaintenancePriority] = MaintenancePriority.MEDIUM
    scheduled_date: Optional[datetime] = None
    estimated_cost: Optional[float] = 0.0
    odometer_reading: Optional[float] = 0.0
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    actual_cost: Optional[float] = None
    completed_date: Optional[datetime] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    next_service_odometer: Optional[float] = None
    next_service_date: Optional[datetime] = None

class MaintenanceResponse(BaseModel):
    id: int
    job_id: str
    vehicle_id: str
    category: str
    service_center: str
    status: MaintenanceStatus
    priority: MaintenancePriority
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    estimated_cost: float
    actual_cost: Optional[float] = None
    odometer_reading: float
    next_service_odometer: Optional[float] = None
    next_service_date: Optional[datetime] = None
    performed_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MaintenanceAlertResponse(BaseModel):
    id: int
    vehicle_id: str
    alert_type: str
    severity: AlertSeverity
    message: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MaintenanceReportSummary(BaseModel):
    total_jobs: int
    scheduled_jobs: int
    in_progress_jobs: int
    completed_jobs: int
    total_maintenance_cost: float
    active_alerts_count: int
    cost_by_category: Dict[str, float]

# --- Milestone 3: Driver Management Schemas ---
class DriverCreate(BaseModel):
    driver_code: Optional[str] = None
    name: str
    license_number: str
    license_type: Optional[str] = "CDL-A"
    phone: Optional[str] = None
    email: Optional[str] = None
    current_vehicle_id: Optional[str] = None

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[DriverStatus] = None
    rating: Optional[float] = None

class DriverStatusUpdate(BaseModel):
    status: DriverStatus

class DriverAssignmentRequest(BaseModel):
    vehicle_id: Optional[str] = None  # None/empty string or 'None' to unassign
    notes: Optional[str] = None

class DriverAssignmentHistoryResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_id: str
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None
    assigned_by: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DriverResponse(BaseModel):
    id: int
    driver_code: str
    name: str
    license_number: str
    license_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    status: DriverStatus
    current_vehicle_id: Optional[str] = None
    rating: float
    total_trips: int
    total_hours_driven: float
    safety_score: float
    last_assigned_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Milestone 3: Fuel Monitoring Schemas ---
class FuelLogCreate(BaseModel):
    vehicle_id: str
    liters_filled: float
    cost_per_liter: float
    odometer_reading: float
    trip_id: Optional[int] = None
    fuel_type: Optional[str] = "Diesel"
    fuel_station: Optional[str] = "Fleet Fueling Depot"

class FuelLogResponse(BaseModel):
    id: int
    vehicle_id: str
    trip_id: Optional[int] = None
    liters_filled: float
    cost_per_liter: float
    total_cost: float
    odometer_reading: float
    fuel_type: str
    fuel_station: Optional[str] = None
    fuel_efficiency_km_per_l: Optional[float] = None
    is_anomaly: bool
    anomaly_reason: Optional[str] = None
    logged_at: datetime

    class Config:
        from_attributes = True

class FuelAnalyticsResponse(BaseModel):
    total_liters: float
    total_fuel_cost: float
    average_efficiency_km_per_l: float
    average_consumption_l_per_100km: float
    fuel_cost_per_km: float
    eco_route_savings_liters: float
    eco_route_savings_usd: float
    anomalies_detected: int
    vehicle_fuel_breakdown: List[Dict[str, Any]]
    anomalies: List[FuelLogResponse]

# --- Milestone 3: Operational Analytics & Dashboard Schemas ---
class OperationalOverviewResponse(BaseModel):
    total_fleet_size: int
    active_fleet_count: int
    maintenance_fleet_count: int
    fleet_utilization_rate: float
    on_time_delivery_rate: float
    total_shipments_delivered: int
    total_distance_km: float
    base_operations_distance_km: Optional[float] = None
    gps_logged_distance_km: Optional[float] = 0.0
    total_fuel_consumed_liters: float
    total_maintenance_spend: float
    active_maintenance_alerts: int

class FleetUtilizationResponse(BaseModel):
    overall_utilization: float
    by_vehicle_type: List[Dict[str, Any]]
    status_distribution: Dict[str, int]

class FleetPerformanceResponse(BaseModel):
    reliability_index: float
    on_time_delivery_rate: float
    average_transit_minutes: float
    incident_delay_rate: float
    top_performing_drivers: List[Dict[str, Any]]
    highest_maintenance_vehicles: List[Dict[str, Any]]

# --- Milestone 4: Notification Module Schemas ---
class NotificationCreate(BaseModel):
    notification_type: NotificationType
    channel: Optional[NotificationChannel] = NotificationChannel.IN_APP
    recipient: str
    title: str
    message: str
    reference_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    notification_type: NotificationType
    channel: NotificationChannel
    recipient: str
    title: str
    message: str
    reference_id: Optional[str] = None
    status: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationDispatchResult(BaseModel):
    notification_id: int
    channel: str
    recipient: str
    status: str
    dispatch_timestamp: datetime
    details: Optional[str] = None

# --- Milestone 4: Reports & Export Module Schemas ---
class ReportExportRequest(BaseModel):
    report_type: str  # fleet_utilization, fuel_consumption, driver_performance, delivery_performance, maintenance
    format: str = "pdf"  # pdf, csv, excel, json
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None