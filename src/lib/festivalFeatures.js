// Festival feature engineering from REAL FestivalCalendar + MarketPrice records.
// No synthetic values. Historical festival response computed only when enough data.

const DAY = 86400000

// Next upcoming festival occurrence from real records; falls back to most-recent past.
export function daysToNextFestival(festivalRecords, now = new Date()) {
  const withDates = (festivalRecords || [])
    .filter((f) => f && f.start_date)
    .map((f) => ({ ...f, _t: new Date(f.start_date).getTime() }))
    .filter((f) => !isNaN(f._t))
  const upcoming = withDates.filter((f) => f._t >= now.getTime()).sort((a, b) => a._t - b._t)
  if (upcoming.length) return { festival: upcoming[0], days: Math.round((upcoming[0]._t - now.getTime()) / DAY), isPast: false }
  const past = withDates.filter((f) => f._t < now.getTime()).sort((a, b) => b._t - a._t)
  if (past.length) return { festival: past[0], days: Math.round((past[0]._t - now.getTime()) / DAY), isPast: true }
  return null
}

export function festivalWindowFlags(days) {
  if (days == null) return { days_to_festival: null, festival_in_7_days: false, festival_in_30_days: false, festival_in_60_days: false, festival_in_90_days: false }
  const d = days >= 0 ? days : null
  return {
    days_to_festival: d,
    festival_in_7_days: d != null && d <= 7,
    festival_in_30_days: d != null && d <= 30,
    festival_in_60_days: d != null && d <= 60,
    festival_in_90_days: d != null && d <= 90,
  }
}

// Historical festival-period price response, computed ONLY from real records.
// Compares avg modal_price during past festival windows vs non-festival periods.
export function historicalFestivalResponse(festivalRecords, prices, peakDaysBefore = 14) {
  const windows = (festivalRecords || [])
    .filter((f) => f && f.start_date)
    .map((f) => {
      const start = new Date(f.start_date).getTime() - peakDaysBefore * DAY
      const end = new Date(f.end_date || f.start_date).getTime()
      return { name: f.festival_name, start, end }
    })
  const festPrices = []
  const nonFestPrices = []
  for (const p of prices || []) {
    if (!p || !p.trading_date || p.modal_price == null) continue
    const t = new Date(p.trading_date).getTime()
    if (isNaN(t)) continue
    const inFest = windows.some((w) => t >= w.start && t <= w.end)
    if (inFest) festPrices.push(Number(p.modal_price))
    else nonFestPrices.push(Number(p.modal_price))
  }
  const windowsWithData = windows.filter((w) =>
    (prices || []).some((p) => {
      const t = new Date(p.trading_date).getTime()
      return !isNaN(t) && t >= w.start && t <= w.end && p.modal_price != null
    })
  ).length
  if (festPrices.length < 2 || nonFestPrices.length < 10 || windowsWithData < 2) {
    return { status: 'insufficient', festSamples: festPrices.length, nonFestSamples: nonFestPrices.length, windowsWithData }
  }
  const avg = (a) => a.reduce((s, b) => s + b, 0) / a.length
  const festAvg = avg(festPrices)
  const nonFestAvg = avg(nonFestPrices)
  const upliftPct = Math.round(((festAvg / nonFestAvg) - 1) * 1000) / 10
  return {
    status: 'ok',
    festAvg: Math.round(festAvg), nonFestAvg: Math.round(nonFestAvg),
    upliftPct, festSamples: festPrices.length, nonFestSamples: nonFestPrices.length, windowsWithData,
  }
}