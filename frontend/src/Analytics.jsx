import React from "react";

function Analytics({ vehicles = [], shipments = [], maintenanceRecords = [] }) {
  const totalVehicles = vehicles.length;

  const activeVehicles = vehicles.filter(
    (vehicle) =>
      String(vehicle.status || "").toLowerCase() === "active"
  ).length;

  const inactiveVehicles = totalVehicles - activeVehicles;

  const totalShipments = shipments.length;

  const pendingShipments = shipments.filter((shipment) =>
    String(
      shipment.status || shipment.shipment_status || ""
    )
      .toLowerCase()
      .includes("pending")
  ).length;

  const deliveredShipments = shipments.filter((shipment) =>
    String(
      shipment.status || shipment.shipment_status || ""
    )
      .toLowerCase()
      .includes("deliver")
  ).length;

  const delayedShipments = shipments.filter((shipment) =>
    String(
      shipment.status || shipment.shipment_status || ""
    )
      .toLowerCase()
      .includes("delay")
  ).length;

  const totalMaintenance = maintenanceRecords.length;

  const completedMaintenance = maintenanceRecords.filter(
    (record) =>
      String(record.status || "").toLowerCase() === "completed"
  ).length;

  const scheduledMaintenance = maintenanceRecords.filter(
    (record) =>
      String(record.status || "").toLowerCase() === "scheduled"
  ).length;

  const vehicleUtilization =
    totalVehicles > 0
      ? Math.round((activeVehicles / totalVehicles) * 100)
      : 0;

  const shipmentDeliveryRate =
    totalShipments > 0
      ? Math.round((deliveredShipments / totalShipments) * 100)
      : 0;

  return (
    <section
      className="content-card"
      style={{
        marginTop: "25px",
      }}
    >
      <div style={{ marginBottom: "25px" }}>
        <h2>📊 Fleet Analytics</h2>

        <p
          style={{
            color: "#64748b",
            marginTop: "5px",
          }}
        >
          Overview of fleet performance, shipments and maintenance.
        </p>
      </div>

      {/* ANALYTICS CARDS */}

      <div
        className="dashboard-cards"
        style={{
          marginBottom: "25px",
        }}
      >
        <div className="dashboard-card">
          <div className="dashboard-card-icon">🚚</div>

          <div>
            <h3>Vehicle Utilization</h3>

            <p>{vehicleUtilization}%</p>

            <small style={{ color: "#64748b" }}>
              {activeVehicles} active / {totalVehicles} total
            </small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">📦</div>

          <div>
            <h3>Total Shipments</h3>

            <p>{totalShipments}</p>

            <small style={{ color: "#64748b" }}>
              {pendingShipments} pending
            </small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">✅</div>

          <div>
            <h3>Delivery Rate</h3>

            <p>{shipmentDeliveryRate}%</p>

            <small style={{ color: "#64748b" }}>
              {deliveredShipments} delivered
            </small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">🔧</div>

          <div>
            <h3>Maintenance</h3>

            <p>{totalMaintenance}</p>

            <small style={{ color: "#64748b" }}>
              {scheduledMaintenance} scheduled
            </small>
          </div>
        </div>
      </div>

      {/* VEHICLE ANALYTICS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <h3>🚚 Vehicle Status</h3>

          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>Total Vehicles:</strong>{" "}
              {totalVehicles}
            </p>

            <p>
              <strong>Active:</strong>{" "}
              {activeVehicles}
            </p>

            <p>
              <strong>Inactive:</strong>{" "}
              {inactiveVehicles}
            </p>
          </div>
        </div>

        {/* SHIPMENT ANALYTICS */}

        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <h3>📦 Shipment Status</h3>

          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>Total:</strong>{" "}
              {totalShipments}
            </p>

            <p>
              <strong>Delivered:</strong>{" "}
              {deliveredShipments}
            </p>

            <p>
              <strong>Pending:</strong>{" "}
              {pendingShipments}
            </p>

            <p>
              <strong>Delayed:</strong>{" "}
              {delayedShipments}
            </p>
          </div>
        </div>

        {/* MAINTENANCE ANALYTICS */}

        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <h3>🔧 Maintenance Status</h3>

          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>Total Records:</strong>{" "}
              {totalMaintenance}
            </p>

            <p>
              <strong>Scheduled:</strong>{" "}
              {scheduledMaintenance}
            </p>

            <p>
              <strong>Completed:</strong>{" "}
              {completedMaintenance}
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESS SECTION */}

      <div
        style={{
          padding: "20px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
        }}
      >
        <h3>📈 Fleet Performance</h3>

        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span>Vehicle Utilization</span>
            <strong>{vehicleUtilization}%</strong>
          </div>

          <div
            style={{
              width: "100%",
              height: "12px",
              background: "#e2e8f0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${vehicleUtilization}%`,
                height: "100%",
                background: "#2563eb",
                borderRadius: "10px",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span>Shipment Delivery Rate</span>
            <strong>{shipmentDeliveryRate}%</strong>
          </div>

          <div
            style={{
              width: "100%",
              height: "12px",
              background: "#e2e8f0",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${shipmentDeliveryRate}%`,
                height: "100%",
                background: "#16a34a",
                borderRadius: "10px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Analytics;