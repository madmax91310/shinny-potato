import { formatCurrency, formatPercent, formatSignedCurrency } from '../lib/format'
import Card from '../../../design-system/Card'

function GainPill({ pct, abs }) {
  const positive = pct >= 0
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 text-sm font-medium ${
        positive ? 'text-emerald-400' : 'text-rose-400'
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
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Valeur totale</p>
        <p className="mt-2 text-3xl font-semibold text-slate-50">{formatCurrency(totalValue)}</p>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Performance globale</p>
        <div className="mt-2">
          <GainPill pct={gainPct} abs={gainAbs} />
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Performance du jour</p>
        <div className="mt-2">
          {dailyChange ? (
            <GainPill pct={dailyChange.gainPct} abs={dailyChange.gainAbs} />
          ) : (
            <span className="text-sm text-slate-500">Pas encore assez d'historique</span>
          )}
        </div>
      </Card>
    </div>
  )
}
