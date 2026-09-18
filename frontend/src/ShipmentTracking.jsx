import React, { useState } from "react";

function ShipmentTracking() {
  const [shipments, setShipments] = useState([
    {
      trackingNo: "TRK001",
      source: "Srikakulam",
      destination: "Visakhapatnam",
      vehicle: "AP39AB1234",
      driver: "Ravi",
      status: "Pending",
      location: "Srikakulam",
      eta: "2 hours",
    },
    {
      trackingNo: "TRK002",
      source: "Vizianagaram",
      destination: "Visakhapatnam",
      vehicle: "AP39CD4567",
      driver: "Suresh",
      status: "Pending",
      location: "Vizianagaram",
      eta: "1 hour",
    },
    {
      trackingNo: "TRK003",
      source: "Rajahmundry",
      destination: "Kakinada",
      vehicle: "AP39EF7890",
      driver: "Kiran",
      status: "In Transit",
      location: "Rajahmundry",
      eta: "2 hours",
    },
    {
      trackingNo: "TRK004",
      source: "Kakinada",
      destination: "Visakhapatnam",
      vehicle: "AP39GH1122",
      driver: "Ramesh",
      status: "In Transit",
      location: "Kakinada",
      eta: "3 hours",
    },
    {
      trackingNo: "TRK005",
      source: "Srikakulam",
      destination: "Vizianagaram",
      vehicle: "AP39IJ3344",
      driver: "Prasad",
      status: "Delivered",
      location: "Vizianagaram",
      eta: "Completed",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [newShipment, setNewShipment] = useState({
    trackingNo: "",
    source: "",
    destination: "",
    vehicle: "",
    driver: "",
    status: "Pending",
    location: "",
    eta: "2 hours",
  });

  // UPDATE STATUS
  const updateStatus = (index, newStatus) => {
    const updated = [...shipments];

    updated[index].status = newStatus;

    if (newStatus === "Pending") {
      updated[index].eta = "2 hours";
    } else if (newStatus === "In Transit") {
      updated[index].eta = "1 hour";
    } else if (newStatus === "Delivered") {
      updated[index].eta = "Completed";
    }

    setShipments(updated);
  };

  // INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewShipment({
      ...newShipment,
      [name]: value,
    });
  };

  // ADD SHIPMENT
  const addShipment = () => {
    if (
      !newShipment.trackingNo ||
      !newShipment.source ||
      !newShipment.destination ||
      !newShipment.vehicle ||
      !newShipment.driver ||
      !newShipment.location
    ) {
      alert("Please fill all shipment details.");
      return;
    }

    setShipments([...shipments, newShipment]);

    setNewShipment({
      trackingNo: "",
      source: "",
      destination: "",
      vehicle: "",
      driver: "",
      status: "Pending",
      location: "",
      eta: "2 hours",
    });

    setShowForm(false);
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 40px)",
        boxSizing: "border-box",
      }}
    >
      {/* MAIN SHIPMENT CARD */}

      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - 100px)",
          boxSizing: "border-box",
          background: "#ffffff",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        {/* TOP SECTION */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: "28px",
                color: "#172033",
              }}
            >
              📦 Shipment Tracking
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Track and manage all fleet shipments
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "7px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ➕ Add Shipment
          </button>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div style={summaryCard}>
            <span style={summaryTitle}>Total Shipments</span>
            <strong style={summaryNumber}>
              {shipments.length}
            </strong>
          </div>

          <div style={summaryCard}>
            <span style={summaryTitle}>Pending</span>
            <strong style={summaryNumber}>
              {
                shipments.filter(
                  (item) => item.status === "Pending"
                ).length
              }
            </strong>
          </div>

          <div style={summaryCard}>
            <span style={summaryTitle}>In Transit</span>
            <strong style={summaryNumber}>
              {
                shipments.filter(
                  (item) => item.status === "In Transit"
                ).length
              }
            </strong>
          </div>

          <div style={summaryCard}>
            <span style={summaryTitle}>Delivered</span>
            <strong style={summaryNumber}>
              {
                shipments.filter(
                  (item) => item.status === "Delivered"
                ).length
              }
            </strong>
          </div>
        </div>

        {/* TABLE */}

        <div
          style={{
            width: "100%",
            overflowX: "auto",
            border: "1px solid #dbe3ec",
            borderRadius: "8px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "auto",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#1d4ed8",
                  color: "#ffffff",
                }}
              >
                <th style={thStyle}>Tracking No.</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Destination</th>
                <th style={thStyle}>Vehicle</th>
                <th style={thStyle}>Driver</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Current Location</th>
                <th style={thStyle}>ETA</th>
                <th style={thStyle}>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {shipments.map((shipment, index) => (
                <tr
                  key={index}
                  style={{
                    background:
                      index % 2 === 0
                        ? "#ffffff"
                        : "#f8fafc",
                    borderBottom:
                      "1px solid #e2e8f0",
                  }}
                >
                  <td style={tdStyle}>
                    <strong>
                      {shipment.trackingNo}
                    </strong>
                  </td>

                  <td style={tdStyle}>
                    {shipment.source}
                  </td>

                  <td style={tdStyle}>
                    {shipment.destination}
                  </td>

                  <td style={tdStyle}>
                    {shipment.vehicle}
                  </td>

                  <td style={tdStyle}>
                    {shipment.driver}
                  </td>

                  {/* STATUS */}

                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "15px",
                        fontWeight: "600",
                        fontSize: "12px",
                        background:
                          shipment.status ===
                          "Delivered"
                            ? "#dcfce7"
                            : shipment.status ===
                              "In Transit"
                            ? "#dbeafe"
                            : "#fef3c7",
                        color:
                          shipment.status ===
                          "Delivered"
                            ? "#15803d"
                            : shipment.status ===
                              "In Transit"
                            ? "#1d4ed8"
                            : "#b45309",
                      }}
                    >
                      {shipment.status}
                    </span>
                  </td>

                  {/* LOCATION */}

                  <td style={tdStyle}>
                    📍 {shipment.location}
                  </td>

                  {/* ETA */}

                  <td style={tdStyle}>
                    <strong>
                      {shipment.eta}
                    </strong>
                  </td>

                  {/* UPDATE STATUS */}

                  <td style={tdStyle}>
                    <select
                      value={shipment.status}
                      onChange={(e) =>
                        updateStatus(
                          index,
                          e.target.value
                        )
                      }
                      style={{
                        padding: "7px 10px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "6px",
                        background: "#ffffff",
                        cursor: "pointer",
                        minWidth: "120px",
                      }}
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="In Transit">
                        In Transit
                      </option>

                      <option value="Delivered">
                        Delivered
                      </option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* INFORMATION */}

        <div
          style={{
            marginTop: "25px",
            padding: "15px",
            background: "#f8fafc",
            borderRadius: "8px",
            borderLeft:
              "4px solid #1d4ed8",
            color: "#475569",
          }}
        >
          ℹ️ Use <strong>Add Shipment</strong> to
          create a new shipment. Update the status
          from the table to automatically change the
          ETA.
        </div>
      </div>

      {/* ADD SHIPMENT POPUP */}

      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "12px",
              padding: "30px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#172033",
                }}
              >
                ➕ Add Shipment
              </h2>

              <button
                onClick={() =>
                  setShowForm(false)
                }
                style={{
                  border: "none",
                  background: "#fee2e2",
                  color: "#dc2626",
                  width: "35px",
                  height: "35px",
                  borderRadius: "50%",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* FORM */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "15px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  Tracking Number
                </label>

                <input
                  name="trackingNo"
                  value={
                    newShipment.trackingNo
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="TRK006"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Vehicle Number
                </label>

                <input
                  name="vehicle"
                  value={
                    newShipment.vehicle
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="AP39XX0000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Source
                </label>

                <input
                  name="source"
                  value={
                    newShipment.source
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Srikakulam"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Destination
                </label>

                <input
                  name="destination"
                  value={
                    newShipment.destination
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Visakhapatnam"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Driver
                </label>

                <input
                  name="driver"
                  value={
                    newShipment.driver
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Driver name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Current Location
                </label>

                <input
                  name="location"
                  value={
                    newShipment.location
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Current location"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
                marginTop: "25px",
              }}
            >
              <button
                onClick={() =>
                  setShowForm(false)
                }
                style={{
                  padding:
                    "11px 20px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={addShipment}
                style={{
                  padding:
                    "11px 20px",
                  border: "none",
                  borderRadius: "6px",
                  background:
                    "#16a34a",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Add Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* SUMMARY CARD */

const summaryCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};


/* SUMMARY TITLE */

const summaryTitle = {
  color: "#64748b",
  fontSize: "14px",
};


/* SUMMARY NUMBER */

const summaryNumber = {
  color: "#1d4ed8",
  fontSize: "24px",
};


/* TABLE HEADER */

const thStyle = {
  padding: "15px 12px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontWeight: "600",
};


/* TABLE DATA */

const tdStyle = {
  padding: "15px 12px",
  color: "#334155",
  whiteSpace: "nowrap",
};


/* FORM LABEL */

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  color: "#334155",
};


/* FORM INPUT */

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
};


export default ShipmentTracking;