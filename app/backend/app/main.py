"""
TerraMind-X FastAPI application entry point.

Architecture:
  Farmer Input → Data Gateway → 4 Agents → ML → Decision Engine → LLM → UI

Run:
  uvicorn app.main:app --reload --port 8000

Docs:
  http://localhost:8000/docs
  http://localhost:8000/redoc
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.database import create_all_tables
from app.utils.errors import validation_exception_handler

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("terramind_startup", env=settings.app_env, demo_mode=settings.demo_mode)

    # Create tables (dev mode uses SQLite create_all; production uses Alembic)
    if settings.app_env == "development":
        await create_all_tables()
        logger.info("db_tables_created")

    # Seed reference data on first start
    try:
        from app.db.database import AsyncSessionLocal
        from app.services.ingestion_service import seed_reference_data
        async with AsyncSessionLocal() as db:
            result = await seed_reference_data(db)
            await db.commit()
            logger.info("reference_data_seeded", **result)
    except Exception as exc:
        logger.warning("seed_failed", error=str(exc))

    # Start background scheduler
    if settings.scheduler_enabled:
        try:
            from app.scheduler import start_scheduler
            start_scheduler()
            logger.info("scheduler_started")
        except Exception as exc:
            logger.warning("scheduler_failed", error=str(exc))

    yield

    logger.info("terramind_shutdown")


app = FastAPI(
    title="TerraMind-X API",
    description=(
        "Agricultural intelligence backend for TerraMind-X (SIH PS 26132).\n\n"
        "**Real Data → Validation → 4 Agents → ML → Decision Engine → LLM Explanation**\n\n"
        "Every numerical result is traceable to its source, date, location, and provenance."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ──────────────────────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid
    request_id = str(uuid.uuid4())
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = str(elapsed)
    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        ms=elapsed,
        request_id=request_id,
    )
    return response


# ── Exception handlers ─────────────────────────────────────────────────────────
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "status": "UPSTREAM_DATA_ERROR",
            "message": "An internal error occurred. Please try again.",
            "suggested_action": "Check server logs for details",
        },
    )


# ── Routers ────────────────────────────────────────────────────────────────────
prefix = settings.api_prefix

from app.api.routes.health     import router as health_router
from app.api.routes.analyze    import router as analyze_router
from app.api.routes.market     import router as market_router
from app.api.routes.agents     import router as agents_router
from app.api.routes.ingestion  import router as ingestion_router
from app.api.routes.models     import router as models_router

app.include_router(health_router)                      # /health (no prefix)
app.include_router(analyze_router,   prefix=prefix)    # /api/v1/analyze
app.include_router(market_router,    prefix=prefix)    # /api/v1/market/*
app.include_router(agents_router,    prefix=prefix)    # /api/v1/agents/*
app.include_router(ingestion_router, prefix=prefix)    # /api/v1/ingestion/*
app.include_router(models_router,    prefix=prefix)    # /api/v1/models, /api/v1/data-quality


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "TerraMind-X API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }
