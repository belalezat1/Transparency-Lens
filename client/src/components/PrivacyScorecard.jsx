import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function AnimatedInt({ value }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, v => Math.round(v).toString())
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span>{display}</motion.span>
}

function palette(score) {
  if (score >= 70) return { color: '#7ab87a', bar: '#7ab87a', label: 'Good',     labelBg: '#0f2010', labelBorder: '#2a4a2a' }
  if (score >= 40) return { color: '#B58863', bar: '#B58863', label: 'At Risk',  labelBg: '#261a0e', labelBorder: '#442e18' }
  return               { color: '#c0614a', bar: '#c0614a', label: 'Critical', labelBg: '#2a1212', labelBorder: '#4a2020' }
}

export default function PrivacyScorecard({ score }) {
  const p = palette(score)
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="label">Privacy Score</p>
        <span
          className="rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: p.labelBg, color: p.color, border: `1px solid ${p.labelBorder}` }}
        >
          {p.label}
        </span>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tabular-nums" style={{ color: p.color }}>
          <AnimatedInt value={score} />
        </span>
        <span className="text-sm" style={{ color: '#3D4D55' }}>/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#1B1B1B' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: p.bar }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-2 flex justify-between">
        <span className="text-[11px]" style={{ color: '#3D4D55' }}>Exposed</span>
        <span className="text-[11px]" style={{ color: '#3D4D55' }}>Protected</span>
      </div>
    </div>
  )
}
