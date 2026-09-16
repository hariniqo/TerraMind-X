from typing import Dict, List, Optional, Set, Tuple
from app.schemas.land_intelligence import (
    CropHistoryEntry,
    CropRotationAnalysis,
    OverCroppingRisk,
    RiskLevel
)

# Botanical Family Classification for Agronomic Rotation Checking
CROP_FAMILY_MAP: Dict[str, str] = {
    # Solanaceae (Nightshades - High pest carryover, bacterial wilt & nematode risk)
    "tomato": "Solanaceae",
    "chilli": "Solanaceae",
    "chili": "Solanaceae",
    "brinjal": "Solanaceae",
    "eggplant": "Solanaceae",
    "potato": "Solanaceae",
    "capsicum": "Solanaceae",

    # Fabaceae / Leguminosae (Nitrogen-fixing legumes - Soil restorers)
    "groundnut": "Fabaceae",
    "peanut": "Fabaceae",
    "soybean": "Fabaceae",
    "black gram": "Fabaceae",
    "green gram": "Fabaceae",
    "red gram": "Fabaceae",
    "pigeon pea": "Fabaceae",
    "chickpea": "Fabaceae",
    "cowpea": "Fabaceae",
    "lentil": "Fabaceae",

    # Poaceae / Gramineae (Cereals & Grasses - High biomass, heavy nitrogen consumers)
    "paddy": "Poaceae",
    "rice": "Poaceae",
    "maize": "Poaceae",
    "corn": "Poaceae",
    "sorghum": "Poaceae",
    "jowar": "Poaceae",
    "bajra": "Poaceae",
    "pearl millet": "Poaceae",
    "finger millet": "Poaceae",
    "ragi": "Poaceae",
    "sugarcane": "Poaceae",
    "wheat": "Poaceae",

    # Malvaceae
    "cotton": "Malvaceae",
    "okra": "Malvaceae",
    "bhendi": "Malvaceae",

    # Amaryllidaceae / Alliaceae
    "onion": "Amaryllidaceae",
    "garlic": "Amaryllidaceae",

    # Cucurbitaceae
    "watermelon": "Cucurbitaceae",
    "cucumber": "Cucurbitaceae",
    "pumpkin": "Cucurbitaceae",
    "bitter gourd": "Cucurbitaceae",

    # Fallow / Rest
    "fallow": "Fallow",
    "rest": "Fallow"
}

# Recommended rotational alternatives by family
ROTATIONAL_COMPLEMENTS: Dict[str, List[str]] = {
    "Solanaceae": ["Groundnut (Fabaceae)", "Millets (Poaceae)", "Black Gram (Fabaceae)", "Paddy (Poaceae)"],
    "Poaceae": ["Black Gram (Fabaceae)", "Groundnut (Fabaceae)", "Soybean (Fabaceae)", "Chilli (Solanaceae)"],
    "Malvaceae": ["Black Gram (Fabaceae)", "Groundnut (Fabaceae)", "Millets (Poaceae)"],
    "Fabaceae": ["Paddy (Poaceae)", "Tomato (Solanaceae)", "Millets (Poaceae)", "Cotton (Malvaceae)"],
    "Amaryllidaceae": ["Paddy (Poaceae)", "Groundnut (Fabaceae)", "Millets (Poaceae)"]
}


def get_crop_family(crop_name: str) -> str:
    if not crop_name:
        return "Unknown"
    norm = crop_name.lower().strip()
    return CROP_FAMILY_MAP.get(norm, "Other")


def calculate_rotation_analysis(history: List[CropHistoryEntry], intended_crop: Optional[str] = None) -> CropRotationAnalysis:
    """
    Analyzes historical crop sequence:
    - Calculates rotation diversity index (Simpson's diversity: 1 - sum(p_i^2))
    - Tracks consecutive repetitions and botanical family repetition
    - Rewards legume inclusion and rest/fallow periods
    """
    if not history:
        return CropRotationAnalysis(
            rotation_score=70.0,
            crop_diversity_index=0.0,
            total_seasons_recorded=0,
            unique_crops_count=0,
            repeated_crop_count=0,
            consecutive_crop_count=0,
            legume_in_rotation=False,
            fallow_period_present=False,
            risk_level=RiskLevel.MEDIUM,
            risk_reason="No previous crop history records found for this land parcel. Baseline score assigned.",
            confidence=0.50
        )

    # Sort chronological by year and season
    season_weights = {"Kharif": 1, "Rabi": 2, "Summer": 3, "Zaid": 3}
    sorted_history = sorted(
        history,
        key=lambda h: (h.year, season_weights.get(h.season, 1))
    )

    crop_names = [h.crop.strip() for h in sorted_history]
    if intended_crop:
        crop_names.append(intended_crop.strip())

    total_seasons = len(crop_names)
    unique_crops = set(c.lower() for c in crop_names)
    unique_count = len(unique_crops)

    # Crop counts and Simpson Diversity
    counts: Dict[str, int] = {}
    for c in crop_names:
        c_norm = c.lower()
        counts[c_norm] = counts.get(c_norm, 0) + 1

    simpson_sum = sum((cnt / total_seasons) ** 2 for cnt in counts.values())
    diversity_index = round(max(0.0, 1.0 - simpson_sum), 3)

    # Family checks
    families = [get_crop_family(c) for c in crop_names]
    has_legume = any(f == "Fabaceae" for f in families)
    has_fallow = any(f == "Fallow" for f in families) or any("fallow" in c.lower() for c in crop_names)

    # Consecutive repetition check
    max_consecutive = 1
    current_consecutive = 1
    for i in range(1, len(crop_names)):
        if crop_names[i].lower() == crop_names[i - 1].lower():
            current_consecutive += 1
            if current_consecutive > max_consecutive:
                max_consecutive = current_consecutive
        else:
            current_consecutive = 1

    # Base Score Calculation (0 - 100)
    # High diversity + legume = 90-100
    # Monoculture for 3+ seasons = 30-45
    base_score = 65.0 + (diversity_index * 30.0)

    if has_legume:
        base_score += 10.0
    if has_fallow:
        base_score += 5.0

    # Penalties for consecutive monocropping
    if max_consecutive == 2:
        base_score -= 15.0
    elif max_consecutive >= 3:
        base_score -= 30.0

    # Consecutive non-legume family penalty (e.g. Tomato after Chilli - high pest/pathogen carryover)
    consecutive_family = False
    for i in range(1, len(families)):
        if families[i] not in ["Other", "Fabaceae", "Fallow"] and families[i] == families[i - 1] and crop_names[i].lower() != crop_names[i - 1].lower():
            consecutive_family = True
            base_score -= 12.0
            break

    final_score = round(max(10.0, min(100.0, base_score)), 1)

    # Risk level determination
    if final_score >= 80.0:
        risk_level = RiskLevel.LOW
        reason = "Excellent crop rotation detected with strong botanical diversity and nitrogen restoration."
    elif final_score >= 60.0:
        risk_level = RiskLevel.MEDIUM
        reason = "Moderate crop rotation. Consider introducing a legume (e.g. Groundnut or Black Gram) in the next cycle."
    elif final_score >= 40.0:
        risk_level = RiskLevel.HIGH
        reason = f"Consecutive cultivation of same crop/family ({max_consecutive} seasons). Elevated soil fatigue and pest buildup risk."
    else:
        risk_level = RiskLevel.CRITICAL
        reason = f"Severe monocropping detected ({max_consecutive}+ consecutive seasons). Immediate crop rotation strongly recommended."

    return CropRotationAnalysis(
        rotation_score=final_score,
        crop_diversity_index=diversity_index,
        total_seasons_recorded=total_seasons,
        unique_crops_count=unique_count,
        repeated_crop_count=total_seasons - unique_count,
        consecutive_crop_count=max_consecutive if max_consecutive > 1 else 0,
        legume_in_rotation=has_legume,
        fallow_period_present=has_fallow,
        risk_level=risk_level,
        risk_reason=reason,
        confidence=min(1.0, 0.60 + (0.10 * min(total_seasons, 4)))
    )


def calculate_overcropping_risk(crop: str, history: List[CropHistoryEntry]) -> OverCroppingRisk:
    """
    Evaluates monocropping / over-cropping risk for a specific target crop on this land.
    """
    crop_norm = crop.lower().strip()
    family = get_crop_family(crop_norm)
    recs = ROTATIONAL_COMPLEMENTS.get(family, ["Groundnut (Fabaceae)", "Black Gram (Fabaceae)", "Millets (Poaceae)"])

    if not history:
        return OverCroppingRisk(
            crop=crop.capitalize(),
            frequency_in_history=0,
            consecutive_seasons=0,
            risk_level=RiskLevel.LOW,
            evidence=f"No prior records of {crop.capitalize()} on this plot.",
            botanical_family=family,
            recommended_rotation_crops=recs,
            confidence=0.60
        )

    # Count appearances and consecutive end streak
    occurrences = sum(1 for h in history if h.crop.lower().strip() == crop_norm)
    total_seasons = len(history)

    consecutive = 0
    for h in reversed(history):
        if h.crop.lower().strip() == crop_norm:
            consecutive += 1
        else:
            break

    if consecutive >= 3:
        risk_level = RiskLevel.HIGH
        evidence = f"{crop.capitalize()} has been cultivated for {consecutive} consecutive seasons ({occurrences}/{total_seasons} total). High risk of soil nutrient depletion and root pathogen accumulation."
    elif consecutive == 2:
        risk_level = RiskLevel.MEDIUM
        evidence = f"{crop.capitalize()} was cultivated in the previous 2 seasons. Consider rotating to a complementary family."
    elif occurrences >= 3 and total_seasons <= 4:
        risk_level = RiskLevel.MEDIUM
        evidence = f"{crop.capitalize()} accounts for {occurrences} of the last {total_seasons} seasons on this plot."
    else:
        risk_level = RiskLevel.LOW
        evidence = f"Low over-cropping pressure for {crop.capitalize()} on this parcel ({occurrences}/{total_seasons} seasons recorded)."

    return OverCroppingRisk(
        crop=crop.capitalize(),
        frequency_in_history=occurrences,
        consecutive_seasons=consecutive,
        risk_level=risk_level,
        evidence=evidence,
        botanical_family=family,
        recommended_rotation_crops=recs,
        confidence=round(min(0.95, 0.70 + (0.05 * total_seasons)), 2)
    )
