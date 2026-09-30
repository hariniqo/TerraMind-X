"""
Background scheduler for periodic data ingestion.
Uses APScheduler. Jobs:
  - Daily market price update (AGMARKNET)
  - Daily weather update (Open-Meteo) for known districts
  - Weekly reference data refresh
"""
from __future__ import annotations

from app.core.logging import get_logger

logger = get_logger(__name__)

_scheduler = None

# Districts to fetch weather for (expand as locations are added)
WEATHER_DISTRICTS = [
    {"name": "Nashik",      "state": "Maharashtra", "lat": 19.9975, "lon": 73.7898},
    {"name": "Pune",        "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    {"name": "Thoothukudi", "state": "Tamil Nadu",  "lat": 8.7642,  "lon": 78.1348},
    {"name": "Madurai",     "state": "Tamil Nadu",  "lat": 9.9252,  "lon": 78.1198},
]


def start_scheduler():
    global _scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        _scheduler = AsyncIOScheduler()
        _scheduler.add_job(_daily_pipeline_job, "cron", hour=6, minute=0, id="daily_data_pipeline")
        _scheduler.start()
        logger.info("scheduler_jobs_registered")
    except ImportError:
        logger.warning("apscheduler_not_installed — scheduled ingestion disabled")
    except Exception as exc:
        logger.error("scheduler_start_failed", error=str(exc))


async def _daily_pipeline_job():
    """Run all source jobs independently and commit their audited results."""
    try:
        from app.db.database import AsyncSessionLocal
        from app.services.ingestion_service import run_daily_data_pipeline
        async with AsyncSessionLocal() as db:
            result = await run_daily_data_pipeline(db)
            await db.commit()
            logger.info(
                "scheduled_data_pipeline_complete",
                status=result["status"],
                source_runs=len(result["source_runs"]),
            )
    except Exception as exc:
        logger.error("daily_pipeline_job_failed", error=str(exc))
