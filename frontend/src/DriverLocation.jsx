import React, { useEffect, useState } from "react";

function DriverLocation() {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [message, setMessage] = useState("Waiting for location...");
  const [error, setError] = useState("");

  // Change this vehicle ID depending on the driver
  const vehicleId = 1;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);
        setError("");

        try {
          const response = await fetch(
            `http://127.0.0.1:8000/vehicles/${vehicleId}/location`,
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
            setMessage("Location sent successfully");
          } else {
            setMessage(data.detail || "Failed to send location");
          }
        } catch (err) {
          setMessage("Backend connection failed");
          console.error(err);
        }
      },

      (error) => {
        setError(error.message);
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
  }, []);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        fontFamily: "Arial",
      }}
    >
      <h2>🚚 Driver GPS Tracking</h2>

      <p>
        <strong>Vehicle ID:</strong> {vehicleId}
      </p>

      <hr />

      {latitude !== null && longitude !== null ? (
        <>
          <p>
            <strong>Latitude:</strong> {latitude}
          </p>

          <p>
            <strong>Longitude:</strong> {longitude}
          </p>

          <p>📍 {message}</p>
        </>
      ) : (
        <p>📍 Getting your current location...</p>
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