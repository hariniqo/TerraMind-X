# TerraMind-X — n8n Setup and Configuration Guide

This document provides instructions to import and configure the automated **n8n** pipelines.

---

## 1. Importing Workflows
1.  Open the n8n dashboard (typically `http://localhost:5678`).
2.  Click **Workflows** -> **Add Workflow** -> **Import from File**.
3.  Choose the target workflow JSON template files located in the [n8n/workflows/](file:///c:/Users/admin/Downloads/Agri%20New/n8n/workflows/) directory:
    *   `market_ingestion.json`
    *   `weather_update.json`
    *   `sowing_risk_alert.json`
    *   `damage_control.json`
    *   `ai_council.json`

---

## 2. Variables Configuration
To authenticate webhooks, navigate to n8n parameters and populate the environment variables:
*   `WEBHOOK_SECRET` must match the value configured in `.env` under key `N8N_WEBHOOK_SECRET` (default: `sih_skey_2026`).
*   Include header `X-N8N-Secret` in all HTTP Request nodes calling the FastAPI server.
