import unittest

from fastapi.testclient import TestClient

from Backend.main import app


class Phase2ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_contract(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "terramind-api"})

    def test_authentication_and_farm_golden_path(self) -> None:
        phone = "+919900000001"
        registration = self.client.post("/auth/register", json={"name": "Maharashtra Farmer", "phone": phone, "password": "secure-pass"})
        self.assertEqual(registration.status_code, 200)
        token = registration.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        farm = self.client.post(
            "/farms",
            headers=headers,
            json={"area_acres": 2.4, "location": {"state": "Maharashtra", "district": "Nashik", "village": "Dindori"}, "ph": 6.8, "moisture": 29.5},
        )
        self.assertEqual(farm.status_code, 200)
        self.assertEqual(farm.json()["location"]["district"], "Nashik")

    def test_unavailable_external_data_is_explicit(self) -> None:
        weather = self.client.get("/intelligence/weather", params={"farm_id": "F0001"})
        market = self.client.get("/market/prices", params={"crop": "onion", "district": "Nashik"})
        self.assertEqual(weather.json()["data_status"], "unavailable")
        self.assertEqual(market.json()["data_status"], "unavailable")
        self.assertIsNone(market.json()["current_price"])

    def test_advisory_and_guardian_contracts(self) -> None:
        payload = {"farm_id": "F0001", "location": {"district": "Nashik"}, "soil": {"ph": 6.8, "moisture": 29.5}}
        recommendation = self.client.post("/advisory/crop-recommendation", json=payload)
        competition = self.client.post("/intelligence/crop-competition", json={**payload, "market": {"crop": "onion", "acreage": 2.4}})
        council = self.client.post("/ai/council", json=payload)
        self.assertEqual(recommendation.status_code, 200)
        self.assertIn("recommendations", recommendation.json())
        self.assertIn("competition_level", competition.json())
        self.assertEqual(len(council.json()["agents"]), 4)
        self.assertIn("validation_status", council.json())

    def test_provenance_registry_and_structured_market_flow(self) -> None:
        registry = self.client.get("/data-sources")
        self.assertEqual(registry.status_code, 200)
        self.assertIn("data_sources", registry.json())
        self.assertTrue(len(registry.json()["data_sources"]) >= 3)

        prices = self.client.get("/market/prices", params={"crop": "onion", "district": "Nashik"})
        self.assertEqual(prices.status_code, 200)
        self.assertIn("source", prices.json())
        self.assertIn("data_quality", prices.json())

        selling = self.client.post("/advisory/selling-window", json={"farm_id": "F0001", "location": {"district": "Nashik"}, "soil": {"ph": 6.8, "moisture": 29.5}, "market": {"crop": "onion"}})
        self.assertEqual(selling.status_code, 200)
        self.assertIn("recommended_window", selling.json())
        self.assertIn("confidence", selling.json())

        options = self.client.post("/market/best-selling-options", json={"farm_id": "F0001", "location": {"district": "Nashik"}, "soil": {"ph": 6.8, "moisture": 29.5}, "market": {"crop": "onion"}})
        self.assertEqual(options.status_code, 200)
        self.assertIn("options", options.json())

    def test_multilingual_decision_explanations(self) -> None:
        en = self.client.post("/ai/chat", json={"farmer_id": "F001", "farm_id": "F001", "language": "en", "message": "What crop should I grow?"})
        ta = self.client.post("/ai/chat", json={"farmer_id": "F001", "farm_id": "F001", "language": "ta", "message": "என்ன பயிரிட வேண்டும்?"})
        mr = self.client.post("/ai/chat", json={"farmer_id": "F001", "farm_id": "F001", "language": "mr", "message": "काय पिकवावे?"})

        self.assertEqual(en.status_code, 200)
        self.assertIn("Recommendation", en.json()["text"])
        self.assertIn("பரிந்துரை", ta.json()["text"])
        self.assertIn("शिफारस", mr.json()["text"])

    def test_invalid_farm_is_rejected(self) -> None:
        response = self.client.post("/farms", json={"area_acres": -1, "location": {}})
        self.assertEqual(response.status_code, 422)

    def test_phase9_unified_advisory_workflow(self) -> None:
        valid = self.client.post(
            "/api/advisory",
            json={
                "location": {"state": "Maharashtra", "district": "Nashik", "taluka": "Dindori"},
                "land_area": 2.4,
                "soil": {"ph": 6.8, "nitrogen": 48, "phosphorus": 25, "potassium": 190, "organic_carbon": 0.7, "moisture": 29.5},
                "crop_preference": "onion",
                "sowing_period": "Kharif",
                "water_availability": "Good",
                "farmer_id": "F001",
            },
        )
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(valid.json()["status"], "VALIDATED")
        self.assertIn("recommended_crop", valid.json())
        self.assertIn("agent_consensus", valid.json())
        self.assertEqual(len(valid.json()["agents"]), 4)
        self.assertIn("database_status", valid.json())

        invalid = self.client.post(
            "/api/advisory",
            json={
                "location": {"state": "Maharashtra", "district": "Unknown", "taluka": "X"},
                "land_area": -1,
                "soil": {"ph": 20, "nitrogen": -5, "phosphorus": -1, "potassium": -3, "organic_carbon": -1, "moisture": 120},
                "crop_preference": "",
                "sowing_period": "",
                "water_availability": "",
                "farmer_id": "F001",
            },
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("status", invalid.json())
        self.assertIn("INVALID_INPUT", invalid.json()["status"])

    def test_phase10_database_status_contract(self) -> None:
        response = self.client.get("/api/database/status")
        self.assertEqual(response.status_code, 200)
        self.assertIn("database_connected", response.json())
        self.assertIn("database_type", response.json())

    def test_phase12_fail_closed_inputs(self) -> None:
        market = self.client.get("/api/market", params={"crop": "onion", "district": "Nashik"})
        self.assertEqual(market.json()["data_status"], "UNAVAILABLE")

        ml = self.client.post("/api/ml", json={"soil": {"ph": 6.8}})
        self.assertEqual(ml.json()["status"], "UNAVAILABLE")

        stale = self.client.post("/api/orchestrator", json={"agents": [
            {"agent": "LAND", "confidence": 80, "recommendation": "onion", "data_status": "STALE"},
            {"agent": "MARKET", "confidence": 80, "recommendation": "onion", "data_status": "REAL"},
            {"agent": "AGRONOMY", "confidence": 80, "recommendation": "onion", "data_status": "REAL"},
            {"agent": "SUSTAINABILITY", "confidence": 80, "recommendation": "onion", "data_status": "REAL"},
        ]})
        self.assertEqual(stale.json()["status"], "REJECTED")

        unknown_crop = self.client.post("/api/advisory", json={
            "location": {"state": "Maharashtra", "district": "Nashik", "taluka": "Dindori"},
            "land_area": 2.4,
            "soil": {"ph": 6.8, "nitrogen": 48, "phosphorus": 25, "potassium": 190, "organic_carbon": 0.7, "moisture": 29.5},
            "crop_preference": "unknown crop",
            "sowing_period": "Kharif",
            "water_availability": "Good",
        })
        self.assertEqual(unknown_crop.status_code, 400)

    def test_four_agent_and_future_data_contracts(self) -> None:
        payload = {
            "location": {"state": "Maharashtra", "district": "Nashik", "taluka": "Dindori"},
            "land_area": 2.4,
            "soil": {"ph": 6.8, "nitrogen": 48, "phosphorus": 25, "potassium": 190, "organic_carbon": 0.7, "moisture": 29.5},
            "crop_preference": "onion",
            "sowing_period": "Kharif",
            "water_availability": "Good",
            "farmer_id": "F001",
        }

        advisory = self.client.post("/api/advisory", json=payload)
        self.assertEqual(advisory.status_code, 200)
        self.assertEqual(len(advisory.json()["agents"]), 4)
        self.assertEqual(
            {a["agent"] for a in advisory.json()["agents"]},
            {"CROP_SUITABILITY", "MARKET_RISK", "SUSTAINABILITY", "SOIL_HEALTH"},
        )
        self.assertNotIn("CLIMATE", [a["agent"] for a in advisory.json()["agents"]])
        self.assertIn("SUSTAINABILITY", [a["agent"] for a in advisory.json()["agents"]])

        land = self.client.get("/api/land", params={"district": "Nashik"})
        market = self.client.get("/api/market", params={"crop": "onion", "district": "Nashik"})
        climate = self.client.get("/api/climate", params={"district": "Nashik"})
        orchestrator = self.client.post("/api/orchestrator", json={"agents": advisory.json()["agents"], "status": "VALIDATED"})
        provenance = self.client.get("/api/data-provenance")

        self.assertEqual(land.status_code, 200)
        self.assertEqual(market.status_code, 200)
        self.assertEqual(climate.status_code, 200)
        self.assertEqual(orchestrator.status_code, 200)
        self.assertEqual(provenance.status_code, 200)
        self.assertIn("data_status", land.json())
        self.assertIn("data_status", market.json())
        self.assertIn("data_status", climate.json())
        self.assertIn("status", orchestrator.json())
        self.assertIn("records", provenance.json())


if __name__ == "__main__":
    unittest.main()
