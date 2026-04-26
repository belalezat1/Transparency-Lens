import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  Advertising:    '#c0614a',
  Analytics:      '#4d9aab',
  Fingerprinting: '#8b78c0',
  Social:         '#c07840',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const total = payload[0].payload.total
  const pct = total ? ((value / total) * 100).toFixed(1) : 0
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl" style={{ background: '#10252C', border: '1px solid #3D4D55' }}>
      <p className="font-semibold" style={{ color: '#D3C3B9' }}>{name}</p>
      <p style={{ color: '#A79E9C' }}>{value} trackers &middot; {pct}%</p>
    </div>
  )
}

export default function CategoryPieChart({ stats }) {
  const { categoryCounts = {}, total = 0 } = stats
  const data = Object.entries(categoryCounts).map(([name, value]) => ({ name, value, total }))

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="section-title">Tracker Breakdown</p>
        <span className="label tabular-nums">{total} total</span>
      </div>

      {data.length === 0 ? (
        <div
          className="flex h-32 items-center justify-center rounded-lg text-xs"
          style={{ border: '1px dashed #3D4D55', color: '#3D4D55' }}
        >
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={40} outerRadius={62}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={500}
            >
              {data.map(entry => (
                <Cell key={entry.name} fill={COLORS[entry.name] || '#3D4D55'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={7}
              formatter={value => (
                <span style={{ fontSize: '11px', color: '#A79E9C' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
