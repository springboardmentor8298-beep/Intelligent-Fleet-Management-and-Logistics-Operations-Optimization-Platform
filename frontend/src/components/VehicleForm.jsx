import React, { useState } from 'react';
import { createVehicle } from '../api';

export default function VehicleForm({ onVehicleAdded, onClose }) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    registration_number: '',
    vehicle_type: 'Heavy Truck',
    capacity: '',
    fuel_type: 'Diesel',
    status: 'Available'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createVehicle({ ...formData, capacity: parseFloat(formData.capacity) });
      setFormData({
        vehicle_id: '',
        registration_number: '',
        vehicle_type: 'Heavy Truck',
        capacity: '',
        fuel_type: 'Diesel',
        status: 'Available'
      });
      onVehicleAdded();
      if (onClose) onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error registering vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={darkFormStyles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={darkFormStyles.title}>Register Fleet Asset</h3>
        {onClose && (
          <button onClick={onClose} style={darkFormStyles.closeBtn}>✕</button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={darkFormStyles.grid}>
        <div>
          <label style={darkFormStyles.label}>Vehicle ID</label>
          <input
            style={darkFormStyles.input}
            placeholder="e.g. FL-009"
            required
            value={formData.vehicle_id}
            onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          />
        </div>
        <div>
          <label style={darkFormStyles.label}>Registration Number</label>
          <input
            style={darkFormStyles.input}
            placeholder="e.g. NY-8821"
            required
            value={formData.registration_number}
            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
          />
        </div>
        <div>
          <label style={darkFormStyles.label}>Max Capacity (Tons)</label>
          <input
            style={darkFormStyles.input}
            placeholder="e.g. 15.0"
            type="number"
            step="0.1"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          />
        </div>
        <div>
          <label style={darkFormStyles.label}>Vehicle Type</label>
          <select
            style={darkFormStyles.input}
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
          >
            <option value="Heavy Truck">Heavy Truck</option>
            <option value="Delivery Van">Delivery Van</option>
            <option value="Container Carrier">Container Carrier</option>
            <option value="Refrigerated Truck">Refrigerated Truck</option>
          </select>
        </div>
        <div>
          <label style={darkFormStyles.label}>Fuel Type</label>
          <select
            style={darkFormStyles.input}
            value={formData.fuel_type}
            onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
          >
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Petrol">Petrol</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" disabled={submitting} style={darkFormStyles.btn}>
            {submitting ? 'Registering...' : '+ Register Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}

const darkFormStyles = {
  card: {
    background: '#0d131f',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid #1e293b',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
    marginBottom: '28px'
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '700',
    color: '#f8fafc'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    background: '#070a0f',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '11px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
  }
};