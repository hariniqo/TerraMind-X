import { useState, useEffect } from 'react'
import { Header, ScoreCircle } from '@/components/terra/shared'
import { VerificationBadge } from '@/components/terra/DataStatus'
import { assessSuitability, CROP_REF, REF_SOURCE, monthLabel } from '@/lib/cropSuitability'

const VERDICT_STYLE = {
  Suitable: { tag: 'tag-good', label: 'Suitable' },
  Conditional: { tag: 'tag-medium', label: 'Conditional' },
  'Not suitable': { tag: 'tag-urgent', label: 'Not suitable' },
}

export function CropSuitabilityScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [previousCrop, setPreviousCrop] = useState('')
  const [runKey, setRunKey] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      setStatus('loading')
      try {
        const result = await assessSuitability({ previousCrop: previousCrop || null })
        if (active) {
          setData(result)
          setStatus(result.status)
        }
      } catch {
        if (active) setStatus('error')
      }
    })()
    return () => { active = false }
  }, [previousCrop, runKey])

  return (
    <div className="topo min-h-screen pb-8 text-white">
      <Header title="Crop suitability" onBack={() => onNav('dashboard')} />
      <main className="space-y-3 px-5">
        {status === 'loading' && <p role="status">Checking source data...</p>}
        {status === 'no_location' && <p>No farm location is registered.</p>}
        {status === 'error' && <p>Suitability data could not be loaded.</p>}
        {data?.status === 'ok' && data.recommendations.map((item) => (
          <article key={item.key} className="flex items-center gap-3 rounded-xl bg-app-surface p-4">
            <ScoreCircle score={item.score} size={56} />
            <div>
              <h2 className="font-semibold">{item.crop}</h2>
              <p className="text-sm text-white/60">{VERDICT_STYLE[item.verdict]?.label || item.verdict} · {item.confidence}% confidence</p>
              <p className="text-xs text-white/45">Sowing: {item.sowing_months.map(monthLabel).join(', ')}</p>
              <VerificationBadge status={data.soil?.verification_status} />
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}