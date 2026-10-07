# FleetFlow — REST API Specification (Version 4.0.0)

Base URL: `http://localhost:8000` (or `http://localhost/api/`)

---

## 1. Authentication & User Management (`/auth`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user | Public |
| `POST` | `/auth/login` | Authenticate and obtain JWT Bearer token | Public |
| `GET` | `/auth/me` | Fetch currently authenticated user profile | Any authenticated |
| `PUT` | `/auth/profile` | Update profile email / role | Authenticated / Admin |
| `POST` | `/auth/change-password` | Update account password | Authenticated |
| `GET` | `/auth/settings` | Retrieve user preferences and alert settings | Authenticated |
| `PUT` | `/auth/settings` | Save notification preferences & theme settings | Authenticated |
| `GET` | `/auth/users` | List registered platform users | Admin, Fleet Manager |

---

## 2. Fleet Management (`/vehicles`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/vehicles/` | Register new commercial vehicle asset | Admin, Fleet Manager |
| `GET` | `/vehicles/` | List all vehicles with statuses and locations | Any authenticated |
| `GET` | `/vehicles/metrics` | Retrieve fleet count, utilization, and status metrics | Any authenticated |

---

## 3. Shipment Tracking (`/shipments`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/shipments/` | Create a new freight consignment | Any authenticated |
| `GET` | `/shipments/` | List shipments with status and vehicle filters | Any authenticated |
| `GET` | `/shipments/{id}` | Retrieve consignment details and event history | Any authenticated |
| `PATCH` | `/shipments/{id}/status` | Update delivery status (Created -> Delivered) | Dispatcher, Driver |
| `POST` | `/shipments/{id}/telemetry` | Log live GPS breadcrumbs and speed | Driver, Gateway |

---

## 4. Route Optimization & Trips (`/trips`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/trips/optimize-route` | Calculate distance, ETA, fuel for 4 route strategies | Any authenticated |
| `POST` | `/trips/schedule` | Schedule trip and link consignments | Dispatcher, Manager |
| `GET` | `/trips/` | List trips with status filters | Any authenticated |
| `GET` | `/trips/{id}` | Get trip details and waypoint paths | Any authenticated |

---

## 5. Vehicle Maintenance (`/maintenance`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/maintenance/` | Schedule preventative or corrective service job | Fleet Manager, Admin |
| `GET` | `/maintenance/` | List service jobs with filters | Any authenticated |
| `GET` | `/maintenance/{id}` | Get job details | Any authenticated |
| `PATCH` | `/maintenance/{id}` | Update status (In Progress, Completed) and cost | Fleet Manager |
| `GET` | `/maintenance/alerts/active` | Get active mechanical and overdue servicing alerts | Any authenticated |
| `PATCH` | `/maintenance/alerts/{id}/resolve`| Mark maintenance alert as resolved | Fleet Manager |
| `GET` | `/maintenance/reports/summary` | Get aggregated maintenance costs & category breakdown | Any authenticated |

---

## 6. Driver Management (`/drivers`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/drivers/` | Register commercial driver in roster | Admin, Fleet Manager |
| `GET` | `/drivers/` | List all drivers with duty status filter | Any authenticated |
| `GET` | `/drivers/{id}` | Get driver profile and performance score | Any authenticated |
| `POST` | `/drivers/{id}/assign` | Allocate vehicle asset to driver | Fleet Manager |
| `POST` | `/drivers/{id}/unassign` | Unassign vehicle from driver | Fleet Manager |
| `PATCH` | `/drivers/{id}/status` | Update duty status (Available, On Duty, etc.) | Driver, Manager |
| `GET` | `/drivers/{id}/history` | Get complete vehicle assignment history log | Any authenticated |

---

## 7. Operational Analytics (`/analytics`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/analytics/overview` | High-level logistics KPIs and fleet metrics | Any authenticated |
| `GET` | `/analytics/fleet-utilization` | Utilization breakdown across vehicle classes | Any authenticated |
| `GET` | `/analytics/performance` | Reliability score, transit times, top drivers | Any authenticated |
| `GET` | `/analytics/fuel` | Fuel consumption, efficiency, and anomaly log | Any authenticated |
| `POST` | `/analytics/fuel/log` | Record fuel refill with anomaly interception | Driver, Dispatcher |

---

## 8. Notification Module (`/notifications`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/notifications/` | Dispatch multi-channel notification | Authenticated |
| `GET` | `/notifications/` | Audit notification history (Email, SMS, Push) | Authenticated |
| `PATCH` | `/notifications/{id}/read` | Mark notification as read | Authenticated |
| `POST` | `/notifications/mark-all-read` | Mark all notifications as acknowledged | Authenticated |
| `POST` | `/notifications/simulate-dispatch` | Simulate multi-channel gateway transmission | Authenticated |

---

## 9. Reports & Export Module (`/reports`)

| Method | Endpoint | Description | Supported Formats |
|---|---|---|---|
| `GET` | `/reports/fleet-utilization` | Fleet utilization & asset availability report | `pdf`, `excel`, `csv`, `json` |
| `GET` | `/reports/fuel-consumption` | Fuel consumption & efficiency report | `pdf`, `excel`, `csv`, `json` |
| `GET` | `/reports/driver-performance` | Driver safety and trip performance report | `pdf`, `excel`, `csv`, `json` |
| `GET` | `/reports/delivery-performance`| Delivery completion and SLA report | `pdf`, `excel`, `csv`, `json` |
| `GET` | `/reports/maintenance` | Vehicle maintenance spend and service report | `pdf`, `excel`, `csv`, `json` |

---

## 10. Background Tasks & Health (`/tasks` & `/health`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check and subsystem statuses |
| `GET` | `/tasks/status` | Celery broker connection and periodic beat schedules |
| `POST` | `/tasks/run-maintenance-checks` | Trigger on-demand maintenance alert audit |
| `POST` | `/tasks/detect-fuel-anomalies` | Trigger on-demand fuel anomaly detection scan |
| `POST` | `/tasks/generate-daily-report` | Trigger on-demand daily operations report job |
