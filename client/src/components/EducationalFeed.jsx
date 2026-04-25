import { AnimatePresence, motion } from 'framer-motion'

const BADGE = {
  Advertising: 'bg-red-100 text-red-700 border-red-200',
  Analytics: 'bg-blue-100 text-blue-700 border-blue-200',
  Fingerprinting: 'bg-purple-100 text-purple-700 border-purple-200',
  Social: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function EducationalFeed({ trackers }) {
  const displayed = trackers.slice(0, 50)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        <p className="font-semibold text-slate-900 text-sm">Live Tracker Feed</p>
        <p className="text-xs text-slate-400 mt-0.5">{trackers.length} intercepted this session</p>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {displayed.map((t) => (
            <motion.div
              key={String(t._id)}
              initial={{ opacity: 0, x: -16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-800 text-xs truncate leading-tight">
                    {t.hostname}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap shrink-0 ${
                      BADGE[t.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {t.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.educational_summary}
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  {new Date(t.timestamp).toLocaleTimeString()} · {t.location?.city || 'Unknown'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!trackers.length && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-300 text-xs">
            <span className="text-2xl mb-2">🔍</span>
            Waiting for tracker events...
          </div>
        )}
      </div>
    </div>
  )
}
