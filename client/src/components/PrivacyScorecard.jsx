import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function AnimatedInt({ value }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toString())
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span>{display}</motion.span>
}

function palette(score) {
  if (score >= 70)
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', label: 'Good' }
  if (score >= 40)
    return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', label: 'At Risk' }
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500', label: 'Critical' }
}

export default function PrivacyScorecard({ score }) {
  const p = palette(score)
  return (
    <div className={`rounded-xl border shadow-sm p-3 ${p.bg} ${p.border}`}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
        Privacy Health
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold tabular-nums ${p.text}`}>
          <AnimatedInt value={score} />
        </span>
        <span className="text-slate-400 text-xs mb-0.5">/100</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${p.text} border ${p.border} bg-white/60`}>
          {p.label}
        </span>
      </div>
      <div className="mt-2 w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={`h-1.5 rounded-full ${p.bar}`}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
