import React, { useEffect, useState } from 'react';
import { fetchVehicles, fetchMetrics } from '../api';
import VehicleForm from '../components/VehicleForm';

export default function FleetPage({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadData = async () => {
    try {
      const [vRes, mRes] = await Promise.all([fetchVehicles(), fetchMetrics()]);
      setVehicles(vRes.data || []);
      setMetrics(mRes.data);
    } catch (err) {
      console.error("Error loading fleet page data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Available':
        return { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
      case 'In Transit':
        return { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'Maintenance':
        return { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', border: 'rgba(248, 113, 113, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={fleetStyles.page}>
      {/* Header */}
      <div style={fleetStyles.headerRow}>
        <div>
          <div style={fleetStyles.subtitle}>FLEET ASSET MANAGEMENT</div>
          <h1 style={fleetStyles.title}>Enterprise Vehicle Registry & Monitoring</h1>
          <p style={fleetStyles.desc}>
            Real-time asset telemetry, payload capacities, fuel specifications, and vehicle operational availability.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={fleetStyles.addBtn}
          >
            {showAddForm ? '✕ Close Form' : '+ Register New Vehicle'}
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      {metrics && (
        <div style={fleetStyles.metricsGrid}>
          <div style={fleetStyles.metricBox}>
            <span style={fleetStyles.metricLabel}>Total Assets</span>
            <div style={fleetStyles.metricNum}>{metrics.total_vehicles}</div>
          </div>
          <div style={fleetStyles.metricBox}>
            <span style={fleetStyles.metricLabel}>Available</span>
            <div style={{ ...fleetStyles.metricNum, color: '#34d399' }}>{metrics.available_vehicles}</div>
          </div>
          <div style={fleetStyles.metricBox}>
            <span style={fleetStyles.metricLabel}>In Transit</span>
            <div style={{ ...fleetStyles.metricNum, color: '#38bdf8' }}>{metrics.in_transit_vehicles}</div>
          </div>
          <div style={fleetStyles.metricBox}>
            <span style={fleetStyles.metricLabel}>Maintenance</span>
            <div style={{ ...fleetStyles.metricNum, color: '#f87171' }}>{metrics.maintenance_vehicles}</div>
          </div>
          <div style={fleetStyles.metricBox}>
            <span style={fleetStyles.metricLabel}>Utilization Rate</span>
            <div style={{ ...fleetStyles.metricNum, color: '#fbbf24' }}>{metrics.fleet_utilization_rate}%</div>
          </div>
        </div>
      )}

      {/* Registration Modal Form */}
      {showAddForm && (
        <VehicleForm
          onVehicleAdded={loadData}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Filter and Search Bar */}
      <div style={fleetStyles.filterBar}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search vehicle ID, reg number, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={fleetStyles.searchInput}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Available', 'In Transit', 'Maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                ...fleetStyles.filterPill,
                ...(statusFilter === st ? fleetStyles.activePill : {})
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Registry Table */}
      <div style={fleetStyles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={fleetStyles.table}>
            <thead>
              <tr style={fleetStyles.thRow}>
                <th style={fleetStyles.th}>Vehicle ID</th>
                <th style={fleetStyles.th}>Registration</th>
                <th style={fleetStyles.th}>Type</th>
                <th style={fleetStyles.th}>Max Capacity</th>
                <th style={fleetStyles.th}>Fuel Type</th>
                <th style={fleetStyles.th}>Current Coordinates</th>
                <th style={fleetStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const badge = getStatusStyle(v.status);
                return (
                  <tr key={v.id} style={fleetStyles.tr}>
                    <td style={{ ...fleetStyles.td, fontWeight: '700', color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                      🚛 {v.vehicle_id}
                    </td>
                    <td style={{ ...fleetStyles.td, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                      {v.registration_number}
                    </td>
                    <td style={fleetStyles.td}>{v.vehicle_type}</td>
                    <td style={fleetStyles.td}>{v.capacity} Tons</td>
                    <td style={fleetStyles.td}>{v.fuel_type}</td>
                    <td style={{ ...fleetStyles.td, fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono' }}>
                      {v.current_lat?.toFixed(4)}, {v.current_lng?.toFixed(4)}
                    </td>
                    <td style={fleetStyles.td}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ ...fleetStyles.td, textAlign: 'center', color: '#64748b', padding: '32px' }}>
                    No vehicle assets found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const fleetStyles = {
  page: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  subtitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '1px',
    marginBottom: '4px'
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '800',
    color: '#f8fafc'
  },
  desc: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8'
  },
  addBtn: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px'
  },
  metricBox: {
    background: '#0d131f',
    border: '1px solid #1e293b',
    padding: '16px',
    borderRadius: '12px'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  metricNum: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: '4px',
    fontFamily: 'JetBrains Mono'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    background: '#0d131f',
    border: '1px solid #1e293b',
    padding: '14px',
    borderRadius: '12px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    background: '#070a0f',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none'
  },
  filterPill: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    background: '#070a0f',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  activePill: {
    background: '#1e293b',
    color: '#38bdf8',
    border: '1px solid #38bdf8'
  },
  tableCard: {
    background: '#0d131f',
    border: '1px solid #1e293b',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    background: '#090d15',
    borderBottom: '1px solid #1e293b'
  },
  th: {
    padding: '14px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid #131b2b'
  },
  td: {
    padding: '16px',
    fontSize: '13px',
    color: '#cbd5e1'
  }
};
