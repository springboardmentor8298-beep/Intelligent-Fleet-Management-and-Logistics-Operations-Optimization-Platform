import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..services.route_optimizer import RouteOptimizer

router = APIRouter(prefix="/trips", tags=["Trip Scheduling & Route Optimization"])

@router.post("/optimize-route", response_model=schemas.RouteOptimizeResponse)
def calculate_route_optimization(req: schemas.RouteOptimizeRequest):
    """
    Evaluates road distance, travel duration, and fuel consumption based on optimization criteria:
    - Shortest Route
    - Fastest Route
    - Traffic Avoidance
    - Fuel Efficient Route
    """
    waypoints = [tuple(w) for w in req.waypoints] if req.waypoints else []
    result = RouteOptimizer.optimize_route(
        origin=(req.origin_lat, req.origin_lng),
        destination=(req.destination_lat, req.destination_lng),
        waypoints=waypoints,
        optimization_type=req.optimization_type.value if req.optimization_type else "Fastest Route"
    )
    return result

@router.post("/schedule", response_model=schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def schedule_trip(req: schemas.TripScheduleRequest, db: Session = Depends(get_db)):
    """
    Schedules a logistical trip:
    (i) Validates vehicle availability and capacity against combined shipment weight.
    (ii) Optimizes the multi-stop route.
    (iii) Links shipments to the trip and marks them as Assigned.
    """
    # 1. Validate Vehicle
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == req.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle '{req.vehicle_id}' not found")
    if vehicle.status == models.VehicleStatus.MAINTENANCE:
        raise HTTPException(status_code=400, detail="Vehicle is currently in Maintenance and cannot be dispatched")

    # 2. Validate Shipments
    shipments = db.query(models.Shipment).filter(models.Shipment.id.in_(req.shipment_ids)).all()
    if len(shipments) != len(req.shipment_ids):
        raise HTTPException(status_code=400, detail="One or more specified shipment IDs do not exist")

    # 3. Capacity Verification (tons)
    total_weight_tons = sum(s.weight_kg for s in shipments) / 1000.0
    if total_weight_tons > vehicle.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Cargo overcapacity! Combined load ({total_weight_tons:.2f}T) exceeds vehicle maximum capacity ({vehicle.capacity:.2f}T)"
        )

    # 4. Route Calculation
    origin = (shipments[0].origin_lat, shipments[0].origin_lng)
    destination = (shipments[-1].destination_lat, shipments[-1].destination_lng)
    intermediate_stops = [(s.destination_lat, s.destination_lng) for s in shipments[:-1]]

    route_type_val = req.route_type.value if req.route_type else "Fastest Route"
    opt_route = RouteOptimizer.optimize_route(
        origin=origin,
        destination=destination,
        waypoints=intermediate_stops,
        optimization_type=route_type_val
    )

    # 5. Create Trip Record
    trip_code = req.trip_code or f"TRP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    trip = models.Trip(
        trip_code=trip_code,
        vehicle_id=vehicle.vehicle_id,
        driver_id=req.driver_id,
        status=models.TripStatus.SCHEDULED,
        route_type=req.route_type or models.RouteOptimizationType.FASTEST,
        total_distance_km=opt_route["total_distance_km"],
        estimated_duration_mins=opt_route["estimated_duration_mins"],
        estimated_fuel_liters=opt_route["estimated_fuel_liters"],
        planned_waypoints=opt_route["full_path"],
        scheduled_start=req.scheduled_start or datetime.utcnow()
    )
    db.add(trip)
    db.flush()

    # 6. Assign shipments to this trip
    for s in shipments:
        s.trip_id = trip.id
        s.vehicle_id = vehicle.vehicle_id
        s.status = models.ShipmentStatus.ASSIGNED
        event = models.ShipmentEvent(
            shipment_id=s.id,
            status=models.ShipmentStatus.ASSIGNED,
            location_desc=f"Assigned to Trip {trip.trip_code} (Vehicle: {vehicle.vehicle_id})",
            latitude=s.origin_lat,
            longitude=s.origin_lng,
            note=f"Scheduled for dispatch with {route_type_val} profile."
        )
        db.add(event)

    db.commit()
    db.refresh(trip)
    return trip

@router.get("/", response_model=List[schemas.TripResponse])
def list_trips(status_filter: Optional[models.TripStatus] = None, db: Session = Depends(get_db)):
    query = db.query(models.Trip)
    if status_filter:
        query = query.filter(models.Trip.status == status_filter)
    return query.order_by(models.Trip.id.desc()).all()

@router.get("/{trip_id}", response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.patch("/{trip_id}/status", response_model=schemas.TripResponse)
def update_trip_status(trip_id: int, new_status: models.TripStatus, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.status = new_status
    if new_status == models.TripStatus.IN_TRANSIT:
        trip.actual_start = datetime.utcnow()
        if trip.vehicle_id:
            db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == trip.vehicle_id).update(
                {"status": models.VehicleStatus.IN_TRANSIT}
            )
        for s in trip.shipments:
            s.status = models.ShipmentStatus.IN_TRANSIT
    elif new_status == models.TripStatus.COMPLETED:
        trip.completed_at = datetime.utcnow()
        if trip.vehicle_id:
            db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == trip.vehicle_id).update(
                {"status": models.VehicleStatus.AVAILABLE}
            )
        for s in trip.shipments:
            s.status = models.ShipmentStatus.DELIVERED
            s.delivered_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)
    return trip
