import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  Advertising: '#f87171',
  Analytics: '#22d3ee',
  Fingerprinting: '#a78bfa',
  Social: '#fb923c',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const total = payload[0].payload.total
  const pct = total ? ((value / total) * 100).toFixed(1) : 0
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-100">{name}</p>
      <p className="text-slate-400">
        {value} trackers · {pct}%
      </p>
    </div>
  )
}

export default function CategoryPieChart({ stats }) {
  const { categoryCounts = {}, total = 0 } = stats
  const data = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    total,
  }))

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 shrink-0">
      <p className="font-semibold text-slate-100 text-sm mb-1 tracking-tight">Tracker Categories</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-36 text-slate-600 text-xs">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={500}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] || '#475569'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(value) => (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
