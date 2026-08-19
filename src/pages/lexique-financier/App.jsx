import { useMemo, useRef, useState } from 'react'
import { CATEGORY_ORDER, TERMES } from './data'
import { generateCopyText } from './lib'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './lexique-financier.css'

const byId = Object.fromEntries(TERMES.map((t) => [t.id, t]))

// Découpe un bloc de texte comme l'original : "\n\n" sépare les paragraphes,
// et un paragraphe multi-lignes (\n) devient une liste de lignes serrées.
function ParagraphBlock({ text }) {
  return (
    <div className="lf-card-body">
      {text.split('\n\n').map((para, i) => {
        const lines = para.split('\n')
        if (lines.length > 1) {
          return (
            <div className="lines" key={i}>
              {lines.map((l, j) => (
                <p className="line" key={j}>
                  {l}
                </p>
              ))}
            </div>
          )
        }
        return <p key={i}>{para}</p>
      })}
    </div>
  )
}

function Section({ title, text }) {
  return (
    <div className="lf-section">
      <p className="lf-section-head">{title}</p>
      <ParagraphBlock text={text} />
    </div>
  )
}

function TermCard({ t }) {
  return (
    <article className="lf-card">
      <div className="lf-card-header">
        <div className="lf-avatar">📊</div>
        <div className="lf-who">
          <div className="lf-name-row">
            <span className="lf-name">Lexique Financier</span>
            <span className="lf-check">✔</span>
          </div>
          <span className="lf-handle">@tacompte · À l'instant</span>
        </div>
        <div className={`lf-debug-badge${t.variante === 'B' ? ' variant-b' : ''}`}>
          Variante {t.variante}
          {t.sousVariante ? ` · ${t.sousVariante}` : ''}
        </div>
      </div>

      <div className="lf-card-body">
        <p className="lf-post-title">📌 Tout savoir sur {t.titre}</p>
      </div>
      <ParagraphBlock text={t.intro} />

      {t.variante === 'A' ? (
        <>
          <Section title="🎯 Objectif" text={t.objectif} />
          <Section title="👤 Pour qui ?" text={t.pourQui} />
          <Section title={t.mecanismeTitre} text={t.mecanismeContenu} />
          {(t.sectionsOptionnelles || []).map((s, i) => (
            <Section key={i} title={s.titre} text={s.contenu} />
          ))}
          {t.attention && <div className="lf-attention">⚠️ {t.attention}</div>}
          <Section title={t.fraisTitre} text={t.fraisContenu} />
          <Section title="⭐ Avantage" text={t.avantage} />
        </>
      ) : (
        <>
          <Section title="📖 Définition" text={t.definitionContenu} />
          <Section title={t.calculTitre} text={t.calculContenu} />
          {t.nuance && <Section title={t.nuance.titre} text={t.nuance.contenu} />}
          <Section title="💡 Pourquoi c'est important ?" text={t.pourquoiImportant} />
          {t.erreurFrequente && <div className="lf-attention">⚠️ {t.erreurFrequente}</div>}
          <Section title="⭐ À retenir" text={t.aRetenir} />
        </>
      )}

      <div className="lf-card-footer">
        <span title="Répondre">💬</span>
        <span title="Repartager">🔁</span>
        <span title="Aimer">🤍</span>
        <span title="Partager">📤</span>
      </div>
    </article>
  )
}

export default function App() {
  const [currentId, setCurrentId] = useState(TERMES[0].id)
  const [debug, setDebug] = useState(false)
  const [toast, setToast] = useState(null)
  const lastRandomId = useRef(null)
  const toastTimer = useRef(null)

  const currentTerm = byId[currentId]

  const optgroups = useMemo(
    () => CATEGORY_ORDER.map((cat) => ({ cat, termes: TERMES.filter((t) => t.categorie === cat) })).filter((g) => g.termes.length),
    [],
  )

  function selectTerm(id, { random = false } = {}) {
    setCurrentId(id)
    if (random) lastRandomId.current = id
  }

  function pickRandom() {
    let pool = TERMES
    if (TERMES.length > 1) pool = TERMES.filter((t) => t.id !== lastRandomId.current)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    selectTerm(pick.id, { random: true })
  }

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }

  async function copyCurrent() {
    const text = generateCopyText(currentTerm)
    try {
      await navigator.clipboard.writeText(text)
      showToast('✅ Fiche copiée dans le presse-papier')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        showToast('✅ Fiche copiée dans le presse-papier')
      } catch {
        showToast('❌ Impossible de copier automatiquement')
      }
      document.body.removeChild(ta)
    }
  }

  return (
    <div className={`lf-scope${debug ? ' debug' : ''}`}>
      <PageHeader title="Lexique Financier" subtitle="Générateur de fiches pédagogiques prêtes à publier." />

      <div className="lf-panel">
        <div>
          <label className="lf-field-label" htmlFor="term-select">
            Choisir un terme
          </label>
          <div className="lf-select-wrap">
            <select id="term-select" className="lf-select" value={currentId} onChange={(e) => selectTerm(e.target.value)}>
              {optgroups.map(({ cat, termes }) => (
                <optgroup key={cat} label={cat}>
                  {termes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="lf-controls-row">
          <Button variant="primary" onClick={pickRandom}>
            🔄 Terme aléatoire
          </Button>
          <Button variant="secondary" onClick={copyCurrent}>
            📋 Copier le texte
          </Button>
          <div className="lf-spacer" />
          <label className="lf-switch-label">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            <span className="lf-switch" />
            Mode debug
          </label>
        </div>
        <div className="lf-term-count">{TERMES.length} termes dans la bibliothèque</div>
      </div>

      <TermCard t={currentTerm} />

      <div className={`lf-toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
