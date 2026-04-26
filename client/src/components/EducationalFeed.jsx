import { AnimatePresence, motion } from 'framer-motion'

const BADGE = {
  Advertising: 'bg-red-950 text-red-400 border-red-800',
  Analytics: 'bg-cyan-950 text-cyan-400 border-cyan-800',
  Fingerprinting: 'bg-violet-950 text-violet-400 border-violet-800',
  Social: 'bg-orange-950 text-orange-400 border-orange-800',
}

export default function EducationalFeed({ trackers }) {
  const displayed = trackers.slice(0, 50)

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <p className="font-semibold text-slate-100 text-sm tracking-tight">Live Feed</p>
        <span className="text-[11px] text-slate-500 tabular-nums">{trackers.length} intercepted</span>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        <AnimatePresence initial={false}>
          {displayed.map((t) => (
            <motion.div
              key={String(t._id)}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-2.5 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono font-medium text-slate-200 text-[11px] truncate leading-none">
                    {t.hostname}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap shrink-0 tracking-wide uppercase ${BADGE[t.category] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {t.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                  {t.educational_summary}
                </p>
                <p className="text-[9px] text-slate-700 mt-1 tabular-nums">
                  {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.location?.city || 'Unknown'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!trackers.length && (
          <div className="flex items-center justify-center h-32 text-slate-700 text-xs">
            Waiting for tracker events...
          </div>
        )}
      </div>
    </div>
  )
}
