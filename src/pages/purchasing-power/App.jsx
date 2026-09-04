import { useMemo, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import { getLengthStatus } from '../etf-tweets/lib/tweetFormat.js'
import { AMOUNT_PRESETS, YEAR_PRESETS, YEAR_MIN, YEAR_MAX, POSTES, POSTE_ORDER } from './data.js'
import { CURRENT_YEAR, buildTweetText, pickRandomState } from './lib.js'
import './purchasing-power.css'

const BADGE_CLASS = { ok: 'pp-badge-ok', warn: 'pp-badge-warn', danger: 'pp-badge-danger' }

const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i)

export default function App() {
  const [amount, setAmount] = useState(1000)
  const [amountRaw, setAmountRaw] = useState('1000')
  const [startYear, setStartYear] = useState(2015)
  const [mode, setMode] = useState('brut')
  const [posteId, setPosteId] = useState('loyer')
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)

  const state = useMemo(() => ({ amount, startYear, mode, posteId: mode === 'par-poste' ? posteId : null }), [amount, startYear, mode, posteId])
  const text = useMemo(() => buildTweetText(state), [state])
  const status = getLengthStatus(text.length)

  function handleAmountChip(value) {
    setAmount(value)
    setAmountRaw(String(value))
  }
  function handleAmountInput(raw) {
    setAmountRaw(raw)
    const n = parseFloat(raw.replace(',', '.'))
    if (Number.isFinite(n) && n > 0) setAmount(n)
  }

  function handleRandom() {
    const picked = pickRandomState(history)
    setHistory((h) => [...h, picked.key])
    setAmount(picked.amount)
    setAmountRaw(String(picked.amount))
    setStartYear(picked.startYear)
    setMode(picked.mode)
    if (picked.mode === 'par-poste') setPosteId(picked.posteId)
    setCopied(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // presse-papier indisponible (permissions navigateur) : on ignore silencieusement
    }
  }

  return (
    <div className="pp-scope">
      <PageHeader
        title="💶 Simulateur de pouvoir d'achat"
        subtitle="Compare le coût de la vie dans le temps — sans passer par un placement. Séries INSEE (inflation, loyers, alimentation, énergie) 2010-2026."
      />

      <div className="pp-layout">
        <section className="pp-control-col">
          <div className="pp-panel">
            <p className="pp-eyebrow">Montant</p>
            <div className="pp-chip-row">
              {AMOUNT_PRESETS.map((v) => (
                <button key={v} type="button" className={`pp-chip ${amount === v ? 'active' : ''}`} onClick={() => handleAmountChip(v)}>
                  {v} €
                </button>
              ))}
            </div>
            <div className="pp-select-wrap">
              <input
                type="number" min="1" step="any" inputMode="decimal" className="pp-control"
                value={amountRaw} onChange={(e) => handleAmountInput(e.target.value)} placeholder="Montant libre"
              />
            </div>
          </div>

          <div className="pp-panel">
            <p className="pp-eyebrow">Année de départ</p>
            <div className="pp-chip-row">
              {YEAR_PRESETS.map((y) => (
                <button key={y} type="button" className={`pp-chip ${startYear === y ? 'active' : ''}`} onClick={() => setStartYear(y)}>
                  {y}
                </button>
              ))}
            </div>
            <div className="pp-select-wrap">
              <select className="pp-control" value={startYear} onChange={(e) => setStartYear(parseInt(e.target.value, 10))}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="pp-hint">Comparé à aujourd'hui ({CURRENT_YEAR}, dernière donnée disponible).</p>
          </div>

          <div className="pp-panel">
            <p className="pp-eyebrow">Mode</p>
            <div className="pp-segmented">
              <button type="button" className={mode === 'brut' ? 'active' : ''} onClick={() => setMode('brut')}>
                Pouvoir d'achat brut
              </button>
              <button type="button" className={mode === 'par-poste' ? 'active' : ''} onClick={() => setMode('par-poste')}>
                Comparaison par poste
              </button>
            </div>
            {mode === 'brut' && (
              <p className="pp-hint">Corrigé de l'inflation générale INSEE, comparé à l'évolution du SMIC sur la période.</p>
            )}
            {mode === 'par-poste' && (
              <>
                <div className="pp-chip-row">
                  {POSTE_ORDER.map((id) => {
                    const p = POSTES[id]
                    return (
                      <button key={id} type="button" className={`pp-chip ${posteId === id ? 'active' : ''}`} onClick={() => setPosteId(id)}>
                        {p.icon} {p.label}
                      </button>
                    )
                  })}
                </div>
                <p className="pp-hint">Source : {POSTES[posteId].sourceLabel}.</p>
                {POSTES[posteId].isPartialLatestYear && (
                  <p className="pp-hint pp-hint-warning">⚠️ 2026 n'est pas terminée — la valeur retenue est une variation sur 12 mois glissants, pas une moyenne annuelle comme les autres années.</p>
                )}
              </>
            )}
          </div>

          <button type="button" className="pp-random-btn" onClick={handleRandom}>
            🔄 Aléatoire
          </button>
          {history.length > 0 && (
            <p className="pp-hint">
              {history.length} tirage{history.length > 1 ? 's' : ''} aléatoire{history.length > 1 ? 's' : ''} cette session — pas de répétition tant que la bibliothèque n'a pas quasiment tourné une fois.
            </p>
          )}
        </section>

        <section className="pp-preview-col">
          <div className="pp-preview" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="pp-eyebrow" style={{ margin: 0 }}>Aperçu du tweet</p>
              <span className={`pp-badge ${BADGE_CLASS[status.level]}`}>{status.label}</span>
            </div>
            <pre className="pp-preview-text">{text}</pre>
            <button type="button" className="pp-copy-btn" onClick={handleCopy}>
              {copied ? 'Copié ✓' : 'Copier le texte'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
