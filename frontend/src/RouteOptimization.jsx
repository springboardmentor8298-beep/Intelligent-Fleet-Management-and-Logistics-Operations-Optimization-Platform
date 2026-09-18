import React, { useState } from "react";

function RouteOptimization() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [route, setRoute] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // GEOCODE LOCATION
  // ---------------------------------------------------------

  const geocodeLocation = async (place) => {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        place
      )}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Unable to find location: ${place}`
      );
    }

    const data = await response.json();

    if (
      !data.features ||
      data.features.length === 0
    ) {
      throw new Error(
        `Location not found: ${place}`
      );
    }

    const feature = data.features[0];

    const coordinates =
      feature.geometry.coordinates;

    const properties = feature.properties || {};

    return {
      name:
        properties.name ||
        properties.city ||
        properties.town ||
        properties.village ||
        place,

      lon: coordinates[0],

      lat: coordinates[1],
    };
  };


  // ---------------------------------------------------------
  // REVERSE GEOCODE
  // Get town/village name from latitude and longitude
  // ---------------------------------------------------------

  const reverseGeocode = async (
    lat,
    lon
  ) => {
    try {
      const url =
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;

      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (
        !data.features ||
        data.features.length === 0
      ) {
        return null;
      }

      const properties =
        data.features[0].properties || {};

      return (
        properties.city ||
        properties.town ||
        properties.village ||
        properties.locality ||
        properties.district ||
        properties.name ||
        null
      );
    } catch (error) {
      console.log(
        "Reverse geocoding failed:",
        error
      );

      return null;
    }
  };


  // ---------------------------------------------------------
  // FORMAT TIME
  // ---------------------------------------------------------

  const formatDuration = (seconds) => {
    const totalMinutes = Math.round(
      seconds / 60
    );

    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${
        hours !== 1 ? "s" : ""
      } ${minutes} minute${
        minutes !== 1 ? "s" : ""
      }`;
    }

    if (hours > 0) {
      return `${hours} hour${
        hours !== 1 ? "s" : ""
      }`;
    }

    return `${minutes} minute${
      minutes !== 1 ? "s" : ""
    }`;
  };


  // ---------------------------------------------------------
  // GET INTERMEDIATE LOCATIONS
  // ---------------------------------------------------------

  const getIntermediateLocations = async (
    coordinates,
    sourceName,
    destinationName
  ) => {
    if (
      !coordinates ||
      coordinates.length < 2
    ) {
      return [
        sourceName,
        destinationName,
      ];
    }

    /*
      We do not reverse-geocode every road point.

      Instead, we select a few points along the
      actual route so the UI remains clean.
    */

    const numberOfPoints = Math.min(
      5,
      Math.max(
        2,
        Math.floor(
          coordinates.length / 100
        )
      )
    );

    const selectedPoints = [];

    for (
      let i = 0;
      i < numberOfPoints;
      i++
    ) {
      const ratio =
        i /
        (numberOfPoints - 1);

      const index = Math.floor(
        ratio *
          (coordinates.length - 1)
      );

      selectedPoints.push(
        coordinates[index]
      );
    }

    const places = [];

    /*
      First location
    */

    places.push(sourceName);

    /*
      Reverse-geocode intermediate
      route points.
    */

    for (
      let i = 1;
      i <
      selectedPoints.length - 1;
      i++
    ) {
      const coordinate =
        selectedPoints[i];

      const lon =
        coordinate[0];

      const lat =
        coordinate[1];

      const place =
        await reverseGeocode(
          lat,
          lon
        );

      if (place) {
        places.push(place);
      }
    }

    /*
      Always add destination at the end.
    */

    places.push(destinationName);

    /*
      Remove duplicate locations.
    */

    const uniquePlaces = [];

    places.forEach((place) => {
      if (!place) {
        return;
      }

      const cleanPlace =
        place.trim();

      const alreadyExists =
        uniquePlaces.some(
          (existing) =>
            existing.toLowerCase() ===
            cleanPlace.toLowerCase()
        );

      if (!alreadyExists) {
        uniquePlaces.push(
          cleanPlace
        );
      }
    });

    /*
      If reverse geocoding didn't give
      useful intermediate places, at
      least show source and destination.
    */

    if (uniquePlaces.length < 2) {
      return [
        sourceName,
        destinationName,
      ];
    }

    return uniquePlaces;
  };


  // ---------------------------------------------------------
  // FIND ROUTE
  // ---------------------------------------------------------

  const findRoute = async () => {
    if (
      !source.trim() ||
      !destination.trim()
    ) {
      setError(
        "Please enter both source and destination."
      );

      setRoute(null);

      return;
    }

    setLoading(true);

    setError("");

    setRoute(null);

    try {
      // ---------------------------------------------------
      // STEP 1: FIND SOURCE
      // ---------------------------------------------------

      const sourceLocation =
        await geocodeLocation(
          source.trim()
        );


      // ---------------------------------------------------
      // STEP 2: FIND DESTINATION
      // ---------------------------------------------------

      const destinationLocation =
        await geocodeLocation(
          destination.trim()
        );


      // ---------------------------------------------------
      // STEP 3: BUILD OSRM ROUTE URL
      // ---------------------------------------------------

      const coordinates =
        `${sourceLocation.lon},${sourceLocation.lat};` +
        `${destinationLocation.lon},${destinationLocation.lat}`;

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${coordinates}` +
        `?overview=full&geometries=geojson&steps=true`;


      // ---------------------------------------------------
      // STEP 4: CALL OSRM
      // ---------------------------------------------------

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Unable to calculate route."
        );
      }

      const data =
        await response.json();


      if (
        data.code !== "Ok" ||
        !data.routes ||
        data.routes.length === 0
      ) {
        throw new Error(
          "No driving route found between these locations."
        );
      }


      // ---------------------------------------------------
      // STEP 5: GET BEST ROUTE
      // ---------------------------------------------------

      const bestRoute =
        data.routes[0];


      // ---------------------------------------------------
      // STEP 6: DISTANCE
      // OSRM returns meters
      // ---------------------------------------------------

      const distanceKm =
        bestRoute.distance /
        1000;


      // ---------------------------------------------------
      // STEP 7: ESTIMATED TIME
      // OSRM returns seconds
      // ---------------------------------------------------

      const estimatedTime =
        formatDuration(
          bestRoute.duration
        );


      // ---------------------------------------------------
      // STEP 8: GET ROUTE GEOMETRY
      // ---------------------------------------------------

      const routeCoordinates =
        bestRoute.geometry?.coordinates ||
        [];


      // ---------------------------------------------------
      // STEP 9: GET INTERMEDIATE PLACES
      // ---------------------------------------------------

      const routeLocations =
        await getIntermediateLocations(
          routeCoordinates,
          sourceLocation.name,
          destinationLocation.name
        );


      // ---------------------------------------------------
      // STEP 10: SAVE RESULT
      // ---------------------------------------------------

      setRoute({
        source:
          sourceLocation.name,

        destination:
          destinationLocation.name,

        locations:
          routeLocations,

        distance:
          distanceKm.toFixed(1),

        estimatedTime:
          estimatedTime,
      });

    } catch (err) {
      console.error(
        "Route optimization error:",
        err
      );

      setError(
        err.message ||
          "Unable to calculate route. Please check the location names and try again."
      );

    } finally {
      setLoading(false);
    }
  };


  // ---------------------------------------------------------
  // CLEAR
  // ---------------------------------------------------------

  const clearRoute = () => {
    setSource("");

    setDestination("");

    setRoute(null);

    setError("");
  };


  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div
      style={{
        width: "100%",
        padding: "5px 0 40px 0",
      }}
    >

      {/* =====================================================
          SEARCH BOX
          ===================================================== */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "30px",
          marginBottom: "24px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.06)",
        }}
      >

        <h2
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: "28px",
            color: "#172033",
          }}
        >
          🗺️ Find Optimized Route
        </h2>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr auto auto",
            gap: "15px",
            alignItems: "end",
          }}
        >

          {/* SOURCE */}

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#475569",
              }}
            >
              📍 Source
            </label>

            <input
              type="text"
              value={source}
              placeholder="Example: Rajahmundry"
              onChange={(e) =>
                setSource(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  findRoute();
                }
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 15px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#172033",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>


          {/* DESTINATION */}

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#475569",
              }}
            >
              📍 Destination
            </label>

            <input
              type="text"
              value={destination}
              placeholder="Example: Kakinada"
              onChange={(e) =>
                setDestination(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  findRoute();
                }
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 15px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#172033",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>


          {/* FIND */}

          <button
            onClick={findRoute}
            disabled={loading}
            style={{
              padding:
                "13px 22px",
              border: "none",
              borderRadius: "8px",
              background:
                loading
                  ? "#93c5fd"
                  : "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              whiteSpace:
                "nowrap",
            }}
          >
            {loading
              ? "Finding..."
              : "Find Route"}
          </button>


          {/* CLEAR */}

          <button
            onClick={clearRoute}
            style={{
              padding:
                "13px 22px",
              border: "none",
              borderRadius: "8px",
              background:
                "#64748b",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          style={{
            background: "#fff1f2",
            border:
              "1px solid #fecdd3",
            color: "#be123c",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          ❌ {error}
        </div>
      )}


      {/* =====================================================
          ROUTE RESULT
          ===================================================== */}

      {route && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "30px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.06)",
          }}
        >

          {/* RESULT TITLE */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >

            <h2
              style={{
                margin: 0,
                color: "#172033",
              }}
            >
              ✅ Optimized Route
            </h2>

          </div>


          {/* SOURCE / DESTINATION */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
              marginBottom: "25px",
            }}
          >

            {/* SOURCE */}

            <div
              style={{
                background:
                  "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginBottom: "7px",
                }}
              >
                SOURCE
              </div>

              <div
                style={{
                  color: "#1d4ed8",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                📍 {route.source}
              </div>

            </div>


            {/* DESTINATION */}

            <div
              style={{
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginBottom: "7px",
                }}
              >
                DESTINATION
              </div>

              <div
                style={{
                  color: "#15803d",
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                📍 {route.destination}
              </div>

            </div>

          </div>


          {/* =================================================
              ROUTE PATH
              ================================================= */}

          <div
            style={{
              background:
                "#f8fafc",
              border:
                "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "28px",
            }}
          >

            <h3
              style={{
                textAlign: "center",
                marginTop: 0,
                marginBottom: "25px",
                color: "#172033",
              }}
            >
              🚚 Route
            </h3>


            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >

              {route.locations.map(
                (location, index) => (
                  <React.Fragment
                    key={
                      `${location}-${index}`
                    }
                  >

                    {/* LOCATION */}

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        fontSize: "18px",
                        fontWeight: "600",
                        color:
                          "#172033",
                        padding:
                          "7px 0",
                      }}
                    >

                      <span
                        style={{
                          marginRight:
                            "10px",
                        }}
                      >
                        📍
                      </span>

                      <span>
                        {location}
                      </span>

                    </div>


                    {/* ARROW */}

                    {index <
                      route.locations
                        .length -
                        1 && (
                      <div
                        style={{
                          marginLeft:
                            "8px",
                          height:
                            "30px",
                          borderLeft:
                            "2px solid #cbd5e1",
                          position:
                            "relative",
                        }}
                      >

                        <span
                          style={{
                            position:
                              "absolute",
                            left:
                              "-7px",
                            bottom:
                              "-5px",
                            color:
                              "#64748b",
                            fontSize:
                              "18px",
                          }}
                        >
                          ↓
                        </span>

                      </div>
                    )}

                  </React.Fragment>
                )
              )}

            </div>

          </div>


          {/* =================================================
              DISTANCE AND TIME
              ================================================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
              marginTop: "24px",
            }}
          >

            {/* DISTANCE */}

            <div
              style={{
                background:
                  "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius:
                  "12px",
                padding: "24px",
                textAlign:
                  "center",
              }}
            >

              <div
                style={{
                  fontSize: "15px",
                  color:
                    "#64748b",
                  marginBottom:
                    "8px",
                }}
              >
                📏 Distance
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight:
                    "700",
                  color:
                    "#2563eb",
                }}
              >
                {route.distance} km
              </div>

            </div>


            {/* TIME */}

            <div
              style={{
                background:
                  "#f0fdf4",
                border:
                  "1px solid #bbf7d0",
                borderRadius:
                  "12px",
                padding: "24px",
                textAlign:
                  "center",
              }}
            >

              <div
                style={{
                  fontSize: "15px",
                  color:
                    "#64748b",
                  marginBottom:
                    "8px",
                }}
              >
                ⏱️ Estimated Time
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight:
                    "700",
                  color:
                    "#15803d",
                }}
              >
                {route.estimatedTime}
              </div>

            </div>

          </div>


          {/* =================================================
              EXACT SUMMARY FORMAT
              ================================================= */}

          <div
            style={{
              marginTop: "25px",
              padding: "24px",
              border:
                "1px solid #e2e8f0",
              borderRadius:
                "12px",
              background:
                "#ffffff",
            }}
          >

            {route.locations.map(
              (location, index) => (
                <React.Fragment
                  key={
                    `summary-${location}-${index}`
                  }
                >

                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight:
                        "600",
                      color:
                        "#334155",
                      padding:
                        "4px 0",
                    }}
                  >
                    📍 {location}
                  </div>


                  {index <
                    route.locations
                      .length -
                      1 && (
                    <div
                      style={{
                        padding:
                          "2px 0 2px 8px",
                        color:
                          "#64748b",
                        fontSize:
                          "18px",
                      }}
                    >
                      ↓
                    </div>
                  )}

                </React.Fragment>
              )
            )}


            <div
              style={{
                marginTop: "18px",
                paddingTop: "15px",
                borderTop:
                  "1px solid #e2e8f0",
              }}
            >

              <div
                style={{
                  fontSize:
                    "17px",
                  fontWeight:
                    "600",
                  color:
                    "#334155",
                  marginBottom:
                    "8px",
                }}
              >
                Distance:{" "}
                {route.distance} km
              </div>

              <div
                style={{
                  fontSize:
                    "17px",
                  fontWeight:
                    "600",
                  color:
                    "#334155",
                }}
              >
                Estimated Time:{" "}
                {route.estimatedTime}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default RouteOptimization;