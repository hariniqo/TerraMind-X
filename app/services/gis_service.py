import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

def point_in_polygon(x: float, y: float, poly: List[List[float]]) -> bool:
    """
    Ray-casting algorithm for point-in-polygon detection.
    x is longitude, y is latitude. poly is a list of [lon, lat] pairs.
    """
    num = len(poly)
    j = num - 1
    c = False
    for i in range(num):
        if ((poly[i][1] > y) != (poly[j][1] > y)) and \
           (x < (poly[j][0] - poly[i][0]) * (y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]):
            c = not c
        j = i
    return c

def is_in_geometry(lon: float, lat: float, geometry: Dict[str, Any]) -> bool:
    """
    Checks if point (lon, lat) is within Polygon or MultiPolygon geometry.
    """
    g_type = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if g_type == "Polygon":
        if coords:
            return point_in_polygon(lon, lat, coords[0])
    elif g_type == "MultiPolygon":
        for poly in coords:
            if poly:
                if point_in_polygon(lon, lat, poly[0]):
                    return True
    return False

def calculate_centroid(geometry: Dict[str, Any]) -> Tuple[float, float]:
    """
    Calculates simple average centroid (latitude, longitude) of Polygon/MultiPolygon.
    """
    g_type = geometry.get("type")
    coords = geometry.get("coordinates", [])
    lats = []
    lons = []
    
    if g_type == "Polygon":
        for ring in coords:
            for pt in ring:
                lons.append(pt[0])
                lats.append(pt[1])
    elif g_type == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                for pt in ring:
                    lons.append(pt[0])
                    lats.append(pt[1])
                    
    if lats and lons:
        return sum(lats) / len(lats), sum(lons) / len(lons)
    return 0.0, 0.0

class GISService:
    _instance = None

    @property
    def _loaded_states(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.state_features

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(GISService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self.initialized:
            return
            
        self.geojson_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data", "geojson"
        )
        self.state_features: Dict[str, List[Dict[str, Any]]] = {}
        self.centroids: Dict[str, Dict[str, Tuple[float, float]]] = {}
        self.area_weights: Dict[str, Dict[str, float]] = {}  # state -> district -> area
        self._load_boundaries()
        self.initialized = True

    def _load_boundaries(self) -> None:
        states_mapping = {
            "Tamil Nadu": "tamil_nadu.geojson",
            "Maharashtra": "maharashtra.geojson"
        }
        
        for state_name, filename in states_mapping.items():
            path = os.path.join(self.geojson_dir, filename)
            if not os.path.exists(path):
                logger.warning(f"GeoJSON file not found at {path}. GIS capabilities will be disabled for {state_name}.")
                self.state_features[state_name] = []
                continue
                
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                features = data.get("features", [])
                self.state_features[state_name] = features
                self.centroids[state_name] = {}
                self.area_weights[state_name] = {}
                
                for feat in features:
                    props = feat.get("properties", {})
                    # dtname is used in both Tamil Nadu and Maharashtra GeoJSONs
                    dist_name = props.get("dtname") or props.get("dist") or props.get("district")
                    if not dist_name:
                        continue
                    
                    # Normalize name (e.g. Pune, Madurai)
                    dist_name = dist_name.strip()
                    geom = feat.get("geometry", {})
                    
                    # Compute centroid
                    centroid = calculate_centroid(geom)
                    self.centroids[state_name][dist_name] = centroid
                    
                    # Store shape area or length if present, fallback to 1.0
                    area = props.get("st_area(shape)") or props.get("Shape_Area") or props.get("shape_area") or 1.0
                    self.area_weights[state_name][dist_name] = float(area)
                    
                logger.info(f"Successfully loaded {len(features)} districts for {state_name} from {filename}")
            except Exception as e:
                logger.error(f"Failed to load GeoJSON at {path}: {e}")
                self.state_features[state_name] = []

    def resolve_state_district(self, lat: float, lng: float) -> Tuple[Optional[str], Optional[str]]:
        """
        Determines the state and district a lat/lng point belongs to using point-in-polygon.
        Falls back to nearest centroid distance if exact boundary check fails.
        """
        # 1. Direct Point-in-Polygon Check
        for state_name, features in self.state_features.items():
            for feat in features:
                geom = feat.get("geometry")
                if not geom:
                    continue
                if is_in_geometry(lng, lat, geom):
                    props = feat.get("properties", {})
                    dist_name = props.get("dtname") or props.get("dist") or props.get("district")
                    if dist_name:
                        return state_name, dist_name.strip()

        # 2. Centroid Fallback (Closest distance)
        # Verify if coordinates are reasonably close to our supported states boundaries
        import math
        min_dist = float("inf")
        best_state = None
        best_district = None
        
        for state_name, dists in self.centroids.items():
            for dist_name, centroid in dists.items():
                dist = math.sqrt((centroid[0] - lat)**2 + (centroid[1] - lng)**2)
                if dist < min_dist:
                    min_dist = dist
                    best_state = state_name
                    best_district = dist_name
                    
        # If the closest district is more than 3.5 degrees away, it is likely completely outside
        if min_dist > 3.5:
            return None, None
            
        return best_state, best_district

    def detect_state_and_district(self, lat: float, lng: float) -> Tuple[Optional[str], Optional[str]]:
        """
        Alias for resolve_state_district to support both naming conventions across engine and services.
        """
        return self.resolve_state_district(lat, lng)


    def get_district_centroid(self, state: str, district: str) -> Optional[Tuple[float, float]]:
        """
        Returns the computed centroid (latitude, longitude) for a district.
        """
        state_dists = self.centroids.get(state)
        if not state_dists:
            return None
        return state_dists.get(district)

    def get_supported_districts(self, state: str) -> List[str]:
        """
        Returns all valid districts for a state sorted alphabetically.
        """
        state_dists = self.centroids.get(state)
        if not state_dists:
            return []
        return sorted(list(state_dists.keys()))

    def get_area_weights(self, state: str) -> Dict[str, float]:
        """
        Returns spatial area weights for districts in a state.
        """
        return self.area_weights.get(state, {})

    def validate_coordinates(self, lat: Optional[float], lng: Optional[float]) -> Tuple[bool, Optional[str]]:
        """
        Validates latitude and longitude ranges and precision.
        """
        if lat is None or lng is None:
            return False, "Coordinates missing (latitude or longitude is None)"
        if not (-90.0 <= lat <= 90.0):
            return False, f"Latitude {lat} out of valid range [-90, +90]"
        if not (-180.0 <= lng <= 180.0):
            return False, f"Longitude {lng} out of valid range [-180, +180]"
        # Check India bounding box sanity check [6.0, 38.0] N, [68.0, 98.0] E
        if not (6.0 <= lat <= 38.0 and 68.0 <= lng <= 98.0):
            return False, f"Coordinates ({lat}, {lng}) are outside the standard India agricultural domain [6-38°N, 68-98°E]"
        return True, None

def normalize_district_name(name: str) -> str:
    if not name:
        return ""
    # Title-case normalizing (e.g. "madurai" -> "Madurai")
    return name.strip().title()

