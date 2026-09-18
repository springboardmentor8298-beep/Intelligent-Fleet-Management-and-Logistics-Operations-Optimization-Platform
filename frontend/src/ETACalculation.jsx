import React, { useEffect, useState } from "react";

function ETACalculation() {
  const [vehicles, setVehicles] = useState([]);

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [speed, setSpeed] = useState("");

  const [eta, setEta] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // FETCH VEHICLES
  // --------------------------------------------------

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/vehicles"
        );

        const data = await response.json();

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

    fetchVehicles();
  }, []);

  // --------------------------------------------------
  // CALCULATE ETA
  // --------------------------------------------------

  const calculateETA = (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setEta("");
    setArrivalTime("");

    // Validate fields
    if (
      !vehicleNumber ||
      !source.trim() ||
      !destination.trim() ||
      !distance ||
      !speed
    ) {
      setError(
        "Please enter vehicle, source, destination, distance and speed."
      );

      return;
    }

    // Same source and destination
    if (
      source.trim().toLowerCase() ===
      destination.trim().toLowerCase()
    ) {
      setError(
        "Source and destination cannot be the same."
      );

      return;
    }

    const distanceValue = Number(distance);
    const speedValue = Number(speed);

    if (
      isNaN(distanceValue) ||
      isNaN(speedValue) ||
      distanceValue <= 0 ||
      speedValue <= 0
    ) {
      setError(
        "Distance and speed must be greater than 0."
      );

      return;
    }

    // --------------------------------------------------
    // ETA FORMULA
    //
    // Time = Distance / Speed
    // --------------------------------------------------

    const timeInHours =
      distanceValue / speedValue;

    const totalMinutes =
      Math.round(timeInHours * 60);

    const hours =
      Math.floor(totalMinutes / 60);

    const minutes =
      totalMinutes % 60;

    // ETA display
    let etaText = "";

    if (hours > 0 && minutes > 0) {
      etaText =
        `${hours} hour${hours > 1 ? "s" : ""} ` +
        `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      etaText =
        `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      etaText =
        `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    setEta(etaText);

    // --------------------------------------------------
    // CALCULATE ARRIVAL CLOCK TIME
    // --------------------------------------------------

    const now = new Date();

    const arrival = new Date(
      now.getTime() +
        totalMinutes * 60 * 1000
    );

    const arrivalHours =
      arrival.getHours();

    const arrivalMinutes =
      arrival.getMinutes();

    const formattedTime =
      `${arrivalHours
        .toString()
        .padStart(2, "0")}:${arrivalMinutes
        .toString()
        .padStart(2, "0")}`;

    setArrivalTime(formattedTime);

    setMessage(
      "ETA calculated successfully."
    );
  };

  // --------------------------------------------------
  // CLEAR
  // --------------------------------------------------

  const handleClear = () => {
    setVehicleNumber("");
    setSource("");
    setDestination("");
    setDistance("");
    setSpeed("");

    setEta("");
    setArrivalTime("");

    setError("");
    setMessage("");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <section className="content-card">

      {/* PAGE TITLE */}

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
          ⏱️ ETA Calculation
        </h2>

        <p
          style={{
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Calculate the estimated time of arrival
          for a vehicle based on distance and speed.
        </p>
      </div>


      {/* CALCULATION FORM */}

      <form
        onSubmit={calculateETA}
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "25px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >

          {/* VEHICLE */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              🚚 Vehicle
            </label>

            <select
              value={vehicleNumber}
              onChange={(e) =>
                setVehicleNumber(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor:
                  "#ffffff",
                color: "#172033",
                fontSize: "15px",
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
                    key={vehicle.id}
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


          {/* SOURCE */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              📍 Source
            </label>

            <input
              type="text"
              placeholder="Example: Srikakulam"
              value={source}
              onChange={(e) =>
                setSource(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor:
                  "#ffffff",
                color: "#172033",
                fontSize: "15px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>


          {/* DESTINATION */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              📍 Destination
            </label>

            <input
              type="text"
              placeholder="Example: Visakhapatnam"
              value={destination}
              onChange={(e) =>
                setDestination(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor:
                  "#ffffff",
                color: "#172033",
                fontSize: "15px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>


          {/* DISTANCE */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              🛣️ Distance (km)
            </label>

            <input
              type="number"
              min="1"
              placeholder="Example: 120"
              value={distance}
              onChange={(e) =>
                setDistance(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor:
                  "#ffffff",
                color: "#172033",
                fontSize: "15px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>


          {/* SPEED */}

          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "7px",
                color: "#334155",
              }}
            >
              🚗 Average Speed (km/h)
            </label>

            <input
              type="number"
              min="1"
              placeholder="Example: 60"
              value={speed}
              onChange={(e) =>
                setSpeed(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                backgroundColor:
                  "#ffffff",
                color: "#172033",
                fontSize: "15px",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

        </div>


        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "25px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >

          <button
            type="submit"
            className="add-button"
            style={{
              padding:
                "12px 25px",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            ⏱️ Calculate ETA
          </button>


          <button
            type="button"
            onClick={handleClear}
            style={{
              padding:
                "12px 25px",
              background:
                "#64748b",
              color: "#ffffff",
              border: "none",
              borderRadius: "7px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Clear
          </button>

        </div>


        {/* SUCCESS MESSAGE */}

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background:
                "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ✅ {message}
          </div>
        )}


        {/* ERROR MESSAGE */}

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background:
                "#fee2e2",
              color: "#b91c1c",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ❌ {error}
          </div>
        )}

      </form>


      {/* ETA RESULT */}

      {eta && (
        <div
          style={{
            marginTop: "25px",
            background: "#ffffff",
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "25px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.05)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              color: "#172033",
              textAlign: "center",
            }}
          >
            📊 ETA Result
          </h2>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >

            <div
              style={{
                padding: "20px",
                background:
                  "#f8fafc",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                🚚 Vehicle
              </strong>

              <p
                style={{
                  fontSize: "20px",
                  marginBottom: 0,
                }}
              >
                {vehicleNumber}
              </p>
            </div>


            <div
              style={{
                padding: "20px",
                background:
                  "#f8fafc",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                📍 Route
              </strong>

              <p
                style={{
                  fontSize: "16px",
                  marginBottom: 0,
                }}
              >
                {source}
                {" → "}
                {destination}
              </p>
            </div>


            <div
              style={{
                padding: "20px",
                background:
                  "#f8fafc",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                🛣️ Distance
              </strong>

              <p
                style={{
                  fontSize: "20px",
                  marginBottom: 0,
                }}
              >
                {distance} km
              </p>
            </div>


            <div
              style={{
                padding: "20px",
                background:
                  "#f8fafc",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                🚗 Speed
              </strong>

              <p
                style={{
                  fontSize: "20px",
                  marginBottom: 0,
                }}
              >
                {speed} km/h
              </p>
            </div>


            <div
              style={{
                padding: "20px",
                background:
                  "#eff6ff",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                ⏱️ Estimated Travel Time
              </strong>

              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#2563eb",
                  marginBottom: 0,
                }}
              >
                {eta}
              </p>
            </div>


            <div
              style={{
                padding: "20px",
                background:
                  "#ecfdf5",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <strong>
                🕐 Estimated Arrival
              </strong>

              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#166534",
                  marginBottom: 0,
                }}
              >
                {arrivalTime}
              </p>
            </div>

          </div>

        </div>
      )}

    </section>
  );
}

export default ETACalculation;