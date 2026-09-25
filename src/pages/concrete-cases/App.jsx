import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { CASES } from './data.js'
import { buildTweetText } from './lib.js'
import './concrete-cases.css'

export default function ConcreteCases() {
  const [selectedId, setSelectedId] = useState(CASES[0].id)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const manualCopyRef = useRef(null)
  const selected = CASES.find((item) => item.id === selectedId)

  async function copyText() {
    const text = buildTweetText(selected)
    let success = false
    try {
      if (navigator.clipboard?.writeText) {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 800)),
        ])
        success = true
      }
    } catch { /* essai avec la copie classique ci-dessous */ }

    if (!success) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try { success = document.execCommand('copy') } catch { /* sélection manuelle ci-dessous */ }
      textarea.remove()
    }
    setCopied(success)
    setCopyError(!success)
    if (success) setTimeout(() => setCopied(false), 1800)
    else requestAnimationFrame(() => manualCopyRef.current?.select())
  }

  return (
    <div className="cc-scope">
      <PageHeader
        title="Cas concrets"
        subtitle={`${CASES.length} situations d'investissement, chacune avec une question à se poser avant de décider. Textes rédigés, pas générés automatiquement.`}
      />

      <div className="cc-layout">
        <nav className="cc-list" aria-label="Choisir un cas concret">
          {CASES.map((item) => (
            <button
              type="button" key={item.id}
              aria-current={selectedId === item.id ? 'true' : undefined}
              className={`cc-choice ${selectedId === item.id ? 'cc-choice-active' : ''}`}
              onClick={() => { setSelectedId(item.id); setCopied(false); setCopyError(false) }}
            >
              <span className="cc-category">{item.category}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </nav>

        <article className="cc-preview">
          <div className="cc-preview-head">
            <span>Post prêt à relire · {selected.title}</span>
            <Button type="button" onClick={copyText}>{copied ? '✅ Copié !' : copyError ? '⚠️ Sélectionner le texte' : '📋 Copier le texte'}</Button>
          </div>
          <p className="cc-text">{buildTweetText(selected)}</p>
          {copyError && (
            <div className="cc-copy-manual" role="status">
              Copie automatique indisponible. Le texte est sélectionné : copie-le avec le menu de ton appareil.
              <textarea ref={manualCopyRef} readOnly value={buildTweetText(selected)} aria-label="Texte du cas concret à copier manuellement" onClick={(event) => event.currentTarget.select()} />
            </div>
          )}
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
