"""
Unit and Integration Tests for TerraMind-X Organic Farming Knowledge & NPOP Compliance Service.
"""

import pytest
from app.services.organic_knowledge_service import organic_service


def test_organic_knowledge_dataset_loaded():
    assert len(organic_service.knowledge_base) >= 10
    crops = [r["crop"] for r in organic_service.knowledge_base]
    assert "Groundnut" in crops
    assert "Cotton" in crops
    assert "Soybean" in crops


def test_query_practices_by_crop_and_ph():
    results = organic_service.query_practices(crop="Groundnut", soil_ph=6.8)
    assert len(results) >= 1
    assert "Groundnut" in results[0]["crop"]
    assert "Trichoderma" in results[0]["disease_prevention"]
    assert results[0]["npop_certified_practice"] is True


def test_npop_compliance_prohibited_chemicals():
    # 1. Chemical Urea
    res_urea = organic_service.check_npop_compliance("Synthetic Urea 46% N")
    assert res_urea["is_permitted"] is False
    assert "RESTRICTED" in res_urea["status"]
    assert "alternative" in res_urea["recommended_organic_alternative"].lower() or "vermicompost" in res_urea["recommended_organic_alternative"].lower() or "manure" in res_urea["recommended_organic_alternative"].lower()

    # 2. Chlorpyrifos insecticide
    res_chlor = organic_service.check_npop_compliance("Chlorpyrifos 20 EC")
    assert res_chlor["is_permitted"] is False
    assert "Prohibited" in res_chlor["matched_rule"]
    assert "neem" in res_chlor["recommended_organic_alternative"].lower()

    # 3. Glyphosate herbicide
    res_gly = organic_service.check_npop_compliance("Roundup Glyphosate Herbicide")
    assert res_gly["is_permitted"] is False


def test_npop_compliance_permitted_biologicals():
    # 1. Vermicompost
    res_vermi = organic_service.check_npop_compliance("Enriched Vermicompost with Biochar")
    assert res_vermi["is_permitted"] is True
    assert res_vermi["status"] == "FULLY PERMITTED"

    # 2. Trichoderma viride bio-fungicide
    res_tricho = organic_service.check_npop_compliance("Trichoderma viride 1% WP")
    assert res_tricho["is_permitted"] is True

    # 3. Azotobacter biofertilizer
    res_azo = organic_service.check_npop_compliance("Azotobacter liquid biofertilizer")
    assert res_azo["is_permitted"] is True


def test_organic_advisory_context_generation():
    adv = organic_service.get_advisory_context(crop="Cotton", district="Nagpur", soil_ph=7.2)
    assert adv["crop"] == "Cotton"
    assert "biofertilizer" in adv
    assert "evidence_source" in adv
    assert "ICAR" in adv["evidence_source"]["organization"]
    assert adv["evidence_source"]["npop_compliant"] is True
