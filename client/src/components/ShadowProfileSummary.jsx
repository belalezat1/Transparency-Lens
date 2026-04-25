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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex-1 overflow-hidden min-h-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🕵️</span>
        <p className="font-semibold text-slate-900 text-sm">Shadow Profile</p>
        <span className="ml-auto text-[10px] text-slate-400 font-medium">Gemma 4 · AI</span>
      </div>
      <div className="text-xs text-slate-500 leading-relaxed overflow-y-auto max-h-28">
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
      <p className="text-[10px] text-slate-300 mt-2 pt-2 border-t border-slate-100">
        Updates every 5 min via Gemma 4 API
      </p>
    </div>
  )
}
