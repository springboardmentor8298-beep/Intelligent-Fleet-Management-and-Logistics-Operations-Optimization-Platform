import React, { useState } from 'react';

export default function MaintenancePage() {
  const [records, setRecords] = useState([
    { id: 'MNT-401', vehicle: 'FL-002', category: 'Oil Change', status: 'In Progress', cost: '$240.00', date: '2026-09-12', center: 'FleetCare North Hub', notes: 'Synthetic oil replacement & filter swap.' },
    { id: 'MNT-402', vehicle: 'FL-004', category: 'Brake Service', status: 'Scheduled', cost: '$680.00', date: '2026-09-15', center: 'Brembo Commercial Services', notes: 'Rotor inspection & pad replacement.' },
    { id: 'MNT-403', vehicle: 'FL-001', category: 'General Inspection', status: 'Completed', cost: '$150.00', date: '2026-09-08', center: 'State DOT Inspection Depot', notes: 'Passed DOT compliance testing.' },
    { id: 'MNT-404', vehicle: 'FL-003', category: 'Tire Replacement', status: 'Scheduled', cost: '$1,200.00', date: '2026-09-18', center: 'Michelin Fleet Center', notes: '4 drive axle tires replacement.' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ vehicle: 'FL-001', category: 'General Inspection', cost: '180', notes: '', center: 'Main Fleet Depot' });

  const handleAddRecord = (e) => {
    e.preventDefault();
    const id = `MNT-${Math.floor(405 + Math.random() * 90)}`;
    setRecords([{ ...newRecord, id, status: 'Scheduled', cost: `$${newRecord.cost}.00`, date: new Date().toISOString().split('T')[0] }, ...records]);
    setShowModal(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress': return { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' };
      case 'Scheduled': return { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' };
      case 'Completed': return { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8' };
    }
  };

  return (
    <div style={maintStyles.page}>
      <div style={maintStyles.headerRow}>
        <div>
          <div style={maintStyles.subtitle}>VEHICLE MAINTENANCE & HEALTH</div>
          <h1 style={maintStyles.title}>Preventive Maintenance & Servicing Records</h1>
          <p style={maintStyles.desc}>
            Oil changes, tire replacements, brake checks, engine health diagnostics, and DOT inspection schedules.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={maintStyles.addBtn}>
          + Schedule Service Job
        </button>
      </div>

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
                <th style={maintStyles.th}>Estimated Cost</th>
                <th style={maintStyles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const badge = getStatusStyle(r.status);
                return (
                  <tr key={r.id} style={maintStyles.tr}>
                    <td style={{ ...maintStyles.td, fontWeight: '700', color: '#f87171', fontFamily: 'JetBrains Mono' }}>
                      {r.id}
                    </td>
                    <td style={{ ...maintStyles.td, fontWeight: '700', color: '#f8fafc' }}>
                      🚛 {r.vehicle}
                    </td>
                    <td style={maintStyles.td}>{r.category}</td>
                    <td style={{ ...maintStyles.td, color: '#94a3b8' }}>{r.center}</td>
                    <td style={{ ...maintStyles.td, fontFamily: 'JetBrains Mono' }}>{r.date}</td>
                    <td style={{ ...maintStyles.td, color: '#34d399', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{r.cost}</td>
                    <td style={maintStyles.td}>
                      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: badge.bg, color: badge.text }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
                <label style={maintStyles.label}>Vehicle</label>
                <select value={newRecord.vehicle} onChange={e => setNewRecord({ ...newRecord, vehicle: e.target.value })} style={maintStyles.input}>
                  <option value="FL-001">FL-001 (Heavy Truck)</option>
                  <option value="FL-002">FL-002 (Van)</option>
                  <option value="FL-003">FL-003 (Trailer)</option>
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
                </select>
              </div>
              <div>
                <label style={maintStyles.label}>Estimated Cost ($)</label>
                <input required type="number" value={newRecord.cost} onChange={e => setNewRecord({ ...newRecord, cost: e.target.value })} style={maintStyles.input} />
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
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#f8fafc' },
  desc: { margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' },
  addBtn: { background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' },
  catCard: { background: '#0d131f', border: '1px solid #1e293b', padding: '18px', borderRadius: '12px', textAlign: 'center' },
  tableCard: { background: '#0d131f', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { background: '#090d15', borderBottom: '1px solid #1e293b' },
  th: { padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #131b2b' },
  td: { padding: '16px', fontSize: '13px', color: '#cbd5e1' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 7, 10, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#0d131f', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '440px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', background: '#070a0f', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }
};
