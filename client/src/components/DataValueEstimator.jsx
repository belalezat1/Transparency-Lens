import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

function AnimatedDollar({ value }) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 60, damping: 15 })
  const display = useTransform(spring, v => `$${v.toFixed(4)}`)
  useEffect(() => { mv.set(value) }, [value, mv])
  return <motion.span>{display}</motion.span>
}

export default function DataValueEstimator({ sessionValue }) {
  return (
    <div className="card p-4">
      <p className="label mb-3">Estimated Data Value</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-4xl font-bold tabular-nums" style={{ color: '#B58863' }}>
          <AnimatedDollar value={sessionValue} />
        </span>
        <span className="text-xs font-medium" style={{ color: '#3D4D55' }}>USD</span>
      </div>
      <p className="text-[11px] mt-2" style={{ color: '#3D4D55' }}>
        Category-weighted CPM estimate for this session
      </p>
    </div>
  )
}
