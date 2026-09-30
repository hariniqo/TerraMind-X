// Open-Meteo ingestion module — keyless, CORS-open.
// URL builders + normalizers for Forecast, Ensemble, and Historical (ERA5 reanalysis) APIs.
// Designed to be called from a future Builder+ backend function for scheduled sync.
// No API key required for the free non-commercial tier. Never fabricates values.

export const OPEN_METEO = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  ensemble: 'https://ensemble-api.open-meteo.com/v1/ensemble',
  archive: 'https://archive-api.open-meteo.com/v1/archive',
};

export const CURRENT_VARS = [
  'temperature_2m', 'relative_humidity_2m', 'precipitation', 'rain', 'showers',
  'precipitation_probability', 'weather_code', 'cloud_cover', 'wind_speed_10m',
  'wind_direction_10m', 'wind_gusts_10m', 'surface_pressure', 'visibility',
  'evapotranspiration', 'et0_fao_evapotranspiration', 'vapour_pressure_deficit',
  'soil_temperature_0cm', 'soil_moisture_0_1cm',
];
export const DAILY_FORECAST_VARS = [
  'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
  'precipitation_probability_max', 'et0_fao_evapotranspiration_sum',
];
export const DAILY_HIST_VARS = [
  'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
  'et0_fao_evapotranspiration_sum',
];

export function buildForecastUrl(lat, lon, days = 7) {
  return `${OPEN_METEO.forecast}?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_VARS.join(',')}` +
    `&daily=${DAILY_FORECAST_VARS.join(',')}` +
    `&timezone=Asia/Kolkata&forecast_days=${days}`;
}
export function buildEnsembleUrl(lat, lon) {
  return `${OPEN_METEO.ensemble}?latitude=${lat}&longitude=${lon}` +
    `&hourly=precipitation,temperature_2m&models=icon_seamless&timezone=Asia/Kolkata`;
}
export function buildHistoricalUrl(lat, lon, startDate, endDate) {
  return `${OPEN_METEO.archive}?latitude=${lat}&longitude=${lon}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=${DAILY_HIST_VARS.join(',')}&timezone=Asia/Kolkata`;
}

// WMO weather code → emoji + label
export const WMO = {
  0: { e: '☀️', l: 'Clear' }, 1: { e: '🌤️', l: 'Mainly clear' }, 2: { e: '⛅', l: 'Partly cloudy' },
  3: { e: '☁️', l: 'Overcast' }, 45: { e: '🌫️', l: 'Fog' }, 48: { e: '🌫️', l: 'Rime fog' },
  51: { e: '🌦️', l: 'Light drizzle' }, 53: { e: '🌦️', l: 'Drizzle' }, 55: { e: '🌧️', l: 'Dense drizzle' },
  61: { e: '🌧️', l: 'Slight rain' }, 63: { e: '🌧️', l: 'Rain' }, 65: { e: '🌧️', l: 'Heavy rain' },
  71: { e: '🌨️', l: 'Slight snow' }, 73: { e: '🌨️', l: 'Snow' }, 75: { e: '❄️', l: 'Heavy snow' },
  80: { e: '🌦️', l: 'Slight showers' }, 81: { e: '🌧️', l: 'Showers' }, 82: { e: '⛈️', l: 'Violent showers' },
  95: { e: '⛈️', l: 'Thunderstorm' }, 96: { e: '⛈️', l: 'Thunderstorm + hail' }, 99: { e: '⛈️', l: 'Thunderstorm + heavy hail' },
};
export function wmo(code) { return WMO[code] || { e: '🌡️', l: '—' }; }

// Ensemble spread → uncertainty label (based on precipitation mm spread)
export function uncertaintyLabel(spread) {
  if (spread == null) return 'Data unavailable';
  if (spread < 0.5) return 'Low';
  if (spread < 2) return 'Moderate';
  return 'High';
}

// Normalize a forecast API response into WeatherData-shaped records.
export function normalizeForecast(json, locationId, sourceUrl) {
  const out = [];
  const now = new Date().toISOString();
  const c = json.current;
  if (c) {
    out.push({
      location_id: locationId, latitude: json.latitude, longitude: json.longitude,
      observation_time: c.time ? new Date(c.time + ':00+05:30').toISOString() : now,
      retrieved_at: now,
      temperature: c.temperature_2m, humidity: c.relative_humidity_2m,
      rainfall: c.precipitation, precipitation_probability: c.precipitation_probability,
      rain: c.rain, showers: c.showers,
      wind_speed: c.wind_speed_10m, wind_direction: c.wind_direction_10m, wind_gust: c.wind_gusts_10m,
      pressure: c.surface_pressure, cloud_cover: c.cloud_cover, visibility: c.visibility,
      et0: c.et0_fao_evapotranspiration, evapotranspiration: c.evapotranspiration,
      vapour_pressure_deficit: c.vapour_pressure_deficit,
      soil_temperature: c.soil_temperature_0cm, soil_moisture: c.soil_moisture_0_1cm,
      weather_source: 'Open-Meteo', model_name: 'best_match', model_provider: 'Open-Meteo',
      forecast_run: c.time, data_type: 'forecast',
      source_url: sourceUrl, verification_status: 'source_available', status: 'available',
    });
  }
  const d = json.daily;
  if (d) {
    for (let i = 0; i < d.time.length; i++) {
      out.push({
        location_id: locationId, latitude: json.latitude, longitude: json.longitude,
        observation_time: new Date(d.time[i] + 'T12:00:00+05:30').toISOString(),
        retrieved_at: now,
        temperature_max: d.temperature_2m_max[i], temperature_min: d.temperature_2m_min[i],
        rainfall: d.precipitation_sum[i], precipitation_probability: d.precipitation_probability_max[i],
        et0: d.et0_fao_evapotranspiration_sum[i],
        weather_source: 'Open-Meteo', model_name: 'best_match', model_provider: 'Open-Meteo',
        forecast_run: d.time[i], data_type: 'forecast',
        source_url: sourceUrl, verification_status: 'source_available', status: 'available',
      });
    }
  }
  return out;
}

export function normalizeHistorical(json, locationId, sourceUrl) {
  const out = []; const now = new Date().toISOString(); const d = json.daily;
  if (!d) return out;
  for (let i = 0; i < d.time.length; i++) {
    out.push({
      location_id: locationId, latitude: json.latitude, longitude: json.longitude,
      observation_time: new Date(d.time[i] + 'T12:00:00+05:30').toISOString(),
      retrieved_at: now,
      temperature_max: d.temperature_2m_max[i], temperature_min: d.temperature_2m_min[i],
      rainfall: d.precipitation_sum[i], et0: d.et0_fao_evapotranspiration_sum[i],
      weather_source: 'Open-Meteo Archive', model_name: 'era5_reanalysis', model_provider: 'ECMWF (via Open-Meteo)',
      forecast_run: d.time[i], data_type: 'historical_reanalysis',
      source_url: sourceUrl, verification_status: 'verified', status: 'available',
    });
  }
  return out;
}

// ── Multi-model support ──
// Distinct global models with preserved identity (never averaged blindly).
export const MODELS = [
  { name: 'icon_global', provider: 'DWD', resolution_km: 13 },
  { name: 'gfs_global', provider: 'NOAA', resolution_km: 27 },
  { name: 'gem_global', provider: 'Environment Canada', resolution_km: 15 },
  { name: 'ecmwf_ifs025', provider: 'ECMWF', resolution_km: 25 },
];

export function buildForecastUrlModel(lat, lon, model, days = 7) {
  return `${OPEN_METEO.forecast}?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration_sum` +
    `&models=${model}&timezone=Asia/Kolkata&forecast_days=${days}`;
}

// Dedup key — one record per (location, model, data_type, valid time). Prevents duplicate sync inserts.
export function dedupKey(r) {
  return [r.location_id, r.model_name, r.data_type, r.observation_time].join('|');
}

// Normalize a single-model daily forecast, preserving model identity + resolution + forecast_time.
export function normalizeModelForecast(json, model, locationId, sourceUrl) {
  const out = []; const now = new Date().toISOString(); const d = json.daily;
  if (!d) return out;
  const meta = MODELS.find((m) => m.name === model) || { provider: 'Open-Meteo', resolution_km: null };
  for (let i = 0; i < d.time.length; i++) {
    const valid = new Date(d.time[i] + 'T12:00:00+05:30').toISOString();
    out.push({
      location_id: locationId, latitude: json.latitude, longitude: json.longitude,
      observation_time: valid, forecast_time: valid, retrieved_at: now,
      temperature_max: d.temperature_2m_max[i], temperature_min: d.temperature_2m_min[i],
      rainfall: d.precipitation_sum[i], precipitation_probability: d.precipitation_probability_max[i],
      et0: d.et0_fao_evapotranspiration_sum[i],
      weather_source: 'Open-Meteo', model_name: model, model_provider: meta.provider,
      model_resolution_km: meta.resolution_km, forecast_run: d.time[i], data_type: 'forecast',
      source_url: sourceUrl, verification_status: 'source_available', status: 'available',
    });
  }
  return out;
}

export function normalizeEnsemble(json, locationId, sourceUrl, hours = 24) {
  const now = new Date().toISOString();
  const members = [];
  for (let m = 1; m <= 40; m++) {
    const key = `precipitation_member${String(m).padStart(2, '0')}`;
    if (json.hourly && json.hourly[key]) members.push(json.hourly[key]);
  }
  const flat = members.map((a) => a.slice(0, hours)).flat().filter((v) => v != null);
  if (!flat.length) return null;
  const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
  const variance = flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length;
  const spread = Math.sqrt(variance);
  return {
    location_id: locationId, latitude: json.latitude, longitude: json.longitude,
    observation_time: now, retrieved_at: now,
    rainfall: mean, ensemble_mean: mean, ensemble_spread: spread,
    weather_source: 'Open-Meteo Ensemble', model_name: 'icon_seamless', model_provider: 'DWD (via Open-Meteo)',
    forecast_run: 'icon_seamless', data_type: 'ensemble',
    source_url: sourceUrl, verification_status: 'source_available', status: 'available',
  };
}