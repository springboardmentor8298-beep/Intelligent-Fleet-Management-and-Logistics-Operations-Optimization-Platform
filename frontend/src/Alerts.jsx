import React, { useEffect, useState } from "react";

function Alerts() {
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH VEHICLES
  // =========================

  const fetchVehicles = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/vehicles"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await response.json();

      setVehicles(
        Array.isArray(data)
          ? data
          : data.vehicles || []
      );
    } catch (error) {
      console.error(
        "Vehicle fetch error:",
        error
      );

      setVehicles([]);
    }
  };

  // =========================
  // FETCH SHIPMENTS
  // =========================

  const fetchShipments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/shipments"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shipments");
      }

      const data = await response.json();

      setShipments(
        Array.isArray(data)
          ? data
          : data.shipments || []
      );
    } catch (error) {
      console.error(
        "Shipment fetch error:",
        error
      );

      setShipments([]);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchVehicles(),
        fetchShipments(),
      ]);

      setLoading(false);
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // GENERATE ALERTS
  // =========================

  useEffect(() => {
    const generatedAlerts = [];

    // ---------------------------------
    // VEHICLE ALERTS
    // ---------------------------------

    vehicles.forEach((vehicle) => {
      const vehicleNumber =
        vehicle.vehicle_number ||
        "Unknown Vehicle";

      const status = String(
        vehicle.status || ""
      ).toLowerCase();

      // Inactive vehicle
      if (status === "inactive") {
        generatedAlerts.push({
          id: `vehicle-inactive-${vehicle.id}`,
          type: "vehicle",
          level: "warning",
          title: "Vehicle Inactive",
          message: `${vehicleNumber} is currently inactive.`,
          vehicle: vehicleNumber,
          location:
            vehicle.location ||
            "Location not available",
        });
      }

      // Missing driver
      if (
        !vehicle.driver_name ||
        vehicle.driver_name.trim() === ""
      ) {
        generatedAlerts.push({
          id: `driver-missing-${vehicle.id}`,
          type: "driver",
          level: "warning",
          title: "Driver Not Assigned",
          message: `No driver is assigned to ${vehicleNumber}.`,
          vehicle: vehicleNumber,
          location:
            vehicle.location ||
            "Location not available",
        });
      }

      // Missing location
      if (
        !vehicle.location ||
        vehicle.location.trim() === ""
      ) {
        generatedAlerts.push({
          id: `location-missing-${vehicle.id}`,
          type: "location",
          level: "info",
          title: "Location Not Available",
          message: `Current location is not available for ${vehicleNumber}.`,
          vehicle: vehicleNumber,
          location: "Not Available",
        });
      }
    });

    // ---------------------------------
    // SHIPMENT ALERTS
    // ---------------------------------

    shipments.forEach((shipment) => {
      const vehicleNumber =
        shipment.vehicle_number ||
        "Unknown Vehicle";

      const shipmentStatus = String(
        shipment.status || ""
      ).toLowerCase();

      // Delayed shipment
      if (
        shipmentStatus.includes("delay") ||
        shipmentStatus === "delayed"
      ) {
        generatedAlerts.push({
          id: `shipment-delay-${shipment.id}`,
          type: "shipment",
          level: "danger",
          title: "Shipment Delayed",
          message: `Shipment for ${vehicleNumber} is delayed.`,
          vehicle: vehicleNumber,
          location:
            shipment.current_location ||
            "Location not available",
        });
      }

      // Pending shipment
      if (
        shipmentStatus === "pending"
      ) {
        generatedAlerts.push({
          id: `shipment-pending-${shipment.id}`,
          type: "shipment",
          level: "info",
          title: "Shipment Pending",
          message: `Shipment for ${vehicleNumber} is still pending.`,
          vehicle: vehicleNumber,
          location:
            shipment.current_location ||
            "Location not available",
        });
      }
    });

    setAlerts(generatedAlerts);
  }, [vehicles, shipments]);

  // =========================
  // ALERT STYLE
  // =========================

  const getAlertStyle = (level) => {
    if (level === "danger") {
      return {
        background: "#fee2e2",
        border: "1px solid #fecaca",
        icon: "🚨",
        iconBackground: "#ef4444",
      };
    }

    if (level === "warning") {
      return {
        background: "#fef3c7",
        border: "1px solid #fde68a",
        icon: "⚠️",
        iconBackground: "#f59e0b",
      };
    }

    return {
      background: "#dbeafe",
      border: "1px solid #bfdbfe",
      icon: "ℹ️",
      iconBackground: "#3b82f6",
    };
  };

  // =========================
  // COUNTS
  // =========================

  const dangerCount =
    alerts.filter(
      (alert) => alert.level === "danger"
    ).length;

  const warningCount =
    alerts.filter(
      (alert) => alert.level === "warning"
    ).length;

  const infoCount =
    alerts.filter(
      (alert) => alert.level === "info"
    ).length;

  // =========================
  // CLEAR ALERTS
  // =========================

  const clearAlerts = () => {
    setAlerts([]);
  };

  // =========================
  // UI
  // =========================

  return (
    <div
      style={{
        width: "100%",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >

      {/* =========================
          HEADER
      ========================= */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "20px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#172033",
                fontSize: "28px",
              }}
            >
              🔔 Fleet Alerts
            </h2>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Monitor important vehicle and
              shipment notifications.
            </p>
          </div>

          <button
            onClick={clearAlerts}
            style={{
              padding: "10px 18px",
              background: "#64748b",
              color: "#ffffff",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Clear Alerts
          </button>
        </div>
      </div>

      {/* =========================
          ALERT SUMMARY
      ========================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >

        {/* TOTAL */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#475569",
            }}
          >
            Total Alerts
          </h3>

          <p
            style={{
              fontSize: "30px",
              fontWeight: "700",
              margin: "10px 0 0",
              color: "#172033",
            }}
          >
            {alerts.length}
          </p>
        </div>

        {/* DANGER */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#475569",
            }}
          >
            🚨 Critical
          </h3>

          <p
            style={{
              fontSize: "30px",
              fontWeight: "700",
              margin: "10px 0 0",
              color: "#dc2626",
            }}
          >
            {dangerCount}
          </p>
        </div>

        {/* WARNING */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#475569",
            }}
          >
            ⚠️ Warnings
          </h3>

          <p
            style={{
              fontSize: "30px",
              fontWeight: "700",
              margin: "10px 0 0",
              color: "#d97706",
            }}
          >
            {warningCount}
          </p>
        </div>

        {/* INFO */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#475569",
            }}
          >
            ℹ️ Information
          </h3>

          <p
            style={{
              fontSize: "30px",
              fontWeight: "700",
              margin: "10px 0 0",
              color: "#2563eb",
            }}
          >
            {infoCount}
          </p>
        </div>

      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div
          style={{
            background: "#ffffff",
            padding: "25px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Loading alerts...
        </div>
      )}

      {/* =========================
          NO ALERTS
      ========================= */}

      {!loading &&
        alerts.length === 0 && (
          <div
            style={{
              background: "#ffffff",
              padding: "45px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "50px",
                marginBottom: "10px",
              }}
            >
              ✅
            </div>

            <h2
              style={{
                color: "#166534",
                margin: "5px 0",
              }}
            >
              No Active Alerts
            </h2>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Your fleet currently has no
              active alerts.
            </p>
          </div>
        )}

      {/* =========================
          ALERT LIST
      ========================= */}

      {!loading &&
        alerts.length > 0 && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "25px",
              boxShadow:
                "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >

            <h2
              style={{
                marginTop: 0,
                color: "#172033",
              }}
            >
              Active Alerts
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >

              {alerts.map((alert) => {

                const style =
                  getAlertStyle(
                    alert.level
                  );

                return (
                  <div
                    key={alert.id}
                    style={{
                      background:
                        style.background,
                      border:
                        style.border,
                      borderRadius: "10px",
                      padding: "18px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "flex-start",
                      }}
                    >

                      {/* ICON */}

                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          minWidth: "45px",
                          borderRadius: "50%",
                          background:
                            style.iconBackground,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "22px",
                        }}
                      >
                        {style.icon}
                      </div>

                      {/* CONTENT */}

                      <div
                        style={{
                          flex: 1,
                        }}
                      >

                        <h3
                          style={{
                            margin:
                              "0 0 6px",
                            color: "#172033",
                          }}
                        >
                          {alert.title}
                        </h3>

                        <p
                          style={{
                            margin:
                              "0 0 10px",
                            color: "#475569",
                          }}
                        >
                          {alert.message}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "20px",
                            flexWrap: "wrap",
                            fontSize: "14px",
                            color: "#64748b",
                          }}
                        >

                          <span>
                            🚚{" "}
                            <strong>
                              Vehicle:
                            </strong>{" "}
                            {alert.vehicle}
                          </span>

                          <span>
                            📍{" "}
                            <strong>
                              Location:
                            </strong>{" "}
                            {alert.location}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        )}

    </div>
  );
}

export default Alerts;