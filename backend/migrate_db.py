import os
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
import app.models
from app.models import (
    Vehicle, Driver, MaintenanceLog, MaintenanceAlert, FuelLog,
    DriverStatus, MaintenanceStatus, MaintenancePriority, AlertSeverity
)

def migrate_schema():
    print("Running comprehensive database schema migration for Milestones 1, 2 & 3...")
    with engine.connect() as conn:
        Base.metadata.create_all(bind=engine)

        shipment_columns = [
            ("sender_name", "VARCHAR DEFAULT 'FleetFlow Dispatch'"),
            ("recipient_name", "VARCHAR DEFAULT 'Customer'"),
            ("recipient_phone", "VARCHAR"),
            ("weight_kg", "FLOAT DEFAULT 100.0"),
            ("origin_lat", "FLOAT DEFAULT 40.7128"),
            ("origin_lng", "FLOAT DEFAULT -74.0060"),
            ("destination_lat", "FLOAT DEFAULT 40.7484"),
            ("destination_lng", "FLOAT DEFAULT -73.9857"),
            ("speed_kmh", "FLOAT DEFAULT 0.0"),
            ("delivery_notes", "TEXT"),
            ("trip_id", "INTEGER"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("delivered_at", "TIMESTAMP")
        ]

        for col_name, col_type in shipment_columns:
            try:
                conn.execute(text(f"ALTER TABLE shipments ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
            except Exception as e:
                print(f"shipments.{col_name}: {e}")

        # Add odometer_km to vehicles if not present
        try:
            conn.execute(text("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS odometer_km FLOAT DEFAULT 15000.0;"))
            conn.commit()
        except Exception as e:
            print(f"vehicles.odometer_km: {e}")

    # Seed initial data for Milestone 3 if empty
    db = SessionLocal()
    try:
        # 1. Seed initial Drivers
        existing_drivers = db.query(Driver).count()
        if existing_drivers == 0:
            print("Seeding initial commercial drivers roster...")
            drivers_data = [
                ("DRV-101", "Marcus Vance", "CDL-A-99102", "CDL-A (Commercial Master)", "FL-001", DriverStatus.ON_DUTY, 4.9, 142, 98.5),
                ("DRV-102", "Elena Rostova", "CDL-A-88321", "CDL-A (Hazmat Endorsed)", "FL-002", DriverStatus.AVAILABLE, 4.8, 98, 97.0),
                ("DRV-103", "James K. Cooper", "CDL-B-77412", "CDL-B (Heavy Rigid)", "FL-003", DriverStatus.ON_DUTY, 5.0, 215, 99.2),
                ("DRV-104", "Samantha Lee", "CDL-A-66509", "CDL-A (Tanker & Air Brakes)", "FL-004", DriverStatus.AVAILABLE, 4.7, 64, 96.0),
                ("DRV-105", "Devon Miller", "CDL-B-55490", "CDL-B (Urban Dispatch)", None, DriverStatus.OFF_DUTY, 4.6, 89, 95.0),
            ]
            for code, name, lic, ltype, vid, stat, rat, trips, safety in drivers_data:
                d = Driver(
                    driver_code=code,
                    name=name,
                    license_number=lic,
                    license_type=ltype,
                    current_vehicle_id=vid,
                    status=stat,
                    rating=rat,
                    total_trips=trips,
                    safety_score=safety
                )
                db.add(d)
            db.commit()
            print("Seeded 5 commercial drivers.")

        # 2. Seed initial Maintenance logs
        existing_maint = db.query(MaintenanceLog).count()
        if existing_maint == 0:
            print("Seeding maintenance service jobs...")
            maint_data = [
                ("MNT-401", "FL-002", "Oil Change", "FleetCare North Hub", MaintenanceStatus.IN_PROGRESS, MaintenancePriority.MEDIUM, datetime.utcnow() - timedelta(days=2), 240.0, 240.0, 18500.0, "Synthetic oil replacement & filter swap."),
                ("MNT-402", "FL-004", "Brake Service", "Brembo Commercial Services", MaintenanceStatus.SCHEDULED, MaintenancePriority.HIGH, datetime.utcnow() - timedelta(days=1), 680.0, None, 34200.0, "Rotor inspection & pad replacement."),
                ("MNT-403", "FL-001", "General Inspection", "State DOT Inspection Depot", MaintenanceStatus.COMPLETED, MaintenancePriority.LOW, datetime.utcnow() - timedelta(days=8), 150.0, 150.0, 42100.0, "Passed DOT compliance testing."),
                ("MNT-404", "FL-003", "Tire Replacement", "Michelin Fleet Center", MaintenanceStatus.SCHEDULED, MaintenancePriority.MEDIUM, datetime.utcnow() + timedelta(days=3), 1200.0, None, 29000.0, "4 drive axle tires replacement.")
            ]
            for jid, vid, cat, sc, stat, prio, sdate, ecost, acost, odo, notes in maint_data:
                ml = MaintenanceLog(
                    job_id=jid,
                    vehicle_id=vid,
                    category=cat,
                    service_center=sc,
                    status=stat,
                    priority=prio,
                    scheduled_date=sdate,
                    estimated_cost=ecost,
                    actual_cost=acost,
                    odometer_reading=odo,
                    notes=notes
                )
                db.add(ml)
            db.commit()
            print("Seeded 4 maintenance jobs.")

        # 3. Seed initial Fuel logs
        existing_fuel = db.query(FuelLog).count()
        if existing_fuel == 0:
            print("Seeding fuel logs with sample anomaly...")
            fuel_data = [
                ("FL-001", 120.0, 1.65, 42000.0, "Diesel", "Depot Pump 1", 3.8, False, None),
                ("FL-002", 45.0, 1.55, 18450.0, "Electric/Hybrid", "Metro Fast Charger", 5.2, False, None),
                ("FL-003", 210.0, 1.70, 28800.0, "Diesel", "Interstate Truck Stop", 3.4, False, None),
                # Anomaly entry: very low efficiency / rapid burn
                ("FL-004", 280.0, 1.68, 34150.0, "Diesel", "Highway Stop 9", 1.2, True, "Abnormally high consumption rate detected (1.2 km/L). High variance flagged.")
            ]
            for vid, liters, price, odo, ftype, station, eff, is_a, anom_note in fuel_data:
                fl = FuelLog(
                    vehicle_id=vid,
                    liters_filled=liters,
                    cost_per_liter=price,
                    total_cost=round(liters * price, 2),
                    odometer_reading=odo,
                    fuel_type=ftype,
                    fuel_station=station,
                    fuel_efficiency_km_per_l=eff,
                    is_anomaly=is_a,
                    anomaly_reason=anom_note
                )
                db.add(fl)
            db.commit()
            print("Seeded 4 fuel logs (including 1 flagged anomaly).")

        # 4. Generate maintenance alerts
        from app.services.maintenance_service import MaintenanceService
        alerts = MaintenanceService.scan_all_maintenance_alerts(db)
        print(f"Generated {alerts} initial maintenance alerts.")

    finally:
        db.close()

    print("Migration and seeding finished successfully!")

if __name__ == "__main__":
    migrate_schema()
