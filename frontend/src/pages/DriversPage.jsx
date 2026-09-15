import React, { useState, useEffect } from 'react';
import { fetchVehicles } from '../api';
import {
  getStoredDrivers,
  assignFleetToDriver,
  updateDriverDutyStatus,
  registerNewDriver
} from '../utils/driverStore';

export default function DriversPage({ user }) {
  // Get current user role from prop or localStorage
  const cachedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  })();
  const currentUserRole = user?.role || cachedUser.role || 'Fleet Manager';
  const isFleetManager = currentUserRole === 'Fleet Manager' || currentUserRole === 'Administrator';

  const [drivers, setDrivers] = useState(getStoredDrivers());
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', license: '', vehicle: 'None' });
  const [assigningDriver, setAssigningDriver] = useState(null); // driver being assigned a fleet
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Sync drivers from store and listen for real-time updates
  useEffect(() => {
    const handleSync = (e) => {
      setDrivers(e.detail || getStoredDrivers());
    };
    window.addEventListener('fleetflow_drivers_updated', handleSync);

    // Fetch registered fleet assets from API
    loadRegistryVehicles();

    return () => {
      window.removeEventListener('fleetflow_drivers_updated', handleSync);
    };
  }, []);

  const loadRegistryVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await fetchVehicles();
      setVehicles(res.data || []);
    } catch (err) {
      console.error('Failed to load registered fleet vehicles', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAddDriver = (e) => {
    e.preventDefault();
    const updated = registerNewDriver(newDriver);
    setDrivers(updated);
    setShowAddModal(false);
    setNewDriver({ name: '', license: '', vehicle: 'None' });
    showToast(`Registered new commercial driver: ${newDriver.name}`);
  };

  const handleOpenAssignModal = (driver) => {
    if (!isFleetManager) {
      showToast(`Access Denied: Only Fleet Managers have permission to assign or modify fleet vehicle allocations. Current role: ${currentUserRole}`, true);
      return;
    }
    setAssigningDriver(driver);
    setSelectedFleetId(driver.vehicle === 'None' ? '' : driver.vehicle);
  };

  const handleConfirmFleetAssignment = (e) => {
    e.preventDefault();
    if (!assigningDriver) return;

    const result = assignFleetToDriver(assigningDriver.id, selectedFleetId || 'None', currentUserRole);
    if (!result.success) {
      showToast(result.error, true);
      return;
    }

    setDrivers(result.drivers);
    const vehicleLabel = selectedFleetId && selectedFleetId !== 'None' ? `Fleet Asset ${selectedFleetId}` : 'Unassigned';
    showToast(`Successfully assigned ${vehicleLabel} to driver ${assigningDriver.name}.`);
    setAssigningDriver(null);
  };

  const handleStatusChange = (driverId, newStatus) => {
    const updated = updateDriverDutyStatus(driverId, newStatus);
    setDrivers(updated);
    const driver = updated.find(d => d.id === driverId);
    showToast(`Updated duty status for ${driver?.name} to: ${newStatus}`);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'On Trip': return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#0284c7' };
      case 'On Duty': return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#059669' };
      case 'Available': return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: '#047857' };
      case 'Off Duty': return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: '#dc2626' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: '#475569' };
    }
  };

  // Helper to find registered vehicle details for a driver
  const findVehicleInfo = (vehicleId) => {
    if (!vehicleId || vehicleId === 'None') return null;
    return vehicles.find(v => v.vehicle_id.toUpperCase() === vehicleId.toUpperCase());
  };

  return (
    <div style={driverStyles.page}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div style={{
          ...driverStyles.toast,
          background: toastMessage.isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          borderColor: toastMessage.isError ? '#dc2626' : '#059669'
        }}>
          <span>{toastMessage.isError ? '⚠️' : '✅'} {toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} style={driverStyles.toastClose}>✕</button>
        </div>
      )}

      {/* Header & RBAC Indicator */}
      <div style={driverStyles.headerRow}>
        <div>
          <div style={driverStyles.subtitle}>DRIVER MANAGEMENT & FLEET ALLOCATION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={driverStyles.title}>Driver Personnel Roster & Performance</h1>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: isFleetManager ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: isFleetManager ? '#38bdf8' : '#fbbf24',
              border: `1px solid ${isFleetManager ? '#38bdf8' : '#fbbf24'}`
            }}>
              Role: {currentUserRole} {isFleetManager ? '👑 (Fleet Allocation Authorized)' : '🔒 (Read-only Allocation)'}
            </span>
          </div>
          <p style={driverStyles.desc}>
            Commercial license verification, synchronized fleet asset assignment, real-time duty status, and automated shipment tracking integration.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={driverStyles.addBtn}>
          + Register Commercial Driver
        </button>
      </div>

      {/* Driver Metric Cards */}
      <div style={driverStyles.metricsGrid}>
        <div style={driverStyles.metricBox}>
          <span style={driverStyles.metricLabel}>Total Personnel</span>
          <div style={driverStyles.metricNum}>{drivers.length}</div>
        </div>
        <div style={driverStyles.metricBox}>
          <span style={driverStyles.metricLabel}>Currently On Duty / Trip</span>
          <div style={{ ...driverStyles.metricNum, color: '#38bdf8' }}>
            {drivers.filter(d => d.status === 'On Trip' || d.status === 'On Duty').length}
          </div>
        </div>
        <div style={driverStyles.metricBox}>
          <span style={driverStyles.metricLabel}>Available for Dispatch</span>
          <div style={{ ...driverStyles.metricNum, color: '#34d399' }}>
            {drivers.filter(d => d.status === 'Available').length}
          </div>
        </div>
        <div style={driverStyles.metricBox}>
          <span style={driverStyles.metricLabel}>Off Duty (Blocked from Dispatch)</span>
          <div style={{ ...driverStyles.metricNum, color: '#f87171' }}>
            {drivers.filter(d => d.status === 'Off Duty').length}
          </div>
        </div>
      </div>

      {/* Drivers Table Card */}
      <div style={driverStyles.tableCard}>
        <div style={driverStyles.tableHeaderBanner}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>
            Active Driver Roster & Linked Fleet Assets ({drivers.length} Drivers)
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {vehicles.length} Fleet Assets Registered in Central Registry
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={driverStyles.table}>
            <thead>
              <tr style={driverStyles.thRow}>
                <th style={driverStyles.th}>Driver ID</th>
                <th style={driverStyles.th}>Driver Name</th>
                <th style={driverStyles.th}>License Class</th>
                <th style={driverStyles.th}>Assigned Fleet Asset</th>
                <th style={driverStyles.th}>Trips</th>
                <th style={driverStyles.th}>Rating</th>
                <th style={driverStyles.th}>Duty Status</th>
                <th style={{ ...driverStyles.th, textAlign: 'center' }}>Fleet Manager Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const badge = getStatusStyle(d.status);
                const vehicleObj = findVehicleInfo(d.vehicle);
                const isAssigned = d.vehicle && d.vehicle !== 'None';

                return (
                  <tr key={d.id} style={driverStyles.tr}>
                    <td style={{ ...driverStyles.td, fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                      {d.id}
                    </td>
                    <td style={{ ...driverStyles.td, fontWeight: '700', color: '#f8fafc' }}>
                      👨‍✈️ {d.name}
                      {d.lastAssignedShipment && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                          Active: {d.lastAssignedShipment}
                        </div>
                      )}
                    </td>
                    <td style={driverStyles.td}>{d.license}</td>
                    
                    {/* Assigned Asset with Registry Validation */}
                    <td style={driverStyles.td}>
                      {isAssigned ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                              🚛 {d.vehicle}
                            </span>
                            {vehicleObj ? (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(52, 211, 153, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(52, 211, 153, 0.3)'
                              }}>
                                ✓ Registered ({vehicleObj.registration_number})
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(248, 113, 113, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(248, 113, 113, 0.3)'
                              }}>
                                ⚠️ Unregistered Asset
                              </span>
                            )}
                          </div>
                          {vehicleObj && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {vehicleObj.vehicle_type} ({vehicleObj.capacity}T Capacity)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
                          Unassigned (No Vehicle)
                        </span>
                      )}
                    </td>

                    <td style={{ ...driverStyles.td, fontFamily: 'JetBrains Mono' }}>{d.trips || 0}</td>
                    
                    <td style={{ ...driverStyles.td, color: '#fbbf24', fontWeight: '700' }}>
                      ★ {d.rating ? d.rating.toFixed(1) : '5.0'}
                    </td>

                    {/* Duty Status Selector */}
                    <td style={driverStyles.td}>
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Available" style={{ background: '#0d131f', color: '#34d399' }}>Available</option>
                        <option value="On Duty" style={{ background: '#0d131f', color: '#38bdf8' }}>On Duty</option>
                        <option value="On Trip" style={{ background: '#0d131f', color: '#38bdf8' }}>On Trip</option>
                        <option value="Off Duty" style={{ background: '#0d131f', color: '#f87171' }}>Off Duty</option>
                      </select>
                      {d.status === 'Off Duty' && (
                        <div style={{ fontSize: '10px', color: '#f87171', marginTop: '3px' }}>
                          ⚠️ Blocks assigned fleet from dispatch
                        </div>
                      )}
                    </td>

                    {/* Fleet Manager Action */}
                    <td style={{ ...driverStyles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenAssignModal(d)}
                        disabled={!isFleetManager}
                        title={isFleetManager ? 'Assign or change registered fleet vehicle' : 'Only Fleet Managers can assign fleet vehicles'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: isFleetManager ? 'rgba(56, 189, 248, 0.12)' : '#1e293b',
                          color: isFleetManager ? '#38bdf8' : '#64748b',
                          border: isFleetManager ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #334155',
                          cursor: isFleetManager ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {isFleetManager ? '⚡ Assign Fleet' : '🔒 Fleet Mgr Only'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Fleet Modal (Role-Guarded for Fleet Manager) */}
      {assigningDriver && (
        <div style={driverStyles.overlay}>
          <div style={driverStyles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px', fontWeight: '800' }}>
                  Assign Fleet Asset
                </h3>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                  Authorization: Fleet Manager Access Confirmed
                </span>
              </div>
              <button
                onClick={() => setAssigningDriver(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              Assign a registered vehicle from the Fleet Registry to driver <strong>{assigningDriver.name}</strong> ({assigningDriver.id}).
            </p>

            <form onSubmit={handleConfirmFleetAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={driverStyles.label}>Select Registered Vehicle Asset</label>
                <select
                  value={selectedFleetId}
                  onChange={(e) => setSelectedFleetId(e.target.value)}
                  style={driverStyles.select}
                  required
                >
                  <option value="">-- Choose Registered Fleet Asset --</option>
                  <option value="None">🚫 None (Unassign Vehicle)</option>
                  {vehicles.map((v) => {
                    // Check if vehicle is already assigned to someone else
                    const assignedToOther = drivers.find(
                      d => d.vehicle && d.vehicle.toUpperCase() === v.vehicle_id.toUpperCase() && d.id !== assigningDriver.id
                    );
                    return (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.vehicle_id} — {v.registration_number} ({v.vehicle_type}, {v.capacity}T, Fuel: {v.fuel_type})
                        {assignedToOther ? ` [Assigned to ${assignedToOther.name}]` : ' [Available in Registry]'}
                      </option>
                    );
                  })}
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  ℹ️ Vehicles are pulled live from the central Fleet Registry. Selecting an asset will assign it exclusively to {assigningDriver.name}.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAssigningDriver(null)}
                  style={driverStyles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={driverStyles.submitBtn}
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Registration Modal */}
      {showAddModal && (
        <div style={driverStyles.overlay}>
          <div style={driverStyles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '17px', fontWeight: '800' }}>Register Commercial Driver</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={driverStyles.label}>Full Name</label>
                <input required value={newDriver.name} onChange={e => setNewDriver({ ...newDriver, name: e.target.value })} style={driverStyles.input} placeholder="e.g. Jordan Hayes" />
              </div>
              <div>
                <label style={driverStyles.label}>Commercial Driver License (CDL)</label>
                <input required value={newDriver.license} onChange={e => setNewDriver({ ...newDriver, license: e.target.value })} style={driverStyles.input} placeholder="e.g. CDL-A Commercial Master" />
              </div>
              <div>
                <label style={driverStyles.label}>Initial Fleet Vehicle Assignment</label>
                <select
                  value={newDriver.vehicle}
                  onChange={e => setNewDriver({ ...newDriver, vehicle: e.target.value })}
                  style={driverStyles.select}
                >
                  <option value="None">None (Assign Later)</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_id} — {v.registration_number} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" style={driverStyles.submitBtn}>Save & Issue Credentials</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const driverStyles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  subtitle: { fontSize: '11px', fontWeight: '800', color: '#fbbf24', letterSpacing: '1px', marginBottom: '4px' },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#f8fafc' },
  desc: { margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' },
  addBtn: { background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#06080d', border: 'none', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
  metricBox: { background: '#0d131f', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px' },
  metricLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  metricNum: { fontSize: '26px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', fontFamily: 'JetBrains Mono' },
  tableCard: { background: '#0d131f', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)' },
  tableHeaderBanner: { padding: '14px 20px', background: '#090d15', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { background: '#090d15', borderBottom: '1px solid #1e293b' },
  th: { padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #131b2b' },
  td: { padding: '16px', fontSize: '13px', color: '#cbd5e1' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 7, 10, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#0d131f', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '480px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', background: '#070a0f', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', background: '#070a0f', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' },
  cancelBtn: { background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  toast: { position: 'fixed', top: '20px', right: '20px', zIndex: 10000, padding: '12px 18px', borderRadius: '10px', color: '#ffffff', fontSize: '13px', fontWeight: '700', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid' },
  toastClose: { background: 'none', border: 'none', color: '#ffffff', fontSize: '16px', cursor: 'pointer' }
};
