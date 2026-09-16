from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, TypedDict

# LangGraph state definition for the Agronomy Agent node
class AgronomyState(TypedDict):
    farmer_input: Dict[str, Any]
    validated_input: Dict[str, Any]
    engineered_features: Dict[str, Any]
    crop_prediction: Dict[str, Any]
    yield_prediction: Dict[str, Any]
    stress_prediction: Dict[str, Any]
    nutrient_analysis: Dict[str, Any]
    rule_results: Dict[str, Any]
    retrieved_evidence: List[Dict[str, Any]]
    nvidia_response: Optional[str]
    final_advisory: Dict[str, Any]
    warnings: List[str]

# FastAPI Request schema
class AgronomyRequest(BaseModel):
    location: str = Field(..., example="Madurai, Tamil Nadu")
    soil_type: str = Field(..., example="Red Loam")
    ph: Optional[float] = Field(None, example=6.2)
    nitrogen: Optional[float] = Field(None, example=42.0)
    phosphorus: Optional[float] = Field(None, example=25.0)
    potassium: Optional[float] = Field(None, example=38.0)
    temperature: Optional[float] = Field(None, example=29.0)
    humidity: Optional[float] = Field(None, example=72.0)
    rainfall: Optional[float] = Field(None, example=780.0)
    season: str = Field(..., example="Kharif")
    crop: Optional[str] = Field(None, example=None)
    ndvi: Optional[float] = Field(None, example=0.61)
    language: Optional[str] = Field("en", example="en")

# Nested response models
class CropRecommendation(BaseModel):
    crop: str
    probability: float

class YieldPrediction(BaseModel):
    predicted_yield: Optional[float]
    unit: str
    prediction_interval: Optional[List[float]] = None
    model_confidence: Optional[str] = None
    source: str

class NutrientStatus(BaseModel):
    status: str
    value: Optional[float]
    reference: str

class NutrientAssessment(BaseModel):
    nitrogen: NutrientStatus
    phosphorus: NutrientStatus
    potassium: NutrientStatus
    ph: NutrientStatus

class StressRisk(BaseModel):
    stress_level: str
    source: str
    confidence_metrics: Optional[Dict[str, Any]] = None

class EvidenceMetadata(BaseModel):
    source: str
    title: str
    chapter: str
    page: str
    topic: str
    text: str
    relevance_score: float

# FastAPI Response schema
class AgronomyResponse(BaseModel):
    agent: str = "Agronomy Agent"
    location: str
    language: str
    crop_recommendations: List[CropRecommendation]
    yield_prediction: YieldPrediction
    soil_assessment: Dict[str, Any]
    nutrient_assessment: NutrientAssessment
    stress_risk: StressRisk
    agronomic_constraints: List[Dict[str, Any]]
    organic_practices: List[Dict[str, Any]]
    evidence: List[EvidenceMetadata]
    advisory: str
    confidence: Dict[str, Any]
    warnings: List[str]
    model_versions: Dict[str, str]
