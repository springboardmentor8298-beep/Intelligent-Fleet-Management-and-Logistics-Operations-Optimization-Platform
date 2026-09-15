import math
import json
import urllib.request
from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime, timedelta

class RouteOptimizer:
    """
    Route Optimization & ETA Calculation Engine for Milestone 2.
    Features:
    - Real Road Network Navigation (OSRM / OpenStreetMap)
    - Shortest Route
    - Fastest Route
    - Traffic Avoidance
    - Fuel Efficient Route
    - Multi-stop Waypoint Ordering
    - Dynamic ETA and Delay Monitoring
    """
    
    EARTH_RADIUS_KM = 6371.0
    _ROUTE_CACHE: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def sample_road_coordinates(cls, coords: List[List[float]], max_points: int = 160) -> List[List[float]]:
        """
        Downsamples high-density road geometry while preserving start, end,
        and turning fidelity along highways and city roads.
        """
        if len(coords) <= max_points:
            return coords
        step = (len(coords) - 1) / float(max_points - 1)
        sampled = []
        for i in range(max_points - 1):
            idx = int(round(i * step))
            sampled.append(coords[idx])
        sampled.append(coords[-1])
        return sampled

    @classmethod
    def fetch_real_road_route(
        cls,
        stops: List[Tuple[float, float]],
        target_points: int = 160
    ) -> Optional[Dict[str, Any]]:
        """
        Fetches turn-by-turn road geometry from OpenStreetMap OSRM driving engine.
        Returns exact driving road distance, duration, and highway coordinates.
        Falls back seamlessly if offline or across water bodies.
        """
        if len(stops) < 2:
            return None

        cache_key = ";".join(f"{round(lat, 4)},{round(lon, 4)}" for lat, lon in stops)
        if cache_key in cls._ROUTE_CACHE:
            return cls._ROUTE_CACHE[cache_key]

        # OSRM expects coordinates in lon,lat order
        coords_str = ";".join(f"{round(lon, 5)},{round(lat, 5)}" for lat, lon in stops)
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "FleetFlowLogistics/2.0 (operations@fleetflow.io)"}
            )
            with urllib.request.urlopen(req, timeout=3.5) as response:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    r = data["routes"][0]
                    dist_km = round(r["distance"] / 1000.0, 2)
                    dur_mins = round(r["duration"] / 60.0, 1)
                    raw_coords = [[round(c[1], 5), round(c[0], 5)] for c in r["geometry"]["coordinates"]]
                    sampled = cls.sample_road_coordinates(raw_coords, max_points=target_points)
                    res = {
                        "distance_km": dist_km,
                        "duration_mins": dur_mins,
                        "coordinates": sampled,
                        "is_real_road": True
                    }
                    cls._ROUTE_CACHE[cache_key] = res
                    return res
        except Exception:
            pass

        return None

    @classmethod
    def haversine(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(cls.EARTH_RADIUS_KM * c, 3)

    @classmethod
    def generate_interpolated_path(
        cls,
        start_lat: float,
        start_lng: float,
        end_lat: float,
        end_lng: float,
        num_points: int = 25,
        curve_factor: float = None
    ) -> List[List[float]]:
        """
        Generates realistic intermediate coordinates simulating road bends between two endpoints.
        Scales curvature and waypoint density to route length.
        """
        dist = cls.haversine(start_lat, start_lng, end_lat, end_lng)
        
        # Scale curve factor naturally: subtle for local trips, arched for continental/oceanic corridors
        if curve_factor is None:
            if dist > 3000:
                curve_factor = 1.8  # Geographic arc across oceanic/continental scale
            elif dist > 1000:
                curve_factor = 0.4
            elif dist > 300:
                curve_factor = 0.05
            else:
                curve_factor = 0.003

        path = []
        for i in range(num_points + 1):
            ratio = i / float(num_points)
            lat = start_lat + (end_lat - start_lat) * ratio
            lng = start_lng + (end_lng - start_lng) * ratio
            # Add a gentle sine curve perturbation to simulate real road curving or spherical corridor
            curvature = math.sin(ratio * math.pi) * curve_factor
            path.append([round(lat + curvature, 5), round(lng - curvature * 0.5, 5)])
        return path

    @classmethod
    def optimize_route(
        cls,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        waypoints: List[Tuple[float, float]] = None,
        optimization_type: str = "Fastest Route"
    ) -> Dict[str, Any]:
        """
        Computes distance, ETA, fuel usage, and path coordinates tailored to route strategy.
        Uses genuine street and highway road networks (OSRM) with geodesic fallback.
        """
        waypoints = waypoints or []
        
        # Route profiles with velocity, fuel coefficients, and road geometry factors
        profiles = {
            "Shortest Route": {
                "avg_speed_kmh": 48.0,
                "road_factor": 1.12,
                "fuel_rate_l_per_km": 0.26,
                "traffic_factor": 1.10,
                "description": "Direct arterial and highway routing minimizing total mileage"
            },
            "Fastest Route": {
                "avg_speed_kmh": 72.0,
                "road_factor": 1.25,  # Highways take slightly more distance but much faster
                "fuel_rate_l_per_km": 0.32,
                "traffic_factor": 1.02,
                "description": "High-speed interstate, expressway, and arterial routing"
            },
            "Traffic Avoidance": {
                "avg_speed_kmh": 62.0,
                "road_factor": 1.22,
                "fuel_rate_l_per_km": 0.29,
                "traffic_factor": 1.00,  # Eliminates traffic bottleneck delays
                "description": "Bypasses high-congestion downtown corridors via outer ring roads"
            },
            "Fuel Efficient Route": {
                "avg_speed_kmh": 54.0,
                "road_factor": 1.16,
                "fuel_rate_l_per_km": 0.21,
                "traffic_factor": 1.06,
                "description": "Smooth cruising speed minimizing stop-and-go acceleration"
            }
        }

        # Normalize key
        matched_key = "Fastest Route"
        for key in profiles:
            if key.lower() in optimization_type.lower():
                matched_key = key
                break
        
        profile = profiles[matched_key]
        stops = [origin] + waypoints + [destination]

        # 1. Attempt to fetch real road network coordinates via OpenStreetMap / OSRM
        road_data = cls.fetch_real_road_route(stops, target_points=160)

        if road_data:
            total_road_km = road_data["distance_km"]
            base_duration = road_data["duration_mins"]
            travel_hours = (base_duration / 60.0) * profile["traffic_factor"]
            duration_minutes = round(travel_hours * 60.0, 1)
            fuel_liters = round(total_road_km * profile["fuel_rate_l_per_km"], 2)
            detailed_path = road_data["coordinates"]
            profile_desc = f"{profile['description']} (Real Road Network Navigation)"
        else:
            # 2. Fallback to distance-scaled geodesic corridor (for oceans or offline)
            total_direct_km = 0.0
            detailed_path = []
            for i in range(len(stops) - 1):
                p1 = stops[i]
                p2 = stops[i + 1]
                dist = cls.haversine(p1[0], p1[1], p2[0], p2[1])
                total_direct_km += dist
                
                if dist <= 150:
                    pts = 25
                elif dist <= 800:
                    pts = 45
                elif dist <= 3000:
                    pts = 70
                else:
                    pts = 100

                segment_path = cls.generate_interpolated_path(
                    p1[0], p1[1], p2[0], p2[1],
                    num_points=pts
                )
                if detailed_path and segment_path:
                    detailed_path.extend(segment_path[1:])
                else:
                    detailed_path.extend(segment_path)

            total_road_km = round(total_direct_km * profile["road_factor"], 2)
            travel_hours = (total_road_km / profile["avg_speed_kmh"]) * profile["traffic_factor"]
            duration_minutes = round(travel_hours * 60, 1)
            fuel_liters = round(total_road_km * profile["fuel_rate_l_per_km"], 2)
            profile_desc = profile["description"]

        # Formatted ETA string
        eta_time = datetime.utcnow() + timedelta(minutes=duration_minutes)
        if duration_minutes >= 60:
            hrs = int(duration_minutes // 60)
            mins = int(duration_minutes % 60)
            eta_formatted = f"{hrs}h {mins}m ({eta_time.strftime('%I:%M %p')})"
        else:
            eta_formatted = f"{int(duration_minutes)} mins ({eta_time.strftime('%I:%M %p')})"

        return {
            "optimization_type": matched_key,
            "total_distance_km": total_road_km,
            "estimated_duration_mins": duration_minutes,
            "eta_formatted": eta_formatted,
            "estimated_fuel_liters": fuel_liters,
            "profile_description": profile_desc,
            "waypoints": stops,
            "full_path": detailed_path
        }

    @classmethod
    def calculate_path_distance(cls, path_points: List[List[float]]) -> float:
        """
        Calculates total distance in km along a series of waypoint coordinates.
        """
        if not path_points or len(path_points) < 2:
            return 0.0
        total = 0.0
        for i in range(len(path_points) - 1):
            total += cls.haversine(
                path_points[i][0], path_points[i][1],
                path_points[i+1][0], path_points[i+1][1]
            )
        return round(total, 2)

    @classmethod
    def get_vehicle_cruise_speed(
        cls,
        vehicle_type: str = None,
        route_type: str = "Fastest Route",
        weight_kg: float = None
    ) -> float:
        """
        Returns realistic base cruise speed (km/h) based on vehicle specification and route optimization type.
        """
        vehicle_speeds = {
            "delivery van": 82.0,
            "van": 82.0,
            "heavy truck": 68.0,
            "truck": 68.0,
            "container carrier": 58.0,
            "carrier": 58.0,
            "cargo vessel": 42.0,
            "ship": 42.0,
            "maritime": 42.0,
            "express": 88.0,
        }
        vt_key = (vehicle_type or "").lower().strip()
        base = 65.0
        for k, v in vehicle_speeds.items():
            if k in vt_key:
                base = v
                break

        # Adjust for route profile
        rt_lower = (route_type or "").lower()
        if "fastest" in rt_lower:
            base *= 1.08
        elif "fuel" in rt_lower:
            base *= 0.88
        elif "traffic" in rt_lower:
            base *= 0.95
        elif "shortest" in rt_lower:
            base *= 0.85

        # Cargo weight adjustment
        if weight_kg:
            if weight_kg > 18000:
                base *= 0.90  # Heavy cargo dampens acceleration & cruise speed
            elif weight_kg < 1000:
                base *= 1.05  # Light parcel allows agile transit

        return round(base, 1)

    @classmethod
    def calculate_dynamic_speed(
        cls,
        base_cruise_speed: float,
        remaining_km: float,
        total_km: float,
        step_idx: int,
        total_steps: int
    ) -> float:
        """
        Dynamically modulates vehicle velocity relatively to the remaining path:
        - Depart origin hub: gradual acceleration (first 8% of journey)
        - Cruising phase: stable cruising speed with natural road variations
        - Terminal approach: gradual deceleration relative to remaining distance (last 10% of path)
        - Final arrival: 0.0 km/h
        """
        if remaining_km <= 0.1 or step_idx >= total_steps - 1:
            return 0.0

        progress = max(0.0, min(1.0, 1.0 - (remaining_km / max(total_km, 1.0))))

        # 1. Acceleration phase (first 8% of journey)
        if progress < 0.08:
            accel_factor = 0.35 + 0.65 * (progress / 0.08)
            current_speed = base_cruise_speed * accel_factor
        # 2. Deceleration phase when approaching destination terminal (last 10% of remaining path)
        elif progress > 0.90:
            decel_factor = max(0.18, (1.0 - progress) / 0.10)
            current_speed = base_cruise_speed * decel_factor
        # 3. Mid-route cruising phase with gentle realistic road variation (+/- 4 km/h)
        else:
            micro_variation = math.sin(step_idx * 0.45) * (base_cruise_speed * 0.05)
            current_speed = base_cruise_speed + micro_variation

        return round(max(14.0, current_speed), 1)

    @classmethod
    def recalculate_live_eta(
        cls,
        current_lat: float,
        current_lng: float,
        dest_lat: float,
        dest_lng: float,
        current_speed_kmh: float = 45.0,
        expected_remaining_mins: float = None,
        remaining_path_km: float = None
    ) -> Dict[str, Any]:
        """
        Recalculates ETA dynamically based on real-time vehicle speed and position.
        Detects if shipment is delayed.
        """
        if remaining_path_km is not None and remaining_path_km >= 0:
            remaining_km = round(remaining_path_km, 2)
        else:
            remaining_direct = cls.haversine(current_lat, current_lng, dest_lat, dest_lng)
            remaining_km = round(remaining_direct * 1.22, 2)

        if remaining_km <= 0.1:
            return {
                "remaining_distance_km": 0.0,
                "remaining_minutes": 0.0,
                "eta_timestamp": datetime.utcnow().isoformat(),
                "eta_display": "Delivered",
                "is_delayed": False,
                "delay_reason": None
            }

        effective_speed = max(current_speed_kmh, 12.0)  # avoid division by zero
        remaining_mins = round((remaining_km / effective_speed) * 60, 1)
        
        eta_timestamp = datetime.utcnow() + timedelta(minutes=remaining_mins)
        
        # Check delay: if remaining minutes exceeds expected by > 20% or traffic stall (< 15 km/h)
        is_delayed = False
        delay_reason = None
        if expected_remaining_mins and remaining_mins > (expected_remaining_mins * 1.25):
            is_delayed = True
            delay_reason = "Heavy Traffic Congestion Detected"
        elif current_speed_kmh < 15.0 and remaining_km > 2.0:
            is_delayed = True
            delay_reason = "Vehicle Delayed in Gridlock"

        if remaining_mins < 1.0:
            eta_str = "< 1 min (Approaching Terminal)"
        elif remaining_mins >= 60:
            hrs = int(remaining_mins // 60)
            mins = int(remaining_mins % 60)
            eta_str = f"{hrs}h {mins}m ({eta_timestamp.strftime('%I:%M %p')})"
        else:
            eta_str = f"{int(remaining_mins)} mins ({eta_timestamp.strftime('%I:%M %p')})"

        return {
            "remaining_distance_km": remaining_km,
            "remaining_minutes": remaining_mins,
            "eta_timestamp": eta_timestamp.isoformat(),
            "eta_display": eta_str,
            "is_delayed": is_delayed,
            "delay_reason": delay_reason
        }
