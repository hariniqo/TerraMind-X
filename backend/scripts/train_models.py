"""
scripts/train_models.py — Train market price forecast models for all
commodity × district combinations that have sufficient real data.

Run:
    python -m scripts.train_models

Outputs:
  - Model artifacts to backend/models/
  - Registry entries to ml_models table
  - Evaluation report to docs/model_training_report.json
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import AsyncSessionLocal, create_all_tables
from app.core.logging import configure_logging, get_logger
from app.services.market_service import get_price_records, get_distinct_commodities

configure_logging()
logger = get_logger("train_models")

TARGET_DISTRICTS = [
    ("Maharashtra", "Nashik"),
    ("Maharashtra", "Pune"),
    ("Maharashtra", "Ahmednagar"),
    ("Tamil Nadu",  "Madurai"),
    ("Tamil Nadu",  "Thoothukudi"),
]
MIN_RECORDS_TO_ATTEMPT = 14


async def train_all():
    await create_all_tables()
    report = {
        "generated_at": datetime.utcnow().isoformat(),
        "models_trained": [],
        "models_skipped": [],
        "models_failed": [],
    }

    from app.ml.training.market_trainer import train_market_model
    from app.db.models import MLModel
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSessionLocal() as db:
        commodities = await get_distinct_commodities(db)
        if not commodities:
            logger.warning("no_commodities_in_db", msg="Run market ingestion first")
            report["summary"] = "No commodities found — run market ingestion first."
            return report

        for state, district in TARGET_DISTRICTS:
            for commodity in commodities:
                records = await get_price_records(
                    db, commodity, district, state, days_back=1095, limit=5000
                )
                if len(records) < MIN_RECORDS_TO_ATTEMPT:
                    report["models_skipped"].append({
                        "commodity": commodity, "district": district,
                        "reason": f"only {len(records)} records (need {MIN_RECORDS_TO_ATTEMPT})",
                    })
                    continue

                logger.info("training_model", commodity=commodity, district=district, records=len(records))
                result = train_market_model(records, commodity=commodity, district=district)

                if result.status in ("success", "baseline_only"):
                    # Register in DB
                    import uuid
                    model_obj = MLModel(
                        id=str(uuid.uuid4()),
                        model_name=result.model_name,
                        model_version=result.model_version,
                        model_type=result.model_type,
                        target="modal_price",
                        features=json.dumps(result.features_used),
                        training_data_sources=json.dumps(["MarketPrice (AGMARKNET)"]),
                        training_rows=result.training_rows,
                        test_rows=result.test_rows,
                        mae=result.mae,
                        rmse=result.rmse,
                        mape=result.mape,
                        baseline_mae=result.baseline_mae,
                        outperforms_baseline=result.outperforms_baseline,
                        artifact_path=result.artifact_path,
                        status="active",
                        notes=result.notes,
                        trained_at=datetime.utcnow(),
                    )
                    db.add(model_obj)
                    await db.flush()

                    report["models_trained"].append({
                        "commodity": commodity, "district": district,
                        "model_name": result.model_name,
                        "model_type": result.model_type,
                        "training_rows": result.training_rows,
                        "test_rows": result.test_rows,
                        "mae": result.mae,
                        "baseline_mae": result.baseline_mae,
                        "outperforms_baseline": result.outperforms_baseline,
                        "notes": result.notes,
                    })
                else:
                    report["models_failed"].append({
                        "commodity": commodity, "district": district,
                        "status": result.status,
                        "error": result.error_message,
                    })

        await db.commit()

    report["summary"] = (
        f"Trained: {len(report['models_trained'])}, "
        f"Skipped: {len(report['models_skipped'])}, "
        f"Failed: {len(report['models_failed'])}"
    )
    return report


async def main():
    report = await train_all()
    out = Path(__file__).parent.parent.parent / "docs" / "model_training_report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, default=str))
    logger.info("training_complete", summary=report.get("summary"))
    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
