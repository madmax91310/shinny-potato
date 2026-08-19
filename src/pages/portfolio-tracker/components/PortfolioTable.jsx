import { useMemo, useState } from 'react'
import { computePositionMetrics, TYPE_LABELS } from '../lib/portfolio'
import { formatCurrency, formatPercent, formatSignedCurrency, formatDateTime } from '../lib/format'

const COLUMNS = [
  { key: 'name', label: 'Nom' },
  { key: 'type', label: 'Type' },
  { key: 'quantity', label: 'Quantité' },
  { key: 'buyPrice', label: "Prix d'achat" },
  { key: 'currentPrice', label: 'Prix actuel' },
  { key: 'currentValue', label: 'Valeur' },
  { key: 'gainPct', label: 'Performance' },
]

function SourceDot({ source }) {
  const color =
    source === 'live' ? 'bg-emerald-500' : source === 'manual' ? 'bg-amber-500' : 'bg-slate-300'
  const label = source === 'live' ? 'Cours en direct' : source === 'manual' ? 'Saisie manuelle' : 'Pas de cours'
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <span className={`h-2 w-2 rounded-full ${color}`} />
    </span>
  )
}

function ManualPriceEditor({ position, onSave, onClose }) {
  const [value, setValue] = useState(position.manualPrice ?? position.buyPrice)
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault()
        if (Number.isFinite(Number(value)) && Number(value) > 0) {
          onSave(position.id, value)
          onClose()
        }
      }}
    >
      <input
        autoFocus
        type="number"
        step="any"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
      />
      <button type="submit" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
        OK
      </button>
      <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
        ✕
      </button>
    </form>
  )
}

export default function PortfolioTable({ positions, livePrices, onEdit, onDelete, onSetManualPrice }) {
  const [sortKey, setSortKey] = useState('currentValue')
  const [sortDir, setSortDir] = useState('desc')
  const [editingPriceId, setEditingPriceId] = useState(null)

  const rows = useMemo(() => {
    const withMetrics = positions.map((position) => ({
      position,
      metrics: computePositionMetrics(position, livePrices[position.id]),
    }))

    const getValue = (row) => {
      switch (sortKey) {
        case 'name':
          return row.position.name.toLowerCase()
        case 'type':
          return row.position.type
        case 'quantity':
          return row.position.quantity
        case 'buyPrice':
          return row.position.buyPrice
        case 'currentPrice':
          return row.metrics.currentPrice
        case 'currentValue':
          return row.metrics.currentValue
        case 'gainPct':
          return row.metrics.gainPct
        default:
          return 0
      }
    }

    return withMetrics.sort((a, b) => {
      const va = getValue(a)
      const vb = getValue(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [positions, livePrices, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
        Aucune ligne pour l'instant. Ajoutez votre première position ci-dessus.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
              >
                {col.label}
                {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ position, metrics }) => (
            <tr key={position.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {position.name}
                <span className="ml-1.5 text-xs font-normal text-slate-400">{position.ticker}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{TYPE_LABELS[position.type]}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{position.quantity}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(position.buyPrice)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {editingPriceId === position.id ? (
                  <ManualPriceEditor
                    position={position}
                    onSave={onSetManualPrice}
                    onClose={() => setEditingPriceId(null)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <SourceDot source={metrics.priceSource} />
                    <span>{formatCurrency(metrics.currentPrice)}</span>
                    <button
                      type="button"
                      onClick={() => setEditingPriceId(position.id)}
                      title={
                        metrics.priceUpdatedAt
                          ? `Mis à jour ${formatDateTime(metrics.priceUpdatedAt)}`
                          : 'Saisir un prix manuel'
                      }
                      className="text-xs text-indigo-500 hover:text-indigo-600"
                    >
                      ✎
                    </button>
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                {formatCurrency(metrics.currentValue)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className={metrics.gainPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  <div className="font-medium">{formatPercent(metrics.gainPct)}</div>
                  <div className="text-xs opacity-80">{formatSignedCurrency(metrics.gainAbs)}</div>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(position)}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(position.id)}
                    className="text-xs font-medium text-slate-500 hover:text-rose-600"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
