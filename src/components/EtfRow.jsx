import { inputClass, labelClass, monoInputClass } from '../lib/ui'

export default function EtfRow({ etf, index, onChange, onRemove }) {
  const set = (field) => (e) => onChange({ [field]: e.target.value })

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
          ETF {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-0.5 text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
        >
          Supprimer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nom de l'ETF</label>
          <input
            className={inputClass}
            value={etf.nom}
            onChange={set('nom')}
            placeholder="Ex. Amundi MSCI World"
          />
        </div>

        <div>
          <label className={labelClass}>ISIN</label>
          <input
            className={monoInputClass}
            value={etf.isin}
            onChange={set('isin')}
            placeholder="IE00…"
          />
        </div>

        <div>
          <label className={labelClass}>Frais (%)</label>
          <input
            className={monoInputClass}
            value={etf.frais}
            onChange={set('frais')}
            placeholder="0,20"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className={labelClass}>Encours</label>
          <input
            className={monoInputClass}
            value={etf.encours}
            onChange={set('encours')}
            placeholder="Ex. 12,3 Md€"
          />
        </div>

        <div>
          <label className={labelClass}>Différenciateur (5-8 mots)</label>
          <input
            className={inputClass}
            value={etf.differenciateur}
            onChange={set('differenciateur')}
            placeholder="Ex. le plus liquide, réplication physique"
          />
        </div>
      </div>
    </div>
  )
}
