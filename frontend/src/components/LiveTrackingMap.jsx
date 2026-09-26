import React, { useEffect, useRef } from 'react';

// Default center: Framed around South India & Sri Lanka maritime-road corridor
const DEFAULT_CENTER = [10.8505, 79.8267]; // Lat/Lng between South India & Sri Lanka
const DEFAULT_ZOOM = 6;

export default function LiveTrackingMap({
  currentCoords = { lat: 13.0827, lng: 80.2707 },
  routePath = [],
  origin = null,
  destination = null,
  trackingNumber = '',
  speed = 0,
  heading = 0,
  eta = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const baseLineRef = useRef(null);
  const traveledLineRef = useRef(null);
  const remainingLineRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const lastFittedRouteKeyRef = useRef('');
  const lastTrackingNumberRef = useRef('');
  const lastCoordsRef = useRef(null);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || !window.L || mapInstanceRef.current) return;

    const initialLat = currentCoords?.lat || DEFAULT_CENTER[0];
    const initialLng = currentCoords?.lng || DEFAULT_CENTER[1];

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([initialLat, initialLng], DEFAULT_ZOOM);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle container resizing
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      baseLineRef.current = null;
      traveledLineRef.current = null;
      remainingLineRef.current = null;
      lastFittedRouteKeyRef.current = '';
    };
  }, []);

  // 2. Custom Icons generator
  const getTruckIcon = (currentSpeed, truckHeading) => {
    return window.L ? window.L.divIcon({
      className: 'custom-truck-icon',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: pulse 1.8s ease-in-out infinite;"></div>
          <div style="position: relative; background: #0284c7; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(2, 132, 199, 0.8); border: 2px solid #ffffff; font-size: 18px; transform: rotate(${truckHeading || 0}deg); transition: transform 0.3s ease;">
            🚚
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    }) : null;
  };

  const getOriginIcon = () => {
    return window.L ? window.L.divIcon({
      className: 'custom-origin-icon',
      html: `
        <div style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(16,185,129,0.7); border: 2px solid white; font-size: 14px; font-weight: 800;">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }) : null;
  };

  const getDestIcon = () => {
    return window.L ? window.L.divIcon({
      className: 'custom-dest-icon',
      html: `
        <div style="background: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(239,68,68,0.7); border: 2px solid white; font-size: 14px; font-weight: 800;">
          B
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }) : null;
  };

  // 3. Update Route Polylines & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // Reset vehicle marker if active tracking number changed
    if (lastTrackingNumberRef.current !== trackingNumber) {
      lastTrackingNumberRef.current = trackingNumber;
      if (markerRef.current && map.hasLayer(markerRef.current)) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }

    // Origin Marker
    if (origin && origin.lat && origin.lng) {
      const oIcon = getOriginIcon();
      if (!originMarkerRef.current || !map.hasLayer(originMarkerRef.current)) {
        originMarkerRef.current = window.L.marker([origin.lat, origin.lng], { icon: oIcon, zIndexOffset: 500 })
          .addTo(map)
          .bindPopup(`<b>Origin Hub:</b><br>${origin.label || 'Origin'}`);
      } else {
        originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
        originMarkerRef.current.setPopupContent(`<b>Origin Hub:</b><br>${origin.label || 'Origin'}`);
      }
    }

    // Destination Marker
    if (destination && destination.lat && destination.lng) {
      const dIcon = getDestIcon();
      if (!destMarkerRef.current || !map.hasLayer(destMarkerRef.current)) {
        destMarkerRef.current = window.L.marker([destination.lat, destination.lng], { icon: dIcon, zIndexOffset: 500 })
          .addTo(map)
          .bindPopup(`<b>Destination Hub:</b><br>${destination.label || 'Destination'}`);
      } else {
        destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
        destMarkerRef.current.setPopupContent(`<b>Destination Hub:</b><br>${destination.label || 'Destination'}`);
      }
    }

    // Route Polyline and Dynamic Path Segmentation
    if (routePath && routePath.length > 1) {
      // 1. Base route track (subtle background corridor)
      if (baseLineRef.current && map.hasLayer(baseLineRef.current)) {
        baseLineRef.current.setLatLngs(routePath);
      } else {
        baseLineRef.current = window.L.polyline(routePath, {
          color: '#1e293b',
          weight: 7,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      }

      // 2. Segment route into Traveled vs Remaining based on currentCoords
      const curLat = currentCoords?.lat;
      const curLng = currentCoords?.lng;
      let splitIdx = 0;

      if (curLat !== undefined && curLng !== undefined) {
        let minD = Infinity;
        for (let i = 0; i < routePath.length; i++) {
          const d = Math.hypot(routePath[i][0] - curLat, routePath[i][1] - curLng);
          if (d < minD) {
            minD = d;
            splitIdx = i;
          }
        }
      }

      const curPt = (curLat !== undefined && curLng !== undefined) ? [curLat, curLng] : routePath[0];
      const traveledPoints = [...routePath.slice(0, splitIdx + 1), curPt];
      const remainingPoints = [curPt, ...routePath.slice(splitIdx + 1)];

      // 3. Traveled Path Polyline (Solid Blue)
      if (traveledLineRef.current && map.hasLayer(traveledLineRef.current)) {
        traveledLineRef.current.setLatLngs(traveledPoints);
      } else {
        traveledLineRef.current = window.L.polyline(traveledPoints, {
          color: '#0284c7',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      }

      // 4. Remaining Path Polyline (Dashed Cyan)
      if (remainingLineRef.current && map.hasLayer(remainingLineRef.current)) {
        remainingLineRef.current.setLatLngs(remainingPoints.length > 1 ? remainingPoints : []);
      } else if (remainingPoints.length > 1) {
        remainingLineRef.current = window.L.polyline(remainingPoints, {
          color: '#38bdf8',
          weight: 5,
          opacity: 0.95,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      }

      // Only fit bounds when tracking number or route path geometry actually changes
      const routeKey = `${trackingNumber}_${routePath.length}_${routePath[0]?.[0] || ''}`;
      if (lastFittedRouteKeyRef.current !== routeKey) {
        lastFittedRouteKeyRef.current = routeKey;
        try {
          const bounds = window.L.latLngBounds(routePath);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } catch (e) {
          // ignore
        }
      }
    } else if (origin && destination && origin.lat && destination.lat) {
      const routeKey = `fallback_${origin.lat}_${destination.lat}`;
      if (lastFittedRouteKeyRef.current !== routeKey) {
        lastFittedRouteKeyRef.current = routeKey;
        const fallbackBounds = window.L.latLngBounds([
          [origin.lat, origin.lng],
          [destination.lat, destination.lng]
        ]);
        map.fitBounds(fallbackBounds, { padding: [50, 50] });
      }
    }
  }, [routePath, currentCoords, origin, destination, trackingNumber]);

  // 4. Smooth Truck Marker Movement
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !currentCoords || currentCoords.lat === undefined) return;

    const lat = Number(currentCoords.lat);
    const lng = Number(currentCoords.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const truckIcon = getTruckIcon(speed, heading);

    const popupHtml = `
      <div style="font-family: 'Inter', sans-serif; font-size: 12px;">
        <b style="color: #0284c7; font-size: 13px;">${trackingNumber || 'Active Vehicle'}</b><br>
        <b>GPS:</b> ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
        <b>Velocity:</b> ${speed} km/h<br>
        <b>ETA:</b> ${eta || 'Calculating...'}
      </div>
    `;

    // Prevent marker sliding backwards across the globe when jumping or resetting
    const prevCoords = lastCoordsRef.current;
    lastCoordsRef.current = { lat, lng };
    let isLargeJump = false;
    if (prevCoords && prevCoords.lat !== undefined) {
      const dLat = Math.abs(lat - prevCoords.lat);
      const dLng = Math.abs(lng - prevCoords.lng);
      if (dLat > 2.0 || dLng > 2.0) {
        isLargeJump = true;
      }
    }

    if (!markerRef.current || !map.hasLayer(markerRef.current)) {
      markerRef.current = window.L.marker([lat, lng], {
        icon: truckIcon,
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup(popupHtml);
    } else {
      const markerEl = markerRef.current.getElement();
      if (markerEl && isLargeJump) {
        markerEl.style.transition = 'none';
      } else if (markerEl) {
        markerEl.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
      }
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(truckIcon);
      markerRef.current.setZIndexOffset(1000);
      markerRef.current.setPopupContent(popupHtml);
    }

    // Keep moving vehicle in view if route line is not loaded
    if (!routePath || routePath.length <= 1) {
      map.panTo([lat, lng], { animate: true, duration: 1.0 });
    }
  }, [currentCoords, speed, heading, eta, trackingNumber]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '380px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
      {/* Embedded CSS for smooth marker transition and pulse */}
      <style>{`
        .custom-truck-icon {
          transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
          will-change: transform;
        }
        .leaflet-zoom-anim .custom-truck-icon,
        .leaflet-drag-target .custom-truck-icon {
          transition: none !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0.15; }
        }
      `}</style>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Dynamic Corridor Legend with Traveled and Remaining Path */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        background: 'var(--bg-card, rgba(15, 23, 42, 0.92))',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle, #334155)',
        padding: '7px 14px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-primary, #f8fafc)',
        boxShadow: 'var(--shadow-card)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Origin
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Dest
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '14px', height: '3px', borderRadius: '2px', background: '#0284c7' }}></span> Traveled
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '14px', height: '3px', borderRadius: '2px', background: '#38bdf8', borderBottom: '1px dashed #ffffff' }}></span> Remaining Path
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🚚</span> Vehicle
        </span>
        <span style={{ color: '#38bdf8', fontSize: '11px', borderLeft: '1px solid var(--border-subtle, #334155)', paddingLeft: '10px', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {origin && destination ? `${origin.label || 'Origin'} ➔ ${destination.label || 'Destination'}` : 'Global Satellite Corridor'}
        </span>
      </div>
    </div>
  );
}
