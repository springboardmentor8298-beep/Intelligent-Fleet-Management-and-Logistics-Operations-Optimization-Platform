import React, { useState, useEffect } from 'react';
import { fetchTrips, optimizeRoute, optimizeRouteMatrix, updateTripStatus } from '../api';
import { resolveLocationCoordsAsync } from '../utils/TrackingContext';
import TripSchedulerModal from '../components/TripSchedulerModal';

const DEFAULT_CORRIDOR_PRESETS = [
  {
    name: "🇮🇳 Chennai ➔ 🇱🇰 Colombo",
    origin: { lat: 13.0827, lng: 80.2707, name: 'Chennai Port Gateway, India' },
    dest: { lat: 6.9271, lng: 79.8612, name: 'Colombo Harbor Terminal, Sri Lanka' },
    isDefault: true
  },
  {
    name: "🇮🇳 Tuticorin ➔ 🇱🇰 Colombo",
    origin: { lat: 8.7642, lng: 78.1348, name: 'V.O.C Port Tuticorin, India' },
    dest: { lat: 6.9271, lng: 79.8612, name: 'Colombo Harbor Terminal, Sri Lanka' },
    isDefault: true
  },
  {
    name: "🇮🇳 Kochi ➔ 🇱🇰 Jaffna",
    origin: { lat: 9.9312, lng: 76.2673, name: 'Kochi Seaport Terminal, India' },
    dest: { lat: 9.6615, lng: 80.0255, name: 'Jaffna Regional Logistics Center, Sri Lanka' },
    isDefault: true
  },
  {
    name: "🇮🇳 Mumbai ➔ 🇮🇳 Bengaluru",
    origin: { lat: 18.9220, lng: 72.8347, name: 'Mumbai JNPT Logistics Hub, India' },
    dest: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru Logistics Depot, India' },
    isDefault: true
  },
  {
    name: "🇮🇳 New Delhi ➔ 🇮🇳 Chennai",
    origin: { lat: 28.6139, lng: 77.2090, name: 'New Delhi Cargo Terminal, India' },
    dest: { lat: 13.0827, lng: 80.2707, name: 'Chennai Port Gateway, India' },
    isDefault: true
  }
];

const QUICK_LOCATION_PILLS = [
  'Chennai', 'Colombo', 'Mumbai', 'Bengaluru', 'New Delhi', 'Tuticorin', 'Kochi', 'Jaffna', 'Hyderabad', 'Kolkata'
];

export default function RoutesPage() {
  const [trips, setTrips] = useState([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('Fastest Route');
  const [comparisonResults, setComparisonResults] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Dynamic corridors list (loaded from localStorage or defaults)
  const [corridors, setCorridors] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetflow_route_corridors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load stored corridors", e);
    }
    return DEFAULT_CORRIDOR_PRESETS;
  });

  // Current active corridor in simulator
  const [activeCorridorName, setActiveCorridorName] = useState(DEFAULT_CORRIDOR_PRESETS[0].name);
  const [testOrigin, setTestOrigin] = useState(DEFAULT_CORRIDOR_PRESETS[0].origin);
  const [testDest, setTestDest] = useState(DEFAULT_CORRIDOR_PRESETS[0].dest);

  // New Route Input Form State
  const [originInput, setOriginInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [customRouteName, setCustomRouteName] = useState('');
  const [addingRoute, setAddingRoute] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadTrips();
    // Run comparison for the initial active corridor
    runRouteComparison(testOrigin, testDest);
  }, []);

  const loadTrips = async () => {
    try {
      const res = await fetchTrips();
      setTrips(res.data || []);
    } catch (err) {
      console.error("Error loading trips", err);
    }
  };

  // Helper to parse coordinate strings (e.g. "13.0827, 80.2707" or "13.0827 80.2707")
  const parseCoordinateInput = (val) => {
    if (!val || typeof val !== 'string') return null;
    const parts = val.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, name: `Custom Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
      }
    }
    return null;
  };

  // Resolve input to lat, lng, name
  const resolveInputLocation = async (inputStr) => {
    const coord = parseCoordinateInput(inputStr);
    if (coord) return coord;

    const resolved = await resolveLocationCoordsAsync(inputStr);
    if (resolved && resolved.lat !== undefined && resolved.lng !== undefined) {
      return {
        lat: resolved.lat,
        lng: resolved.lng,
        name: resolved.name || inputStr.trim()
      };
    }
    return null;
  };

  // Compute 4 optimization profiles via backend API
  const runRouteComparison = async (originObj = testOrigin, destObj = testDest) => {
    setLoadingComparison(true);
    try {
      let results = null;

      // Try unified matrix calculation first
      try {
        const matrixRes = await optimizeRouteMatrix({
          origin_lat: originObj.lat,
          origin_lng: originObj.lng,
          destination_lat: destObj.lat,
          destination_lng: destObj.lng
        });
        if (matrixRes.data && matrixRes.data['Shortest Route']) {
          results = matrixRes.data;
        }
      } catch (e) {
        // Fallback to parallel single-strategy calls
      }

      if (!results) {
        const strategies = ['Shortest Route', 'Fastest Route', 'Traffic Avoidance', 'Fuel Efficient Route'];
        results = {};
        await Promise.all(
          strategies.map(async (strat) => {
            const res = await optimizeRoute({
              origin_lat: originObj.lat,
              origin_lng: originObj.lng,
              destination_lat: destObj.lat,
              destination_lng: destObj.lng,
              optimization_type: strat
            });
            results[strat] = res.data;
          })
        );
      }

      setComparisonResults(results);

      // Cache profiles into active corridor entry
      setCorridors(prev => {
        const updated = prev.map(c => {
          if (c.origin.lat === originObj.lat && c.origin.lng === originObj.lng &&
              c.dest.lat === destObj.lat && c.dest.lng === destObj.lng) {
            return { ...c, profiles: results, lastUpdated: new Date().toLocaleTimeString() };
          }
          return c;
        });
        try { localStorage.setItem('fleetflow_route_corridors', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      return results;
    } catch (err) {
      console.error("Error running route comparison", err);
      return null;
    } finally {
      setLoadingComparison(false);
    }
  };

  // Match check: Checks if a corridor with identical/proximate start & destination already exists
  const isSameRoute = (corridor, o, d) => {
    if (!corridor || !corridor.origin || !corridor.dest) return false;
    
    // Geographic proximity within ~5km
    const coordsMatch =
      Math.abs(corridor.origin.lat - o.lat) < 0.05 &&
      Math.abs(corridor.origin.lng - o.lng) < 0.05 &&
      Math.abs(corridor.dest.lat - d.lat) < 0.05 &&
      Math.abs(corridor.dest.lng - d.lng) < 0.05;

    if (coordsMatch) return true;

    // String name matching
    const cOrig = (corridor.origin.name || '').toLowerCase().trim();
    const cDest = (corridor.dest.name || '').toLowerCase().trim();
    const oName = (o.name || '').toLowerCase().trim();
    const dName = (d.name || '').toLowerCase().trim();

    if (cOrig === oName && cDest === dName) return true;
    if (cOrig.includes(oName) && cDest.includes(dName)) return true;
    if (oName.includes(cOrig) && dName.includes(cDest)) return true;

    return false;
  };

  // Add new route or update if already existing
  const handleAddOrUpdateRoute = async (e) => {
    if (e) e.preventDefault();
    if (!originInput.trim() || !destInput.trim()) {
      setAlertMessage({ type: 'error', text: 'Please enter both Start Point and Destination Point.' });
      return;
    }

    setAddingRoute(true);
    setAlertMessage(null);

    try {
      // 1. Resolve start point
      const originObj = await resolveInputLocation(originInput.trim());
      if (!originObj) {
        setAlertMessage({
          type: 'error',
          text: `Could not resolve Start Point "${originInput}". Enter a city name (e.g. Mumbai) or coordinates (e.g. 18.92, 72.83).`
        });
        setAddingRoute(false);
        return;
      }

      // 2. Resolve destination point
      const destObj = await resolveInputLocation(destInput.trim());
      if (!destObj) {
        setAlertMessage({
          type: 'error',
          text: `Could not resolve Destination Point "${destInput}". Enter a city name (e.g. Bengaluru) or coordinates (e.g. 12.97, 77.59).`
        });
        setAddingRoute(false);
        return;
      }

      // 3. Compute optimization profiles (Shortest, Fastest, Traffic Avoidance, Fuel Efficient)
      const results = await runRouteComparison(originObj, destObj);
      if (!results) {
        setAlertMessage({ type: 'error', text: 'Failed to calculate route profiles. Ensure backend API is active.' });
        setAddingRoute(false);
        return;
      }

      // 4. Check if route already exists
      const existingIdx = corridors.findIndex(c => isSameRoute(c, originObj, destObj));
      const autoName = `${originObj.name.split(',')[0]} ➔ ${destObj.name.split(',')[0]}`;
      const finalName = customRouteName.trim() || (existingIdx >= 0 ? corridors[existingIdx].name : `📍 ${autoName}`);

      let updatedList = [...corridors];

      if (existingIdx >= 0) {
        // Already exists: update its profiles and data
        const existing = corridors[existingIdx];
        updatedList[existingIdx] = {
          ...existing,
          name: customRouteName.trim() || existing.name,
          origin: originObj,
          dest: destObj,
          profiles: results,
          lastUpdated: new Date().toLocaleTimeString()
        };
        setAlertMessage({
          type: 'info',
          text: `Route between "${originObj.name.split(',')[0]}" and "${destObj.name.split(',')[0]}" already exists — updated with latest road calculation profiles!`
        });
        setActiveCorridorName(updatedList[existingIdx].name);
      } else {
        // Not present: add to list
        const newCorridor = {
          name: finalName,
          origin: originObj,
          dest: destObj,
          profiles: results,
          isCustom: true,
          lastUpdated: new Date().toLocaleTimeString()
        };
        updatedList = [newCorridor, ...updatedList];
        setAlertMessage({
          type: 'success',
          text: `Route "${finalName}" added to corridor matrix with all 4 optimization profiles!`
        });
        setActiveCorridorName(finalName);
      }

      setCorridors(updatedList);
      try { localStorage.setItem('fleetflow_route_corridors', JSON.stringify(updatedList)); } catch (e) {}
      setTestOrigin(originObj);
      setTestDest(destObj);
      setCustomRouteName('');
    } catch (err) {
      console.error("Error adding or updating route", err);
      setAlertMessage({ type: 'error', text: 'An unexpected error occurred while calculating route optimization.' });
    } finally {
      setAddingRoute(false);
    }
  };

  const selectCorridor = (preset) => {
    setActiveCorridorName(preset.name);
    setTestOrigin(preset.origin);
    setTestDest(preset.dest);
    setAlertMessage(null);

    // If pre-cached profiles exist, display immediately
    if (preset.profiles) {
      setComparisonResults(preset.profiles);
    } else {
      runRouteComparison(preset.origin, preset.dest);
    }
  };

  const deleteCorridor = (e, nameToDelete) => {
    e.stopPropagation();
    const updated = corridors.filter(c => c.name !== nameToDelete);
    setCorridors(updated);
    try { localStorage.setItem('fleetflow_route_corridors', JSON.stringify(updated)); } catch (e) {}
    if (activeCorridorName === nameToDelete && updated.length > 0) {
      selectCorridor(updated[0]);
    }
    setAlertMessage({ type: 'info', text: `Removed corridor "${nameToDelete}" from catalog.` });
  };

  const handleSwapInputs = () => {
    const temp = originInput;
    setOriginInput(destInput);
    setDestInput(temp);
  };

  const handleStatusChange = async (tripId, newStatus) => {
    try {
      await updateTripStatus(tripId, newStatus);
      loadTrips();
    } catch (err) {
      alert("Error updating trip status");
    }
  };

  return (
    <div style={routeStyles.page}>
      {/* Header */}
      <div style={routeStyles.headerRow}>
        <div>
          <div style={routeStyles.subtitle}>ROUTE OPTIMIZATION & SCHEDULING</div>
          <h1 style={routeStyles.title}>Multi-Criteria Route Optimization Engine</h1>
          <p style={routeStyles.desc}>
            Algorithmic dispatch planning comparing Shortest, Fastest, Traffic Avoidance, and Fuel-Efficient road models.
          </p>
        </div>

        <div>
          <button onClick={() => setIsSchedulerOpen(true)} style={routeStyles.primaryBtn}>
            ⚡ Dispatch & Schedule Trip
          </button>
        </div>
      </div>

      {/* Route Corridor Input & Optimizer Form Card */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📍</span> Add or Update Route Corridor
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              Enter Start Point and Destination Point to evaluate live road navigation profiles. If the route already exists, its profiles are updated; otherwise, it is added to your corridor catalog.
            </p>
          </div>
        </div>

        {alertMessage && (
          <div style={{
            ...routeStyles.alertBanner,
            backgroundColor: alertMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : (alertMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
            borderColor: alertMessage.type === 'error' ? '#ef4444' : (alertMessage.type === 'success' ? '#10b981' : '#38bdf8'),
            color: alertMessage.type === 'error' ? '#f87171' : (alertMessage.type === 'success' ? '#34d399' : '#38bdf8')
          }}>
            <span>{alertMessage.type === 'error' ? '⚠️' : (alertMessage.type === 'success' ? '✅' : 'ℹ️')}</span>
            <span>{alertMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleAddOrUpdateRoute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr)) 44px', gap: '12px', alignItems: 'flex-end' }}>
            {/* Start Point */}
            <div>
              <label style={routeStyles.inputLabel}>
                🟢 Start Point (Origin)
              </label>
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="e.g. Mumbai, Chennai, or 13.0827, 80.2707"
                style={routeStyles.textInput}
              />
            </div>

            {/* Destination Point */}
            <div>
              <label style={routeStyles.inputLabel}>
                🔴 Destination Point
              </label>
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="e.g. Bengaluru, Colombo, or 6.9271, 79.8612"
                style={routeStyles.textInput}
              />
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwapInputs}
              title="Swap Start Point and Destination"
              style={routeStyles.swapBtn}
            >
              ⇄
            </button>
          </div>

          {/* Quick Suggestions & Optional Name */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #64748b)' }}>Quick Hubs:</span>
              {QUICK_LOCATION_PILLS.map(loc => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => {
                    if (!originInput) setOriginInput(loc);
                    else if (!destInput) setDestInput(loc);
                    else setDestInput(loc);
                  }}
                  style={routeStyles.pillBtn}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                value={customRouteName}
                onChange={(e) => setCustomRouteName(e.target.value)}
                placeholder="Custom route name (optional)"
                style={{ ...routeStyles.textInput, width: '220px', padding: '8px 12px', fontSize: '12px' }}
              />
              <button
                type="submit"
                disabled={addingRoute}
                style={{
                  ...routeStyles.submitBtn,
                  opacity: addingRoute ? 0.7 : 1
                }}
              >
                {addingRoute ? '⏳ Optimizing...' : '⚡ Calculate & Add Route'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Strategy Comparison Simulator */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
              Route Strategy Comparison Matrix
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              Evaluating corridor: <b style={{ color: '#38bdf8' }}>{testOrigin.name}</b> → <b style={{ color: '#34d399' }}>{testDest.name}</b>
            </p>
          </div>
          <button
            onClick={() => runRouteComparison(testOrigin, testDest)}
            disabled={loadingComparison}
            style={routeStyles.recalculateBtn}
          >
            {loadingComparison ? 'Calculating...' : '🔄 Recalculate Live Profiles'}
          </button>
        </div>

        {/* Corridor Selector Chips */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Select Corridor:
          </span>
          {corridors.map((preset) => {
            const isActive = activeCorridorName === preset.name;
            return (
              <div
                key={preset.name}
                onClick={() => selectCorridor(preset)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isActive ? '#0284c7' : 'var(--bg-card-sub, #162030)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  border: `1px solid ${isActive ? '#38bdf8' : 'var(--border-subtle, #334155)'}`,
                  borderRadius: '9999px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{preset.name}</span>
                {preset.isCustom && (
                  <span
                    onClick={(e) => deleteCorridor(e, preset.name)}
                    title="Remove custom corridor"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '10px',
                      marginLeft: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 4 Cards Grid - Matches user specification */}
        <div style={routeStyles.strategyGrid}>
          {[
            { key: 'Shortest Route', title: 'Shortest Route', icon: '📏', badge: 'Min Distance', color: '#38bdf8' },
            { key: 'Fastest Route', title: 'Fastest Route', icon: '⚡', badge: 'High Velocity', color: '#818cf8' },
            { key: 'Traffic Avoidance', title: 'Traffic Avoidance', icon: '🚦', badge: 'Congestion Bypass', color: '#34d399' },
            { key: 'Fuel Efficient Route', title: 'Fuel Efficient Route', icon: '🍃', badge: 'Eco Cruising', color: '#fbbf24' }
          ].map((strat) => {
            const data = comparisonResults ? comparisonResults[strat.key] : null;
            const isSelected = selectedStrategy === strat.key;

            return (
              <div
                key={strat.key}
                onClick={() => setSelectedStrategy(strat.key)}
                style={{
                  ...routeStyles.stratCard,
                  borderColor: isSelected ? strat.color : 'var(--border-subtle, #1e293b)',
                  background: isSelected ? 'var(--bg-card-hover, rgba(30, 41, 59, 0.7))' : 'var(--bg-card, #0d131f)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{strat.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>{strat.title}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 6px', borderRadius: '4px', background: `${strat.color}20`, color: strat.color }}>
                    {strat.badge}
                  </span>
                </div>

                {data ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Road Distance:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {data.total_distance_km} km
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Est. Travel Time:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: strat.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {data.estimated_duration_mins} mins
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Fuel Consumption:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                        {data.estimated_fuel_liters} L
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', borderTop: '1px solid var(--border-subtle, #1e293b)', paddingTop: '8px', marginTop: '4px', lineHeight: 1.4 }}>
                      {data.profile_description}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    {loadingComparison ? 'Calculating live model...' : 'No profile data loaded.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Corridors Matrix Catalog Table */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
              Optimized Route Corridors Catalog
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              All evaluated route corridors in the system ({corridors.length} total). Click any corridor to inspect its 4 strategy metrics.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Reset all custom corridors back to default presets?")) {
                setCorridors(DEFAULT_CORRIDOR_PRESETS);
                localStorage.removeItem('fleetflow_route_corridors');
                selectCorridor(DEFAULT_CORRIDOR_PRESETS[0]);
              }
            }}
            style={{
              background: 'transparent',
              color: 'var(--text-muted, #64748b)',
              border: '1px solid var(--border-subtle, #334155)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Reset to Default Corridors
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={routeStyles.table}>
            <thead>
              <tr style={routeStyles.thRow}>
                <th style={routeStyles.th}>Corridor Route</th>
                <th style={routeStyles.th}>Origin & Destination Coordinates</th>
                <th style={routeStyles.th}>📏 Shortest</th>
                <th style={routeStyles.th}>⚡ Fastest</th>
                <th style={routeStyles.th}>🚦 Traffic Avoid</th>
                <th style={routeStyles.th}>🍃 Fuel Efficient</th>
                <th style={{ ...routeStyles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {corridors.map((c) => {
                const isActive = activeCorridorName === c.name;
                const p = c.profiles || {};
                const shortest = p['Shortest Route'];
                const fastest = p['Fastest Route'];
                const traffic = p['Traffic Avoidance'];
                const fuel = p['Fuel Efficient Route'];

                return (
                  <tr
                    key={c.name}
                    style={{
                      ...routeStyles.tr,
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ ...routeStyles.td, fontWeight: '700', color: isActive ? '#38bdf8' : 'var(--text-primary, #f8fafc)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.name}</span>
                        {isActive && (
                          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                            ACTIVE
                          </span>
                        )}
                        {c.isCustom && (
                          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                            CUSTOM
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...routeStyles.td, fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', fontFamily: 'JetBrains Mono, monospace' }}>
                      <div>Origin: {c.origin.lat.toFixed(4)}, {c.origin.lng.toFixed(4)}</div>
                      <div>Dest: {c.dest.lat.toFixed(4)}, {c.dest.lng.toFixed(4)}</div>
                    </td>
                    <td style={{ ...routeStyles.td, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {shortest ? (
                        <div>
                          <div><b>{shortest.total_distance_km}</b> km</div>
                          <div style={{ color: '#38bdf8', fontSize: '11px' }}>{shortest.estimated_duration_mins}m | {shortest.estimated_fuel_liters}L</div>
                        </div>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ ...routeStyles.td, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {fastest ? (
                        <div>
                          <div><b>{fastest.total_distance_km}</b> km</div>
                          <div style={{ color: '#818cf8', fontSize: '11px' }}>{fastest.estimated_duration_mins}m | {fastest.estimated_fuel_liters}L</div>
                        </div>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ ...routeStyles.td, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {traffic ? (
                        <div>
                          <div><b>{traffic.total_distance_km}</b> km</div>
                          <div style={{ color: '#34d399', fontSize: '11px' }}>{traffic.estimated_duration_mins}m | {traffic.estimated_fuel_liters}L</div>
                        </div>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ ...routeStyles.td, fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {fuel ? (
                        <div>
                          <div><b>{fuel.total_distance_km}</b> km</div>
                          <div style={{ color: '#fbbf24', fontSize: '11px' }}>{fuel.estimated_duration_mins}m | {fuel.estimated_fuel_liters}L</div>
                        </div>
                      ) : <span style={{ color: '#64748b' }}>—</span>}
                    </td>
                    <td style={{ ...routeStyles.td, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => selectCorridor(c)}
                          style={{
                            background: isActive ? '#0284c7' : 'var(--bg-card-hover, #162030)',
                            color: '#ffffff',
                            border: '1px solid var(--border-subtle, #334155)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? '✓ Selected' : 'View Matrix'}
                        </button>
                        {c.isCustom && (
                          <button
                            onClick={(e) => deleteCorridor(e, c.name)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Scheduled Trips Table */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
            Active Scheduled Logistics Trips
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
            {trips.length} Trips in System
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={routeStyles.table}>
            <thead>
              <tr style={routeStyles.thRow}>
                <th style={routeStyles.th}>Trip Code</th>
                <th style={routeStyles.th}>Vehicle Assigned</th>
                <th style={routeStyles.th}>Route Optimization</th>
                <th style={routeStyles.th}>Planned Distance</th>
                <th style={routeStyles.th}>Est. Duration</th>
                <th style={routeStyles.th}>Status</th>
                <th style={{ ...routeStyles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} style={routeStyles.tr}>
                  <td style={{ ...routeStyles.td, fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {t.trip_code}
                  </td>
                  <td style={{ ...routeStyles.td, color: '#f8fafc' }}>
                    🚛 {t.vehicle_id || 'Unassigned'}
                  </td>
                  <td style={routeStyles.td}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{t.route_type}</span>
                  </td>
                  <td style={{ ...routeStyles.td, fontFamily: 'JetBrains Mono, monospace' }}>
                    {t.total_distance_km} km
                  </td>
                  <td style={{ ...routeStyles.td, fontFamily: 'JetBrains Mono, monospace' }}>
                    {t.estimated_duration_mins} mins
                  </td>
                  <td style={routeStyles.td}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: t.status === 'In Transit' ? 'rgba(56, 189, 248, 0.15)' : (t.status === 'Completed' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(129, 140, 248, 0.15)'),
                      color: t.status === 'In Transit' ? '#38bdf8' : (t.status === 'Completed' ? '#34d399' : '#818cf8')
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ ...routeStyles.td, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      {t.status === 'Scheduled' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'In Transit')}
                          style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Dispatch Trip
                        </button>
                      )}
                      {t.status === 'In Transit' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'Completed')}
                          style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ ...routeStyles.td, textAlign: 'center', color: '#64748b', padding: '32px' }}>
                    No trips currently scheduled. Click "⚡ Dispatch & Schedule Trip" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TripSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onTripScheduled={() => { loadTrips(); }}
      />
    </div>
  );
}

const routeStyles = {
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
    color: '#34d399',
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
  primaryBtn: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 22px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)'
  },
  card: {
    background: 'var(--bg-card, #0d131f)',
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-card)'
  },
  inputLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase',
    marginBottom: '6px'
  },
  textInput: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle, #334155)',
    background: 'var(--bg-card-sub, #070a0f)',
    color: 'var(--text-primary, #f8fafc)',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  swapBtn: {
    width: '44px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle, #334155)',
    background: 'var(--bg-card-hover, #162030)',
    color: '#38bdf8',
    fontSize: '18px',
    cursor: 'pointer',
    marginBottom: '1px'
  },
  pillBtn: {
    background: 'var(--bg-card-sub, #162030)',
    color: 'var(--text-secondary, #94a3b8)',
    border: '1px solid var(--border-subtle, #334155)',
    borderRadius: '9999px',
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 0 12px rgba(2, 132, 199, 0.35)',
    whiteSpace: 'nowrap'
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    marginBottom: '16px'
  },
  recalculateBtn: {
    background: 'var(--bg-card-hover, #162030)',
    color: '#38bdf8',
    border: '1px solid var(--border-subtle, #1e3a5f)',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  strategyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px'
  },
  stratCard: {
    border: '1px solid var(--border-subtle, #1e293b)',
    borderRadius: '12px',
    padding: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
    padding: '14px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted, #64748b)',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle, #131b2b)'
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: 'var(--text-secondary, #cbd5e1)'
  }
};
