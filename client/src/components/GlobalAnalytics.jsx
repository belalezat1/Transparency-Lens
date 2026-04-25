import { useState, useEffect } from 'react'

const CATEGORY_COLORS = {
  Advertising: 'text-red-600',
  Analytics: 'text-blue-600',
  Fingerprinting: 'text-purple-600',
  Social: 'text-orange-600',
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">❄️</span>
        <p className="font-semibold text-slate-900 text-sm">Global Intelligence</p>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">Snowflake</span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-2">Loading Snowflake data...</p>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="space-y-1 mb-2">
              {rows.map((r) => {
                const cat = r.CATEGORY || r.category
                const total = r.TOTAL || r.total || 0
                const unique = r.UNIQUE_HOSTS || r.unique_hosts || 0
                const pct = totalAll ? Math.round((total / totalAll) * 100) : 0
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className={`font-medium w-24 truncate ${CATEGORY_COLORS[cat] || 'text-slate-600'}`}>
                      {cat}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-12 text-right">{total} · {unique}u</span>
                  </div>
                )
              })}
              <p className="text-[10px] text-slate-400 mt-1">{totalAll} total events across all sessions</p>
            </div>
          )}

          {rows.length === 0 && (
            <p className="text-xs text-slate-400 mb-2">
              No cross-session data yet — Snowflake populates as events arrive.
            </p>
          )}

          {insight && (
            <blockquote className="border-l-2 border-blue-300 pl-2 text-[11px] text-slate-500 italic leading-relaxed">
              {insight}
            </blockquote>
          )}
        </>
      )}
    </div>
  )
}
