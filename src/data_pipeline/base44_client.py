const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

"""
Base44 REST API client for the TerraMind-X data pipeline.

Replaces the PostgreSQL db.py helper: instead of writing to Postgres, this
writes directly into the app's Base44 entity store via the REST API, so the
data shows up immediately in the app's screens (Market, Weather, Soil, etc.).

Setup:
  1. Get your Base44 personal access token:
     Dashboard → click your profile (top-right) → Personal Access Tokens → New.
  2. Find your app_id: Dashboard → API → "App ID" (shown at the top).
  3. Put both in .env (see .env.example).

API reference:
  POST https://app.db.com/api/apps/{app_id}/entities/{entity_name}  → create
  GET  https://app.db.com/api/apps/{app_id}/entities/{entity_name}?q={json}  → list/filter
  Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

BASE44_APP_ID = os.getenv("BASE44_APP_ID", "")
BASE44_API_TOKEN = os.getenv("BASE44_API_TOKEN", "")
BASE44_BASE = os.getenv("BASE44_BASE", "https://app.db.com/api/apps")

BASE_URL = f"{BASE44_BASE}/{BASE44_APP_ID}/entities"
HEADERS = {
    "Authorization": f"Bearer {BASE44_API_TOKEN}",
    "Content-Type": "application/json",
}

def _check_config():
    if not BASE44_APP_ID or not BASE44_API_TOKEN:
        raise RuntimeError(
            "Set BASE44_APP_ID and BASE44_API_TOKEN in .env "
            "(Dashboard → API → App ID; Dashboard → profile → Personal Access Tokens)."
        )

def create_record(entity_name, record):
    """POST one record to a Base44 entity. Returns the created record dict."""
    _check_config()
    url = f"{BASE_URL}/{entity_name}"
    resp = requests.post(url, headers=HEADERS, json=record, timeout=30)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"POST {entity_name} failed ({resp.status_code}): {resp.text[:500]}")
    return resp.json()

def list_records(entity_name, query=None, limit=5000, skip=0):
    """GET records from a Base44 entity, optionally filtered by a query dict."""
    _check_config()
    url = f"{BASE_URL}/{entity_name}"
    params = {"limit": limit, "skip": skip}
    if query:
        params["q"] = json.dumps(query)
    resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"GET {entity_name} failed ({resp.status_code}): {resp.text[:500]}")
    return resp.json() if isinstance(resp.json(), list) else resp.json().get("data", resp.json())

def exists(entity_name, query):
    """Return True if at least one record matches the query (used for dedup)."""
    rows = list_records(entity_name, query, limit=1)
    return isinstance(rows, list) and len(rows) > 0

def create_if_not_exists(entity_name, record, dedup_query):
    """
    Create record only if no existing record matches dedup_query.
    Returns (created: bool, record).
    """
    if exists(entity_name, dedup_query):
        return False, None
    rec = create_record(entity_name, record)
    return True, rec

def bulk_create_if_not_exists(entity_name, records, dedup_fields):
    """
    For each record, check dedup (by mapping dedup_fields → query) and create if new.
    Returns {"created": N, "skipped": M, "errors": [...]}.
    """
    created = 0
    skipped = 0
    errors = []
    for rec in records:
        dedup_q = {k: rec.get(k) for k in dedup_fields if rec.get(k) is not None}
        try:
            did, _ = create_if_not_exists(entity_name, rec, dedup_q)
            if did:
                created += 1
            else:
                skipped += 1
        except Exception as e:
            errors.append(str(e))
    return {"created": created, "skipped": skipped, "errors": errors}