import { motion } from 'framer-motion'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.015 } },
}
const char = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export default function ShadowProfileSummary({ profile }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex-1 overflow-hidden min-h-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md bg-violet-950 border border-violet-800 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <p className="font-semibold text-slate-100 text-sm tracking-tight">Shadow Profile</p>
        <span className="ml-auto text-[10px] text-slate-500 font-medium">Gemma 4 · AI</span>
      </div>
      <div className="text-xs text-slate-400 leading-relaxed overflow-y-auto max-h-28">
        <motion.span
          key={profile}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {profile.split('').map((c, i) => (
            <motion.span key={i} variants={char}>
              {c}
            </motion.span>
          ))}
        </motion.span>
      </div>
      <p className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-800">
        Updates every 5 min via Gemma 4 API
      </p>
    </div>
  )
}
