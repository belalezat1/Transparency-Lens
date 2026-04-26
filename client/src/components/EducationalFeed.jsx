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

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        <AnimatePresence initial={false}>
          {trackers.slice(0, 50).map(t => {
            const badge = BADGE[t.category] || { bg: '#1e1e1e', text: '#A79E9C', border: '#3D4D55' }
            return (
              <motion.div
                key={String(t._id)}
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-lg px-3 py-2 transition-colors"
                  style={{ background: '#1B1B1B', border: '1px solid #3D4D55' }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[11px] font-medium" style={{ color: '#D3C3B9' }}>
                      {t.hostname}
                    </span>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                    >
                      {t.category}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: '#A79E9C' }}>
                    {t.educational_summary}
                  </p>
                  <p className="mt-1.5 text-[10px] tabular-nums" style={{ color: '#3D4D55' }}>
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.location?.city || 'Unknown'}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {!trackers.length && (
          <div
            className="flex h-40 flex-col items-center justify-center rounded-lg text-xs"
            style={{ border: '1px dashed #3D4D55' }}
          >
            <p className="font-medium" style={{ color: '#A79E9C' }}>No tracker events yet</p>
            <p className="mt-1" style={{ color: '#3D4D55' }}>Waiting for live network activity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
