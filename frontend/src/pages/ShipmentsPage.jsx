import React, { useState, useEffect, useRef } from 'react';
import { fetchShipments, createShipment, getTrackingSocketUrl, optimizeRoute, geocodeLocation } from '../api';
import LiveTrackingMap from '../components/LiveTrackingMap';
import TripSchedulerModal from '../components/TripSchedulerModal';
import ShipmentHistoryModal from '../components/ShipmentHistoryModal';

// Comprehensive Global Geocoding Directory (US, Europe, Asia, India, Sri Lanka)
export const GLOBAL_LOCATIONS = {
  // United States & North America
  "new york": { name: "New York Port & Logistics Center, NY, USA", lat: 40.7128, lng: -74.0060 },
  "newyork": { name: "New York Port & Logistics Center, NY, USA", lat: 40.7128, lng: -74.0060 },
  "nyc": { name: "New York City, NY, USA", lat: 40.7128, lng: -74.0060 },
  "manhattan": { name: "Manhattan Hub, NY, USA", lat: 40.7831, lng: -73.9712 },
  "boston": { name: "Port of Boston Logistics Terminal, MA, USA", lat: 42.3601, lng: -71.0589 },
  "chicago": { name: "Chicago Intermodal Freight Hub, IL, USA", lat: 41.8781, lng: -87.6298 },
  "los angeles": { name: "Port of Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437 },
  "la": { name: "Los Angeles, CA, USA", lat: 34.0522, lng: -118.2437 },
  "san francisco": { name: "San Francisco Bay Logistics Center, CA, USA", lat: 37.7749, lng: -122.4194 },
  "seattle": { name: "Port of Seattle, WA, USA", lat: 47.6062, lng: -122.3321 },
  "houston": { name: "Port of Houston Container Terminal, TX, USA", lat: 29.7604, lng: -95.3698 },
  "dallas": { name: "Dallas Freight Hub, TX, USA", lat: 32.7767, lng: -96.7970 },
  "miami": { name: "PortMiami Logistics Depot, FL, USA", lat: 25.7617, lng: -80.1918 },
  "atlanta": { name: "Atlanta Air Cargo Center, GA, USA", lat: 33.7490, lng: -84.3880 },
  "toronto": { name: "Toronto Logistics Hub, ON, Canada", lat: 43.6532, lng: -79.3832 },
  "vancouver": { name: "Port of Vancouver, BC, Canada", lat: 49.2827, lng: -123.1207 },

  // Europe
  "london": { name: "Port of London Logistics Hub, UK", lat: 51.5074, lng: -0.1278 },
  "manchester": { name: "Manchester Freight Terminal, UK", lat: 53.4808, lng: -2.2426 },
  "paris": { name: "Paris Cargo Logistics Hub, France", lat: 48.8566, lng: 2.3522 },
  "berlin": { name: "Berlin Logistics Depot, Germany", lat: 52.5200, lng: 13.4050 },
  "frankfurt": { name: "Frankfurt Air & Cargo Hub, Germany", lat: 50.1109, lng: 8.6821 },
  "amsterdam": { name: "Port of Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  "rotterdam": { name: "Port of Rotterdam Europe Gateway, Netherlands", lat: 51.9244, lng: 4.4777 },
  "madrid": { name: "Madrid Central Logistics Terminal, Spain", lat: 40.4168, lng: -3.7038 },
  "rome": { name: "Rome Cargo Logistics Center, Italy", lat: 41.9028, lng: 12.4964 },

  // Asia & Middle East
  "dubai": { name: "Jebel Ali Port & Logistics City, Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  "singapore": { name: "Port of Singapore Global Transshipment Hub", lat: 1.3521, lng: 103.8198 },
  "tokyo": { name: "Port of Tokyo Container Terminal, Japan", lat: 35.6762, lng: 139.6503 },
  "shanghai": { name: "Port of Shanghai Deepwater Hub, China", lat: 31.2304, lng: 121.4737 },
  "hong kong": { name: "Hong Kong Kwai Tsing Container Terminal", lat: 22.3193, lng: 114.1694 },
  "sydney": { name: "Port Botany Logistics Hub, Sydney, Australia", lat: -33.8688, lng: 151.2093 },

  // India Hubs
  "chennai": { name: "Chennai Port Gateway, India", lat: 13.0827, lng: 80.2707 },
  "tuticorin": { name: "V.O.C Port Tuticorin, India", lat: 8.7642, lng: 78.1348 },
  "bengaluru": { name: "Bengaluru Tech Logistics Depot, India", lat: 12.9716, lng: 77.5946 },
  "bangalore": { name: "Bengaluru Tech Logistics Depot, India", lat: 12.9716, lng: 77.5946 },
  "mumbai": { name: "Mumbai JNPT Logistics Hub, India", lat: 18.9220, lng: 72.8347 },
  "kochi": { name: "Kochi Seaport Terminal, India", lat: 9.9312, lng: 76.2673 },
  "cochin": { name: "Kochi Seaport Terminal, India", lat: 9.9312, lng: 76.2673 },
  "delhi": { name: "New Delhi Cargo Terminal, India", lat: 28.6139, lng: 77.2090 },
  "new delhi": { name: "New Delhi Cargo Terminal, India", lat: 28.6139, lng: 77.2090 },
  "hyderabad": { name: "Hyderabad Air Cargo Hub, India", lat: 17.3850, lng: 78.4867 },
  "kolkata": { name: "Kolkata Port Depot, India", lat: 22.5726, lng: 88.3639 },
  "ahmedabad": { name: "Ahmedabad Freight Terminal, India", lat: 23.0225, lng: 72.5714 },
  "pune": { name: "Pune Auto Logistics Hub, India", lat: 18.5204, lng: 73.8567 },
  "india": { name: "Chennai Port Gateway, India", lat: 13.0827, lng: 80.2707 },

  // Sri Lanka Hubs
  "colombo": { name: "Colombo Harbor Terminal, Sri Lanka", lat: 6.9271, lng: 79.8612 },
  "jaffna": { name: "Jaffna Regional Logistics Center, Sri Lanka", lat: 9.6615, lng: 80.0255 },
  "kandy": { name: "Kandy Inland Freight Depot, Sri Lanka", lat: 7.2906, lng: 80.6337 },
  "galle": { name: "Galle Southern Seaport, Sri Lanka", lat: 6.0535, lng: 80.2210 },
  "trincomalee": { name: "Trincomalee Deepwater Harbor, Sri Lanka", lat: 8.5874, lng: 81.2152 },
  "sri lanka": { name: "Colombo Harbor Terminal, Sri Lanka", lat: 6.9271, lng: 79.8612 },
  "srilanka": { name: "Colombo Harbor Terminal, Sri Lanka", lat: 6.9271, lng: 79.8612 },
};

export const REGIONAL_LOCATIONS = GLOBAL_LOCATIONS;

export const resolveLocationCoords = (text) => {
  if (!text) return null;
  const clean = text.toLowerCase().trim().replace(/[,\.\-_/]/g, ' ');
  const cleanCompact = clean.replace(/\s+/g, '');
  for (const key in GLOBAL_LOCATIONS) {
    const keyCompact = key.replace(/\s+/g, '');
    if (key === clean || keyCompact === cleanCompact || clean.includes(key) || (key.length >= 4 && key.includes(clean))) {
      return GLOBAL_LOCATIONS[key];
    }
  }
  return null;
};

export const resolveLocationCoordsAsync = async (text) => {
  if (!text || !text.trim()) return null;
  // 1. Fast local dictionary match
  const syncMatch = resolveLocationCoords(text);
  if (syncMatch) return syncMatch;

  // 2. Query backend live geocoding service (supports ANY address/city globally)
  try {
    const res = await geocodeLocation(text.trim());
    if (res.data && res.data.lat !== undefined && res.data.lng !== undefined) {
      return {
        name: res.data.display_name || text,
        lat: Number(res.data.lat),
        lng: Number(res.data.lng)
      };
    }
  } catch (err) {
    console.warn("Live geocode lookup note:", err);
  }
  return null;
};

export default function ShipmentsPage() {
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

  // New Shipment Form
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
      delay_reason: shipment.status === 'Delayed' ? 'Traffic Congestion Delay' : ''
    });

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
      setRoutePath([
        [shipment.origin_lat || startLat, shipment.origin_lng || startLng],
        [destLat, destLng]
      ]);
    }
  };

  const startLiveTracking = (trackingNumber) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const target = shipments.find(s => s.tracking_number === trackingNumber);
    if (target && (!routePath || routePath.length === 0)) {
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
          heading: parsed.heading || 0,
          eta: parsed.eta_display,
          remaining_km: parsed.remaining_km,
          status: parsed.status,
          is_delayed: parsed.is_delayed,
          delay_reason: parsed.delay_reason
        });

        if (parsed.status === 'Delivered') {
          // Immediately update consignment in registry list
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
        console.error("WS parse error", err);
      }
    };

    ws.onerror = () => setIsLiveStreaming(false);
    ws.onclose = () => setIsLiveStreaming(false);
  };

  const toggleLiveTracking = (trackingNumber) => {
    if (isLiveStreaming) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsLiveStreaming(false);
    } else {
      startLiveTracking(trackingNumber);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const trackingCode = formData.tracking_number || `FLT-${Date.now().toString().slice(-6)}`;
      
      // Auto-resolve coordinates for ANY location globally (local dictionary + live geocoding)
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
      'Created': { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
      'Assigned': { bg: 'rgba(129, 140, 248, 0.12)', text: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' },
      'In Transit': { bg: 'rgba(56, 189, 248, 0.12)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
      'Delayed': { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', border: 'rgba(248, 113, 113, 0.3)' },
      'Delivered': { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' },
      'Cancelled': { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', border: 'rgba(100, 116, 139, 0.3)' }
    };
    const c = map[status] || { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    return (
      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
        {status}
      </span>
    );
  };

  const filteredShipments = statusFilter === 'ALL'
    ? shipments
    : shipments.filter(s => s.status === statusFilter);

  return (
    <div style={shipStyles.page}>
      {/* Top Header & Console Name */}
      <div style={shipStyles.headerRow}>
        <div>
          <div style={shipStyles.subtitle}>SHIPMENT TRACKING & DISPATCH</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={shipStyles.title}>FleetFlow Dispatch & Shipment Tracking Console</h1>
            <span style={shipStyles.livePill}>LIVE SATELLITE TELEMETRY</span>
          </div>
          <p style={shipStyles.desc}>
            Real-time GPS coordinates, traffic-aware route tracking, dynamic ETA countdown, and multi-stage delivery workflows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsSchedulerOpen(true)} style={shipStyles.scheduleBtn}>
            ⚡ Dispatch & Optimize Trip
          </button>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={shipStyles.newShipmentBtn}>
            {showCreateForm ? '✕ Close Form' : '+ New Shipment'}
          </button>
        </div>
      </div>

      {/* Quick Shipment Creation Panel */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} style={shipStyles.createCard}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-primary, #f8fafc)', fontWeight: '700' }}>
            Register New Consignment & Initialize Route
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={shipStyles.formLabel}>Tracking Number (optional)</label>
              <input
                placeholder="Auto-generated if blank"
                value={formData.tracking_number}
                onChange={e => setFormData({ ...formData, tracking_number: e.target.value })}
                style={shipStyles.formInput}
              />
            </div>
            <div>
              <label style={shipStyles.formLabel}>Origin Address / City</label>
              <input
                placeholder="e.g. New York, Boston, London, Chennai..."
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                style={shipStyles.formInput}
                required
              />
              {resolveLocationCoords(formData.origin) && (
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                  📍 {resolveLocationCoords(formData.origin).name} ({resolveLocationCoords(formData.origin).lat.toFixed(4)}, {resolveLocationCoords(formData.origin).lng.toFixed(4)})
                </div>
              )}
            </div>
            <div>
              <label style={shipStyles.formLabel}>Destination Address / City</label>
              <input
                placeholder="e.g. Boston, Paris, Colombo, Tokyo..."
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                style={shipStyles.formInput}
                required
              />
              {resolveLocationCoords(formData.destination) && (
                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
                  📍 {resolveLocationCoords(formData.destination).name} ({resolveLocationCoords(formData.destination).lat.toFixed(4)}, {resolveLocationCoords(formData.destination).lng.toFixed(4)})
                </div>
              )}
            </div>
            <div>
              <label style={shipStyles.formLabel}>Cargo Weight (kg)</label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                style={shipStyles.formInput}
                required
              />
            </div>
          </div>
          {/* Quick Corridors Selection */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              🌍 Popular Global & Regional Corridors (Click to autofill):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: '🇺🇸 New York ➔ 🇺🇸 Boston', orig: 'New York Port & Logistics Center, NY, USA', oLat: 40.7128, oLng: -74.0060, dest: 'Port of Boston Logistics Terminal, MA, USA', dLat: 42.3601, dLng: -71.0589 },
                { label: '🇺🇸 San Francisco ➔ 🇺🇸 Los Angeles', orig: 'San Francisco Bay Logistics Center, CA, USA', oLat: 37.7749, oLng: -122.4194, dest: 'Port of Los Angeles, CA, USA', dLat: 34.0522, dLng: -118.2437 },
                { label: '🇬🇧 London ➔ 🇫🇷 Paris', orig: 'Port of London Logistics Hub, UK', oLat: 51.5074, oLng: -0.1278, dest: 'Paris Cargo Logistics Hub, France', dLat: 48.8566, dLng: 2.3522 },
                { label: '🇮🇳 Chennai ➔ 🇱🇰 Colombo', orig: 'Chennai Port Gateway, India', oLat: 13.0827, oLng: 80.2707, dest: 'Colombo Harbor Terminal, Sri Lanka', dLat: 6.9271, dLng: 79.8612 },
                { label: '🇮🇳 Tuticorin ➔ 🇱🇰 Colombo', orig: 'V.O.C Port Tuticorin, India', oLat: 8.7642, oLng: 78.1348, dest: 'Colombo Harbor Terminal, Sri Lanka', dLat: 6.9271, dLng: 79.8612 },
                { label: '🇮🇳 Mumbai ➔ 🇮🇳 Bengaluru', orig: 'Mumbai JNPT Logistics Hub, India', oLat: 18.9220, oLng: 72.8347, dest: 'Bengaluru Tech Logistics Depot, India', dLat: 12.9716, dLng: 77.5946 },
                { label: '🇮🇳 Delhi ➔ 🇮🇳 Chennai', orig: 'New Delhi Cargo Terminal, India', oLat: 28.6139, oLng: 77.2090, dest: 'Chennai Port Gateway, India', dLat: 13.0827, dLng: 80.2707 }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    origin: p.orig,
                    origin_lat: p.oLat,
                    origin_lng: p.oLng,
                    destination: p.dest,
                    destination_lat: p.dLat,
                    destination_lng: p.dLng
                  }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: 'var(--bg-card-hover, #1e293b)',
                    color: '#38bdf8',
                    border: '1px solid var(--border-subtle, #334155)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={shipStyles.submitConsignmentBtn}>
            Save Consignment & Calculate Route
          </button>
        </form>
      )}

      {/* Map & Live Telemetry Grid */}
      <div style={shipStyles.mapTelemetryGrid}>
        {/* Leaflet Live Map */}
        <div style={shipStyles.mapCard}>
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

        {/* Telemetry Gauge Panel */}
        <div style={shipStyles.telemetryCard}>
          <div>
            <div style={shipStyles.telemetryHeader}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Selected Unit Telemetry</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                {activeTrackingNumber || 'None'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={shipStyles.statBox}>
                <div style={shipStyles.statLabel}>Current Velocity</div>
                <div style={shipStyles.statNum}>{telemetry.speed} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span></div>
              </div>
              <div style={shipStyles.statBox}>
                <div style={shipStyles.statLabel}>Remaining Path</div>
                <div style={{ ...shipStyles.statNum, color: '#38bdf8' }}>{telemetry.remaining_km} <span style={{ fontSize: '11px', color: '#64748b' }}>km</span></div>
              </div>
            </div>

            <div style={shipStyles.etaBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>Dynamic ETA:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>{telemetry.eta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>Traffic Corridor:</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: telemetry.is_delayed ? '#f87171' : '#34d399' }}>
                  {telemetry.is_delayed ? '⚠️ Congestion Detected' : '🟢 Optimal Traffic Flow'}
                </span>
              </div>
            </div>

            {telemetry.is_delayed && (
              <div style={shipStyles.delayAlert}>
                🚨 Alert: {telemetry.delay_reason || 'Vehicle speed degraded below threshold.'}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleLiveTracking(activeTrackingNumber)}
              disabled={!activeTrackingNumber}
              style={{
                ...shipStyles.liveToggleBtn,
                background: isLiveStreaming ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: isLiveStreaming ? '#ffffff' : '#06080d'
              }}
            >
              {isLiveStreaming ? '⏹ Stop Live Satellite Stream' : (telemetry.status === 'Delivered' ? '🔄 Replay Real-Time GPS Tracking' : '▶ Start Real-Time GPS Tracking')}
            </button>
          </div>
        </div>
      </div>

      {/* Shipment Registry Section */}
      <div style={shipStyles.registryCard}>
        <div style={shipStyles.registryHeader}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
            Consignment Tracking Registry
          </h2>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['ALL', 'Created', 'Assigned', 'In Transit', 'Delayed', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  ...shipStyles.filterTab,
                  ...(statusFilter === st ? shipStyles.activeFilterTab : {})
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={shipStyles.table}>
            <thead>
              <tr style={shipStyles.thRow}>
                <th style={shipStyles.th}>Tracking #</th>
                <th style={shipStyles.th}>Transit Path</th>
                <th style={shipStyles.th}>Weight</th>
                <th style={shipStyles.th}>ETA</th>
                <th style={shipStyles.th}>Status</th>
                <th style={{ ...shipStyles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => {
                const isSelected = s.tracking_number === activeTrackingNumber;
                return (
                  <tr key={s.id} style={{ ...shipStyles.tr, background: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                    <td style={{ ...shipStyles.td, fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                      {s.tracking_number}
                    </td>
                    <td style={shipStyles.td}>{s.origin} → {s.destination}</td>
                    <td style={shipStyles.td}>{s.weight_kg || 100} kg</td>
                    <td style={{ ...shipStyles.td, color: '#cbd5e1' }}>{s.eta || '35 mins'}</td>
                    <td style={shipStyles.td}>{getStatusBadge(s.status)}</td>
                    <td style={{ ...shipStyles.td, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (isLiveStreaming) {
                              if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
                              setIsLiveStreaming(false);
                            }
                            selectShipmentForMap(s);
                          }}
                          style={shipStyles.viewMapBtn}
                        >
                          Map View
                        </button>
                        <button
                          onClick={() => {
                            if (isLiveStreaming && activeTrackingNumber === s.tracking_number) {
                              toggleLiveTracking(s.tracking_number);
                            } else {
                              startLiveTracking(s.tracking_number);
                            }
                          }}
                          style={{
                            ...shipStyles.liveTrackBtn,
                            background: isLiveStreaming && activeTrackingNumber === s.tracking_number
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : shipStyles.liveTrackBtn.background
                          }}
                        >
                          {isLiveStreaming && activeTrackingNumber === s.tracking_number ? 'Streaming 📡' : 'Live Track'}
                        </button>
                        <button
                          onClick={() => setHistoryShipmentId(s.id)}
                          style={shipStyles.timelineBtn}
                          title="Audit timeline"
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
                  <td colSpan="6" style={{ ...shipStyles.td, textAlign: 'center', color: '#64748b', padding: '36px' }}>
                    No shipments found matching: {statusFilter}. Click "+ New Shipment" to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

const shipStyles = {
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
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)'
  },
  desc: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary, #94a3b8)'
  },
  livePill: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  scheduleBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
  },
  newShipmentBtn: {
    background: 'var(--bg-card-hover, #162030)',
    color: '#38bdf8',
    border: '1px solid var(--border-subtle, #1e3a5f)',
    padding: '11px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  createCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: 'var(--shadow-card)'
  },
  formLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle, #1e293b)',
    background: 'var(--bg-card-sub, #070a0f)',
    color: 'var(--text-primary, #f8fafc)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitConsignmentBtn: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '11px 22px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  mapTelemetryGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px'
  },
  mapCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)'
  },
  telemetryCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '14px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-card)'
  },
  telemetryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-subtle, #1e293b)',
    paddingBottom: '14px',
    marginBottom: '16px'
  },
  statBox: {
    background: 'var(--bg-card-sub, #070a0f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-muted, #64748b)',
    fontWeight: '600'
  },
  statNum: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary, #f8fafc)',
    marginTop: '4px',
    fontFamily: 'JetBrains Mono'
  },
  etaBox: {
    background: 'var(--bg-card-sub, #070a0f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '16px'
  },
  delayAlert: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    color: '#f87171',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  liveToggleBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)'
  },
  registryCard: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)'
  },
  registryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '20px',
    borderBottom: '1px solid var(--border-subtle, #1e293b)'
  },
  filterTab: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle, #1e293b)',
    background: 'var(--bg-card-sub, #070a0f)',
    color: 'var(--text-secondary, #94a3b8)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  activeFilterTab: {
    background: 'var(--bg-card-hover, #1e293b)',
    color: '#38bdf8',
    border: '1px solid #38bdf8'
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
    padding: '14px 18px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle, #131b2b)'
  },
  td: {
    padding: '16px 18px',
    fontSize: '13px',
    color: 'var(--text-secondary, #cbd5e1)'
  },
  viewMapBtn: {
    background: 'var(--bg-card-hover, #162030)',
    color: 'var(--text-secondary, #94a3b8)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  liveTrackBtn: {
    background: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  timelineBtn: {
    background: 'var(--bg-card-sub, #111722)',
    color: 'var(--text-secondary, #94a3b8)',
    border: '1px solid var(--border-subtle, #1e293b)',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  }
};
