import logging
from typing import Dict, Any, Optional, List
from app.core.response_sanitizer import sanitize_ai_response
from app.ml.diffusion import calculate_saturation_risk

logger = logging.getLogger(__name__)

class WhatIfSimulationService:
    """
    Agricultural What-If Simulation Engine.
    Re-evaluates farm economics, water efficiency, soil health, and mandi price impacts
    under simulated weather shocks, market arrival surges, crop switches, and agronomic shifts.
    """

    def simulate(
        self,
        current_crop: str = "Tomato",
        target_crop: Optional[str] = None,
        district: str = "Madurai",
        state: str = "Tamil Nadu",
        area_acres: float = 2.5,
        rainfall_delta_pct: float = 0.0,
        arrival_surge_pct: float = 0.0,
        irrigation_type: str = "DRIP",
        is_organic: bool = False,
        sowing_delay_weeks: int = 0
    ) -> Dict[str, Any]:
        """
        Calculates multi-dimensional outcomes across agronomy, soil, water, market, and net margins.
        """
        eval_crop = (target_crop or current_crop).capitalize()
        eval_crop_lower = eval_crop.lower()

        # 1. Base Crop Economics & Market Dynamics
        crop_profiles = {
            "tomato": {
                "base_yield_q_per_acre": 80.0,
                "base_price_inr_q": 2200.0,
                "input_cost_inr_acre": 28000.0,
                "water_need_mm": 550.0,
                "soil_depletion_rate": 1.2,
                "base_adoption": 0.75,
                "oversupply_sensitivity": 0.85
            },
            "chilli": {
                "base_yield_q_per_acre": 35.0,
                "base_price_inr_q": 6800.0,
                "input_cost_inr_acre": 32000.0,
                "water_need_mm": 450.0,
                "soil_depletion_rate": 0.8,
                "base_adoption": 0.28,
                "oversupply_sensitivity": 0.40
            },
            "cotton": {
                "base_yield_q_per_acre": 22.0,
                "base_price_inr_q": 7400.0,
                "input_cost_inr_acre": 25000.0,
                "water_need_mm": 600.0,
                "soil_depletion_rate": 1.0,
                "base_adoption": 0.45,
                "oversupply_sensitivity": 0.30
            },
            "groundnut": {
                "base_yield_q_per_acre": 28.0,
                "base_price_inr_q": 6500.0,
                "input_cost_inr_acre": 22000.0,
                "water_need_mm": 380.0,
                "soil_depletion_rate": -0.4,  # Nitrogen fixing
                "base_adoption": 0.35,
                "oversupply_sensitivity": 0.25
            },
            "onion": {
                "base_yield_q_per_acre": 65.0,
                "base_price_inr_q": 2600.0,
                "input_cost_inr_acre": 26000.0,
                "water_need_mm": 480.0,
                "soil_depletion_rate": 0.7,
                "base_adoption": 0.50,
                "oversupply_sensitivity": 0.65
            }
        }

        profile = crop_profiles.get(eval_crop_lower, crop_profiles["tomato"])

        # 2. Market Impact Calculation
        base_adoption = profile["base_adoption"]
        effective_arrival_shock = arrival_surge_pct / 100.0
        adjusted_adoption = min(0.95, max(0.05, base_adoption + (effective_arrival_shock * 0.3)))

        diffusion_sim = calculate_saturation_risk(
            crop=eval_crop,
            initial_adoption=adjusted_adoption,
            beta=0.35,
            gamma=0.05,
            r_critical=0.55
        )
        oversupply_risk_pct = round(diffusion_sim["oversupply_risk"] * 100.0, 1)

        # Price elasticity under arrival surges
        price_drop_pct = (effective_arrival_shock * 0.45) + (diffusion_sim["oversupply_risk"] * 0.25)
        simulated_price_inr_q = round(profile["base_price_inr_q"] * max(0.40, (1.0 - price_drop_pct)), 0)

        # 3. Weather & Irrigation Impact on Yield and Water
        yield_multiplier = 1.0
        if rainfall_delta_pct < -15.0:
            if irrigation_type.upper() == "DRIP":
                yield_multiplier *= 0.95  # Drip buffers water deficit
            else:
                yield_multiplier *= 0.78  # Flood irrigation suffers yield loss
        elif rainfall_delta_pct > 25.0:
            yield_multiplier *= 0.92  # Excess rain pest risk

        if sowing_delay_weeks > 2:
            yield_multiplier *= max(0.70, 1.0 - (sowing_delay_weeks * 0.05))

        simulated_yield_q_acre = round(profile["base_yield_q_per_acre"] * yield_multiplier, 1)
        total_production_q = simulated_yield_q_acre * area_acres

        # 4. Water and Input Cost Modeling
        irr_efficiency_pct = 88.0 if irrigation_type.upper() == "DRIP" else 55.0
        water_saved_pct = 38.0 if irrigation_type.upper() == "DRIP" else 0.0

        input_cost_acre = profile["input_cost_inr_acre"]
        if is_organic:
            input_cost_acre *= 0.82  # Organic bio-inputs cost less over time
            simulated_price_inr_q *= 1.15  # 15% organic premium

        gross_revenue_inr = round(total_production_q * simulated_price_inr_q, 0)
        total_costs_inr = round(input_cost_acre * area_acres, 0)
        net_profit_inr = round(gross_revenue_inr - total_costs_inr, 0)

        # 5. Soil Impact
        soil_score_delta = 0.0
        if is_organic:
            soil_score_delta += 8.0
        if profile["soil_depletion_rate"] < 0:
            soil_score_delta += 6.0  # Legume bonus
        else:
            soil_score_delta -= profile["soil_depletion_rate"] * 2.5

        # 6. Synthesize Reasoning and Decision
        reasoning_lines = [
            f"**Simulated Crop**: {eval_crop} across {area_acres} acres in {district}.",
            f"**Price Projection**: Expected realization of ₹{simulated_price_inr_q:,.0f}/quintal (Oversupply risk: {oversupply_risk_pct}%).",
            f"**Water & Climate**: {irrigation_type} irrigation maintains {irr_efficiency_pct:.0f}% efficiency under {rainfall_delta_pct:+.0f}% rainfall variance.",
            f"**Financial Return**: Estimated gross revenue ₹{gross_revenue_inr:,.0f} with net margin ₹{net_profit_inr:,.0f}."
        ]

        if is_organic:
            reasoning_lines.append("**Organic Premium**: 15% price upside captured through chemical-free cultivation certification.")

        confidence_score = round(max(0.65, 0.92 - (abs(rainfall_delta_pct) * 0.002) - (effective_arrival_shock * 0.1)), 2)

        return {
            "simulation_id": f"SIM-{eval_crop_lower[:3].upper()}-{int(abs(rainfall_delta_pct))}-{int(arrival_surge_pct)}",
            "crop": eval_crop,
            "district": district,
            "state": state,
            "inputs": {
                "target_crop": eval_crop,
                "rainfall_delta_pct": rainfall_delta_pct,
                "arrival_surge_pct": arrival_surge_pct,
                "irrigation_type": irrigation_type,
                "is_organic": is_organic,
                "sowing_delay_weeks": sowing_delay_weeks
            },
            "outcomes": {
                "expected_yield_q_per_acre": simulated_yield_q_acre,
                "total_production_q": total_production_q,
                "projected_mandi_price_inr_q": simulated_price_inr_q,
                "oversupply_risk_pct": oversupply_risk_pct,
                "water_saved_pct": water_saved_pct,
                "irrigation_efficiency_pct": irr_efficiency_pct,
                "soil_score_delta": round(soil_score_delta, 1),
                "estimated_gross_revenue_inr": gross_revenue_inr,
                "estimated_total_cost_inr": total_costs_inr,
                "estimated_net_profit_inr": net_profit_inr
            },
            "confidence": confidence_score,
            "reasoning": sanitize_ai_response("\n".join(reasoning_lines))
        }
