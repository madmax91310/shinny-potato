import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../lib/format'
import Card from '../../../design-system/Card'

const PERIODS = [
  { key: '7d', label: '7 jours', days: 7 },
  { key: '30d', label: '30 jours', days: 30 },
  { key: 'all', label: 'Tout', days: null },
]

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0' }

export default function EvolutionChart({ snapshots }) {
  const [period, setPeriod] = useState('30d')

  const data = useMemo(() => {
    const config = PERIODS.find((p) => p.key === period)
    const filtered =
      config.days == null
        ? snapshots
        : snapshots.filter((s) => Date.now() - new Date(s.date).getTime() <= config.days * 24 * 60 * 60 * 1000)

    return filtered.map((s) => ({
      date: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      value: s.value,
    }))
  }, [snapshots, period])

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Évolution de la valeur du portefeuille</h2>
        <div className="flex rounded-lg border border-slate-800 p-0.5 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                period === p.key ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          Pas encore assez d'historique. Revenez plus tard pour voir la courbe.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
