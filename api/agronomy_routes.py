import os
import json
from fastapi import APIRouter, HTTPException, status
from agents.agronomy.schemas import AgronomyRequest, AgronomyResponse
from agents.agronomy.agent import AgronomyAgent
from agents.agronomy.config import MODELS_DIR

router = APIRouter()
agent = AgronomyAgent()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "Agronomy Agent"
    }

@router.post("/analyze", response_model=AgronomyResponse)
async def analyze_agronomy(payload: AgronomyRequest):
    try:
        # Map payload schema to raw dictionary input
        raw_input = payload.model_dump()
        result = await agent.run_analysis(raw_input)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agronomy Agent analysis pipeline failed: {str(e)}"
        )

@router.get("/models")
async def get_model_status():
    """
    Exposes registry, evaluation, and importance metrics of all Agronomy XGBoost models.
    """
    # 1. Load registry
    registry = {}
    reg_path = os.path.join(MODELS_DIR, "registry.json")
    if os.path.exists(reg_path):
        try:
            with open(reg_path, "r") as f:
                registry = json.load(f)
        except Exception:
            pass
            
    # 2. Load evaluation results
    eval_results = {}
    eval_path = os.path.join(MODELS_DIR, "evaluation_results.json")
    if os.path.exists(eval_path):
        try:
            with open(eval_path, "r") as f:
                eval_results = json.load(f)
        except Exception:
            pass
            
    # 3. Load feature importances
    feat_imp = {}
    feat_path = os.path.join(MODELS_DIR, "feature_importance.json")
    if os.path.exists(feat_path):
        try:
            with open(feat_path, "r") as f:
                feat_imp = json.load(f)
        except Exception:
            pass
            
    return {
        "model_registry": registry,
        "evaluation_metrics": eval_results,
        "feature_importances": feat_imp
    }
