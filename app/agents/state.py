from typing import TypedDict, List, Dict, Any, Optional

class CouncilState(TypedDict, total=False):
    # Inputs
    state: str
    district: str
    crop: str
    latitude: float
    longitude: float
    farm_id: Optional[str]
    area_acres: Optional[float]
    
    # Context data fetched from APIs at runtime
    weather_data: Dict[str, Any]
    market_data: List[Dict[str, Any]]
    crop_data: List[Dict[str, Any]]
    soil_data: Dict[str, Any]
    climate_data: Dict[str, Any]
    
    # Engineered features
    features: Dict[str, Any]
    
    # Intermediary 5-agent calculations
    land_suitability: Dict[str, Any]      # 1. Land Intelligence Agent
    soil_guardian: Dict[str, Any]         # 2. Soil Guardian Agent
    agronomy_plan: Dict[str, Any]         # 3. Agronomy Agent
    market_risk: Dict[str, Any]           # 4. Market Intelligence Agent
    sustainability: Dict[str, Any]        # 5. Sustainability Agent
    soil_sustainability: Dict[str, Any]   # Backward-compatibility alias
    
    # Cross-Agent validation & conflict resolution
    conflicts: List[Dict[str, Any]]
    council_consensus: Dict[str, Any]
    
    # Final synthesized output
    recommendation: Any
    evidence: List[str]
    risks: List[str]
    confidence: float
    decision_confidence: float
    data_sources: List[str]
    data_coverage: Dict[str, Any]
    model_status: Any
    explanation: str
