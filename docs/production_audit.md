# TerraMind-X — Production Integration & Infrastructure Audit

This document presents the architecture audit, existing integrations, missing infrastructure, and modification mapping for **TerraMind-X** production transition.

---

## 1. Current Architecture
TerraMind-X operates on a decoupled client-server architecture:
*   **Frontend**: Single Page Application built on React/TypeScript and packaged via Vite.
*   **Backend**: ASGI web services gateway built on FastAPI, executing the LangGraph council orchestration and ML regression/diffusion pipelines.
*   **Database**: Local SQLite database with SQLAlchemy async drivers.

---

## 2. Infrastructure Gaps
To achieve enterprise startup readiness, the following components are provisioned for deployment:
1.  **PostgreSQL DB Cluster**: For multi-user transactional persistence.
2.  **NVIDIA NIM Provider**: Abstraction layer resolving completions requests under structured error handling and offline fallbacks.
3.  **n8n Automation Engine**: Local container instances orchestrating background cron updates.

---

## 3. Targeted Files for Modification
*   `app/core/config.py`: Add CORS permitted hosts, PostgreSQL connection keys, and n8n secrets.
*   `app/api/routes.py`: Add API health checks and secure n8n webhooks validation handlers.
*   `app/services/ai_provider.py`: Define AI provider protocols.
*   `docker-compose.yml`: Define container configuration blocks for React, FastAPI, postgres, and n8n.
*   `n8n/workflows/*.json`: Export workflow definitions.
