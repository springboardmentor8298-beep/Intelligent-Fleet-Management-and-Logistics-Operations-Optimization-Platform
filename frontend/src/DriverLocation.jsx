import React, { useEffect, useState } from "react";

function DriverLocation() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [message, setMessage] = useState("Select a vehicle to start tracking.");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/vehicles"
      );

      const data = await response.json();

      const vehicleList = Array.isArray(data)
        ? data
        : data.vehicles || [];

      setVehicles(vehicleList);

      if (vehicleList.length > 0) {
        setSelectedVehicle(String(vehicleList[0].id));
      }
    } catch (error) {
      console.error(error);
      setError("Unable to load vehicles.");
    }
  };

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setMessage("Getting current location...");
    setError("");

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);
        setError("");
        setMessage("Sending location...");

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/vehicles/${selectedVehicle}/location`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                latitude: lat,
                longitude: lon,
              }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            setMessage(
              "Location sent successfully"
            );
          } else {
            setMessage(
              data.detail ||
                "Failed to send location"
            );
          }
        } catch (err) {
          console.error(err);
          setMessage(
            "Backend connection failed"
          );
        }
      },
      (geoError) => {
        setError(geoError.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [selectedVehicle]);

  const selectedVehicleData = vehicles.find(
    (vehicle) =>
      String(vehicle.id) === String(selectedVehicle)
  );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        background: "#ffffff",
        fontFamily: "Arial",
      }}
    >
      <h2>🚚 Driver GPS Tracking</h2>

      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "600",
        }}
      >
        Select Vehicle
      </label>

      <select
        value={selectedVehicle}
        onChange={(e) => {
          setSelectedVehicle(e.target.value);
          setLatitude(null);
          setLongitude(null);
          setMessage("Getting current location...");
          setError("");
        }}
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #cbd5e1",
          borderRadius: "7px",
          marginBottom: "20px",
          fontSize: "15px",
        }}
      >
        <option value="">
          Select Vehicle
        </option>

        {vehicles.map((vehicle) => (
          <option
            key={vehicle.id}
            value={vehicle.id}
          >
            {vehicle.vehicle_number} -{" "}
            {vehicle.driver_name || "No Driver"}
          </option>
        ))}
      </select>

      {selectedVehicleData && (
        <div
          style={{
            background: "#f8fafc",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <p>
            <strong>Vehicle:</strong>{" "}
            {selectedVehicleData.vehicle_number}
          </p>

          <p>
            <strong>Driver:</strong>{" "}
            {selectedVehicleData.driver_name ||
              "Not Assigned"}
          </p>

          <p>
            <strong>Vehicle ID:</strong>{" "}
            {selectedVehicleData.id}
          </p>
        </div>
      )}

      <hr />

      {latitude !== null &&
      longitude !== null ? (
        <>
          <p>
            <strong>Latitude:</strong>{" "}
            {latitude}
          </p>

          <p>
            <strong>Longitude:</strong>{" "}
            {longitude}
          </p>

          <p>📍 {message}</p>
        </>
      ) : (
        <p>
          📍 Getting your current location...
        </p>
      )}

      {error && (
        <p style={{ color: "red" }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
}

export default DriverLocation;