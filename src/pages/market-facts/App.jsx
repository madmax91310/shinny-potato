import { useMemo, useRef, useState } from 'react'
import { FAMILIES, FACTS } from './data'
import { buildTweetText } from './lib'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './market-facts.css'

const byId = Object.fromEntries(FACTS.map((f) => [f.id, f]))

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(ta)
  return ok
}

function FactCard({ fact }) {
  const family = FAMILIES.find((f) => f.id === fact.family)
  return (
    <article className="mf-card">
      <p className="mf-card-kicker">
        {family?.emoji} {fact.category}
      </p>
      <p className="mf-fact-text">{buildTweetText(fact)}</p>
      <details className="mf-details">
        <summary>Voir le fait complet et ses précisions</summary>
        <p>{fact.fact}</p>
        {fact.note && <p>{fact.note}</p>}
        <p>Indices : {fact.indices.join(' · ')} · Source : {fact.source}</p>
      </details>
    </article>
  )
}

export default function App() {
  const [currentId, setCurrentId] = useState(FACTS[0].id)
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
    const text = buildTweetText(currentFact)
    let ok = true
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        ok = fallbackCopy(text)
      }
    } else {
      ok = fallbackCopy(text)
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="mf-scope">
      <PageHeader
        title="Faits marquants des marchés"
        subtitle={`Bibliothèque de ${FACTS.length} statistiques historiques sourcées — vérifie la source avant publication.`}
      />

      <div className="mf-controls">
        <div className="mf-select-shell">
          <select className="mf-select" aria-label="Choisir un fait" value={currentId} onChange={(e) => selectFact(e.target.value)}>
            {optgroups.map(({ fam, facts }) => (
              <optgroup key={fam.id} label={fam.label}>
                {facts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.category} — {f.indices.join(' · ')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={pickRandom}>
          🔄 Fait aléatoire
        </Button>
        <Button type="button" onClick={copyCurrent}>
          {copied ? '✅ Copié !' : '📋 Copier le texte'}
        </Button>
      </div>

      <FactCard fact={currentFact} />

      <p className="mf-disclaimer" style={{ marginTop: 22 }}>
        Chaque statistique est reprise telle que publiée par la source citée, jamais recalculée depuis des
        données brutes. Le CAC 40 a un scope volontairement restreint faute de sources publiées équivalentes.
      </p>
    </div>
  )
}
