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



function FactCard({ fact }) {
  const family = FAMILIES.find((f) => f.id === fact.family)
  return (
    <article className="mf-card" data-story-id={fact.id}>
      <p className="mf-card-kicker">
        {family?.emoji} {fact.category}
      </p>
      <p className="mf-fact-text">{buildTweetText(fact)}</p>
      <details className="mf-details">
        <summary>{fact.sources ? 'Sources et réserves du récit' : 'Voir le fait complet et ses précisions'}</summary>
        {fact.sources ? <>
          <p>{fact.indices.join(' · ')} · {fact.period} · Relu le {fact.reviewedAt}</p>
          <ol className="mf-sources">
            {fact.sources.map(source => <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
              <p>{source.organization} · {source.publishedAt || 'Date de publication non précisée'} · Consulté le {source.checkedAt}</p>
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
  const [currentId, setCurrentId] = useState(FACTS.find(fact => fact.text)?.id ?? FACTS[0].id)
  const [copied, setCopied] = useState(false)
  const seenThisSession = useRef([currentId])

  const currentFact = byId[currentId]

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
    let pool = FACTS.filter((f) => !seenThisSession.current.includes(f.id))
    if (pool.length === 0) {
      seenThisSession.current = currentId ? [currentId] : []
      pool = FACTS.filter((f) => f.id !== currentId)
    }
    const candidates = pool.filter((f) => f.id !== currentId)
    const finalPool = candidates.length ? candidates : pool
    const choice = finalPool[Math.floor(Math.random() * finalPool.length)]
    selectFact(choice.id)
  }

  async function copyCurrent() {
    try {
      await copyPublicationText(buildTweetText(currentFact))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { setCopied(false) }
  }

  return (
    <div className="mf-scope">
      <PageHeader
        title="Histoires de marchés"
        subtitle={`${FACTS.filter(fact => fact.text).length} nouveaux récits documentés, prêts à copier. Les contenus historiques restent disponibles.`}
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

      </section>
      <section className="tool-preview">
      <FactCard fact={currentFact} />

      <p className="mf-disclaimer" style={{ marginTop: 22 }}>
        Les faits publiés sont distingués des calculs sur historiques mensuels : leur méthode figure dans les précisions. Les baisses calculées entre clôtures mensuelles peuvent sous-estimer les baisses au cours du mois.
      </p>
      </section>
      </ToolWorkspace>
    </div>
  )
}
