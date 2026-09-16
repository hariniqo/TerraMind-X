import asyncio
import os
import sys
import httpx
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app.core.config import get_settings
from app.services.market_service import market_service, fetch_agmarknet_from_api
from app.main import app

async def run_maharashtra_verification():
    settings = get_settings()
    
    print("==================================================")
    print("1. CHECKING API CONFIGURATION")
    print("==================================================")
    api_key = settings.data_gov_api_key
    resource_id = settings.data_gov_market_resource_id or "9ef84268-d588-465a-a308-a864a43d0070"
    cache_ttl = settings.market_cache_ttl_minutes
    
    key_configured = bool(api_key and len(api_key.strip()) > 5)
    print(f"DATA_GOV_API_KEY Configured: {'YES (Masked: ' + api_key[:4] + '****)' if key_configured else 'NO (Missing or empty in .env)'}")
    print(f"DATA_GOV_MARKET_RESOURCE_ID: {resource_id}")
    print(f"MARKET_CACHE_TTL_MINUTES: {cache_ttl}")

    print("\n==================================================")
    print("2. EXECUTING REAL GOVERNMENT API REQUESTS (data.gov.in)")
    print("==================================================")
    
    live_api_status = "BLOCKED" if not key_configured else "PENDING"
    http_status_code = "N/A"
    auth_status = "FAIL" if not key_configured else "PENDING"
    
    # Test 1: Nashik Onion
    print("\n[Query 1: Maharashtra -> Nashik -> Onion]")
    nashik_res = await fetch_agmarknet_from_api(
        state="Maharashtra",
        district="Nashik",
        commodity="Onion"
    )
    print(f"Status: {nashik_res.get('status')}, Reason: {nashik_res.get('reason')}, Records: {len(nashik_res.get('records', []))}")
    if nashik_res.get("records"):
        for r in nashik_res["records"][:3]:
            print(f"  - Market: {r['market']}, Date: {r['date']}, Modal: ₹{r['modal_price']}/q, Min: ₹{r['min_price']}, Max: ₹{r['max_price']}")

    # Test 2: Pune Tomato
    print("\n[Query 2: Maharashtra -> Pune -> Tomato]")
    pune_res = await fetch_agmarknet_from_api(
        state="Maharashtra",
        district="Pune",
        commodity="Tomato"
    )
    print(f"Status: {pune_res.get('status')}, Reason: {pune_res.get('reason')}, Records: {len(pune_res.get('records', []))}")
    if pune_res.get("records"):
        for r in pune_res["records"][:3]:
            print(f"  - Market: {r['market']}, Date: {r['date']}, Modal: ₹{r['modal_price']}/q, Min: ₹{r['min_price']}, Max: ₹{r['max_price']}")

    # Test 3: Akola Soybean
    print("\n[Query 3: Maharashtra -> Akola -> Soybean]")
    akola_res = await fetch_agmarknet_from_api(
        state="Maharashtra",
        district="Akola",
        commodity="Soybean"
    )
    print(f"Status: {akola_res.get('status')}, Reason: {akola_res.get('reason')}, Records: {len(akola_res.get('records', []))}")
    if akola_res.get("records"):
        for r in akola_res["records"][:3]:
            print(f"  - Market: {r['market']}, Date: {r['date']}, Modal: ₹{r['modal_price']}/q, Min: ₹{r['min_price']}, Max: ₹{r['max_price']}")

    # Check direct raw HTTP if key exists
    if key_configured:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                raw_resp = await client.get(
                    f"https://api.data.gov.in/resource/{resource_id}",
                    params={"api-key": api_key, "format": "json", "limit": 5, "filters[state]": "Maharashtra"}
                )
                http_status_code = str(raw_resp.status_code)
                if raw_resp.status_code == 200:
                    auth_status = "PASS"
                    live_api_status = "PASS"
                    raw_data = raw_resp.json()
                    print(f"Live API Test HTTP Status: 200 OK. Records count: {len(raw_data.get('records', []))}")
                elif raw_resp.status_code in [401, 403]:
                    auth_status = "FAIL (Invalid Key)"
                    live_api_status = "BLOCKED"
                else:
                    live_api_status = f"HTTP_{raw_resp.status_code}"
        except Exception as e:
            http_status_code = f"ERROR: {str(e)}"
            live_api_status = "ERROR"

    print("\n==================================================")
    print("3. VERIFYING MAHARASHTRA LOCATION HIERARCHY")
    print("==================================================")
    states = await market_service.get_states()
    has_mh_state = "Maharashtra" in states
    print(f"State 'Maharashtra' in registry: {has_mh_state}")

    districts = await market_service.get_districts("Maharashtra")
    print(f"Districts in Maharashtra ({len(districts)}): {districts}")

    markets = await market_service.get_markets("Maharashtra", "Nashik")
    print(f"Markets in Nashik ({len(markets)}): {markets}")

    commodities = await market_service.get_commodities("Maharashtra", "Nashik")
    print(f"Commodities ({len(commodities)}): {commodities[:6]}...")

    print("\n==================================================")
    print("4. VERIFYING FASTAPI ENDPOINTS & CACHING")
    print("==================================================")
    from httpx import ASGITransport
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. States
        r_states = await ac.get("/api/v1/market/states")
        print(f"GET /api/v1/market/states -> {r_states.status_code}")

        # 2. Districts
        r_dist = await ac.get("/api/v1/market/districts?state=Maharashtra")
        print(f"GET /api/v1/market/districts?state=Maharashtra -> {r_dist.status_code}")

        # 3. Markets
        r_mkt = await ac.get("/api/v1/market/markets?state=Maharashtra&district=Nashik")
        print(f"GET /api/v1/market/markets?state=Maharashtra&district=Nashik -> {r_mkt.status_code}")

        # 4. Prices (First request)
        r_pr1 = await ac.get("/api/v1/market/prices?state=Maharashtra&district=Nashik&commodity=Onion")
        print(f"GET /api/v1/market/prices (Req 1) -> {r_pr1.status_code}, Records: {len(r_pr1.json().get('records', []))}")

        # 5. Prices (Second request - Cache hit)
        r_pr2 = await ac.get("/api/v1/market/prices?state=Maharashtra&district=Nashik&commodity=Onion")
        print(f"GET /api/v1/market/prices (Req 2 Cache) -> {r_pr2.status_code}, Source: {r_pr2.json().get('source')}")

    print("\n==================================================")
    print("5. VERIFYING MARKET INTELLIGENCE AGENT & MARATHI OUTPUT")
    print("==================================================")
    # Test English
    adv_en = await market_service.generate_farmer_advisory(
        query="What is today's onion price in Nashik?",
        state="Maharashtra",
        district="Nashik",
        commodity="Onion",
        language="English"
    )
    print("\n[English Advisory Output]:")
    print(adv_en["formatted_advisory"])

    # Test Marathi
    adv_mr = await market_service.generate_farmer_advisory(
        query="आज नाशिक बाजारात कांद्याचा भाव काय आहे?",
        state="Maharashtra",
        district="Nashik",
        commodity="Onion",
        language="Marathi"
    )
    print("\n[Marathi Advisory Output]:")
    print(adv_mr["formatted_advisory"])

    print("\n==================================================")
    print("SUMMARY RESULTS READY")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_maharashtra_verification())
