// Client-side CSV export — no backend needed. Produces a .csv that opens in
// Excel / Google Sheets / Numbers. Values are RFC-4180 quoted as needed.
export function exportToCSV(rows, columns, filename) {
  const header = columns.map((c) => c.label).join(',')
  const body = (rows || []).map((r) =>
    columns.map((c) => {
      const v = r[c.key]
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }).join(',')
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Combined permanent record: market prices + arrivals in one spreadsheet file.
// Long format with a Record Type column so both datasets live in a single sheet.
export function exportMarketSnapshot(prices, arrivals, cropMap = {}) {
  const COLUMNS = [
    { key: 'record_type', label: 'Record Type' },
    { key: 'commodity', label: 'Commodity' },
    { key: 'market_name', label: 'Market' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'date', label: 'Date' },
    { key: 'modal_price', label: 'Modal Price' },
    { key: 'min_price', label: 'Min Price' },
    { key: 'max_price', label: 'Max Price' },
    { key: 'price_unit', label: 'Price Unit' },
    { key: 'arrival_quantity', label: 'Arrival Qty' },
    { key: 'arrival_unit', label: 'Arrival Unit' },
    { key: 'source', label: 'Source' },
    { key: 'verification_status', label: 'Verification' },
    { key: 'retrieved_at', label: 'Retrieved At' },
  ]
  const priceRows = (prices || []).map((p) => ({
    record_type: 'Price', commodity: p.commodity || cropMap[p.crop_id] || '',
    market_name: p.market_name || '', district: p.district || '', state: p.state || '',
    date: p.trading_date || '', modal_price: p.modal_price ?? '', min_price: p.min_price ?? '',
    max_price: p.max_price ?? '', price_unit: p.price_unit || '',
    arrival_quantity: p.arrival_quantity ?? '', arrival_unit: p.arrival_unit || '',
    source: p.source || '', verification_status: p.verification_status || '',
    retrieved_at: p.fetched_at || '',
  }))
  const arrivalRows = (arrivals || []).map((a) => ({
    record_type: 'Arrival', commodity: cropMap[a.crop_id] || a.crop_id || '',
    market_name: a.market_name || '', district: '', state: '',
    date: a.date || '', modal_price: '', min_price: '', max_price: '', price_unit: '',
    arrival_quantity: a.arrival_quantity ?? '', arrival_unit: a.arrival_unit || '',
    source: a.source || '', verification_status: '', retrieved_at: a.fetched_at || '',
  }))
  const filename = `terramind-market-snapshot-${new Date().toISOString().slice(0, 10)}.csv`
  exportToCSV([...priceRows, ...arrivalRows], COLUMNS, filename)
}