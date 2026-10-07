# FleetFlow — Live Platform Demonstration & Viva Presentation Script

This script provides evaluators and presenters with a structured walkthrough to demonstrate the full platform across all 10 modules for Milestone 4 evaluation.

---

## 1. Quick Verification Command (Console Demonstration)

Run the automated live demonstration script:
```bash
python backend/demo_milestone4.py
```
This script validates and showcases all 10 modules sequentially in under 3 seconds with colored status badges:
1. System Initialization (FastAPI 4.0.0, Postgres, Celery)
2. User Management & 4-Tier RBAC (Administrator, Fleet Manager, Driver, Dispatcher)
3. Fleet Vehicle Asset Registration & Availability Tracking
4. Commercial Driver Registration & Asset Allocation
5. 4-Strategy Route Optimization (Shortest, Fastest, Traffic, Fuel Efficient)
6. 6-Stage Consignment Tracking Lifecycle & Live Coordinates
7. Preventative Maintenance Scheduling & Health Alerts
8. Multi-Channel Notifications (Email, SMS, Push)
9. Operational Analytics & KPI Dashboards
10. Executive Reports & Multi-Format Exports (PDF, Excel, CSV)

---

## 2. Interactive Web UI Walkthrough (Step-by-Step)

### Step 1: Login & Role-Based Access
- Navigate to `http://localhost:5173` (or `http://localhost:3000`).
- Login with Administrator credentials (`administrator@gmail.com`) or Fleet Manager credentials (`hello@gmail.com`).
- Observe the active user email and role badge in the sticky header.

### Step 2: Command Center Dashboard
- Note the top **Milestone 4: Production Deployment & Verification Ready** badge.
- Review real-time KPI cards: Total Fleet, Available for Dispatch, Active in Transit, Under Maintenance, and Fleet Utilization rate.

### Step 3: Fleet Registry (`/fleet`)
- View registered commercial assets.
- Click **Register New Vehicle** to add a truck with capacity, fuel type, and registration number.
- Observe instant table synchronization.

### Step 4: Shipment Tracking & Live Telemetry (`/shipments`)
- View the active consignment roster.
- Inspect the 6-stage lifecycle tracking badges (*Created, Assigned, In Transit, Delayed, Delivered, Cancelled*).
- Click on any shipment to view the live GPS satellite telemetry map and event audit log.

### Step 5: Route Optimizer (`/routes`)
- Input origin coordinates and destination coordinates.
- Toggle between all 4 optimization profiles:
  - *Shortest Route* (minimizes distance)
  - *Fastest Route* (minimizes transit minutes)
  - *Traffic Avoidance* (reroutes around congestion bottlenecks)
  - *Fuel Efficient Route* (optimizes combustion rates)
- Click **Dispatch Trip** to allocate to an active vehicle.

### Step 6: Commercial Driver Roster (`/drivers`)
- View registered drivers, CDL classifications, duty statuses, and safety scores.
- Assign an unassigned driver to a vehicle asset; verify instant history logging.

### Step 7: Vehicle Maintenance Portal (`/maintenance`)
- Schedule a service job across 5 categories (*Oil Change, Tire Replacement, Engine Service, Brake Service, General Inspection*).
- Transition job status from *Scheduled* to *In Progress* -> Observe vehicle status change to *Maintenance*.
- Complete the job -> Observe vehicle restored to *Available*.

### Step 8: Operational Analytics & Multi-Format Exports (`/analytics`)
- Inspect fleet utilization charts, reliability indexes, and fuel consumption trends.
- Test one-click report exports:
  - Download **PDF Report** (formatted with ReportLab tables and metrics).
  - Download **Excel Spreadsheet** (`.xlsx` formatted with OpenPyXL).
  - Download **CSV Report**.
