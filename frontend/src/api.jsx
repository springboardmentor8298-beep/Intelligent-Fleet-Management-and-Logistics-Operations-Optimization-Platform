import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return client.post('/auth/login', formData);
};

export const registerUser = (data) => client.post('/auth/register', data);
export const fetchMetrics = () => client.get('/vehicles/metrics');
export const fetchVehicles = () => client.get('/vehicles/');
export const createVehicle = (data) => client.post('/vehicles/', data);