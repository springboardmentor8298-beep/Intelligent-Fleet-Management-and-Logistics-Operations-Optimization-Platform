import json
import math
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas
from ..services.route_optimizer import RouteOptimizer
from ..services.geocoder import geocode_location

router = APIRouter(prefix="/shipments", tags=["Shipment Tracking"])

@router.get("/geocode")
def geocode_api(q: str):
    """
    Geocodes any global city, address, or port.
    Returns latitude, longitude, and formatted display name.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    res = geocode_location(q.strip())
    if not res:
        raise HTTPException(status_code=404, detail=f"Location '{q}' could not be resolved")
    return {
        "query": q,
        "lat": res[0],
        "lng": res[1],
        "display_name": res[2]
    }

# In-memory WebSocket connection manager for live shipment tracking
class ShipmentConnectionManager:
    def __init__(self):
        self.active_rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, tracking_number: str, websocket: WebSocket):
        await websocket.accept()
        if tracking_number not in self.active_rooms:
            self.active_rooms[tracking_number] = []
        self.active_rooms[tracking_number].append(websocket)

    def disconnect(self, tracking_number: str, websocket: WebSocket):
        if tracking_number in self.active_rooms:
            if websocket in self.active_rooms[tracking_number]:
                self.active_rooms[tracking_number].remove(websocket)
            if not self.active_rooms[tracking_number]:
                del self.active_rooms[tracking_number]

    async def broadcast(self, tracking_number: str, data: dict):
        if tracking_number in self.active_rooms:
            for ws in list(self.active_rooms[tracking_number]):
                try:
                    await ws.send_text(json.dumps(data))
                except Exception:
                    self.active_rooms[tracking_number].remove(ws)

manager = ShipmentConnectionManager()

@router.post("/", response_model=schemas.ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(shipment_in: schemas.ShipmentCreate, db: Session = Depends(get_db)):
    # Check duplicate tracking number
    existing = db.query(models.Shipment).filter(models.Shipment.tracking_number == shipment_in.tracking_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Tracking number {shipment_in.tracking_number} already exists")

    origin_lat = shipment_in.origin_lat
    origin_lng = shipment_in.origin_lng
    dest_lat = shipment_in.destination_lat
    dest_lng = shipment_in.destination_lng

    # Intelligent Auto-Geocoding: if location text entered, resolve to true GPS coordinates
    if shipment_in.origin:
        geo_orig = geocode_location(shipment_in.origin)
        if geo_orig:
            # Overwrite if unprovided or left at placeholder default
            if origin_lat is None or origin_lat == 0.0 or (origin_lat == 13.0827 and "chennai" not in shipment_in.origin.lower()):
                origin_lat, origin_lng = geo_orig[0], geo_orig[1]

    if shipment_in.destination:
        geo_dest = geocode_location(shipment_in.destination)
        if geo_dest:
            if dest_lat is None or dest_lat == 0.0 or (dest_lat == 6.9271 and "colombo" not in shipment_in.destination.lower()):
                dest_lat, dest_lng = geo_dest[0], geo_dest[1]

    origin_lat = origin_lat if origin_lat is not None else 13.0827
    origin_lng = origin_lng if origin_lng is not None else 80.2707
    dest_lat = dest_lat if dest_lat is not None else 6.9271
    dest_lng = dest_lng if dest_lng is not None else 79.8612

    # Initial route distance & ETA estimation
    route_calc = RouteOptimizer.optimize_route(
        origin=(origin_lat, origin_lng),
        destination=(dest_lat, dest_lng),
        optimization_type="Fastest Route"
    )

    db_shipment = models.Shipment(
        tracking_number=shipment_in.tracking_number,
        sender_name=shipment_in.sender_name,
        recipient_name=shipment_in.recipient_name,
        recipient_phone=shipment_in.recipient_phone,
        weight_kg=shipment_in.weight_kg,
        origin=shipment_in.origin,
        destination=shipment_in.destination,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        destination_lat=dest_lat,
        destination_lng=dest_lng,
        vehicle_id=shipment_in.vehicle_id,
        delivery_notes=shipment_in.delivery_notes,
        status=models.ShipmentStatus.CREATED,
        eta=route_calc["eta_formatted"],
        distance_km=route_calc["total_distance_km"],
        current_lat=origin_lat,
        current_lng=origin_lng,
        speed_kmh=0.0
    )
    db.add(db_shipment)
    db.flush()

    # Create initial event in audit history
    initial_event = models.ShipmentEvent(
        shipment_id=db_shipment.id,
        status=models.ShipmentStatus.CREATED,
        location_desc=shipment_in.origin,
        latitude=shipment_in.origin_lat,
        longitude=shipment_in.origin_lng,
        note="Shipment registered in FleetFlow logistics network."
    )
    db.add(initial_event)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

@router.get("/", response_model=List[schemas.ShipmentResponse])
def get_shipments(status_filter: Optional[models.ShipmentStatus] = None, db: Session = Depends(get_db)):
    query = db.query(models.Shipment)
    if status_filter:
        query = query.filter(models.Shipment.status == status_filter)
    return query.order_by(models.Shipment.id.desc()).all()

@router.get("/track/{tracking_number}", response_model=schemas.ShipmentDetailResponse)
def track_shipment_public(tracking_number: str, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.tracking_number == tracking_number).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment tracking number not found")
    return shipment

@router.get("/{shipment_id}", response_model=schemas.ShipmentDetailResponse)
def get_shipment_detail(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.patch("/{shipment_id}/status", response_model=schemas.ShipmentResponse)
def update_shipment_status(shipment_id: int, update_data: schemas.ShipmentStatusUpdate, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment.status = update_data.status
    if update_data.latitude is not None:
        shipment.current_lat = update_data.latitude
    if update_data.longitude is not None:
        shipment.current_lng = update_data.longitude

    if update_data.status == models.ShipmentStatus.IN_TRANSIT:
        if not shipment.vehicle_id:
            assigned_vids = {
                (t.vehicle_id or "").strip().upper() for t in db.query(models.Trip).filter(models.Trip.status == models.TripStatus.IN_TRANSIT).all() if t.vehicle_id
            } | {
                (s.vehicle_id or "").strip().upper() for s in db.query(models.Shipment).filter(models.Shipment.status == models.ShipmentStatus.IN_TRANSIT).all() if s.vehicle_id
            }
            weight_tons = (shipment.weight_kg or 100.0) / 1000.0
            avail_v = db.query(models.Vehicle).filter(
                models.Vehicle.status == models.VehicleStatus.AVAILABLE,
                models.Vehicle.capacity >= weight_tons,
                ~models.Vehicle.vehicle_id.in_(assigned_vids)
            ).first()
            if not avail_v:
                avail_v = db.query(models.Vehicle).filter(
                    models.Vehicle.status == models.VehicleStatus.AVAILABLE,
                    ~models.Vehicle.vehicle_id.in_(assigned_vids)
                ).first()
            if avail_v:
                shipment.vehicle_id = avail_v.vehicle_id
                avail_v.status = models.VehicleStatus.IN_TRANSIT
                db.add(avail_v)
        elif shipment.vehicle_id:
            db.query(models.Vehicle).filter(
                func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
            ).update({"status": models.VehicleStatus.IN_TRANSIT}, synchronize_session=False)
    elif update_data.status == models.ShipmentStatus.DELIVERED:
        shipment.delivered_at = datetime.utcnow()
        shipment.eta = "Delivered"
        if shipment.vehicle_id:
            other_active_s = db.query(models.Shipment).filter(
                func.lower(models.Shipment.vehicle_id) == func.lower(shipment.vehicle_id.strip()),
                models.Shipment.id != shipment.id,
                models.Shipment.status == models.ShipmentStatus.IN_TRANSIT
            ).first()
            other_active_t = db.query(models.Trip).filter(
                func.lower(models.Trip.vehicle_id) == func.lower(shipment.vehicle_id.strip()),
                models.Trip.status == models.TripStatus.IN_TRANSIT
            ).first()
            if not other_active_s and not other_active_t:
                db.query(models.Vehicle).filter(
                    func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
                ).update({"status": models.VehicleStatus.AVAILABLE}, synchronize_session=False)

    event = models.ShipmentEvent(
        shipment_id=shipment.id,
        status=update_data.status,
        location_desc=update_data.location_desc or f"Coordinate: ({shipment.current_lat:.4f}, {shipment.current_lng:.4f})",
        latitude=shipment.current_lat,
        longitude=shipment.current_lng,
        note=update_data.note or f"Status changed to {update_data.status.value}"
    )
    db.add(event)
    db.commit()
    db.refresh(shipment)
    return shipment

@router.websocket("/ws/track/{tracking_number}")
async def tracking_endpoint(websocket: WebSocket, tracking_number: str, db: Session = Depends(get_db)):
    await manager.connect(tracking_number, websocket)
    
    # Retrieve shipment and assigned vehicle data from database
    shipment = db.query(models.Shipment).filter(models.Shipment.tracking_number == tracking_number).first()
    
    # Regional defaults for India & Sri Lanka
    default_origin_lat, default_origin_lng = 13.0827, 80.2707
    default_dest_lat, default_dest_lng = 6.9271, 79.8612

    origin_lat = shipment.origin_lat if (shipment and shipment.origin_lat) else default_origin_lat
    origin_lng = shipment.origin_lng if (shipment and shipment.origin_lng) else default_origin_lng
    dest_lat = shipment.destination_lat if (shipment and shipment.destination_lat) else default_dest_lat
    dest_lng = shipment.destination_lng if (shipment and shipment.destination_lng) else default_dest_lng

    # Vehicle profile and route parameters
    vehicle = shipment.vehicle if shipment else None
    vehicle_type = vehicle.vehicle_type if vehicle else "Heavy Truck"
    trip = shipment.trip if shipment else None
    route_type = trip.route_type.value if (trip and trip.route_type) else "Fastest Route"
    weight_kg = shipment.weight_kg if shipment else 2500.0

    # Determine realistic cruise speed based on vehicle specifications and load
    base_cruise_speed = RouteOptimizer.get_vehicle_cruise_speed(
        vehicle_type=vehicle_type,
        route_type=route_type,
        weight_kg=weight_kg
    )

    # If the shipment has already reached destination or is delivered, start fresh from origin
    dist_to_dest = RouteOptimizer.haversine(
        shipment.current_lat or origin_lat,
        shipment.current_lng or origin_lng,
        dest_lat,
        dest_lng
    ) if shipment else 0.0

    if dist_to_dest < 2.0 or (shipment and shipment.status == models.ShipmentStatus.DELIVERED):
        start_lat, start_lng = origin_lat, origin_lng
        if shipment:
            shipment.status = models.ShipmentStatus.IN_TRANSIT
            shipment.current_lat = origin_lat
            shipment.current_lng = origin_lng
            shipment.delivered_at = None
            if not shipment.vehicle_id:
                assigned_vids = {
                    (t.vehicle_id or "").strip().upper() for t in db.query(models.Trip).filter(models.Trip.status == models.TripStatus.IN_TRANSIT).all() if t.vehicle_id
                } | {
                    (s.vehicle_id or "").strip().upper() for s in db.query(models.Shipment).filter(models.Shipment.status == models.ShipmentStatus.IN_TRANSIT).all() if s.vehicle_id
                }
                avail_v = db.query(models.Vehicle).filter(
                    models.Vehicle.status == models.VehicleStatus.AVAILABLE,
                    ~models.Vehicle.vehicle_id.in_(assigned_vids)
                ).first()
                if not avail_v:
                    avail_v = db.query(models.Vehicle).filter(models.Vehicle.status == models.VehicleStatus.AVAILABLE).first()
                if not avail_v:
                    avail_v = db.query(models.Vehicle).first()
                if avail_v:
                    shipment.vehicle_id = avail_v.vehicle_id
                    avail_v.status = models.VehicleStatus.IN_TRANSIT
                    avail_v.current_lat = start_lat
                    avail_v.current_lng = start_lng
                    db.add(avail_v)
            elif shipment.vehicle_id:
                db.query(models.Vehicle).filter(
                    func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
                ).update({
                    "status": models.VehicleStatus.IN_TRANSIT,
                    "current_lat": start_lat,
                    "current_lng": start_lng
                }, synchronize_session=False)

            # Record initial live GPS breadcrumb
            init_breadcrumb = models.GPSBreadcrumb(
                trip_id=shipment.trip_id if shipment else None,
                vehicle_id=shipment.vehicle_id if shipment else None,
                latitude=start_lat,
                longitude=start_lng,
                speed_kmh=0.0,
                heading_deg=0.0,
                recorded_at=datetime.utcnow()
            )
            db.add(init_breadcrumb)

            # Log live tracking start event
            db.add(models.ShipmentEvent(
                shipment_id=shipment.id,
                status=models.ShipmentStatus.IN_TRANSIT,
                location_desc=f"Transit re-initialized from {shipment.origin}",
                latitude=start_lat,
                longitude=start_lng,
                note="Real-time satellite GPS tracking telemetry initiated."
            ))
            db.commit()
    else:
        start_lat = shipment.current_lat if (shipment and shipment.current_lat) else origin_lat
        start_lng = shipment.current_lng if (shipment and shipment.current_lng) else origin_lng
        if shipment:
            shipment.status = models.ShipmentStatus.IN_TRANSIT
            if not shipment.vehicle_id:
                assigned_vids = {
                    (t.vehicle_id or "").strip().upper() for t in db.query(models.Trip).filter(models.Trip.status == models.TripStatus.IN_TRANSIT).all() if t.vehicle_id
                } | {
                    (s.vehicle_id or "").strip().upper() for s in db.query(models.Shipment).filter(models.Shipment.status == models.ShipmentStatus.IN_TRANSIT).all() if s.vehicle_id
                }
                avail_v = db.query(models.Vehicle).filter(
                    models.Vehicle.status == models.VehicleStatus.AVAILABLE,
                    ~models.Vehicle.vehicle_id.in_(assigned_vids)
                ).first()
                if not avail_v:
                    avail_v = db.query(models.Vehicle).filter(models.Vehicle.status == models.VehicleStatus.AVAILABLE).first()
                if not avail_v:
                    avail_v = db.query(models.Vehicle).first()
                if avail_v:
                    shipment.vehicle_id = avail_v.vehicle_id
                    avail_v.status = models.VehicleStatus.IN_TRANSIT
                    avail_v.current_lat = start_lat
                    avail_v.current_lng = start_lng
                    db.add(avail_v)
            elif shipment.vehicle_id:
                db.query(models.Vehicle).filter(
                    func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
                ).update({
                    "status": models.VehicleStatus.IN_TRANSIT,
                    "current_lat": start_lat,
                    "current_lng": start_lng
                }, synchronize_session=False)

            # Record initial live GPS breadcrumb
            init_breadcrumb = models.GPSBreadcrumb(
                trip_id=shipment.trip_id if shipment else None,
                vehicle_id=shipment.vehicle_id if shipment else None,
                latitude=start_lat,
                longitude=start_lng,
                speed_kmh=shipment.speed_kmh or 0.0,
                heading_deg=0.0,
                recorded_at=datetime.utcnow()
            )
            db.add(init_breadcrumb)

            db.add(models.ShipmentEvent(
                shipment_id=shipment.id,
                status=models.ShipmentStatus.IN_TRANSIT,
                location_desc=f"In-transit tracking active at ({start_lat:.4f}, {start_lng:.4f})",
                latitude=start_lat,
                longitude=start_lng,
                note="Real-time satellite GPS tracking telemetry stream active."
            ))
            db.commit()

    # Precompute realistic route path with density scaled to route distance
    route_calc = RouteOptimizer.optimize_route(
        origin=(start_lat, start_lng),
        destination=(dest_lat, dest_lng),
        optimization_type=route_type
    )
    path_points = route_calc["full_path"]
    if len(path_points) < 2:
        path_points = RouteOptimizer.generate_interpolated_path(origin_lat, origin_lng, dest_lat, dest_lng, num_points=35)

    total_steps = len(path_points)
    total_route_km = RouteOptimizer.calculate_path_distance(path_points)

    try:
        for step_idx in range(total_steps):
            curr_point = path_points[step_idx]
            lat, lng = curr_point[0], curr_point[1]
            is_delivered = (step_idx >= total_steps - 1)

            # True remaining distance along the actual route polyline
            remaining_km = RouteOptimizer.calculate_path_distance(path_points[step_idx:]) if not is_delivered else 0.0

            if is_delivered:
                speed = 0.0
                heading = 0.0
                lat, lng = dest_lat, dest_lng
            else:
                # Dynamic speed modulated relative to remaining path and vehicle type
                speed = RouteOptimizer.calculate_dynamic_speed(
                    base_cruise_speed=base_cruise_speed,
                    remaining_km=remaining_km,
                    total_km=total_route_km,
                    step_idx=step_idx,
                    total_steps=total_steps
                )
                next_point = path_points[min(step_idx + 1, total_steps - 1)]
                dlat = next_point[0] - lat
                dlng = next_point[1] - lng
                heading = round((math.degrees(math.atan2(dlng, dlat)) + 360) % 360, 1)

            # Dynamic ETA recalculation based on speed and true remaining path
            eta_info = RouteOptimizer.recalculate_live_eta(
                current_lat=lat,
                current_lng=lng,
                dest_lat=dest_lat,
                dest_lng=dest_lng,
                current_speed_kmh=speed,
                remaining_path_km=remaining_km
            )

            current_status = "Delivered" if is_delivered else "In Transit"

            payload = {
                "tracking_number": tracking_number,
                "lat": lat,
                "lng": lng,
                "speed_kmh": speed,
                "heading": heading,
                "eta_display": "Delivered" if is_delivered else eta_info["eta_display"],
                "remaining_km": remaining_km,
                "status": current_status,
                "vehicle_type": vehicle_type,
                "vehicle_id": shipment.vehicle_id if shipment else None,
                "is_delayed": eta_info["is_delayed"],
                "delay_reason": eta_info["delay_reason"],
                "step_idx": step_idx + 1,
                "total_steps": total_steps,
                "timestamp": datetime.utcnow().isoformat()
            }

            await websocket.send_text(json.dumps(payload))

            # Record GPS breadcrumb log in database on every step
            breadcrumb = models.GPSBreadcrumb(
                trip_id=shipment.trip_id if shipment else None,
                vehicle_id=shipment.vehicle_id if shipment else None,
                latitude=lat,
                longitude=lng,
                speed_kmh=speed,
                heading_deg=heading,
                recorded_at=datetime.utcnow()
            )
            db.add(breadcrumb)

            # Update DB coordinates periodically and upon delivery
            if shipment and (step_idx % 2 == 0 or is_delivered):
                shipment.current_lat = lat
                shipment.current_lng = lng
                shipment.speed_kmh = speed

                # Keep assigned vehicle coordinates synchronized in the Vehicle table
                if shipment.vehicle_id:
                    db.query(models.Vehicle).filter(
                        func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
                    ).update({
                        "current_lat": lat,
                        "current_lng": lng,
                        "status": models.VehicleStatus.IN_TRANSIT
                    }, synchronize_session=False)

                # Milestone checkpoint audit logs for ShipmentEvent
                if total_steps >= 4:
                    quarter = total_steps // 4
                    if step_idx == quarter:
                        db.add(models.ShipmentEvent(
                            shipment_id=shipment.id,
                            status=models.ShipmentStatus.IN_TRANSIT,
                            location_desc=f"Transit checkpoint: 25% completed (~{remaining_km:.1f} km remaining)",
                            latitude=lat,
                            longitude=lng,
                            note=f"Live satellite GPS verified at velocity {speed:.1f} km/h"
                        ))
                    elif step_idx == quarter * 2:
                        db.add(models.ShipmentEvent(
                            shipment_id=shipment.id,
                            status=models.ShipmentStatus.IN_TRANSIT,
                            location_desc=f"Midway corridor checkpoint: 50% completed (~{remaining_km:.1f} km remaining)",
                            latitude=lat,
                            longitude=lng,
                            note=f"Live satellite GPS verified at velocity {speed:.1f} km/h"
                        ))
                    elif step_idx == quarter * 3:
                        db.add(models.ShipmentEvent(
                            shipment_id=shipment.id,
                            status=models.ShipmentStatus.IN_TRANSIT,
                            location_desc=f"Approaching destination hub: 75% completed (~{remaining_km:.1f} km remaining)",
                            latitude=lat,
                            longitude=lng,
                            note=f"Live satellite GPS verified at velocity {speed:.1f} km/h"
                        ))

                if is_delivered and shipment.status != models.ShipmentStatus.DELIVERED:
                    shipment.status = models.ShipmentStatus.DELIVERED
                    shipment.delivered_at = datetime.utcnow()
                    shipment.eta = "Delivered"

                    # Log delivery event
                    db.add(models.ShipmentEvent(
                        shipment_id=shipment.id,
                        status=models.ShipmentStatus.DELIVERED,
                        location_desc=f"Destination terminal reached: {shipment.destination}",
                        latitude=lat,
                        longitude=lng,
                        note="Consignment successfully delivered by fleet asset."
                    ))

                    if shipment.vehicle_id:
                        other_active_s = db.query(models.Shipment).filter(
                            func.lower(models.Shipment.vehicle_id) == func.lower(shipment.vehicle_id.strip()),
                            models.Shipment.id != shipment.id,
                            models.Shipment.status == models.ShipmentStatus.IN_TRANSIT
                        ).first()
                        other_active_t = db.query(models.Trip).filter(
                            func.lower(models.Trip.vehicle_id) == func.lower(shipment.vehicle_id.strip()),
                            models.Trip.status == models.TripStatus.IN_TRANSIT
                        ).first()
                        target_status = models.VehicleStatus.IN_TRANSIT if (other_active_s or other_active_t) else models.VehicleStatus.AVAILABLE
                        db.query(models.Vehicle).filter(
                            func.lower(models.Vehicle.vehicle_id) == func.lower(shipment.vehicle_id.strip())
                        ).update({
                            "status": target_status,
                            "current_lat": lat,
                            "current_lng": lng
                        }, synchronize_session=False)

                db.commit()

            if is_delivered:
                # Arrival complete! Stay parked at destination.
                break

            await asyncio.sleep(1.0)

        # Allow client to process final delivered state, then finish cleanly
        await asyncio.sleep(1.0)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        manager.disconnect(tracking_number, websocket)

@router.get("/track/{tracking_number}/gps-logs")
def get_shipment_gps_logs(tracking_number: str, limit: int = 150, db: Session = Depends(get_db)):
    """
    Retrieve live GPS breadcrumb logs recorded for a shipment / fleet.
    """
    shipment = db.query(models.Shipment).filter(
        func.lower(models.Shipment.tracking_number) == func.lower(tracking_number.strip())
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    query = db.query(models.GPSBreadcrumb)
    if shipment.trip_id and shipment.vehicle_id:
        query = query.filter(
            (models.GPSBreadcrumb.trip_id == shipment.trip_id) | 
            (func.lower(models.GPSBreadcrumb.vehicle_id) == func.lower(shipment.vehicle_id.strip()))
        )
    elif shipment.trip_id:
        query = query.filter(models.GPSBreadcrumb.trip_id == shipment.trip_id)
    elif shipment.vehicle_id:
        query = query.filter(func.lower(models.GPSBreadcrumb.vehicle_id) == func.lower(shipment.vehicle_id.strip()))
    
    logs = query.order_by(models.GPSBreadcrumb.recorded_at.desc()).limit(limit).all()
    return [{
        "id": b.id,
        "trip_id": b.trip_id,
        "vehicle_id": b.vehicle_id,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "speed_kmh": b.speed_kmh,
        "heading_deg": b.heading_deg,
        "recorded_at": b.recorded_at.isoformat() if b.recorded_at else None
    } for b in logs]

@router.delete("/track/{tracking_number}/gps-logs")
def clear_shipment_gps_logs(tracking_number: str, db: Session = Depends(get_db)):
    """
    Clear recorded GPS breadcrumb logs for a shipment / fleet.
    """
    shipment = db.query(models.Shipment).filter(
        func.lower(models.Shipment.tracking_number) == func.lower(tracking_number.strip())
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    if shipment.trip_id:
        db.query(models.GPSBreadcrumb).filter(models.GPSBreadcrumb.trip_id == shipment.trip_id).delete(synchronize_session=False)
    if shipment.vehicle_id:
        db.query(models.GPSBreadcrumb).filter(
            func.lower(models.GPSBreadcrumb.vehicle_id) == func.lower(shipment.vehicle_id.strip())
        ).delete(synchronize_session=False)
    db.commit()
    return {"message": "GPS logs cleared successfully"}