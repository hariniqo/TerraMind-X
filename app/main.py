from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.db.session import init_db
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema & seeds
    await init_db()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="TerraMind-X Agricultural Intelligence Platform",
    version="2.0.0-enterprise",
    description="Enterprise AI-powered agricultural decision intelligence backend for smallholder farmers.",
    lifespan=lifespan
)

settings = get_settings()
origins = [o.strip() for o in settings.cors_allowed_origins.split(",") if o.strip()]

# Spec-compliant CORS configuration: never pair "*" with allow_credentials=True
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
elif settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
async def root_health() -> dict:
    return {
        "status": "healthy",
        "service": "TerraMind-X Enterprise Backend",
        "version": "2.0.0-enterprise"
    }


app.include_router(api_router, prefix="/api/v1")


