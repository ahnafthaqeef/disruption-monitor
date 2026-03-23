'use client'

import { useState } from 'react'

interface NewsItem {
  title: string
  snippet: string
  source: string
  date: string
}

interface MonitorResult {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  risk_score: number
  summary: string
  active_disruptions: string[]
  affected_commodities: string[]
  impact_assessment: string
  mitigations: string[]
  outlook: string
  news: NewsItem[]
}

const ROUTES = [
  'Strait of Malacca',
  'Port Klang, Malaysia',
  'South China Sea',
  'Red Sea / Suez Canal',
  'Trans-Pacific (Asia → US West Coast)',
  'Asia → Europe (via Suez)',
  'Port of Singapore',
  'Port of Shanghai',
  'Lombok Strait, Indonesia',
  'Taiwan Strait',
]

const RISK_COLORS: Record<string, string> = {
  LOW: 'text-green-400 bg-green-950/30 border-green-900/40',
  MEDIUM: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40',
  HIGH: 'text-orange-400 bg-orange-950/30 border-orange-900/40',
  CRITICAL: 'text-red-400 bg-red-950/30 border-red-900/40',
}

const RISK_BAR: Record<string, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
}

export default function DisruptionMonitor() {
  const [route, setRoute] = useState(ROUTES[0])
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MonitorResult | null>(null)
  const [error, setError] = useState('')
  const [lastChecked, setLastChecked] = useState('')

  const target = useCustom && custom.trim() ? custom.trim() : route

  const handleMonitor = async () => {
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: target }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setLastChecked(new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setError('Monitor check failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-sm font-bold">SC</div>
            <h1 className="text-2xl font-bold">Supply Chain Disruption Monitor</h1>
          </div>
          <p className="text-gray-400">Select a trade route or region to get an AI-powered real-time risk assessment based on current global events.</p>
        </div>

        {/* Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium text-gray-300 mb-3">Trade Route / Region</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="preset"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="accent-orange-500"
              />
              <label htmlFor="preset" className="text-sm text-gray-300">Preset routes</label>
            </div>
            <select
              value={route}
              onChange={e => setRoute(e.target.value)}
              disabled={useCustom}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
            >
              {ROUTES.map(r => <option key={r}>{r}</option>)}
            </select>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="custom"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="accent-orange-500"
              />
              <label htmlFor="custom" className="text-sm text-gray-300">Custom route or region</label>
            </div>
            <input
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              disabled={!useCustom}
              placeholder="e.g. Port of Tanjung Pelepas, Banda Sea, Asia-Australia lane..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleMonitor}
            disabled={loading || (useCustom && !custom.trim())}
            className="mt-5 w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl py-3.5 font-semibold transition-colors"
          >
            {loading ? 'Scanning for disruptions...' : `Monitor: ${target}`}
          </button>
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-400 py-12">
            <div className="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Scanning news and assessing supply chain risk for</p>
            <p className="text-white font-medium mt-1">{target}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Risk Level Header */}
            <div className={`rounded-2xl border p-6 ${RISK_COLORS[result.risk_level]}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">Risk Level — {target}</p>
                  <p className="text-3xl font-bold">{result.risk_level}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{result.risk_score}<span className="text-lg font-normal opacity-60">/100</span></p>
                  <p className="text-xs opacity-60 mt-1">Checked at {lastChecked} MYT</p>
                </div>
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${RISK_BAR[result.risk_level]}`}
                  style={{ width: `${result.risk_score}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Situation Summary</p>
              <p className="text-gray-200 leading-relaxed">{result.summary}</p>
            </div>

            {/* Active Disruptions + Affected Commodities */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-red-400 mb-3">Active Disruptions</p>
                {result.active_disruptions.length > 0 ? (
                  <ul className="space-y-2">
                    {result.active_disruptions.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-red-400 mt-0.5 shrink-0">●</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No major active disruptions detected.</p>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-yellow-400 mb-3">Affected Commodities</p>
                <div className="flex flex-wrap gap-2">
                  {result.affected_commodities.map((c, i) => (
                    <span key={i} className="bg-yellow-900/30 border border-yellow-900/50 text-yellow-300 text-xs px-3 py-1 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Impact Assessment */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-300 mb-2">Impact Assessment</p>
              <p className="text-sm text-gray-400 leading-relaxed">{result.impact_assessment}</p>
            </div>

            {/* News Headlines */}
            {result.news.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-300 mb-3">Recent News</p>
                <div className="space-y-3">
                  {result.news.map((n, i) => (
                    <div key={i} className="border-b border-gray-800 last:border-0 pb-3 last:pb-0">
                      <p className="text-sm text-white font-medium mb-1">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.snippet}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-600">{n.source}</span>
                        {n.date && <span className="text-xs text-gray-600">{n.date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigations */}
            <div className="bg-green-950/20 border border-green-900/40 rounded-2xl p-5">
              <p className="text-sm font-semibold text-green-400 mb-3">Mitigation Strategies</p>
              <ul className="space-y-2">
                {result.mitigations.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-green-400 shrink-0">→</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Outlook */}
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-5">
              <p className="text-sm font-semibold text-blue-400 mb-2">Outlook</p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.outlook}</p>
            </div>

            {/* Re-check */}
            <button
              onClick={handleMonitor}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Re-check Now
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
