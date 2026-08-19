import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../lib/format'

const PERIODS = [
  { key: '7d', label: '7 jours', days: 7 },
  { key: '30d', label: '30 jours', days: 30 },
  { key: 'all', label: 'Tout', days: null },
]

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Évolution de la valeur du portefeuille</h2>
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-2.5 py-1 font-medium ${
                period === p.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <p className="py-16 text-center text-sm text-slate-400">
          Pas encore assez d'historique. Revenez plus tard pour voir la courbe.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e1e0d9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#898781' }}
                axisLine={false}
                tickLine={false}
                width={70}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="value" stroke="#2a78d6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
