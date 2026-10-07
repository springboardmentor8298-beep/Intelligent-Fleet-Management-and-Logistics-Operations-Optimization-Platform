import sys
import uuid
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import (
    Vehicle, Driver, MaintenanceLog, MaintenanceAlert, FuelLog,
    VehicleStatus, MaintenanceStatus, MaintenancePriority, DriverStatus, AlertSeverity
)
from app.services.maintenance_service import MaintenanceService
from app.services.driver_service import DriverService
from app.services.analytics_service import AnalyticsService
from app.tasks.maintenance_tasks import (
    check_maintenance_alerts_task,
    detect_fuel_anomalies_task,
    generate_operational_analytics_report_task
)
from app.celery_app import celery_app
from app.schemas import (
    MaintenanceCreate, MaintenanceUpdate, DriverCreate,
    DriverAssignmentRequest, DriverStatusUpdate, FuelLogCreate
)

def run_tests():
    print("=" * 60)
    print("FLEETFLOW MILESTONE 3: COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Ensure a test vehicle exists
        test_vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == "FL-TEST-01").first()
        if not test_vehicle:
            test_vehicle = Vehicle(
                vehicle_id="FL-TEST-01",
                registration_number="TEST-M3-999",
                vehicle_type="Heavy Duty Truck",
                capacity=15.0,
                fuel_type="Diesel",
                status=VehicleStatus.AVAILABLE,
                odometer_km=26500.0
            )
            db.add(test_vehicle)
            db.commit()
            db.refresh(test_vehicle)

        print("\n[TASK i] Testing Maintenance Scheduling Module...")
        maint_payload = MaintenanceCreate(
            vehicle_id=test_vehicle.vehicle_id,
            category="Engine Overhaul",
            service_center="Central Fleet Test Depot",
            priority=MaintenancePriority.HIGH,
            scheduled_date=datetime.utcnow() + timedelta(days=2),
            estimated_cost=850.0,
            odometer_reading=26500.0,
            notes="Milestone 3 Automated Test Service"
        )
        job = MaintenanceService.schedule_maintenance(db, maint_payload)
        assert job is not None
        assert job.job_id.startswith("MNT-")
        assert job.status == MaintenanceStatus.SCHEDULED
        print(f"  [PASS] Maintenance job scheduled: {job.job_id} ({job.category} for {job.vehicle_id})")

        # Status transition to IN_PROGRESS -> Vehicle status becomes MAINTENANCE
        update_in_progress = MaintenanceUpdate(status=MaintenanceStatus.IN_PROGRESS)
        job = MaintenanceService.update_maintenance(db, job.job_id, update_in_progress)
        db.refresh(test_vehicle)
        assert test_vehicle.status == VehicleStatus.MAINTENANCE
        print(f"  [PASS] Status changed to IN_PROGRESS -> Vehicle {test_vehicle.vehicle_id} marked as MAINTENANCE")

        # Status transition to COMPLETED -> Vehicle status reverts to AVAILABLE
        update_completed = MaintenanceUpdate(status=MaintenanceStatus.COMPLETED, actual_cost=820.0)
        job = MaintenanceService.update_maintenance(db, job.job_id, update_completed)
        db.refresh(test_vehicle)
        assert test_vehicle.status == VehicleStatus.AVAILABLE
        assert job.actual_cost == 820.0
        print(f"  [PASS] Status changed to COMPLETED -> Vehicle {test_vehicle.vehicle_id} restored to AVAILABLE")

        print("\n[TASK ii] Testing Driver Assignment System...")
        u_suffix = uuid.uuid4().hex[:8]
        driver_code = f"DRV-TST-{u_suffix}"
        lic_number = f"LIC-TEST-{u_suffix}"
        driver_payload = DriverCreate(
            driver_code=driver_code,
            name="Alex Sterling (Test Driver)",
            license_number=lic_number,
            license_type="CDL-A",
            phone="+1-555-0199",
            email="alex.sterling@fleetflow.io"
        )
        driver = DriverService.register_driver(db, driver_payload)
        assert driver is not None
        assert driver.name == "Alex Sterling (Test Driver)"
        print(f"  [PASS] Driver registered: {driver.driver_code} ({driver.name}, License: {driver.license_type})")

        # Assign vehicle
        driver = DriverService.assign_vehicle_to_driver(db, driver.id, test_vehicle.vehicle_id, "Test Runner", "Test Allocation")
        assert driver.current_vehicle_id == test_vehicle.vehicle_id
        history = DriverService.get_assignment_history(db, driver.id)
        assert len(history) >= 1
        print(f"  [PASS] Driver {driver.name} assigned to {test_vehicle.vehicle_id} (History logged)")

        # Test duty status change
        driver = DriverService.update_status(db, driver.id, DriverStatus.ON_DUTY)
        assert driver.status == DriverStatus.ON_DUTY
        print(f"  [PASS] Driver status updated to: {driver.status.value}")

        # Unassign vehicle
        driver = DriverService.assign_vehicle_to_driver(db, driver.id, None, "Test Runner", "Test Release")
        assert driver.current_vehicle_id is None
        print(f"  [PASS] Driver {driver.name} unassigned successfully.")

        print("\n[TASK iii] Testing Maintenance Alerts & Reports...")
        # Add an overdue maintenance job to trigger alert
        overdue_log = MaintenanceLog(
            job_id=f"MNT-OVD-{uuid.uuid4().hex[:8]}",
            vehicle_id=test_vehicle.vehicle_id,
            category="Emergency Brake Line Inspection",
            service_center="Depot West",
            status=MaintenanceStatus.SCHEDULED,
            priority=MaintenancePriority.CRITICAL,
            scheduled_date=datetime.utcnow() - timedelta(days=3),
            estimated_cost=400.0,
            odometer_reading=26600.0
        )
        db.add(overdue_log)
        db.commit()

        alerts_created = MaintenanceService.scan_all_maintenance_alerts(db)
        print(f"  [PASS] Alerts scan completed: {alerts_created} new alert(s) generated.")

        active_alerts = db.query(MaintenanceAlert).filter(
            MaintenanceAlert.vehicle_id == test_vehicle.vehicle_id,
            MaintenanceAlert.is_resolved == False
        ).all()
        assert len(active_alerts) >= 1
        test_alert = active_alerts[0]
        print(f"  [PASS] Verified active alert: [{test_alert.severity.value}] {test_alert.message}")

        # Resolve alert
        resolved = MaintenanceService.resolve_alert(db, test_alert.id)
        assert resolved.is_resolved is True
        print(f"  [PASS] Alert {test_alert.id} resolved successfully.")

        # Summary report
        summary = MaintenanceService.get_summary_report(db)
        assert summary["total_jobs"] > 0
        assert "cost_by_category" in summary
        print(f"  [PASS] Maintenance summary: {summary['total_jobs']} jobs, Total spend: ${summary['total_maintenance_cost']}")

        print("\n[TASK iv] Testing Operational Analytics Workflows...")
        overview = AnalyticsService.get_operational_overview(db)
        assert "fleet_utilization_rate" in overview
        assert "on_time_delivery_rate" in overview
        print(f"  [PASS] Operational Overview:")
        print(f"      - Fleet Utilization: {overview['fleet_utilization_rate']}%")
        print(f"      - On-Time Delivery Rate: {overview['on_time_delivery_rate']}%")
        print(f"      - Total Distance: {overview['total_distance_km']} km")
        print(f"      - Total Maintenance Spend: ${overview['total_maintenance_spend']}")

        utilization = AnalyticsService.get_fleet_utilization(db)
        assert "by_vehicle_type" in utilization
        print(f"  [PASS] Fleet Utilization breakdown generated for {len(utilization['by_vehicle_type'])} vehicle classes.")

        csv_export = AnalyticsService.export_operations_report(db, format="csv")
        assert "FLEETFLOW LOGISTICS OPERATIONS EXECUTIVE REPORT" in csv_export
        print(f"  [PASS] CSV Operational Export generated successfully ({len(csv_export)} bytes).")

        print("\n[TASK v] Testing Fleet Performance Dashboards...")
        perf = AnalyticsService.get_fleet_performance(db)
        assert "reliability_index" in perf
        assert "top_performing_drivers" in perf
        print(f"  [PASS] Performance Dashboard:")
        print(f"      - Reliability Index: {perf['reliability_index']}%")
        print(f"      - Average Transit: {perf['average_transit_minutes']} mins")
        print(f"      - Top Driver: {perf['top_performing_drivers'][0]['name'] if perf['top_performing_drivers'] else 'None'}")

        print("\n[TASK vi] Testing Fuel Monitoring Analytics...")
        # Normal fuel log
        fuel_payload_normal = FuelLogCreate(
            vehicle_id=test_vehicle.vehicle_id,
            liters_filled=75.0,
            cost_per_liter=1.65,
            odometer_reading=26800.0,
            fuel_type="Diesel",
            fuel_station="Terminal Shell"
        )
        fuel_log = AnalyticsService.log_fuel_consumption(db, fuel_payload_normal)
        assert fuel_log.is_anomaly is False
        print(f"  [PASS] Normal fuel log recorded: {fuel_log.liters_filled}L @ ${fuel_log.cost_per_liter}/L (Total: ${fuel_log.total_cost})")

        # Anomaly fuel log: Abnormal volume / high burn
        fuel_payload_anomaly = FuelLogCreate(
            vehicle_id=test_vehicle.vehicle_id,
            liters_filled=380.0, # Excessive fill (>300L)
            cost_per_liter=1.65,
            odometer_reading=26850.0,
            fuel_type="Diesel",
            fuel_station="Highway Pump"
        )
        anomaly_log = AnalyticsService.log_fuel_consumption(db, fuel_payload_anomaly)
        assert anomaly_log.is_anomaly is True
        print(f"  [PASS] Anomaly detected and flagged: '{anomaly_log.anomaly_reason}'")

        fuel_analytics = AnalyticsService.get_fuel_analytics(db)
        assert fuel_analytics["anomalies_detected"] >= 1
        print(f"  [PASS] Fuel Analytics: Avg Efficiency: {fuel_analytics['average_efficiency_km_per_l']} km/L | Eco Savings: {fuel_analytics['eco_route_savings_liters']}L (${fuel_analytics['eco_route_savings_usd']})")

        print("\n[TASK vii] Testing Celery Background Jobs & Periodic Beat Schedules...")
        # Verify Celery app configuration
        assert celery_app.conf.beat_schedule is not None
        assert "check-maintenance-alerts-every-30-mins" in celery_app.conf.beat_schedule
        assert "detect-fuel-anomalies-every-2-hours" in celery_app.conf.beat_schedule
        assert "generate-daily-operational-report" in celery_app.conf.beat_schedule
        print("  [PASS] Celery beat periodic schedules configured:")
        for name, sched in celery_app.conf.beat_schedule.items():
            print(f"      - {name}: task '{sched['task']}'")

        # Test Celery tasks direct execution
        res_alerts = check_maintenance_alerts_task()
        assert res_alerts["status"] == "success"
        print(f"  [PASS] Celery Task 'check_maintenance_alerts_task' executed: {res_alerts}")

        res_fuel = detect_fuel_anomalies_task()
        assert res_fuel["status"] == "success"
        print(f"  [PASS] Celery Task 'detect_fuel_anomalies_task' executed: {res_fuel}")

        res_report = generate_operational_analytics_report_task()
        assert res_report["status"] == "success"
        print(f"  [PASS] Celery Task 'generate_operational_analytics_report_task' executed: {res_report['task']}")

        print("\n" + "=" * 60)
        print("ALL MILESTONE 3 TASKS & OUTCOMES VERIFIED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
