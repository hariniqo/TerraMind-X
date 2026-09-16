import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { getMarketData, calculateProfit } from '../services/api'
import { useTranslation } from '../hooks/useTranslation'
import type { MarketItem, ProfitInput, ProfitResult } from '../types'

const initialInput: ProfitInput = {
  crop: 'Groundnut',
  area: 5,
  yield: 300,
  price: 50,
  seedCost: 12000,
  fertilizerCost: 8000,
  laborCost: 15000,
  irrigationCost: 3000,
  otherCost: 2000,
}

export function ProfitPage() {
  const { t } = useTranslation()
  const [market, setMarket] = useState<MarketItem[]>([])
  const [input, setInput] = useState<ProfitInput>(initialInput)
  const [result, setResult] = useState<ProfitResult | null>(null)

  useEffect(() => {
    getMarketData().then(setMarket)
  }, [])

  const handleChange = (field: keyof ProfitInput, value: string) => {
    setInput((current) => ({
      ...current,
      [field]: field === 'crop' ? value : Number(value),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const profitResult = await calculateProfit(input)
    setResult(profitResult)
  }

  return (
    <div className="space-y-6">
      <Card title="Profit planner">
        <p className="text-terra-600">Estimate revenue, cost, and margin for your crop plan.</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-terra-600">
                Crop
                <select
                  value={input.crop}
                  onChange={(event) => handleChange('crop', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                >
                  {market.map((item) => (
                    <option key={item.crop} value={item.crop}>
                      {item.crop}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-terra-600">
                Area (acres)
                <input
                  type="number"
                  value={input.area}
                  onChange={(event) => handleChange('area', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-terra-600">
                Yield (kg)
                <input
                  type="number"
                  value={input.yield}
                  onChange={(event) => handleChange('yield', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="space-y-2 text-sm text-terra-600">
                Price (₹/kg)
                <input
                  type="number"
                  value={input.price}
                  onChange={(event) => handleChange('price', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-terra-600">
                Seed cost
                <input
                  type="number"
                  value={input.seedCost}
                  onChange={(event) => handleChange('seedCost', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="space-y-2 text-sm text-terra-600">
                Fertilizer cost
                <input
                  type="number"
                  value={input.fertilizerCost}
                  onChange={(event) => handleChange('fertilizerCost', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-terra-600">
                Labor cost
                <input
                  type="number"
                  value={input.laborCost}
                  onChange={(event) => handleChange('laborCost', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="space-y-2 text-sm text-terra-600">
                Irrigation cost
                <input
                  type="number"
                  value={input.irrigationCost}
                  onChange={(event) => handleChange('irrigationCost', event.target.value)}
                  className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-terra-600">
              Other costs
              <input
                type="number"
                value={input.otherCost}
                onChange={(event) => handleChange('otherCost', event.target.value)}
                className="w-full rounded-3xl border border-terra-200 bg-terra-50 px-4 py-3 text-terra-900 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>

            <Button type="submit">Calculate profit</Button>
          </form>
        </Card>

        <Card title="Result">
          {result ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-terra-50 p-4">
                  <p className="text-sm text-terra-600">Revenue</p>
                  <p className="mt-2 text-2xl font-semibold text-terra-900">₹{result.revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl bg-terra-50 p-4">
                  <p className="text-sm text-terra-600">Total cost</p>
                  <p className="mt-2 text-2xl font-semibold text-terra-900">₹{result.totalCost.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-terra-50 p-4">
                <p className="text-sm text-terra-600">Profit</p>
                <p className="mt-2 text-3xl font-semibold text-terra-900">₹{result.profit.toLocaleString()}</p>
                <p className="mt-1 text-sm text-terra-600">Margin {result.margin}% · Risk {result.risk}</p>
              </div>
            </div>
          ) : (
            <p className="text-terra-600">Complete the form to see a profit estimate.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
