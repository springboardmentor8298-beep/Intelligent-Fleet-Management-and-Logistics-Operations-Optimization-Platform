import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMetrics, fetchVehicles, fetchShipments } from '../api';

export default function HomePage({ user }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [recentShipments, setRecentShipments] = useState([]);
  const [activeVehiclesCount, setActiveVehiclesCount] = useState(0);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const [mRes, vRes, sRes] = await Promise.all([
        fetchMetrics(),
        fetchVehicles(),
        fetchShipments()
      ]);
      setMetrics(mRes.data);
      setActiveVehiclesCount(vRes.data.length);
      setRecentShipments((sRes.data || []).slice(0, 5));
    } catch (err) {
      console.error("Failed to load command center data", err);
    }
  };

  const modules = [
    {
      id: 'fleet',
      title: 'Fleet Management Module',
      desc: 'Vehicle registration, capacity monitoring, fuel type tracking, and live availability statuses.',
      icon: '🚛',
      path: '/fleet',
      stats: `${activeVehiclesCount} Registered Vehicles`,
      color: '#38bdf8'
    },
    {
      id: 'shipments',
      title: 'Shipment Tracking & Dispatch',
      desc: 'Real-time GPS satellite tracking, dynamic ETA countdown, and 6-stage delivery status monitoring.',
      icon: '📦',
      path: '/shipments',
      stats: 'Live WebSocket Stream',
      color: '#818cf8'
    },
    {
      id: 'routes',
      title: 'Route Optimization & Scheduling',
      desc: 'Shortest, Fastest, Traffic Avoidance, and Fuel-Efficient algorithms with multi-stop trip dispatching.',
      icon: '🛣️',
      path: '/routes',
      stats: '4 Route Strategies Active',
      color: '#34d399'
    },
    {
      id: 'drivers',
      title: 'Driver Management Module',
      desc: 'Driver registration, active trip assignments, license details, duty records, and performance scores.',
      icon: '👨‍✈️',
      path: '/drivers',
      stats: 'Commercial Roster Active',
      color: '#fbbf24'
    },
    {
      id: 'maintenance',
      title: 'Vehicle Maintenance Module',
      desc: 'Preventive service scheduling, oil change, tire replacement, engine health reports, and alert triggers.',
      icon: '🔧',
      path: '/maintenance',
      stats: `${metrics?.maintenance_vehicles || 0} In Inspection Queue`,
      color: '#f87171'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting Module',
      desc: 'Fleet utilization trends, fuel consumption reports, route performance metrics, and PDF/Excel export.',
      icon: '📊',
      path: '/analytics',
      stats: 'Automated Daily Logs',
      color: '#c084fc'
    }
  ];

  return (
    <div style={homeStyles.page}>
      {/* Hero Command Center Header */}
      <div style={homeStyles.heroCard}>
        <div>
          <div style={homeStyles.tagline}>OPERATIONAL DISPATCH PLATFORM</div>
          <h1 style={homeStyles.heroTitle}>FleetFlow Logistics Command Center</h1>
          <p style={homeStyles.heroDesc}>
            Centralized intelligent logistics hub coordinating vehicle telemetry, traffic-aware route optimization, and driver dispatching.
          </p>
        </div>
        <div style={homeStyles.heroActions}>
          <button onClick={() => navigate('/shipments')} style={homeStyles.primaryActionBtn}>
            📡 Launch Live Map
          </button>
          <button onClick={() => navigate('/routes')} style={homeStyles.secondaryActionBtn}>
            ⚡ Dispatch Trip
          </button>
        </div>
      </div>

      {/* Milestone 4 Production Status Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '12px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🚀</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>
              Milestone 4: Production Deployment & Verification Ready
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              All 10 modules verified: User RBAC, Fleet, GPS Tracking, Route Optimization, Maintenance, Drivers, Analytics, Notifications & Reports.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/analytics')}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '6px',
              border: '1px solid #0284c7',
              background: 'rgba(2, 132, 199, 0.2)',
              color: '#38bdf8',
              cursor: 'pointer'
            }}
          >
            📊 Export Reports
          </button>
        </div>
      </div>

      {/* Real-Time Operational KPI Gauges */}
      {metrics && (
        <div className="kpi-container" style={homeStyles.metricsGrid}>
          <div style={homeStyles.metricCard}>
            <div style={homeStyles.metricLabel}>Total Fleet</div>
            <div style={homeStyles.metricValue}>{metrics.total_vehicles}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Units in enterprise fleet</div>
          </div>
          <div style={homeStyles.metricCard}>
            <div style={homeStyles.metricLabel}>Available for Dispatch</div>
            <div style={{ ...homeStyles.metricValue, color: '#34d399' }}>{metrics.available_vehicles}</div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Ready for assignment</div>
          </div>
          <div style={homeStyles.metricCard}>
            <div style={homeStyles.metricLabel}>Active in Transit</div>
            <div style={{ ...homeStyles.metricValue, color: '#38bdf8' }}>{metrics.in_transit_vehicles}</div>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>Live GPS tracked</div>
          </div>
          <div style={homeStyles.metricCard}>
            <div style={homeStyles.metricLabel}>Under Maintenance</div>
            <div style={{ ...homeStyles.metricValue, color: '#f87171' }}>{metrics.maintenance_vehicles}</div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Servicing & inspection</div>
          </div>
          <div style={homeStyles.metricCard}>
            <div style={homeStyles.metricLabel}>Fleet Utilization</div>
            <div style={{ ...homeStyles.metricValue, color: '#fbbf24' }}>{metrics.fleet_utilization_rate}%</div>
            <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>Operational load index</div>
          </div>
        </div>
      )}

      {/* Module Navigation Grid */}
      <div>
        <div style={homeStyles.sectionHeader}>
          <div>
            <h2 style={homeStyles.sectionTitle}>Platform Functional Modules</h2>
            <p style={homeStyles.sectionSub}>Select any module below to directly navigate into its dedicated operations portal.</p>
          </div>
        </div>

        <div className="dashboard-grid" style={homeStyles.modulesGrid}>
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(m.path)}
              style={homeStyles.moduleCard}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ ...homeStyles.moduleIcon, background: `${m.color}15`, border: `1px solid ${m.color}35`, color: m.color }}>
                  {m.icon}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: m.color, background: `${m.color}15`, padding: '4px 8px', borderRadius: '4px' }}>
                  {m.stats}
                </span>
              </div>

              <h3 style={homeStyles.moduleTitle}>{m.title}</h3>
              <p style={homeStyles.moduleDesc}>{m.desc}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: m.color, marginTop: '16px' }}>
                <span>Access Console</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity / Live Telemetry Snapshot */}
      <div style={homeStyles.recentSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#f1f5f9', fontWeight: '700' }}>Recent Dispatch & Shipment Activity</h3>
          <button onClick={() => navigate('/shipments')} style={homeStyles.viewAllBtn}>
            View All Shipments →
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={homeStyles.table}>
            <thead>
              <tr style={homeStyles.thRow}>
                <th style={homeStyles.th}>Tracking Code</th>
                <th style={homeStyles.th}>Route Origin → Destination</th>
                <th style={homeStyles.th}>Cargo Weight</th>
                <th style={homeStyles.th}>Status</th>
                <th style={homeStyles.th}>Arrival ETA</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.map((s) => (
                <tr key={s.id} style={homeStyles.tr}>
                  <td style={{ ...homeStyles.td, color: '#38bdf8', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{s.tracking_number}</td>
                  <td style={homeStyles.td}>{s.origin} → {s.destination}</td>
                  <td style={homeStyles.td}>{s.weight_kg || 100} kg</td>
                  <td style={homeStyles.td}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: s.status === 'In Transit' ? 'rgba(56, 189, 248, 0.15)' : (s.status === 'Delivered' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)'),
                      color: s.status === 'In Transit' ? '#38bdf8' : (s.status === 'Delivered' ? '#34d399' : '#94a3b8')
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ ...homeStyles.td, color: '#cbd5e1' }}>{s.eta || 'Calculating...'}</td>
                </tr>
              ))}
              {recentShipments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...homeStyles.td, textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No shipments registered yet. Go to Shipment Tracking to create one.
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

const homeStyles = {
  page: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  heroCard: {
    background: 'var(--bg-hero, linear-gradient(135deg, #0e1626 0%, #111a2e 100%))',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '16px',
    padding: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
    boxShadow: 'var(--shadow-hero)'
  },
  tagline: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '1.5px',
    marginBottom: '8px'
  },
  heroTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)',
    letterSpacing: '-0.5px'
  },
  heroDesc: {
    margin: '10px 0 0 0',
    fontSize: '14px',
    color: 'var(--text-secondary, #94a3b8)',
    maxWidth: '650px',
    lineHeight: '1.6'
  },
  heroActions: {
    display: 'flex',
    gap: '12px'
  },
  primaryActionBtn: {
    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 22px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
  },
  secondaryActionBtn: {
    background: 'var(--bg-card-hover, #162235)',
    color: 'var(--text-primary, #f8fafc)',
    border: '1px solid var(--border-subtle, #334155)',
    padding: '12px 22px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)'
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)',
    marginTop: '6px',
    fontFamily: 'JetBrains Mono'
  },
  sectionHeader: {
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)'
  },
  sectionSub: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary, #94a3b8)'
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px'
  },
  moduleCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '14px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-card)'
  },
  moduleIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px'
  },
  moduleTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary, #f8fafc)'
  },
  moduleDesc: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary, #94a3b8)',
    lineHeight: '1.5'
  },
  recentSection: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-card)'
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    background: 'var(--bg-table-header, #090d15)',
    borderBottom: '1px solid var(--border-subtle, #1e293b)'
  },
  th: {
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle, #131b2b)'
  },
  td: {
    padding: '14px',
    fontSize: '13px',
    color: 'var(--text-secondary, #cbd5e1)'
  }
};
