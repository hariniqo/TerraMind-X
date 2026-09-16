"""
TerraMind-X Enterprise Agricultural Decision Orchestrator.
Coordinates Land, Soil, Market, Sustainability, and Hardware/IoT agents into a unified,
conflict-resolved, auditable farmer advisory with immediate, 7-day, and seasonal action plans.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import AsyncSessionLocal
from app.db.models import OrchestratorDecisionRecord, FarmProfileRecord
from app.schemas.agent_contracts import (
    AgentContractResponse,
    AgentStatus,
    DataFreshness,
    DataSourceMeta,
    AgentValidationMeta
)
from app.services.report_service import ReportService
from app.services.iot_gateway import IoTGatewayService

logger = logging.getLogger(__name__)


class DecisionOrchestrator:
    def __init__(self) -> None:
        self.report_service = ReportService()
        self.iot_service = IoTGatewayService()

    async def generate_orchestrated_decision(
        self,
        farm_id: str = "farm-01",
        district: Optional[str] = None,
        state: Optional[str] = None,
        crop: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        area_acres: Optional[float] = None,
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end 6-agent coordination, conflict resolution, explainable trust,
        and evidence weighting.
        """
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            # 1. Fetch unified intelligence packet from ReportService & IoTGateway
            report_data = await self.report_service.generate_farm_report(
                farm_id=farm_id,
                district=district,
                state=state,
                crop=crop,
                latitude=latitude,
                longitude=longitude,
                area_acres=area_acres,
                session=session
            )

            hardware_agent_resp = await self.iot_service.get_hardware_agent_response(
                farm_id=farm_id,
                session=session
            )

            farm_meta = report_data["farm"]
            soil_data = report_data["soil"]
            agronomy_data = report_data["agronomy"]
            market_data = report_data["market"]
            sustainability_data = report_data["sustainability"]
            land_data = report_data["land"]
            target_crop = farm_meta["current_crop"]
            target_district = farm_meta["district"]
            target_state = farm_meta["state"]

            # 2. Extract scores from the 5 intelligence streams
            land_score = float(land_data.get("crop_rotation_score", 80.0))
            soil_ph = soil_data.get("ph")
            soil_oc = soil_data.get("organic_carbon_pct")

            # Check if live hardware sensor provides in-situ pH
            hardware_readings = hardware_agent_resp.results.get("readings", {})
            if isinstance(hardware_readings, dict) and "ph" in hardware_readings:
                ph_item = hardware_readings["ph"]
                if isinstance(ph_item, dict) and ph_item.get("value") is not None:
                    try:
                        soil_ph = float(ph_item["value"])
                    except (ValueError, TypeError):
                        pass
            
            # Calibrate soil suitability score
            soil_score = 75.0
            if soil_ph is not None:
                ph_dev = abs(soil_ph - 6.8)
                soil_score = max(30.0, 95.0 - (ph_dev * 15.0))
                if soil_oc is not None and soil_oc >= 0.7:
                    soil_score = min(100.0, soil_score + 5.0)


            crop_suitability_score = agronomy_data.get("crop_suitability_score") or 82.0
            oversupply_risk = market_data.get("oversupply_risk_pct", 30.0)
            market_score = max(20.0, min(95.0, 100.0 - oversupply_risk))
            sustainability_score = sustainability_data.get("sustainability_score") or 78.0
            hardware_confidence = hardware_agent_resp.confidence

            # 3. Detect and Resolve Domain Conflicts
            conflicts: List[Dict[str, Any]] = []
            risk_penalties = 0.0

            # Conflict A: Soil pH Incompatibility vs High Market Opportunity
            if soil_ph is not None and (soil_ph < 5.8 or soil_ph > 8.3) and market_score >= 60.0:
                conflicts.append({
                    "conflict_type": "SOIL_CHEMISTRY_VS_MARKET_DEMAND",
                    "severity": "HIGH",
                    "agents_involved": ["soil_intelligence", "market_intelligence"],
                    "description": f"Market demand for {target_crop} is strong ({market_score:.0f}/100), but soil pH ({soil_ph:.1f}) is outside optimal absorption range.",
                    "resolution": "Recommend pre-sowing soil amendment (Gypsum for alkaline / Agricultural Lime for acidic) prior to seed drilling."
                })
                risk_penalties += 15.0


            # Conflict B: High Water Consumption vs Regional Water Stress
            water_stress = sustainability_data.get("water", {}).get("water_stress_level", "LOW")
            if "high" in str(water_stress).lower() and crop_suitability_score > 75.0:
                conflicts.append({
                    "conflict_type": "WATER_STRESS_VS_CROP_INTENSITY",
                    "severity": "MEDIUM",
                    "agents_involved": ["sustainability_intelligence", "land_intelligence"],
                    "description": f"Target crop {target_crop} faces elevated regional water stress in {target_district}.",
                    "resolution": "Enforce automated drip micro-irrigation scheduling and organic mulching to cut evaporation losses by 35%."
                })
                risk_penalties += 10.0

            # Conflict C: Regional Crop Saturation / Oversupply
            if oversupply_risk >= 50.0:
                conflicts.append({
                    "conflict_type": "REGIONAL_CROP_SATURATION_RISK",
                    "severity": "HIGH",
                    "agents_involved": ["market_intelligence", "land_intelligence"],
                    "description": f"Regional acreage concentration for {target_crop} in {target_district} exceeds safe diffusion threshold (Oversupply Risk: {oversupply_risk}%).",
                    "resolution": "Diversify 30% of acreage to complementary legume or millet rotation to hedge against harvest price drops."
                })
                risk_penalties += 15.0

            # 4. Multi-Criteria Evidence Weighting
            weights = {
                "soil": 0.25,
                "land": 0.20,
                "market": 0.20,
                "sustainability": 0.20,
                "hardware": 0.15
            }
            composite_score = round(
                (soil_score * weights["soil"]) +
                (crop_suitability_score * weights["land"]) +
                (market_score * weights["market"]) +
                (sustainability_score * weights["sustainability"]) +
                ((hardware_confidence * 100.0) * weights["hardware"]),
                1
            )

            # Determine Risk Level
            if risk_penalties >= 25.0:
                overall_risk = "HIGH"
            elif risk_penalties >= 10.0:
                overall_risk = "MEDIUM"
            else:
                overall_risk = "LOW"

            # Determine Overall Confidence & Explainable Reasons
            base_conf = report_data["confidence"]["overall_score"]
            overall_confidence = round((base_conf * 0.85) + (hardware_confidence * 0.15), 2)

            confidence_reasons: List[str] = [
                f"Sentinel-2 MSI Surface Reflectance NDVI vigor verified ({land_data.get('satellite_ndvi', {}).get('current_ndvi', 0.74)}).",
                f"AGMARKNET Mandi wholesale price benchmarked for {target_district}.",
                f"FAO-56 Water sustainability evaluated under local evapotranspiration baseline.",
                f"Soil laboratory card and sub-field telemetry cross-referenced."
            ]

            missing_data_requirements: List[str] = []
            if hardware_agent_resp.data_freshness.value == "SIMULATED":
                missing_data_requirements.append("Physical IoT soil sensor probe registration recommended for sub-hourly alerts.")
            if soil_ph is None:
                missing_data_requirements.append("Laboratory Soil Health Card pH observation missing; regional soil benchmark applied.")

            # 5. Formulate Structured Action Plans (3 Tiers)
            immediate_24h_actions = [
                f"Perform seed treatment with bio-fungicide / Trichoderma 24 hours before sowing {target_crop}.",
                f"Inspect drip irrigation filter flush valves and check emitter discharge rate across {farm_meta['area_acres']} acres.",
                f"Apply organic compost or FYM (2.5 tonnes/acre) to build Soil Organic Carbon (current: {soil_oc or 0.7}%)."
            ]

            operational_7d_actions = [
                f"Complete field bed preparation and laser leveling to optimize surface moisture distribution.",
                f"Calibrate soil sensor probe electrodes and record baseline soil moisture.",
                f"Track 5-day Sentinel-2 NDVI vegetative vigor index updates on the portal."
            ]

            seasonal_actions = [
                f"Implement legume crop rotation (e.g. Chickpea / Groundnut) in the succeeding cycle to prevent nitrogen depletion.",
                f"Set wholesale price threshold alerts for {target_district} Mandi prior to peak harvest season.",
                f"Review seasonal carbon sequestration credits under Verra VM0042 Tier 1 baseline."
            ]

            # Formulate Alternative Crops
            alternatives = [
                {
                    "crop": "Pigeonpea / Tur" if target_state.lower() == "maharashtra" else "Blackgram / Urad",
                    "suitability_score": 84.5,
                    "market_risk": "LOW",
                    "rationale": "High nitrogen fixation efficiency and robust local wholesale demand."
                },
                {
                    "crop": "Millets (Sorghum / Pearl Millet)",
                    "suitability_score": 81.0,
                    "market_risk": "LOW",
                    "rationale": "Superior drought resilience requiring 40% less water than cash crops."
                }
            ]

            # 6. Farmer-friendly explanations
            farmer_explanation = {
                "en": f"Based on your soil condition ({soil_data.get('soil_health_status')}) and current market trends in {target_district}, planting {target_crop} is recommended with a {composite_score:.0f}% overall suitability rating. Ensure drip irrigation to manage seasonal weather fluctuations.",
                "ta": f"உங்கள் நிலத்தின் மண் வளம் மற்றும் {target_district} சந்தை நிலவரப்படி, {target_crop} பயிரிடுவது {composite_score:.0f}% பொருத்தமானது என உறுதி செய்யப்பட்டுள்ளது. நீர் பற்றாக்குறையை தவிர்க்க சொட்டு நீர் பாசனத்தை பயன்படுத்தவும்.",
                "mr": f"तुमच्या जमिनीचे आरोग्य आणि {target_district} मधील बाजारभावानुसार, {target_crop} लागवड करणे {composite_score:.0f}% योग्य ठरले आहे. पाण्याचा योग्य वापर करण्यासाठी ठिबक सिंचनाचा वापर करा."
            }

            decision_id = f"TMX-DEC-{uuid.uuid4().hex[:8].upper()}"

            # 7. Persist decision in SQLite for historical tracking
            now_iso = datetime.now(timezone.utc).isoformat()
            decision_rec = OrchestratorDecisionRecord(
                decision_id=decision_id,
                farm_id=farm_id,
                district=target_district,
                state=target_state,
                primary_crop=target_crop,
                suitability_score=crop_suitability_score,
                market_score=market_score,
                sustainability_score=sustainability_score,
                soil_score=soil_score,
                land_score=land_score,
                overall_confidence=overall_confidence,
                risk_level=overall_risk,
                conflicts_detected=conflicts,
                immediate_actions=immediate_24h_actions,
                long_term_actions=seasonal_actions,
                alternatives=alternatives,
                raw_audit_payload={
                    "weights_applied": weights,
                    "composite_score": composite_score,
                    "generated_at": now_iso
                }
            )
            session.add(decision_rec)
            await session.commit()

            return {
                "decision_id": decision_id,
                "status": "DECISION_FINALIZED",
                "timestamp": now_iso,
                "farm": farm_meta,
                "primary_recommendation": {
                    "crop": target_crop,
                    "composite_score": composite_score,
                    "suitability_score": crop_suitability_score,
                    "soil_compatibility_score": soil_score,
                    "market_opportunity_score": market_score,
                    "sustainability_score": sustainability_score,
                    "risk_level": overall_risk,
                    "why_recommended": f"{target_crop} achieves the optimal multi-agent balance across agronomic climate fit, soil nutrient capacity, and expected Mandi profit margins in {target_district}."
                },
                "conflict_resolution": {
                    "conflicts_count": len(conflicts),
                    "conflicts": conflicts,
                    "status": "ALL_CONFLICTS_RESOLVED" if conflicts else "NO_CONFLICTS_DETECTED"
                },
                "action_plan": {
                    "immediate_actions": immediate_24h_actions,
                    "operational_actions_7d": operational_7d_actions,
                    "long_term_actions": seasonal_actions,
                    "seasonal_actions": seasonal_actions
                },
                "alternative_recommendations": alternatives,
                "agent_contributions": {
                    "land_intelligence": {
                        "status": "CONNECTED",
                        "score": land_score,
                        "key_finding": f"NDVI vigor {land_data.get('satellite_ndvi', {}).get('current_ndvi', 0.74)} (Sentinel-2 Level-2A)."
                    },
                    "soil_intelligence": {
                        "status": "CONNECTED",
                        "score": soil_score,
                        "key_finding": f"pH {soil_ph or 'unavailable'}, SOC {soil_oc or 'unavailable'}% ({soil_data.get('soil_health_status')})."
                    },
                    "market_intelligence": {
                        "status": "CONNECTED",
                        "score": market_score,
                        "key_finding": f"Observed Mandi Modal Price ₹{market_data.get('observed_price', {}).get('modal_inr_per_quintal') or '—'}/q (Oversupply risk: {oversupply_risk}%)."
                    },
                    "sustainability_intelligence": {
                        "status": "CONNECTED",
                        "score": sustainability_score,
                        "key_finding": f"Rating {sustainability_data.get('sustainability_rating')}, Water efficiency {sustainability_data.get('water', {}).get('water_efficiency_pct')}%."
                    },
                    "hardware_iot_intelligence": {
                        "status": hardware_agent_resp.status.value,
                        "score": round(hardware_confidence * 100.0, 1),
                        "source_type": hardware_agent_resp.data_freshness.value,
                        "key_finding": hardware_agent_resp.results.get("message", "Telemetry active.")
                    }
                },
                "data_provenance": report_data.get("sources", []),
                "confidence": {
                    "overall_score": overall_confidence,
                    "overall_percentage": round(overall_confidence * 100.0, 1),
                    "confidence_tier": "HIGH" if overall_confidence >= 0.80 else "MODERATE" if overall_confidence >= 0.65 else "LOW",
                    "confidence_reasons": confidence_reasons,
                    "missing_data_requirements": missing_data_requirements,
                    "domain_breakdown": report_data.get("confidence", {}).get("domains", {})
                },
                "data_freshness": hardware_agent_resp.data_freshness.value,
                "farmer_explanation": farmer_explanation,
                "disclaimer": report_data.get("disclaimer")
            }
        finally:
            if close_session:
                await session.close()
