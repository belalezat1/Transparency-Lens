import { useState, useEffect } from 'react'

const BAR   = { Advertising: '#c0614a', Analytics: '#4d9aab', Fingerprinting: '#8b78c0', Social: '#c07840' }
const COLOR = { Advertising: '#c0614a', Analytics: '#4d9aab', Fingerprinting: '#8b78c0', Social: '#c07840' }

export default function GlobalAnalytics() {
  const [rows, setRows]       = useState([])
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/global-analytics').then(r => r.json()).catch(() => ({ rows: [] })),
      fetch('/api/cortex-insight').then(r => r.json()).catch(() => ({ insight: '' })),
    ]).then(([analytics, cortex]) => {
      setRows(analytics.rows || [])
      setInsight(cortex.insight || '')
      setLoading(false)
    })
  }, [])

  const totalAll = rows.reduce((s, r) => s + (r.TOTAL || r.total || 0), 0)

  return (
    <div className="card shrink-0 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">Global Analytics</p>
        <span className="label">Snowflake</span>
      </div>

      {loading ? (
        <p className="text-xs py-2" style={{ color: '#3D4D55' }}>Loading...</p>
      ) : (
        <>
          {rows.length === 0 && (
            <p className="mb-3 rounded-lg py-5 text-center text-xs" style={{ border: '1px dashed #3D4D55', color: '#3D4D55' }}>
              No cross-session data yet.
            </p>
          )}

          {rows.length > 0 && (
            <div className="mb-3 space-y-2.5">
              {rows.map(r => {
                const cat    = r.CATEGORY || r.category
                const total  = r.TOTAL || r.total || 0
                const unique = r.UNIQUE_HOSTS || r.unique_hosts || 0
                const pct    = totalAll ? Math.round((total / totalAll) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: COLOR[cat] || '#A79E9C' }}>{cat}</span>
                      <span className="label">{total} · {unique} hosts</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: '#1B1B1B' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: BAR[cat] || '#3D4D55' }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="label pt-1">{totalAll} events across all sessions</p>
            </div>
          )}

          {insight && (
            <div className="rounded-lg p-3" style={{ background: '#1B1B1B', border: '1px solid #3D4D55' }}>
              <p className="label mb-1">Cortex Insight</p>
              <p className="text-[11px] leading-relaxed italic" style={{ color: '#A79E9C' }}>{insight}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
