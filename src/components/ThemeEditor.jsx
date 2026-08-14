import EtfRow from './EtfRow'
import { inputClass, labelClass } from '../lib/ui'

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-xs font-semibold tracking-widest text-teal-400/90 uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function ThemeEditor({ theme, onUpdateTheme, onAddEtf, onUpdateEtf, onRemoveEtf, onReset }) {
  const setField = (field) => (e) => onUpdateTheme({ [field]: e.target.value })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{theme.emoji}</span>
          <h1 className="text-lg font-semibold text-slate-100">{theme.nom}</h1>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200"
        >
          Réinitialiser ce thème
        </button>
      </div>

      <Section title="Accroche">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Action liée au thème</label>
            <input
              className={inputClass}
              value={theme.hookAction}
              onChange={setField('hookAction')}
              placeholder="Ex. investir sur les plus grandes entreprises mondiales"
            />
          </div>
          <div>
            <label className={labelClass}>Dilemme</label>
            <input
              className={inputClass}
              value={theme.hookDilemme}
              onChange={setField('hookDilemme')}
              placeholder="Ex. quel ETF World choisir"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Phrase de transition</label>
          <textarea
            className={`${inputClass} min-h-16 resize-y`}
            value={theme.transition}
            onChange={setField('transition')}
            placeholder="Ex. Il existe plusieurs ETF pour capter cette thématique. Voici ceux à connaître :"
          />
        </div>
      </Section>

      <Section title={`ETF du thème (${theme.etfs.length})`}>
        <div className="flex flex-col gap-3">
          {theme.etfs.length === 0 && (
            <p className="text-sm text-slate-500">Aucun ETF pour l'instant. Ajoutes-en un ci-dessous.</p>
          )}
          {theme.etfs.map((etf, index) => (
            <EtfRow
              key={etf.id}
              etf={etf}
              index={index}
              onChange={(patch) => onUpdateEtf(etf.id, patch)}
              onRemove={() => onRemoveEtf(etf.id)}
            />
          ))}
          <button
            type="button"
            onClick={onAddEtf}
            className="self-start rounded-md border border-dashed border-slate-700 px-3 py-1.5 text-sm font-medium text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5"
          >
            + Ajouter un ETF
          </button>
        </div>
      </Section>

      <Section title="Clôture & appel à l'action">
        <div>
          <label className={labelClass}>Phrase de clôture</label>
          <textarea
            className={`${inputClass} min-h-16 resize-y`}
            value={theme.cloture}
            onChange={setField('cloture')}
            placeholder="Ex. Le choix ne se joue pas sur la performance passée, mais sur…"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>CTA engagement</label>
            <input className={inputClass} value={theme.ctaEngagement} onChange={setField('ctaEngagement')} />
          </div>
          <div>
            <label className={labelClass}>CTA partage</label>
            <input className={inputClass} value={theme.ctaPartage} onChange={setField('ctaPartage')} />
          </div>
        </div>
      </Section>

      <Section title="Mention réglementaire">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Éligibilité (optionnel)</label>
            <input
              className={inputClass}
              value={theme.eligibilite}
              onChange={setField('eligibilite')}
              placeholder="Ex. Éligible PEA / CTO uniquement"
            />
          </div>
          <div>
            <label className={labelClass}>Mention</label>
            <input
              className={inputClass}
              value={theme.mentionReglementaire}
              onChange={setField('mentionReglementaire')}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}
