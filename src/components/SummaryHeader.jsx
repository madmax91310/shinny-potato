import { formatCurrency, formatPercent, formatSignedCurrency } from '../lib/format'

function GainPill({ pct, abs }) {
  const positive = pct >= 0
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 text-sm font-medium ${
        positive ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      <span>{formatPercent(pct)}</span>
      <span className="text-xs opacity-80">({formatSignedCurrency(abs)})</span>
    </span>
  )
}

export default function SummaryHeader({ summary, dailyChange }) {
  const { totalValue, gainAbs, gainPct } = summary

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valeur totale</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totalValue)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Performance globale
        </p>
        <div className="mt-2">
          <GainPill pct={gainPct} abs={gainAbs} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Performance du jour
        </p>
        <div className="mt-2">
          {dailyChange ? (
            <GainPill pct={dailyChange.gainPct} abs={dailyChange.gainAbs} />
          ) : (
            <span className="text-sm text-slate-400">Pas encore assez d'historique</span>
          )}
        </div>
      </div>
    </div>
  )
}
