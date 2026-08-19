import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { computeAllocationByLine, computeAllocationByType } from '../lib/portfolio'
import { formatCurrency } from '../lib/format'
import Card from '../../../design-system/Card'

// Palette catégorielle à ordre fixe (voir skill dataviz) — jamais recyclée par rang.
const PALETTE = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red (réservé au dernier slot "Autres")
]
const MAX_SLICES = 8

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0' }

function toChartData(entries) {
  const sorted = [...entries].sort((a, b) => b.value - a.value)
  if (sorted.length <= MAX_SLICES) return sorted

  const head = sorted.slice(0, MAX_SLICES - 1)
  const tailValue = sorted.slice(MAX_SLICES - 1).reduce((sum, e) => sum + e.value, 0)
  return [...head, { name: 'Autres', value: tailValue }]
}

export default function AllocationChart({ positions, livePrices }) {
  const [mode, setMode] = useState('line')

  const data = useMemo(() => {
    const entries = mode === 'line' ? computeAllocationByLine(positions, livePrices) : computeAllocationByType(positions, livePrices)
    return toChartData(entries)
  }, [positions, livePrices, mode])

  const total = data.reduce((sum, e) => sum + e.value, 0)

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Répartition du portefeuille</h2>
        <div className="flex rounded-lg border border-slate-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('line')}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              mode === 'line' ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Par ligne
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              mode === 'type' ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Par type
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Pas encore de données</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-1.5 text-sm">
            {data.map((entry, index) => (
              <li key={entry.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate text-slate-300">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="whitespace-nowrap text-slate-400">
                  {formatCurrency(entry.value)}{' '}
                  <span className="text-slate-500">
                    ({total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0'}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
