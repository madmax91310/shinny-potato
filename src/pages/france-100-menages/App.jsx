import Button from '../../design-system/Button'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import { HOUSEHOLD_STATISTICS, HOUSEHOLD_SOURCES, buildHouseholdTweet } from '../../data/household-statistics.js'
import { renderHouseholdImage, HOUSEHOLD_DESIGNS, DEFAULT_HOUSEHOLD_DESIGN } from './image.js'
import './style.css'

function Editor({ record, onSelect, design, onDesign }) {
  const [tweet, setTweet] = useState(() => buildHouseholdTweet(record))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [includeUrl, setIncludeUrl] = useState(true)
  const image = useMemo(() => {
    try { return { url: renderHouseholdImage(record, design) } } catch (cause) { return { error: cause.message } }
  }, [record, design])
  const source = HOUSEHOLD_SOURCES[record.source]
  async function copy() {
    try { await navigator.clipboard.writeText(tweet); setMessage('Tweet copié.') }
    catch { setError('La copie automatique est indisponible. Sélectionne le texte du tweet pour le copier.'); return }
    setError('')
  }
  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion: 1, ...record, source: HOUSEHOLD_SOURCES[record.source], tweet }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `france-100-menages-${record.id}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <ToolWorkspace renderImage={() => { if (image.error) throw new Error(image.error); return image.url }} imageAlt={`La France en 100 ménages : ${record.headline}`} actions={<><Button onClick={copy}>Copier le tweet</Button>{image.url && <Button as="a" variant="secondary" href={image.url} download={`france-100-menages-${record.id}-${design}.png`}>Télécharger le PNG</Button>}</>}>
    <div className="hh-controls tool-settings">
      <label>Sujet<select aria-label="Sujet" value={record.id} onChange={(e) => onSelect(e.target.value)}>{HOUSEHOLD_STATISTICS.map((item, i) => <option key={item.id} value={item.id}>{i + 1}. {item.title}</option>)}</select></label>
      <label>Design<select aria-label="Design" value={design} onChange={(e) => onDesign(e.target.value)}>{HOUSEHOLD_DESIGNS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <button onClick={() => { const pool = HOUSEHOLD_STATISTICS.filter((item) => item.id !== record.id); onSelect(pool[Math.floor(Math.random() * pool.length)].id) }}>Autre sujet au hasard</button>
    </div>
    <div className="hh-layout tool-preview">
      <section className="hh-panel" aria-label="Tweet et sources">
        <div className="hh-panel-head"><h2>Tweet</h2><span>{Array.from(tweet).length} caractères</span></div>
        <label className="hh-checkbox"><input type="checkbox" checked={includeUrl} onChange={(e) => { setIncludeUrl(e.target.checked); setTweet(buildHouseholdTweet(record, { includeUrl: e.target.checked })); setMessage('') }} /> Inclure le lien de la source</label>
        <label className="hh-tweet-label">Texte modifiable<textarea value={tweet} onChange={(e) => { setTweet(e.target.value); setMessage('') }} /></label>
        <p className="hh-note">Le compteur indique les caractères du texte. La limite X dépend du compte et du calcul des liens.</p>
        <div className="hh-actions"><button onClick={() => { setTweet(buildHouseholdTweet(record, { includeUrl })); setMessage('Texte réinitialisé.'); setError('') }}>Réinitialiser le texte</button><button onClick={exportJson}>Exporter le JSON</button></div>
        <p className="hh-message" role="status">{message}</p>{error && <p role="alert">{error}</p>}
        <div className="hh-source"><h3>Source officielle</h3><a href={source.url} target="_blank" rel="noreferrer">Insee : {source.title} ↗</a><dl><dt>Données</dt><dd>{record.referencePeriod}{record.provisional ? ' — provisoires' : ''}</dd><dt>Publication</dt><dd>{source.publishedAt}</dd><dt>Consultation</dt><dd>{record.metadata.checkedAt}</dd><dt>Tableau / passage</dt><dd>{record.table}</dd><dt>Population</dt><dd>{record.metadata.scope}</dd></dl><p>{record.note}</p><Link to={`/bibliotheque-donnees?type=household&id=household:${record.id}`}>Voir la fiche dans la bibliothèque de données →</Link></div>
      </section>
    </div>
  </ToolWorkspace>
}
export default function HouseholdApp() {
  const [params, setParams] = useSearchParams()
  const design = HOUSEHOLD_DESIGNS.some(item => item.id === params.get('design')) ? params.get('design') : DEFAULT_HOUSEHOLD_DESIGN
  function selectDesign(id) { const next = new URLSearchParams(params); next.set('design', id); setParams(next) }
  const record = HOUSEHOLD_STATISTICS.find((item) => item.id === params.get('sujet')) ?? HOUSEHOLD_STATISTICS[0]
  function select(id) { const next = new URLSearchParams(params); next.set('sujet', id); setParams(next) }
  return <div className="hh-scope"><PageHeader title="La France en 100 ménages" subtitle={`${HOUSEHOLD_STATISTICS.length} sujets pour voir autrement les finances des Français. Un visuel, un tweet et la source officielle. La population étudiée est précisée pour chaque sujet.`} /><Editor key={record.id} record={record} onSelect={select} design={design} onDesign={selectDesign} /></div>
}
