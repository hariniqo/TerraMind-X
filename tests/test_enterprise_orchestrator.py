"""
Automated Test Suite for TerraMind-X Central Decision Orchestrator.
Validates multi-agent coordination, conflict detection, evidence weighting,
action plan synthesis, and decision history persistence.
"""

import pytest
from app.db.session import AsyncSessionLocal
from app.services.orchestrator import DecisionOrchestrator
from app.db.models import OrchestratorDecisionRecord
from sqlalchemy import select


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_orchestrator_decision_generation_tamil_nadu():
    orchestrator = DecisionOrchestrator()
    async with AsyncSessionLocal() as session:
        decision = await orchestrator.generate_orchestrated_decision(
            farm_id="farm-01",
            district="Madurai",
            state="Tamil Nadu",
            crop="Groundnut",
            session=session
        )

        assert decision["status"] == "DECISION_FINALIZED"
        assert decision["decision_id"].startswith("TMX-DEC-")
        assert "primary_recommendation" in decision
        rec = decision["primary_recommendation"]
        assert rec["crop"] == "Groundnut"
        assert 0.0 <= rec["composite_score"] <= 100.0
        assert rec["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
        assert len(rec["why_recommended"]) > 10

        # Action plan checks
        assert "action_plan" in decision
        assert len(decision["action_plan"]["immediate_actions"]) == 3
        assert len(decision["action_plan"]["long_term_actions"]) == 3

        # Agent contributions check
        agents = decision["agent_contributions"]
        assert "land_intelligence" in agents
        assert "soil_intelligence" in agents
        assert "market_intelligence" in agents
        assert "sustainability_intelligence" in agents
        assert "hardware_iot_intelligence" in agents

        # Multi-lingual explanations check
        explanations = decision["farmer_explanation"]
        assert "en" in explanations and len(explanations["en"]) > 20
        assert "ta" in explanations and len(explanations["ta"]) > 20
        assert "mr" in explanations and len(explanations["mr"]) > 20

        # Persistence check in SQLite
        stmt = select(OrchestratorDecisionRecord).where(
            OrchestratorDecisionRecord.decision_id == decision["decision_id"]
        )
        res = await session.execute(stmt)
        persisted = res.scalars().first()
        assert persisted is not None
        assert persisted.primary_crop == "Groundnut"


@pytest.mark.anyio
async def test_orchestrator_decision_maharashtra():
    orchestrator = DecisionOrchestrator()
    async with AsyncSessionLocal() as session:
        decision = await orchestrator.generate_orchestrated_decision(
            farm_id="farm-maha-01",
            district="Pune",
            state="Maharashtra",
            crop="Soybean",
            session=session
        )

        assert decision["status"] == "DECISION_FINALIZED"
        assert decision["farm"]["state"] == "Maharashtra"
        assert decision["primary_recommendation"]["crop"] == "Soybean"
        assert len(decision["alternative_recommendations"]) >= 1


@pytest.mark.anyio
async def test_orchestrator_conflict_detection():
    orchestrator = DecisionOrchestrator()
    async with AsyncSessionLocal() as session:
        decision = await orchestrator.generate_orchestrated_decision(
            farm_id="farm-01",
            district="Madurai",
            state="Tamil Nadu",
            crop="Tomato",
            session=session
        )

        assert "conflict_resolution" in decision
        assert "conflicts" in decision["conflict_resolution"]
        assert decision["conflict_resolution"]["status"] in ["ALL_CONFLICTS_RESOLVED", "NO_CONFLICTS_DETECTED"]
