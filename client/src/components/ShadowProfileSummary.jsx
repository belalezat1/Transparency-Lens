import { motion } from 'framer-motion'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.012 } } }
const char = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

export default function ShadowProfileSummary({ profile }) {
  return (
    <div className="card flex flex-col overflow-hidden" style={{ minHeight: '140px' }}>
      <div className="card-header flex items-center justify-between">
        <p className="section-title">Inferred Profile</p>
        <span className="label">Gemma 4 · every 5 min</span>
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
    </div>
  )
}
