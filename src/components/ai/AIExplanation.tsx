import React from 'react'

export function AIExplanation({ result }: { result?: any }) {
  const demo = result ?? {
    recommendation: 'Consider chilli instead of tomato.',
    why: ['High regional tomato saturation', 'Soil fit good but market risk high'],
    dataSources: ['AGMARKNET prices', 'Regional adoption model', 'Soil sensors'],
    confidence: 91,
    action: 'Shift 40% area to chilli or harvest 2 weeks earlier',
  }

  return (
    <div className="rounded-2xl border border-terra-200 bg-terra-50 p-4 dark:bg-[#071013] dark:border-neutral-700">
      <h3 className="text-lg font-semibold">AI Explanation</h3>
      <p className="mt-2 text-sm text-terra-600">Recommendation: <strong className="text-terra-900 dark:text-terra-50">{demo.recommendation}</strong></p>

      <div className="mt-3">
        <div className="text-sm font-semibold">Why?</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-terra-600">
          {demo.why.map((w: string) => <li key={w}>{w}</li>)}
        </ul>
      </div>

      <div className="mt-3">
        <div className="text-sm font-semibold">Data used</div>
        <div className="mt-2 text-sm text-terra-600">{demo.dataSources.join(', ')}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="text-sm font-semibold">Confidence</div>
          <div className="mt-1 text-2xl font-semibold text-terra-900 dark:text-terra-50">{demo.confidence}%</div>
        </div>
        <div>
          <div className="text-sm font-semibold">Action</div>
          <div className="mt-1 text-sm text-terra-600">{demo.action}</div>
        </div>
      </div>
    </div>
  )
}

export default AIExplanation
