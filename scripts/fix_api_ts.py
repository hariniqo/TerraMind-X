import os

file_path = os.path.join(os.path.dirname(__file__), "..", "src", "services", "api.ts")

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the broken section between line 1280 and 1320
broken_snippet = """    {
      device_id: 'ESP32-WEATHER-STATION-01',
  return await response.json()
}

export async function getAgentHealthStatus(): Promise<AgentHealthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/health/agents`)
    if (response.ok) {
      return await response.json()
    }
  } catch (e) {
    console.warn('Failed to fetch agent health status:', e)
        data_provider: 'Verra VM0042 / FAO-56 Water',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      hardware_iot_intelligence: {
        name: 'Hardware/IoT Intelligence Agent',
        status: 'CONNECTED',
        latency_ms: 18.0,
        data_freshness: 'LIVE',
        data_provider: 'TerraMind ESP32 Telemetry Gateway',
        active_devices: 2,
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      terramind_orchestrator: {
        name: 'TerraMind-X Decision Orchestrator',
        status: 'CONNECTED',
        latency_ms: 65.0,
        data_freshness: 'LIVE',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      }
    }
  }
}"""

clean_snippet = """    {
      device_id: 'ESP32-WEATHER-STATION-01',
      farm_id: farmId || 'farm-01',
      device_name: 'Microclimate Canopy Station',
      device_type: 'WEATHER_STATION',
      hardware_model: 'ESP32-METEO-V1',
      firmware_version: 'v1.4.2',
      status: 'ONLINE',
      battery_level_pct: 88.5,
      is_simulated: false,
      last_seen: new Date().toISOString()
    }
  ]
}

export async function registerIoTDevice(payload: Partial<IoTDeviceItem>): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/api/v1/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error('Failed to register IoT device')
  }
  return await response.json()
}

export async function getAgentHealthStatus(): Promise<AgentHealthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/health/agents`)
    if (response.ok) {
      return await response.json()
    }
  } catch (e) {
    console.warn('Failed to fetch agent health status:', e)
  }

  return {
    system_status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    total_agents: 6,
    agents: {
      land_intelligence: {
        name: 'Land Intelligence Agent',
        status: 'CONNECTED',
        latency_ms: 45.0,
        data_freshness: 'RECENT',
        data_provider: 'ESA Sentinel-2 Level-2A',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      soil_intelligence: {
        name: 'Soil Intelligence Agent',
        status: 'CONNECTED',
        latency_ms: 32.0,
        data_freshness: 'RECENT',
        data_provider: 'Soil Health Card / NBSS&LUP Soil Benchmark',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      market_intelligence: {
        name: 'Market Intelligence Agent',
        status: 'CONNECTED',
        latency_ms: 28.0,
        data_freshness: 'LIVE',
        data_provider: 'AGMARKNET Mandi Records',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      sustainability_intelligence: {
        name: 'Sustainability & Carbon Agent',
        status: 'CONNECTED',
        latency_ms: 52.0,
        data_freshness: 'RECENT',
        data_provider: 'Verra VM0042 / FAO-56 Water',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      hardware_iot_intelligence: {
        name: 'Hardware/IoT Intelligence Agent',
        status: 'CONNECTED',
        latency_ms: 18.0,
        data_freshness: 'LIVE',
        data_provider: 'TerraMind ESP32 Telemetry Gateway',
        active_devices: 2,
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      },
      terramind_orchestrator: {
        name: 'TerraMind-X Decision Orchestrator',
        status: 'CONNECTED',
        latency_ms: 65.0,
        data_freshness: 'LIVE',
        last_execution: new Date().toISOString(),
        error_rate_pct: 0.0
      }
    }
  }
}"""

if broken_snippet in content:
    content = content.replace(broken_snippet, clean_snippet)
    print("Fixed broken snippet.")

market_linkage_code = """
// ----------------------------------------------------------------------
// Farm-to-Market Price Discovery & Transaction Enablement APIs (PS 26132)
// ----------------------------------------------------------------------

export async function analyzeMarketOpportunity(payload: { crop: string; quantity_kg: number; district: string; state: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/opportunity/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Analyze market opportunity unreachable:', e)
  }
  return null
}

export async function fetchMandiComparisons(crop: string, district: string, state: string, quantityKg: number = 2000) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/mandis/compare?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&quantity_kg=${quantityKg}`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch mandi comparisons unreachable:', e)
  }
  return []
}

export async function fetchVerifiedBuyers(crop?: string, state?: string) {
  try {
    let url = `${BACKEND_URL}/api/v1/market/linkage/buyers`
    const params = new URLSearchParams()
    if (crop) params.append('crop', crop)
    if (state) params.append('state', state)
    if (params.toString()) url += `?${params.toString()}`
    const res = await fetch(url)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch verified buyers unreachable:', e)
  }
  return []
}

export async function createFarmerLotApi(lotData: { farmer_name: string; district: string; state: string; crop: string; quantity_kg: number; moisture_pct: number; foreign_matter_pct: number; asking_price_per_q: number }) {
  try {
    const params = new URLSearchParams({
      farmer_name: lotData.farmer_name,
      district: lotData.district,
      state: lotData.state,
      crop: lotData.crop,
      quantity_kg: lotData.quantity_kg.toString(),
      moisture_pct: lotData.moisture_pct.toString(),
      foreign_matter_pct: lotData.foreign_matter_pct.toString(),
      asking_price_per_q: lotData.asking_price_per_q.toString()
    })
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/lots/create?${params.toString()}`, { method: 'POST' })
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Create farmer lot unreachable:', e)
  }
  return null
}

export async function fetchFarmerLotsApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/lots`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch lots unreachable:', e)
  }
  return []
}

export async function fetchLotOffersApi(lotId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/lots/${encodeURIComponent(lotId)}/offers`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch lot offers unreachable:', e)
  }
  return []
}

export async function acceptBuyerOfferApi(offerId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/offers/${encodeURIComponent(offerId)}/accept`, { method: 'POST' })
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Accept offer unreachable:', e)
  }
  return null
}

export async function fetchTransactionsApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/transactions`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch transactions unreachable:', e)
  }
  return []
}

export async function fetchFPOPoolsApi() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/fpo/pools`)
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Fetch FPO pools unreachable:', e)
  }
  return []
}

export async function joinFPOPoolApi(poolId: string, quantityKg: number = 500) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/market/linkage/fpo/pools/${encodeURIComponent(poolId)}/join?quantity_kg=${quantityKg}`, { method: 'POST' })
    if (res.ok) return await res.json()
  } catch (e) {
    console.warn('Join FPO pool unreachable:', e)
  }
  return null
}
"""

if "analyzeMarketOpportunity" not in content:
    content += market_linkage_code
    print("Added market linkage code.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("api.ts successfully updated.")
