import React, { useEffect, useState } from "react";

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


// ==================================================
// FIX LEAFLET MARKER ICON
// ==================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ==================================================
// DEFAULT MAP LOCATION
// ==================================================

const defaultPosition = [17.6868, 83.2185];


// ==================================================
// LOCATION COORDINATES
// ==================================================

const locationCoordinates = {

  // North Andhra

  Srikakulam: [18.2949, 83.8938],

  Vizianagaram: [18.1067, 83.3956],

  Visakhapatnam: [17.6868, 83.2185],

  Anakapalle: [17.6913, 83.0037],

  Araku: [18.3273, 82.8775],

  // East Godavari

  Rajahmundry: [17.0005, 81.8040],

  Kakinada: [16.9891, 82.2475],

  Amalapuram: [16.5787, 82.0061],

  Tuni: [17.3590, 82.5460],

  Pithapuram: [17.1168, 82.2528],

  Samalkota: [17.0560, 82.2436],

  Rampachodavaram: [17.4409, 81.7756],

  // West Godavari

  Eluru: [16.7107, 81.0952],

  Bhimavaram: [16.5449, 81.5212],

  Tadepalligudem: [16.8147, 81.5275],

  Narsapur: [16.4340, 81.6980],

  Tanuku: [16.7550, 81.6810],

  // Krishna

  Vijayawada: [16.5062, 80.6480],

  Machilipatnam: [16.1875, 81.1389],

  Gudivada: [16.4355, 80.9920],

  Nuzvid: [16.7880, 80.8450],

  // Guntur

  Guntur: [16.3067, 80.4365],

  Tenali: [16.2430, 80.6400],

  Narasaraopet: [16.2350, 80.0490],

  // Prakasam

  Ongole: [15.5057, 80.0499],

  Chirala: [15.8246, 80.3521],

  Markapur: [15.7350, 79.2680],

  // Nellore

  Nellore: [14.4426, 79.9865],

  Kavali: [14.9163, 79.9947],

  Gudur: [14.1500, 79.8500],

  // Rayalaseema

  Tirupati: [13.6288, 79.4192],

  Chittoor: [13.2172, 79.1003],

  Kadapa: [14.4673, 78.8242],

  Kurnool: [15.8281, 78.0373],

  Anantapur: [14.6819, 77.6006],

  Hindupur: [13.8281, 77.4914],

  // Other major cities

  Amaravati: [16.5745, 80.3575],

  Rajampet: [14.1950, 79.1600],

};


// ==================================================
// MOVE MAP TO LOCATION
// ==================================================

function MoveToLocation({ position }) {

  const map = useMap();

  useEffect(() => {

    if (position) {

      map.setView(position, 10);

    }

  }, [position, map]);

  return null;
}


// ==================================================
// MAIN COMPONENT
// ==================================================

function MapTracking() {

  // Vehicle number

  const [vehicleNumber, setVehicleNumber] =
    useState("");


  // Selected vehicle

  const [selectedVehicle, setSelectedVehicle] =
    useState(null);


  // Starting location

  const [startingLocation, setStartingLocation] =
    useState(null);


  // Current location

  const [currentLocation, setCurrentLocation] =
    useState(null);


  // Shipments

  const [shipments, setShipments] =
    useState([]);


  // Loading

  const [loading, setLoading] =
    useState(false);


  // Error

  const [error, setError] =
    useState("");


  // Success message

  const [message, setMessage] =
    useState("");


// ==================================================
// FETCH SHIPMENTS
// ==================================================

  const fetchShipments = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/shipments"
      );


      if (!response.ok) {

        throw new Error(
          "Failed to fetch shipments"
        );

      }


      const data =
        await response.json();


      console.log(
        "Shipments:",
        data
      );


      if (Array.isArray(data)) {

        setShipments(data);

      }

      else if (
        Array.isArray(data.shipments)
      ) {

        setShipments(
          data.shipments
        );

      }

      else {

        setShipments([]);

      }


    }

    catch (err) {

      console.error(
        "Shipment fetch error:",
        err
      );

      setShipments([]);

    }

  };


// ==================================================
// LOAD SHIPMENTS
// ==================================================

  useEffect(() => {

    fetchShipments();


    const interval =
      setInterval(
        fetchShipments,
        5000
      );


    return () =>
      clearInterval(interval);

  }, []);


// ==================================================
// FIND VEHICLE
// ==================================================

  const trackVehicle = () => {

    setError("");

    setMessage("");

    setSelectedVehicle(null);

    setStartingLocation(null);

    setCurrentLocation(null);


    const enteredNumber =
      vehicleNumber
        .trim()
        .toUpperCase();


    // Empty input

    if (!enteredNumber) {

      setError(
        "Please enter a vehicle number."
      );

      return;

    }


    setLoading(true);


// ==================================================
// FIND VEHICLE FROM SHIPMENTS
// ==================================================

    const vehicleShipment =
      shipments.find(
        (shipment) => {

          const number =
            String(
              shipment.vehicle_number || ""
            )
              .trim()
              .toUpperCase();


          return number ===
            enteredNumber;

        }
      );


    // Vehicle not found

    if (!vehicleShipment) {

      setError(
        `Vehicle ${enteredNumber} was not found.`
      );

      setLoading(false);

      return;

    }


// ==================================================
// GET STARTING LOCATION
// ==================================================

    const startName =
      vehicleShipment.starting_location ||
      vehicleShipment.start_location ||
      vehicleShipment.source ||
      vehicleShipment.origin ||
      vehicleShipment.startingLocation;


// ==================================================
// GET CURRENT LOCATION
// ==================================================

    const currentName =
      vehicleShipment.current_location ||
      vehicleShipment.currentLocation ||
      vehicleShipment.destination ||
      vehicleShipment.location;


// ==================================================
// CHECK START LOCATION
// ==================================================

    if (!startName) {

      setError(
        "Starting location is not available for this vehicle."
      );

      setLoading(false);

      return;

    }


// ==================================================
// CHECK CURRENT LOCATION
// ==================================================

    if (!currentName) {

      setError(
        "Current location is not available for this vehicle."
      );

      setLoading(false);

      return;

    }


// ==================================================
// FIND START COORDINATES
// ==================================================

    const startCoordinates =
      locationCoordinates[
        startName
      ];


// ==================================================
// FIND CURRENT COORDINATES
// ==================================================

    const currentCoordinates =
      locationCoordinates[
        currentName
      ];


// ==================================================
// START LOCATION NOT FOUND
// ==================================================

    if (!startCoordinates) {

      setError(
        `Starting location "${startName}" does not have map coordinates.`
      );

      setLoading(false);

      return;

    }


// ==================================================
// CURRENT LOCATION NOT FOUND
// ==================================================

    if (!currentCoordinates) {

      setError(
        `Current location "${currentName}" does not have map coordinates.`
      );

      setLoading(false);

      return;

    }


// ==================================================
// SAVE VEHICLE DATA
// ==================================================

    setSelectedVehicle(
      vehicleShipment
    );


    setStartingLocation({

      name: startName,

      coordinates:
        startCoordinates,

    });


    setCurrentLocation({

      name: currentName,

      coordinates:
        currentCoordinates,

    });


    setMessage(
      `Vehicle ${enteredNumber} found successfully.`
    );


    setLoading(false);

  };


// ==================================================
// ENTER KEY
// ==================================================

  const handleKeyDown = (event) => {

    if (event.key === "Enter") {

      trackVehicle();

    }

  };


// ==================================================
// CLEAR
// ==================================================

  const clearTracking = () => {

    setVehicleNumber("");

    setSelectedVehicle(null);

    setStartingLocation(null);

    setCurrentLocation(null);

    setError("");

    setMessage("");

  };


// ==================================================
// MAP CENTER
// ==================================================

  const mapCenter =
    currentLocation
      ? currentLocation.coordinates
      : startingLocation
      ? startingLocation.coordinates
      : defaultPosition;


// ==================================================
// ROUTE LINE
// ==================================================

  const routePositions =
    startingLocation &&
    currentLocation
      ? [
          startingLocation.coordinates,
          currentLocation.coordinates,
        ]
      : [];


// ==================================================
// UI
// ==================================================

  return (

    <div
      style={{
        width: "100%",
        minHeight:
          "calc(100vh - 120px)",
        padding: "25px",
        boxSizing: "border-box",
      }}
    >


      {/* ==================================================
          TITLE
      ================================================== */}

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

        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            color: "#172033",
          }}
        >
          📍 Live Tracking
        </h1>


        <p
          style={{
            marginTop: "8px",
            marginBottom: 0,
            color: "#64748b",
            fontSize: "16px",
          }}
        >
          Track the starting and current location of any vehicle
        </p>

      </div>


      {/* ==================================================
          SEARCH VEHICLE
      ================================================== */}

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

        <h2
          style={{
            marginTop: 0,
            color: "#172033",
          }}
        >
          🚚 Track Vehicle
        </h2>


        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >

          <input
            type="text"
            placeholder="Enter vehicle number e.g. AP39AB1234"
            value={vehicleNumber}
            onChange={(e) =>
              setVehicleNumber(
                e.target.value
              )
            }
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              minWidth: "280px",
              padding: "14px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />


          <button
            onClick={trackVehicle}
            disabled={loading}
            style={{
              padding:
                "14px 25px",
              background:
                "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >

            {loading
              ? "Tracking..."
              : "📍 Track Vehicle"}

          </button>


          <button
            onClick={clearTracking}
            style={{
              padding:
                "14px 22px",
              background:
                "#64748b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >

            Clear

          </button>

        </div>


        {/* ==================================================
            EXAMPLES
        ================================================== */}

        <p
          style={{
            marginTop: "15px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >

          Try:
          {" "}

          <strong>AP39AB1234</strong>,
          {" "}

          <strong>AP39CD4567</strong>,
          {" "}

          <strong>AP39EF7890</strong>,
          {" "}

          <strong>AP39GH1122</strong>

        </p>


        {/* ==================================================
            SUCCESS
        ================================================== */}

        {message && (

          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background:
                "#dcfce7",
              color:
                "#166534",
              borderRadius: "8px",
            }}
          >

            ✅ {message}

          </div>

        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background:
                "#fee2e2",
              color:
                "#b91c1c",
              borderRadius: "8px",
            }}
          >

            ❌ {error}

          </div>

        )}

      </div>


      {/* ==================================================
          VEHICLE INFORMATION
      ================================================== */}

      {selectedVehicle && (

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

          <h2
            style={{
              marginTop: 0,
              color: "#172033",
            }}
          >
            🚚 Vehicle Information
          </h2>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >


            {/* VEHICLE */}

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >

              <strong>
                Vehicle Number
              </strong>

              <br />

              {selectedVehicle.vehicle_number}

            </div>


            {/* DRIVER */}

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >

              <strong>
                Driver
              </strong>

              <br />

              {selectedVehicle.driver_name ||
                selectedVehicle.driver ||
                "Not Assigned"}

            </div>


            {/* STATUS */}

            <div
              style={{
                padding: "15px",
                background:
                  "#f8fafc",
                borderRadius: "8px",
              }}
            >

              <strong>
                Status
              </strong>

              <br />

              {selectedVehicle.status}

            </div>


            {/* START */}

            <div
              style={{
                padding: "15px",
                background:
                  "#eff6ff",
                borderRadius: "8px",
              }}
            >

              <strong>
                🟢 Starting Location
              </strong>

              <br />

              {startingLocation?.name}

            </div>


            {/* CURRENT */}

            <div
              style={{
                padding: "15px",
                background:
                  "#fff7ed",
                borderRadius: "8px",
              }}
            >

              <strong>
                🔴 Current Location
              </strong>

              <br />

              {currentLocation?.name}

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          MAP
      ================================================== */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "20px",
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
          🗺️ Vehicle Route Map
        </h2>


        {/* ==================================================
            LOCATION SUMMARY
        ================================================== */}

        {startingLocation &&
          currentLocation && (

          <div
            style={{
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >

            <div
              style={{
                flex: 1,
                minWidth: "220px",
                padding: "15px",
                background:
                  "#eff6ff",
                borderRadius: "8px",
                border:
                  "1px solid #bfdbfe",
              }}
            >

              🟢 <strong>
                Starting Location
              </strong>

              <br />

              {startingLocation.name}

            </div>


            <div
              style={{
                flex: 1,
                minWidth: "220px",
                padding: "15px",
                background:
                  "#fff7ed",
                borderRadius: "8px",
                border:
                  "1px solid #fed7aa",
              }}
            >

              🔴 <strong>
                Current Location
              </strong>

              <br />

              {currentLocation.name}

            </div>

          </div>

        )}


        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{
            height: "550px",
            width: "100%",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* ==================================================
              MOVE MAP
          ================================================== */}

          {(currentLocation ||
            startingLocation) && (

            <MoveToLocation
              position={
                currentLocation
                  ? currentLocation.coordinates
                  : startingLocation.coordinates
              }
            />

          )}


          {/* ==================================================
              STARTING LOCATION MARKER
          ================================================== */}

          {startingLocation && (

            <Marker
              position={
                startingLocation.coordinates
              }
            >

              <Popup>

                <div
                  style={{
                    minWidth: "200px",
                  }}
                >

                  <h3
                    style={{
                      marginTop: 0,
                      color: "#2563eb",
                    }}
                  >
                    🟢 Starting Location
                  </h3>


                  <strong>
                    Vehicle:
                  </strong>

                  <br />

                  {selectedVehicle?.vehicle_number}

                  <br />
                  <br />


                  <strong>
                    Location:
                  </strong>

                  <br />

                  {startingLocation.name}

                  <br />
                  <br />


                  <strong>
                    Latitude:
                  </strong>

                  <br />

                  {startingLocation.coordinates[0].toFixed(6)}

                  <br />


                  <strong>
                    Longitude:
                  </strong>

                  <br />

                  {startingLocation.coordinates[1].toFixed(6)}

                </div>

              </Popup>

            </Marker>

          )}


          {/* ==================================================
              CURRENT LOCATION MARKER
          ================================================== */}

          {currentLocation && (

            <Marker
              position={
                currentLocation.coordinates
              }
            >

              <Popup>

                <div
                  style={{
                    minWidth: "200px",
                  }}
                >

                  <h3
                    style={{
                      marginTop: 0,
                      color: "#dc2626",
                    }}
                  >
                    🔴 Current Location
                  </h3>


                  <strong>
                    Vehicle:
                  </strong>

                  <br />

                  {selectedVehicle?.vehicle_number}

                  <br />
                  <br />


                  <strong>
                    Driver:
                  </strong>

                  <br />

                  {selectedVehicle?.driver_name ||
                    selectedVehicle?.driver ||
                    "Not Assigned"}

                  <br />
                  <br />


                  <strong>
                    Location:
                  </strong>

                  <br />

                  {currentLocation.name}

                  <br />
                  <br />


                  <strong>
                    Latitude:
                  </strong>

                  <br />

                  {currentLocation.coordinates[0].toFixed(6)}

                  <br />


                  <strong>
                    Longitude:
                  </strong>

                  <br />

                  {currentLocation.coordinates[1].toFixed(6)}

                </div>

              </Popup>

            </Marker>

          )}


          {/* ==================================================
              ROUTE LINE
          ================================================== */}

          {routePositions.length === 2 && (

            <Polyline
              positions={routePositions}
              pathOptions={{
                color: "blue",
                weight: 5,
                opacity: 0.7,
              }}
            />

          )}

        </MapContainer>

      </div>

    </div>

  );

}


export default MapTracking;