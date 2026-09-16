from typing import Dict, Any
from app.agents.state import CouncilState
from app.ml.diffusion import calculate_saturation_risk
from app.ml.market_model import MarketRiskModel

def market_agent(state: CouncilState) -> Dict[str, Any]:
    """
    Market intelligence node: runs NetworkX SIS diffusion
    and XGBoost MarketRisk model to evaluate price crash risks.
    Handles unavailable market data states cleanly.
    """
    print("Executing Market Intelligence Agent...")
    crop = state["crop"]
    crop_lower = crop.lower()
    
    # Seeding base adoption rate
    initial_adoption = 0.78 if "tomato" in crop_lower else 0.21 if "chilli" in crop_lower else 0.15
    
    # Run SIS diffusion simulation
    diffusion_res = calculate_saturation_risk(
        crop=crop, 
        initial_adoption=initial_adoption, 
        beta=0.35, 
        gamma=0.05, 
        r_critical=0.55
    )
    
    # Run ML Market model prediction
    risk_model = MarketRiskModel()
    features = state.get("features") or {}
    risk_pred = risk_model.predict_risk(features)
    
    if risk_pred["model_status"] == "unavailable":
        risk_score = None
        evidence = "Market oversupply risk calculation is unavailable due to missing OGD market records."
    elif "trained" not in risk_pred["model_status"]:
        risk_score = diffusion_res["oversupply_risk"]
        evidence = f"Oversupply risk is {risk_score*100:.0f}% based on SIS Crop Diffusion simulation."
    else:
        risk_score = risk_pred["market_risk_score"]
        evidence = f"Oversupply risk predicted at {risk_score*100:.0f}% using MarketRiskRegressor model."
        
    return {
        "market_risk": {
            "oversupply_risk": risk_score,
            "peak_adoption_rate": diffusion_res["adoption_rate"],
            "saturation_time": diffusion_res["saturation_time"],
            "evidence": evidence,
            "model_status": risk_pred["model_status"]
        }
    }
