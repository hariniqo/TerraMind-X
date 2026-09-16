from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from app.services.agricultural_accuracy_service import accuracy_service
from app.schemas.accuracy_evaluation import (
    EvaluationSummaryResponse,
    CategoryMetric,
    RegionalMetric,
    EvaluationScenarioResult
)

router = APIRouter(prefix="/evaluation", tags=["Agricultural Accuracy & Ground-Truth Evaluation Engine"])


@router.post("/run", response_model=EvaluationSummaryResponse)
async def run_accuracy_benchmark_evaluation() -> EvaluationSummaryResponse:
    """
    Executes the complete 200-scenario ground-truth agricultural accuracy benchmark suite.
    Calculates overall agreement, category breakdown, multi-agent scores, and saves reports.
    """
    try:
        return await accuracy_service.run_full_benchmark()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Accuracy evaluation benchmark execution failed: {str(e)}"
        )


@router.get("/summary", response_model=EvaluationSummaryResponse)
async def get_latest_evaluation_summary() -> EvaluationSummaryResponse:
    """
    Retrieves latest ground-truth accuracy benchmark summary or executes benchmark if empty.
    """
    summary = accuracy_service.get_last_summary()
    if not summary:
        summary = await accuracy_service.run_full_benchmark()
    return summary


@router.get("/category/{category}", response_model=CategoryMetric)
async def get_accuracy_by_category(category: str) -> CategoryMetric:
    """
    Retrieves accuracy and grounding metrics for a specific agricultural decision category.
    """
    summary = accuracy_service.get_last_summary()
    if not summary:
        summary = await accuracy_service.run_full_benchmark()

    # Case-insensitive category match
    for cat_name, metric in summary.category_metrics.items():
        if cat_name.lower() == category.lower():
            return metric

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Category '{category}' not found in evaluated benchmark metrics."
    )


@router.get("/geography/{region}", response_model=RegionalMetric)
async def get_accuracy_by_region(region: str) -> RegionalMetric:
    """
    Retrieves regional accuracy metrics for a specific district (e.g. Madurai, Nagpur, Pune).
    """
    summary = accuracy_service.get_last_summary()
    if not summary:
        summary = await accuracy_service.run_full_benchmark()

    for reg_key, metric in summary.regional_metrics.items():
        if region.lower() in reg_key.lower():
            return metric

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Regional benchmark metrics for '{region}' not found."
    )


@router.get("/scenario/{scenario_id}", response_model=EvaluationScenarioResult)
async def get_scenario_evaluation_detail(scenario_id: str) -> EvaluationScenarioResult:
    """
    Retrieves detailed ground-truth evaluation, agent reasoning trace, and fix for a scenario.
    """
    summary = accuracy_service.get_last_summary()
    if not summary:
        summary = await accuracy_service.run_full_benchmark()

    for scn in accuracy_service.scenarios:
        if scn.scenario_id.lower() == scenario_id.lower():
            return await accuracy_service.evaluate_single_scenario(scn)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scenario ID '{scenario_id}' not found in benchmark registry."
    )
