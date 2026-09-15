import React, { useEffect, useState } from 'react';
import { fetchMetrics, fetchVehicles } from '../api';
import VehicleForm from './VehicleForm';
import LogisticsBoard from './LogisticsBoard';

export default function Dashboard({ user, onLogout }) {
  const [metrics, setMetrics] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  const loadData = async () => {
    try {
      const [mRes, vRes] = await Promise.all([fetchMetrics(), fetchVehicles()]);
      setMetrics(mRes.data);
      setVehicles(vRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const getStatusColor = (status) => {
    if (status === 'Available') return { bg: '#d1fae5', text: '#065f46' };
    if (status === 'In Transit') return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  return (
    <div>
      <nav style={styles.nav}>
        <h2 style={{ margin: 0, color: '#111827' }}>FleetFlow Operations</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#4b5563', fontSize: '14px' }}>{user.email} <b>({user.role})</b></span>
          <button onClick={onLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </nav>

      <div style={styles.page}>
        {metrics && (
          <div style={styles.grid}>
            <div style={styles.card}><p style={styles.cardTitle}>Total Fleet</p><h3 style={styles.cardValue}>{metrics.total_vehicles}</h3></div>
            <div style={styles.card}><p style={styles.cardTitle}>Available</p><h3 style={{...styles.cardValue, color: '#10b981'}}>{metrics.available_vehicles}</h3></div>
            <div style={styles.card}><p style={styles.cardTitle}>In Transit</p><h3 style={{...styles.cardValue, color: '#f59e0b'}}>{metrics.in_transit_vehicles}</h3></div>
            <div style={styles.card}><p style={styles.cardTitle}>Maintenance</p><h3 style={{...styles.cardValue, color: '#ef4444'}}>{metrics.maintenance_vehicles}</h3></div>
            <div style={styles.card}><p style={styles.cardTitle}>Utilization</p><h3 style={styles.cardValue}>{metrics.fleet_utilization_rate}%</h3></div>
          </div>
        )}

        {['Administrator', 'Fleet Manager'].includes(user.role) && <VehicleForm onVehicleAdded={loadData} />}

        <LogisticsBoard /> {/* Add this exact line! */}

        <div style={styles.tableCard}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, color: '#111827' }}>Active Vehicle Registry</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Vehicle ID', 'Reg Number', 'Type', 'Capacity', 'Fuel', 'Status'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const colors = getStatusColor(v.status);
                return (
                  <tr key={v.id} style={styles.tr}>
                    <td style={{...styles.td, fontWeight: '600'}}>{v.vehicle_id}</td>
                    <td style={styles.td}>{v.registration_number}</td>
                    <td style={styles.td}>{v.vehicle_type}</td>
                    <td style={styles.td}>{v.capacity} Tons</td>
                    <td style={styles.td}>{v.fuel_type}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: colors.bg, color: colors.text }}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 32px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  logoutBtn: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: { background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' },
  cardTitle: { margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  cardValue: { margin: '8px 0 0 0', fontSize: '36px', fontWeight: '700', color: '#111827' },
  tableCard: { background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #f3f4f6' },
  th: { background: '#f9fafb', padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' },
  tr: { transition: 'background-color 0.2s' },
  td: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' }
};