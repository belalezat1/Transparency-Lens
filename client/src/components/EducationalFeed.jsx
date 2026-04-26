import { AnimatePresence, motion } from 'framer-motion'

const BADGE = {
  Advertising:    { bg: '#2a1212', text: '#c0614a', border: '#4a2020' },
  Analytics:      { bg: '#0e2228', text: '#4d9aab', border: '#1e3d46' },
  Fingerprinting: { bg: '#1a1228', text: '#8b78c0', border: '#2e2048' },
  Social:         { bg: '#261a0e', text: '#c07840', border: '#442e18' },
}

export default function EducationalFeed({ trackers }) {
  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="card-header flex items-center justify-between">
        <p className="section-title">Tracker Feed</p>
        <span className="label tabular-nums">{trackers.length} this session</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence initial={false}>
          {trackers.slice(0, 50).map(t => {
            const badge = BADGE[t.category] || { bg: '#1e1e1e', text: '#A79E9C', border: '#3D4D55' }
            return (
              <motion.div
                key={String(t._id)}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ overflow: 'hidden', flexShrink: 0 }}
              >
                <div
                  style={{
                    background: '#1B1B1B',
                    border: '1px solid #3D4D55',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  {/* Row 1: hostname + badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '7px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#D3C3B9',
                      wordBreak: 'break-all',
                      lineHeight: 1.4,
                      flex: 1,
                    }}>
                      {t.hostname}
                    </span>
                    <span style={{
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}>
                      {t.category}
                    </span>
                  </div>

                  {/* Row 2: educational summary — full text, no clamp */}
                  <p style={{
                    fontSize: '12px',
                    lineHeight: 1.55,
                    color: '#A79E9C',
                    marginBottom: '8px',
                    margin: '0 0 8px 0',
                  }}>
                    {t.educational_summary}
                  </p>

                  {/* Row 3: time + city */}
                  <p style={{ fontSize: '11px', color: '#3D4D55', margin: 0 }}>
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {t.location?.city && t.location.city !== 'Unknown' ? ` · ${t.location.city}` : ''}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {!trackers.length && (
          <div
            style={{
              border: '1px dashed #3D4D55',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '160px',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#A79E9C', margin: 0 }}>No tracker events yet</p>
            <p style={{ fontSize: '12px', color: '#3D4D55', margin: '4px 0 0' }}>Waiting for live network activity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
