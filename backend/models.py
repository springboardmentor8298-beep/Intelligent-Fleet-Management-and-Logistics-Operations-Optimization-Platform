from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    vehicle_number = Column(String, unique=True, index=True, nullable=False)

    vehicle_type = Column(String, nullable=False)

    driver_name = Column(String, nullable=False)

    status = Column(String, default="Active")

    location = Column(String, default="Not Assigned")

    fuel_type = Column(String, default="Diesel")

    mileage = Column(String, default="0 km")

    registration_year = Column(Integer, default=2026)

    # Milestone 2 - Real-time GPS location
    latitude = Column(Float, nullable=True)

    longitude = Column(Float, nullable=True)

    last_location_update = Column(DateTime(timezone=True), nullable=True)


# Milestone 2 - Shipment Model
class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)

    tracking_number = Column(String, unique=True, index=True, nullable=False)

    source = Column(String, nullable=False)

    destination = Column(String, nullable=False)

    vehicle_number = Column(String, nullable=False)

    driver_name = Column(String, nullable=False)

    status = Column(String, default="Pending")

    current_location = Column(String, default="Not Started")

    eta = Column(String, default="Not Calculated")