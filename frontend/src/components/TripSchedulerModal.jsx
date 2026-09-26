import React, { useState, useEffect } from 'react';
import { fetchVehicles, fetchShipments, scheduleTrip, optimizeRoute } from '../api';
import {
  getDriverForVehicle,
  canAssignShipmentToVehicle,
  onShipmentAssignedToVehicle
} from '../utils/driverStore';

export default function TripSchedulerModal({ isOpen, onClose, onTripScheduled }) {
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [routeType, setRouteType] = useState('Fastest Route');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      setErrorMsg('');
      setPreview(null);
      setSelectedShipmentIds([]);
      setSelectedVehicle('');
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [vRes, sRes] = await Promise.all([fetchVehicles(), fetchShipments()]);
      setVehicles(vRes.data.filter(v => v.status !== 'Maintenance'));
      setShipments(sRes.data.filter(s => s.status === 'Created' || !s.trip_id));
    } catch (err) {
      console.error("Error loading trip scheduler data", err);
    }
  };

  const currentVehicleObj = vehicles.find(v => v.vehicle_id === selectedVehicle);
  const selectedShipmentsList = shipments.filter(s => selectedShipmentIds.includes(s.id));
  const totalWeightKg = selectedShipmentsList.reduce((sum, s) => sum + (s.weight_kg || 100), 0);
  const totalWeightTons = (totalWeightKg / 1000).toFixed(2);
  const vehicleCapacityTons = currentVehicleObj ? currentVehicleObj.capacity : 0;
  const isOverweight = currentVehicleObj && parseFloat(totalWeightTons) > vehicleCapacityTons;

  // Driver validation for the currently selected vehicle
  const driverCheck = selectedVehicle ? canAssignShipmentToVehicle(selectedVehicle) : { allowed: true };
  const isBlockedByDriver = selectedVehicle ? !driverCheck.allowed : false;

  const toggleShipment = (id) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter(x => x !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
    setPreview(null);
  };

  const handlePreviewRoute = async () => {
    if (selectedShipmentIds.length === 0) {
      setErrorMsg("Select at least one shipment to calculate route optimization.");
      return;
    }
    setErrorMsg('');
    setLoadingPreview(true);
    try {
      const first = selectedShipmentsList[0];
      const last = selectedShipmentsList[selectedShipmentsList.length - 1];
      const waypoints = selectedShipmentsList.slice(0, -1).map(s => [s.destination_lat || 9.6615, s.destination_lng || 80.0255]);

      const res = await optimizeRoute({
        origin_lat: first.origin_lat || 13.0827,
        origin_lng: first.origin_lng || 80.2707,
        destination_lat: last.destination_lat || 6.9271,
        destination_lng: last.destination_lng || 79.8612,
        waypoints: waypoints,
        optimization_type: routeType
      });
      setPreview(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to calculate route preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setErrorMsg("Please select a vehicle.");
      return;
    }
    if (selectedShipmentIds.length === 0) {
      setErrorMsg("Please select at least one shipment.");
      return;
    }
    if (isOverweight) {
      setErrorMsg(`Cannot schedule: Total cargo (${totalWeightTons}T) exceeds vehicle capacity (${vehicleCapacityTons}T).`);
      return;
    }

    // Driver duty status validation
    const validation = canAssignShipmentToVehicle(selectedVehicle);
    if (!validation.allowed) {
      setErrorMsg(validation.reason);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const tripRes = await scheduleTrip({
        vehicle_id: selectedVehicle,
        shipment_ids: selectedShipmentIds,
        route_type: routeType
      });

      // Automatically transition the assigned driver's status to "On Duty"
      onShipmentAssignedToVehicle(selectedVehicle, {
        shipment_ids: selectedShipmentIds,
        trip_code: tripRes.data?.trip_code
      });

      onTripScheduled();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to schedule trip.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={darkModalStyles.overlay}>
      <div style={darkModalStyles.container}>
        <div style={darkModalStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary, #f8fafc)', fontWeight: '700' }}>Trip Scheduling & Route Optimizer</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              Assign fleet vehicle, check cargo load against capacity, and select route profile.
            </p>
          </div>
          <button onClick={onClose} style={darkModalStyles.closeBtn}>✕</button>
        </div>

        {errorMsg && (
          <div style={darkModalStyles.alertBox}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Vehicle Selector */}
          <div>
            <label style={darkModalStyles.label}>Select Available Fleet Asset</label>
            <select
              value={selectedVehicle}
              onChange={e => { setSelectedVehicle(e.target.value); setErrorMsg(''); }}
              style={darkModalStyles.select}
              required
            >
              <option value="">-- Choose Vehicle Asset --</option>
              {vehicles.map(v => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} — {v.registration_number} ({v.vehicle_type}, Capacity: {v.capacity}T, Status: {v.status})
                </option>
              ))}
            </select>

            {/* Dynamic Driver Status & Dispatch Eligibility Info */}
            {selectedVehicle && (
              <div style={{ marginTop: '8px' }}>
                {(() => {
                  const assignedDriver = getDriverForVehicle(selectedVehicle);
                  if (!assignedDriver) {
                    return (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        color: '#fbbf24',
                        fontSize: '12px'
                      }}>
                        ⚠️ <strong>No Driver Assigned:</strong> Vehicle <strong>{selectedVehicle}</strong> is not assigned to any driver in the Driver Roster. Please assign a driver in Driver Management before dispatching.
                      </div>
                    );
                  }
                  if (assignedDriver.status === 'Off Duty') {
                    return (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        fontSize: '12px'
                      }}>
                        ⛔ <strong>Dispatch Blocked:</strong> Assigned driver <strong>{assignedDriver.name}</strong> ({assignedDriver.id}) is currently <strong>OFF DUTY</strong>.
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#f87171' }}>
                          Fleet {selectedVehicle} cannot be assigned any shipment until the driver assigned is changed or set to On Duty.
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(52, 211, 153, 0.1)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: '#34d399',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        👨‍✈️ <strong>Assigned Driver:</strong> {assignedDriver.name} ({assignedDriver.id})
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8'
                      }}>
                        Current Status: {assignedDriver.status} (Auto transitions to On Duty)
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Route Optimization Profile Selector */}
          <div>
            <label style={darkModalStyles.label}>Route Optimization Strategy</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {[
                { name: 'Shortest Route', desc: 'Min distance', icon: '📏' },
                { name: 'Fastest Route', desc: 'High velocity', icon: '⚡' },
                { name: 'Traffic Avoidance', desc: 'Dynamic detour', icon: '🚦' },
                { name: 'Fuel Efficient Route', desc: 'Eco cruise', icon: '🍃' }
              ].map(opt => {
                const isSelected = routeType === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => { setRouteType(opt.name); setPreview(null); }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle, #1e293b)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card-sub, #070a0f)',
                      color: isSelected ? '#38bdf8' : 'var(--text-secondary, #cbd5e1)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '18px' }}>{opt.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{opt.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shipment Assignment Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={darkModalStyles.label}>Select Shipments for this Dispatch</label>
              <span style={{ fontSize: '12px', fontWeight: '700', color: isOverweight ? '#f87171' : '#34d399', fontFamily: 'JetBrains Mono' }}>
                Load: {totalWeightTons}T / {vehicleCapacityTons || 0}T max {isOverweight ? '(OVERLOADED!)' : ''}
              </span>
            </div>

            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '8px', padding: '8px', background: 'var(--bg-card-sub, #070a0f)' }}>
              {shipments.length === 0 ? (
                <p style={{ margin: 0, padding: '12px', fontSize: '13px', color: 'var(--text-muted, #64748b)', textAlign: 'center' }}>No unassigned consignments available.</p>
              ) : (
                shipments.map(s => {
                  const isChecked = selectedShipmentIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleShipment(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        background: isChecked ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        border: isChecked ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} />
                        <div>
                          <b style={{ fontSize: '13px', color: 'var(--text-primary, #f8fafc)', fontFamily: 'JetBrains Mono' }}>{s.tracking_number}</b>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginLeft: '8px' }}>{s.origin} → {s.destination}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary, #cbd5e1)', fontFamily: 'JetBrains Mono' }}>
                        {s.weight_kg || 100} kg
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Route Preview Panel */}
          {preview && (
            <div style={darkModalStyles.previewCard}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Road Distance</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', fontFamily: 'JetBrains Mono' }}>{preview.total_distance_km} km</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Est. Travel Time</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{preview.estimated_duration_mins} min</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Fuel Required</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399', fontFamily: 'JetBrains Mono' }}>{preview.estimated_fuel_liters} L</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Arrival ETA</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', marginTop: '2px' }}>{preview.eta_formatted}</div>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', textAlign: 'center' }}>
                ℹ️ {preview.profile_description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handlePreviewRoute}
              disabled={loadingPreview || selectedShipmentIds.length === 0}
              style={darkModalStyles.previewBtn}
            >
              {loadingPreview ? 'Calculating...' : '🔍 Preview Route & Fuel'}
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} style={darkModalStyles.cancelBtn}>Cancel</button>
              <button
                type="submit"
                disabled={submitting || isOverweight || selectedShipmentIds.length === 0 || !selectedVehicle || isBlockedByDriver}
                style={{
                  ...darkModalStyles.submitBtn,
                  opacity: (submitting || isOverweight || selectedShipmentIds.length === 0 || !selectedVehicle || isBlockedByDriver) ? 0.5 : 1,
                  cursor: (submitting || isOverweight || selectedShipmentIds.length === 0 || !selectedVehicle || isBlockedByDriver) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Scheduling...' : (isBlockedByDriver ? '⛔ Blocked (Driver Off Duty)' : '🚀 Dispatch Trip')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const darkModalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay, rgba(5, 7, 10, 0.75))', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  container: { background: 'var(--bg-card, #0d131f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '16px', width: '90%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', boxShadow: 'var(--shadow-card)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle, #1e293b)', paddingBottom: '14px', marginBottom: '18px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #64748b)', marginBottom: '6px', textTransform: 'uppercase' },
  select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle, #1e293b)', fontSize: '13px', outline: 'none', background: 'var(--bg-card-sub, #070a0f)', color: 'var(--text-primary, #f8fafc)' },
  alertBox: { background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' },
  previewCard: { background: 'var(--bg-card-sub, #070a0f)', border: '1px solid var(--border-subtle, #1e293b)', borderRadius: '10px', padding: '14px' },
  previewBtn: { background: 'var(--bg-card-hover, #162030)', color: '#38bdf8', border: '1px solid var(--border-subtle, #1e3a5f)', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { background: 'transparent', color: 'var(--text-secondary, #94a3b8)', border: '1px solid var(--border-subtle, #1e293b)', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' }
};
