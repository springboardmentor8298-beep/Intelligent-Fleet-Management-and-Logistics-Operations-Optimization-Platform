import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchShipments, getTrackingSocketUrl, optimizeRoute, geocodeLocation, fetchShipmentGpsLogs, clearShipmentGpsLogs } from '../api';

export const getHeadingCompass = (deg) => {
  if (deg === undefined || deg === null) return 'N';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
};

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
  const syncMatch = resolveLocationCoords(text);
  if (syncMatch) return syncMatch;

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

export const resolveOrigin = (shipment) => {
  if (!shipment) return null;
  let lat = shipment.origin_lat;
  let lng = shipment.origin_lng;
  if ((lat == null || lng == null || (lat === 13.0827 && lng === 80.2707 && !shipment.origin?.toLowerCase().includes('chennai'))) && shipment.origin) {
    const resolved = resolveLocationCoords(shipment.origin);
    if (resolved) {
      lat = resolved.lat;
      lng = resolved.lng;
    }
  }
  return {
    lat: lat != null ? Number(lat) : 13.0827,
    lng: lng != null ? Number(lng) : 80.2707,
    label: shipment.origin || 'Origin'
  };
};

export const resolveDestination = (shipment) => {
  if (!shipment) return null;
  let lat = shipment.destination_lat;
  let lng = shipment.destination_lng;
  if ((lat == null || lng == null || (lat === 6.9271 && lng === 79.8612 && !shipment.destination?.toLowerCase().includes('colombo'))) && shipment.destination) {
    const resolved = resolveLocationCoords(shipment.destination);
    if (resolved) {
      lat = resolved.lat;
      lng = resolved.lng;
    }
  }
  return {
    lat: lat != null ? Number(lat) : 6.9271,
    lng: lng != null ? Number(lng) : 79.8612,
    label: shipment.destination || 'Destination'
  };
};

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
  const [shipments, setShipments] = useState([]);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState(() => {
    try {
      return sessionStorage.getItem('fleetflow_active_tracking') || '';
    } catch (e) {
      return '';
    }
  });
  const [activeShipment, setActiveShipment] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: 13.0827, lng: 80.2707 });
  const [routePath, setRoutePath] = useState([]);
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    heading: 0,
    eta: '--',
    remaining_km: 0,
    status: '',
    is_delayed: false,
    delay_reason: ''
  });
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [gpsLogs, setGpsLogs] = useState([]);

  const wsRef = useRef(null);
  const activeTrackingNumberRef = useRef(activeTrackingNumber);
  const gpsLogsRef = useRef(gpsLogs);

  useEffect(() => {
    activeTrackingNumberRef.current = activeTrackingNumber;
    try {
      if (activeTrackingNumber) {
        sessionStorage.setItem('fleetflow_active_tracking', activeTrackingNumber);
      }
    } catch (e) {}
  }, [activeTrackingNumber]);

  useEffect(() => {
    gpsLogsRef.current = gpsLogs;
  }, [gpsLogs]);

  // Initial load of shipments once on app mount
  useEffect(() => {
    loadShipments();
    // Do NOT close ws on unmount - this provider stays alive across page navigations!
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const loadHistoricalLogs = async (tn) => {
    if (!tn) return;
    try {
      const res = await fetchShipmentGpsLogs(tn, 150);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setGpsLogs(res.data.map((b, idx) => ({
          id: `db-${b.id || idx}`,
          seq: res.data.length - idx,
          timestamp: b.recorded_at ? new Date(b.recorded_at).toLocaleTimeString() : '--:--:--',
          isoTime: b.recorded_at,
          lat: Number(b.latitude),
          lng: Number(b.longitude),
          speed: b.speed_kmh || 0,
          heading: b.heading_deg || 0,
          vehicle_id: b.vehicle_id || 'Active Fleet',
          status: b.speed_kmh > 0 ? 'In Transit' : 'Stationary',
          isHistorical: true
        })));
      } else {
        setGpsLogs([]);
      }
    } catch (e) {
      setGpsLogs([]);
    }
  };

  const selectShipmentForMap = async (shipment) => {
    if (!shipment) return;
    setActiveTrackingNumber(shipment.tracking_number);
    setActiveShipment(shipment);
    loadHistoricalLogs(shipment.tracking_number);

    const orig = resolveOrigin(shipment);
    const dest = resolveDestination(shipment);

    const startLat = shipment.current_lat != null ? Number(shipment.current_lat) : orig.lat;
    const startLng = shipment.current_lng != null ? Number(shipment.current_lng) : orig.lng;

    setCurrentCoords({ lat: startLat, lng: startLng });
    // Immediately set straight origin-to-destination route so Points A and B update instantly
    setRoutePath([
      [orig.lat, orig.lng],
      [dest.lat, dest.lng]
    ]);

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
        origin_lat: orig.lat,
        origin_lng: orig.lng,
        destination_lat: dest.lat,
        destination_lng: dest.lng,
        optimization_type: 'Fastest Route'
      });
      if (opt.data?.full_path && opt.data.full_path.length > 0) {
        setRoutePath(opt.data.full_path);
      }
    } catch (e) {
      // fallback straight line is already displayed
    }
  };

  const loadShipments = async (preferredTrackingNumber = null) => {
    try {
      const res = await fetchShipments();
      const list = res.data || [];
      setShipments(list);

      const targetTn = preferredTrackingNumber || activeTrackingNumberRef.current;
      if (targetTn) {
        const found = list.find(s => s.tracking_number === targetTn);
        if (found) {
          // Keep activeShipment synchronized without resetting route or tracking
          setActiveShipment(prev => prev ? { ...prev, ...found } : found);
          return;
        }
      }

      // Only fallback to list[0] if NOTHING was selected or found
      if (list.length > 0 && !activeTrackingNumberRef.current) {
        selectShipmentForMap(list[0]);
      }
    } catch (err) {
      console.error("Failed to load shipments", err);
    }
  };

  const stopLiveTracking = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsLiveStreaming(false);
  };

  const startLiveTracking = async (trackingNumber) => {
    if (!trackingNumber) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    let target = shipments.find(s => s.tracking_number === trackingNumber);
    if (!target) {
      try {
        const res = await fetchShipments();
        const list = res.data || [];
        setShipments(list);
        target = list.find(s => s.tracking_number === trackingNumber);
      } catch (err) {
        console.error("Failed to refresh shipments", err);
      }
    }

    if (target) {
      await selectShipmentForMap(target);
    } else {
      setActiveTrackingNumber(trackingNumber);
    }

    setIsLiveStreaming(true);

    try {
      const wsUrl = getTrackingSocketUrl(trackingNumber);
      const ws = new WebSocket(wsUrl);
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

          // Add live GPS telemetry ping to real-time GPS log system
          const newLogPing = {
            id: `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            seq: parsed.step_idx || (gpsLogsRef.current.length + 1),
            total_steps: parsed.total_steps,
            timestamp: new Date().toLocaleTimeString(),
            isoTime: parsed.timestamp || new Date().toISOString(),
            lat: parsed.lat,
            lng: parsed.lng,
            speed: parsed.speed_kmh,
            heading: parsed.heading || 0,
            remaining_km: parsed.remaining_km,
            eta: parsed.eta_display,
            status: parsed.status,
            vehicle_id: parsed.vehicle_id || target?.vehicle_id || 'Active Fleet',
            is_delayed: parsed.is_delayed,
            delay_reason: parsed.delay_reason,
            isLive: true
          };
          setGpsLogs(prev => [newLogPing, ...prev.slice(0, 199)]);

          // Keep registry state synchronized with live vehicle location and status
          setShipments(prev => prev.map(s => s.tracking_number === parsed.tracking_number ? {
            ...s,
            current_lat: parsed.lat,
            current_lng: parsed.lng,
            speed_kmh: parsed.speed_kmh,
            heading: parsed.heading || 0,
            eta: parsed.eta_display,
            distance_km: parsed.remaining_km,
            status: parsed.status
          } : s));

          // If the live update is for our current active tracking number, keep activeShipment synchronized
          if (parsed.tracking_number === trackingNumber) {
            setActiveShipment(prev => prev ? {
              ...prev,
              current_lat: parsed.lat,
              current_lng: parsed.lng,
              speed_kmh: parsed.speed_kmh,
              status: parsed.status,
              eta: parsed.eta_display,
              distance_km: parsed.remaining_km
            } : prev);
          }

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
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket stream error or completed:", err);
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          setIsLiveStreaming(false);
          wsRef.current = null;
        }
      };
    } catch (err) {
      console.error("WebSocket connection failure", err);
      setIsLiveStreaming(false);
    }
  };

  const toggleLiveTracking = (trackingNumber) => {
    if (isLiveStreaming && activeTrackingNumber === trackingNumber) {
      stopLiveTracking();
    } else {
      startLiveTracking(trackingNumber);
    }
  };

  const clearGpsLogsAction = async () => {
    if (activeTrackingNumber) {
      try {
        await clearShipmentGpsLogs(activeTrackingNumber);
      } catch (e) {
        console.warn("Could not clear DB GPS logs", e);
      }
    }
    setGpsLogs([]);
  };

  return (
    <TrackingContext.Provider value={{
      shipments,
      setShipments,
      activeTrackingNumber,
      setActiveTrackingNumber,
      activeShipment,
      setActiveShipment,
      currentCoords,
      setCurrentCoords,
      routePath,
      setRoutePath,
      telemetry,
      setTelemetry,
      isLiveStreaming,
      gpsLogs,
      setGpsLogs,
      loadShipments,
      loadHistoricalLogs,
      selectShipmentForMap,
      startLiveTracking,
      stopLiveTracking,
      toggleLiveTracking,
      clearGpsLogsAction,
      resolveOrigin,
      resolveDestination
    }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}
