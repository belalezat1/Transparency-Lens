import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function AnimatedDollar({ value }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 60, damping: 15 })
  const display = useTransform(spring, (v) => `$${v.toFixed(4)}`)
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span>{display}</motion.span>
}

export default function DataValueEstimator({ sessionValue }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
        Session Data Value
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">
          <AnimatedDollar value={sessionValue} />
        </span>
        <span className="text-xs text-slate-400">CPM est.</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
        Based on ad-industry CPM rates per tracker category
      </p>
    </div>
  )
}
