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

interface RouteOverview {
  route: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  risk_score: number
  one_liner: string
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

// ─── Risk level config ────────────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW: {
    card: 'bg-green-950/25 border-green-800/50',
    text: 'text-green-400',
    badge: 'bg-green-900/60 text-green-300 ring-1 ring-green-700/50',
    bar: 'bg-green-500',
    barGlow: 'bar-low',
    dot: 'bg-green-400',
    cardGlow: '',
    icon: '✓',
    iconBg: 'bg-green-900/50 border border-green-700/50 text-green-400',
    label: 'Low Risk',
    statCard: 'bg-green-950/30 border-green-800/40 text-green-400',
    newsAccent: 'bg-green-500/70',
  },
  MEDIUM: {
    card: 'bg-yellow-950/25 border-yellow-800/50',
    text: 'text-yellow-400',
    badge: 'bg-yellow-900/60 text-yellow-300 ring-1 ring-yellow-700/50',
    bar: 'bg-yellow-500',
    barGlow: 'bar-medium',
    dot: 'bg-yellow-400',
    cardGlow: '',
    icon: '⚠',
    iconBg: 'bg-yellow-900/50 border border-yellow-700/50 text-yellow-400',
    label: 'Medium Risk',
    statCard: 'bg-yellow-950/30 border-yellow-800/40 text-yellow-400',
    newsAccent: 'bg-yellow-500/70',
  },
  HIGH: {
    card: 'bg-orange-950/30 border-orange-700/60',
    text: 'text-orange-400',
    badge: 'bg-orange-900/60 text-orange-300 ring-1 ring-orange-700/50',
    bar: 'bg-orange-500',
    barGlow: 'bar-high',
    dot: 'bg-orange-400',
    cardGlow: 'high-pulse',
    icon: '▲',
    iconBg: 'bg-orange-900/50 border border-orange-700/50 text-orange-400',
    label: 'High Risk',
    statCard: 'bg-orange-950/30 border-orange-700/40 text-orange-400',
    newsAccent: 'bg-orange-500/70',
  },
  CRITICAL: {
    card: 'bg-red-950/40 border-red-600/70',
    text: 'text-red-400',
    badge: 'bg-red-900/70 text-red-200 ring-1 ring-red-600/60',
    bar: 'bg-red-500',
    barGlow: 'bar-critical',
    dot: 'bg-red-400',
    cardGlow: 'critical-pulse',
    icon: '!',
    iconBg: 'bg-red-900/60 border border-red-600/60 text-red-300',
    label: 'Critical Risk',
    statCard: 'bg-red-950/40 border-red-700/50 text-red-400',
    newsAccent: 'bg-red-500/80',
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RiskBadge({ level, size = 'sm' }: { level: keyof typeof RISK_CONFIG; size?: 'sm' | 'lg' }) {
  const cfg = RISK_CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full ${cfg.badge} ${
        size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <span className="leading-none">{cfg.icon}</span>
      {level}
    </span>
  )
}

function RiskBar({ score, level, className = '', thick = false }: { score: number; level: keyof typeof RISK_CONFIG; className?: string; thick?: boolean }) {
  const cfg = RISK_CONFIG[level]
  return (
    <div className={`w-full bg-gray-800/80 rounded-full overflow-hidden ${thick ? 'h-3' : 'h-2'} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${cfg.bar} ${thick ? cfg.barGlow : ''}`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
      {children}
    </p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DisruptionMonitor() {
  const [route, setRoute] = useState(ROUTES[0])
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MonitorResult | null>(null)
  const [error, setError] = useState('')
  const [lastChecked, setLastChecked] = useState('')

  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overview, setOverview] = useState<RouteOverview[] | null>(null)
  const [overviewError, setOverviewError] = useState('')
  const [overviewChecked, setOverviewChecked] = useState('')

  const target = useCustom && custom.trim() ? custom.trim() : route

  const handleMonitor = async (routeOverride?: string) => {
    const routeToUse = routeOverride ?? target
    setLoading(true)
    setResult(null)
    setError('')
    if (routeOverride) {
      setRoute(routeOverride)
      setUseCustom(false)
    }
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: routeToUse }),
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
    setTimeout(() => {
      document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleScanAll = async () => {
    setOverviewLoading(true)
    setOverview(null)
    setOverviewError('')
    try {
      const res = await fetch('/api/overview')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOverview(data.routes || [])
      setOverviewChecked(new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setOverviewError('Scan failed. Please try again.')
    } finally {
      setOverviewLoading(false)
    }
  }

  const riskCounts = overview
    ? {
        CRITICAL: overview.filter(r => r.risk_level === 'CRITICAL').length,
        HIGH: overview.filter(r => r.risk_level === 'HIGH').length,
        MEDIUM: overview.filter(r => r.risk_level === 'MEDIUM').length,
        LOW: overview.filter(r => r.risk_level === 'LOW').length,
      }
    : null

  const hasCritical = (riskCounts?.CRITICAL ?? 0) > 0
  const hasHigh = (riskCounts?.HIGH ?? 0) > 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/70">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center text-xs font-black tracking-tight shadow-lg shadow-orange-900/40">
              SC
            </div>
            <span className="font-bold text-sm tracking-tight">Supply Chain Monitor</span>
            <span className="hidden sm:inline text-gray-600 text-xs font-medium">— APAC</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live / last-checked indicator */}
            {lastChecked ? (
              <span className="flex items-center gap-1.5 text-xs bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-gray-400">Updated</span>
                <span className="text-white font-semibold">{lastChecked}</span>
                <span className="text-gray-600">MYT</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-900/50 border border-gray-800/60 rounded-full px-2.5 py-1">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                </span>
                AI-Powered
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Page Hero ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-950/50 border border-orange-900/50 rounded-full px-2.5 py-0.5">
              APAC Network
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              10 Corridors Monitored
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1.5">
            Supply Chain Disruption Monitor
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
            AI-powered real-time risk assessment for APAC trade routes and logistics corridors.
            Scan individual routes or get a full network snapshot.
          </p>
        </div>

        {/* ── APAC Overview Section ─────────────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          {/* Section header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <SectionLabel>Network Overview</SectionLabel>
              <p className="font-semibold text-base">APAC Route Snapshot</p>
              <p className="text-xs text-gray-500 mt-0.5">Simultaneous AI scan across all 10 key corridors</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleScanAll}
                disabled={overviewLoading}
                className="bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap shadow-lg shadow-orange-900/20"
              >
                {overviewLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </span>
                ) : (
                  'Scan All Routes'
                )}
              </button>
              {overviewChecked && !overviewLoading && (
                <span className="text-[10px] text-gray-600">
                  Last scan: {overviewChecked} MYT
                </span>
              )}
            </div>
          </div>

          {/* Loading skeleton */}
          {overviewLoading && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 pt-2 animate-pulse">
                Assessing all APAC routes with AI — this takes ~20s...
              </p>
            </div>
          )}

          {overviewError && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm font-medium">Scan failed</p>
              <p className="text-red-500/70 text-xs mt-1">{overviewError}</p>
              <button
                onClick={handleScanAll}
                className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {overview && (
            <div className="animate-fade-in-up">
              {/* Alert banner for critical/high */}
              {(hasCritical || hasHigh) && (
                <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm font-medium ${
                  hasCritical
                    ? 'bg-red-950/50 border border-red-700/60 text-red-300'
                    : 'bg-orange-950/40 border border-orange-700/50 text-orange-300'
                }`}>
                  <span className="text-base">{hasCritical ? '🚨' : '⚠️'}</span>
                  {hasCritical
                    ? `${riskCounts!.CRITICAL} critical disruption${riskCounts!.CRITICAL > 1 ? 's' : ''} detected — immediate attention required`
                    : `${riskCounts!.HIGH} high-risk route${riskCounts!.HIGH > 1 ? 's' : ''} detected — monitor closely`}
                </div>
              )}

              {/* Summary stat cards */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => {
                  const cfg = RISK_CONFIG[level]
                  return (
                    <div
                      key={level}
                      className={`rounded-xl p-3 border text-center ${cfg.statCard} ${
                        level === 'CRITICAL' && (riskCounts![level] ?? 0) > 0 ? cfg.cardGlow : ''
                      }`}
                    >
                      <p className="text-2xl font-black">{riskCounts![level]}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">
                        {level}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Route grid */}
              <div className="grid sm:grid-cols-2 gap-2">
                {overview.map((r, i) => {
                  const cfg = RISK_CONFIG[r.risk_level]
                  return (
                    <button
                      key={i}
                      onClick={() => handleMonitor(r.route)}
                      className={`text-left rounded-xl p-4 transition-all group border ${
                        r.risk_level === 'CRITICAL'
                          ? `bg-red-950/20 border-red-800/50 hover:border-red-600/70 ${cfg.cardGlow}`
                          : r.risk_level === 'HIGH'
                          ? `bg-orange-950/15 border-orange-800/40 hover:border-orange-600/60`
                          : r.risk_level === 'MEDIUM'
                          ? 'bg-gray-800/30 border-yellow-900/30 hover:border-yellow-800/50'
                          : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'
                      }`}
                    >
                      {/* Route name + badge */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors leading-tight">
                          {r.route}
                        </p>
                        <RiskBadge level={r.risk_level} />
                      </div>

                      {/* Risk bar */}
                      <RiskBar score={r.risk_score} level={r.risk_level} className="mb-2.5" />

                      {/* One-liner + score */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                          {r.one_liner}
                        </p>
                        <span className={`shrink-0 text-sm font-black tabular-nums ${cfg.text}`}>
                          {r.risk_score}
                        </span>
                      </div>

                      {/* Deep dive hint — always visible for critical/high, hover for others */}
                      <p className={`text-[10px] font-medium text-orange-500 mt-2.5 flex items-center gap-1 transition-opacity ${
                        r.risk_level === 'CRITICAL' || r.risk_level === 'HIGH'
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <span>Deep dive analysis</span>
                        <span>→</span>
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!overview && !overviewLoading && (
            <div className="border border-dashed border-gray-700/50 rounded-2xl py-12 px-6 text-center bg-gray-800/10">
              {/* Icon cluster */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                  <div
                    key={level}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-black ${RISK_CONFIG[level].iconBg}`}
                  >
                    {RISK_CONFIG[level].icon}
                  </div>
                ))}
              </div>
              <p className="text-gray-200 text-sm font-semibold mb-1.5">10 APAC Corridors — Not Yet Scanned</p>
              <p className="text-gray-500 text-xs max-w-sm mx-auto mb-5 leading-relaxed">
                Get a real-time risk snapshot across all major trade routes — Strait of Malacca, Red Sea, Taiwan Strait, and more.
              </p>
              <button
                onClick={handleScanAll}
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-lg shadow-orange-900/20"
              >
                <span>Scan All 10 Routes</span>
                <span className="text-orange-300">→</span>
              </button>
            </div>
          )}
        </section>

        {/* ── Single Route Deep Dive ─────────────────────────────────────────── */}
        <section id="detail" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <SectionLabel>Route Analysis</SectionLabel>
          <p className="font-semibold text-base mb-0.5">Deep Dive Analysis</p>
          <p className="text-xs text-gray-500 mb-5">
            Detailed breakdown for a specific route — live news, impact assessment, and mitigations.
          </p>

          <div className="space-y-3">
            {/* Preset routes */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                id="preset"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                Preset routes
              </span>
            </label>
            <select
              value={route}
              onChange={e => setRoute(e.target.value)}
              disabled={useCustom}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {ROUTES.map(r => <option key={r}>{r}</option>)}
            </select>

            {/* Custom route */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                id="custom"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="accent-orange-500"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                Custom route or region
              </span>
            </label>
            <input
              type="text"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              disabled={!useCustom}
              placeholder="e.g. Port of Tanjung Pelepas, Banda Sea, Asia-Australia lane..."
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <button
            onClick={() => handleMonitor()}
            disabled={loading || (useCustom && !custom.trim())}
            className="mt-5 w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-xl py-3.5 font-semibold text-sm transition-all shadow-lg shadow-orange-900/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning for disruptions...
              </span>
            ) : (
              <span>Analyse: <span className="font-bold">{target}</span></span>
            )}
          </button>
          {error && (
            <div className="mt-3 bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-2.5 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </section>

        {/* ── Loading State ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-950/40 border border-orange-800/40 mb-4 relative">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-400 rounded-full animate-spin" />
              <span className="absolute inset-0 rounded-full animate-ping bg-orange-500/5" />
            </div>
            <p className="text-white font-semibold mb-0.5">{target}</p>
            <p className="text-gray-500 text-sm mb-6">Scanning live news and assessing disruption risk...</p>
            {/* Sequential step reveal */}
            <div className="max-w-xs mx-auto space-y-3">
              {[
                { label: 'Fetching live news feeds', cls: 'step-1' },
                { label: 'Analysing disruption signals', cls: 'step-2' },
                { label: 'Calculating risk score', cls: 'step-3' },
              ].map(({ label, cls }, i) => (
                <div key={i} className={`flex items-center gap-3 text-xs text-gray-400 ${cls}`}>
                  <span className="inline-block w-4 h-4 border border-orange-700/50 border-t-orange-400 rounded-full animate-spin shrink-0" />
                  <span className="text-left">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────────── */}
        {result && (
          <div className="space-y-4">

            {/* ── Risk Level Header Card ─── */}
            <div
              className={`rounded-2xl border p-6 animate-fade-in-up ${RISK_CONFIG[result.risk_level].card} ${RISK_CONFIG[result.risk_level].cardGlow}`}
            >
              {/* Route label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Route</span>
                <span className="text-gray-700">—</span>
                <span className="text-xs text-gray-300 font-medium truncate">{target}</span>
              </div>

              {/* Score row */}
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-3 h-3 rounded-full ${RISK_CONFIG[result.risk_level].dot} animate-pulse shrink-0`} />
                    <p className={`text-4xl font-black tracking-tight leading-none ${RISK_CONFIG[result.risk_level].text}`}>
                      {result.risk_level}
                    </p>
                    <RiskBadge level={result.risk_level} size="lg" />
                  </div>
                  <p className="text-xs text-gray-500 pl-6">{RISK_CONFIG[result.risk_level].label} — live AI assessment</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-5xl font-black tabular-nums leading-none ${RISK_CONFIG[result.risk_level].text}`}>
                    {result.risk_score}
                    <span className="text-2xl font-normal text-gray-600">/100</span>
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1.5">Risk Score</p>
                </div>
              </div>

              {/* Thick progress bar with glow */}
              <RiskBar score={result.risk_score} level={result.risk_level} thick className="mb-3" />

              {/* Timestamp row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[10px] text-gray-500">Live assessment</span>
                </div>
                {lastChecked && (
                  <span className="text-[10px] text-gray-600 bg-gray-900/60 border border-gray-800/60 rounded-full px-2.5 py-0.5">
                    Checked {lastChecked} MYT
                  </span>
                )}
              </div>
            </div>

            {/* ── Situation Summary ─── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in-up animate-fade-in-up-delay-1">
              <SectionLabel>Situation Summary</SectionLabel>
              <p className="text-gray-200 leading-relaxed text-sm">{result.summary}</p>
            </div>

            {/* ── Active Disruptions + Commodities ─── */}
            <div className="grid md:grid-cols-2 gap-4 animate-fade-in-up animate-fade-in-up-delay-2">

              {/* Active Disruptions */}
              <div className={`rounded-2xl p-5 border ${
                result.active_disruptions.length > 0
                  ? 'bg-red-950/20 border-red-900/50'
                  : 'bg-gray-900 border-gray-800'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Active Disruptions</SectionLabel>
                  {result.active_disruptions.length > 0 && (
                    <span className="text-[10px] font-bold bg-red-900/70 text-red-300 ring-1 ring-red-700/60 rounded-full px-2.5 py-0.5 -mt-2">
                      {result.active_disruptions.length} active
                    </span>
                  )}
                </div>

                {result.active_disruptions.length > 0 ? (
                  <ul className="space-y-3">
                    {result.active_disruptions.map((d, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-200">
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        </span>
                        <span className="leading-relaxed">{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* All-clear empty state */
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-950/50 border border-green-800/50 flex items-center justify-center text-xl mb-3 shadow-lg shadow-green-900/20">
                      ✓
                    </div>
                    <p className="text-green-400 text-sm font-bold">All Clear</p>
                    <p className="text-gray-600 text-xs mt-1 max-w-[160px] leading-relaxed">No major disruptions detected on this route</p>
                  </div>
                )}
              </div>

              {/* Affected Commodities */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <SectionLabel>Affected Commodities</SectionLabel>
                {result.affected_commodities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.affected_commodities.map((c, i) => (
                      <span
                        key={i}
                        className="bg-yellow-900/30 border border-yellow-800/40 text-yellow-200 text-xs px-3 py-1.5 rounded-full font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <p className="text-gray-500 text-sm font-medium">No commodities flagged</p>
                    <p className="text-gray-700 text-xs mt-1">Supply flow appears normal</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Impact Assessment ─── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in-up animate-fade-in-up-delay-3">
              <SectionLabel>Impact Assessment</SectionLabel>
              <p className="text-sm text-gray-300 leading-relaxed">{result.impact_assessment}</p>
            </div>

            {/* ── Recent News ─── */}
            {result.news.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-fade-in-up animate-fade-in-up-delay-4">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Recent News</SectionLabel>
                  <span className="text-[10px] text-gray-600 bg-gray-800 border border-gray-700 rounded-full px-2.5 py-0.5 -mt-2 font-medium">
                    {result.news.length} source{result.news.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-0 divide-y divide-gray-800/60">
                  {result.news.map((n, i) => (
                    <div key={i} className="py-4 first:pt-0 last:pb-0 group">
                      {/* Title with left accent bar */}
                      <div className="flex gap-3 mb-2">
                        <div className={`shrink-0 w-0.5 rounded-full mt-0.5 ${RISK_CONFIG[result.risk_level].newsAccent}`} />
                        <p className="text-sm text-white font-semibold leading-snug">{n.title}</p>
                      </div>
                      {/* Snippet */}
                      <p className="text-xs text-gray-500 leading-relaxed mb-3 pl-3">{n.snippet}</p>
                      {/* Source + date row */}
                      <div className="flex items-center gap-2.5 pl-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 bg-gray-800/80 border border-gray-700/60 rounded-full px-2.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {n.source}
                        </span>
                        {n.date && (
                          <span className="text-[10px] text-gray-600 font-medium">{n.date}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mitigation Strategies ─── */}
            <div className="bg-green-950/15 border border-green-900/40 rounded-2xl p-5 animate-fade-in-up animate-fade-in-up-delay-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Mitigation Strategies</SectionLabel>
                <span className="text-[10px] font-semibold text-green-600 -mt-2">
                  {result.mitigations.length} action{result.mitigations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="space-y-3.5">
                {result.mitigations.map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-green-900/60 border border-green-800/50 flex items-center justify-center text-green-400 text-[10px] font-black mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Outlook ─── */}
            <div className="bg-blue-950/15 border border-blue-900/40 rounded-2xl p-5 animate-fade-in-up animate-fade-in-up-delay-6">
              <div className="flex items-center gap-2 mb-3">
                <SectionLabel>Outlook</SectionLabel>
                <span className="text-[10px] font-semibold text-blue-500 -mt-2 uppercase tracking-wider">Forward View</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{result.outlook}</p>
            </div>

            {/* Re-check button */}
            <div className="flex items-center gap-3 pb-4">
              <button
                onClick={() => handleMonitor()}
                className="flex-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 hover:border-gray-600 rounded-xl py-3 text-sm font-semibold transition-all"
              >
                Re-check Now
              </button>
              <button
                onClick={() => { setResult(null); setError('') }}
                className="px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors rounded-xl hover:bg-gray-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
