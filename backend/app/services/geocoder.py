import urllib.request
import urllib.parse
import json
import re
from typing import Optional, Tuple, Dict

# In-memory cache for geocoded queries
GEOCODE_CACHE: Dict[str, Tuple[float, float, str]] = {}

# Comprehensive Built-in Global Hubs & Ports Dictionary (instant 0ms response)
GLOBAL_LOCATION_DIRECTORY = {
    # United States & North America
    "new york": (40.7128, -74.0060, "New York Port & Logistics Center, NY, USA"),
    "nyc": (40.7128, -74.0060, "New York City, NY, USA"),
    "manhattan": (40.7831, -73.9712, "Manhattan Hub, NY, USA"),
    "boston": (42.3601, -71.0589, "Port of Boston Logistics Terminal, MA, USA"),
    "chicago": (41.8781, -87.6298, "Chicago Intermodal Freight Hub, IL, USA"),
    "los angeles": (34.0522, -118.2437, "Port of Los Angeles, CA, USA"),
    "la": (34.0522, -118.2437, "Los Angeles, CA, USA"),
    "san francisco": (37.7749, -122.4194, "San Francisco Bay Logistics Center, CA, USA"),
    "seattle": (47.6062, -122.3321, "Port of Seattle, WA, USA"),
    "houston": (29.7604, -95.3698, "Port of Houston Container Terminal, TX, USA"),
    "dallas": (32.7767, -96.7970, "Dallas Freight Hub, TX, USA"),
    "miami": (25.7617, -80.1918, "PortMiami Logistics Depot, FL, USA"),
    "atlanta": (33.7490, -84.3880, "Atlanta Air Cargo Center, GA, USA"),
    "philadelphia": (39.9526, -75.1652, "Philadelphia Cargo Hub, PA, USA"),
    "washington": (38.9072, -77.0369, "Washington Freight Center, DC, USA"),
    "toronto": (43.6532, -79.3832, "Toronto Logistics Hub, ON, Canada"),
    "vancouver": (49.2827, -123.1207, "Port of Vancouver, BC, Canada"),
    "montreal": (45.5017, -73.5673, "Port of Montreal, QC, Canada"),
    "mexico city": (19.4326, -99.1332, "Mexico City Freight Hub, Mexico"),

    # India Logistics Hubs
    "chennai": (13.0827, 80.2707, "Chennai Port Gateway, India"),
    "tuticorin": (8.7642, 78.1348, "V.O.C Port Tuticorin, India"),
    "bengaluru": (12.9716, 77.5946, "Bengaluru Tech Logistics Depot, India"),
    "bangalore": (12.9716, 77.5946, "Bengaluru Tech Logistics Depot, India"),
    "mumbai": (18.9220, 72.8347, "Mumbai JNPT Logistics Hub, India"),
    "kochi": (9.9312, 76.2673, "Kochi Seaport Terminal, India"),
    "cochin": (9.9312, 76.2673, "Kochi Seaport Terminal, India"),
    "delhi": (28.6139, 77.2090, "New Delhi Cargo Terminal, India"),
    "new delhi": (28.6139, 77.2090, "New Delhi Cargo Terminal, India"),
    "hyderabad": (17.3850, 78.4867, "Hyderabad Air Cargo Hub, India"),
    "kolkata": (22.5726, 88.3639, "Kolkata Port Depot, India"),
    "ahmedabad": (23.0225, 72.5714, "Ahmedabad Freight Terminal, India"),
    "pune": (18.5204, 73.8567, "Pune Auto Logistics Hub, India"),
    "india": (13.0827, 80.2707, "Chennai Port Gateway, India"),

    # Sri Lanka Logistics Hubs
    "colombo": (6.9271, 79.8612, "Colombo Harbor Terminal, Sri Lanka"),
    "jaffna": (9.6615, 80.0255, "Jaffna Regional Logistics Center, Sri Lanka"),
    "kandy": (7.2906, 80.6337, "Kandy Inland Freight Depot, Sri Lanka"),
    "galle": (6.0535, 80.2210, "Galle Southern Seaport, Sri Lanka"),
    "trincomalee": (8.5874, 81.2152, "Trincomalee Deepwater Harbor, Sri Lanka"),
    "hambantota": (6.1248, 81.1185, "Hambantota International Port, Sri Lanka"),
    "sri lanka": (6.9271, 79.8612, "Colombo Harbor Terminal, Sri Lanka"),
    "srilanka": (6.9271, 79.8612, "Colombo Harbor Terminal, Sri Lanka"),

    # Europe
    "london": (51.5074, -0.1278, "Port of London Logistics Hub, UK"),
    "manchester": (53.4808, -2.2426, "Manchester Freight Terminal, UK"),
    "paris": (48.8566, 2.3522, "Paris Cargo Logistics Hub, France"),
    "berlin": (52.5200, 13.4050, "Berlin Logistics Depot, Germany"),
    "frankfurt": (50.1109, 8.6821, "Frankfurt Air & Cargo Hub, Germany"),
    "amsterdam": (52.3676, 4.9041, "Port of Amsterdam, Netherlands"),
    "rotterdam": (51.9244, 4.4777, "Port of Rotterdam Europe Gateway, Netherlands"),
    "hamburg": (53.5511, 9.9937, "Port of Hamburg, Germany"),
    "madrid": (40.4168, -3.7038, "Madrid Central Logistics Terminal, Spain"),
    "rome": (41.9028, 12.4964, "Rome Cargo Logistics Center, Italy"),

    # Asia-Pacific & Middle East
    "dubai": (25.2048, 55.2708, "Jebel Ali Port & Logistics City, Dubai, UAE"),
    "abu dhabi": (24.4539, 54.3773, "Khalifa Port Logistics Hub, UAE"),
    "singapore": (1.3521, 103.8198, "Port of Singapore Global Transshipment Hub"),
    "tokyo": (35.6762, 139.6503, "Port of Tokyo Container Terminal, Japan"),
    "yokohama": (35.4437, 139.6380, "Yokohama International Port, Japan"),
    "shanghai": (31.2304, 121.4737, "Port of Shanghai Deepwater Hub, China"),
    "hong kong": (22.3193, 114.1694, "Hong Kong Kwai Tsing Container Terminal"),
    "seoul": (37.5665, 126.9780, "Seoul Logistics & Incheon Gateway, South Korea"),
    "busan": (35.1796, 129.0756, "Port of Busan, South Korea"),
    "bangkok": (13.7563, 100.5018, "Bangkok Laem Chabang Port, Thailand"),
    "sydney": ( -33.8688, 151.2093, "Port Botany Logistics Hub, Sydney, Australia"),
    "melbourne": (-37.8136, 144.9631, "Port of Melbourne, Australia")
}

def clean_text(query: str) -> str:
    """Normalizes location string for robust matching."""
    if not query:
        return ""
    cleaned = query.lower().strip()
    # Remove punctuation
    cleaned = re.sub(r'[,\.\-_/]', ' ', cleaned)
    return " ".join(cleaned.split())

def geocode_location(query: str) -> Optional[Tuple[float, float, str]]:
    """
    Geocodes any location name or address:
    1. Checks in-memory cache.
    2. Checks built-in global directory of hubs & ports.
    3. Queries OpenStreetMap Nominatim for any arbitrary worldwide location.
    Returns: (latitude, longitude, formatted_display_name) or None
    """
    if not query or not query.strip():
        return None

    raw_query = query.strip()
    norm = clean_text(raw_query)

    # 1. Check cache
    if norm in GEOCODE_CACHE:
        return GEOCODE_CACHE[norm]

    # 2. Check local directory (exact, space-agnostic, and substring matches)
    compact_norm = norm.replace(" ", "")
    for key, (lat, lng, name) in GLOBAL_LOCATION_DIRECTORY.items():
        compact_key = key.replace(" ", "")
        if key == norm or compact_key == compact_norm or compact_key in compact_norm or (len(norm) >= 4 and norm in key):
            GEOCODE_CACHE[norm] = (lat, lng, name)
            return (lat, lng, name)

    # 3. Live OpenStreetMap Nominatim lookup
    try:
        encoded = urllib.parse.quote(raw_query)
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={encoded}&limit=1"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "FleetFlowLogisticsPlatform/2.0"}
        )
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode())
            if data and len(data) > 0:
                item = data[0]
                lat = float(item["lat"])
                lng = float(item["lon"])
                display_name = item.get("display_name", raw_query)
                # Cache result
                GEOCODE_CACHE[norm] = (lat, lng, display_name)
                return (lat, lng, display_name)
    except Exception as e:
        print(f"[Geocoder] Live geocoding notice for '{raw_query}': {e}")

    return None
