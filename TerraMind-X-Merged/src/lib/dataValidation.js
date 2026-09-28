// Shared validation layer for the real-data pipeline.
// Used by ingestion (marketIngest) and agent input checks BEFORE records reach agents.
// Invalid records are marked validation_status = failed and never silently used.

export function validateRequired(record, fields) {
  const missing = fields.filter((f) => record[f] == null || record[f] === '')
  return { valid: missing.length === 0, missing }
}

export function validateNumericRange(value, min, max) {
  if (value == null || value === '') return { valid: true } // missing is handled by required check
  const n = Number(value)
  if (isNaN(n)) return { valid: false, reason: 'not a number' }
  if (min != null && n < min) return { valid: false, reason: `below ${min}` }
  if (max != null && n > max) return { valid: false, reason: `above ${max}` }
  return { valid: true }
}

export function validateDate(value) {
  if (!value) return { valid: true }
  const d = new Date(value)
  return { valid: !isNaN(d.getTime()), reason: isNaN(d.getTime()) ? 'invalid date' : null }
}

// Validate a record against a field spec: { field: { type, required, min, max } }
export function validateRecord(record, spec) {
  const errors = []
  const requiredFields = Object.entries(spec).filter(([, s]) => s.required).map(([f]) => f)
  const req = validateRequired(record, requiredFields)
  if (!req.valid) errors.push(...req.missing.map((f) => `${f}: required`))
  for (const [f, s] of Object.entries(spec)) {
    if (s.type === 'number') {
      const r = validateNumericRange(record[f], s.min, s.max)
      if (!r.valid) errors.push(`${f}: ${r.reason}`)
    }
    if (s.type === 'date') {
      const r = validateDate(record[f])
      if (!r.valid) errors.push(`${f}: ${r.reason}`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function validationStatus(result) {
  return result.valid ? 'validated' : 'failed'
}

// MarketPrice field spec — used by the ingestion pipeline.
export const MARKET_PRICE_SPEC = {
  commodity: { required: true },
  market_name: { required: true },
  district: { required: true },
  modal_price: { type: 'number', required: true, min: 0 },
  min_price: { type: 'number', min: 0 },
  max_price: { type: 'number', min: 0 },
  trading_date: { type: 'date', required: true },
  source: { required: true },
}