import React, { useState } from "react";

function TrafficAwareRoutes() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Traffic-aware route data
  // Different routes can be added here later.
  const trafficRoutes = {
    "rajamundry-kakinada": {
      source: "Rajahmundry",
      destination: "Kakinada",
      route: [
        "Rajahmundry",
        "Anaparthi",
        "Biccavolu",
        "Samalkota",
        "Kakinada",
      ],
      distance: 65,
      normalTime: 1.5,
      trafficTime: 2.0,
      trafficLevel: "Medium",
      delay: 30,
      trafficAreas: ["Biccavolu", "Samalkota"],
    },

    "rajamundry-vizianagaram": {
      source: "Rajahmundry",
      destination: "Vizianagaram",
      route: [
        "Rajahmundry",
        "Anaparthi",
        "Kakinada",
        "Anakapalli",
        "Visakhapatnam",
        "Vizianagaram",
      ],
      distance: 210,
      normalTime: 4.0,
      trafficTime: 5.0,
      trafficLevel: "High",
      delay: 60,
      trafficAreas: ["Kakinada", "Anakapalli", "Visakhapatnam"],
    },

    "srikakulam-visakhapatnam": {
      source: "Srikakulam",
      destination: "Visakhapatnam",
      route: [
        "Srikakulam",
        "Ponduru",
        "Chipurupalle",
        "Vizianagaram",
        "Anandapuram",
        "Visakhapatnam",
      ],
      distance: 115,
      normalTime: 2.5,
      trafficTime: 3.25,
      trafficLevel: "Medium",
      delay: 45,
      trafficAreas: ["Vizianagaram", "Anandapuram"],
    },

    "vizianagaram-visakhapatnam": {
      source: "Vizianagaram",
      destination: "Visakhapatnam",
      route: [
        "Vizianagaram",
        "Kothavalasa",
        "Pendurthi",
        "Madhurawada",
        "Visakhapatnam",
      ],
      distance: 62,
      normalTime: 1.5,
      trafficTime: 2.25,
      trafficLevel: "High",
      delay: 45,
      trafficAreas: ["Pendurthi", "Madhurawada"],
    },

    "kakinada-visakhapatnam": {
      source: "Kakinada",
      destination: "Visakhapatnam",
      route: [
        "Kakinada",
        "Samalkota",
        "Annavaram",
        "Tuni",
        "Anakapalli",
        "Visakhapatnam",
      ],
      distance: 150,
      normalTime: 3.0,
      trafficTime: 3.75,
      trafficLevel: "Medium",
      delay: 45,
      trafficAreas: ["Anakapalli"],
    },

    "srikakulam-vizianagaram": {
      source: "Srikakulam",
      destination: "Vizianagaram",
      route: [
        "Srikakulam",
        "Ponduru",
        "Chipurupalle",
        "Vizianagaram",
      ],
      distance: 65,
      normalTime: 1.5,
      trafficTime: 2.0,
      trafficLevel: "Low",
      delay: 30,
      trafficAreas: ["Chipurupalle"],
    },
  };

  const formatTime = (hours) => {
    const totalMinutes = Math.round(hours * 60);

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) {
      return `${m} minutes`;
    }

    if (m === 0) {
      return `${h} hour${h > 1 ? "s" : ""}`;
    }

    return `${h} hour${h > 1 ? "s" : ""} ${m} minutes`;
  };

  const findTrafficRoute = () => {
    setError("");
    setResult(null);

    if (!source.trim() || !destination.trim()) {
      setError("Please enter both source and destination.");
      return;
    }

    const sourceName = source.trim().toLowerCase();
    const destinationName = destination.trim().toLowerCase();

    const key = `${sourceName}-${destinationName}`;

    let route = trafficRoutes[key];

    // Also support reverse direction
    if (!route) {
      const reverseKey = `${destinationName}-${sourceName}`;
      const reverseRoute = trafficRoutes[reverseKey];

      if (reverseRoute) {
        route = {
          ...reverseRoute,
          source: source.trim(),
          destination: destination.trim(),
          route: [...reverseRoute.route].reverse(),
        };
      }
    }

    if (!route) {
      setError(
        "Traffic-aware route is not available for this source and destination yet."
      );
      return;
    }

    setResult(route);
  };

  const clearRoute = () => {
    setSource("");
    setDestination("");
    setResult(null);
    setError("");
  };

  const getTrafficStyle = (level) => {
    if (level === "High") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };
    }

    if (level === "Medium") {
      return {
        background: "#fef3c7",
        color: "#b45309",
      };
    }

    return {
      background: "#dcfce7",
      color: "#15803d",
    };
  };

  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        paddingBottom: "40px",
      }}
    >
      {/* PAGE HEADER */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "28px",
          marginBottom: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            color: "#172033",
          }}
        >
          🚦 Traffic-Aware Routes
        </h1>

        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Plan routes based on current traffic conditions and estimated delay
        </p>
      </div>

      {/* SEARCH SECTION */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#172033",
            textAlign: "center",
          }}
        >
          🚦 Check Traffic-Aware Route
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto auto",
            gap: "14px",
            alignItems: "end",
          }}
        >
          {/* SOURCE */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              📍 Source
            </label>

            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Example: Rajahmundry"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "15px",
                outline: "none",
                background: "#ffffff",
                color: "#172033",
              }}
            />
          </div>

          {/* DESTINATION */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#334155",
              }}
            >
              📍 Destination
            </label>

            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Example: Kakinada"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "15px",
                outline: "none",
                background: "#ffffff",
                color: "#172033",
              }}
            />
          </div>

          {/* FIND BUTTON */}

          <button
            onClick={findTrafficRoute}
            style={{
              padding: "13px 22px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🚦 Check Traffic
          </button>

          {/* CLEAR */}

          <button
            onClick={clearRoute}
            style={{
              padding: "13px 22px",
              border: "none",
              borderRadius: "8px",
              background: "#64748b",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginTop: "18px",
            marginBottom: 0,
            fontSize: "14px",
          }}
        >
          Available locations: Srikakulam, Vizianagaram, Visakhapatnam,
          Rajahmundry, Kakinada
        </p>

        {error && (
          <div
            style={{
              marginTop: "18px",
              padding: "13px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            ❌ {error}
          </div>
        )}
      </div>

      {/* RESULT */}

      {result && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "30px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          {/* TITLE */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "25px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#172033",
              }}
            >
              🚦 Traffic-Aware Route
            </h2>

            <span
              style={{
                ...getTrafficStyle(result.trafficLevel),
                padding: "10px 18px",
                borderRadius: "20px",
                fontWeight: "700",
              }}
            >
              {result.trafficLevel} Traffic
            </span>
          </div>

          {/* SOURCE / DESTINATION */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                SOURCE
              </p>

              <h3
                style={{
                  margin: "8px 0 0",
                  color: "#1d4ed8",
                }}
              >
                📍 {result.source}
              </h3>
            </div>

            <div
              style={{
                padding: "20px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                DESTINATION
              </p>

              <h3
                style={{
                  margin: "8px 0 0",
                  color: "#15803d",
                }}
              >
                📍 {result.destination}
              </h3>
            </div>
          </div>

          {/* ROUTE */}

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "25px",
              marginBottom: "22px",
              background: "#f8fafc",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                textAlign: "center",
                color: "#172033",
              }}
            >
              🚚 Traffic-Aware Route
            </h3>

            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              {result.route.map((location, index) => (
                <div key={index}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "20px",
                      }}
                    >
                      📍
                    </span>

                    <span
                      style={{
                        fontSize: "17px",
                        fontWeight:
                          index === 0 ||
                          index === result.route.length - 1
                            ? "700"
                            : "500",
                        color:
                          index === 0
                            ? "#2563eb"
                            : index === result.route.length - 1
                            ? "#15803d"
                            : "#334155",
                      }}
                    >
                      {location}
                    </span>
                  </div>

                  {index < result.route.length - 1 && (
                    <div
                      style={{
                        marginLeft: "8px",
                        height: "25px",
                        borderLeft: "2px dashed #94a3b8",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* TRAFFIC AREAS */}

          <div
            style={{
              padding: "20px",
              borderRadius: "10px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              marginBottom: "22px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "#9a3412",
              }}
            >
              🚦 Traffic-Affected Areas
            </h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {result.trafficAreas.map((area, index) => (
                <span
                  key={index}
                  style={{
                    padding: "8px 14px",
                    background: "#ffedd5",
                    color: "#c2410c",
                    borderRadius: "20px",
                    fontWeight: "600",
                  }}
                >
                  🚦 {area}
                </span>
              ))}
            </div>
          </div>

          {/* DETAILS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "15px",
            }}
          >
            {/* DISTANCE */}

            <div
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <div style={{ fontSize: "25px" }}>📏</div>

              <p
                style={{
                  margin: "8px 0",
                  color: "#64748b",
                }}
              >
                Distance
              </p>

              <strong
                style={{
                  fontSize: "21px",
                  color: "#1d4ed8",
                }}
              >
                {result.distance} km
              </strong>
            </div>

            {/* NORMAL TIME */}

            <div
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: "25px" }}>🕐</div>

              <p
                style={{
                  margin: "8px 0",
                  color: "#64748b",
                }}
              >
                Normal Time
              </p>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#334155",
                }}
              >
                {formatTime(result.normalTime)}
              </strong>
            </div>

            {/* TRAFFIC TIME */}

            <div
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: "10px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <div style={{ fontSize: "25px" }}>🚦</div>

              <p
                style={{
                  margin: "8px 0",
                  color: "#64748b",
                }}
              >
                Traffic Time
              </p>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#c2410c",
                }}
              >
                {formatTime(result.trafficTime)}
              </strong>
            </div>

            {/* DELAY */}

            <div
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <div style={{ fontSize: "25px" }}>⏳</div>

              <p
                style={{
                  margin: "8px 0",
                  color: "#64748b",
                }}
              >
                Traffic Delay
              </p>

              <strong
                style={{
                  fontSize: "20px",
                  color: "#dc2626",
                }}
              >
                {result.delay} min
              </strong>
            </div>
          </div>

          {/* FINAL MESSAGE */}

          <div
            style={{
              marginTop: "22px",
              padding: "18px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ✅ Route calculated considering traffic conditions.
            Estimated travel time: {formatTime(result.trafficTime)}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrafficAwareRoutes;