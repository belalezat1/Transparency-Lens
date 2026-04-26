import { motion } from 'framer-motion'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.012 } } }
const char = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

export default function ShadowProfileSummary({ profile }) {
  return (
    <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="card-header flex items-center justify-between">
        <p className="section-title">Shadow Profile</p>
        <span className="label">Gemma 4</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs leading-relaxed" style={{ color: '#A79E9C' }}>
          <motion.span key={profile} variants={container} initial="hidden" animate="visible">
            {profile.split('').map((c, i) => (
              <motion.span key={i} variants={char}>{c}</motion.span>
            ))}
          </motion.span>
        </p>
      </div>
      <div className="px-4 py-2" style={{ borderTop: '1px solid #3D4D55' }}>
        <p className="label">Refreshes every 5 minutes</p>
      </div>
    </div>
  )
}
