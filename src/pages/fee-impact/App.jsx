import { downloadPublicationBlob } from '../../design-system/downloadBlob.js'
import { notifyPublication, copyPublicationText } from '../../design-system/publicationActions.js'
import Button from '../../design-system/Button'
import AssetPicker from '../../design-system/AssetPicker'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import SettingsDetails from '../../design-system/SettingsDetails'
import { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import { getLengthStatus } from '../../lib/publication-length.js'
import { AMOUNT_PRESETS, DURATION_PRESETS, RETURN_PRESETS, FEE_LEVELS, DEFAULT_FEE_LOW, DEFAULT_FEE_HIGH } from './data.js'
import { buildTweetText, computeComparison, effectiveFees, pickRandomState, simulateCapitalSeries } from './lib.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { ENVELOPE_FEES, envelopeFeeOption } from '../../data/envelope-fees.js'
import { drawFeeImpactImage } from './imageExport.js'
import { FEE_COMPARISON_ASSETS } from '../../data/fee-comparison-assets.js'
import './fee-impact.css'

const BADGE_CLASS = { ok: 'fi-badge-ok', warn: 'fi-badge-warn', danger: 'fi-badge-danger' }

export default function App() {
  const [amount, setAmount] = useState(300)
  const [amountRaw, setAmountRaw] = useState('300')
  const [years, setYears] = useState(20)
  const [yearsRaw, setYearsRaw] = useState('20')
  const [returnRate, setReturnRate] = useState(7)
  const [isin1, setIsin1] = useState('')
  const [isin2, setIsin2] = useState('')
  const [fee1, setFee1] = useState(DEFAULT_FEE_LOW)
  const [fee2, setFee2] = useState(DEFAULT_FEE_HIGH)
  const [envelope1, setEnvelope1] = useState('')
  const [envelope2, setEnvelope2] = useState('')
  const [punchline, setPunchline] = useState('')
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)
  const imageRef = useRef(null)

  // Une phrase rédigée pour un écart précis ne suit pas un changement de scénario.
  useEffect(() => setPunchline(''), [amount, years, returnRate, fee1, fee2, isin1, isin2, envelope1, envelope2])
  const state = useMemo(() => ({ amount, years, returnRate, fee1, fee2, punchline, isin1, isin2, envelope1, envelope2 }), [amount, years, returnRate, fee1, fee2, punchline, isin1, isin2, envelope1, envelope2])
  const effective = useMemo(() => effectiveFees(state), [state])
  const text = useMemo(() => buildTweetText(state), [state])
  const status = getLengthStatus(text.length)
  const comparison = useMemo(() => computeComparison(state), [state])
  const first = useMemo(() => simulateCapitalSeries(amount, years, returnRate, effective.fee1), [amount, years, returnRate, effective.fee1])
  const second = useMemo(() => simulateCapitalSeries(amount, years, returnRate, effective.fee2), [amount, years, returnRate, effective.fee2])

  useEffect(() => {
    const canvas = imageRef.current
    // The image shows the fees actually charged: support plus envelope.
    if (canvas) drawFeeImpactImage(canvas.getContext('2d'), { ...state, fee1: effective.fee1, fee2: effective.fee2 }, first, second, comparison)
  }, [state, effective, first, second, comparison])

  function handleDownloadImage() {
    imageRef.current?.toBlob((blob) => {
      if (!blob) { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error'); return }
      downloadPublicationBlob(blob, 'epargnant-libre-impact-des-frais.png')
    }, 'image/png')
  }

  function selectFund(side, isin) {
    const asset = FEE_COMPARISON_ASSETS.find(item => item.isin === isin)
    if (side === 1) { setIsin1(isin); if (asset) setFee1(asset.fee) }
    else { setIsin2(isin); if (asset) setFee2(asset.fee) }
    setCopied(false)
  }
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
    setIsin1('')
    setIsin2('')
    setEnvelope1('')
    setEnvelope2('')
    setFee1(picked.fee1)
    setFee2(picked.fee2)
    setCopied(false)
  }

  async function handleCopy() {
    try {
      await copyPublicationText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // presse-papier indisponible (permissions navigateur) : on ignore silencieusement
    }
  }

  return (
    <div className="fi-scope">
      <PageHeader
        title="Calculateur d'impact des frais"
        subtitle="Ce que les frais de gestion (TER) coûtent réellement en euros sur le long terme, via l'effet cumulé des intérêts composés — simulation pédagogique, pas une donnée de marché."
      />

      <ToolWorkspace className="fi-layout" imageContent={<div className="fi-preview fi-image-panel">
            <p className="fi-eyebrow">Aperçu de l’image</p>
            <canvas ref={imageRef} width="1600" height="1600" className="fi-image" role="img" aria-label="Évolution comparée des deux scénarios de frais et écart final" />

          </div>} actions={<><Button onClick={handleCopy}>{copied ? "Copié ✓" : "Copier le texte"}</Button><Button variant="secondary" onClick={handleDownloadImage}>Télécharger l’image PNG</Button></>}>
        <section className="fi-control-col tool-settings">
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
            <p className="fi-hint">Hypothèse constante, pas une performance observée. Versements en fin de mois ; taux mensuel équivalent au rendement annuel effectif après frais proportionnels, comme dans le Simulateur de patrimoine. Fiscalité et inflation exclues.</p>
          </div>

          <div className="fi-panel">
            <p className="fi-eyebrow">Frais annuels — scénario 1</p>
            <SettingsDetails title="Utiliser les frais d’un ETF" summary="Facultatif · deux scénarios">
            {[1, 2].map(side => {
              const isin = side === 1 ? isin1 : isin2
              const asset = FEE_COMPARISON_ASSETS.find(item => item.isin === isin)
              return <div key={side}>
                <AssetPicker className="fi-control" label={`ETF du scénario ${side}`} value={isin}
                  items={FEE_COMPARISON_ASSETS}
                  emptyOption={{ id: '', label: 'Frais hypothétiques' }} onChange={value => selectFund(side, value)} />
                {asset && <small>{asset.isin} · Frais contrôlés le {asset.evidence.checkedAt ?? 'date non documentée'} · <a href={asset.evidence.sourceUrls[0]} target="_blank" rel="noreferrer">Source</a></small>}
              </div>
            })}
            </SettingsDetails>
            <SettingsDetails title="Ajouter les frais d’une enveloppe" summary={envelope1 || envelope2 ? `${envelopeFeeOption(envelope1).fee.toLocaleString('fr-FR')} % / ${envelopeFeeOption(envelope2).fee.toLocaleString('fr-FR')} %` : 'Facultatif · frais sur unités de compte'}>
            {[1, 2].map(side => {
              const value = side === 1 ? envelope1 : envelope2
              const option = envelopeFeeOption(value)
              return <div key={side}>
                <label className="fi-field">Enveloppe du scénario {side}<ChoicePicker className="fi-control" aria-label={`Enveloppe du scénario ${side}`} value={value} onChange={event => { (side === 1 ? setEnvelope1 : setEnvelope2)(event.target.value); setCopied(false) }}>
                  {ENVELOPE_FEES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </ChoicePicker></label>
                {option.fee > 0 && <small>Frais de gestion du contrat relevés le {option.checkedAt} · <a href={option.sourceUrl} target="_blank" rel="noreferrer">Source</a>{option.scope ? ` · ${option.scope}` : ''}</small>}
              </div>
            })}
            </SettingsDetails>
            <p className="fi-hint">Les frais des ETF et des contrats sont ceux du registre commun ; les frais d’enveloppe s’ajoutent à ceux du support{effective.fee1 !== fee1 || effective.fee2 !== fee2 ? ` (total : ${effective.fee1.toLocaleString('fr-FR')} % et ${effective.fee2.toLocaleString('fr-FR')} %)` : ''}. Le rendement brut reste une même hypothèse pour les deux scénarios : ce calcul ne compare pas leurs performances réelles.</p>
            <div className="fi-chip-row">
              {FEE_LEVELS.map((f) => (
                <button key={f.value} type="button" className={`fi-chip ${fee1 === f.value ? 'active' : ''}`} onClick={() => { setIsin1(''); setFee1(f.value) }}>
                  {f.label}
                </button>
              ))}
            </div>
            <p className="fi-eyebrow" style={{ marginTop: 6 }}>Frais annuels — scénario 2</p>
            <div className="fi-chip-row">
              {FEE_LEVELS.map((f) => (
                <button key={f.value} type="button" className={`fi-chip ${fee2 === f.value ? 'active' : ''}`} onClick={() => { setIsin2(''); setFee2(f.value) }}>
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

        <section className="fi-preview-col tool-preview">
          <div className="fi-preview" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="fi-eyebrow" htmlFor="fi-punchline" style={{ margin: 0 }}>Ta phrase personnelle · facultatif</label>
            <input
              id="fi-punchline" className="fi-control" type="text" value={punchline}
              onChange={(e) => setPunchline(e.target.value)}
              placeholder="Ce que cet écart t'inspire..."
            />
            <p className="fi-hint">Ce champ ajoute ta phrase au tweet. Une phrase personnalisée est réinitialisée quand tu changes de scénario.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="fi-eyebrow" style={{ margin: 0 }}>Aperçu du tweet</p>
              <span className={`fi-badge ${BADGE_CLASS[status.level]}`}>{status.label}</span>
            </div>
            <pre className="fi-preview-text">{text}</pre>

          </div>
        </section>
      </ToolWorkspace>
    </div>
  )
}
