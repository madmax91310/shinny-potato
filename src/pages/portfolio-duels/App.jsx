import { useLocation } from 'react-router-dom'
import AssetToolLinks from '../../design-system/AssetToolLinks.jsx'
import { lazy, Suspense } from 'react'
const PortfolioExposureComparison = lazy(() => import('../../design-system/PortfolioExposureComparison.jsx'))
const PortfolioExposure = lazy(() => import('../../design-system/PortfolioExposure.jsx'))
import { usePublicationPreference } from '../../lib/usePublicationPreference.js'
import { notifyPublication, copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { DUELS, MANUAL_EXAMPLE } from './data.js'
import { buildCustomDuel, buildDuel, buildTweet, CATALOG, resultReading, formatCapital, formatPercent } from './lib.js'
const renderDuelImage = async duel => (await import('./canvasImage.js')).renderDuelImage(duel)
import { HISTORICAL_YEARS as YEARS } from '../../data/annual-window.js'
import { generateDuel } from './generate.js'
import './portfolio-duels.css'

const duels = DUELS.map(buildDuel)
const validAllocation = rows => Array.isArray(rows) && rows.length >= 1 && rows.length <= 6 && rows.every(r => r && CATALOG.some(a => a.id === r.id) && (r.pct === '' || Number.isFinite(r.pct)))
const initialLeft = [{ id: 'msci_world_ishares', pct: 80 }, { id: 'msci_em', pct: 20 }]
const initialRight = [{ id: 'msci_acwi_ishares', pct: 80 }, { id: 'smallcap_monde', pct: 20 }]

const AllocationEditor = lazy(() => import('./AllocationEditor.jsx'))


export default function App() {
  const { search } = useLocation()
  return <DuelWorkspace key={search} search={search} />
}

function DuelWorkspace({ search }) {
  const requested = duels.find(d => d.id === new URLSearchParams(search).get('duel'))
  const requestedAsset=CATALOG.find(a=>a.id===new URLSearchParams(search).get('asset'))
  const [linkedId, setLinkedId] = useState(requested?.id ?? null)
  const [savedId, setSavedId] = usePublicationPreference('duel-selected', duels[0].id, id => duels.some(d => d.id === id))
  const selectedId = linkedId ?? savedId
  const setSelectedId = id => { setLinkedId(null); setSavedId(id) }
  const index = duels.findIndex(d => d.id === selectedId)
  const setIndex = next => setSelectedId(duels[next].id)
  const [savedMode, setSavedMode] = usePublicationPreference('duel-mode', 'prepared', mode => ['prepared', 'manual'].includes(mode))
  const [linkedMode, setLinkedMode] = useState(requestedAsset?'manual':requested?'prepared':null)
  const mode = linkedMode ?? savedMode
  const setMode = value => { setLinkedMode(null); setSavedMode(value) }
  const [savedLeft, setSavedLeft] = usePublicationPreference('duel-left', initialLeft, validAllocation)
  const [savedRight, setSavedRight] = usePublicationPreference('duel-right', initialRight, validAllocation)
  const [linkedLeft,setLinkedLeft]=useState(()=>requestedAsset?[{id:requestedAsset.id,pct:100}]:null)
  const [linkedRight,setLinkedRight]=useState(()=>requestedAsset?[{id:'msci_world_ishares',pct:100}]:null)
  const left=linkedLeft??savedLeft,right=linkedRight??savedRight
  const setLeft=value=>{setLinkedLeft(null);setSavedLeft(value)}
  const setRight=value=>{setLinkedRight(null);setSavedRight(value)}
  const [generated, setGenerated] = useState(() => generateDuel())
  const [copyStatus, setCopyStatus] = useState('')
  const [imageStatus, setImageStatus] = useState('')
  const [imageError, setImageError] = useState('')
  const lastIndex = useRef(index)
  let manual = null
  let error = ''
  if (mode === 'manual') {
    try { manual = buildCustomDuel({ left, right }) } catch (problem) { error = problem.message }
  }
  const duel = mode === 'manual' ? manual : mode === 'generated' ? generated : duels[index]
  const tweet = duel ? buildTweet(duel) : ''
  const publicationRef = useRef(tweet)
  publicationRef.current = tweet

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
    try { await copyPublicationText(tweet); setCopyStatus('Copié !') }
    catch { setCopyStatus('Sélectionne et copie le texte ci-dessous.') }
  }

  async function downloadImage() {
    if (!duel || imageStatus === 'loading') return
    const requestedTweet = tweet
    setImageStatus('loading'); setImageError('')
    try {
      const url = await renderDuelImage(duel)
      if (publicationRef.current !== requestedTweet) return
      const link = document.createElement('a')
      link.href = url
      link.download = `duel-${duel.id}.png`
      document.body.append(link); startPublicationDownload(link); link.remove()
    } catch (problem) { setImageError(problem.message || 'Impossible de préparer le visuel. Réessaie.'); notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
    finally { setImageStatus('') }
  }

  return (
    <div className="pd-scope">
      <PageHeader title="Duel de portefeuilles" subtitle="Compare librement deux portefeuilles : un ETF seul, plusieurs actions ou une combinaison des deux." />
      <ToolWorkspace renderImage={() => renderDuelImage(duel)} imageDisabled={!duel} imageAlt="Duel de portefeuilles">
      <section className="tool-settings">
      <Button variant="secondary" onClick={() => { setIndex(0); setMode('prepared'); setLeft(initialLeft); setRight(initialRight) }}>Réinitialiser les réglages</Button>
      <div className="pd-modes" role="group" aria-label="Mode de duel">
        {[['prepared', 'Duels préparés'], ['generated', 'Générer un duel'], ['manual', 'Composer A et B']].map(([key, label]) =>
          <button key={key} type="button" className={mode === key ? 'pd-mode-active' : ''} aria-pressed={mode === key} onClick={() => { setMode(key); setCopyStatus('') }}>{label}</button>)}
      </div>
      {mode === 'prepared' && <div className="pd-controls">
        <label htmlFor="pd-select">Choisir un duel</label>
        <ChoicePicker id="pd-select" value={index} onChange={(event) => choose(Number(event.target.value))}>
          {duels.map((item, i) => <option key={item.id} value={i}>{item.title}</option>)}
        </ChoicePicker>
        <Button type="button" variant="secondary" onClick={randomDuel}>🎲 Un autre duel</Button>
      </div>}
      {mode === 'generated' && <div className="pd-controls"><p>Chaque portefeuille contient une base ETF et un complément, avec parfois une troisième ligne thématique.</p><Button type="button" onClick={regenerate}>🎲 Générer un autre duel</Button></div>}
      {mode === 'manual' && <>
        <Button variant="secondary" onClick={() => {
          setLeft(MANUAL_EXAMPLE.left.map(line => ({ ...line })))
          setRight(MANUAL_EXAMPLE.right.map(line => ({ ...line })))
        }}>Exemple : World vs 6 actions</Button>
        <div className="pd-editors"><Suspense fallback={<p role="status">Chargement des actifs…</p>}><AllocationEditor label="A" lines={left} onChange={setLeft} /></Suspense><Suspense fallback={<p role="status">Chargement des actifs…</p>}><AllocationEditor label="B" lines={right} onChange={setRight} /></Suspense></div>
        <p className="pd-hint">1 à 6 actifs par portefeuille, sans base ETF obligatoire · total de 100 % de chaque côté · mêmes dates et calcul en euros · pondérations rétablies au début de chaque année.</p>
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
              {portfolio.assets.map((asset) => <p key={asset.id}>{asset.pct} % {asset.label}</p>)}
              <Suspense fallback={<p>Chargement des expositions…</p>}><PortfolioExposure lines={portfolio.assets} name={i ? "B" : "A"} /></Suspense>
              <strong>{formatCapital(portfolio.final, duel.currency)}</strong>
              <small>pour 10 000 {duel.currency === 'USD' ? '$' : '€'} au départ</small>
            </section>
          ))}
        </div>
        <Suspense fallback={<p>Chargement de la comparaison…</p>}><PortfolioExposureComparison left={duel.a.assets} right={duel.b.assets} /></Suspense>
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
        {copyStatus && <span>{copyStatus}</span>}
      </WorkspaceActions>
      <label className="pd-text-label" htmlFor="pd-tweet">Texte prêt à publier</label>
      <textarea id="pd-tweet" readOnly value={tweet} rows={18} onFocus={(event) => event.target.select()} />
      <details><summary>Explorer les supports de ce duel</summary>{[...new Map([...duel.a.assets, ...duel.b.assets].map(asset => [asset.isin,asset])).values()].map(asset => <section key={asset.isin}><h3>{asset.name}</h3><AssetToolLinks isin={asset.isin} exclude="duel" /></section>)}</details>
      <details className="pd-sources">
        <summary>Sources et calcul</summary>
        <p>Calcul en euros sur les années complètes disponibles pour les deux portefeuilles. Rendements en devises convertis en euros avec les taux de référence BCE de fin d’année, sans couverture de change. Revenus réinvestis, pondérations rétablies au début de chaque année. Résultats indicatifs hors courtage, frais de rééquilibrage et fiscalité. Les frais courants des fonds sont déjà intégrés à leurs rendements publiés.</p>
        <ul>{duel.sources.map((source, i) => <li key={`${source.name}-${i}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : source.name}{source.isin ? ` · ${source.isin}` : ''}{source.note ? ` · ${source.note}` : ''}</li>)}</ul>
      </details>
      </>}
      {!duel && <p role="status">Complète les deux portefeuilles dans les réglages pour voir le résultat.</p>}
      </section>
      </ToolWorkspace>
    </div>
  )
}
