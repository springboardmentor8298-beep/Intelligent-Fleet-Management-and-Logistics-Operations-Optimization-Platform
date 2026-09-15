import sys
from app.database import SessionLocal, engine, Base
from app.models import Vehicle, Shipment, Trip, ShipmentStatus, VehicleStatus, RouteOptimizationType
from app.services.route_optimizer import RouteOptimizer

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()
print("1. Testing Database Connection & Models...")

# Test Vehicle lookup or creation
vehicle = db.query(Vehicle).first()
if not vehicle:
    vehicle = Vehicle(
        vehicle_id="TRK-101",
        registration_number="NY-9921-FLT",
        vehicle_type="Heavy Duty Truck",
        capacity=12.5,
        fuel_type="Diesel",
        status=VehicleStatus.AVAILABLE
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
print(f"Vehicle active: {vehicle.vehicle_id} (Capacity: {vehicle.capacity}T)")

# Test Route Optimization with all 4 strategies
print("2. Testing Route Optimization Engine...")
origin = (40.7128, -74.0060)
dest = (40.7589, -73.9851)

for strategy in ["Shortest Route", "Fastest Route", "Traffic Avoidance", "Fuel Efficient Route"]:
    res = RouteOptimizer.optimize_route(origin, dest, optimization_type=strategy)
    print(f"   [{strategy}] Distance: {res['total_distance_km']}km | Time: {res['estimated_duration_mins']}min | Fuel: {res['estimated_fuel_liters']}L")

# Test Shipment creation
print("3. Testing Shipment Workflow...")
shipment = db.query(Shipment).filter(Shipment.tracking_number == "TEST-FLT-001").first()
if not shipment:
    shipment = Shipment(
        tracking_number="TEST-FLT-001",
        origin="Brooklyn Terminal",
        destination="Queens Warehouse",
        origin_lat=40.6782,
        origin_lng=-73.9442,
        destination_lat=40.7282,
        destination_lng=-73.7949,
        weight_kg=450.0,
        status=ShipmentStatus.CREATED
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
print(f"Shipment active: {shipment.tracking_number} (Status: {shipment.status.value})")

db.close()
print("Milestone 2 backend verification test completed successfully!")
