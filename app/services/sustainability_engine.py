import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.sustainability import (
    CarbonCreditAssessment,
    CarbonEstimateStatus,
    CarbonFootprintAnalysis,
    CarbonSequestrationAnalysis,
    ClimateResilienceAnalysis,
    ComponentWeight,
    CreditEligibilityStatus,
    CropInput,
    CropRotationSustainability,
    AgriculturalBiodiversityIndicator,
    DataLevel,
    IrrigationMethod,
    RiskLevel,
    SequestrationCategory,
    SoilCarbonAnalysis,
    SoilDegradationRiskAnalysis,
    SustainabilityInput,
    SustainabilityAnalysisResponse,
    WaterSustainabilityAnalysis
)
from app.config.sustainability_sources import (
    SUSTAINABILITY_SOURCES_CATALOG,
    EMISSION_FACTORS,
    MAHARASHTRA_CROP_WATER_REQUIREMENTS_M3_PER_HA,
    IRRIGATION_EFFICIENCY_BENCHMARKS,
    SOC_BENCHMARKS
)
from app.services.crop_history_service import get_crop_family

logger = logging.getLogger(__name__)


class SustainabilityEngine:
    """
    Production-grade, evidence-based scientific intelligence engine for Maharashtra agriculture.
    Calculates Soil Organic Carbon, Degradation Risk, Water Footprint, Agricultural Biodiversity,
    Carbon Emissions, Sequestration, and VM0042 Preliminary Credit Eligibility.
    """

    def __init__(self) -> None:
        self.sources = SUSTAINABILITY_SOURCES_CATALOG

    # -------------------------------------------------------------------------
    # 1. Soil Organic Carbon (SOC) Intelligence
    # -------------------------------------------------------------------------
    def evaluate_soil_organic_carbon(self, soil: Any, district: str) -> SoilCarbonAnalysis:
        source = self.sources.get("ICAR_NBSS_LUP", self.sources["MPKV_RAHURI"])
        
        current_oc = getattr(soil, "organic_carbon_pct", None)
        prev_oc = getattr(soil, "previous_organic_carbon_pct", None)
        
        if current_oc is None:
            return SoilCarbonAnalysis(
                status="DATA_UNAVAILABLE",
                current_carbon_pct=None,
                previous_carbon_pct=None,
                absolute_change_pct=None,
                percentage_change=None,
                carbon_status="UNKNOWN",
                carbon_trend="UNKNOWN",
                benchmark_reference="ICAR-NBSS&LUP Vertisol / Inceptisol Standards",
                evidence=f"Soil organic carbon observation is unavailable for district {district}. Requires laboratory soil health card measurement.",
                confidence=0.40,
                source=source
            )
            
        # Classify SOC status based on NBSS&LUP Vertisol/Inceptisol ranges
        if current_oc < SOC_BENCHMARKS["LOW"]["max_pct"]:
            status_label = "LOW"
        elif current_oc <= SOC_BENCHMARKS["MEDIUM"]["max_pct"]:
            status_label = "MEDIUM"
        else:
            status_label = "HIGH"
            
        # Multi-temporal trend analysis
        abs_change = None
        pct_change = None
        trend = "INSUFFICIENT_OBSERVATIONS"
        confidence = 0.85
        
        if prev_oc is not None and prev_oc > 0:
            abs_change = round(current_oc - prev_oc, 3)
            pct_change = round((abs_change / prev_oc) * 100.0, 2)
            if abs_change >= 0.05:
                trend = "IMPROVING"
            elif abs_change <= -0.05:
                trend = "DECLINING"
            else:
                trend = "STABLE"
            confidence = 0.94
            evidence = (
                f"SOC measured at {current_oc:.2f}% ({status_label}). Multi-temporal shift from {prev_oc:.2f}% "
                f"({abs_change:+.2f}%, {pct_change:+.1f}%) indicates a {trend.lower()} organic carbon trajectory."
            )
        else:
            evidence = (
                f"Single observation: SOC at {current_oc:.2f}% ({status_label}). "
                f"Single measurement insufficient to calculate multi-year carbon trend."
            )

        return SoilCarbonAnalysis(
            status="AVAILABLE",
            current_carbon_pct=round(current_oc, 3),
            previous_carbon_pct=round(prev_oc, 3) if prev_oc is not None else None,
            absolute_change_pct=abs_change,
            percentage_change=pct_change,
            carbon_status=status_label,
            carbon_trend=trend,
            benchmark_reference="ICAR-NBSS&LUP Vertisol / Inceptisol Standards",
            evidence=evidence,
            confidence=confidence,
            source=source
        )

    # -------------------------------------------------------------------------
    # 2. Soil Degradation Risk Engine
    # -------------------------------------------------------------------------
    def evaluate_soil_degradation_risk(
        self,
        soil: Any,
        crop: Any,
        management: Any,
        climate: Any,
        district: str
    ) -> SoilDegradationRiskAnalysis:
        drivers: List[str] = []
        remediation: List[str] = []
        risk_score = 0.20  # Base natural baseline for semi-arid tropics
        data_points_present = 0
        
        ph = getattr(soil, "ph", None)
        oc = getattr(soil, "organic_carbon_pct", None)
        texture = (getattr(soil, "soil_texture", "") or "").lower()
        tillage = (getattr(management, "tillage_practice", "") or "").lower()
        residue = (getattr(management, "residue_management", "") or "").lower()
        rainfall = getattr(climate, "rainfall_mm", None)
        crop_history = getattr(crop, "crop_rotation_history", []) or []
        current_crop = getattr(crop, "current_crop", None)
        
        # pH Extremes
        if ph is not None:
            data_points_present += 1
            if ph < 5.5:
                risk_score += 0.20
                drivers.append(f"Soil acidification (pH {ph:.1f} < 5.5) causing nutrient fixation")
                remediation.append("Apply agricultural lime / dolomite and organic compost to raise pH")
            elif ph > 8.3:
                risk_score += 0.18
                drivers.append(f"Alkalinity / sodicity risk (pH {ph:.1f} > 8.3) in black cotton Vertisols")
                remediation.append("Apply agricultural gypsum and green manuring (Dhaincha/Sunhemp) to buffer sodicity")
                
        # Organic carbon depletion
        if oc is not None:
            data_points_present += 1
            if oc < 0.50:
                risk_score += 0.22
                drivers.append(f"Critically depleted organic carbon ({oc:.2f}% < 0.50%) impairing aggregate stability")
                remediation.append("Apply 5-8 tonnes/ha farmyard manure (FYM) or enriched vermicompost")
            elif oc > 0.75:
                risk_score -= 0.10
                
        # Heavy rain erosion in vulnerable texture
        if rainfall is not None:
            data_points_present += 1
            if rainfall > 120.0:
                if "sandy" in texture or "red" in texture or "laterite" in texture:
                    risk_score += 0.18
                    drivers.append(f"High monsoon precipitation ({rainfall:.0f} mm) on light/laterite soil elevates sheet and rill erosion")
                    remediation.append("Implement contour bunding, vetiver grass hedgerows, and broad-bed furrowing")
                else:
                    risk_score += 0.08
                    drivers.append("Intense rainstorm runoff risk on heavy clay Vertisols")
                    
        # Monocropping repetition
        all_crops = list(crop_history)
        if current_crop:
            all_crops.append(current_crop)
        if len(all_crops) >= 3:
            data_points_present += 1
            unique_crops = set(c.lower().strip() for c in all_crops if c)
            if len(unique_crops) == 1:
                risk_score += 0.22
                drivers.append(f"Continuous monocropping of {all_crops[0]} depletes specific root-zone nutrient niches")
                remediation.append("Rotate with nitrogen-fixing pulses (Chickpea/Soybean/Tur) to break soil pathogen cycles")
                
        # Management practices: tillage & residue
        if "burn" in residue:
            data_points_present += 1
            risk_score += 0.18
            drivers.append("Crop residue burning destroys surface biological crust and microbial diversity")
            remediation.append("Incorporate crop residue using shredders/rotavator or apply as in-situ mulch")
        elif "incorporat" in residue or "mulch" in residue:
            data_points_present += 1
            risk_score -= 0.08
            
        if "zero" in tillage or "minimum" in tillage or "reduced" in tillage:
            data_points_present += 1
            risk_score -= 0.06
        elif "conventional" in tillage:
            data_points_present += 1
            risk_score += 0.05
            
        if data_points_present == 0:
            return SoilDegradationRiskAnalysis(
                soil_degradation_risk=None,
                risk_level=RiskLevel.UNKNOWN,
                drivers=["No measured soil or management data available to evaluate degradation risk."],
                evidence=f"Soil degradation assessment for {district} requires soil chemical properties or management records.",
                confidence=0.30,
                remediation_actions=["Conduct comprehensive soil test (NPK, pH, EC, SOC)."]
            )
            
        final_risk = min(max(risk_score, 0.05), 0.95)
        if final_risk > 0.55:
            level = RiskLevel.HIGH
        elif final_risk > 0.35:
            level = RiskLevel.MODERATE
        else:
            level = RiskLevel.LOW
            
        confidence = min(0.50 + (data_points_present * 0.08), 0.95)
        evidence = (
            f"Soil degradation index computed at {final_risk:.2f} ({level.value}). "
            f"Evaluated against {data_points_present} parameters across soil chemistry, crop sequence, and management."
        )

        return SoilDegradationRiskAnalysis(
            soil_degradation_risk=round(final_risk, 3),
            risk_level=level,
            drivers=drivers if drivers else ["Soil profile indicators within standard operational stability ranges."],
            evidence=evidence,
            confidence=round(confidence, 2),
            remediation_actions=remediation if remediation else ["Maintain continuous organic matter recycling and balanced NPK."]
        )

    # -------------------------------------------------------------------------
    # 3. Water Intelligence & Irrigation Analysis
    # -------------------------------------------------------------------------
    def evaluate_water_sustainability(
        self,
        water: Any,
        crop: Any,
        climate: Any,
        district: str
    ) -> WaterSustainabilityAnalysis:
        source = self.sources.get("MPKV_RAHURI", self.sources["MAHA_DEPT_AGRI"])
        
        current_crop = getattr(crop, "current_crop", None)
        crop_clean = (current_crop or "").lower().strip()
        irr_type = getattr(water, "irrigation_type", IrrigationMethod.UNKNOWN)
        if isinstance(irr_type, str):
            try:
                irr_type = IrrigationMethod(irr_type.lower())
            except ValueError:
                irr_type = IrrigationMethod.UNKNOWN
                
        water_qty_m3 = getattr(water, "irrigation_quantity_m3", None)
        rainfall_mm = getattr(climate, "rainfall_mm", None)
        crop_yield_q = getattr(crop, "yield_quintals_per_acre", None)
        
        # Benchmark CWR lookup for Maharashtra
        cwr_data = MAHARASHTRA_CROP_WATER_REQUIREMENTS_M3_PER_HA.get(
            crop_clean,
            {"optimal_m3_ha": 5000.0, "critical_min_m3_ha": 3500.0, "water_intensity": "MODERATE"}
        )
        cwr_optimal = cwr_data["optimal_m3_ha"]
        
        # Efficiency benchmark lookup
        eff_meta = IRRIGATION_EFFICIENCY_BENCHMARKS.get(irr_type.value, IRRIGATION_EFFICIENCY_BENCHMARKS["unknown"])
        eff_pct = eff_meta["efficiency_pct"]
        
        # If water quantity is unavailable, do NOT invent a number
        if water_qty_m3 is None and rainfall_mm is None:
            return WaterSustainabilityAnalysis(
                status="DATA_UNAVAILABLE",
                irrigation_method=irr_type,
                water_used_m3_per_ha=None,
                crop_water_requirement_m3_per_ha=cwr_optimal if current_crop else None,
                water_productivity_kg_per_m3=None,
                water_efficiency_pct=eff_pct if irr_type != IrrigationMethod.UNKNOWN else None,
                water_stress_level=RiskLevel.UNKNOWN,
                data_level_used=DataLevel.DISTRICT,
                efficiency_benchmark_source=eff_meta["source"],
                evidence=f"Water consumption records unavailable for {district}. Irrigation efficiency is based on standard {irr_type.value} method benchmarks.",
                confidence=0.45,
                savings_opportunity="Deploying micro-irrigation (drip) can reduce water application volume by 30-45% compared to surface flood irrigation.",
                source=source
            )
            
        # Calculate water used (m3/ha)
        # 1 mm of rain = 10 m3/ha
        effective_rain_m3 = (rainfall_mm * 10.0 * 0.70) if rainfall_mm is not None else 0.0
        applied_irr_m3 = water_qty_m3 if water_qty_m3 is not None else 0.0
        total_water_used_m3_ha = applied_irr_m3 + effective_rain_m3
        
        # Calculate Water Productivity (kg/m3) if yield is available (1 quintal = 100 kg, 1 acre = 0.404686 ha)
        water_productivity = None
        if crop_yield_q is not None and total_water_used_m3_ha > 0:
            yield_kg_per_ha = (crop_yield_q * 100.0) / 0.404686
            water_productivity = round(yield_kg_per_ha / total_water_used_m3_ha, 3)
            
        # Water stress analysis
        if total_water_used_m3_ha < cwr_data["critical_min_m3_ha"]:
            stress = RiskLevel.HIGH
        elif total_water_used_m3_ha < cwr_optimal:
            stress = RiskLevel.MODERATE
        else:
            stress = RiskLevel.LOW
            
        savings_text = None
        if irr_type in [IrrigationMethod.FLOOD, IrrigationMethod.FURROW]:
            savings_pct = round(100.0 * (1.0 - (42.0 / 88.0)), 0)
            savings_text = f"Switching from {irr_type.value} to drip irrigation can save up to {savings_pct:.0f}% water volume (MPKV Rahuri trial data)."
            
        evidence = (
            f"Total water applied: {total_water_used_m3_ha:.0f} m³/ha against optimal crop water requirement of {cwr_optimal:.0f} m³/ha "
            f"for {current_crop or 'crop'} in {district}. Method: {irr_type.value} ({eff_pct:.0f}% benchmark application efficiency)."
        )

        return WaterSustainabilityAnalysis(
            status="AVAILABLE",
            irrigation_method=irr_type,
            water_used_m3_per_ha=round(total_water_used_m3_ha, 1),
            crop_water_requirement_m3_per_ha=cwr_optimal,
            water_productivity_kg_per_m3=water_productivity,
            water_efficiency_pct=eff_pct,
            water_stress_level=stress,
            data_level_used=DataLevel.DISTRICT,
            efficiency_benchmark_source=eff_meta["source"],
            evidence=evidence,
            confidence=0.88 if water_qty_m3 is not None else 0.72,
            savings_opportunity=savings_text,
            source=source
        )

    # -------------------------------------------------------------------------
    # 4. Crop Rotation & Agricultural Biodiversity
    # -------------------------------------------------------------------------
    def evaluate_crop_rotation_and_biodiversity(
        self,
        crop: Any,
        management: Any,
        district: str
    ) -> Tuple[CropRotationSustainability, AgriculturalBiodiversityIndicator]:
        history = getattr(crop, "crop_rotation_history", []) or []
        current = getattr(crop, "current_crop", None)
        all_crops = [c for c in history if c]
        if current:
            all_crops.append(current)
            
        cover_crop = getattr(management, "cover_crop_grown", False)
        
        if not all_crops:
            rot = CropRotationSustainability(
                rotation_score=None,
                rotation_sustainability_level="UNKNOWN",
                crop_diversity_shannon=None,
                crop_diversity_simpson=None,
                unique_botanical_families=0,
                repeated_crop_penalty=0.0,
                legume_inclusion=False,
                fallow_period_present=False,
                risk=RiskLevel.UNKNOWN,
                recommended_action="Maintain historical crop records for past 3 seasons to enable botanical rotation analysis.",
                confidence=0.35
            )
            bio = AgriculturalBiodiversityIndicator(
                indicator_score=None,
                crop_diversity_component=None,
                cover_crop_bonus=0.0,
                intercrop_bonus=0.0,
                perennial_strips_bonus=0.0,
                status="UNKNOWN",
                confidence=0.35
            )
            return rot, bio
            
        # Botanical family analysis
        families = [get_crop_family(c) for c in all_crops]
        unique_families = set(f for f in families if f not in ["Unknown", "Other"])
        has_legume = any(f == "Fabaceae" for f in families)
        has_fallow = any(f == "Fallow" or "fallow" in c.lower() for c, f in zip(all_crops, families))
        
        # Shannon & Simpson index
        from collections import Counter
        counts = Counter(c.lower().strip() for c in all_crops)
        n_total = len(all_crops)
        
        # Simpson: 1 - sum(p_i^2)
        simpson = 1.0 - sum((count / n_total) ** 2 for count in counts.values())
        # Shannon: - sum(p_i * ln(p_i))
        shannon = - sum((count / n_total) * math.log(count / n_total) for count in counts.values() if count > 0)
        
        # Base rotation score
        base_score = 65.0 + (simpson * 30.0)
        penalty = 0.0
        
        # Consecutive repetition penalty
        consecutive = 1
        for i in range(1, len(all_crops)):
            if all_crops[i].lower().strip() == all_crops[i - 1].lower().strip():
                consecutive += 1
            else:
                consecutive = 1
        if consecutive >= 3:
            penalty = 30.0
            base_score -= penalty
        elif consecutive == 2:
            penalty = 15.0
            base_score -= penalty
            
        if has_legume:
            base_score += 10.0
        if has_fallow:
            base_score += 5.0
            
        final_rot_score = min(max(base_score, 10.0), 100.0)
        if final_rot_score >= 75.0:
            level = "HIGH"
            risk = RiskLevel.LOW
            rec_action = "Maintain diverse multi-family crop rotation cycle."
        elif final_rot_score >= 50.0:
            level = "MODERATE"
            risk = RiskLevel.MODERATE
            rec_action = "Incorporate a nitrogen-fixing legume (Gram/Soybean/Tur) in the subsequent season."
        else:
            level = "LOW"
            risk = RiskLevel.HIGH
            rec_action = "Break consecutive cropping immediately with an unrelated botanical family or green manure crop."
            
        rot_result = CropRotationSustainability(
            rotation_score=round(final_rot_score, 1),
            rotation_sustainability_level=level,
            crop_diversity_shannon=round(shannon, 3),
            crop_diversity_simpson=round(simpson, 3),
            unique_botanical_families=len(unique_families),
            repeated_crop_penalty=penalty,
            legume_inclusion=has_legume,
            fallow_period_present=has_fallow,
            risk=risk,
            recommended_action=rec_action,
            confidence=0.88
        )
        
        # Agricultural Biodiversity Indicator (0-100)
        bio_base = simpson * 60.0 + (len(unique_families) * 10.0)
        cover_bonus = 15.0 if cover_crop else 0.0
        intercrop_bonus = 10.0 if any(word in (current or "").lower() for word in ["intercrop", "border", "companion"]) else 0.0
        
        bio_total = min(max(bio_base + cover_bonus + intercrop_bonus, 15.0), 100.0)
        bio_status = "DIVERSIFIED" if bio_total >= 70.0 else "MODERATE" if bio_total >= 45.0 else "MONOCULTURE_DOMINANT"
        
        bio_result = AgriculturalBiodiversityIndicator(
            indicator_score=round(bio_total, 1),
            label="Agricultural biodiversity indicator",
            crop_diversity_component=round(bio_base, 1),
            cover_crop_bonus=cover_bonus,
            intercrop_bonus=intercrop_bonus,
            perennial_strips_bonus=0.0,
            status=bio_status,
            confidence=0.85
        )

        return rot_result, bio_result

    # -------------------------------------------------------------------------
    # 5. Carbon Footprint (GHG Emissions) Framework
    # -------------------------------------------------------------------------
    def evaluate_carbon_footprint(
        self,
        management: Any,
        water: Any,
        district: str
    ) -> CarbonFootprintAnalysis:
        source = self.sources.get("IPCC_TIER1_2019", self.sources["CEA_INDIA_2023"])
        
        n_kg = getattr(management, "nitrogen_applied_kg", None)
        p_kg = getattr(management, "phosphorus_applied_kg", None)
        k_kg = getattr(management, "potassium_applied_kg", None)
        diesel_l = getattr(management, "diesel_used_litres", None)
        elec_kwh = getattr(management, "electricity_used_kwh", None)
        residue = (getattr(management, "residue_management", "") or "").lower()
        
        components: Dict[str, float] = {}
        factors_meta: List[Dict[str, Any]] = []
        
        # Check if critical data is completely missing
        if n_kg is None and p_kg is None and diesel_l is None and elec_kwh is None:
            return CarbonFootprintAnalysis(
                status=CarbonEstimateStatus.CARBON_ESTIMATE_INCOMPLETE,
                estimated_emissions_kg_co2e_per_ha=None,
                estimated_emissions_t_co2e_per_acre=None,
                unit="kg CO2e / ha / year",
                components_breakdown={},
                emission_factors_used=[],
                uncertainty_range_pct=50.0,
                confidence=0.30,
                evidence=f"Fertilizer, fuel, and electricity consumption data unavailable for {district}. Cannot compute certified GHG emission baseline.",
                source=source
            )
            
        total_kg_co2e = 0.0
        
        # Fertilizer N
        if n_kg is not None:
            ef_n = EMISSION_FACTORS["nitrogen_synthetic_kg_co2e_per_kg_n"]["factor"]
            co2_n = n_kg * ef_n
            components["synthetic_nitrogen_emissions_kg_co2e"] = round(co2_n, 2)
            total_kg_co2e += co2_n
            factors_meta.append(EMISSION_FACTORS["nitrogen_synthetic_kg_co2e_per_kg_n"])
            
        # Fertilizer P2O5
        if p_kg is not None:
            ef_p = EMISSION_FACTORS["phosphorus_synthetic_kg_co2e_per_kg_p2o5"]["factor"]
            co2_p = p_kg * ef_p
            components["synthetic_phosphorus_emissions_kg_co2e"] = round(co2_p, 2)
            total_kg_co2e += co2_p
            factors_meta.append(EMISSION_FACTORS["phosphorus_synthetic_kg_co2e_per_kg_p2o5"])
            
        # Fertilizer K2O
        if k_kg is not None:
            ef_k = EMISSION_FACTORS["potassium_synthetic_kg_co2e_per_kg_k2o"]["factor"]
            co2_k = k_kg * ef_k
            components["synthetic_potassium_emissions_kg_co2e"] = round(co2_k, 2)
            total_kg_co2e += co2_k
            factors_meta.append(EMISSION_FACTORS["potassium_synthetic_kg_co2e_per_kg_k2o"])
            
        # Diesel consumption
        if diesel_l is not None:
            ef_d = EMISSION_FACTORS["diesel_kg_co2e_per_litre"]["factor"]
            co2_d = diesel_l * ef_d
            components["diesel_combustion_kg_co2e"] = round(co2_d, 2)
            total_kg_co2e += co2_d
            factors_meta.append(EMISSION_FACTORS["diesel_kg_co2e_per_litre"])
            
        # Grid electricity for irrigation
        if elec_kwh is not None:
            ef_el = EMISSION_FACTORS["grid_electricity_kg_co2e_per_kwh"]["factor"]
            co2_el = elec_kwh * ef_el
            components["grid_electricity_kg_co2e"] = round(co2_el, 2)
            total_kg_co2e += co2_el
            factors_meta.append(EMISSION_FACTORS["grid_electricity_kg_co2e_per_kwh"])
            
        # Residue burning penalty
        if "burn" in residue:
            # Estimate 2.5 t residue/ha burned = 2500 kg * 1.46 = 3650 kg CO2e
            ef_rb = EMISSION_FACTORS["residue_burning_kg_co2e_per_kg_dry_matter"]["factor"]
            co2_rb = 2500.0 * ef_rb
            components["residue_burning_emissions_kg_co2e"] = round(co2_rb, 2)
            total_kg_co2e += co2_rb
            factors_meta.append(EMISSION_FACTORS["residue_burning_kg_co2e_per_kg_dry_matter"])
            
        status = CarbonEstimateStatus.COMPLETE if (n_kg is not None and diesel_l is not None) else CarbonEstimateStatus.PARTIAL
        t_co2e_per_acre = round((total_kg_co2e / 1000.0) * 0.404686, 3)
        confidence = 0.90 if status == CarbonEstimateStatus.COMPLETE else 0.75
        
        evidence = (
            f"Estimated GHG emissions: {total_kg_co2e:.1f} kg CO2e/ha/yr ({t_co2e_per_acre:.3f} tCO2e/acre). "
            f"Calculated via IPCC Tier 1 and CEA grid emission factors based on {len(components)} tracked farm input streams."
        )

        return CarbonFootprintAnalysis(
            status=status,
            estimated_emissions_kg_co2e_per_ha=round(total_kg_co2e, 2),
            estimated_emissions_t_co2e_per_acre=t_co2e_per_acre,
            unit="kg CO2e / ha / year",
            components_breakdown=components,
            emission_factors_used=factors_meta,
            uncertainty_range_pct=15.0 if status == CarbonEstimateStatus.COMPLETE else 25.0,
            confidence=confidence,
            evidence=evidence,
            source=source
        )

    # -------------------------------------------------------------------------
    # 6. Carbon Sequestration Framework
    # -------------------------------------------------------------------------
    def evaluate_carbon_sequestration(
        self,
        soil: Any,
        management: Any,
        district: str
    ) -> CarbonSequestrationAnalysis:
        source = self.sources.get("ICAR_NBSS_LUP", self.sources["MPKV_RAHURI"])
        
        fym_tonnes = getattr(management, "organic_manure_tonnes", None) or 0.0
        compost_tonnes = getattr(management, "compost_tonnes", None) or 0.0
        cover_crop = getattr(management, "cover_crop_grown", False)
        tillage = (getattr(management, "tillage_practice", "") or "").lower()
        residue = (getattr(management, "residue_management", "") or "").lower()
        
        # Check if actual multi-year measured soil carbon data exists
        current_oc = getattr(soil, "organic_carbon_pct", None)
        prev_oc = getattr(soil, "previous_organic_carbon_pct", None)
        
        if prev_oc is not None and current_oc is not None and prev_oc > 0:
            # Measured Delta SOC:
            # Soil bulk density ~1.35 g/cm3 for Vertisol, 0-30 cm depth = 4050 tonnes soil/ha
            # 1% SOC change = 40.5 tonnes C/ha = 40.5 * 3.67 = 148.6 t CO2e/ha over measurement window
            delta_c = current_oc - prev_oc
            if delta_c > 0:
                # Assume 3-year interval default
                annual_t_co2e_ha = round((delta_c * 40.5 * 3.67) / 3.0, 3)
                return CarbonSequestrationAnalysis(
                    status=SequestrationCategory.MEASURED,
                    sequestration_rate_t_co2e_per_ha_yr=annual_t_co2e_ha,
                    sequestration_rate_t_co2e_per_acre_yr=round(annual_t_co2e_ha * 0.404686, 3),
                    mechanism="Measured increase in topsoil Organic Carbon pool (0-30 cm)",
                    scientific_methodology="Direct Walkley-Black SOC multi-temporal soil test comparison (ICAR-NBSS&LUP protocol)",
                    confidence=0.92,
                    evidence=f"Measured SOC increase of {delta_c:+.2f}% converts to ~{annual_t_co2e_ha:.2f} tCO2e/ha/yr sequestered.",
                    source=source
                )
                
        # Modeled sequestration based on management practices
        modeled_t_c_ha_yr = 0.0
        mechanisms: List[str] = []
        
        if fym_tonnes > 0 or compost_tonnes > 0:
            total_org = fym_tonnes + compost_tonnes
            # Research benchmark (MPKV / ICAR): 5 t FYM/ha/yr ~ 0.20 t C/ha/yr sequestered in semi-arid soil
            acc = min(total_org * 0.04, 0.40)
            modeled_t_c_ha_yr += acc
            mechanisms.append(f"Organic manure addition ({total_org:.1f} t)")
            
        if "zero" in tillage or "minimum" in tillage:
            modeled_t_c_ha_yr += 0.15
            mechanisms.append("Conservation tillage / undisturbed root channels")
            
        if "incorporat" in residue or "mulch" in residue:
            modeled_t_c_ha_yr += 0.12
            mechanisms.append("In-situ residue retention and mulching")
            
        if cover_crop:
            modeled_t_c_ha_yr += 0.10
            mechanisms.append("Cover cropping biomass input")
            
        if modeled_t_c_ha_yr > 0:
            # Convert C to CO2e (multiply by 44/12 = 3.667)
            modeled_t_co2e_ha_yr = round(modeled_t_c_ha_yr * 3.667, 3)
            return CarbonSequestrationAnalysis(
                status=SequestrationCategory.MODELLED,
                sequestration_rate_t_co2e_per_ha_yr=modeled_t_co2e_ha_yr,
                sequestration_rate_t_co2e_per_acre_yr=round(modeled_t_co2e_ha_yr * 0.404686, 3),
                mechanism=" + ".join(mechanisms),
                scientific_methodology="Empirical carbon accretion coefficients (MPKV Rahuri / ICAR-CRIDA Conservation Agriculture model)",
                confidence=0.78,
                evidence=f"Modeled accretion rate of ~{modeled_t_co2e_ha_yr:.2f} tCO2e/ha/yr ({modeled_t_co2e_ha_yr * 0.404686:.2f} tCO2e/ac/yr) based on conservation management practices.",
                source=source
            )
            
        return CarbonSequestrationAnalysis(
            status=SequestrationCategory.UNAVAILABLE,
            sequestration_rate_t_co2e_per_ha_yr=0.0,
            sequestration_rate_t_co2e_per_acre_yr=0.0,
            mechanism="None detected or conventional intensive practices without organic additions",
            scientific_methodology="Standard baseline (No active sequestration practices documented)",
            confidence=0.80,
            evidence="No measurable or modeled carbon sequestration detected under current baseline management.",
            source=source
        )

    # -------------------------------------------------------------------------
    # 7. Carbon Credit Eligibility Check (Verra VM0042 Aligned)
    # -------------------------------------------------------------------------
    def evaluate_carbon_credit_eligibility(
        self,
        carbon_footprint: CarbonFootprintAnalysis,
        sequestration: CarbonSequestrationAnalysis,
        management: Any
    ) -> CarbonCreditAssessment:
        required_missing: List[str] = []
        
        # Check additionality & baseline requirement
        required_missing.append("Georeferenced baseline soil core sampling (0-30 cm & 30-60 cm depth) conducted by accredited laboratory")
        required_missing.append("Third-party VVB (Validation and Verification Body) audit against Verra VM0042 standards")
        required_missing.append("Documented 20-30 year legal permanence commitment against soil disturbance / reversal")
        required_missing.append("Historical 5-year farm management and input application ledger to prove regulatory additionality")
        
        if sequestration.status in [SequestrationCategory.MEASURED, SequestrationCategory.MODELLED] and sequestration.sequestration_rate_t_co2e_per_ha_yr and sequestration.sequestration_rate_t_co2e_per_ha_yr > 0:
            status = CreditEligibilityStatus.PRELIMINARY_ONLY
            confidence = 0.70
            verif_text = "Farm exhibits potential agronomic eligibility due to active soil carbon conservation practices. Requires baseline soil core sampling and formal MRV registration."
        else:
            status = CreditEligibilityStatus.NOT_ELIGIBLE
            confidence = 0.85
            verif_text = "Current practices do not meet minimum soil organic carbon accretion thresholds required for agricultural carbon credit generation."

        return CarbonCreditAssessment(
            potential_eligibility=status,
            methodology="Verra VM0042 (Methodology for Improved Agricultural Land Management)",
            tradable_credits_claimed=0.0,  # CRITICAL: STRICTLY 0.0 CLAIMED
            required_data_for_verification=required_missing,
            verification_requirement=verif_text,
            confidence=confidence,
            disclaimer="PRELIMINARY ASSESSMENT ONLY. No tradable carbon credits are claimed, generated, or guaranteed without accredited registry issuance."
        )

    # -------------------------------------------------------------------------
    # 8. Climate Resilience (CMIP6 Integration)
    # -------------------------------------------------------------------------
    def evaluate_climate_resilience(self, climate: Any, district: str) -> ClimateResilienceAnalysis:
        source = self.sources.get("CMIP6_NASA_IMD", self.sources["MPKV_RAHURI"])
        
        scenario = getattr(climate, "scenario", "ssp245") or "ssp245"
        period = getattr(climate, "projection_period", "2030") or "2030"
        temp_c = getattr(climate, "temperature_c", None)
        rain_mm = getattr(climate, "rainfall_mm", None)
        
        # Representative Maharashtra CMIP6 downscaled benchmarks
        # Vidarbha / Marathwada: Higher heat risk & dry spell variability
        # Western Maharashtra: Moderate heat risk, precipitation intensity spikes
        # Konkan: High extreme rainfall burst risk
        district_norm = district.strip().title()
        
        is_konkan = district_norm in ["Ratnagiri", "Sindhudurg", "Raigad", "Thane", "Palghar"]
        is_vidarbha = district_norm in ["Nagpur", "Amravati", "Akola", "Yavatmal", "Wardha", "Buldhana", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli"]
        is_marathwada = district_norm in ["Chhatrapati Sambhajinagar", "Aurangabad", "Nanded", "Latur", "Beed", "Dharashiv", "Osmanabad", "Jalna", "Parbhani", "Hingoli"]
        
        if is_vidarbha or is_marathwada:
            heat_risk = RiskLevel.HIGH if scenario == "ssp585" else RiskLevel.MODERATE
            drought_risk = RiskLevel.HIGH
            rain_risk = RiskLevel.MODERATE
            temp_anom = 1.45 if period == "2050" else 0.95
            precip_anom = -4.5 if period == "2050" else 2.1
            adaptations = [
                "Adopt drought-tolerant short-duration cultivars (Soybean JS-9305, Chickpea Vijay)",
                "Construct farm ponds (Shettale) for critical life-saving supplemental irrigation",
                "Broad Bed Furrow (BBF) planting to conserve in-situ soil moisture"
            ]
        elif is_konkan:
            heat_risk = RiskLevel.LOW
            drought_risk = RiskLevel.LOW
            rain_risk = RiskLevel.HIGH
            temp_anom = 1.10 if period == "2050" else 0.75
            precip_anom = 12.5 if period == "2050" else 6.8
            adaptations = [
                "Strengthen coastal bunds and terraced paddy drainage channels against extreme monsoon bursts",
                "Plant salinity-tolerant coastal rice varieties (KJT-1, Panvel-2) in low-lying tracts",
                "Maintain agroforestry strips with cashew and mango on hill slopes to prevent landslides"
            ]
        else:  # Western Maharashtra (Pune, Nashik, Kolhapur, Solapur, Ahmednagar, Sangli, Satara)
            heat_risk = RiskLevel.MODERATE
            drought_risk = RiskLevel.MODERATE if district_norm in ["Solapur", "Ahmednagar", "Ahilyanagar"] else RiskLevel.LOW
            rain_risk = RiskLevel.MODERATE
            temp_anom = 1.25 if period == "2050" else 0.85
            precip_anom = 4.2 if period == "2050" else 3.0
            adaptations = [
                "Implement precision micro-irrigation to counter evaporative demand spikes",
                "Deploy shade-net or straw mulching during hot summer vegetative stages for vegetable crops",
                "Shift sugarcane planting windows to align with seasonal reservoir allocations"
            ]

        return ClimateResilienceAnalysis(
            status="AVAILABLE",
            district=district,
            cmip6_scenario=scenario.upper(),
            projection_period=period,
            temp_anomaly_c=round(temp_anom, 2),
            precip_anomaly_pct=round(precip_anom, 1),
            heat_stress_risk=heat_risk,
            drought_risk=drought_risk,
            excess_rainfall_risk=rain_risk,
            adaptation_priorities=adaptations,
            confidence=0.88,
            source=source
        )

    # -------------------------------------------------------------------------
    # 9. Composite Sustainability Score & Engine Synthesis
    # -------------------------------------------------------------------------
    def analyze(self, inputs: SustainabilityInput) -> SustainabilityAnalysisResponse:
        import uuid
        analysis_id = str(uuid.uuid4())
        
        farm_loc = inputs.farm or FarmLocationInput()
        soil_in = inputs.soil or SoilInput()
        crop_in = inputs.crop or CropInput()
        water_in = inputs.water or WaterInput()
        mgmt_in = inputs.management or FarmManagementInput()
        clim_in = inputs.climate or ClimateInput()
        sat_in = inputs.satellite or SatelliteInput()
        
        district = farm_loc.district or "Pune"
        state = farm_loc.state or "Maharashtra"
        
        # Administrative granularity determination
        if farm_loc.village:
            data_level = DataLevel.VILLAGE
            level_reason = f"Validated farm and village data available for {farm_loc.village}."
        elif farm_loc.taluka:
            data_level = DataLevel.TALUKA
            level_reason = f"Taluka level resolution used for {farm_loc.taluka}, {district}."
        elif district:
            data_level = DataLevel.DISTRICT
            level_reason = f"District level statistical baseline applied for {district}, {state}."
        else:
            data_level = DataLevel.STATE
            level_reason = "State level agricultural baseline applied."

        # Execute component engines
        soc_analysis = self.evaluate_soil_organic_carbon(soil_in, district)
        degrad_analysis = self.evaluate_soil_degradation_risk(soil_in, crop_in, mgmt_in, clim_in, district)
        water_analysis = self.evaluate_water_sustainability(water_in, crop_in, clim_in, district)
        rot_analysis, bio_analysis = self.evaluate_crop_rotation_and_biodiversity(crop_in, mgmt_in, district)
        carbon_footprint = self.evaluate_carbon_footprint(mgmt_in, water_in, district)
        carbon_seq = self.evaluate_carbon_sequestration(soil_in, mgmt_in, district)
        carbon_credits = self.evaluate_carbon_credit_eligibility(carbon_footprint, carbon_seq, mgmt_in)
        climate_res = self.evaluate_climate_resilience(clim_in, district)

        # Composite Scoring
        # Default Weights: Soil 25%, Water 20%, Rotation 20%, Carbon 15%, Climate 10%, Biodiversity 10%
        component_weights: List[ComponentWeight] = []
        weighted_sum = 0.0
        total_active_weight = 0.0
        data_quality_points = 0
        total_possible_points = 6
        
        # 1. Soil Health Component
        if soc_analysis.status == "AVAILABLE" and degrad_analysis.soil_degradation_risk is not None:
            # Higher SOC and lower degradation = higher score
            soc_val = soc_analysis.current_carbon_pct or 0.6
            soc_score = min(max((soc_val / 1.0) * 100.0, 20.0), 100.0)
            degrad_score = (1.0 - degrad_analysis.soil_degradation_risk) * 100.0
            soil_comp_score = (soc_score * 0.5) + (degrad_score * 0.5)
            
            w = 25.0
            weighted_sum += soil_comp_score * w
            total_active_weight += w
            data_quality_points += 1
            component_weights.append(ComponentWeight(component="Soil Health & Carbon", weight_pct=w, available=True, reason="Measured SOC and multi-factor soil degradation index."))
        else:
            component_weights.append(ComponentWeight(component="Soil Health & Carbon", weight_pct=25.0, available=False, reason="Missing laboratory soil test or degradation records."))

        # 2. Water Sustainability Component
        if water_analysis.status == "AVAILABLE" and water_analysis.water_efficiency_pct is not None:
            w = 20.0
            weighted_sum += water_analysis.water_efficiency_pct * w
            total_active_weight += w
            data_quality_points += 1
            component_weights.append(ComponentWeight(component="Water Sustainability", weight_pct=w, available=True, reason="Evaluated application volume, crop ETc, and irrigation method efficiency."))
        elif water_analysis.water_efficiency_pct is not None:
            # Partial: method benchmark available
            w = 10.0
            weighted_sum += water_analysis.water_efficiency_pct * w
            total_active_weight += w
            data_quality_points += 0.5
            component_weights.append(ComponentWeight(component="Water Sustainability", weight_pct=w, available=True, reason="Method benchmark efficiency available without absolute volumetric meter logs."))
        else:
            component_weights.append(ComponentWeight(component="Water Sustainability", weight_pct=20.0, available=False, reason="Missing irrigation method and water volume data."))

        # 3. Crop Rotation Component
        if rot_analysis.rotation_score is not None:
            w = 20.0
            weighted_sum += rot_analysis.rotation_score * w
            total_active_weight += w
            data_quality_points += 1
            component_weights.append(ComponentWeight(component="Crop Rotation Cycle", weight_pct=w, available=True, reason="Simpson diversity and botanical family succession index."))
        else:
            component_weights.append(ComponentWeight(component="Crop Rotation Cycle", weight_pct=20.0, available=False, reason="Missing multi-season crop history records."))

        # 4. Carbon Balance Component
        if carbon_footprint.status != CarbonEstimateStatus.CARBON_ESTIMATE_INCOMPLETE:
            # Baseline net score: higher sequestration and lower emissions intensity = higher score
            emiss_t_ac = carbon_footprint.estimated_emissions_t_co2e_per_acre or 1.0
            seq_t_ac = carbon_seq.sequestration_rate_t_co2e_per_acre_yr or 0.0
            carbon_score = min(max(70.0 + (seq_t_ac * 20.0) - (emiss_t_ac * 15.0), 10.0), 100.0)
            
            w = 15.0
            weighted_sum += carbon_score * w
            total_active_weight += w
            data_quality_points += 1
            component_weights.append(ComponentWeight(component="Carbon Balance", weight_pct=w, available=True, reason="IPCC Tier 1 emissions and modeled SOC accretion."))
        else:
            component_weights.append(ComponentWeight(component="Carbon Balance", weight_pct=15.0, available=False, reason="Missing fertilizer, diesel, or energy logs."))

        # 5. Climate Resilience Component
        clim_score = 75.0
        if climate_res.heat_stress_risk == RiskLevel.HIGH or climate_res.drought_risk == RiskLevel.HIGH:
            clim_score -= 20.0
        elif climate_res.heat_stress_risk == RiskLevel.LOW and climate_res.drought_risk == RiskLevel.LOW:
            clim_score += 15.0
        w = 10.0
        weighted_sum += clim_score * w
        total_active_weight += w
        data_quality_points += 1
        component_weights.append(ComponentWeight(component="Climate Resilience", weight_pct=w, available=True, reason="CMIP6 downscaled regional projections for Maharashtra."))

        # 6. Biodiversity Component
        if bio_analysis.indicator_score is not None:
            w = 10.0
            weighted_sum += bio_analysis.indicator_score * w
            total_active_weight += w
            data_quality_points += 1
            component_weights.append(ComponentWeight(component="Agricultural Biodiversity", weight_pct=w, available=True, reason="Cropping diversity and companion/cover crop presence."))
        else:
            component_weights.append(ComponentWeight(component="Agricultural Biodiversity", weight_pct=10.0, available=False, reason="Missing cropping diversity records."))

        # Composite score calculation
        if total_active_weight >= 40.0:
            final_composite_score = round(weighted_sum / total_active_weight, 1)
            if final_composite_score >= 80.0:
                rating = "EXCELLENT"
            elif final_composite_score >= 65.0:
                rating = "GOOD"
            elif final_composite_score >= 50.0:
                rating = "MODERATE"
            else:
                rating = "VULNERABLE"
        else:
            final_composite_score = None
            rating = "UNAVAILABLE"

        # Data Quality & Confidence
        data_quality_pct = round((data_quality_points / total_possible_points) * 100.0, 1)
        conf_sum = (
            soc_analysis.confidence +
            degrad_analysis.confidence +
            water_analysis.confidence +
            rot_analysis.confidence +
            carbon_footprint.confidence +
            climate_res.confidence
        )
        score_confidence_pct = round((conf_sum / 6.0) * (data_quality_pct / 100.0) * 100.0, 1)

        # Collect unique sources
        data_sources_list = [
            soc_analysis.source,
            water_analysis.source,
            carbon_footprint.source,
            carbon_seq.source,
            climate_res.source
        ]

        # Natural Language Advisories (English and Tamil)
        en_advisory = (
            f"🌱 Maharashtra Sustainability Assessment ({district}): "
            f"Overall score is {f'{final_composite_score}/100 ({rating})' if final_composite_score else 'Unavailable (insufficient data)'}. "
            f"Soil Organic Carbon status: {soc_analysis.carbon_status} ({soc_analysis.current_carbon_pct if soc_analysis.current_carbon_pct is not None else 'N/A'}%). "
            f"Water application method: {water_analysis.irrigation_method.value} with {water_analysis.water_efficiency_pct or 'N/A'}% benchmark efficiency. "
            f"Carbon footprint: {f'{carbon_footprint.estimated_emissions_kg_co2e_per_ha:.0f} kg CO2e/ha' if carbon_footprint.estimated_emissions_kg_co2e_per_ha else 'Incomplete input'}. "
            f"Carbon credit status: {carbon_credits.potential_eligibility.value} (No tradable credits claimed). "
            f"Confidence: {score_confidence_pct}%."
        )

        ta_advisory = (
            f"🌱 மகாராஷ்டிரா நிலைத்தன்மை மற்றும் கார்பன் மதிப்பீடு ({district}): "
            f"ஒட்டுமொத்த நிலைத்தன்மை மதிப்பீடு: {f'{final_composite_score}/100' if final_composite_score else 'தரவு கிடைக்கவில்லை'}. "
            f"மண் கரிமக் கார்பன்: {soc_analysis.carbon_status}. "
            f"பாசன முறை: {water_analysis.irrigation_method.value} (திறன்: {water_analysis.water_efficiency_pct or 'N/A'}%). "
            f"கார்பன் உமிழ்வு: {f'{carbon_footprint.estimated_emissions_kg_co2e_per_ha:.0f} kg CO2e/ha' if carbon_footprint.estimated_emissions_kg_co2e_per_ha else 'முழுமையடையாத தரவு'}. "
            f"கார்பன் வரவு நிலை: ஆரம்ப மதிப்பீடு மட்டுமே (வணிக கார்பன் கிரெடிட் கோரப்படவில்லை). "
            f"நம்பகத்தன்மை: {score_confidence_pct}%."
        )

        from datetime import date
        today_str = date.today().strftime("%Y-%m-%d")
        freshness = {
            "soil_observation": getattr(soil_in, "soil_test_date", None) or "Latest laboratory record",
            "satellite_observation": getattr(sat_in, "observation_date", None) or today_str,
            "weather_update": today_str,
            "cultivation_dataset_period": "2023-2024 (Maharashtra DES)",
            "climate_model_period": f"CMIP6 {clim_in.projection_period or '2030'} Projection"
        }

        return SustainabilityAnalysisResponse(
            analysis_id=analysis_id,
            farm_id=farm_loc.farm_id,
            state=state,
            district=district,
            data_level_used=data_level,
            data_level_reason=level_reason,
            sustainability_score=final_composite_score,
            sustainability_rating=rating,
            score_confidence_pct=score_confidence_pct,
            data_quality_score_pct=data_quality_pct,
            score_weights=component_weights,
            soil_carbon=soc_analysis,
            soil_degradation=degrad_analysis,
            water_sustainability=water_analysis,
            crop_rotation=rot_analysis,
            biodiversity=bio_analysis,
            carbon_footprint=carbon_footprint,
            carbon_sequestration=carbon_seq,
            carbon_credit_assessment=carbon_credits,
            climate_resilience=climate_res,
            data_sources=data_sources_list,
            english_advisory=en_advisory,
            tamil_advisory=ta_advisory,
            data_freshness=freshness,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
