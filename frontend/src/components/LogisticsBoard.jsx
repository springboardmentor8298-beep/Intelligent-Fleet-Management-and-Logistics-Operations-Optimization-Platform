import React, { useState, useEffect, useRef } from 'react';
import { fetchShipments, createShipment, getTrackingSocketUrl, optimizeRoute } from '../api';
import { REGIONAL_LOCATIONS, resolveLocationCoords, resolveLocationCoordsAsync } from '../pages/ShipmentsPage';
import LiveTrackingMap from './LiveTrackingMap';
import TripSchedulerModal from './TripSchedulerModal';
import ShipmentHistoryModal from './ShipmentHistoryModal';

export default function LogisticsBoard() {
  const [shipments, setShipments] = useState([]);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState('');
  const [activeShipment, setActiveShipment] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: 13.0827, lng: 80.2707 });
  const [routePath, setRoutePath] = useState([]);
  const [telemetry, setTelemetry] = useState({ speed: 0, heading: 0, eta: '--', remaining_km: 0, status: '', is_delayed: false, delay_reason: '' });
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [historyShipmentId, setHistoryShipmentId] = useState(null);

  // New Shipment Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    tracking_number: '',
    origin: 'Chennai Port Gateway, India',
    destination: 'Colombo Harbor Terminal, Sri Lanka',
    origin_lat: 13.0827,
    origin_lng: 80.2707,
    destination_lat: 6.9271,
    destination_lng: 79.8612,
    weight_kg: 850,
    sender_name: 'Chennai Maritime Express',
    recipient_name: 'Ceylon Logistics Ltd'
  });

  const wsRef = useRef(null);

  useEffect(() => {
    loadShipments();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const loadShipments = async () => {
    try {
      const res = await fetchShipments();
      const list = res.data || [];
      setShipments(list);
      if (list.length > 0 && !activeTrackingNumber) {
        selectShipmentForMap(list[0]);
      }
    } catch (err) {
      console.error("Failed to load shipments", err);
    }
  };

  const selectShipmentForMap = async (shipment) => {
    setActiveTrackingNumber(shipment.tracking_number);
    setActiveShipment(shipment);
    const startLat = shipment.current_lat || shipment.origin_lat || 13.0827;
    const startLng = shipment.current_lng || shipment.origin_lng || 80.2707;
    const destLat = shipment.destination_lat || 6.9271;
    const destLng = shipment.destination_lng || 79.8612;

    setCurrentCoords({ lat: startLat, lng: startLng });
    setTelemetry({
      speed: shipment.speed_kmh || 0,
      heading: 0,
      eta: shipment.eta || '--',
      remaining_km: shipment.distance_km || 0,
      status: shipment.status,
      is_delayed: shipment.status === 'Delayed',
      delay_reason: shipment.status === 'Delayed' ? 'Traffic Congestion Detected' : ''
    });

    // Compute route path polyline
    try {
      const opt = await optimizeRoute({
        origin_lat: shipment.origin_lat || startLat,
        origin_lng: shipment.origin_lng || startLng,
        destination_lat: destLat,
        destination_lng: destLng,
        optimization_type: 'Fastest Route'
      });
      setRoutePath(opt.data.full_path || []);
    } catch (e) {
      // fallback straight segment
      setRoutePath([
        [shipment.origin_lat || startLat, shipment.origin_lng || startLng],
        [destLat, destLng]
      ]);
    }
  };

  const startLiveTracking = (trackingNumber) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const target = shipments.find(s => s.tracking_number === trackingNumber);
    if (target) {
      selectShipmentForMap(target);
    }

    setIsLiveStreaming(true);
    const ws = new WebSocket(getTrackingSocketUrl(trackingNumber));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setCurrentCoords({ lat: parsed.lat, lng: parsed.lng });
        setTelemetry({
          speed: parsed.speed_kmh,
          eta: parsed.eta_display,
          remaining_km: parsed.remaining_km,
          status: parsed.status,
          is_delayed: parsed.is_delayed,
          delay_reason: parsed.delay_reason
        });

        if (parsed.status === 'Delivered') {
          setShipments(prev => prev.map(s => s.tracking_number === parsed.tracking_number ? {
            ...s,
            status: 'Delivered',
            current_lat: parsed.lat,
            current_lng: parsed.lng,
            speed_kmh: 0,
            eta: 'Delivered'
          } : s));
          setIsLiveStreaming(false);
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      } catch (err) {
        console.error("WebSocket message parsing error", err);
      }
    };

    ws.onerror = (err) => {
      console.log("WebSocket stream idle or completed", err);
      setIsLiveStreaming(false);
    };

    ws.onclose = () => {
      setIsLiveStreaming(false);
    };
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const trackingCode = formData.tracking_number || `FLT-${Date.now().toString().slice(-6)}`;
      
      const origRes = await resolveLocationCoordsAsync(formData.origin);
      const destRes = await resolveLocationCoordsAsync(formData.destination);

      const origLat = origRes ? origRes.lat : (formData.origin_lat || 40.7128);
      const origLng = origRes ? origRes.lng : (formData.origin_lng || -74.0060);
      const destLat = destRes ? destRes.lat : (formData.destination_lat || 42.3601);
      const destLng = destRes ? destRes.lng : (formData.destination_lng || -71.0589);

      const submissionData = {
        ...formData,
        tracking_number: trackingCode,
        origin: origRes?.name || formData.origin,
        destination: destRes?.name || formData.destination,
        origin_lat: origLat,
        origin_lng: origLng,
        destination_lat: destLat,
        destination_lng: destLng,
      };

      await createShipment(submissionData);
      setShowCreateForm(false);
      setFormData({
        tracking_number: '',
        origin: 'New York, USA',
        destination: 'Boston, USA',
        origin_lat: 40.7128,
        origin_lng: -74.0060,
        destination_lat: 42.3601,
        destination_lng: -71.0589,
        weight_kg: 500,
        sender_name: 'FleetFlow Logistics Hub',
        recipient_name: 'Commercial Consignee'
      });
      await loadShipments();
    } catch (err) {
      alert(err.response?.data?.detail || "Error registering shipment");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Created': { bg: '#e2e8f0', text: '#334155' },
      'Assigned': { bg: '#e0e7ff', text: '#3730a3' },
      'In Transit': { bg: '#dbeafe', text: '#1e40af' },
      'Delayed': { bg: '#fee2e2', text: '#991b1b' },
      'Delivered': { bg: '#dcfce7', text: '#15803d' },
      'Cancelled': { bg: '#f1f5f9', text: '#64748b' }
    };
    const c = map[status] || { bg: '#f1f5f9', text: '#475569' };
    return (
      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold', backgroundColor: c.bg, color: c.text }}>
        {status}
      </span>
    );
  };

  const filteredShipments = statusFilter === 'ALL'
    ? shipments
    : shipments.filter(s => s.status === statusFilter);

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px', marginTop: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', fontWeight: '700' }}>
              Milestone 2: Shipment Tracking & Route Optimization Console
            </h2>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold' }}>
              LIVE SATELLITE LINK
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Real-time GPS telemetry, traffic-aware routing, dynamic ETA recalculation, and multi-status workflow.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsSchedulerOpen(true)}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ⚡ Schedule Trip & Route
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {showCreateForm ? '✕ Close Form' : '+ New Shipment'}
          </button>
        </div>
      </div>

      {/* Quick Shipment Creation Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#1e293b' }}>Register Shipment & Initialize Route</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Tracking Code (optional)</label>
              <input
                placeholder="e.g. FLT-99214"
                value={formData.tracking_number}
                onChange={e => setFormData({ ...formData, tracking_number: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Origin Address</label>
              <input
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Destination Address</label>
              <input
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Weight (kg)</label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                required
              />
            </div>
          </div>
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Save & Compute Route
          </button>
        </form>
      )}

      {/* Live Map & Telemetry Dashboard Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div>
          <LiveTrackingMap
            currentCoords={currentCoords}
            routePath={routePath}
            origin={activeShipment ? { lat: activeShipment.origin_lat || 13.0827, lng: activeShipment.origin_lng || 80.2707, label: activeShipment.origin } : null}
            destination={activeShipment ? { lat: activeShipment.destination_lat || 6.9271, lng: activeShipment.destination_lng || 79.8612, label: activeShipment.destination } : null}
            trackingNumber={activeTrackingNumber}
            speed={telemetry.speed}
            heading={telemetry.heading}
            eta={telemetry.eta}
          />
        </div>

        {/* Telemetry Gauge Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Selected Telemetry</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{activeTrackingNumber || 'No selection'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Live Speed</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>{telemetry.speed} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>km/h</span></div>
              </div>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Remaining</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>{telemetry.remaining_km} <span style={{ fontSize: '11px', fontWeight: 'normal' }}>km</span></div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Dynamic Arrival ETA:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{telemetry.eta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Traffic Status:</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: telemetry.is_delayed ? '#dc2626' : '#16a34a' }}>
                  {telemetry.is_delayed ? '⚠️ Congestion Delay' : '🟢 Traffic Flow Clear'}
                </span>
              </div>
            </div>

            {telemetry.is_delayed && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '14px' }}>
                🚨 Alert: {telemetry.delay_reason || 'Vehicle running behind scheduled timetable!'}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => startLiveTracking(activeTrackingNumber)}
              disabled={!activeTrackingNumber}
              style={{
                width: '100%',
                background: isLiveStreaming ? '#10b981' : '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLiveStreaming ? '📡 Live Tracking Active (Streaming)' : (telemetry.status === 'Delivered' ? '🔄 Replay Real-Time GPS Tracking' : '▶ Start Real-Time GPS Tracking')}
            </button>
          </div>
        </div>
      </div>

      {/* Shipment Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Shipment Logistics Registry</h3>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {['ALL', 'Created', 'Assigned', 'In Transit', 'Delayed', 'Delivered', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                background: statusFilter === st ? '#0f172a' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#64748b'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Data Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Tracking #</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Route</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Weight</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Est. Arrival</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.map(s => {
              const isSelected = s.tracking_number === activeTrackingNumber;
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#ffffff' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                    {s.tracking_number}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                    {s.origin} → {s.destination}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {s.weight_kg || 100} kg
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {s.eta || '35 mins'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {getStatusBadge(s.status)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => selectShipmentForMap(s)}
                        style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Map View
                      </button>
                      <button
                        onClick={() => startLiveTracking(s.tracking_number)}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Live Track
                      </button>
                      <button
                        onClick={() => setHistoryShipmentId(s.id)}
                        style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        title="View audit logs"
                      >
                        📜 Timeline
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredShipments.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No shipments found for status: {statusFilter}. Click "+ New Shipment" to register one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <TripSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onTripScheduled={() => { loadShipments(); }}
      />

      <ShipmentHistoryModal
        shipmentId={historyShipmentId}
        isOpen={!!historyShipmentId}
        onClose={() => setHistoryShipmentId(null)}
        onStatusUpdated={() => { loadShipments(); }}
      />
    </div>
  );
}