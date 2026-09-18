import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =====================================================
// FIX DEFAULT LEAFLET MARKER ICON
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// =====================================================
// ROUTES
// =====================================================

const routes = [
  {
    id: 1,
    vehicle: "AP39AB1234",
    driver: "Ravi",
    source: "Srikakulam",
    current: "Vizianagaram",
    destination: "Visakhapatnam",

    points: [
      [18.2949, 83.8938], // Srikakulam
      [18.2750, 83.8200],
      [18.2500, 83.7300],
      [18.2200, 83.6300],
      [18.2000, 83.5400],
      [18.1800, 83.4500],
      [18.1067, 83.3956], // Vizianagaram
      [18.0500, 83.3500],
      [17.9800, 83.3100],
      [17.9200, 83.2700],
      [17.8500, 83.2500],
      [17.7800, 83.2300],
      [17.6868, 83.2185], // Visakhapatnam
    ],

    currentIndex: 6,
  },

  {
    id: 2,
    vehicle: "AP40CD5678",
    driver: "Suresh",
    source: "Vizianagaram",
    current: "Bobbili",
    destination: "Parvathipuram",

    points: [
      [18.1067, 83.3956], // Vizianagaram
      [18.1200, 83.4200],
      [18.1400, 83.4500],
      [18.1600, 83.4800],
      [18.1800, 83.5100], // Bobbili area
      [18.2500, 83.5800],
      [18.2800, 83.6200],
      [18.2900, 83.6500], // Parvathipuram area
    ],

    currentIndex: 4,
  },

  {
    id: 3,
    vehicle: "AP05EF9012",
    driver: "Ramesh",
    source: "Rajahmundry",
    current: "Anaparthi",
    destination: "Kakinada",

    points: [
      [17.0005, 81.8040], // Rajahmundry
      [16.9900, 81.8300],
      [16.9800, 81.8600],
      [16.9700, 81.8900],
      [16.9500, 81.9200], // Anaparthi area
      [16.9700, 81.9800],
      [16.9800, 82.0500],
      [16.9900, 82.1200],
      [16.9891, 82.2475], // Kakinada
    ],

    currentIndex: 4,
  },

  {
    id: 4,
    vehicle: "AP16GH3456",
    driver: "Kumar",
    source: "Kakinada",
    current: "Yanam",
    destination: "Amalapuram",

    points: [
      [16.9891, 82.2475], // Kakinada
      [16.9700, 82.2300],
      [16.9500, 82.2100],
      [16.9300, 82.1900], // Yanam area
      [16.9000, 82.1600],
      [16.8500, 82.1200],
      [16.8000, 82.0800],
      [16.7500, 82.0400],
      [16.5787, 82.0060], // Amalapuram
    ],

    currentIndex: 3,
  },

  {
    id: 5,
    vehicle: "AP37JK7890",
    driver: "Raju",
    source: "Vijayawada",
    current: "Mangalagiri",
    destination: "Guntur",

    points: [
      [16.5062, 80.6480], // Vijayawada
      [16.5000, 80.6300],
      [16.4900, 80.6100],
      [16.4700, 80.5900], // Mangalagiri area
      [16.4500, 80.5500],
      [16.4200, 80.5100],
      [16.3800, 80.4700],
      [16.3067, 80.4365], // Guntur
    ],

    currentIndex: 3,
  },

  {
    id: 6,
    vehicle: "AP31LM2468",
    driver: "Naresh",
    source: "Visakhapatnam",
    current: "Anakapalle",
    destination: "Narsipatnam",

    points: [
      [17.6868, 83.2185], // Visakhapatnam
      [17.7000, 83.1700],
      [17.7000, 83.1200],
      [17.6910, 83.0030], // Anakapalle
      [17.7000, 82.9500],
      [17.7200, 82.9000],
      [17.7200, 82.8000],
      [17.6700, 82.6000],
      [17.6650, 82.6100], // Narsipatnam area
    ],

    currentIndex: 3,
  },
];

// =====================================================
// MAP FIT COMPONENT
// =====================================================

function FitRoute({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [40, 40],
    });
  }, [map, points]);

  return null;
}

// =====================================================
// CURRENT VEHICLE ICON
// =====================================================

const vehicleIcon = L.divIcon({
  className: "vehicle-marker",

  html: `
    <div style="
      width:46px;
      height:46px;
      border-radius:50%;
      background:#2563eb;
      border:4px solid white;
      box-shadow:0 3px 15px rgba(0,0,0,0.35);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:25px;
    ">
      🚚
    </div>
  `,

  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

// =====================================================
// START ICON
// =====================================================

const startIcon = L.divIcon({
  className: "start-marker",

  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#16a34a;
      border:4px solid white;
      box-shadow:0 3px 12px rgba(0,0,0,0.3);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      font-weight:bold;
    ">
      S
    </div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// =====================================================
// DESTINATION ICON
// =====================================================

const destinationIcon = L.divIcon({
  className: "destination-marker",

  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#dc2626;
      border:4px solid white;
      box-shadow:0 3px 12px rgba(0,0,0,0.3);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      font-weight:bold;
    ">
      D
    </div>
  `,

  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// =====================================================
// MAIN COMPONENT
// =====================================================

function RealTimeTracking() {
  const [selectedRouteId, setSelectedRouteId] = useState(1);

  const [currentIndex, setCurrentIndex] = useState(
    routes[0].currentIndex
  );

  const [isTracking, setIsTracking] = useState(false);

  // ===================================================
  // SELECTED ROUTE
  // ===================================================

  const selectedRoute = useMemo(() => {
    return routes.find(
      (route) => route.id === Number(selectedRouteId)
    );
  }, [selectedRouteId]);

  // ===================================================
  // WHEN ROUTE CHANGES
  // ===================================================

  useEffect(() => {
    if (!selectedRoute) return;

    setCurrentIndex(selectedRoute.currentIndex);

    setIsTracking(false);
  }, [selectedRoute]);

  // ===================================================
  // CURRENT POSITION
  // ===================================================

  const currentPosition =
    selectedRoute.points[currentIndex];

  // ===================================================
  // TRAVELLED ROUTE
  // ===================================================

  const travelledRoute =
    selectedRoute.points.slice(
      0,
      currentIndex + 1
    );

  // ===================================================
  // REMAINING ROUTE
  // ===================================================

  const remainingRoute =
    selectedRoute.points.slice(
      currentIndex
    );

  // ===================================================
  // PROGRESS
  // ===================================================

  const progress = Math.round(
    (currentIndex /
      (selectedRoute.points.length - 1)) *
      100
  );

  // ===================================================
  // SIMULATE REAL TIME MOVEMENT
  // ===================================================

  useEffect(() => {
    if (!isTracking) return;

    const timer = setInterval(() => {
      setCurrentIndex((previousIndex) => {
        if (
          previousIndex >=
          selectedRoute.points.length - 1
        ) {
          setIsTracking(false);

          return previousIndex;
        }

        return previousIndex + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isTracking, selectedRoute]);

  // ===================================================
  // START TRACKING
  // ===================================================

  const handleStartTracking = () => {
    if (
      currentIndex >=
      selectedRoute.points.length - 1
    ) {
      setCurrentIndex(
        selectedRoute.currentIndex
      );
    }

    setIsTracking(true);
  };

  // ===================================================
  // STOP TRACKING
  // ===================================================

  const handleStopTracking = () => {
    setIsTracking(false);
  };

  // ===================================================
  // RESET
  // ===================================================

  const handleReset = () => {
    setCurrentIndex(
      selectedRoute.currentIndex
    );

    setIsTracking(false);
  };

  // ===================================================
  // DISPLAY CURRENT LOCATION
  // ===================================================

  const getCurrentLocation = () => {
    if (currentIndex === 0) {
      return selectedRoute.source;
    }

    if (
      currentIndex ===
      selectedRoute.points.length - 1
    ) {
      return selectedRoute.destination;
    }

    return selectedRoute.current;
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <section
      style={{
        width: "100%",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >

        <h2
          style={{
            fontSize: "30px",
            color: "#172033",
            marginBottom: "8px",
          }}
        >
          🔄 Real-Time Tracking
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Monitor vehicle movement from
          starting location to destination.
        </p>

      </div>

      {/* =================================================
          CONTROL PANEL
      ================================================= */}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "22px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >

        {/* ROUTE SELECT */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "15px",
            alignItems: "end",
          }}
        >

          <div>

            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              🚚 Select Vehicle / Route
            </label>

            <select
              value={selectedRouteId}
              onChange={(e) =>
                setSelectedRouteId(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#172033",
                fontSize: "15px",
              }}
            >

              {routes.map((route) => (
                <option
                  key={route.id}
                  value={route.id}
                >
                  {route.vehicle} —{" "}
                  {route.source} →{" "}
                  {route.destination}
                </option>
              ))}

            </select>

          </div>

          {/* START */}

          <button
            onClick={handleStartTracking}
            disabled={isTracking}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "7px",
              background:
                isTracking
                  ? "#94a3b8"
                  : "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              cursor:
                isTracking
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            ▶ Start Tracking
          </button>

          {/* STOP */}

          <button
            onClick={handleStopTracking}
            disabled={!isTracking}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "7px",
              background:
                !isTracking
                  ? "#cbd5e1"
                  : "#dc2626",
              color: "#ffffff",
              fontWeight: "600",
              cursor:
                !isTracking
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            ⏹ Stop
          </button>

          {/* RESET */}

          <button
            onClick={handleReset}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "7px",
              background: "#64748b",
              color: "#ffffff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🔄 Reset
          </button>

        </div>

        {/* =================================================
            VEHICLE INFORMATION
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "20px",
          }}
        >

          {/* VEHICLE */}

          <div
            style={{
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#64748b",
              }}
            >
              VEHICLE
            </small>

            <br />

            <strong>
              🚚 {selectedRoute.vehicle}
            </strong>

          </div>

          {/* DRIVER */}

          <div
            style={{
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#64748b",
              }}
            >
              DRIVER
            </small>

            <br />

            <strong>
              👨‍✈️ {selectedRoute.driver}
            </strong>

          </div>

          {/* START */}

          <div
            style={{
              background: "#f0fdf4",
              border:
                "1px solid #bbf7d0",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#15803d",
              }}
            >
              🟢 START
            </small>

            <br />

            <strong>
              {selectedRoute.source}
            </strong>

          </div>

          {/* CURRENT */}

          <div
            style={{
              background: "#eff6ff",
              border:
                "1px solid #bfdbfe",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#1d4ed8",
              }}
            >
              🚚 CURRENT POSITION
            </small>

            <br />

            <strong>
              {getCurrentLocation()}
            </strong>

          </div>

          {/* DESTINATION */}

          <div
            style={{
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#b91c1c",
              }}
            >
              🔴 DESTINATION
            </small>

            <br />

            <strong>
              {selectedRoute.destination}
            </strong>

          </div>

          {/* PROGRESS */}

          <div
            style={{
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
              padding: "15px",
              borderRadius: "8px",
            }}
          >

            <small
              style={{
                color: "#64748b",
              }}
            >
              📊 PROGRESS
            </small>

            <br />

            <strong>
              {progress}%
            </strong>

          </div>

        </div>

        {/* =================================================
            PROGRESS BAR
        ================================================= */}

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: "6px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >

            <span>
              {selectedRoute.source}
            </span>

            <span>
              {selectedRoute.destination}
            </span>

          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#e2e8f0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#2563eb",
                transition:
                  "width 1s ease",
              }}
            />

          </div>

        </div>

      </div>

      {/* =================================================
          MAP
      ================================================= */}

      <div
        style={{
          width: "100%",
          height: "600px",
          borderRadius: "12px",
          overflow: "hidden",
          border:
            "1px solid #cbd5e1",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >

        <MapContainer
          center={currentPosition}
          zoom={9}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          {/* OPEN STREET MAP */}

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* FIT ROUTE */}

          <FitRoute
            points={selectedRoute.points}
          />

          {/* =================================================
              COMPLETE ROUTE
          ================================================= */}

          <Polyline
            positions={
              selectedRoute.points
            }
            pathOptions={{
              color: "#94a3b8",
              weight: 5,
              opacity: 0.5,
            }}
          />

          {/* =================================================
              TRAVELLED ROUTE
          ================================================= */}

          <Polyline
            positions={travelledRoute}
            pathOptions={{
              color: "#2563eb",
              weight: 8,
              opacity: 0.95,
            }}
          />

          {/* =================================================
              REMAINING ROUTE
          ================================================= */}

          <Polyline
            positions={remainingRoute}
            pathOptions={{
              color: "#f59e0b",
              weight: 5,
              opacity: 0.8,
              dashArray: "10 10",
            }}
          />

          {/* =================================================
              START MARKER
          ================================================= */}

          <Marker
            position={
              selectedRoute.points[0]
            }
            icon={startIcon}
          >

            <Popup>

              <strong>
                🟢 Starting Location
              </strong>

              <br />

              {selectedRoute.source}

              <br />

              Vehicle:
              {" "}
              {selectedRoute.vehicle}

            </Popup>

          </Marker>

          {/* =================================================
              CURRENT VEHICLE
          ================================================= */}

          <Marker
            position={currentPosition}
            icon={vehicleIcon}
          >

            <Popup>

              <strong>
                🚚 Current Vehicle Position
              </strong>

              <br />

              Vehicle:
              {" "}
              {selectedRoute.vehicle}

              <br />

              Driver:
              {" "}
              {selectedRoute.driver}

              <br />

              Current:
              {" "}
              {getCurrentLocation()}

              <br />

              Progress:
              {" "}
              {progress}%

            </Popup>

          </Marker>

          {/* =================================================
              DESTINATION MARKER
          ================================================= */}

          <Marker
            position={
              selectedRoute.points[
                selectedRoute.points.length - 1
              ]
            }
            icon={destinationIcon}
          >

            <Popup>

              <strong>
                🔴 Destination
              </strong>

              <br />

              {selectedRoute.destination}

            </Popup>

          </Marker>

        </MapContainer>

      </div>

      {/* =================================================
          LEGEND
      ================================================= */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginTop: "15px",
          padding: "15px",
          background: "#ffffff",
          border:
            "1px solid #e2e8f0",
          borderRadius: "10px",
        }}
      >

        <div>
          🟢 <strong>Start</strong>
        </div>

        <div>
          🔵 <strong>Travelled</strong>
        </div>

        <div>
          🟠 <strong>Remaining</strong>
        </div>

        <div>
          🚚 <strong>Current Vehicle</strong>
        </div>

        <div>
          🔴 <strong>Destination</strong>
        </div>

      </div>

    </section>
  );
}

export default RealTimeTracking;