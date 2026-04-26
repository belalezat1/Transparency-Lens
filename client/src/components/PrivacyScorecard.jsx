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
    return { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/60', bar: 'bg-emerald-500', label: 'Good', labelBg: 'bg-emerald-950 border-emerald-800 text-emerald-400' }
  if (score >= 40)
    return { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/60', bar: 'bg-amber-500', label: 'At Risk', labelBg: 'bg-amber-950 border-amber-800 text-amber-400' }
  return { text: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/60', bar: 'bg-red-500', label: 'Critical', labelBg: 'bg-red-950 border-red-800 text-red-400' }
}

export default function PrivacyScorecard({ score }) {
  const p = palette(score)
  return (
    <div className={`rounded-xl border p-3 ${p.bg} ${p.border}`}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
        Privacy Health
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold tabular-nums ${p.text}`}>
          <AnimatedInt value={score} />
        </span>
        <span className="text-slate-600 text-xs mb-0.5">/100</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${p.labelBg}`}>
          {p.label}
        </span>
      </div>
      <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={`h-1.5 rounded-full ${p.bar}`}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
