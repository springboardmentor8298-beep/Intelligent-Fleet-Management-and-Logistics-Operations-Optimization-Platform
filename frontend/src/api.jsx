import axios from 'axios';

// 1. Initialize the axios base instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// 2. Attach JWT token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth & Fleet Management (Milestone 1) ---
export const loginUser = (email, password) => api.post('/auth/login', new URLSearchParams({ username: email, password }));
export const registerUser = (data) => api.post('/auth/register', data);
export const fetchMetrics = () => api.get('/vehicles/metrics');
export const fetchVehicles = () => api.get('/vehicles/');
export const createVehicle = (data) => api.post('/vehicles/', data);

// --- Shipment Tracking & Route Optimization (Milestone 2) ---
export const createShipment = (data) => api.post('/shipments/', data);
export const fetchShipments = (status) => api.get('/shipments/', { params: status ? { status_filter: status } : {} });
export const fetchShipmentDetail = (id) => api.get(`/shipments/${id}`);
export const trackShipmentPublic = (trackingNumber) => api.get(`/shipments/track/${trackingNumber}`);
export const updateShipmentStatus = (id, data) => api.patch(`/shipments/${id}/status`, data);
export const geocodeLocation = (query) => api.get('/shipments/geocode', { params: { q: query } });

// --- Trip Scheduling & Route Optimization ---
export const optimizeRoute = (data) => api.post('/trips/optimize-route', data);
export const scheduleTrip = (data) => api.post('/trips/schedule', data);
export const fetchTrips = (status) => api.get('/trips/', { params: status ? { status_filter: status } : {} });
export const updateTripStatus = (tripId, status) => api.patch(`/trips/${tripId}/status?new_status=${encodeURIComponent(status)}`);

// --- Milestone 3: Maintenance Management ---
export const fetchMaintenanceJobs = (params) => api.get('/maintenance/', { params });
export const createMaintenanceJob = (data) => api.post('/maintenance/', data);
export const updateMaintenanceJob = (jobId, data) => api.patch(`/maintenance/${jobId}`, data);
export const deleteMaintenanceJob = (jobId) => api.delete(`/maintenance/${jobId}`);
export const fetchMaintenanceAlerts = () => api.get('/maintenance/alerts/active');
export const resolveMaintenanceAlert = (alertId) => api.patch(`/maintenance/alerts/${alertId}/resolve`);
export const fetchMaintenanceReportSummary = () => api.get('/maintenance/reports/summary');

// --- Milestone 3: Driver Management & Roster ---
export const fetchDrivers = (params) => api.get('/drivers/', { params });
export const createDriver = (data) => api.post('/drivers/', data);
export const updateDriverProfile = (driverId, data) => api.patch(`/drivers/${driverId}`, data);
export const updateDriverStatus = (driverId, status) => api.patch(`/drivers/${driverId}/status`, { status });
export const assignDriverVehicle = (driverId, vehicleId, notes) => api.post(`/drivers/${driverId}/assign`, { vehicle_id: vehicleId, notes });
export const unassignDriverVehicle = (driverId) => api.post(`/drivers/${driverId}/unassign`);
export const fetchDriverHistory = (driverId) => api.get(`/drivers/${driverId}/history`);

// --- Milestone 3: Operational Analytics & Performance ---
export const fetchOperationalOverview = () => api.get('/analytics/overview');
export const fetchFleetUtilization = () => api.get('/analytics/fleet-utilization');
export const fetchFleetPerformance = () => api.get('/analytics/performance');
export const fetchFuelAnalytics = () => api.get('/analytics/fuel');
export const logFuelConsumption = (data) => api.post('/analytics/fuel/log', data);
export const exportOperationalReport = (format = 'csv') => api.get('/analytics/export', {
  params: { format },
  responseType: format === 'csv' ? 'blob' : 'json'
});

// --- Milestone 3: Background Jobs & Celery Orchestration ---
export const fetchTasksStatus = () => api.get('/tasks/status');
export const triggerMaintenanceAlertsCheck = () => api.post('/tasks/run-maintenance-checks');
export const triggerFuelAnomalyScan = () => api.post('/tasks/detect-fuel-anomalies');
export const triggerDailyReport = () => api.post('/tasks/generate-daily-report');

// --- WebSocket URLs ---
export const getTrackingSocketUrl = (trackingNumber) => `ws://localhost:8000/shipments/ws/track/${trackingNumber}`;

export default api;