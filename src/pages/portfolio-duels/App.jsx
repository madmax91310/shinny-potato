import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { DUELS } from './data.js'
import { buildCustomDuel, buildDuel, buildTweet, CATALOG, formatCapital, formatPercent } from './lib.js'
import { renderDuelImage } from './canvasImage.js'
import { YEARS } from '../portfolio-generator/data.js'
import { generateDuel } from './generate.js'
import './portfolio-duels.css'

const duels = DUELS.map(buildDuel)
const initialLeft = [{ id: 'msci_acwi_ishares', pct: 70 }, { id: 'action_visa', pct: 10 }, { id: 'action_microsoft', pct: 10 }, { id: 'action_cocacola', pct: 10 }]
const initialRight = [{ id: 'sp500_ishares', pct: 60 }, { id: 'sect_tech_world_ishares', pct: 20 }, { id: 'or', pct: 10 }, { id: 'spot_bitcoin', pct: 10 }]
const groups = [...new Set(CATALOG.map((asset) => asset.group))]

function AllocationEditor({ label, lines, onChange }) {
  const total = lines.reduce((sum, line) => sum + Number(line.pct || 0), 0)
  function edit(index, field, value) {
    onChange(lines.map((line, i) => i === index ? { ...line, [field]: value } : line))
  }
  return <section className="pd-editor-side">
    <h3>Portefeuille {label} <span className={total === 100 ? 'pd-total-ok' : 'pd-total-bad'}>{total} % / 100 %</span></h3>
    {lines.map((line, index) => <div className="pd-editor-line" key={index}>
      <label><span>Actif {index + 1}</span><select aria-label={`Actif ${index + 1} du portefeuille ${label}`} value={line.id} onChange={(event) => edit(index, 'id', event.target.value)}>
        {groups.map((group) => <optgroup key={group} label={group}>
          {CATALOG.filter((item) => item.group === group).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </optgroup>)}
      </select></label>
      <label className="pd-weight"><span>Poids (%)</span><input aria-label={`Poids de l’actif ${index + 1} du portefeuille ${label}`} type="number" min="1" max="95" step="1" value={line.pct} onChange={(event) => edit(index, 'pct', event.target.value === '' ? '' : Number(event.target.value))} /></label>
      <button type="button" aria-label={`Retirer l’actif ${index + 1} du portefeuille ${label}`} disabled={lines.length <= 2} onClick={() => onChange(lines.filter((_, i) => i !== index))}>✕</button>
    </div>)}
    <button type="button" className="pd-add" disabled={lines.length >= 5} onClick={() => onChange([...lines, { id: CATALOG.find((asset) => !lines.some((line) => line.id === asset.id)).id, pct: 10 }])}>+ Ajouter un actif</button>
  </section>
}

function fallbackCopy(value) {
  const area = document.createElement('textarea')
  area.value = value
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.append(area)
  area.select()
  let copied = false
  try { copied = document.execCommand('copy') } catch { /* La sélection manuelle reste disponible. */ }
  area.remove()
  return copied
}

export default function App() {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState('prepared')
  const [left, setLeft] = useState(initialLeft)
  const [right, setRight] = useState(initialRight)
  const [generated, setGenerated] = useState(() => generateDuel())
  const [copyStatus, setCopyStatus] = useState('')
  const lastIndex = useRef(0)
  let manual = null
  let error = ''
  if (mode === 'manual') {
    try { manual = buildCustomDuel({ left, right }) } catch (problem) { error = problem.message }
  }
  const duel = mode === 'manual' ? manual : mode === 'generated' ? generated : duels[index]
  const tweet = duel ? buildTweet(duel) : ''

  function choose(next) {
    lastIndex.current = next
    setIndex(next)
    setCopyStatus('')
  }

  function randomDuel() {
    const choices = duels.map((_, i) => i).filter((i) => i !== lastIndex.current)
    choose(choices[Math.floor(Math.random() * choices.length)])
  }

  function regenerate() {
    setGenerated(generateDuel(generated.id))
    setCopyStatus('')
  }

  async function copyTweet() {
    let ok = false
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(tweet); ok = true } catch { /* Repli ci-dessous. */ }
    }
    if (!ok) ok = fallbackCopy(tweet)
    setCopyStatus(ok ? 'Copié !' : 'Sélectionne et copie le texte ci-dessous.')
  }

  function downloadImage() {
    const link = document.createElement('a')
    link.href = renderDuelImage(duel)
    link.download = `duel-${duel.id}.png`
    document.body.append(link)
    link.click()
    link.remove()
  }

  return (
    <div className="pd-scope">
      <PageHeader title="Duel de portefeuilles" subtitle="Compare deux allocations : choisis un duel, génère une idée ou compose tes portefeuilles." />
      <div className="pd-modes" role="group" aria-label="Mode de duel">
        {[['prepared', 'Duels préparés'], ['generated', 'Générer un duel'], ['manual', 'Composer A et B']].map(([key, label]) =>
          <button key={key} type="button" className={mode === key ? 'pd-mode-active' : ''} aria-pressed={mode === key} onClick={() => { setMode(key); setCopyStatus('') }}>{label}</button>)}
      </div>
      {mode === 'prepared' && <div className="pd-controls">
        <label htmlFor="pd-select">Choisir un duel</label>
        <select id="pd-select" value={index} onChange={(event) => choose(Number(event.target.value))}>
          {duels.map((item, i) => <option key={item.id} value={i}>{item.title}</option>)}
        </select>
        <Button type="button" variant="secondary" onClick={randomDuel}>🎲 Un autre duel</Button>
      </div>}
      {mode === 'generated' && <div className="pd-controls"><p>Un nouveau face-à-face tiré parmi les cœurs ETF, actions, thèmes et actifs de diversification.</p><Button type="button" onClick={regenerate}>🎲 Générer un autre duel</Button></div>}
      {mode === 'manual' && <>
        <div className="pd-editors"><AllocationEditor label="A" lines={left} onChange={setLeft} /><AllocationEditor label="B" lines={right} onChange={setRight} /></div>
        <p className="pd-hint">2 à 5 actifs par portefeuille · mêmes dates et calcul en euros · pondérations rétablies au début de chaque année.</p>
        {error && <p className="pd-error" role="alert">{error}</p>}
      </>}

      {duel && <><article className="pd-result">
        <p className="pd-kicker">⚔️ DUEL DE PORTEFEUILLES</p>
        <h2>{duel.title}</h2>
        <p className="pd-hook">{duel.hook}</p>
        <div className="pd-cards">
          {[duel.a, duel.b].map((portfolio, i) => (
            <section className={`pd-card pd-${i ? 'b' : 'a'}`} key={portfolio.name}>
              <h3>{i ? 'B' : 'A'} · {portfolio.name}</h3>
              {portfolio.assets.map((asset) => <p key={asset.id}>{asset.pct} % {asset.name}</p>)}
              <strong>{formatCapital(portfolio.final, duel.currency)}</strong>
              <small>pour 10 000 {duel.currency === 'USD' ? '$' : '€'} au départ</small>
            </section>
          ))}
        </div>
        <div className="pd-table-wrap">
          <table className="pd-table">
            <caption>Performances annuelles des deux portefeuilles ({duel.currency})</caption>
            <thead><tr><th>Année</th><th>A · {duel.a.name}</th><th>B · {duel.b.name}</th></tr></thead>
            <tbody>{(duel.years ?? YEARS).map((year) => <tr key={year}><th>{year}</th><td>{formatPercent(duel.a.annual[year])}</td><td>{formatPercent(duel.b.annual[year])}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="pd-worst">📉 Pire année : A {formatPercent(duel.a.worst)} ({duel.a.worstYear}) · B {formatPercent(duel.b.worst)} ({duel.b.worstYear})</p>
        <p className="pd-question">💬 {duel.question}</p>
      </article>

      <div className="pd-actions">
        <Button type="button" onClick={copyTweet}>📋 Copier le texte</Button>
        <Button type="button" variant="secondary" onClick={downloadImage}>🖼️ Télécharger l’image PNG</Button>
        {copyStatus && <span role="status">{copyStatus}</span>}
      </div>
      <label className="pd-text-label" htmlFor="pd-tweet">Texte prêt à publier</label>
      <textarea id="pd-tweet" readOnly value={tweet} rows={18} onFocus={(event) => event.target.select()} />
      <details className="pd-sources">
        <summary>Sources et calcul</summary>
        <p>{duel.currency === 'EUR' && !duel.commonAsset ? 'Calcul en euros. Rendements USD convertis chaque année avec les taux EUR/USD de fin d’année de la BCE. ' : `Parts en ${duel.currency}. `}Pondérations rétablies au début de chaque année. Résultats indicatifs hors courtage et fiscalité. Les actions sont calculées sur leurs cours, hors dividendes ; la SCPI est une moyenne de marché et les cryptos des cours spot.</p>
        <ul>{duel.sources.map((source, i) => <li key={`${source.name}-${i}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : source.name}{source.isin ? ` · ${source.isin}` : ''}{source.note ? ` · ${source.note}` : ''}</li>)}</ul>
      </details>
      </>}
    </div>
  )
}
