import { useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { CASES } from './data.js'
import { buildTweetText } from './lib.js'
import './concrete-cases.css'

export default function ConcreteCases() {
  const [selectedId, setSelectedId] = useState(CASES[0].id)
  const [copied, setCopied] = useState(false)
  const selected = CASES.find((item) => item.id === selectedId)

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildTweetText(selected))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="cc-scope">
      <PageHeader
        title="Cas concrets"
        subtitle="Trois situations d'investissement, chacune avec une question à se poser avant de décider. Textes rédigés, pas générés automatiquement."
      />

      <div className="cc-layout">
        <nav className="cc-list" aria-label="Choisir un cas concret">
          {CASES.map((item) => (
            <button
              type="button" key={item.id}
              aria-current={selectedId === item.id ? 'true' : undefined}
              className={`cc-choice ${selectedId === item.id ? 'cc-choice-active' : ''}`}
              onClick={() => { setSelectedId(item.id); setCopied(false) }}
            >
              <span className="cc-category">{item.category}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </nav>

        <article className="cc-preview">
          <div className="cc-preview-head">
            <span>Post prêt à relire · {selected.title}</span>
            <Button type="button" onClick={copyText}>{copied ? '✅ Copié !' : '📋 Copier le texte'}</Button>
          </div>
          <p className="cc-text">{buildTweetText(selected)}</p>
          <div className="cc-sources">
            <strong>Sources à vérifier avant publication</strong>
            <ul>
              {selected.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  )
}
