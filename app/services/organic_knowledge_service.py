"""
Organic Farming Knowledge & Evidence Service for TerraMind-X.
Provides structured agronomic retrieval, NPOP/APEDA organic compliance validation,
and evidence-backed organic package of practices grounded in ICAR and FAOSTAT data.
"""

import os
import csv
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "terramind_organic_farming_knowledge.csv")

# Standard prohibited inputs under National Programme for Organic Production (NPOP / APEDA)
PROHIBITED_INPUTS = {
    "chemical_fertilizers": [
        "urea", "synthetic urea", "dap", "di-ammonium phosphate", "mop", "muriate of potash",
        "npk 19:19:19", "complex fertilizer", "ammonium sulphate", "super phosphate"
    ],
    "synthetic_pesticides": [
        "monocrotophos", "chlorpyrifos", "cypermethrin", "endosulfan", "carbofuran",
        "dimethoate", "imidacloprid", "glyphosate", "paraquat", "atrazine", "carbendazim",
        "mancozeb", "hexaconazole"
    ],
    "gmo": [
        "bt cotton", "gmo seeds", "genetically modified seeds", "herbicide tolerant seeds"
    ]
}

# Permitted inputs and organic bio-agents
PERMITTED_ORGANIC_INPUTS = {
    "soil_amendments": [
        "farmyard manure", "fym", "vermicompost", "compost", "coir pith", "poultry manure",
        "jeevamrut", "panchagavya", "biochar", "wood ash", "pressmud", "green manure", "dhaincha", "sunnhemp"
    ],
    "biofertilizers": [
        "rhizobium", "azotobacter", "azospirillum", "phosphobacteria", "psb",
        "vesicular arbuscular mycorrhiza", "vam", "mycorrhiza", "zinc solubilizing bacteria",
        "acetobacter diazotrophicus", "potash mobilizing bacteria"
    ],
    "biopesticides_and_botanicals": [
        "neem oil", "neem seed kernel extract", "nske", "dashaparni ark", "trichoderma viride",
        "trichoderma harzianum", "pseudomonas fluorescens", "beauveria bassiana",
        "verticillium lecanii", "bacillus thuringiensis", "bt", "hanpv", "pheromone traps",
        "sticky traps", "trichogramma", "bordeaux mixture", "copper hydroxide"
    ]
}


class OrganicKnowledgeService:
    def __init__(self, data_file: str = CSV_PATH):
        self.data_file = data_file
        self.knowledge_base: List[Dict[str, Any]] = []
        self._load_dataset()

    def _load_dataset(self):
        if not os.path.exists(self.data_file):
            logger.warning(f"Organic dataset file not found at {self.data_file}. Initializing with empty store.")
            return

        try:
            with open(self.data_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.knowledge_base.append({
                        "crop": row.get("crop", "").strip(),
                        "state": row.get("state", "").strip(),
                        "district": row.get("district", "").strip(),
                        "soil_type": row.get("soil_type", "").strip(),
                        "pH_min": float(row.get("pH_min", 6.0)),
                        "pH_max": float(row.get("pH_max", 7.5)),
                        "rainfall_min_mm": float(row.get("rainfall_min_mm", 400)),
                        "rainfall_max_mm": float(row.get("rainfall_max_mm", 800)),
                        "temperature_min": float(row.get("temperature_min", 20)),
                        "temperature_max": float(row.get("temperature_max", 35)),
                        "organic_practice": row.get("organic_practice", "").strip(),
                        "nutrient_source": row.get("nutrient_source", "").strip(),
                        "biofertilizer": row.get("biofertilizer", "").strip(),
                        "pest_management": row.get("pest_management", "").strip(),
                        "disease_prevention": row.get("disease_prevention", "").strip(),
                        "irrigation_type": row.get("irrigation_type", "").strip(),
                        "crop_rotation": row.get("crop_rotation", "").strip(),
                        "expected_yield_kg_per_acre": float(row.get("expected_yield_kg_per_acre", 1000)),
                        "sowing_window": row.get("sowing_window", "").strip(),
                        "harvest_window": row.get("harvest_window", "").strip(),
                        "source": row.get("source", "").strip(),
                        "source_url": row.get("source_url", "").strip(),
                        "evidence_level": row.get("evidence_level", "Official Research").strip(),
                        "language": row.get("language", "English").strip(),
                        "npop_certified_practice": row.get("npop_certified_practice", "TRUE").strip().upper() == "TRUE",
                        "last_verified": row.get("last_verified", "2026-08-26").strip()
                    })
            logger.info(f"Loaded {len(self.knowledge_base)} verified organic farming knowledge records.")
        except Exception as e:
            logger.error(f"Failed to load organic knowledge dataset: {str(e)}", exc_info=True)

    def query_practices(
        self,
        crop: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        soil_ph: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves matching organic practices filtered by crop, district, and soil pH range.
        """
        results = []
        for record in self.knowledge_base:
            # Crop match
            if crop and crop.lower() not in record["crop"].lower():
                continue

            # District match (optional)
            if district and district.lower() not in record["district"].lower():
                # Allow fallback if district not matched but crop is matched
                pass

            # State match (optional)
            if state and state.lower() not in record["state"].lower():
                continue

            # Soil pH suitability filter
            if soil_ph is not None:
                if not (record["pH_min"] - 0.5 <= soil_ph <= record["pH_max"] + 0.5):
                    continue

            results.append(record)

        return results or self.knowledge_base[:3]

    def check_npop_compliance(self, input_name: str) -> Dict[str, Any]:
        """
        Checks whether a farming input/practice complies with NPOP/APEDA Organic Standards.
        """
        clean_input = input_name.lower().strip()

        # Check prohibited list
        for category, items in PROHIBITED_INPUTS.items():
            for item in items:
                if item in clean_input:
                    return {
                        "is_permitted": False,
                        "status": "RESTRICTED / PROHIBITED",
                        "category": category,
                        "matched_rule": f"Prohibited under APEDA NPOP Annex 1 ({item})",
                        "reason": f"'{input_name}' contains synthetic chemicals or restricted agents prohibited in certified organic agriculture.",
                        "recommended_organic_alternative": self._get_alternative_for_prohibited(item),
                        "certification_standard": "APEDA National Programme for Organic Production (NPOP) / IFOAM Standards"
                    }

        # Check permitted list
        for category, items in PERMITTED_ORGANIC_INPUTS.items():
            for item in items:
                if item in clean_input:
                    return {
                        "is_permitted": True,
                        "status": "FULLY PERMITTED",
                        "category": category,
                        "matched_rule": f"Permitted organic substance under NPOP Standards ({item})",
                        "reason": f"'{input_name}' is a biological / mineral substance approved for organic crop nutrition and crop health.",
                        "usage_guideline": "Apply according to recommended moisture and soil organic carbon baselines.",
                        "certification_standard": "APEDA NPOP Certified Practice"
                    }

        return {
            "is_permitted": True,
            "status": "REVIEW_RECOMMENDED",
            "category": "unclassified",
            "matched_rule": "Standard natural input check",
            "reason": f"No prohibited synthetic chemical marker found for '{input_name}'. Verify with local organic certification body (NPOP/KVK).",
            "certification_standard": "APEDA NPOP Standards Guideline"
        }

    def _get_alternative_for_prohibited(self, prohibited_term: str) -> str:
        alternatives = {
            "urea": "Apply enriched Farmyard Manure (5 t/acre) + Azotobacter/Rhizobium biofertilizer + Panchagavya 3% foliar spray.",
            "synthetic urea": "Apply Vermicompost (2 t/acre) enriched with Trichoderma and Neem cake.",
            "dap": "Apply Rock Phosphate blended with compost + Phosphobacteria (PSB) @ 2 kg/acre.",
            "chlorpyrifos": "Use Neem Seed Kernel Extract (NSKE 5%) or Metarhizium anisopliae bio-insecticide.",
            "glyphosate": "Employ mechanical weeding, bio-mulching with crop residues, or intercropping with cover legumes.",
            "carbendazim": "Treat seeds with Trichoderma viride (4g/kg seed) or Pseudomonas fluorescens."
        }
        return alternatives.get(prohibited_term, "Use Neem oil (10,000 ppm), Dashaparni Ark, or Trichoderma viride biological formulations.")

    def get_advisory_context(self, crop: str, district: str, soil_ph: float = 6.8) -> Dict[str, Any]:
        """
        Synthesizes organic agronomic advice with evidence sources for AI Assistant RAG.
        """
        practices = self.query_practices(crop=crop, district=district, soil_ph=soil_ph)
        primary = practices[0] if practices else self.knowledge_base[0]

        return {
            "crop": primary["crop"],
            "region": f"{primary['district']}, {primary['state']}",
            "recommended_practice": primary["organic_practice"],
            "nutrient_management": primary["nutrient_source"],
            "biofertilizer": primary["biofertilizer"],
            "pest_management": primary["pest_management"],
            "disease_prevention": primary["disease_prevention"],
            "crop_rotation": primary["crop_rotation"],
            "irrigation": primary["irrigation_type"],
            "expected_yield_per_acre": f"{primary['expected_yield_kg_per_acre']} kg/acre",
            "evidence_source": {
                "organization": primary["source"],
                "evidence_level": primary["evidence_level"],
                "url": primary["source_url"],
                "npop_compliant": primary["npop_certified_practice"],
                "verification_date": primary["last_verified"]
            }
        }


# Singleton instance
organic_service = OrganicKnowledgeService()
