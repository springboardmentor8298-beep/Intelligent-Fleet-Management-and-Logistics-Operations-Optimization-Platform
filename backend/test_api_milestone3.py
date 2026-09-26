import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("=" * 60)
    print("MILESTONE 3: FASTAPI ENDPOINT INTEGRATION TEST SUITE")
    print("=" * 60)

    # 1. Root & Health
    r = client.get("/")
    assert r.status_code == 200
    assert "Milestone 3: Maintenance Management & Analytics" in r.json()["milestones_active"]
    print("[PASS] GET / -> 200 OK (Milestone 3 active in version 3.0.0)")

    # 2. Maintenance Endpoints
    print("\n--- Testing Maintenance Endpoints ---")
    r = client.get("/maintenance/")
    assert r.status_code == 200
    jobs = r.json()
    assert isinstance(jobs, list)
    print(f"[PASS] GET /maintenance/ -> 200 OK ({len(jobs)} jobs retrieved)")

    # Create job
    new_job_payload = {
        "vehicle_id": "FL-001",
        "category": "Transmission Flush",
        "service_center": "Speedy Lube Depot",
        "priority": "Medium",
        "estimated_cost": 320.0,
        "notes": "Automated API Test Service"
    }
    r = client.post("/maintenance/", json=new_job_payload)
    assert r.status_code == 201
    created_job = r.json()
    job_id = created_job["job_id"]
    assert job_id.startswith("MNT-")
    print(f"[PASS] POST /maintenance/ -> 201 Created ({job_id})")

    # Update job
    r = client.patch(f"/maintenance/{job_id}", json={"status": "In Progress", "actual_cost": 310.0})
    assert r.status_code == 200
    assert r.json()["status"] == "In Progress"
    print(f"[PASS] PATCH /maintenance/{job_id} -> 200 OK (Status: In Progress)")

    # Maintenance alerts
    r = client.get("/maintenance/alerts/active")
    assert r.status_code == 200
    alerts = r.json()
    assert isinstance(alerts, list)
    print(f"[PASS] GET /maintenance/alerts/active -> 200 OK ({len(alerts)} active alerts)")

    if len(alerts) > 0:
        alert_id = alerts[0]["id"]
        r = client.patch(f"/maintenance/alerts/{alert_id}/resolve")
        assert r.status_code == 200
        assert r.json()["is_resolved"] is True
        print(f"[PASS] PATCH /maintenance/alerts/{alert_id}/resolve -> 200 OK (Resolved)")

    # Maintenance summary
    r = client.get("/maintenance/reports/summary")
    assert r.status_code == 200
    summary = r.json()
    assert "total_jobs" in summary
    assert "total_maintenance_cost" in summary
    print(f"[PASS] GET /maintenance/reports/summary -> 200 OK (Total Spend: ${summary['total_maintenance_cost']})")

    # 3. Driver Endpoints
    print("\n--- Testing Driver Management Endpoints ---")
    r = client.get("/drivers/")
    assert r.status_code == 200
    drivers = r.json()
    assert isinstance(drivers, list)
    print(f"[PASS] GET /drivers/ -> 200 OK ({len(drivers)} drivers)")

    # Register driver
    driver_payload = {
        "name": "Jordan Hayes",
        "license_number": f"CDL-JH-{int(summary['total_jobs']) * 123 + 45}",
        "license_type": "CDL-A",
        "phone": "+1-555-8822"
    }
    r = client.post("/drivers/", json=driver_payload)
    assert r.status_code == 201
    driver = r.json()
    driver_id = driver["id"]
    print(f"[PASS] POST /drivers/ -> 201 Created (Driver ID: {driver_id}, Code: {driver['driver_code']})")

    # Assign vehicle
    r = client.post(f"/drivers/{driver_id}/assign", json={"vehicle_id": "FL-002", "notes": "Route Assignment"})
    assert r.status_code == 200
    assert r.json()["current_vehicle_id"] == "FL-002"
    print(f"[PASS] POST /drivers/{driver_id}/assign -> 200 OK (Assigned to FL-002)")

    # Update duty status
    r = client.patch(f"/drivers/{driver_id}/status", json={"status": "On Duty"})
    assert r.status_code == 200
    assert r.json()["status"] == "On Duty"
    print(f"[PASS] PATCH /drivers/{driver_id}/status -> 200 OK (Status: On Duty)")

    # Driver history
    r = client.get(f"/drivers/{driver_id}/history")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"[PASS] GET /drivers/{driver_id}/history -> 200 OK ({len(r.json())} history events)")

    # Unassign vehicle
    r = client.post(f"/drivers/{driver_id}/unassign")
    assert r.status_code == 200
    assert r.json()["current_vehicle_id"] is None
    print(f"[PASS] POST /drivers/{driver_id}/unassign -> 200 OK (Unassigned)")

    # 4. Analytics Endpoints
    print("\n--- Testing Analytics & Dashboards Endpoints ---")
    r = client.get("/analytics/overview")
    assert r.status_code == 200
    overview = r.json()
    assert "fleet_utilization_rate" in overview
    assert "on_time_delivery_rate" in overview
    print(f"[PASS] GET /analytics/overview -> 200 OK (Utilization: {overview['fleet_utilization_rate']}%, On-Time: {overview['on_time_delivery_rate']}%)")

    r = client.get("/analytics/fleet-utilization")
    assert r.status_code == 200
    ut = r.json()
    assert "overall_utilization" in ut
    print(f"[PASS] GET /analytics/fleet-utilization -> 200 OK (Overall: {ut['overall_utilization']}%)")

    r = client.get("/analytics/performance")
    assert r.status_code == 200
    perf = r.json()
    assert "reliability_index" in perf
    print(f"[PASS] GET /analytics/performance -> 200 OK (Reliability: {perf['reliability_index']}%)")

    # Fuel analytics
    r = client.get("/analytics/fuel")
    assert r.status_code == 200
    fuel = r.json()
    assert "average_efficiency_km_per_l" in fuel
    assert "anomalies_detected" in fuel
    print(f"[PASS] GET /analytics/fuel -> 200 OK (Efficiency: {fuel['average_efficiency_km_per_l']} km/L, Anomalies: {fuel['anomalies_detected']})")

    # Log fuel
    fuel_in = {
        "vehicle_id": "FL-001",
        "liters_filled": 60.0,
        "cost_per_liter": 1.62,
        "odometer_reading": 27200.0,
        "fuel_type": "Diesel",
        "fuel_station": "City Gate Petrol"
    }
    r = client.post("/analytics/fuel/log", json=fuel_in)
    assert r.status_code == 201
    assert r.json()["total_cost"] == 97.2
    print(f"[PASS] POST /analytics/fuel/log -> 201 Created (Total: ${r.json()['total_cost']})")

    # Export CSV & JSON
    r = client.get("/analytics/export?format=csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert "FLEETFLOW" in r.text
    print(f"[PASS] GET /analytics/export?format=csv -> 200 OK ({len(r.text)} bytes CSV)")

    r = client.get("/analytics/export?format=json")
    assert r.status_code == 200
    assert "overview" in r.json()
    print(f"[PASS] GET /analytics/export?format=json -> 200 OK (JSON export)")

    # 5. Background Tasks & Celery Endpoints
    print("\n--- Testing Celery & Background Jobs Endpoints ---")
    r = client.get("/tasks/status")
    assert r.status_code == 200
    assert len(r.json()["periodic_schedules"]) == 3
    print(f"[PASS] GET /tasks/status -> 200 OK (3 periodic beat schedules registered)")

    r = client.post("/tasks/run-maintenance-checks")
    assert r.status_code == 200
    print(f"[PASS] POST /tasks/run-maintenance-checks -> 200 OK ({r.json()['mode']})")

    r = client.post("/tasks/detect-fuel-anomalies")
    assert r.status_code == 200
    print(f"[PASS] POST /tasks/detect-fuel-anomalies -> 200 OK ({r.json()['mode']})")

    r = client.post("/tasks/generate-daily-report")
    assert r.status_code == 200
    print(f"[PASS] POST /tasks/generate-daily-report -> 200 OK ({r.json()['mode']})")

    print("\n" + "=" * 60)
    print("ALL FASTAPI HTTP INTEGRATION TESTS PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
