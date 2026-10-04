import WorkspaceActions from '../../design-system/WorkspaceActions'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { DUELS } from './data.js'
import { buildCustomDuel, buildDuel, buildTweet, CATALOG, ROLES, resultReading, formatCapital, formatPercent } from './lib.js'
import { renderDuelImage } from './canvasImage.js'
import { YEARS } from '../../data/portfolio-assets.js'
import { generateDuel } from './generate.js'
import './portfolio-duels.css'

const duels = DUELS.map(buildDuel)
const initialLeft = [{ id: 'msci_world_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }]
const initialRight = [{ id: 'msci_acwi_ishares', pct: 100 }]

function AllocationEditor({ label, lines, onChange }) {
  const total = lines.reduce((sum, line) => sum + Number(line.pct || 0), 0)
  function setRole(role, id) {
    const current = lines.find((line) => CATALOG.find((item) => item.id === line.id)?.role === role)
    const others = lines.filter((line) => CATALOG.find((item) => item.id === line.id)?.role !== role)
    onChange([...others, ...(id ? [{ id, pct: current?.pct ?? 10 }] : [])])
  }
  function setWeight(id, value) {
    onChange(lines.map((line) => line.id === id ? { ...line, pct: value === '' ? '' : Number(value) } : line))
  }
  return <section className="pd-editor-side">
    <h3>Portefeuille {label} <span className={total === 100 ? 'pd-total-ok' : 'pd-total-bad'}>{total} % / 100 %</span></h3>
    {Object.entries(ROLES).map(([role, title]) => {
      const line = lines.find((entry) => CATALOG.find((item) => item.id === entry.id)?.role === role)
      return <div className="pd-editor-line" key={role}>
        <label><span>{title}{role !== 'base' ? ' (facultatif)' : ' (obligatoire)'}</span>
          <select aria-label={`${title} du portefeuille ${label}`} value={line?.id ?? ''} onChange={(event) => setRole(role, event.target.value)}>
            {role !== 'base' && <option value="">Aucun</option>}
            {CATALOG.filter((item) => item.role === role).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.name}</option>)}
          </select>
        </label>
        <label className="pd-weight"><span>Poids (%)</span><input aria-label={`Poids ${title.toLowerCase()} du portefeuille ${label}`} type="number" min="1" max="100" step="1" disabled={!line} value={line?.pct ?? ''} onChange={(event) => setWeight(line.id, event.target.value)} /></label>
      </div>
    })}
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
  const [imageStatus, setImageStatus] = useState('')
  const [imageError, setImageError] = useState('')
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

  async function downloadImage() {
    if (!duel || imageStatus === 'loading') return
    setImageStatus('loading'); setImageError('')
    try {
      const url = await renderDuelImage(duel)
      const link = document.createElement('a')
      link.href = url
      link.download = `duel-${duel.id}.png`
      document.body.append(link); link.click(); link.remove()
    } catch (problem) { setImageError(problem.message || 'Impossible de préparer le visuel. Réessaie.') }
    finally { setImageStatus('') }
  }

  return (
    <div className="pd-scope">
      <PageHeader title="Duel de portefeuilles" subtitle="Une base ETF, un complément et une thématique si tu le souhaites : compare deux constructions de portefeuille." />
      <ToolWorkspace renderImage={() => renderDuelImage(duel)} imageDisabled={!duel} imageAlt="Duel de portefeuilles">
      <section className="tool-settings">
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
      {mode === 'generated' && <div className="pd-controls"><p>Chaque portefeuille contient une base ETF, avec éventuellement un complément et une thématique.</p><Button type="button" onClick={regenerate}>🎲 Générer un autre duel</Button></div>}
      {mode === 'manual' && <>
        <div className="pd-editors"><AllocationEditor label="A" lines={left} onChange={setLeft} /><AllocationEditor label="B" lines={right} onChange={setRight} /></div>
        <p className="pd-hint">1 à 3 ETF par portefeuille : une base, un complément facultatif, une thématique facultative · mêmes dates et calcul en euros · pondérations rétablies au début de chaque année.</p>
        {error && <p className="pd-error" role="alert">{error}</p>}
      </>}

      </section>
      <section className="tool-preview">
      {duel && <><article className="pd-result">
        <p className="pd-kicker">⚔️ DUEL DE PORTEFEUILLES</p>
        <h2>{duel.title}</h2>
        <p className="pd-hook">{duel.hook}</p>
        <div className="pd-cards">
          {[duel.a, duel.b].map((portfolio, i) => (
            <section className={`pd-card pd-${i ? 'b' : 'a'}`} key={portfolio.name}>
              <h3>{i ? 'B' : 'A'} · {portfolio.name}</h3>
              {portfolio.assets.map((asset) => <p key={asset.id}>{asset.pct} % {asset.label} <small>· {ROLES[asset.role]}</small></p>)}
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
        <div className="pd-reading"><p>🅰️ {duel.readings[0]}</p><p>🅱️ {duel.readings[1]}</p><p>{resultReading(duel)}</p></div>
        <p className="pd-question">💬 {duel.question}</p>
      </article>

      <WorkspaceActions>
        <Button type="button" onClick={copyTweet}>📋 Copier le texte</Button>
        <Button type="button" variant="secondary" onClick={downloadImage} disabled={imageStatus === 'loading'}>{imageStatus === 'loading' ? 'Préparation de l’image…' : '🖼️ Télécharger l’image PNG'}</Button>
        {imageError && <span role="alert">{imageError}</span>}
        {copyStatus && <span role="status">{copyStatus}</span>}
      </WorkspaceActions>
      <label className="pd-text-label" htmlFor="pd-tweet">Texte prêt à publier</label>
      <textarea id="pd-tweet" readOnly value={tweet} rows={18} onFocus={(event) => event.target.select()} />
      <details className="pd-sources">
        <summary>Sources et calcul</summary>
        <p>Calcul en euros sur les années complètes disponibles pour les deux portefeuilles. Rendements USD convertis chaque année avec les taux EUR/USD de fin d’année de la BCE. Revenus réinvestis, pondérations rétablies au début de chaque année. Résultats indicatifs hors courtage, frais de rééquilibrage et fiscalité. Les frais courants des fonds sont déjà intégrés à leurs rendements publiés.</p>
        <ul>{duel.sources.map((source, i) => <li key={`${source.name}-${i}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : source.name}{source.isin ? ` · ${source.isin}` : ''}{source.note ? ` · ${source.note}` : ''}</li>)}</ul>
      </details>
      </>}
      {!duel && <p role="status">Complète les deux portefeuilles dans les réglages pour voir le résultat.</p>}
      </section>
      </ToolWorkspace>
    </div>
  )
}
