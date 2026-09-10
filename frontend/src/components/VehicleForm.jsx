import React, { useState } from 'react';
import { createVehicle } from '../api';

export default function VehicleForm({ onVehicleAdded }) {
  const [formData, setFormData] = useState({
    vehicle_id: '', registration_number: '', vehicle_type: 'Heavy Truck',
    capacity: '', fuel_type: 'Diesel', status: 'Available'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createVehicle({ ...formData, capacity: parseFloat(formData.capacity) });
      setFormData({ vehicle_id: '', registration_number: '', vehicle_type: 'Heavy Truck', capacity: '', fuel_type: 'Diesel', status: 'Available' });
      onVehicleAdded();
    } catch (err) { alert('Error registering vehicle'); }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Register New Asset</h3>
      <form onSubmit={handleSubmit} style={styles.grid}>
        <input style={styles.input} placeholder="Vehicle ID (FL-001)" required value={formData.vehicle_id} onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })} />
        <input style={styles.input} placeholder="Reg Number (NY-1234)" required value={formData.registration_number} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} />
        <input style={styles.input} placeholder="Capacity (Tons)" type="number" step="0.1" required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
        <select style={styles.input} value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}>
          <option value="Heavy Truck">Heavy Truck</option>
          <option value="Delivery Van">Delivery Van</option>
          <option value="Trailer">Trailer</option>
        </select>
        <select style={styles.input} value={formData.fuel_type} onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
        </select>
        <button type="submit" style={styles.btn}>+ Add Vehicle</button>
      </form>
    </div>
  );
}

const styles = {
  card: { background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px', border: '1px solid #f3f4f6' },
  title: { margin: '0 0 16px 0', fontSize: '18px', color: '#111827' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  btn: { background: '#10b981', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }
};