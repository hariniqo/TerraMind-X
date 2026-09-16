import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { apiRequest } from '../../api/client'

export function HealthStatusBanner() {
  const [healthy, setHealthy] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await apiRequest<{ status: string }>('/health', {
        method: 'GET',
        skipAuth: true,
        timeoutMs: 5000,
        retries: 0,
      })
      setHealthy(res.status === 'healthy')
    } catch {
      setHealthy(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 60000)
    return () => clearInterval(interval)
  }, [])

  if (healthy === null) return null

  return (
    <div
      className={`px-4 py-2 border-b text-xs flex items-center justify-between transition-colors ${
        healthy
          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
          : 'bg-amber-950/40 border-amber-500/20 text-amber-300'
      }`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {healthy ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">TerraMind services available</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">Some services are temporarily unavailable</span>
          </>
        )}

        <button
          onClick={checkHealth}
          disabled={loading}
          className="ml-auto flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity font-mono text-[11px] underline"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh status</span>
        </button>
      </div>
    </div>
  )
}
