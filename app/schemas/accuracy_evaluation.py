from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class DataFreshnessContract(BaseModel):
    value: Any
    unit: str
    source: str
    source_url: Optional[str] = None
    observed_at: str
    retrieved_at: str
    location: str
    quality: str = "validated"
    status: str = "live"  # live, simulated, cached, estimated, unavailable


class BenchmarkScenario(BaseModel):
    scenario_id: str
    decision_category: str
    state: str
    district: str
    taluk: Optional[str] = "Central"
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    organic_carbon: Optional[float] = None
    water_availability: Optional[str] = "Moderate"
    current_crop: Optional[str] = None
    previous_crop: Optional[str] = None
    season: Optional[str] = None
    question: str
    expert_recommendation: str
    acceptable_alternatives: List[str] = []
    prohibited_actions: List[str] = []
    reasoning: str
    risk_level: str = "LOW"
    ground_truth_source: str
    source_organization: str
    source_date: str = "2026-08-26"
    expert_verified: bool = True
    verification_status: str = "VERIFIED"


class AgentScenarioEvaluation(BaseModel):
    agent_name: str
    output_summary: str
    confidence: float
    is_supported: bool
    data_provider: str
    freshness_status: str


class EvaluationScenarioResult(BaseModel):
    scenario_id: str
    decision_category: str
    state: str
    district: str
    question: str
    expert_ground_truth: str
    acceptable_alternatives: List[str]
    terramind_recommendation: str
    is_accurate: bool
    accuracy_score: float  # 0.0 to 1.0
    evidence_grounded: bool
    is_unsafe: bool
    is_hallucinated: bool
    did_abstain: bool
    confidence_calibrated: float
    confidence_reasons: List[str]
    agents_evaluated: Dict[str, AgentScenarioEvaluation]
    orchestrator_resolution: Optional[str] = None
    failure_root_cause: Optional[str] = None
    recommended_fix: Optional[str] = None
    evaluated_at: str


class CategoryMetric(BaseModel):
    category: str
    total_scenarios: int
    evaluated_scenarios: int
    accurate_count: int
    accuracy_percentage: float
    grounding_rate_pct: float
    unsafe_rate_pct: float
    abstention_rate_pct: float


class RegionalMetric(BaseModel):
    region_name: str
    state: str
    total_scenarios: int
    accurate_count: int
    accuracy_percentage: float


class AgentMetric(BaseModel):
    agent_name: str
    scenarios_evaluated: int
    agreement_rate_pct: float
    average_confidence: float


class EvaluationSummaryResponse(BaseModel):
    benchmark_version: str = "v2.0.0-PROD-BENCHMARK"
    evaluation_date: str
    total_scenarios: int
    evaluated_scenarios: int
    overall_accuracy_pct: float
    grounding_rate_pct: float
    hallucination_rate_pct: float
    unsafe_advice_rate_pct: float
    abstention_rate_pct: float
    confidence_calibration_mae: float
    quality_gate_passed: bool
    category_metrics: Dict[str, CategoryMetric]
    regional_metrics: Dict[str, RegionalMetric]
    agent_metrics: Dict[str, AgentMetric]
    failed_scenarios_count: int
    failed_scenarios: List[EvaluationScenarioResult]
    report_file_md: str
    report_file_json: str
