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

// --- WebSocket URLs ---
export const getTrackingSocketUrl = (trackingNumber) => `ws://localhost:8000/shipments/ws/track/${trackingNumber}`;

export default api;