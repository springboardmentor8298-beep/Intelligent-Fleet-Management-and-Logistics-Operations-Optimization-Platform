import React, { useState, useEffect } from 'react';
import { fetchShipmentDetail, updateShipmentStatus, fetchShipmentGpsLogs } from '../api';

export default function ShipmentHistoryModal({ shipmentId, isOpen, onClose, onStatusUpdated }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'gps'
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState([]);

  useEffect(() => {
    if (isOpen && shipmentId) {
      loadDetail();
    }
  }, [isOpen, shipmentId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchShipmentDetail(shipmentId);
      setDetail(res.data);
      setNewStatus(res.data.status);
      if (res.data?.tracking_number) {
        try {
          const gpsRes = await fetchShipmentGpsLogs(res.data.tracking_number, 100);
          setGpsBreadcrumbs(gpsRes.data || []);
        } catch (e) {
          setGpsBreadcrumbs([]);
        }
      }
    } catch (err) {
      console.error("Failed to load shipment history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === detail.status) return;

    setUpdating(true);
    try {
      await updateShipmentStatus(shipmentId, {
        status: newStatus,
        note: note || `Status updated to ${newStatus}`
      });
      setNote('');
      await loadDetail();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={darkHistoryStyles.overlay}>
      <div style={darkHistoryStyles.container}>
        <div style={darkHistoryStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary, #f8fafc)', fontWeight: '700' }}>Consignment Audit Logs & Timeline</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              Tracking Code: <b style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{detail?.tracking_number}</b>
            </p>
          </div>
          <button onClick={onClose} style={darkHistoryStyles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted, #64748b)' }}>Retrieving timeline data...</div>
        ) : detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Quick Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-card-sub, #070a0f)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle, #1e293b)' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Transit Route</span>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary, #f8fafc)', marginTop: '2px' }}>{detail.origin} → {detail.destination}</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Weight</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>{detail.weight_kg} kg</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ fontSize: '12px', fontWeight: '800', color: detail.status === 'Delayed' ? '#f87171' : (detail.status === 'Delivered' ? '#34d399' : '#38bdf8'), marginTop: '2px' }}>
                  {detail.status}
                </div>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-card-sub, #070a0f)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle, #1e293b)' }}>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle, #1e293b)', background: 'var(--bg-card, #0d131f)', color: 'var(--text-primary, #f8fafc)', fontSize: '12px', outline: 'none' }}
              >
                <option value="Created">Created</option>
                <option value="Assigned">Assigned</option>
                <option value="In Transit">In Transit</option>
                <option value="Delayed">Delayed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <input
                type="text"
                placeholder="Log note (e.g., Highway toll passed, Handed to receiver)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle, #1e293b)', background: 'var(--bg-card, #0d131f)', color: 'var(--text-primary, #f8fafc)', fontSize: '12px', outline: 'none' }}
              />

              <button
                type="submit"
                disabled={updating || newStatus === detail.status}
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                {updating ? 'Updating...' : 'Log Event'}
              </button>
            </form>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle, #1e293b)', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'events' ? 'var(--bg-card-hover, #1e293b)' : 'transparent',
                  color: activeTab === 'events' ? '#38bdf8' : 'var(--text-muted, #64748b)'
                }}
              >
                📜 Event Sequence ({detail.events?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gps')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeTab === 'gps' ? 'var(--bg-card-hover, #1e293b)' : 'transparent',
                  color: activeTab === 'gps' ? '#38bdf8' : 'var(--text-muted, #64748b)'
                }}
              >
                🛰️ GPS Breadcrumb Logs ({gpsBreadcrumbs.length})
              </button>
            </div>

            {/* Event Timeline View */}
            {activeTab === 'events' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto' }}>
                  {detail.events && detail.events.length > 0 ? (
                    detail.events.map((evt, idx) => (
                      <div key={evt.id || idx} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', marginTop: '4px', flexShrink: 0, boxShadow: '0 0 8px #38bdf8' }} />
                        <div style={{ flex: 1, paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle, #1e293b)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>{evt.status}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontFamily: 'JetBrains Mono' }}>
                              {new Date(evt.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {evt.location_desc && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>📍 {evt.location_desc}</div>
                          )}
                          {evt.note && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px', fontStyle: 'italic' }}>💬 {evt.note}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', textAlign: 'center', margin: '20px 0' }}>No milestone events logged yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* GPS Breadcrumb Logs View */}
            {activeTab === 'gps' && (
              <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle, #1e293b)', background: 'var(--bg-card-sub, #070a0f)' }}>
                {gpsBreadcrumbs.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card-hover, #162030)', borderBottom: '1px solid var(--border-subtle, #1e293b)', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '10px' }}>Time</th>
                        <th style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '10px' }}>Coordinates</th>
                        <th style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '10px' }}>Velocity</th>
                        <th style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '10px' }}>Heading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gpsBreadcrumbs.map((b, i) => (
                        <tr key={b.id || i} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                          <td style={{ padding: '6px 10px', color: '#94a3b8' }}>
                            {b.recorded_at ? new Date(b.recorded_at).toLocaleTimeString() : '--'}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#38bdf8' }}>
                            {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#34d399' }}>
                            {b.speed_kmh} km/h
                          </td>
                          <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>
                            {b.heading_deg}°
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', textAlign: 'center', margin: '30px 0' }}>
                    No recorded GPS breadcrumb pings found for this unit.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const darkHistoryStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay, rgba(5, 7, 10, 0.75))', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  container: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', boxShadow: 'var(--shadow-card)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle, #1e293b)', paddingBottom: '14px', marginBottom: '16px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' }
};
