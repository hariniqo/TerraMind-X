# TERRAMIND-X: ENTERPRISE DEPLOYMENT & OPERATIONS GUIDE

**Target Environment:** Docker / Kubernetes / Cloud VM (Linux/Ubuntu 22.04 LTS)  
**Database Engines:** SQLite (Local Dev) / PostgreSQL 15 + TimescaleDB (Enterprise Production)  

---

## 1. Environment Configuration (.env)

Ensure `.env` contains production parameters (see `.env.example`):

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://terramind_user:secure_password@postgres:5432/terramind_db

# Security & CORS
CORS_ALLOWED_ORIGINS=https://app.terramind.ag,https://admin.terramind.ag
CACHE_TTL_SECONDS=86400

# Operational Execution Mode
TERRAMIND_DATA_MODE=REAL_DATA_MODE

# LLM & Government API Gateways
NVIDIA_API_KEY=nvapi-your-key-here
DATA_GOV_API_KEY=ogd-your-key-here
```

---

## 2. Docker Compose Multi-Container Stack

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://terramind_user:secure_pwd@postgres:5432/terramind_db
      - CORS_ALLOWED_ORIGINS=http://localhost:5173,https://app.terramind.ag
    depends_on:
      - postgres
    restart: always

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_DB: terramind_db
      POSTGRES_USER: terramind_user
      POSTGRES_PASSWORD: secure_pwd
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

---

## 3. Production Health Monitoring & Alerts

1. **Liveness Probe**: `GET /health` (returns `{"status": "healthy"}`)
2. **Agent Observability**: `GET /api/v1/health/agents` (tracks latency, data freshness, and error rates for all 6 agents)
3. **Database Migration**: Schema tables auto-initialize on startup via async `init_db()` lifespan handler.
