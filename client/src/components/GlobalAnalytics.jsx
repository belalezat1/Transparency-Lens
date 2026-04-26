import { useState, useEffect } from 'react'

const CATEGORY_COLORS = {
  Advertising: 'text-red-400',
  Analytics: 'text-cyan-400',
  Fingerprinting: 'text-violet-400',
  Social: 'text-orange-400',
}

const BAR_COLORS = {
  Advertising: 'bg-red-500',
  Analytics: 'bg-cyan-500',
  Fingerprinting: 'bg-violet-500',
  Social: 'bg-orange-500',
}

export default function GlobalAnalytics() {
  const [rows, setRows] = useState([])
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/global-analytics').then((r) => r.json()).catch(() => ({ rows: [] })),
      fetch('/api/cortex-insight').then((r) => r.json()).catch(() => ({ insight: '' })),
    ]).then(([analytics, cortex]) => {
      setRows(analytics.rows || [])
      setInsight(cortex.insight || '')
      setLoading(false)
    })
  }, [])

  const totalAll = rows.reduce((s, r) => s + (r.TOTAL || r.total || 0), 0)

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
          </svg>
        </div>
        <p className="font-semibold text-slate-100 text-sm tracking-tight">Global Intelligence</p>
        <span className="ml-auto text-[10px] text-slate-500 font-medium">Snowflake</span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-600 py-2">Loading Snowflake data...</p>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {rows.map((r) => {
                const cat = r.CATEGORY || r.category
                const total = r.TOTAL || r.total || 0
                const unique = r.UNIQUE_HOSTS || r.unique_hosts || 0
                const pct = totalAll ? Math.round((total / totalAll) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className={`font-medium w-24 truncate ${CATEGORY_COLORS[cat] || 'text-slate-400'}`}>
                      {cat}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${BAR_COLORS[cat] || 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-500 w-12 text-right">{total} · {unique}u</span>
                  </div>
                )
              })}
              <p className="text-[10px] text-slate-600 mt-1">{totalAll} total events across all sessions</p>
            </div>
          )}

          {rows.length === 0 && (
            <p className="text-xs text-slate-600 mb-2">
              No cross-session data yet — populates as events arrive.
            </p>
          )}

          {insight && (
            <blockquote className="border-l-2 border-cyan-700 pl-2 text-[11px] text-slate-400 italic leading-relaxed">
              {insight}
            </blockquote>
          )}
        </>
      )}
    </div>
  )
}
