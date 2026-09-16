from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DataLevel(str, Enum):
    VILLAGE = "Village"
    TALUKA = "Taluka"
    DISTRICT = "District"
    STATE = "Maharashtra"
    NATIONAL = "India"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    UNKNOWN = "UNKNOWN"


class CarbonEstimateStatus(str, Enum):
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    CARBON_ESTIMATE_INCOMPLETE = "CARBON_ESTIMATE_INCOMPLETE"
    DATA_UNAVAILABLE = "DATA_UNAVAILABLE"


class SequestrationCategory(str, Enum):
    MEASURED = "MEASURED"
    ESTIMATED = "ESTIMATED"
    MODELLED = "MODELLED"
    UNAVAILABLE = "UNAVAILABLE"


class CreditEligibilityStatus(str, Enum):
    PRELIMINARY_ONLY = "PRELIMINARY_ONLY"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class IrrigationMethod(str, Enum):
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    FLOOD = "flood"
    FURROW = "furrow"
    RAINFED = "rainfed"
    OTHER = "other"
    UNKNOWN = "unknown"


# ---------------------------------------------------------
# Input Schemas
# ---------------------------------------------------------

class FarmLocationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    farm_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = "Pune"
    state: Optional[str] = "Maharashtra"
    farm_area_acres: Optional[float] = None
    farm_boundary: Optional[Dict[str, Any]] = None


class SoilInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    soil_type: Optional[str] = None
    soil_texture: Optional[str] = None  # e.g., "Clay / Black Cotton (Vertisol)", "Sandy Loam"
    ph: Optional[float] = None
    organic_carbon_pct: Optional[float] = None  # Soil Organic Carbon %
    nitrogen_kg_ha: Optional[float] = None
    phosphorus_kg_ha: Optional[float] = None
    potassium_kg_ha: Optional[float] = None
    moisture_pct: Optional[float] = None
    soil_test_date: Optional[str] = None
    previous_organic_carbon_pct: Optional[float] = None  # for multi-temporal trend
    previous_soil_test_date: Optional[str] = None


class CropInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    current_crop: Optional[str] = None
    previous_crops: Optional[List[str]] = Field(default_factory=list)
    crop_duration_days: Optional[int] = None
    crop_area_acres: Optional[float] = None
    crop_rotation_history: Optional[List[str]] = Field(default_factory=list)
    yield_quintals_per_acre: Optional[float] = None


class WaterInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    irrigation_type: Optional[IrrigationMethod] = IrrigationMethod.UNKNOWN
    water_source: Optional[str] = None  # e.g., "Borewell", "Canal", "Open Well", "Rainfed"
    water_availability_months: Optional[int] = None
    irrigation_frequency_days: Optional[int] = None
    irrigation_quantity_m3: Optional[float] = None  # Total m3 applied per season or cycle


class FarmManagementInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    fertilizer_type: Optional[str] = None  # e.g., "Urea + DAP", "10-26-26", "Organic"
    fertilizer_quantity_kg: Optional[float] = None  # synthetic fertilizer in kg/acre or total
    nitrogen_applied_kg: Optional[float] = None
    phosphorus_applied_kg: Optional[float] = None
    potassium_applied_kg: Optional[float] = None
    organic_manure_tonnes: Optional[float] = None  # Farmyard manure (FYM)
    compost_tonnes: Optional[float] = None
    biofertilizer_used: Optional[bool] = None
    pesticide_usage_litres: Optional[float] = None
    tillage_practice: Optional[str] = None  # "Conventional", "Reduced / Minimum", "Zero-Tillage"
    residue_management: Optional[str] = None  # "Incorporated / Mulched", "Retained on surface", "Burned", "Removed"
    mulching_applied: Optional[bool] = None
    cover_crop_grown: Optional[bool] = None
    diesel_used_litres: Optional[float] = None
    electricity_used_kwh: Optional[float] = None


class ClimateInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    temperature_c: Optional[float] = None
    rainfall_mm: Optional[float] = None
    humidity_pct: Optional[float] = None
    extreme_weather_events: Optional[int] = None
    scenario: Optional[str] = "ssp245"
    projection_period: Optional[str] = "2030"


class SatelliteInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ndvi: Optional[float] = None
    ndvi_trend: Optional[str] = None  # "INCREASING", "STABLE", "DECREASING", "UNKNOWN"
    observation_date: Optional[str] = None


class SustainabilityInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    farm: Optional[FarmLocationInput] = Field(default_factory=FarmLocationInput)
    soil: Optional[SoilInput] = Field(default_factory=SoilInput)
    crop: Optional[CropInput] = Field(default_factory=CropInput)
    water: Optional[WaterInput] = Field(default_factory=WaterInput)
    management: Optional[FarmManagementInput] = Field(default_factory=FarmManagementInput)
    climate: Optional[ClimateInput] = Field(default_factory=ClimateInput)
    satellite: Optional[SatelliteInput] = Field(default_factory=SatelliteInput)


# ---------------------------------------------------------
# Provenance & Source Schema
# ---------------------------------------------------------

class SourceProvenance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    source_id: str
    organization: str
    dataset: str
    url: Optional[str] = None
    parameter: str
    geographic_level: str
    method: str
    method_version: str
    observation_date: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reliability: str = "HIGH"
    confidence: float = 0.90


# ---------------------------------------------------------
# Component Output Schemas
# ---------------------------------------------------------

class SoilCarbonAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str  # "AVAILABLE", "DATA_UNAVAILABLE"
    current_carbon_pct: Optional[float] = None
    previous_carbon_pct: Optional[float] = None
    absolute_change_pct: Optional[float] = None
    percentage_change: Optional[float] = None
    carbon_status: str  # "LOW", "MEDIUM", "HIGH", "UNKNOWN"
    carbon_trend: str  # "IMPROVING", "STABLE", "DECLINING", "INSUFFICIENT_OBSERVATIONS", "UNKNOWN"
    benchmark_reference: str = "ICAR-NBSS&LUP Vertisol / Inceptisol Standards"
    evidence: str
    confidence: float
    source: SourceProvenance


class SoilDegradationRiskAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    soil_degradation_risk: Optional[float] = None  # 0.0 to 1.0
    risk_level: RiskLevel
    drivers: List[str] = Field(default_factory=list)
    evidence: str
    confidence: float
    remediation_actions: List[str] = Field(default_factory=list)


class WaterSustainabilityAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str  # "AVAILABLE", "DATA_UNAVAILABLE"
    irrigation_method: IrrigationMethod
    water_used_m3_per_ha: Optional[float] = None
    crop_water_requirement_m3_per_ha: Optional[float] = None
    water_productivity_kg_per_m3: Optional[float] = None
    water_efficiency_pct: Optional[float] = None
    water_stress_level: RiskLevel
    data_level_used: DataLevel
    efficiency_benchmark_source: str
    evidence: str
    confidence: float
    savings_opportunity: Optional[str] = None
    source: SourceProvenance


class CropRotationSustainability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    rotation_score: Optional[float] = None  # 0-100
    rotation_sustainability_level: str  # "HIGH", "MODERATE", "LOW", "UNKNOWN"
    crop_diversity_shannon: Optional[float] = None
    crop_diversity_simpson: Optional[float] = None
    unique_botanical_families: int = 0
    repeated_crop_penalty: float = 0.0
    legume_inclusion: bool = False
    fallow_period_present: bool = False
    risk: RiskLevel
    recommended_action: str
    confidence: float


class AgriculturalBiodiversityIndicator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    indicator_score: Optional[float] = None  # 0-100
    label: str = "Agricultural biodiversity indicator"
    crop_diversity_component: Optional[float] = None
    cover_crop_bonus: float = 0.0
    intercrop_bonus: float = 0.0
    perennial_strips_bonus: float = 0.0
    status: str  # "DIVERSIFIED", "MODERATE", "MONOCULTURE_DOMINANT", "UNKNOWN"
    scientific_disclaimer: str = "Indicator reflects farm-level cropping and management diversity, not full ecological ecosystem census."
    confidence: float


class CarbonFootprintAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: CarbonEstimateStatus
    estimated_emissions_kg_co2e_per_ha: Optional[float] = None
    estimated_emissions_t_co2e_per_acre: Optional[float] = None
    unit: str = "kg CO2e / ha / year"
    components_breakdown: Dict[str, float] = Field(default_factory=dict)
    emission_factors_used: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainty_range_pct: float = 20.0
    confidence: float
    evidence: str
    source: SourceProvenance


class CarbonSequestrationAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: SequestrationCategory
    sequestration_rate_t_co2e_per_ha_yr: Optional[float] = None
    sequestration_rate_t_co2e_per_acre_yr: Optional[float] = None
    mechanism: str
    scientific_methodology: str
    confidence: float
    evidence: str
    source: SourceProvenance


class CarbonCreditAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    potential_eligibility: CreditEligibilityStatus
    methodology: str = "Verra VM0042 / Gold Standard Agricultural Land Management"
    tradable_credits_claimed: float = 0.0  # STRICTLY 0.0 until verified
    required_data_for_verification: List[str] = Field(default_factory=list)
    verification_requirement: str
    confidence: float
    disclaimer: str = "PRELIMINARY ASSESSMENT ONLY. No tradable carbon credits are claimed, issued, or guaranteed."


class ClimateResilienceAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str
    district: str
    cmip6_scenario: str
    projection_period: str
    temp_anomaly_c: Optional[float] = None
    precip_anomaly_pct: Optional[float] = None
    heat_stress_risk: RiskLevel
    drought_risk: RiskLevel
    excess_rainfall_risk: RiskLevel
    adaptation_priorities: List[str] = Field(default_factory=list)
    confidence: float
    source: SourceProvenance


# ---------------------------------------------------------
# Composite Response Schema
# ---------------------------------------------------------

class ComponentWeight(BaseModel):
    component: str
    weight_pct: float
    available: bool
    reason: str


class SustainabilityAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    analysis_id: str
    farm_id: Optional[str] = None
    state: str = "Maharashtra"
    district: str
    data_level_used: DataLevel
    data_level_reason: str
    
    # Composite Scores
    sustainability_score: Optional[float] = None  # 0 to 100
    sustainability_rating: str  # "EXCELLENT", "GOOD", "MODERATE", "VULNERABLE", "UNAVAILABLE"
    score_confidence_pct: float  # 0 to 100
    data_quality_score_pct: float  # 0 to 100
    score_weights: List[ComponentWeight] = Field(default_factory=list)
    
    # Detailed Intelligence Blocks
    soil_carbon: SoilCarbonAnalysis
    soil_degradation: SoilDegradationRiskAnalysis
    water_sustainability: WaterSustainabilityAnalysis
    crop_rotation: CropRotationSustainability
    biodiversity: AgriculturalBiodiversityIndicator
    carbon_footprint: CarbonFootprintAnalysis
    carbon_sequestration: CarbonSequestrationAnalysis
    carbon_credit_assessment: CarbonCreditAssessment
    climate_resilience: ClimateResilienceAnalysis
    
    # Provenance & Advisories
    data_sources: List[SourceProvenance] = Field(default_factory=list)
    english_advisory: str
    tamil_advisory: str
    data_freshness: Dict[str, str] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
