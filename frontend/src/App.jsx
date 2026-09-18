import React, { useEffect, useState } from "react";

import DriverLocation from "./DriverLocation";
import ShipmentTracking from "./ShipmentTracking";
import RouteOptimization from "./RouteOptimization";
import TrafficAwareRoutes from "./TrafficAwareRoutes";
import MapTracking from "./MapTracking";
import RealTimeTracking from "./RealTimeTracking";
import ETACalculation from "./ETACalculation";

import "./App.css";

function App() {
  // =========================
  // LOGIN
  // =========================

  const [loggedIn, setLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // SIDEBAR
  // =========================

  const [activePage, setActivePage] = useState("dashboard");

  // =========================
  // VEHICLES
  // =========================

  const [vehicles, setVehicles] = useState([]);

  // =========================
  // SHIPMENTS
  // =========================

  const [shipments, setShipments] = useState([]);

  // =========================
  // TRIP SCHEDULING
  // =========================

  const [tripSource, setTripSource] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripVehicle, setTripVehicle] = useState("");
  const [scheduledTrips, setScheduledTrips] = useState([]);
  const [tripMessage, setTripMessage] = useState("");

  // =========================
  // VEHICLE FORM
  // =========================

  const [showForm, setShowForm] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    driver_name: "",
    status: "Active",
    location: "",
    fuel_type: "Diesel",
    mileage: "",
    registration_year: 2026,
  });

  // =====================================================
  // MAINTENANCE
  // =====================================================

  const [maintenanceRecords, setMaintenanceRecords] = useState([]);

  const [showMaintenanceForm, setShowMaintenanceForm] =
    useState(false);

  const [editingMaintenance, setEditingMaintenance] =
    useState(null);

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle: "",
    type: "Regular Service",
    date: "",
    cost: "",
    status: "Scheduled",
    description: "",
  });

  // =====================================================
  // FETCH VEHICLES
  // =====================================================

  const fetchVehicles = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/vehicles"
      );

      const data = await response.json();

      console.log("Vehicles:", data);

      setVehicles(
        Array.isArray(data)
          ? data
          : data.vehicles || []
      );
    } catch (error) {
      console.error(
        "Error fetching vehicles:",
        error
      );
    }
  };

  // =====================================================
  // FETCH SHIPMENTS
  // =====================================================

  const fetchShipments = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/shipments"
      );

      const data = await response.json();

      console.log("Shipments:", data);

      setShipments(
        Array.isArray(data)
          ? data
          : data.shipments || []
      );
    } catch (error) {
      console.error(
        "Error fetching shipments:",
        error
      );
    }
  };

  // =====================================================
  // LOAD DATA AFTER LOGIN
  // =====================================================

  useEffect(() => {
    if (!loggedIn) return;

    fetchVehicles();
    fetchShipments();
  }, [loggedIn]);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      username === "admin" &&
      password === "admin123"
    ) {
      setLoggedIn(true);
    } else {
      alert("Invalid username or password");
    }
  };

  // =====================================================
  // VEHICLE FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // ADD VEHICLE
  // =====================================================

  const handleAdd = () => {
    setEditingVehicle(null);

    setFormData({
      vehicle_number: "",
      vehicle_type: "",
      driver_name: "",
      status: "Active",
      location: "",
      fuel_type: "Diesel",
      mileage: "",
      registration_year: 2026,
    });

    setShowForm(true);
  };

  // =====================================================
  // EDIT VEHICLE
  // =====================================================

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);

    setFormData({
      vehicle_number:
        vehicle.vehicle_number || "",

      vehicle_type:
        vehicle.vehicle_type || "",

      driver_name:
        vehicle.driver_name || "",

      status:
        vehicle.status || "Active",

      location:
        vehicle.location || "",

      fuel_type:
        vehicle.fuel_type || "Diesel",

      mileage:
        vehicle.mileage || "",

      registration_year:
        vehicle.registration_year || 2026,
    });

    setShowForm(true);
  };

  // =====================================================
  // ADD / UPDATE VEHICLE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingVehicle
        ? `http://127.0.0.1:8000/vehicles/${editingVehicle.id}`
        : "http://127.0.0.1:8000/vehicles";

      const method = editingVehicle
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method: method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,

          registration_year:
            Number(
              formData.registration_year
            ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
          "Something went wrong"
        );

        return;
      }

      alert(
        editingVehicle
          ? "Vehicle updated successfully!"
          : "Vehicle added successfully!"
      );

      setShowForm(false);
      setEditingVehicle(null);

      fetchVehicles();
    } catch (error) {
      console.error("Error:", error);

      alert(
        "Unable to connect to backend"
      );
    }
  };

  // =====================================================
  // DELETE VEHICLE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this vehicle?"
      );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/vehicles/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
          "Unable to delete vehicle"
        );

        return;
      }

      alert(
        "Vehicle deleted successfully!"
      );

      fetchVehicles();
    } catch (error) {
      console.error("Error:", error);

      alert(
        "Unable to connect to backend"
      );
    }
  };

  // =====================================================
  // MAINTENANCE FORM CHANGE
  // =====================================================

  const handleMaintenanceChange = (e) => {
    setMaintenanceForm({
      ...maintenanceForm,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // ADD MAINTENANCE
  // =====================================================

  const handleAddMaintenance = () => {
    setEditingMaintenance(null);

    setMaintenanceForm({
      vehicle: "",
      type: "Regular Service",
      date: "",
      cost: "",
      status: "Scheduled",
      description: "",
    });

    setShowMaintenanceForm(true);
  };

  // =====================================================
  // EDIT MAINTENANCE
  // =====================================================

  const handleEditMaintenance = (record) => {
    setEditingMaintenance(record);

    setMaintenanceForm({
      vehicle: record.vehicle || "",
      type:
        record.type ||
        "Regular Service",
      date: record.date || "",
      cost: record.cost || "",
      status:
        record.status ||
        "Scheduled",
      description:
        record.description || "",
    });

    setShowMaintenanceForm(true);
  };

  // =====================================================
  // SAVE MAINTENANCE
  // =====================================================

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();

    if (
      !maintenanceForm.vehicle ||
      !maintenanceForm.date
    ) {
      alert(
        "Please select vehicle and maintenance date."
      );

      return;
    }

    if (editingMaintenance) {
      setMaintenanceRecords(
        maintenanceRecords.map((record) =>
          record.id ===
          editingMaintenance.id
            ? {
                ...record,
                ...maintenanceForm,
              }
            : record
        )
      );

      alert(
        "Maintenance record updated successfully!"
      );
    } else {
      const newRecord = {
        id: Date.now(),

        ...maintenanceForm,

        cost:
          maintenanceForm.cost || "0",
      };

      setMaintenanceRecords([
        ...maintenanceRecords,
        newRecord,
      ]);

      alert(
        "Maintenance record added successfully!"
      );
    }

    setShowMaintenanceForm(false);
    setEditingMaintenance(null);

    setMaintenanceForm({
      vehicle: "",
      type: "Regular Service",
      date: "",
      cost: "",
      status: "Scheduled",
      description: "",
    });
  };

  // =====================================================
  // DELETE MAINTENANCE
  // =====================================================

  const handleDeleteMaintenance = (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this maintenance record?"
      );

    if (!confirmDelete) return;

    setMaintenanceRecords(
      maintenanceRecords.filter(
        (record) =>
          record.id !== id
      )
    );

    alert(
      "Maintenance record deleted successfully!"
    );
  };

  // =====================================================
  // TRIP SCHEDULING
  // =====================================================

  const handleScheduleTrip = (e) => {
    e.preventDefault();

    setTripMessage("");

    if (
      !tripSource.trim() ||
      !tripDestination.trim() ||
      !tripDate ||
      !tripVehicle
    ) {
      setTripMessage(
        "⚠️ Please select source, destination, date and vehicle."
      );

      return;
    }

    if (
      tripSource.trim().toLowerCase() ===
      tripDestination.trim().toLowerCase()
    ) {
      setTripMessage(
        "⚠️ Source and destination cannot be the same."
      );

      return;
    }

    const newTrip = {
      id: Date.now(),

      source:
        tripSource.trim(),

      destination:
        tripDestination.trim(),

      date: tripDate,

      vehicle:
        tripVehicle,

      status:
        "Scheduled",
    };

    setScheduledTrips(
      (previousTrips) => [
        ...previousTrips,
        newTrip,
      ]
    );

    setTripMessage(
      "✅ Trip scheduled successfully!"
    );

    setTripSource("");
    setTripDestination("");
    setTripDate("");
    setTripVehicle("");
  };

  // =====================================================
  // CLEAR TRIP FORM
  // =====================================================

  const handleClearTrip = () => {
    setTripSource("");
    setTripDestination("");
    setTripDate("");
    setTripVehicle("");
    setTripMessage("");
  };

  // =====================================================
  // DELETE SCHEDULED TRIP
  // =====================================================

  const handleDeleteTrip = (id) => {
    setScheduledTrips(
      scheduledTrips.filter(
        (trip) =>
          trip.id !== id
      )
    );
  };

  // =====================================================
  // DASHBOARD COUNTS
  // =====================================================

  const activeVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.status === "Active"
    ).length;

  const inactiveVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.status !== "Active"
    ).length;

  // =====================================================
  // UNIQUE DRIVERS
  // =====================================================

  const drivers = [
    ...new Set(
      vehicles
        .map(
          (vehicle) =>
            vehicle.driver_name
        )
        .filter(Boolean)
    ),
  ];

  // =====================================================
  // MAINTENANCE COUNTS
  // =====================================================

  const scheduledMaintenance =
    maintenanceRecords.filter(
      (record) =>
        record.status ===
        "Scheduled"
    ).length;

  const inProgressMaintenance =
    maintenanceRecords.filter(
      (record) =>
        record.status ===
        "In Progress"
    ).length;

  const completedMaintenance =
    maintenanceRecords.filter(
      (record) =>
        record.status ===
        "Completed"
    ).length;

  // =====================================================
  // ALERTS
  // =====================================================

  // -----------------------------------------------------
  // 1. INACTIVE VEHICLE ALERTS
  // -----------------------------------------------------

  const inactiveVehicleAlerts =
    vehicles.filter(
      (vehicle) =>
        vehicle.status &&
        vehicle.status.toLowerCase() !==
          "active"
    );

  // -----------------------------------------------------
  // 2. LOW FUEL ALERTS
  // -----------------------------------------------------
  // Checks common possible backend field names.
  // Low fuel = 20% or less.
  // -----------------------------------------------------

  const lowFuelVehicles =
    vehicles.filter((vehicle) => {
      const fuelValue =
        vehicle.fuel_level ??
        vehicle.fuel_percentage ??
        vehicle.fuel_remaining ??
        vehicle.fuelLevel;

      if (
        fuelValue === undefined ||
        fuelValue === null ||
        fuelValue === ""
      ) {
        return false;
      }

      const numericFuel =
        parseFloat(
          String(fuelValue).replace(
            "%",
            ""
          )
        );

      return (
        !isNaN(numericFuel) &&
        numericFuel <= 20
      );
    });

  // -----------------------------------------------------
  // 3. MAINTENANCE DUE ALERTS
  // -----------------------------------------------------

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  const maintenanceDueAlerts =
    maintenanceRecords.filter(
      (record) => {
        if (
          !record.date ||
          record.status ===
            "Completed"
        ) {
          return false;
        }

        return record.date <= today;
      }
    );

  // -----------------------------------------------------
  // 4. SHIPMENT ALERTS
  // -----------------------------------------------------

  const shipmentAlerts =
    shipments.filter((shipment) => {
      const status = String(
        shipment.status ||
          shipment.shipment_status ||
          ""
      ).toLowerCase();

      return (
        status.includes("delayed") ||
        status.includes("cancel") ||
        status.includes("failed") ||
        status.includes("pending") ||
        status.includes("overdue")
      );
    });

  // -----------------------------------------------------
  // TOTAL ALERT COUNT
  // -----------------------------------------------------

  const totalAlertCount =
    inactiveVehicleAlerts.length +
    lowFuelVehicles.length +
    maintenanceDueAlerts.length +
    shipmentAlerts.length;

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!loggedIn) {
    return (
      <div className="login-page">

        <div className="login-box">

          <h1>🚚</h1>

          <h2>
            Fleet Management System
          </h2>

          <p>
            Login to continue
          </p>

          <form
            onSubmit={handleLogin}
          >

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <button type="submit">
              Login
            </button>

          </form>

          <small>
            Demo: admin / admin123
          </small>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN APPLICATION
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <h2>
            🚚 FleetFlow
          </h2>

          <p>
            Fleet Management
          </p>

        </div>

        <div className="sidebar-menu">

          {/* DASHBOARD */}

          <button
            className={
              activePage ===
              "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >
            🏠 Dashboard
          </button>

          {/* VEHICLES */}

          <button
            className={
              activePage ===
              "vehicles"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "vehicles"
              )
            }
          >
            🚚 Vehicles
          </button>

          {/* DRIVERS */}

          <button
            className={
              activePage ===
              "drivers"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "drivers"
              )
            }
          >
            👨‍✈️ Drivers
          </button>

          {/* SHIPMENTS */}

          <button
            className={
              activePage ===
              "shipments"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "shipments"
              )
            }
          >
            📦 Shipments
          </button>

          {/* MAINTENANCE */}

          <button
            className={
              activePage ===
              "maintenance"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "maintenance"
              )
            }
          >
            🔧 Maintenance
          </button>

          {/* FUEL */}

          <button
            className={
              activePage ===
              "fuel"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "fuel"
              )
            }
          >
            ⛽ Fuel
          </button>

          {/* =================================================
              ALERTS WITH COUNT BADGE
          ================================================= */}

          <button
            className={
              activePage ===
              "alerts"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "alerts"
              )
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
            }}
          >

            <span>
              🔔 Alerts
            </span>

            {totalAlertCount > 0 && (
              <span
                style={{
                  backgroundColor:
                    "#ef4444",
                  color:
                    "#ffffff",
                  borderRadius:
                    "50%",
                  minWidth:
                    "22px",
                  height:
                    "22px",
                  padding:
                    "0 6px",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize:
                    "12px",
                  fontWeight:
                    "700",
                  boxSizing:
                    "border-box",
                }}
              >
                {totalAlertCount}
              </span>
            )}

          </button>

          {/* LIVE TRACKING */}

          <button
            className={
              activePage ===
              "liveTracking"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "liveTracking"
              )
            }
          >
            📍 Live Tracking
          </button>

          {/* ROUTE OPTIMIZATION */}

          <button
            className={
              activePage ===
              "routeOptimization"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "routeOptimization"
              )
            }
          >
            🗺️ Route Optimization
          </button>

          {/* TRAFFIC ROUTES */}

          <button
            className={
              activePage ===
              "trafficRoutes"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "trafficRoutes"
              )
            }
          >
            🚦 Traffic-Aware Routes
          </button>

          {/* TRIP SCHEDULING */}

          <button
            className={
              activePage ===
              "tripScheduling"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "tripScheduling"
              )
            }
          >
            📅 Trip Scheduling
          </button>

          {/* REAL TIME TRACKING */}

          <button
            className={
              activePage ===
              "realTimeTracking"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "realTimeTracking"
              )
            }
          >
            🔄 Real-Time Tracking
          </button>

          {/* ETA */}

          <button
            className={
              activePage ===
              "etaCalculation"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "etaCalculation"
              )
            }
          >
            ⏱️ ETA Calculation
          </button>

        </div>

        {/* LOGOUT */}

        <button
          className="sidebar-logout"
          onClick={() => {
            setLoggedIn(false);
            setUsername("");
            setPassword("");
          }}
        >
          🚪 Logout
        </button>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>
              {activePage ===
              "dashboard"
                ? "Dashboard"
                : activePage ===
                  "vehicles"
                ? "Vehicles"
                : activePage ===
                  "drivers"
                ? "Drivers"
                : activePage ===
                  "shipments"
                ? "Shipments"
                : activePage ===
                  "maintenance"
                ? "Maintenance"
                : activePage ===
                  "fuel"
                ? "Fuel"
                : activePage ===
                  "alerts"
                ? "Alerts"
                : activePage ===
                  "liveTracking"
                ? "Live Tracking"
                : activePage ===
                  "routeOptimization"
                ? "Route Optimization"
                : activePage ===
                  "trafficRoutes"
                ? "Traffic-Aware Routes"
                : activePage ===
                  "tripScheduling"
                ? "Trip Scheduling"
                : activePage ===
                  "realTimeTracking"
                ? "Real-Time Tracking"
                : "ETA Calculation"}
            </h1>

            <p>
              Fleet management and
              monitoring system
            </p>

          </div>

          <div>

            <strong>
              Admin
            </strong>

            <p>
              Administrator
            </p>

          </div>

        </header>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activePage ===
          "dashboard" && (
          <>

            <div className="dashboard-cards">

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  🚚
                </div>

                <div>
                  <h3>
                    Total Vehicles
                  </h3>

                  <p>
                    {vehicles.length}
                  </p>
                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  ✅
                </div>

                <div>
                  <h3>
                    Active Vehicles
                  </h3>

                  <p>
                    {activeVehicles}
                  </p>
                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  ⏸️
                </div>

                <div>
                  <h3>
                    Inactive Vehicles
                  </h3>

                  <p>
                    {inactiveVehicles}
                  </p>
                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  👨‍✈️
                </div>

                <div>
                  <h3>
                    Drivers
                  </h3>

                  <p>
                    {drivers.length}
                  </p>
                </div>

              </div>

            </div>

            <div className="content-card">

              <h2>
                Fleet Overview
              </h2>

              <div className="dashboard-cards">

                <div className="dashboard-card">

                  <div>
                    <h3>
                      Active
                    </h3>

                    <p>
                      {activeVehicles}
                    </p>
                  </div>

                </div>

                <div className="dashboard-card">

                  <div>
                    <h3>
                      Inactive
                    </h3>

                    <p>
                      {inactiveVehicles}
                    </p>
                  </div>

                </div>

                <div className="dashboard-card">

                  <div>
                    <h3>
                      Total
                    </h3>

                    <p>
                      {vehicles.length}
                    </p>
                  </div>

                </div>

              </div>

            </div>

            <div className="content-card">

              <h2>
                Quick Information
              </h2>

              <p>
                🚚 Vehicles:{" "}
                {vehicles.length}
              </p>

              <p>
                👨‍✈️ Drivers:{" "}
                {drivers.length}
              </p>

              <p>
                📦 Shipments:{" "}
                {shipments.length}
              </p>

              <p>
                🔧 Maintenance Records:{" "}
                {maintenanceRecords.length}
              </p>

              <p>
                🔔 Active Alerts:{" "}
                {totalAlertCount}
              </p>

              <p>
                📍 Live tracking is
                available from the
                Live Tracking menu.
              </p>

            </div>

          </>
        )}

        {/* =================================================
            VEHICLES
        ================================================= */}

        {activePage ===
          "vehicles" && (
          <section className="content-card">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >

              <h2>
                Vehicle List
              </h2>

              <button
                className="add-button"
                onClick={handleAdd}
              >
                + Add Vehicle
              </button>

            </div>

            {vehicles.length === 0 ? (

              <p>
                No vehicles found.
              </p>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>ID</th>

                      <th>
                        Vehicle Number
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        Driver
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Location
                      </th>

                      <th>
                        Fuel
                      </th>

                      <th>
                        Mileage
                      </th>

                      <th>
                        Year
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {vehicles.map(
                      (vehicle) => (

                        <tr
                          key={
                            vehicle.id
                          }
                        >

                          <td>
                            {vehicle.id}
                          </td>

                          <td>
                            {
                              vehicle.vehicle_number
                            }
                          </td>

                          <td>
                            {
                              vehicle.vehicle_type
                            }
                          </td>

                          <td>
                            {
                              vehicle.driver_name
                            }
                          </td>

                          <td>
                            {
                              vehicle.status
                            }
                          </td>

                          <td>
                            {
                              vehicle.location ||
                              "Not Assigned"
                            }
                          </td>

                          <td>
                            {
                              vehicle.fuel_type ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              vehicle.mileage ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              vehicle.registration_year ||
                              "-"
                            }
                          </td>

                          <td>

                            <button
                              className="edit-button"
                              onClick={() =>
                                handleEdit(
                                  vehicle
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  vehicle.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>
        )}

        {/* =================================================
            DRIVERS
        ================================================= */}

        {activePage ===
          "drivers" && (
          <section className="content-card">

            <h2>
              👨‍✈️ Drivers
            </h2>

            {drivers.length === 0 ? (

              <p>
                No drivers found.
              </p>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Driver
                      </th>

                      <th>
                        Vehicle Number
                      </th>

                      <th>
                        Vehicle Type
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {vehicles.map(
                      (vehicle) => (

                        <tr
                          key={
                            vehicle.id
                          }
                        >

                          <td>
                            {
                              vehicle.driver_name
                            }
                          </td>

                          <td>
                            {
                              vehicle.vehicle_number
                            }
                          </td>

                          <td>
                            {
                              vehicle.vehicle_type
                            }
                          </td>

                          <td>
                            {
                              vehicle.status
                            }
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>
        )}

        {/* =================================================
            SHIPMENTS
        ================================================= */}

        {activePage ===
          "shipments" && (
          <ShipmentTracking />
        )}

        {/* =================================================
            MAINTENANCE
        ================================================= */}

        {activePage ===
          "maintenance" && (
          <section className="content-card">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "25px",
              }}
            >

              <div>

                <h2>
                  🔧 Vehicle Maintenance
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: "5px",
                  }}
                >
                  Manage vehicle
                  maintenance and
                  service records.
                </p>

              </div>

              <button
                className="add-button"
                onClick={
                  handleAddMaintenance
                }
              >
                + Add Maintenance
              </button>

            </div>

            <div
              className="dashboard-cards"
              style={{
                marginBottom: "30px",
              }}
            >

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  🔧
                </div>

                <div>

                  <h3>
                    Total Records
                  </h3>

                  <p>
                    {
                      maintenanceRecords.length
                    }
                  </p>

                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  📅
                </div>

                <div>

                  <h3>
                    Scheduled
                  </h3>

                  <p>
                    {
                      scheduledMaintenance
                    }
                  </p>

                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  🔄
                </div>

                <div>

                  <h3>
                    In Progress
                  </h3>

                  <p>
                    {
                      inProgressMaintenance
                    }
                  </p>

                </div>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-card-icon">
                  ✅
                </div>

                <div>

                  <h3>
                    Completed
                  </h3>

                  <p>
                    {
                      completedMaintenance
                    }
                  </p>

                </div>

              </div>

            </div>

            {maintenanceRecords.length ===
            0 ? (

              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >

                <div
                  style={{
                    fontSize: "50px",
                    marginBottom: "15px",
                  }}
                >
                  🔧
                </div>

                <h3>
                  No Maintenance
                  Records
                </h3>

                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  Click "Add Maintenance"
                  to create your first
                  maintenance record.
                </p>

              </div>

            ) : (

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      <th>ID</th>

                      <th>
                        Vehicle
                      </th>

                      <th>
                        Maintenance Type
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Cost
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Description
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {maintenanceRecords.map(
                      (record) => (

                        <tr
                          key={
                            record.id
                          }
                        >

                          <td>
                            {record.id}
                          </td>

                          <td>
                            🚚{" "}
                            {record.vehicle}
                          </td>

                          <td>
                            {record.type}
                          </td>

                          <td>
                            {record.date}
                          </td>

                          <td>
                            ₹{" "}
                            {record.cost ||
                              "0"}
                          </td>

                          <td>

                            <span
                              style={{
                                padding:
                                  "6px 10px",
                                borderRadius:
                                  "20px",
                                fontSize:
                                  "13px",
                                fontWeight:
                                  "600",

                                background:
                                  record.status ===
                                  "Completed"
                                    ? "#dcfce7"
                                    : record.status ===
                                      "In Progress"
                                    ? "#fef3c7"
                                    : "#dbeafe",

                                color:
                                  record.status ===
                                  "Completed"
                                    ? "#166534"
                                    : record.status ===
                                      "In Progress"
                                    ? "#92400e"
                                    : "#1d4ed8",
                              }}
                            >
                              {record.status}
                            </span>

                          </td>

                          <td>
                            {record.description ||
                              "-"}
                          </td>

                          <td>

                            <button
                              className="edit-button"
                              onClick={() =>
                                handleEditMaintenance(
                                  record
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDeleteMaintenance(
                                  record.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>
        )}

        {/* =================================================
            FUEL
        ================================================= */}

        {activePage ===
          "fuel" && (
          <section className="content-card">

            <h2>
              ⛽ Fuel
            </h2>

            <p>
              Fuel information for
              your fleet vehicles.
            </p>

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Vehicle
                    </th>

                    <th>
                      Fuel Type
                    </th>

                    <th>
                      Mileage
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {vehicles.map(
                    (vehicle) => (

                      <tr
                        key={
                          vehicle.id
                        }
                      >

                        <td>
                          {
                            vehicle.vehicle_number
                          }
                        </td>

                        <td>
                          {
                            vehicle.fuel_type ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            vehicle.mileage ||
                            "-"
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* =================================================
            ALERTS
        ================================================= */}

        {activePage ===
          "alerts" && (
          <section className="content-card">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "25px",
              }}
            >

              <div>

                <h2>
                  🔔 Fleet Alerts
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: "5px",
                  }}
                >
                  Monitor important fleet
                  warnings and notifications.
                </p>

              </div>

              <div
                style={{
                  background:
                    totalAlertCount > 0
                      ? "#fee2e2"
                      : "#dcfce7",
                  color:
                    totalAlertCount > 0
                      ? "#b91c1c"
                      : "#166534",
                  padding:
                    "10px 18px",
                  borderRadius:
                    "25px",
                  fontWeight:
                    "700",
                }}
              >
                {totalAlertCount}{" "}
                Alert
                {totalAlertCount !== 1
                  ? "s"
                  : ""}
              </div>

            </div>

            {/* =========================================
                INACTIVE VEHICLE ALERTS
            ========================================= */}

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                border:
                  "1px solid #fecaca",
                borderRadius: "10px",
                background:
                  "#fef2f2",
              }}
            >

              <h3
                style={{
                  color: "#b91c1c",
                  marginBottom: "15px",
                }}
              >
                ⚠️ Inactive Vehicle Alerts
              </h3>

              {inactiveVehicleAlerts.length ===
              0 ? (

                <p
                  style={{
                    color: "#166534",
                  }}
                >
                  ✅ No inactive vehicle
                  alerts.
                </p>

              ) : (

                inactiveVehicleAlerts.map(
                  (vehicle) => (

                    <div
                      key={
                        vehicle.id
                      }
                      style={{
                        padding:
                          "12px",
                        marginBottom:
                          "10px",
                        background:
                          "#ffffff",
                        border:
                          "1px solid #fecaca",
                        borderRadius:
                          "7px",
                      }}
                    >

                      <strong>
                        🚚{" "}
                        {
                          vehicle.vehicle_number
                        }
                      </strong>

                      <span
                        style={{
                          marginLeft:
                            "15px",
                          color:
                            "#b91c1c",
                        }}
                      >
                        Status:{" "}
                        {
                          vehicle.status
                        }
                      </span>

                    </div>

                  )
                )

              )}

            </div>

            {/* =========================================
                LOW FUEL ALERTS
            ========================================= */}

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                border:
                  "1px solid #fed7aa",
                borderRadius: "10px",
                background:
                  "#fff7ed",
              }}
            >

              <h3
                style={{
                  color: "#c2410c",
                  marginBottom: "15px",
                }}
              >
                ⛽ Low Fuel Alerts
              </h3>

              {lowFuelVehicles.length ===
              0 ? (

                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  No low-fuel alerts.
                </p>

              ) : (

                lowFuelVehicles.map(
                  (vehicle) => {

                    const fuelValue =
                      vehicle.fuel_level ??
                      vehicle.fuel_percentage ??
                      vehicle.fuel_remaining ??
                      vehicle.fuelLevel;

                    return (
                      <div
                        key={
                          vehicle.id
                        }
                        style={{
                          padding:
                            "12px",
                          marginBottom:
                            "10px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #fed7aa",
                          borderRadius:
                            "7px",
                        }}
                      >

                        <strong>
                          🚚{" "}
                          {
                            vehicle.vehicle_number
                          }
                        </strong>

                        <span
                          style={{
                            marginLeft:
                              "15px",
                            color:
                              "#c2410c",
                          }}
                        >
                          Fuel:{" "}
                          {fuelValue}%
                        </span>

                        <span
                          style={{
                            marginLeft:
                              "15px",
                            fontWeight:
                              "600",
                          }}
                        >
                          Please refuel.
                        </span>

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* =========================================
                MAINTENANCE DUE ALERTS
            ========================================= */}

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                border:
                  "1px solid #fde68a",
                borderRadius: "10px",
                background:
                  "#fffbeb",
              }}
            >

              <h3
                style={{
                  color: "#92400e",
                  marginBottom: "15px",
                }}
              >
                🔧 Maintenance Due Alerts
              </h3>

              {maintenanceDueAlerts.length ===
              0 ? (

                <p
                  style={{
                    color: "#166534",
                  }}
                >
                  ✅ No maintenance due
                  alerts.
                </p>

              ) : (

                maintenanceDueAlerts.map(
                  (record) => (

                    <div
                      key={
                        record.id
                      }
                      style={{
                        padding:
                          "12px",
                        marginBottom:
                          "10px",
                        background:
                          "#ffffff",
                        border:
                          "1px solid #fde68a",
                        borderRadius:
                          "7px",
                      }}
                    >

                      <strong>
                        🔧{" "}
                        {record.vehicle}
                      </strong>

                      <span
                        style={{
                          marginLeft:
                            "15px",
                        }}
                      >
                        {
                          record.type
                        }
                      </span>

                      <span
                        style={{
                          marginLeft:
                            "15px",
                          color:
                            "#b45309",
                          fontWeight:
                            "600",
                        }}
                      >
                        Due:{" "}
                        {record.date}
                      </span>

                    </div>

                  )
                )

              )}

            </div>

            {/* =========================================
                SHIPMENT ALERTS
            ========================================= */}

            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                border:
                  "1px solid #c7d2fe",
                borderRadius: "10px",
                background:
                  "#eef2ff",
              }}
            >

              <h3
                style={{
                  color: "#3730a3",
                  marginBottom: "15px",
                }}
              >
                📦 Shipment Alerts
              </h3>

              {shipmentAlerts.length ===
              0 ? (

                <p
                  style={{
                    color: "#166534",
                  }}
                >
                  ✅ No shipment alerts.
                </p>

              ) : (

                shipmentAlerts.map(
                  (shipment, index) => {

                    const shipmentStatus =
                      shipment.status ||
                      shipment.shipment_status ||
                      "Unknown";

                    const shipmentNumber =
                      shipment.shipment_number ||
                      shipment.tracking_number ||
                      shipment.id ||
                      `Shipment ${index + 1}`;

                    return (
                      <div
                        key={
                          shipment.id ||
                          index
                        }
                        style={{
                          padding:
                            "12px",
                          marginBottom:
                            "10px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #c7d2fe",
                          borderRadius:
                            "7px",
                        }}
                      >

                        <strong>
                          📦{" "}
                          {
                            shipmentNumber
                          }
                        </strong>

                        <span
                          style={{
                            marginLeft:
                              "15px",
                            color:
                              "#4338ca",
                            fontWeight:
                              "600",
                          }}
                        >
                          Status:{" "}
                          {
                            shipmentStatus
                          }
                        </span>

                        {(shipment.source ||
                          shipment.origin) && (
                          <span
                            style={{
                              marginLeft:
                                "15px",
                            }}
                          >
                            From:{" "}
                            {
                              shipment.source ||
                              shipment.origin
                            }
                          </span>
                        )}

                        {(shipment.destination ||
                          shipment.delivery_location) && (
                          <span
                            style={{
                              marginLeft:
                                "15px",
                            }}
                          >
                            To:{" "}
                            {
                              shipment.destination ||
                              shipment.delivery_location
                            }
                          </span>
                        )}

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* =========================================
                NO ALERTS
            ========================================= */}

            {totalAlertCount === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background:
                    "#f0fdf4",
                  border:
                    "1px solid #bbf7d0",
                  borderRadius:
                    "10px",
                  marginTop: "20px",
                }}
              >

                <div
                  style={{
                    fontSize: "50px",
                    marginBottom:
                      "10px",
                  }}
                >
                  ✅
                </div>

                <h3
                  style={{
                    color:
                      "#166534",
                  }}
                >
                  All Clear
                </h3>

                <p
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  There are currently
                  no fleet alerts.
                </p>

              </div>
            )}

          </section>
        )}

        {/* =================================================
            LIVE TRACKING
        ================================================= */}

        {activePage ===
          "liveTracking" && (
          <section className="content-card">

            <h2>
              📍 Live Tracking
            </h2>

            <DriverLocation />

            <MapTracking />

          </section>
        )}

        {/* =================================================
            ROUTE OPTIMIZATION
        ================================================= */}

        {activePage ===
          "routeOptimization" && (
          <RouteOptimization />
        )}

        {/* =================================================
            TRAFFIC ROUTES
        ================================================= */}

        {activePage ===
          "trafficRoutes" && (
          <TrafficAwareRoutes />
        )}

        {/* =================================================
            TRIP SCHEDULING
        ================================================= */}

        {activePage ===
          "tripScheduling" && (
          <section className="content-card">

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
                📅 Trip Scheduling
              </h2>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "16px",
                }}
              >
                Schedule trips by
                selecting source,
                destination, date
                and vehicle.
              </p>

            </div>

            <form
              onSubmit={
                handleScheduleTrip
              }
              style={{
                background:
                  "#ffffff",
                border:
                  "1px solid #e2e8f0",
                borderRadius:
                  "12px",
                padding: "25px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.05)",
              }}
            >

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  alignItems: "end",
                }}
              >

                {/* SOURCE */}

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "600",
                      marginBottom:
                        "7px",
                      color:
                        "#334155",
                    }}
                  >
                    📍 Source
                  </label>

                  <input
                    type="text"
                    placeholder="Enter source"
                    value={
                      tripSource
                    }
                    onChange={(e) =>
                      setTripSource(
                        e.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "7px",
                      backgroundColor:
                        "#ffffff",
                      color:
                        "#172033",
                      fontSize:
                        "15px",
                      boxSizing:
                        "border-box",
                    }}
                  />

                </div>

                {/* DESTINATION */}

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "600",
                      marginBottom:
                        "7px",
                      color:
                        "#334155",
                    }}
                  >
                    📍 Destination
                  </label>

                  <input
                    type="text"
                    placeholder="Enter destination"
                    value={
                      tripDestination
                    }
                    onChange={(e) =>
                      setTripDestination(
                        e.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "7px",
                      backgroundColor:
                        "#ffffff",
                      color:
                        "#172033",
                      fontSize:
                        "15px",
                      boxSizing:
                        "border-box",
                    }}
                  />

                </div>

                {/* DATE */}

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "600",
                      marginBottom:
                        "7px",
                      color:
                        "#334155",
                    }}
                  >
                    📅 Trip Date
                  </label>

                  <input
                    type="date"
                    value={
                      tripDate
                    }
                    onChange={(e) =>
                      setTripDate(
                        e.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "7px",
                      backgroundColor:
                        "#ffffff",
                      color:
                        "#172033",
                      fontSize:
                        "15px",
                      boxSizing:
                        "border-box",
                    }}
                  />

                </div>

                {/* VEHICLE */}

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontWeight:
                        "600",
                      marginBottom:
                        "7px",
                      color:
                        "#334155",
                    }}
                  >
                    🚚 Vehicle
                  </label>

                  <select
                    value={
                      tripVehicle
                    }
                    onChange={(e) =>
                      setTripVehicle(
                        e.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        "7px",
                      backgroundColor:
                        "#ffffff",
                      color:
                        "#172033",
                      fontSize:
                        "15px",
                      boxSizing:
                        "border-box",
                    }}
                  >

                    <option value="">
                      Select Vehicle
                    </option>

                    {vehicles.map(
                      (vehicle) => (

                        <option
                          key={
                            vehicle.id
                          }
                          value={
                            vehicle.vehicle_number
                          }
                        >
                          {
                            vehicle.vehicle_number
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                <button
                  type="submit"
                  className="add-button"
                  style={{
                    padding:
                      "12px 20px",
                    height:
                      "45px",
                    fontSize:
                      "15px",
                  }}
                >
                  📅 Schedule Trip
                </button>

                <button
                  type="button"
                  onClick={
                    handleClearTrip
                  }
                  style={{
                    padding:
                      "12px 20px",
                    height:
                      "45px",
                    fontSize:
                      "15px",
                    border:
                      "none",
                    borderRadius:
                      "7px",
                    cursor:
                      "pointer",
                    backgroundColor:
                      "#64748b",
                    color:
                      "#ffffff",
                  }}
                >
                  Clear
                </button>

              </div>

              {tripMessage && (
                <p
                  style={{
                    marginTop:
                      "18px",
                    padding:
                      "12px",
                    borderRadius:
                      "7px",
                    backgroundColor:
                      tripMessage.includes(
                        "successfully"
                      )
                        ? "#dcfce7"
                        : "#fef3c7",
                    color:
                      tripMessage.includes(
                        "successfully"
                      )
                        ? "#166534"
                        : "#92400e",
                    fontWeight:
                      "600",
                    textAlign:
                      "center",
                  }}
                >
                  {tripMessage}
                </p>
              )}

            </form>

            <div
              style={{
                marginTop:
                  "30px",
              }}
            >

              <h2
                style={{
                  color:
                    "#172033",
                  marginBottom:
                    "15px",
                }}
              >
                📋 Scheduled Trips
              </h2>

              {scheduledTrips.length ===
              0 ? (

                <div
                  style={{
                    padding:
                      "30px",
                    textAlign:
                      "center",
                    background:
                      "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "10px",
                    color:
                      "#64748b",
                  }}
                >
                  No trips scheduled yet.
                </div>

              ) : (

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "15px",
                  }}
                >

                  {scheduledTrips.map(
                    (trip) => (

                      <div
                        key={
                          trip.id
                        }
                        style={{
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "10px",
                          padding:
                            "20px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                "0",
                              color:
                                "#172033",
                            }}
                          >
                            🚚{" "}
                            {
                              trip.source
                            }
                            {" → "}
                            {
                              trip.destination
                            }
                          </h3>

                          <span
                            style={{
                              background:
                                "#dcfce7",
                              color:
                                "#166534",
                              padding:
                                "6px 12px",
                              borderRadius:
                                "20px",
                              fontWeight:
                                "600",
                            }}
                          >
                            {
                              trip.status
                            }
                          </span>

                        </div>

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap:
                              "12px",
                            marginTop:
                              "15px",
                            color:
                              "#475569",
                          }}
                        >

                          <div>
                            📍{" "}
                            <strong>
                              Source:
                            </strong>{" "}
                            {
                              trip.source
                            }
                          </div>

                          <div>
                            📍{" "}
                            <strong>
                              Destination:
                            </strong>{" "}
                            {
                              trip.destination
                            }
                          </div>

                          <div>
                            📅{" "}
                            <strong>
                              Date:
                            </strong>{" "}
                            {
                              trip.date
                            }
                          </div>

                          <div>
                            🚚{" "}
                            <strong>
                              Vehicle:
                            </strong>{" "}
                            {
                              trip.vehicle
                            }
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteTrip(
                              trip.id
                            )
                          }
                          style={{
                            marginTop:
                              "15px",
                            padding:
                              "8px 14px",
                            border:
                              "none",
                            borderRadius:
                              "6px",
                            background:
                              "#fee2e2",
                            color:
                              "#b91c1c",
                            cursor:
                              "pointer",
                            fontWeight:
                              "600",
                          }}
                        >
                          Delete Trip
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>
        )}

        {/* =================================================
            REAL TIME TRACKING
        ================================================= */}

        {activePage ===
          "realTimeTracking" && (
          <RealTimeTracking />
        )}

        {/* =================================================
            ETA CALCULATION
        ================================================= */}

        {activePage ===
          "etaCalculation" && (
          <ETACalculation />
        )}

      </main>

      {/* =================================================
          ADD / EDIT VEHICLE FORM
      ================================================= */}

      {showForm && (
        <div className="form-overlay">

          <div className="vehicle-form">

            <h2>
              {editingVehicle
                ? "Edit Vehicle"
                : "Add Vehicle"}
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <input
                type="text"
                name="vehicle_number"
                placeholder="Vehicle Number"
                value={
                  formData.vehicle_number
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="vehicle_type"
                placeholder="Vehicle Type"
                value={
                  formData.vehicle_type
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="driver_name"
                placeholder="Driver Name"
                value={
                  formData.driver_name
                }
                onChange={
                  handleChange
                }
                required
              />

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
              >

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

              </select>

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={
                  formData.location
                }
                onChange={
                  handleChange
                }
              />

              <select
                name="fuel_type"
                value={
                  formData.fuel_type
                }
                onChange={
                  handleChange
                }
              >

                <option value="Diesel">
                  Diesel
                </option>

                <option value="Petrol">
                  Petrol
                </option>

                <option value="CNG">
                  CNG
                </option>

                <option value="Electric">
                  Electric
                </option>

              </select>

              <input
                type="text"
                name="mileage"
                placeholder="Mileage (e.g. 15 km/l)"
                value={
                  formData.mileage
                }
                onChange={
                  handleChange
                }
              />

              <input
                type="number"
                name="registration_year"
                placeholder="Registration Year"
                value={
                  formData.registration_year
                }
                onChange={
                  handleChange
                }
                min="1900"
                max="2026"
              />

              <div className="form-buttons">

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingVehicle
                    ? "Update Vehicle"
                    : "Add Vehicle"}
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(
                      false
                    );

                    setEditingVehicle(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          ADD / EDIT MAINTENANCE FORM
      ================================================= */}

      {showMaintenanceForm && (
        <div
          className="form-overlay"
        >

          <div
            className="vehicle-form"
          >

            <h2>
              {editingMaintenance
                ? "Edit Maintenance"
                : "Add Maintenance"}
            </h2>

            <form
              onSubmit={
                handleMaintenanceSubmit
              }
            >

              {/* VEHICLE */}

              <label>
                🚚 Vehicle
              </label>

              <select
                name="vehicle"
                value={
                  maintenanceForm.vehicle
                }
                onChange={
                  handleMaintenanceChange
                }
                required
              >

                <option value="">
                  Select Vehicle
                </option>

                {vehicles.map(
                  (vehicle) => (

                    <option
                      key={
                        vehicle.id
                      }
                      value={
                        vehicle.vehicle_number
                      }
                    >
                      {
                        vehicle.vehicle_number
                      }
                    </option>

                  )
                )}

              </select>

              {/* MAINTENANCE TYPE */}

              <label>
                🔧 Maintenance Type
              </label>

              <select
                name="type"
                value={
                  maintenanceForm.type
                }
                onChange={
                  handleMaintenanceChange
                }
              >

                <option value="Regular Service">
                  Regular Service
                </option>

                <option value="Oil Change">
                  Oil Change
                </option>

                <option value="Brake Service">
                  Brake Service
                </option>

                <option value="Tyre Replacement">
                  Tyre Replacement
                </option>

                <option value="Engine Repair">
                  Engine Repair
                </option>

                <option value="Battery Service">
                  Battery Service
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

              {/* DATE */}

              <label>
                📅 Maintenance Date
              </label>

              <input
                type="date"
                name="date"
                value={
                  maintenanceForm.date
                }
                onChange={
                  handleMaintenanceChange
                }
                required
              />

              {/* COST */}

              <label>
                💰 Cost
              </label>

              <input
                type="number"
                name="cost"
                placeholder="Enter maintenance cost"
                value={
                  maintenanceForm.cost
                }
                onChange={
                  handleMaintenanceChange
                }
                min="0"
              />

              {/* STATUS */}

              <label>
                📌 Status
              </label>

              <select
                name="status"
                value={
                  maintenanceForm.status
                }
                onChange={
                  handleMaintenanceChange
                }
              >

                <option value="Scheduled">
                  Scheduled
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>

              </select>

              {/* DESCRIPTION */}

              <label>
                📝 Description
              </label>

              <textarea
                name="description"
                placeholder="Enter maintenance details"
                value={
                  maintenanceForm.description
                }
                onChange={
                  handleMaintenanceChange
                }
                rows="4"
                style={{
                  width:
                    "100%",
                  padding:
                    "12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "7px",
                  resize:
                    "vertical",
                  fontFamily:
                    "inherit",
                  boxSizing:
                    "border-box",
                  marginBottom:
                    "15px",
                }}
              />

              {/* BUTTONS */}

              <div
                className="form-buttons"
              >

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingMaintenance
                    ? "Update Maintenance"
                    : "Add Maintenance"}
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowMaintenanceForm(
                      false
                    );

                    setEditingMaintenance(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;