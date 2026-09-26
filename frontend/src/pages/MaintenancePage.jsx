import React, { useState, useEffect } from 'react';
import {
  fetchMaintenanceJobs,
  createMaintenanceJob,
  updateMaintenanceJob,
  fetchMaintenanceAlerts,
  resolveMaintenanceAlert,
  fetchMaintenanceReportSummary,
  fetchVehicles,
  triggerMaintenanceAlertsCheck
} from '../api';

export default function MaintenancePage({ user }) {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [newRecord, setNewRecord] = useState({
    vehicle_id: '',
    category: 'General Inspection',
    service_center: 'Central Fleet Depot',
    priority: 'Medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    estimated_cost: '250',
    notes: ''
  });

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'ALL' ? { status_filter: statusFilter } : {};
      const [jobsRes, alertsRes, summaryRes, vehiclesRes] = await Promise.all([
        fetchMaintenanceJobs(params),
        fetchMaintenanceAlerts(),
        fetchMaintenanceReportSummary(),
        fetchVehicles()
      ]);

      setRecords(jobsRes.data || []);
      setAlerts(alertsRes.data || []);
      setSummary(summaryRes.data || null);
      
      const vList = vehiclesRes.data || [];
      setVehicles(vList);
      if (vList.length > 0 && !newRecord.vehicle_id) {
        setNewRecord(prev => ({ ...prev, vehicle_id: vList[0].vehicle_id }));
      }
    } catch (err) {
      console.error('Failed to load maintenance data', err);
      showToast('Could not load live maintenance records from server.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicle_id: newRecord.vehicle_id,
        category: newRecord.category,
        service_center: newRecord.service_center,
        priority: newRecord.priority,
        scheduled_date: newRecord.scheduled_date ? new Date(newRecord.scheduled_date).toISOString() : new Date().toISOString(),
        estimated_cost: parseFloat(newRecord.estimated_cost) || 0.0,
        notes: newRecord.notes
      };

      await createMaintenanceJob(payload);
      showToast(`Service job scheduled successfully for vehicle ${payload.vehicle_id}`);
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to schedule maintenance job.', true);
    }
  };

  const handleStatusTransition = async (jobId, newStatus) => {
    try {
      await updateMaintenanceJob(jobId, { status: newStatus });
      showToast(`Job ${jobId} status transitioned to: ${newStatus}`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update job status', true);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveMaintenanceAlert(alertId);
      showToast(`Alert #${alertId} marked as resolved.`);
      loadData();
    } catch (err) {
      showToast('Failed to resolve alert.', true);
    }
  };

  const handleTriggerAudit = async () => {
    try {
      setIsScanning(true);
      await triggerMaintenanceAlertsCheck();
      showToast('Triggered Celery maintenance check & audit.');
      setTimeout(() => {
        loadData();
        setIsScanning(false);
      }, 1200);
    } catch (err) {
      setIsScanning(false);
      showToast('Failed to trigger maintenance audit.', true);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress': return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: '#ef4444' };
      case 'Scheduled': return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: '#f59e0b' };
      case 'Completed': return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#10b981' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#64748b' };
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' };
      case 'High': return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c', border: '#f97316' };
      default: return { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: '#0284c7' };
    }
  };

  return (
    <div style={maintStyles.page}>
      {toastMessage && (
        <div style={{
          ...maintStyles.toast,
          backgroundColor: toastMessage.isError ? '#ef4444' : '#10b981'
        }}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div style={maintStyles.headerRow}>
        <div>
          <div style={maintStyles.subtitle}>FLEET HEALTH & SERVICING</div>
          <h1 style={maintStyles.title}>Preventive Maintenance & Servicing Records</h1>
          <p style={maintStyles.desc}>
            Maintenance scheduling, critical mechanical alerts, vehicle status synchronization, and Celery background audits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleTriggerAudit} disabled={isScanning} style={maintStyles.auditBtn}>
            {isScanning ? '⏳ Auditing...' : '⚙️ Run Celery Audit'}
          </button>
          <button onClick={() => setShowModal(true)} style={maintStyles.addBtn}>
            + Schedule Service Job
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      {summary && (
        <div style={maintStyles.kpiGrid}>
          <div style={maintStyles.kpiCard}>
            <div style={maintStyles.kpiLabel}>Total Maintenance Jobs</div>
            <div style={{ ...maintStyles.kpiVal, color: '#f8fafc' }}>{summary.total_jobs}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>All-time registered jobs</div>
          </div>
          <div style={maintStyles.kpiCard}>
            <div style={maintStyles.kpiLabel}>In Progress Servicing</div>
            <div style={{ ...maintStyles.kpiVal, color: '#f87171' }}>{summary.in_progress_jobs}</div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>Vehicles under maintenance</div>
          </div>
          <div style={maintStyles.kpiCard}>
            <div style={maintStyles.kpiLabel}>Scheduled Up Next</div>
            <div style={{ ...maintStyles.kpiVal, color: '#fbbf24' }}>{summary.scheduled_jobs}</div>
            <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>Awaiting depot admission</div>
          </div>
          <div style={maintStyles.kpiCard}>
            <div style={maintStyles.kpiLabel}>Total Maintenance Spend</div>
            <div style={{ ...maintStyles.kpiVal, color: '#34d399' }}>${summary.total_maintenance_cost.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Actual & estimated combined</div>
          </div>
        </div>
      )}

      {/* Active Alerts Banner */}
      {alerts.length > 0 && (
        <div style={maintStyles.alertsContainer}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontWeight: '800' }}>
              Active Maintenance Alerts ({alerts.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Immediate mechanical intervention required</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map(alt => {
              const badge = getSeverityStyle(alt.severity);
              return (
                <div key={alt.id} style={{ ...maintStyles.alertItem, borderColor: badge.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: badge.bg,
                      color: badge.text
                    }}>
                      {alt.severity.toUpperCase()}
                    </span>
                    <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>🚛 {alt.vehicle_id}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{alt.message}</span>
                  </div>
                  <button onClick={() => handleResolveAlert(alt.id)} style={maintStyles.resolveBtn}>
                    ✓ Resolve Alert
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Overview */}
      <div style={maintStyles.categoryGrid}>
        {[
          { name: 'Oil Change', icon: '🛢️', desc: '5,000 km intervals' },
          { name: 'Tire Replacement', icon: '🛞', desc: 'Tread depth safety' },
          { name: 'Engine Service', icon: '⚙️', desc: 'ECU & diagnostics' },
          { name: 'Brake Service', icon: '🛑', desc: 'Pads, rotors & fluid' },
          { name: 'General Inspection', icon: '📋', desc: 'DOT regulatory audit' }
        ].map(cat => (
          <div key={cat.name} style={maintStyles.catCard}>
            <div style={{ fontSize: '24px' }}>{cat.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginTop: '6px' }}>{cat.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      {/* Table Filters */}
      <div style={maintStyles.filterBar}>
        {['ALL', 'Scheduled', 'In Progress', 'Completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              ...maintStyles.tabBtn,
              ...(statusFilter === tab ? maintStyles.activeTab : {})
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Maintenance Table */}
      <div style={maintStyles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={maintStyles.table}>
            <thead>
              <tr style={maintStyles.thRow}>
                <th style={maintStyles.th}>Job ID</th>
                <th style={maintStyles.th}>Vehicle Asset</th>
                <th style={maintStyles.th}>Category</th>
                <th style={maintStyles.th}>Service Center</th>
                <th style={maintStyles.th}>Scheduled Date</th>
                <th style={maintStyles.th}>Cost</th>
                <th style={maintStyles.th}>Priority</th>
                <th style={maintStyles.th}>Status</th>
                <th style={maintStyles.th}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    Loading maintenance records from server...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No maintenance records found for filter: {statusFilter}
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const badge = getStatusStyle(r.status);
                  const isScheduled = r.status === 'Scheduled';
                  const isInProgress = r.status === 'In Progress';

                  return (
                    <tr key={r.id} style={maintStyles.tr}>
                      <td style={{ ...maintStyles.td, fontWeight: '700', color: '#f87171', fontFamily: 'JetBrains Mono' }}>
                        {r.job_id}
                      </td>
                      <td style={{ ...maintStyles.td, fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
                        🚛 {r.vehicle_id}
                      </td>
                      <td style={maintStyles.td}>{r.category}</td>
                      <td style={{ ...maintStyles.td, color: '#94a3b8' }}>{r.service_center}</td>
                      <td style={{ ...maintStyles.td, fontFamily: 'JetBrains Mono' }}>
                        {r.scheduled_date ? r.scheduled_date.split('T')[0] : 'N/A'}
                      </td>
                      <td style={{ ...maintStyles.td, color: '#34d399', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>
                        ${r.actual_cost != null ? r.actual_cost.toFixed(2) : r.estimated_cost.toFixed(2)}
                      </td>
                      <td style={maintStyles.td}>
                        <span style={{ fontSize: '11px', color: r.priority === 'Critical' || r.priority === 'High' ? '#f87171' : '#cbd5e1' }}>
                          {r.priority}
                        </span>
                      </td>
                      <td style={maintStyles.td}>
                        <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: badge.bg, color: badge.text }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={maintStyles.td}>
                        {isScheduled && (
                          <button
                            onClick={() => handleStatusTransition(r.job_id, 'In Progress')}
                            style={maintStyles.actionBtnStart}
                          >
                            ▶ Start Job
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            onClick={() => handleStatusTransition(r.job_id, 'Completed')}
                            style={maintStyles.actionBtnComplete}
                          >
                            ✓ Complete Job
                          </button>
                        )}
                        {r.status === 'Completed' && (
                          <span style={{ fontSize: '12px', color: '#34d399' }}>✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div style={maintStyles.overlay}>
          <div style={maintStyles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px' }}>Schedule Maintenance Job</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={maintStyles.label}>Fleet Asset (Vehicle)</label>
                <select
                  required
                  value={newRecord.vehicle_id}
                  onChange={e => setNewRecord({ ...newRecord, vehicle_id: e.target.value })}
                  style={maintStyles.input}
                >
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_id} - {v.vehicle_type} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={maintStyles.label}>Maintenance Category</label>
                <select value={newRecord.category} onChange={e => setNewRecord({ ...newRecord, category: e.target.value })} style={maintStyles.input}>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Tire Replacement">Tire Replacement</option>
                  <option value="Engine Service">Engine Service</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="General Inspection">General Inspection</option>
                  <option value="Transmission Service">Transmission Service</option>
                </select>
              </div>
              <div>
                <label style={maintStyles.label}>Priority Level</label>
                <select value={newRecord.priority} onChange={e => setNewRecord({ ...newRecord, priority: e.target.value })} style={maintStyles.input}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={maintStyles.label}>Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={newRecord.scheduled_date}
                  onChange={e => setNewRecord({ ...newRecord, scheduled_date: e.target.value })}
                  style={maintStyles.input}
                />
              </div>
              <div>
                <label style={maintStyles.label}>Service Depot / Facility</label>
                <input
                  type="text"
                  required
                  value={newRecord.service_center}
                  onChange={e => setNewRecord({ ...newRecord, service_center: e.target.value })}
                  style={maintStyles.input}
                />
              </div>
              <div>
                <label style={maintStyles.label}>Estimated Cost ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={newRecord.estimated_cost}
                  onChange={e => setNewRecord({ ...newRecord, estimated_cost: e.target.value })}
                  style={maintStyles.input}
                />
              </div>
              <div>
                <label style={maintStyles.label}>Notes & Diagnosis</label>
                <textarea
                  value={newRecord.notes}
                  onChange={e => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Routine service checklist, parts to replace..."
                  style={{ ...maintStyles.input, minHeight: '60px' }}
                />
              </div>
              <button type="submit" style={maintStyles.submitBtn}>Schedule Servicing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const maintStyles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  subtitle: { fontSize: '11px', fontWeight: '800', color: '#f87171', letterSpacing: '1px', marginBottom: '4px' },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)' },
  desc: { margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' },
  addBtn: { background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  auditBtn: { background: 'var(--bg-card-hover, #1e293b)', color: '#38bdf8', border: '1px solid var(--border-subtle, #38bdf8)', padding: '12px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  kpiCard: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '18px', borderRadius: '12px', boxShadow: 'var(--shadow-card)' },
  kpiLabel: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' },
  kpiVal: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', marginTop: '6px', fontFamily: 'JetBrains Mono' },
  alertsContainer: { background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '14px', padding: '18px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid' },
  resolveBtn: { background: 'var(--bg-card-hover, #1e293b)', border: '1px solid #34d399', color: '#34d399', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' },
  catCard: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '18px', borderRadius: '12px', textAlign: 'center', boxShadow: 'var(--shadow-card)' },
  filterBar: { display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle, #1e293b)', paddingBottom: '12px' },
  tabBtn: { background: 'none', border: 'none', color: 'var(--text-muted, #64748b)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  activeTab: { background: 'var(--bg-card-hover, #1e293b)', color: 'var(--text-primary, #f8fafc)' },
  tableCard: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { background: 'var(--bg-table-header, #090d15)', borderBottom: '1px solid var(--border-subtle, #1e293b)' },
  th: { padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid var(--border-subtle, #131b2b)' },
  td: { padding: '16px', fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)' },
  actionBtnStart: { background: 'var(--bg-card-hover, #1e293b)', color: '#fbbf24', border: '1px solid #f59e0b', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  actionBtnComplete: { background: 'var(--bg-card-hover, #1e293b)', color: '#34d399', border: '1px solid #10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay, rgba(5, 7, 10, 0.7))', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '480px', boxShadow: 'var(--shadow-card)' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #1e293b)', background: 'var(--bg-card-sub, #070a0f)', color: 'var(--text-primary, #f8fafc)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' },
  toast: { position: 'fixed', top: '24px', right: '24px', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }
};
