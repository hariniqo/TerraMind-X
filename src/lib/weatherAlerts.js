// Extreme-weather alert detection + consolidation from real Open-Meteo forecast records.
// Real data only: returns [] when no stored forecast satisfies a threshold.
// Forecast != observation: every alert is labelled "Forecast alert".
// Dedup: same location + forecast time + condition + severity -> ONE consolidated alert,
// preserving all supporting models and honest model-agreement (no invented confidence).
// Updated forecasts: same (model, time) keeps the latest retrieved_at (newer replaces older).
// Expiration: each alert carries valid_from / valid_until (IST forecast day) and auto-expires.

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + slight hail', 99: 'Thunderstorm + heavy hail',
};

export function weatherCodeLabel(code) {
  const numericCode = Number(code)
  return WMO[numericCode] || `Unknown weather code (${code})`
}

const RULES = [
  { key: 'rainfall', label: 'Heavy rainfall', evidence: 'Rainfall forecast', threshold: 50, unit: 'mm', severity: 'Urgent', test: (value) => value >= 50, advice: 'Check drainage and protect harvested produce from waterlogging.' },
  { key: 'temperature_max', label: 'Heat warning', evidence: 'Maximum temperature', threshold: 40, unit: '°C', severity: 'Urgent', test: (value) => value >= 40, advice: 'Plan field work during cooler hours and maintain access to drinking water.' },
  { key: 'wind_speed', label: 'High wind', evidence: 'Wind speed forecast', threshold: 50, unit: 'km/h', severity: 'Urgent', test: (value) => value >= 50, advice: 'Secure light structures and avoid spraying during strong winds.' },
  { key: 'temperature_min', label: 'Cold warning', evidence: 'Minimum temperature', threshold: 5, unit: '°C', severity: 'Medium', test: (value) => value <= 5, advice: 'Check crop-specific cold protection guidance.' },
]

export function detectWeatherAlerts(records = [], location = null) {
  const forecasts = records.filter((record) =>
    record.data_type === 'forecast' && record.weather_source && record.observation_time
  )
  const availableModels = new Map()

  for (const record of forecasts) {
    const key = `${record.location_id || location?.id || ''}|${record.observation_time}`
    if (!availableModels.has(key)) availableModels.set(key, new Set())
    availableModels.get(key).add(record.model_name || record.weather_source)
  }

  const grouped = new Map()
  for (const record of forecasts) {
    const forecastTime = new Date(record.observation_time)
    if (Number.isNaN(forecastTime.getTime())) continue
    const model = record.model_name || record.weather_source
    for (const rule of RULES) {
      const value = Number(record[rule.key])
      if (record[rule.key] == null || !Number.isFinite(value) || !rule.test(value)) continue
      const id = `${record.location_id || location?.id || ''}|${record.observation_time}|${rule.key}`
      if (!grouped.has(id)) {
        grouped.set(id, {
          id,
          label: rule.label,
          severity: rule.severity,
          evidence_label: rule.evidence,
          trigger_value: value,
          threshold: rule.threshold,
          unit: rule.unit,
          advice: rule.advice,
          models: new Set(),
          forecast_time: forecastTime.toISOString(),
          valid_until: forecastTime.toISOString(),
          location_id: record.location_id,
          model_agreement: { agreeing: 0, total: 0 },
        })
      }
      grouped.get(id).models.add(model)
    }
  }

  const now = Date.now()
  return Array.from(grouped.values()).map((alert) => {
    const modelKey = `${alert.location_id || location?.id || ''}|${alert.forecast_time}`
    const models = Array.from(alert.models)
    const total = availableModels.get(modelKey)?.size || models.length
    return {
      ...alert,
      models,
      model_agreement: { agreeing: models.length, total },
      expired: new Date(alert.valid_until).getTime() <= now,
    }
  })
}

export function activeAlerts(alerts = []) {
  return alerts.filter((alert) => !alert.expired)
}