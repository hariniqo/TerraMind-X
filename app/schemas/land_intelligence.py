from __future__ import annotations
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Tuple, Union
from pydantic import BaseModel, Field


class LocationType(str, Enum):
    POINT_ONLY = "POINT_ONLY"
    BOUNDARY_AVAILABLE = "BOUNDARY_AVAILABLE"
    LOCATION_MISSING = "LOCATION_MISSING"


class GeometryType(str, Enum):
    POINT = "Point"
    POLYGON = "Polygon"
    MULTI_POLYGON = "MultiPolygon"


class SatelliteQuality(str, Enum):
    VALID = "VALID"
    LOW_QUALITY = "LOW_QUALITY"
    STALE = "STALE"
    MISSING = "MISSING"


class NDVITrendEnum(str, Enum):
    INCREASING = "INCREASING"
    STABLE = "STABLE"
    DECREASING = "DECREASING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DataLevel(str, Enum):
    VILLAGE = "Village"
    TALUK = "Taluk"
    DISTRICT = "District"
    STATE = "State"
    NATIONAL = "National"
    UNAVAILABLE = "Unavailable"


class FarmLocationInput(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    village: Optional[str] = Field(None, description="Village or local revenue ward")
    taluk: Optional[str] = Field(None, description="Taluk / sub-district")
    district: Optional[str] = Field(None, description="District name")
    state: Optional[str] = Field("Tamil Nadu", description="State name")
    country: Optional[str] = Field("India", description="Country name")


class GeoJSONGeometry(BaseModel):
    type: Literal["Point", "Polygon", "MultiPolygon"]
    coordinates: List[Any] = Field(..., description="GeoJSON coordinates array")


class CropHistoryEntry(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. Groundnut, Tomato, Paddy)")
    season: str = Field(..., description="Kharif, Rabi, Summer, or Zaid")
    year: int = Field(..., ge=1990, le=2035, description="Agricultural crop year")
    yield_q_per_acre: Optional[float] = Field(None, description="Yield in quintals per acre")
    source: str = Field("FARMER_DECLARED", description="Source of history record")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Record confidence score")


class SoilProfileInput(BaseModel):
    soil_type: Optional[str] = Field(None, description="e.g. Red Loam, Black Clay, Alluvial")
    ph: Optional[float] = Field(None, ge=3.0, le=11.0, description="Soil pH")
    organic_carbon_pct: Optional[float] = Field(None, ge=0.0, le=10.0, description="Organic Carbon %")
    nitrogen_kg_ha: Optional[float] = Field(None, ge=0.0, description="Available N in kg/ha")
    phosphorus_kg_ha: Optional[float] = Field(None, ge=0.0, description="Available P in kg/ha")
    potassium_kg_ha: Optional[float] = Field(None, ge=0.0, description="Available K in kg/ha")
    electrical_conductivity: Optional[float] = Field(None, ge=0.0, description="EC in dS/m")
    moisture_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Volumetric moisture %")


class LandIntelligenceRequest(BaseModel):
    farm_id: str = Field(..., description="Unique farm identifier")
    farm_name: Optional[str] = Field(None, description="Display name of the farm/field")
    declared_area_acres: Optional[float] = Field(None, gt=0.0, description="Declared farm area in acres")
    location: FarmLocationInput = Field(default_factory=FarmLocationInput)
    boundary: Optional[GeoJSONGeometry] = Field(None, description="GeoJSON Polygon/MultiPolygon boundary")
    current_crop: Optional[str] = Field(None, description="Currently planted or intended crop")
    crop_history: List[CropHistoryEntry] = Field(default_factory=list, description="Historical crop seasons")
    soil_profile: Optional[SoilProfileInput] = Field(None, description="Laboratory or sensor soil metrics")
    radius_km: float = Field(5.0, ge=1.0, le=50.0, description="Spatial intelligence search radius in km")


# --- Output Schemas ---

class BoundaryAnalysis(BaseModel):
    status: LocationType
    geometry_type: Optional[GeometryType] = None
    is_valid: bool = False
    repaired: bool = False
    repair_notes: Optional[str] = None
    declared_area_acres: Optional[float] = None
    calculated_area_acres: Optional[float] = None
    calculated_area_hectares: Optional[float] = None
    perimeter_meters: Optional[float] = None
    area_difference_pct: Optional[float] = None
    area_quality: str = "NOT_AVAILABLE"
    centroid: Optional[Tuple[float, float]] = None  # (lat, lng)
    bounding_box: Optional[List[float]] = None  # [min_lng, min_lat, max_lng, max_lat]


class NDVIObservation(BaseModel):
    date: str
    ndvi: float
    quality: SatelliteQuality
    cloud_cover_pct: float
    spatial_resolution_m: float
    provider: str
    source_url: Optional[str] = None


class NDVITimeSeries(BaseModel):
    current_ndvi: Optional[float] = None
    observation_date: Optional[str] = None
    quality_status: SatelliteQuality = SatelliteQuality.MISSING
    cloud_cover_pct: Optional[float] = None
    provider: str = "UNAVAILABLE"
    is_real_data: bool = False
    trend: NDVITrendEnum = NDVITrendEnum.INSUFFICIENT_DATA
    trend_slope_per_month: Optional[float] = None
    historical_baseline_mean: Optional[float] = None
    anomaly_from_baseline: Optional[float] = None
    anomaly_status: str = "NO_BASELINE"
    vegetation_condition: str = "UNKNOWN"
    observations: List[NDVIObservation] = Field(default_factory=list)


class CropRotationAnalysis(BaseModel):
    rotation_score: float = Field(..., ge=0.0, le=100.0, description="Agronomic rotation quality score 0-100")
    crop_diversity_index: float = Field(..., ge=0.0, le=1.0, description="Simpson / Shannon diversity index")
    total_seasons_recorded: int = 0
    unique_crops_count: int = 0
    repeated_crop_count: int = 0
    consecutive_crop_count: int = 0
    legume_in_rotation: bool = False
    fallow_period_present: bool = False
    risk_level: RiskLevel = RiskLevel.LOW
    risk_reason: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class OverCroppingRisk(BaseModel):
    crop: str
    frequency_in_history: int = 0
    consecutive_seasons: int = 0
    risk_level: RiskLevel = RiskLevel.LOW
    evidence: str
    botanical_family: str
    recommended_rotation_crops: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)


class RegionalCropShare(BaseModel):
    crop: str
    cultivated_area_ha: float
    crop_share_pct: float
    rank: int


class CropConcentrationMetric(BaseModel):
    data_level_used: DataLevel
    data_period: str
    source: str
    herfindahl_index: float = Field(..., description="HHI on 0-10,000 scale")
    concentration_level: str = "MODERATE"  # DIVERSIFIED (<1500), MODERATE (1500-2500), HIGHLY_CONCENTRATED (>2500)
    top_crop_share_pct: float
    top_3_crops_share_pct: float
    dominant_crop: str
    crops: List[RegionalCropShare] = Field(default_factory=list)
    limitations: Optional[str] = None

    @property
    def hhi_index(self) -> float:
        return self.herfindahl_index


class LandUseClassification(BaseModel):
    primary_class: str = "AGRICULTURAL"
    confidence: float = 0.85
    source: str = "Bhuvan / LULC Sentinel-2"
    observation_date: Optional[str] = None
    data_status: str = "AVAILABLE"


class SpatialRisk(BaseModel):
    risk_type: str
    severity: RiskLevel
    title: str
    description: str
    mitigation: str
    evidence: str


class LandEvidenceItem(BaseModel):
    category: str
    finding: str
    metric_value: Optional[Any] = None
    source: str
    confidence: float


class DataQualityMetrics(BaseModel):
    boundary_quality: str
    satellite_quality: str
    crop_history_quality: str
    regional_cultivation_quality: str
    overall_quality_score: float = Field(..., ge=0.0, le=100.0)


class ConfidenceBreakdown(BaseModel):
    source_reliability: float = Field(..., ge=0.0, le=100.0)
    completeness: float = Field(..., ge=0.0, le=100.0)
    freshness: float = Field(..., ge=0.0, le=100.0)
    spatial_relevance: float = Field(..., ge=0.0, le=100.0)
    overall_confidence: float = Field(..., ge=0.0, le=100.0)


class LandIntelligenceResponse(BaseModel):
    farm_id: str
    farm_name: Optional[str] = None
    location_resolved: Dict[str, Any]
    boundary: BoundaryAnalysis
    land_use: LandUseClassification
    satellite_ndvi: NDVITimeSeries
    crop_history: List[CropHistoryEntry]
    rotation_analysis: CropRotationAnalysis
    overcropping_analysis: OverCroppingRisk
    regional_concentration: CropConcentrationMetric
    spatial_risks: List[SpatialRisk] = Field(default_factory=list)
    diversification_recommendations: List[str] = Field(default_factory=list)
    structured_evidence: List[LandEvidenceItem] = Field(default_factory=list)
    data_quality: DataQualityMetrics
    confidence: ConfidenceBreakdown
    sources: List[str] = Field(default_factory=list)
    generated_at: str
    version: str = "2.0.0"
