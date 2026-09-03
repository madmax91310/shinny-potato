import { useMemo, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import { getLengthStatus } from '../etf-tweets/lib/tweetFormat.js'
import { AMOUNT_PRESETS, DURATION_PRESETS, RETURN_PRESETS, FEE_LEVELS, DEFAULT_FEE_LOW, DEFAULT_FEE_HIGH } from './data.js'
import { buildTweetText, pickRandomState } from './lib.js'
import './fee-impact.css'

const BADGE_CLASS = { ok: 'fi-badge-ok', warn: 'fi-badge-warn', danger: 'fi-badge-danger' }

export default function App() {
  const [amount, setAmount] = useState(300)
  const [amountRaw, setAmountRaw] = useState('300')
  const [years, setYears] = useState(20)
  const [yearsRaw, setYearsRaw] = useState('20')
  const [returnRate, setReturnRate] = useState(7)
  const [fee1, setFee1] = useState(DEFAULT_FEE_LOW)
  const [fee2, setFee2] = useState(DEFAULT_FEE_HIGH)
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)

  const state = useMemo(() => ({ amount, years, returnRate, fee1, fee2 }), [amount, years, returnRate, fee1, fee2])
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

  function handleYearsChip(value) {
    setYears(value)
    setYearsRaw(String(value))
  }
  function handleYearsInput(raw) {
    setYearsRaw(raw)
    const n = parseFloat(raw.replace(',', '.'))
    if (Number.isFinite(n) && n > 0) setYears(n)
  }

  function handleRandom() {
    const picked = pickRandomState(history)
    setHistory((h) => [...h, picked.key])
    setAmount(picked.amount)
    setAmountRaw(String(picked.amount))
    setYears(picked.years)
    setYearsRaw(String(picked.years))
    setReturnRate(picked.returnRate)
    setFee1(picked.fee1)
    setFee2(picked.fee2)
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
    <div className="fi-scope">
      <PageHeader
        title="🧮 Calculateur d'impact des frais"
        subtitle="Ce que les frais de gestion (TER) coûtent réellement en euros sur le long terme, via l'effet cumulé des intérêts composés — simulation pédagogique, pas une donnée de marché."
      />

      <div className="fi-layout">
        <section className="fi-control-col">
          <div className="fi-panel">
            <p className="fi-eyebrow">Montant investi / mois</p>
            <div className="fi-chip-row">
              {AMOUNT_PRESETS.map((v) => (
                <button key={v} type="button" className={`fi-chip ${amount === v ? 'active' : ''}`} onClick={() => handleAmountChip(v)}>
                  {v} €
                </button>
              ))}
            </div>
            <input
              type="number" min="1" step="any" inputMode="decimal" className="fi-control"
              value={amountRaw} onChange={(e) => handleAmountInput(e.target.value)} placeholder="Montant libre"
            />
          </div>

          <div className="fi-panel">
            <p className="fi-eyebrow">Durée</p>
            <div className="fi-chip-row">
              {DURATION_PRESETS.map((y) => (
                <button key={y} type="button" className={`fi-chip ${years === y ? 'active' : ''}`} onClick={() => handleYearsChip(y)}>
                  {y} ans
                </button>
              ))}
            </div>
            <input
              type="number" min="1" step="any" inputMode="decimal" className="fi-control"
              value={yearsRaw} onChange={(e) => handleYearsInput(e.target.value)} placeholder="Durée libre (années)"
            />
          </div>

          <div className="fi-panel">
            <p className="fi-eyebrow">Rendement brut hypothétique</p>
            <div className="fi-chip-row">
              {RETURN_PRESETS.map((r) => (
                <button key={r} type="button" className={`fi-chip ${returnRate === r ? 'active' : ''}`} onClick={() => setReturnRate(r)}>
                  {r} %
                </button>
              ))}
            </div>
            <p className="fi-hint">Hypothèse de simulation choisie librement — jamais une performance de marché réelle.</p>
          </div>

          <div className="fi-panel">
            <p className="fi-eyebrow">Frais annuels — scénario 1</p>
            <div className="fi-chip-row">
              {FEE_LEVELS.map((f) => (
                <button key={f.value} type="button" className={`fi-chip ${fee1 === f.value ? 'active' : ''}`} onClick={() => setFee1(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            <p className="fi-eyebrow" style={{ marginTop: 6 }}>Frais annuels — scénario 2</p>
            <div className="fi-chip-row">
              {FEE_LEVELS.map((f) => (
                <button key={f.value} type="button" className={`fi-chip ${fee2 === f.value ? 'active' : ''}`} onClick={() => setFee2(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="fi-random-btn" onClick={handleRandom}>
            🔄 Aléatoire
          </button>
          {history.length > 0 && (
            <p className="fi-hint">
              {history.length} tirage{history.length > 1 ? 's' : ''} aléatoire{history.length > 1 ? 's' : ''} cette session — pas de répétition tant que la bibliothèque n'a pas quasiment tourné une fois.
            </p>
          )}
        </section>

        <section className="fi-preview-col">
          <div className="fi-preview" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="fi-eyebrow" style={{ margin: 0 }}>Aperçu du tweet</p>
              <span className={`fi-badge ${BADGE_CLASS[status.level]}`}>{status.label}</span>
            </div>
            <pre className="fi-preview-text">{text}</pre>
            <button type="button" className="fi-copy-btn" onClick={handleCopy}>
              {copied ? 'Copié ✓' : 'Copier le texte'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
