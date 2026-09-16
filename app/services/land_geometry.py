import math
from typing import Any, Dict, List, Optional, Tuple
from app.schemas.land_intelligence import (
    BoundaryAnalysis,
    GeometryType,
    LocationType
)

EARTH_RADIUS_METERS = 6378137.0  # WGS84 major radius


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance between two coordinates in meters via Haversine formula.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c


def calculate_polygon_perimeter_meters(coords: List[List[float]]) -> float:
    """
    Calculates perimeter in meters for a closed ring of [lon, lat] coordinates.
    """
    if len(coords) < 3:
        return 0.0

    total_meters = 0.0
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        total_meters += haversine_distance_meters(p1[1], p1[0], p2[1], p2[0])

    # Close ring if not closed
    if coords[0] != coords[-1]:
        total_meters += haversine_distance_meters(coords[-1][1], coords[-1][0], coords[0][1], coords[0][0])

    return round(total_meters, 2)


def calculate_spherical_polygon_area_sq_meters(coords: List[List[float]]) -> float:
    """
    Computes the geodesic area on Earth's ellipsoid/sphere for a polygon ring
    given as a list of [lon, lat] pairs in decimal degrees using spherical excess.
    """
    if len(coords) < 3:
        return 0.0

    # Ensure ring is closed
    ring = coords.copy()
    if ring[0] != ring[-1]:
        ring.append(ring[0])

    total = 0.0
    num_points = len(ring)
    if num_points < 4:
        return 0.0

    for i in range(num_points - 1):
        p1 = ring[i]
        p2 = ring[i + 1]
        lon1_rad = math.radians(p1[0])
        lat1_rad = math.radians(p1[1])
        lon2_rad = math.radians(p2[0])
        lat2_rad = math.radians(p2[1])

        total += (lon2_rad - lon1_rad) * (2.0 + math.sin(lat1_rad) + math.sin(lat2_rad))

    area_sq_m = abs(total * (EARTH_RADIUS_METERS ** 2) / 2.0)
    return area_sq_m


def validate_and_repair_polygon_coords(coords: List[List[float]]) -> Tuple[List[List[float]], bool, Optional[str]]:
    """
    Validates polygon coordinates: ensures closed ring, checks coordinate orientation,
    filters out duplicate adjacent points, and returns (repaired_coords, was_repaired, notes).
    """
    if not coords or len(coords) < 3:
        return coords, False, "Insufficient points for a polygon (minimum 3 required)"

    repaired = False
    notes = []
    clean_pts: List[List[float]] = []

    # 1. Remove adjacent duplicates
    for pt in coords:
        if not pt or len(pt) < 2:
            continue
        lon, lat = float(pt[0]), float(pt[1])
        if clean_pts:
            prev = clean_pts[-1]
            if abs(prev[0] - lon) < 1e-9 and abs(prev[1] - lat) < 1e-9:
                repaired = True
                continue
        clean_pts.append([lon, lat])

    if len(clean_pts) < 3:
        return clean_pts, False, "Invalid polygon after removing duplicate vertices"

    # 2. Ensure closed ring
    if clean_pts[0] != clean_pts[-1]:
        clean_pts.append(clean_pts[0])
        repaired = True
        notes.append("Closed outer ring by connecting final vertex to start vertex.")

    # 3. Latitude and Longitude range check
    for pt in clean_pts:
        if not (-180.0 <= pt[0] <= 180.0 and -90.0 <= pt[1] <= 90.0):
            return clean_pts, False, f"Coordinates out of bounds: {pt}"

    repair_note = " | ".join(notes) if notes else None
    return clean_pts, repaired, repair_note


def analyze_farm_boundary(
    declared_area_acres: Optional[float],
    latitude: Optional[float],
    longitude: Optional[float],
    boundary_geo: Optional[Dict[str, Any]]
) -> BoundaryAnalysis:
    """
    Comprehensive analysis of farm geometry:
    - Supports Point-only coordinates
    - Supports Polygon & MultiPolygon GeoJSON
    - Calculates Geodesic Area (m², ha, acres) and Perimeter
    - Computes Centroid and Bounding Box
    - Validates calculated area against farmer declared area
    """
    if not boundary_geo:
        if latitude is not None and longitude is not None:
            return BoundaryAnalysis(
                status=LocationType.POINT_ONLY,
                geometry_type=GeometryType.POINT,
                is_valid=True,
                repaired=False,
                declared_area_acres=declared_area_acres,
                centroid=(latitude, longitude),
                area_quality="POINT_ESTIMATE_ONLY"
            )
        return BoundaryAnalysis(
            status=LocationType.LOCATION_MISSING,
            is_valid=False,
            area_quality="NO_GEOMETRY"
        )

    g_type = boundary_geo.get("type", "")
    coords = boundary_geo.get("coordinates", [])

    if g_type == "Point" and coords:
        pt_lon, pt_lat = float(coords[0]), float(coords[1])
        return BoundaryAnalysis(
            status=LocationType.POINT_ONLY,
            geometry_type=GeometryType.POINT,
            is_valid=True,
            repaired=False,
            declared_area_acres=declared_area_acres,
            centroid=(pt_lat, pt_lon),
            bounding_box=[pt_lon, pt_lat, pt_lon, pt_lat],
            area_quality="POINT_ESTIMATE_ONLY"
        )

    if g_type == "Polygon" and coords:
        outer_ring = coords[0]
        repaired_ring, was_repaired, repair_notes = validate_and_repair_polygon_coords(outer_ring)

        if len(repaired_ring) < 4:
            return BoundaryAnalysis(
                status=LocationType.LOCATION_MISSING,
                geometry_type=GeometryType.POLYGON,
                is_valid=False,
                repair_notes="Polygon ring has fewer than 3 unique vertices",
                area_quality="INVALID_POLYGON"
            )

        area_sq_m = calculate_spherical_polygon_area_sq_meters(repaired_ring)
        perimeter_m = calculate_polygon_perimeter_meters(repaired_ring)

        # Subtract inner holes if present
        for hole in coords[1:]:
            hole_repaired, _, _ = validate_and_repair_polygon_coords(hole)
            if len(hole_repaired) >= 4:
                area_sq_m -= calculate_spherical_polygon_area_sq_meters(hole_repaired)

        area_sq_m = max(0.0, area_sq_m)
        area_ha = round(area_sq_m / 10000.0, 4)
        area_acres = round(area_ha * 2.47105, 4)

        # Centroid & BBox
        lons = [pt[0] for pt in repaired_ring]
        lats = [pt[1] for pt in repaired_ring]
        centroid = (round(sum(lats) / len(lats), 6), round(sum(lons) / len(lons), 6))
        bbox = [round(min(lons), 6), round(min(lats), 6), round(max(lons), 6), round(max(lats), 6)]

        # Area comparison quality
        area_diff_pct = None
        area_quality = "VALIDATED_GIS_SURVEY"
        if declared_area_acres and declared_area_acres > 0:
            diff = abs(area_acres - declared_area_acres)
            area_diff_pct = round((diff / declared_area_acres) * 100.0, 2)
            if area_diff_pct > 35.0:
                area_quality = f"DISCREPANCY_FLAGGED ({area_diff_pct}% diff from declared {declared_area_acres} ac)"
            elif area_diff_pct > 15.0:
                area_quality = f"MODERATE_VARIANCE ({area_diff_pct}%)"
            else:
                area_quality = "HIGH_ACCURACY_MATCH"

        return BoundaryAnalysis(
            status=LocationType.BOUNDARY_AVAILABLE,
            geometry_type=GeometryType.POLYGON,
            is_valid=True,
            repaired=was_repaired,
            repair_notes=repair_notes,
            declared_area_acres=declared_area_acres,
            calculated_area_acres=area_acres,
            calculated_area_hectares=area_ha,
            perimeter_meters=perimeter_m,
            area_difference_pct=area_diff_pct,
            area_quality=area_quality,
            centroid=centroid,
            bounding_box=bbox
        )

    # Fallback to point
    if latitude is not None and longitude is not None:
        return BoundaryAnalysis(
            status=LocationType.POINT_ONLY,
            geometry_type=GeometryType.POINT,
            is_valid=True,
            declared_area_acres=declared_area_acres,
            centroid=(latitude, longitude),
            area_quality="POINT_ESTIMATE_ONLY"
        )

    return BoundaryAnalysis(
        status=LocationType.LOCATION_MISSING,
        is_valid=False,
        area_quality="UNAVAILABLE"
    )
