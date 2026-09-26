import React, { useState, useEffect } from 'react';
import {
  fetchOperationalOverview,
  fetchFleetUtilization,
  fetchFleetPerformance,
  fetchFuelAnalytics,
  exportOperationalReport,
  triggerDailyReport
} from '../api';

export default function AnalyticsPage({ user }) {
  const [exporting, setExporting] = useState(false);
  const [runningCelery, setRunningCelery] = useState(false);
  const [overview, setOverview] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [fuel, setFuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [ovRes, utRes, pfRes, flRes] = await Promise.all([
        fetchOperationalOverview(),
        fetchFleetUtilization(),
        fetchFleetPerformance(),
        fetchFuelAnalytics()
      ]);
      setOverview(ovRes.data);
      setUtilization(utRes.data);
      setPerformance(pfRes.data);
      setFuel(flRes.data);
    } catch (err) {
      console.error('Error fetching operational analytics:', err);
      showToast('Could not load live analytics from server.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const res = await exportOperationalReport(format.toLowerCase());

      if (format.toLowerCase() === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `FleetFlow_Operations_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('CSV Operations Report downloaded successfully.');
      } else {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.data, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `FleetFlow_Operations_Report_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('JSON Operations Report downloaded successfully.');
      }
    } catch (err) {
      console.error('Export failed', err);
      showToast('Failed to export operational report.', true);
    } finally {
      setExporting(false);
    }
  };

  const handleTriggerCeleryReport = async () => {
    try {
      setRunningCelery(true);
      await triggerDailyReport();
      showToast('Dispatched end-of-day operational report job to Celery worker.');
      setTimeout(() => {
        loadAnalytics();
        setRunningCelery(false);
      }, 1000);
    } catch (err) {
      setRunningCelery(false);
      showToast('Failed to dispatch Celery reporting job.', true);
    }
  };

  return (
    <div style={analyticsStyles.page}>
      {toastMessage && (
        <div style={{
          ...analyticsStyles.toast,
          background: toastMessage.isError ? '#ef4444' : '#10b981'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div style={analyticsStyles.headerRow}>
        <div>
          <div style={analyticsStyles.subtitle}>OPERATIONAL ANALYTICS & MONITORING</div>
          <h1 style={analyticsStyles.title}>Logistics Operations Analytics & Reporting</h1>
          <p style={analyticsStyles.desc}>
            Fleet utilization indices, dynamic fuel burn monitoring, on-time delivery efficiency, and executive reporting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleTriggerCeleryReport} disabled={runningCelery} style={analyticsStyles.celeryBtn}>
            {runningCelery ? '⏳ Dispathing...' : '⚡ Trigger Celery Report'}
          </button>
          <button onClick={() => handleExport('CSV')} disabled={exporting} style={analyticsStyles.exportExcelBtn}>
            📊 {exporting ? 'Exporting...' : 'Export Operations CSV'}
          </button>
          <button onClick={() => handleExport('JSON')} disabled={exporting} style={analyticsStyles.exportPdfBtn}>
            📄 {exporting ? 'Exporting...' : 'Export JSON Data'}
          </button>
        </div>
      </div>

      {/* Top Operational KPI Cards */}
      <div style={analyticsStyles.kpiGrid}>
        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>On-Time Delivery Rate</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#34d399' }}>
            {overview ? `${overview.on_time_delivery_rate}%` : '96.8%'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview ? `${overview.total_shipments_delivered} consignments delivered` : 'Consistent SLA'}
          </div>
        </div>

        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Avg Fleet Fuel Efficiency</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#38bdf8' }}>
            {fuel ? fuel.average_efficiency_km_per_l : '3.85'} <span style={{ fontSize: '14px', color: '#64748b' }}>km/L</span>
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
            {fuel ? `${fuel.average_consumption_l_per_100km} L/100km avg` : 'Eco-Routing enabled'}
          </div>
        </div>

        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Active Fleet Utilization</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#fbbf24' }}>
            {overview ? `${overview.fleet_utilization_rate}%` : '78.5%'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {overview ? `${overview.active_fleet_count} in transit / ${overview.total_fleet_size} total` : 'Active operations'}
          </div>
        </div>

        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Total Operations Distance</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#c084fc' }}>
            {overview ? `${overview.total_distance_km.toLocaleString()}` : '30,405'} <span style={{ fontSize: '14px', color: '#64748b' }}>km</span>
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Live GPS logged distance</div>
        </div>
      </div>

      {/* Fuel Monitoring & Anomaly Detection Panel */}
      <div style={analyticsStyles.fuelSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
              ⛽ Dynamic Fuel Consumption & Anomaly Detection
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Real-time fuel intake analytics, eco-routing cost savings, and machine-learning burn rate variance detection.
            </p>
          </div>
          {fuel && fuel.anomalies_detected > 0 && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              ⚠️ {fuel.anomalies_detected} Consumption Anomalies Flagged
            </span>
          )}
        </div>

        <div style={analyticsStyles.fuelKpiRow}>
          <div style={analyticsStyles.fuelSubCard}>
            <div style={analyticsStyles.fuelSubLabel}>Total Fuel Consumed</div>
            <div style={{ ...analyticsStyles.fuelSubVal, color: '#38bdf8' }}>
              {fuel ? `${fuel.total_liters.toLocaleString()} L` : '3,850 L'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Total Spend: ${fuel ? fuel.total_fuel_cost.toLocaleString() : '6,545'}
            </div>
          </div>

          <div style={analyticsStyles.fuelSubCard}>
            <div style={analyticsStyles.fuelSubLabel}>Fuel Cost per Kilometer</div>
            <div style={{ ...analyticsStyles.fuelSubVal, color: '#fbbf24' }}>
              ${fuel ? fuel.fuel_cost_per_km.toFixed(2) : '0.38'} <span style={{ fontSize: '13px', color: '#64748b' }}>/ km</span>
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Below industry baseline ($0.45/km)</div>
          </div>

          <div style={analyticsStyles.fuelSubCard}>
            <div style={analyticsStyles.fuelSubLabel}>Eco-Route Fuel Saved</div>
            <div style={{ ...analyticsStyles.fuelSubVal, color: '#34d399' }}>
              {fuel ? `${fuel.eco_route_savings_liters.toLocaleString()} L` : '2,480 L'}
            </div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
              ~${fuel ? fuel.eco_route_savings_usd.toLocaleString() : '4,216'} algorithmic savings
            </div>
          </div>
        </div>

        {/* Anomalies List */}
        {fuel && fuel.anomalies && fuel.anomalies.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#f87171', textTransform: 'uppercase', fontWeight: '800' }}>
              🚨 Flagged Fuel Anomalies (Potential Leaks, Sensor Errors, or Fuel Theft)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fuel.anomalies.map((anom, idx) => (
                <div key={idx} style={analyticsStyles.anomalyItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>🛑</span>
                    <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '13px' }}>🚛 {anom.vehicle_id}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{anom.anomaly_reason}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                    <span style={{ color: '#fbbf24' }}>{anom.liters_filled}L</span>
                    <span style={{ color: '#34d399' }}>${anom.total_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Breakdown Visuals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Utilization Breakdown */}
        <div style={analyticsStyles.card}>
          <h3 style={analyticsStyles.cardTitle}>Fleet Utilization Distribution</h3>
          <p style={analyticsStyles.cardSub}>Operational allocation across vehicle asset categories</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {utilization && utilization.by_vehicle_type && utilization.by_vehicle_type.length > 0 ? (
              utilization.by_vehicle_type.map((item, idx) => {
                const colors = ['#38bdf8', '#34d399', '#818cf8', '#fbbf24', '#f87171'];
                const col = colors[idx % colors.length];
                return (
                  <div key={item.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>{item.type} ({item.active_units}/{item.total_units})</span>
                      <span style={{ color: col, fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{item.utilization_pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.utilization_pct}%`, height: '100%', background: col, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })
            ) : (
              [
                { label: 'Heavy Duty Trucks', pct: 75, color: '#38bdf8' },
                { label: 'Delivery Vans (Urban)', pct: 90, color: '#34d399' },
                { label: 'Container Trailers', pct: 60, color: '#818cf8' }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{item.pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Drivers & High-Maintenance Fleets */}
        <div style={analyticsStyles.card}>
          <h3 style={analyticsStyles.cardTitle}>Fleet Performance & Reliability Leaders</h3>
          <p style={analyticsStyles.cardSub}>Top commercial drivers & highest maintenance cost vehicles</p>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
              ⭐ Top Performing Drivers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {performance && performance.top_performing_drivers && performance.top_performing_drivers.length > 0 ? (
                performance.top_performing_drivers.slice(0, 3).map(d => (
                  <div key={d.driver_code} style={{ display: 'flex', justifyContent: 'space-between', background: '#070a0f', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div>
                      <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>{d.name}</span>
                      <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '8px' }}>({d.driver_code})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: '#38bdf8', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>{d.trips} trips</span>
                      <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>★ {d.rating}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '12px' }}>No driver performance records available.</div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
              🔧 High Maintenance Spend Assets
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {performance && performance.highest_maintenance_vehicles && performance.highest_maintenance_vehicles.length > 0 ? (
                performance.highest_maintenance_vehicles.slice(0, 3).map(v => (
                  <div key={v.vehicle_id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-card-sub, #070a0f)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #1e293b)' }}>
                    <div>
                      <span style={{ color: 'var(--text-primary, #f8fafc)', fontWeight: '700', fontSize: '13px' }}>🚛 {v.vehicle_id}</span>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '11px', marginLeft: '8px' }}>{v.vehicle_type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{v.maintenance_jobs_count} jobs</span>
                      <span style={{ color: '#f87171', fontWeight: '700', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>${v.total_cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '12px' }}>No high maintenance fleets recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const analyticsStyles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  subtitle: { fontSize: '11px', fontWeight: '800', color: '#c084fc', letterSpacing: '1px', marginBottom: '4px' },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)' },
  desc: { margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' },
  exportPdfBtn: { background: 'var(--bg-card-hover, #162030)', color: '#38bdf8', border: '1px solid var(--border-subtle, rgba(56, 189, 248, 0.4))', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  exportExcelBtn: { background: 'var(--bg-card-hover, #162030)', color: '#34d399', border: '1px solid var(--border-subtle, rgba(52, 211, 153, 0.4))', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  celeryBtn: { background: 'var(--bg-card-hover, #1e293b)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  kpiCard: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-card)' },
  kpiLabel: { fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', marginTop: '4px', fontFamily: 'JetBrains Mono' },
  fuelSection: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' },
  fuelKpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  fuelSubCard: { background: 'var(--bg-card-sub, #070a0f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '16px', borderRadius: '10px' },
  fuelSubLabel: { fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '700', textTransform: 'uppercase' },
  fuelSubVal: { fontSize: '22px', fontWeight: '800', marginTop: '4px', fontFamily: 'JetBrains Mono' },
  anomalyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px 16px', borderRadius: '8px' },
  card: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-card)' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' },
  cardSub: { margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' },
  toast: { position: 'fixed', top: '24px', right: '24px', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }
};
