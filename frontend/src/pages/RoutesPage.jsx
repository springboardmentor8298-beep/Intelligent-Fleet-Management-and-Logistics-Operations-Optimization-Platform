import React, { useState, useEffect } from 'react';
import { fetchTrips, optimizeRoute, updateTripStatus } from '../api';
import TripSchedulerModal from '../components/TripSchedulerModal';

const CORRIDOR_PRESETS = [
  {
    name: "🇮🇳 Chennai ➔ 🇱🇰 Colombo",
    origin: { lat: 13.0827, lng: 80.2707, name: 'Chennai Port Gateway, India' },
    dest: { lat: 6.9271, lng: 79.8612, name: 'Colombo Harbor Terminal, Sri Lanka' }
  },
  {
    name: "🇮🇳 Tuticorin ➔ 🇱🇰 Colombo",
    origin: { lat: 8.7642, lng: 78.1348, name: 'V.O.C Port Tuticorin, India' },
    dest: { lat: 6.9271, lng: 79.8612, name: 'Colombo Harbor Terminal, Sri Lanka' }
  },
  {
    name: "🇮🇳 Kochi ➔ 🇱🇰 Jaffna",
    origin: { lat: 9.9312, lng: 76.2673, name: 'Kochi Seaport Terminal, India' },
    dest: { lat: 9.6615, lng: 80.0255, name: 'Jaffna Regional Logistics Center, Sri Lanka' }
  },
  {
    name: "🇮🇳 Mumbai ➔ 🇮🇳 Bengaluru",
    origin: { lat: 18.9220, lng: 72.8347, name: 'Mumbai JNPT Logistics Hub, India' },
    dest: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru Logistics Depot, India' }
  },
  {
    name: "🇮🇳 New Delhi ➔ 🇮🇳 Chennai",
    origin: { lat: 28.6139, lng: 77.2090, name: 'New Delhi Cargo Terminal, India' },
    dest: { lat: 13.0827, lng: 80.2707, name: 'Chennai Port Gateway, India' }
  }
];

export default function RoutesPage() {
  const [trips, setTrips] = useState([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('Fastest Route');
  const [comparisonResults, setComparisonResults] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Corridor Route Points (India & Sri Lanka Corridor)
  const [testOrigin, setTestOrigin] = useState(CORRIDOR_PRESETS[0].origin);
  const [testDest, setTestDest] = useState(CORRIDOR_PRESETS[0].dest);
  const [activeCorridorName, setActiveCorridorName] = useState(CORRIDOR_PRESETS[0].name);

  useEffect(() => {
    loadTrips();
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

  const runRouteComparison = async (originObj = testOrigin, destObj = testDest) => {
    setLoadingComparison(true);
    try {
      const strategies = ['Shortest Route', 'Fastest Route', 'Traffic Avoidance', 'Fuel Efficient Route'];
      const results = {};

      for (const strat of strategies) {
        const res = await optimizeRoute({
          origin_lat: originObj.lat,
          origin_lng: originObj.lng,
          destination_lat: destObj.lat,
          destination_lng: destObj.lng,
          optimization_type: strat
        });
        results[strat] = res.data;
      }
      setComparisonResults(results);
    } catch (err) {
      console.error("Error running route comparison", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const selectCorridor = (preset) => {
    setActiveCorridorName(preset.name);
    setTestOrigin(preset.origin);
    setTestDest(preset.dest);
    runRouteComparison(preset.origin, preset.dest);
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
            Algorithmic dispatch planning comparing Shortest, Fastest, Traffic Avoidance, and Fuel-Efficient models.
          </p>
        </div>

        <div>
          <button onClick={() => setIsSchedulerOpen(true)} style={routeStyles.primaryBtn}>
            ⚡ Dispatch & Schedule Trip
          </button>
        </div>
      </div>

      {/* Strategy Comparison Simulator */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
              Route Strategy Comparison Matrix
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Evaluating corridor: <b style={{ color: '#38bdf8' }}>{testOrigin.name}</b> → <b style={{ color: '#34d399' }}>{testDest.name}</b>
            </p>
          </div>
          <button onClick={() => runRouteComparison(testOrigin, testDest)} disabled={loadingComparison} style={routeStyles.recalculateBtn}>
            {loadingComparison ? 'Calculating...' : '🔄 Recalculate Live Profiles'}
          </button>
        </div>

        {/* Corridor Presets Selector Chips */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Select Corridor:</span>
          {CORRIDOR_PRESETS.map((preset) => {
            const isActive = activeCorridorName === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => selectCorridor(preset)}
                style={{
                  background: isActive ? '#0284c7' : '#162030',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: `1px solid ${isActive ? '#38bdf8' : '#334155'}`,
                  borderRadius: '9999px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* 4 Cards Grid */}
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
                  borderColor: isSelected ? strat.color : '#1e293b',
                  background: isSelected ? 'rgba(30, 41, 59, 0.7)' : '#0d131f'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{strat.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>{strat.title}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 6px', borderRadius: '4px', background: `${strat.color}20`, color: strat.color }}>
                    {strat.badge}
                  </span>
                </div>

                {data ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Road Distance:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{data.total_distance_km} km</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Est. Travel Time:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: strat.color, fontFamily: 'JetBrains Mono' }}>{data.estimated_duration_mins} mins</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Fuel Consumption:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399', fontFamily: 'JetBrains Mono' }}>{data.estimated_fuel_liters} L</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '8px', marginTop: '4px' }}>
                      {data.profile_description}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    Loading model...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Scheduled Trips Table */}
      <div style={routeStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#f8fafc' }}>
            Active Scheduled Logistics Trips
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
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
                  <td style={{ ...routeStyles.td, fontWeight: '700', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                    {t.trip_code}
                  </td>
                  <td style={{ ...routeStyles.td, color: '#f8fafc' }}>
                    🚛 {t.vehicle_id || 'Unassigned'}
                  </td>
                  <td style={routeStyles.td}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{t.route_type}</span>
                  </td>
                  <td style={{ ...routeStyles.td, fontFamily: 'JetBrains Mono' }}>
                    {t.total_distance_km} km
                  </td>
                  <td style={{ ...routeStyles.td, fontFamily: 'JetBrains Mono' }}>
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
    color: '#f8fafc'
  },
  desc: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8'
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
    background: '#0d131f',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
  },
  recalculateBtn: {
    background: '#162030',
    color: '#38bdf8',
    border: '1px solid #1e3a5f',
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
    border: '1px solid #1e293b',
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
    background: '#090d15',
    borderBottom: '1px solid #1e293b'
  },
  th: {
    padding: '14px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid #131b2b'
  },
  td: {
    padding: '16px',
    fontSize: '13px',
    color: '#cbd5e1'
  }
};
