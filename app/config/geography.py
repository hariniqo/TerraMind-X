from typing import Dict, List, Tuple, Optional
from app.services.gis_service import GISService

SUPPORTED_STATES = ["Tamil Nadu", "Maharashtra"]
COVERAGE_TYPE = "pilot_districts"
DISTRICT_COUNT = 19  # Tamil Nadu: 9, Maharashtra: 10

# District coordinates mapping for NASA POWER and spatial filtering (fallback / core defaults)
DISTRICT_COORDINATES: Dict[str, Dict[str, Tuple[float, float]]] = {
    "Tamil Nadu": {
        "Madurai": (9.9252, 78.1198),
        "Coimbatore": (11.0168, 76.9558),
        "Trichy": (10.7905, 78.7047),
        "Tiruchirappalli": (10.7905, 78.7047),
        "Salem": (11.6643, 78.1460),
        "Thanjavur": (10.7870, 79.1378),
        "Chennai": (13.0827, 80.2707),
        "Tirunelveli": (8.7139, 77.7567),
        "Erode": (11.3410, 77.7172),
        "Thoothukudi": (8.7642, 78.1348),
        "Tuticorin": (8.7642, 78.1348)
    },
    "Maharashtra": {
        "Mumbai": (19.0760, 72.8777),
        "Mumbai Suburban": (19.0760, 72.8777),
        "Pune": (18.5204, 73.8567),
        "Nashik": (19.9975, 73.7898),
        "Nagpur": (21.1458, 79.0882),
        "Aurangabad": (19.8762, 75.3433),
        "Kolhapur": (16.7050, 74.2433),
        "Solapur": (17.6599, 75.9064),
        "Amravati": (20.9320, 77.7523),
        "Nanded": (19.1383, 77.3210),
        "Sangli": (16.8524, 74.5815)
    }
}

def is_supported_geography(state: str, district: str) -> bool:
    if not state or not district:
        return False
        
    state_norm = state.strip()
    dist_norm = district.strip()
    
    # 1. Check hardcoded coordinates first
    if state_norm in DISTRICT_COORDINATES and dist_norm in DISTRICT_COORDINATES[state_norm]:
        return True
        
    # 2. Check GeoJSON loaded centroids
    gis = GISService()
    supported = gis.get_supported_districts(state_norm)
    if dist_norm in supported:
        return True
        
    # Graceful alias checks
    aliases = {
        "Trichy": "Tiruchirappalli",
        "Thoothukudi": "Tuticorin",
        "Tuticorin": "Thoothukudi"
    }
    if dist_norm in aliases:
        return aliases[dist_norm] in supported
        
    return False

def get_district_coordinates(state: str, district: str) -> Tuple[float, float]:
    """
    Returns (latitude, longitude) center point for NASA POWER / climate query.
    Tries static mapping, falls back to GeoJSON centroids, and finally state capitals.
    """
    state_norm = state.strip() if state else ""
    dist_norm = district.strip() if district else ""
    
    # 1. Try static list
    state_coords = DISTRICT_COORDINATES.get(state_norm)
    if state_coords:
        coords = state_coords.get(dist_norm)
        if coords:
            return coords
            
    # 2. Try GeoJSON centroid
    gis = GISService()
    centroid = gis.get_district_centroid(state_norm, dist_norm)
    if centroid:
        return centroid
        
    # 3. Capital coordinates fallback
    if state_norm == "Tamil Nadu":
        return (13.0827, 80.2707)  # Chennai
    elif state_norm == "Maharashtra":
        return (18.9750, 72.8258)  # Mumbai
        
    return (15.6, 75.0)  # South India default center

def resolve_state_district_from_coords(lat: float, lng: float) -> Tuple[str, str]:
    """
    Resolves state and district from coordinates using GIS Service.
    Falls back to closest static mapping if completely unresolved.
    """
    gis = GISService()
    state, district = gis.resolve_state_district(lat, lng)
    if state and district:
        return state, district
        
    # Static distance fallback if completely outside GeoJSON bounds
    import math
    best_state = "Tamil Nadu"
    best_district = "Madurai"
    min_dist = float("inf")
    for state_name, districts in DISTRICT_COORDINATES.items():
        for dist_name, coords in districts.items():
            dist = math.sqrt((coords[0] - lat)**2 + (coords[1] - lng)**2)
            if dist < min_dist:
                min_dist = dist
                best_state = state_name
                best_district = dist_name
    return best_state, best_district
