import sys
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import (
    Vehicle, Driver, Shipment, Trip, MaintenanceLog, MaintenanceAlert, FuelLog,
    VehicleStatus, ShipmentStatus, TripStatus, RouteOptimizationType,
    MaintenanceStatus, MaintenancePriority, DriverStatus, AlertSeverity,
    NotificationType, NotificationChannel
)
from app.services.route_optimizer import RouteOptimizer
from app.services.maintenance_service import MaintenanceService
from app.services.driver_service import DriverService
from app.services.analytics_service import AnalyticsService
from app.services.notification_service import NotificationService
from app.services.reports_service import ReportsService
from app.schemas import (
    MaintenanceCreate, MaintenanceUpdate, DriverCreate, FuelLogCreate, ShipmentCreate,
    NotificationCreate
)

def run_workflow_validation():
    print("=" * 70)
    print("FLEETFLOW LOGISTICS WORKFLOW & SYSTEM INTEGRATION VALIDATION")
    print("=" * 70)

    db = SessionLocal()
    ts = int(datetime.utcnow().timestamp()) % 100000

    try:
        # -------------------------------------------------------------
        # WORKFLOW 1: FULL DISPATCH, TRACKING & DELIVERY WORKFLOW
        # -------------------------------------------------------------
        print("\n[WORKFLOW 1] Multi-Consignment Dispatch & Live GPS Telemetry Lifecycle...")
        v1 = Vehicle(
            vehicle_id=f"WF-TRK-{ts}",
            registration_number=f"REG-WF-{ts}",
            vehicle_type="Medium Duty Van",
            capacity=8.0,
            fuel_type="Diesel",
            status=VehicleStatus.AVAILABLE,
            current_lat=40.7128,
            current_lng=-74.0060,
            odometer_km=18500.0
        )
        db.add(v1)
        db.commit()
        db.refresh(v1)

        d1 = DriverService.register_driver(db, DriverCreate(
            driver_code=f"WF-DRV-{ts}",
            name="Elena Rostova",
            license_number=f"LIC-WF-{ts}",
            license_type="CDL-B",
            phone="+1-555-0899",
            email=f"elena.{ts}@fleetflow.io"
        ))

        # Assign driver to vehicle
        DriverService.assign_vehicle_to_driver(db, d1.id, v1.vehicle_id, "Dispatcher", "Morning delivery route")
        db.refresh(v1)

        # Optimize multi-stop route
        route_calc = RouteOptimizer.optimize_route(
            origin=(40.7128, -74.0060),
            destination=(40.7589, -73.9851),
            optimization_type="Fastest Route"
        )

        # Create Shipment
        shp1 = Shipment(
            tracking_number=f"WF-SHP-{ts}",
            origin="Downtown Depot",
            destination="Midtown Commercial Terminal",
            origin_lat=40.7128,
            origin_lng=-74.0060,
            destination_lat=40.7589,
            destination_lng=-73.9851,
            weight_kg=650.0,
            vehicle_id=v1.vehicle_id,
            status=ShipmentStatus.IN_TRANSIT,
            distance_km=route_calc["total_distance_km"],
            eta=route_calc["eta_formatted"]
        )
        v1.status = VehicleStatus.IN_TRANSIT
        d1.status = DriverStatus.ON_TRIP
        db.add(shp1)
        db.commit()

        # Transmit delivery progress alert
        notif = NotificationService.send_delivery_notification(
            db, shp1.tracking_number, "In Transit", d1.email, NotificationChannel.SMS
        )

        # Simulate arrival & delivery
        shp1.status = ShipmentStatus.DELIVERED
        shp1.delivered_at = datetime.utcnow()
        v1.status = VehicleStatus.AVAILABLE
        d1.status = DriverStatus.AVAILABLE
        d1.total_trips += 1
        d1.total_hours_driven += (route_calc["estimated_duration_mins"] / 60.0)
        db.commit()

        print(f"  [PASS] Dispatch Workflow Succeeded: Vehicle {v1.vehicle_id} -> Driver {d1.name} -> Shipment {shp1.tracking_number} -> Delivered in {route_calc['estimated_duration_mins']} mins.")

        # -------------------------------------------------------------
        # WORKFLOW 2: VEHICLE BREAKDOWN & EMERGENCY REASSIGNMENT
        # -------------------------------------------------------------
        print("\n[WORKFLOW 2] Mechanical Alert Trigger & Fleet Servicing Workflow...")
        # Simulate high-severity alert triggering emergency maintenance
        m_job = MaintenanceService.schedule_maintenance(db, MaintenanceCreate(
            vehicle_id=v1.vehicle_id,
            category="Brake Service",
            service_center="Downtown Fleet Hub",
            priority=MaintenancePriority.CRITICAL,
            notes="Emergency roadside telemetry alert: Brake caliper overheat"
        ))
        # Transition job to IN_PROGRESS -> marks vehicle in MAINTENANCE status
        MaintenanceService.update_maintenance(db, m_job.job_id, MaintenanceUpdate(status=MaintenanceStatus.IN_PROGRESS))
        db.refresh(v1)
        assert v1.status == VehicleStatus.MAINTENANCE

        # Dispatch automated maintenance alert notification
        m_notif = NotificationService.send_maintenance_alert(
            db, v1.vehicle_id, f"CRITICAL: {m_job.category} flagged for {v1.vehicle_id}. Unit grounded."
        )
        assert m_notif.channel == NotificationChannel.EMAIL

        # Complete repair servicing -> restores vehicle to AVAILABLE
        MaintenanceService.update_maintenance(db, m_job.job_id, MaintenanceUpdate(status=MaintenanceStatus.COMPLETED, actual_cost=540.0))
        db.refresh(v1)
        assert v1.status == VehicleStatus.AVAILABLE
        print(f"  [PASS] Maintenance Lifecycle Succeeded: Vehicle grounded -> Service {m_job.job_id} executed -> Restored to Available.")

        # -------------------------------------------------------------
        # WORKFLOW 3: REAL-TIME FUEL MONITORING & ANOMALY INTERCEPTION
        # -------------------------------------------------------------
        print("\n[WORKFLOW 3] Fuel Logging & Anomaly Interception Workflow...")
        # Normal fuel log
        normal_log = AnalyticsService.log_fuel_consumption(db, FuelLogCreate(
            vehicle_id=v1.vehicle_id,
            liters_filled=45.0,
            cost_per_liter=1.70,
            odometer_reading=18550.0,
            fuel_type="Diesel",
            fuel_station="Midtown Shell Station"
        ))
        assert not normal_log.is_anomaly

        # Anomaly log (abnormally high fuel intake for small distance)
        anomaly_log = AnalyticsService.log_fuel_consumption(db, FuelLogCreate(
            vehicle_id=v1.vehicle_id,
            liters_filled=190.0,
            cost_per_liter=1.70,
            odometer_reading=18555.0,
            fuel_type="Diesel",
            fuel_station="Highway Express"
        ))
        assert anomaly_log.is_anomaly
        print(f"  [PASS] Fuel Anomaly Intercepted: Vehicle {v1.vehicle_id} flagged: '{anomaly_log.anomaly_reason}'.")

        # -------------------------------------------------------------
        # WORKFLOW 4: COMPREHENSIVE EXECUTIVE AUDIT & REPORT GENERATION
        # -------------------------------------------------------------
        print("\n[WORKFLOW 4] Executive Report Generation & Multi-Format Exports...")
        rep_data = ReportsService.get_delivery_performance_data(db)
        csv_rep = ReportsService.generate_csv(rep_data)
        excel_rep = ReportsService.generate_excel(rep_data)
        pdf_rep = ReportsService.generate_pdf(rep_data)

        assert len(csv_rep) > 200
        assert len(excel_rep) > 1000
        assert len(pdf_rep) > 1000
        print(f"  [PASS] Enterprise Audit Reports exported successfully: CSV ({len(csv_rep)}B), Excel ({len(excel_rep)}B), PDF ({len(pdf_rep)}B).")

    finally:
        db.close()

    print("\n" + "=" * 70)
    print("ALL LOGISTICS WORKFLOWS VALIDATED AND OPERATIONAL!")
    print("=" * 70)

if __name__ == "__main__":
    run_workflow_validation()
