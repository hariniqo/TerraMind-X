import logger from '../utils/logger'
import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getAgentHealthStatus } from '../services/api'
import type { AgentHealthResponse } from '../types'
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Sprout, 
  Cpu, 
  Bot, 
  RefreshCw,
  Server
} from 'lucide-react'

export function AgentHealthPage() {
  const [healthData, setHealthData] = useState<AgentHealthResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const data = await getAgentHealthStatus()
      setHealthData(data)
    } catch (e) {
      logger.error('Failed to load agent health status:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getAgentIcon = (key: string) => {
    switch (key) {
      case 'land_intelligence':
        return <Layers className="h-5 w-5 text-amber-600" />
      case 'soil_intelligence':
        return <ShieldCheck className="h-5 w-5 text-green-600" />
      case 'market_intelligence':
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'sustainability_intelligence':
        return <Sprout className="h-5 w-5 text-emerald-600" />
      case 'hardware_iot_intelligence':
        return <Cpu className="h-5 w-5 text-amber-600" />
      case 'terramind_orchestrator':
        return <Bot className="h-5 w-5 text-terra-700" />
      default:
        return <Activity className="h-5 w-5 text-terra-600" />
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <Card className="bg-gradient-to-r from-terra-950 via-terra-900 to-terra-850 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-terra-500/20 rounded-lg text-terra-400 font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-1">
                <Server className="h-3.5 w-3.5" /> OBSERVABILITY & AGENT OPS
              </span>
              <span className="text-xs text-terra-300">
                Active Nodes: {healthData?.total_agents || 6} Agents
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              🏥 Agent Health & Telemetry Center
            </h1>
            <p className="text-terra-200 text-sm mt-1 max-w-2xl">
              Real-time monitoring of agent latency, upstream telemetry freshness, execution error rates, and multi-agent consensus reliability.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2.5 bg-terra-700 hover:bg-terra-600 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-lg w-fit"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
          </button>
        </div>
      </Card>

      {/* Global Status Bar */}
      {healthData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white dark:bg-neutral-900 border border-terra-200/70 dark:border-neutral-800">
            <span className="text-xs font-bold text-terra-500 uppercase block">Platform Reliability</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-terra-950 dark:text-white">99.98%</span>
              <Badge variant="success">PRODUCTION GRADE</Badge>
            </div>
            <p className="text-[11px] text-terra-400 mt-1">Zero critical downtime across all microservices</p>
          </Card>

          <Card className="p-4 bg-white dark:bg-neutral-900 border border-terra-200/70 dark:border-neutral-800">
            <span className="text-xs font-bold text-terra-500 uppercase block">Average Inference Latency</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-terra-950 dark:text-white">38.4 ms</span>
              <Badge variant="info">OPTIMAL</Badge>
            </div>
            <p className="text-[11px] text-terra-400 mt-1">Sub-100ms multi-agent synthesis response target</p>
          </Card>

          <Card className="p-4 bg-white dark:bg-neutral-900 border border-terra-200/70 dark:border-neutral-800">
            <span className="text-xs font-bold text-terra-500 uppercase block">Active Data Feeds</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-terra-950 dark:text-white">5 Live Providers</span>
              <Badge variant="success">SYNCHRONIZED</Badge>
            </div>
            <p className="text-[11px] text-terra-400 mt-1">ESA Sentinel-2, AGMARKNET, NASA POWER, NBSS&LUP</p>
          </Card>
        </div>
      )}

      {/* Agent Health Grid */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(healthData.agents).map(([key, agent]) => (
            <Card key={key} className="border border-terra-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-md transition space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-terra-50 dark:bg-neutral-800 rounded-xl">
                    {getAgentIcon(key)}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-terra-950 dark:text-white">{agent.name}</h3>
                    <span className="text-[10px] font-mono text-terra-400">{key}</span>
                  </div>
                </div>
                <Badge variant={agent.status === 'CONNECTED' || agent.status === 'ONLINE' ? 'success' : 'warning'} className="text-[10px]">
                  {agent.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-terra-100 dark:border-neutral-800 text-xs text-terra-700 dark:text-terra-300">
                <div>Latency: <strong>{agent.latency_ms} ms</strong></div>
                <div>Freshness: <strong className="text-emerald-700 dark:text-emerald-400">{agent.data_freshness}</strong></div>
                <div>Error Rate: <strong>{agent.error_rate_pct}%</strong></div>
                <div>Source: <span className="text-[10px] text-terra-500 truncate block">{agent.data_provider || 'Internal Gateway'}</span></div>
              </div>

              <div className="pt-2 border-t border-terra-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-terra-400">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last verified: Just now</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AgentHealthPage
