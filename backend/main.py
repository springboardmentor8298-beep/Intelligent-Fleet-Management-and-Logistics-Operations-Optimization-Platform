from datetime import datetime, timezone

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import Vehicle, Shipment


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Fleet Management System",
    description="Fleet Management System with Vehicle Management, GPS Tracking, Shipment Tracking and Route Optimization",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# PYDANTIC MODELS
# ============================================================

class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: str
    driver_name: str
    status: str = "Active"
    location: str = "Not Assigned"
    fuel_type: str = "Diesel"
    mileage: str = "0 km"
    registration_year: int = 2026


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


class ShipmentCreate(BaseModel):
    tracking_number: str
    source: str
    destination: str
    vehicle_number: str
    driver_name: str
    status: str = "Pending"
    current_location: str = "Not Started"
    eta: str = "Not Calculated"


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Fleet Management System Backend is running"
    }


# ============================================================
# TEST DATABASE
# ============================================================

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):

    try:
        db.execute("SELECT 1")

        return {
            "message": "Database connection successful"
        }

    except Exception as e:

        return {
            "message": "Database connection failed",
            "error": str(e)
        }


# ============================================================
# VEHICLE APIs
# ============================================================

# GET ALL VEHICLES
@app.get("/vehicles")
def get_vehicles(db: Session = Depends(get_db)):

    vehicles = db.query(Vehicle).all()

    return vehicles


# GET ONE VEHICLE
@app.get("/vehicles/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


# ADD VEHICLE
@app.post("/vehicles")
def add_vehicle(
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_db)
):

    existing_vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_number
            == vehicle_data.vehicle_number
        )
        .first()
    )

    if existing_vehicle:

        raise HTTPException(
            status_code=400,
            detail="Vehicle number already exists"
        )

    vehicle = Vehicle(
        vehicle_number=vehicle_data.vehicle_number,
        vehicle_type=vehicle_data.vehicle_type,
        driver_name=vehicle_data.driver_name,
        status=vehicle_data.status,
        location=vehicle_data.location,
        fuel_type=vehicle_data.fuel_type,
        mileage=vehicle_data.mileage,
        registration_year=vehicle_data.registration_year
    )

    db.add(vehicle)

    db.commit()

    db.refresh(vehicle)

    return vehicle


# UPDATE VEHICLE
@app.put("/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle.vehicle_number = vehicle_data.vehicle_number
    vehicle.vehicle_type = vehicle_data.vehicle_type
    vehicle.driver_name = vehicle_data.driver_name
    vehicle.status = vehicle_data.status
    vehicle.location = vehicle_data.location
    vehicle.fuel_type = vehicle_data.fuel_type
    vehicle.mileage = vehicle_data.mileage
    vehicle.registration_year = vehicle_data.registration_year

    db.commit()

    db.refresh(vehicle)

    return vehicle


# DELETE VEHICLE
@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)

    db.commit()

    return {
        "message": "Vehicle deleted successfully"
    }


# ============================================================
# GPS LOCATION API
# ============================================================

@app.put("/vehicles/{vehicle_id}/location")
def update_vehicle_location(
    vehicle_id: int,
    location: LocationUpdate,
    db: Session = Depends(get_db)
):

    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:

        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle.latitude = location.latitude
    vehicle.longitude = location.longitude

    vehicle.last_location_update = datetime.now(
        timezone.utc
    )

    db.commit()

    db.refresh(vehicle)

    return {
        "message": "Vehicle location updated successfully",
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "latitude": vehicle.latitude,
        "longitude": vehicle.longitude,
        "last_location_update": vehicle.last_location_update
    }


# ============================================================
# SHIPMENT APIs
# ============================================================

# GET ALL SHIPMENTS
@app.get("/shipments")
def get_shipments(
    db: Session = Depends(get_db)
):

    shipments = db.query(Shipment).all()

    return shipments


# GET ONE SHIPMENT
@app.get("/shipments/{shipment_id}")
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    return shipment


# ADD SHIPMENT
@app.post("/shipments")
def add_shipment(
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db)
):

    existing_shipment = (
        db.query(Shipment)
        .filter(
            Shipment.tracking_number
            == shipment_data.tracking_number
        )
        .first()
    )

    if existing_shipment:

        raise HTTPException(
            status_code=400,
            detail="Tracking number already exists"
        )

    shipment = Shipment(
        tracking_number=shipment_data.tracking_number,
        source=shipment_data.source,
        destination=shipment_data.destination,
        vehicle_number=shipment_data.vehicle_number,
        driver_name=shipment_data.driver_name,
        status=shipment_data.status,
        current_location=shipment_data.current_location,
        eta=shipment_data.eta
    )

    db.add(shipment)

    db.commit()

    db.refresh(shipment)

    return shipment


# UPDATE SHIPMENT
@app.put("/shipments/{shipment_id}")
def update_shipment(
    shipment_id: int,
    shipment_data: ShipmentCreate,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    shipment.tracking_number = shipment_data.tracking_number
    shipment.source = shipment_data.source
    shipment.destination = shipment_data.destination
    shipment.vehicle_number = shipment_data.vehicle_number
    shipment.driver_name = shipment_data.driver_name
    shipment.status = shipment_data.status
    shipment.current_location = shipment_data.current_location
    shipment.eta = shipment_data.eta

    db.commit()

    db.refresh(shipment)

    return shipment


# DELETE SHIPMENT
@app.delete("/shipments/{shipment_id}")
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db)
):

    shipment = (
        db.query(Shipment)
        .filter(Shipment.id == shipment_id)
        .first()
    )

    if not shipment:

        raise HTTPException(
            status_code=404,
            detail="Shipment not found"
        )

    db.delete(shipment)

    db.commit()

    return {
        "message": "Shipment deleted successfully"
    }


# ============================================================
# ROUTE OPTIMIZATION
# ============================================================

@app.get("/route-optimize")
def optimize_route(
    source: str,
    destination: str
):

    source = source.strip()
    destination = destination.strip()

    # --------------------------------------------------------
    # ROUTE DATA
    # --------------------------------------------------------

    routes = {

        # Srikakulam -> Visakhapatnam
        ("Srikakulam", "Visakhapatnam"): {
            "route": [
                "Srikakulam",
                "Narasannapeta",
                "Tekkali",
                "Palasa",
                "Vizianagaram",
                "Visakhapatnam"
            ],
            "distance": "120 km",
            "estimated_time": "3 hours"
        },

        # Visakhapatnam -> Srikakulam
        ("Visakhapatnam", "Srikakulam"): {
            "route": [
                "Visakhapatnam",
                "Vizianagaram",
                "Palasa",
                "Tekkali",
                "Narasannapeta",
                "Srikakulam"
            ],
            "distance": "120 km",
            "estimated_time": "3 hours"
        },

        # Srikakulam -> Rajahmundry
        ("Srikakulam", "Rajahmundry"): {
            "route": [
                "Srikakulam",
                "Vizianagaram",
                "Visakhapatnam",
                "Anakapalle",
                "Tuni",
                "Annavaram",
                "Rajahmundry"
            ],
            "distance": "250 km",
            "estimated_time": "5 hours 30 minutes"
        },

        # Rajahmundry -> Srikakulam
        ("Rajahmundry", "Srikakulam"): {
            "route": [
                "Rajahmundry",
                "Annavaram",
                "Tuni",
                "Anakapalle",
                "Visakhapatnam",
                "Vizianagaram",
                "Srikakulam"
            ],
            "distance": "250 km",
            "estimated_time": "5 hours 30 minutes"
        },

        # Visakhapatnam -> Rajahmundry
        ("Visakhapatnam", "Rajahmundry"): {
            "route": [
                "Visakhapatnam",
                "Anakapalle",
                "Tuni",
                "Annavaram",
                "Rajahmundry"
            ],
            "distance": "200 km",
            "estimated_time": "4 hours"
        },

        # Rajahmundry -> Visakhapatnam
        ("Rajahmundry", "Visakhapatnam"): {
            "route": [
                "Rajahmundry",
                "Annavaram",
                "Tuni",
                "Anakapalle",
                "Visakhapatnam"
            ],
            "distance": "200 km",
            "estimated_time": "4 hours"
        },

        # Kakinada -> Visakhapatnam
        ("Kakinada", "Visakhapatnam"): {
            "route": [
                "Kakinada",
                "Pithapuram",
                "Tuni",
                "Anakapalle",
                "Visakhapatnam"
            ],
            "distance": "160 km",
            "estimated_time": "3 hours 30 minutes"
        },

        # Visakhapatnam -> Kakinada
        ("Visakhapatnam", "Kakinada"): {
            "route": [
                "Visakhapatnam",
                "Anakapalle",
                "Tuni",
                "Pithapuram",
                "Kakinada"
            ],
            "distance": "160 km",
            "estimated_time": "3 hours 30 minutes"
        },

        # Kakinada -> Rajahmundry
        ("Kakinada", "Rajahmundry"): {
            "route": [
                "Kakinada",
                "Pithapuram",
                "Samalkota",
                "Rajahmundry"
            ],
            "distance": "70 km",
            "estimated_time": "1 hour 30 minutes"
        },

        # Rajahmundry -> Kakinada
        ("Rajahmundry", "Kakinada"): {
            "route": [
                "Rajahmundry",
                "Samalkota",
                "Pithapuram",
                "Kakinada"
            ],
            "distance": "70 km",
            "estimated_time": "1 hour 30 minutes"
        }
    }


    # --------------------------------------------------------
    # FIND ROUTE
    # --------------------------------------------------------

    key = (source, destination)

    if key in routes:

        route_data = routes[key]

        return {
            "source": source,
            "destination": destination,
            "optimized_route": route_data["route"],
            "distance": route_data["distance"],
            "estimated_time": route_data["estimated_time"],
            "message": "Optimized route calculated successfully"
        }


    # --------------------------------------------------------
    # DEFAULT ROUTE
    # --------------------------------------------------------

    return {
        "source": source,
        "destination": destination,
        "optimized_route": [
            source,
            destination
        ],
        "distance": "Not available",
        "estimated_time": "Not available",
        "message": "Basic route generated"
    }
# ==========================================================
# TRAFFIC-AWARE ROUTE PLANNING
# ==========================================================

@app.get("/traffic-route")
def traffic_route(source: str, destination: str):

    # Sample route data
    routes = {
        ("Srikakulam", "Visakhapatnam"): [
            {
                "route": "NH16",
                "distance": 120,
                "normal_time": 2.5,
                "traffic": "High",
                "traffic_factor": 1.3
            },
            {
                "route": "Alternate Route",
                "distance": 135,
                "normal_time": 2.8,
                "traffic": "Low",
                "traffic_factor": 1.0
            },
            {
                "route": "Local Route",
                "distance": 145,
                "normal_time": 3.2,
                "traffic": "Medium",
                "traffic_factor": 1.15
            }
        ],

        ("Vizianagaram", "Visakhapatnam"): [
            {
                "route": "NH16",
                "distance": 60,
                "normal_time": 1.5,
                "traffic": "Medium",
                "traffic_factor": 1.15
            },
            {
                "route": "Alternate Route",
                "distance": 70,
                "normal_time": 1.8,
                "traffic": "Low",
                "traffic_factor": 1.0
            }
        ]
    }

    key = (source, destination)

    if key not in routes:
        return {
            "source": source,
            "destination": destination,
            "routes": [],
            "message": "Traffic route information is not available."
        }

    available_routes = routes[key]

    # Calculate traffic-adjusted time
    for route in available_routes:
        route["traffic_time"] = round(
            route["normal_time"] * route["traffic_factor"],
            2
        )

    # Select route with lowest traffic-adjusted time
    best_route = min(
        available_routes,
        key=lambda route: route["traffic_time"]
    )

    return {
        "source": source,
        "destination": destination,
        "routes": available_routes,
        "recommended_route": best_route
    }