import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  Advertising: '#ef4444',
  Analytics: '#3b82f6',
  Fingerprinting: '#8b5cf6',
  Social: '#f97316',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const total = payload[0].payload.total
  const pct = total ? ((value / total) * 100).toFixed(1) : 0
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{name}</p>
      <p className="text-slate-500">
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 shrink-0">
      <p className="font-semibold text-slate-900 text-sm mb-1">Tracker Categories</p>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-36 text-slate-300 text-xs">
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
                <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={7}
              formatter={(value) => (
                <span style={{ fontSize: '11px', color: '#64748b' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
