import { copyPublicationText } from '../../design-system/publicationActions.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useMemo, useRef, useState } from 'react'
import { FAMILIES, FACTS } from './data'
import { buildTweetText } from './lib'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './market-facts.css'

const byId = Object.fromEntries(FACTS.map((f) => [f.id, f]))
const narratives = FACTS.filter(fact => fact.kind !== 'measured-reference')



function FactCard({ fact, text }) {
  const family = FAMILIES.find((f) => f.id === fact.family)
  return (
    <article className="mf-card" data-story-id={fact.id}>
      <p className="mf-card-kicker">
        {family?.emoji} {fact.category}
      </p>
      <p className="mf-fact-text">{text}</p>
      <details className="mf-details">
        <summary>{fact.kind === 'measured-reference' ? 'Sources et conventions du repère' : 'Sources et réserves du récit'}</summary>
        {fact.sources ? <>
          <p>{fact.indices.join(' · ')} · {fact.period} · Relu le {fact.reviewedAt}</p>
          {fact.note && <p>{fact.note}</p>}
          <ol className="mf-sources">
            {fact.sources.map(source => <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
              <p>{source.organization} · {source.publishedAt || 'Date de publication non précisée'} · {fact.id.startsWith('monthly-') ? 'Contrôle de la série' : 'Consulté le'} {source.checkedAt || 'non daté dans le registre'}</p>
              <ul>{source.facts.map(proof => <li key={proof}>{proof}</li>)}</ul>
            </li>)}
          </ol>
          <p><strong>Conventions et réserves</strong></p>
          <ul>{fact.reserves.map(reserve => <li key={reserve}>{reserve}</li>)}</ul>
        </> : <>
        <p>{fact.fact}</p>
        {fact.note && <p>{fact.note}</p>}
        <p>Indices : {fact.indices.join(' · ')} · Source : {fact.source}</p>
        </>}
      </details>
    </article>
  )
}

export default function App() {
  const [currentId, setCurrentId] = useState(narratives[0].id)
  const [copied, setCopied] = useState(false)
  // Un brouillon par identifiant, conservé lors des changements de sélection.
  const [drafts, setDrafts] = useState({})
  const seenThisSession = useRef([currentId])

  const currentFact = byId[currentId]
  const originalText = buildTweetText(currentFact)
  const currentText = drafts[currentId] ?? originalText

  const optgroups = useMemo(
    () => FAMILIES.map((fam) => ({ fam, facts: FACTS.filter((f) => f.family === fam.id) })),
    [],
  )

  function selectFact(id) {
    setCurrentId(id)
    setCopied(false)
    if (!seenThisSession.current.includes(id)) seenThisSession.current.push(id)
  }

  function pickRandom() {
    let pool = narratives.filter((f) => !seenThisSession.current.includes(f.id))
    if (pool.length === 0) {
      seenThisSession.current = currentId ? [currentId] : []
      pool = narratives.filter((f) => f.id !== currentId)
    }
    const candidates = pool.filter((f) => f.id !== currentId)
    const finalPool = candidates.length ? candidates : pool
    const choice = finalPool[Math.floor(Math.random() * finalPool.length)]
    selectFact(choice.id)
  }

  async function copyCurrent() {
    try {
      await copyPublicationText(currentText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { setCopied(false) }
  }

  return (
    <div className="mf-scope">
      <PageHeader
        title="Histoires de marchés"
        subtitle={`${narratives.length} histoires documentées, prêtes à relire et à copier. ${FACTS.length - narratives.length} repères historiques et mensuels restent accessibles dans la sélection.`}
      />

      <ToolWorkspace actions={<>
        <Button type="button" onClick={copyCurrent}>
          {copied ? '✅ Copié !' : '📋 Copier le texte'}
        </Button>
      </>}>
      <section className="tool-settings">
      <div className="mf-controls">
        <div className="mf-select-shell">
          <ChoicePicker className="mf-select" aria-label="Choisir un fait" value={currentId} onChange={(e) => selectFact(e.target.value)}>
            {optgroups.map(({ fam, facts }) => (
              <optgroup key={fam.id} label={fam.label}>
                {facts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.category} — {f.indices.join(' · ')}
                  </option>
                ))}
              </optgroup>
            ))}
          </ChoicePicker>
        </div>
        <Button type="button" variant="secondary" onClick={pickRandom}>
          🔄 Histoire aléatoire
        </Button>

      </div>

      <details className="mf-editor">
        <summary>Modifier le texte</summary>
        <p id="mf-draft-help">Les modifications restent disponibles pendant cette session de l’outil. Les sources décrivent le récit d’origine.</p>
        <label htmlFor="mf-draft">Texte de la publication</label>
        <textarea id="mf-draft" aria-describedby="mf-draft-help" rows={16} value={currentText}
          onChange={event => {
            setDrafts(previous => ({ ...previous, [currentId]: event.target.value }))
            setCopied(false)
          }} />
        <Button type="button" variant="secondary" disabled={currentText === originalText} onClick={() => {
          setDrafts(previous => { const next = { ...previous }; delete next[currentId]; return next })
          setCopied(false)
        }}>Rétablir le texte d’origine</Button>
      </details>
      </section>
      <section className="tool-preview">
      <FactCard fact={currentFact} text={currentText} />

      <p className="mf-disclaimer" style={{ marginTop: 22 }}>
        Les faits publiés sont distingués des calculs sur historiques mensuels : leur méthode figure dans les précisions. Les baisses calculées entre clôtures mensuelles peuvent sous-estimer les baisses au cours du mois.
      </p>
      </section>
      </ToolWorkspace>
    </div>
  )
}
