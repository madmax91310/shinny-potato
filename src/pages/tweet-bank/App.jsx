import { contentValidity, renderBankCopy, bankToday, reviewPolicy } from './validity.js'
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TWEETS, MONTHS, CATEGORIES, FORMATS, GOLD_CATEGORIES, COOLDOWN_DAYS } from './data'
import { filterAndSortTweets, countAvailable, publicationBadge, todayStr } from './lib'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './tweet-bank.css'

// Pas de backend dans ce repo (SPA statique déployée sur GitHub Pages, cf. deploy-pages.yml) : la
// date de dernière publication de chaque tweet est donc persistée en localStorage, seul mécanisme
// disponible côté client pur — même logique que la génération vidéo du Calculateur ("100% côté
// client, aucun service tiers"). Limite connue et acceptée : ces dates ne se synchronisent pas
// entre appareils/navigateurs.
const STORAGE_KEY = 'pc-tweet-bank-last-pub'
const DRAFT_KEY = 'pc-tweet-bank-drafts-v1'
function loadDrafts() {
  try { const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
}

function loadLastPub() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveLastPub(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage indisponible (navigation privée stricte, quota...) : on continue sans persister,
    // jamais une erreur bloquante pour un simple confort de suivi.
  }
}

// Repli en cascade Clipboard API → execCommand → sélection manuelle — même pattern que les autres
// outils de l'app (cf. etf-sheets/App.jsx, investment-calculator/App.jsx), jamais partagé entre
// dossiers d'outils dans ce repo (petite fonction dupliquée par design, pas une donnée).
function fallbackCopy(text, textareaEl) {
  if (textareaEl) {
    textareaEl.select()
    textareaEl.setSelectionRange(0, text.length)
    try {
      return document.execCommand('copy')
    } catch {
      return false
    }
  }
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

function ChipRow({ options, allLabel, value, onChange, gold }) {
  return (
    <div className="tb-chiprow" role="group">
      <button type="button" className={`tb-chip${gold ? ' gold' : ''}${value === null ? ' active' : ''}`} onClick={() => onChange(null)}>
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`tb-chip${gold ? ' gold' : ''}${value === o ? ' active' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// forwardRef : le <textarea> lui-même doit être accessible au parent (TweetCard), qui s'en sert
// comme dernier repli de copie (sélection manuelle du texte) si Clipboard API ET execCommand
// échouent tous les deux — jamais un <div> englobant, sur lequel .select()/.setSelectionRange
// n'existent pas.
const TweetText = forwardRef(function TweetText({ text, onChange }, ref) {
  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [text, ref])
  return <textarea ref={ref} className="tb-tweet-text" value={text} onChange={(e) => onChange(e.target.value)} spellCheck={false} rows={2} />
})

function TweetCard({ tweet, draft, onDraftChange, lastPublished, onMarkToday, onSetDate, onClearDate, today }) {
  const textareaRef = useRef(null)
  const [manualCopy, setManualCopy] = useState('')
  const [copyLabel, setCopyLabel] = useState('📋 Copier')
  const badge = publicationBadge(lastPublished)
  const validity = contentValidity(tweet, draft, today)
  const text = draft?.text ?? tweet.text
  const updateDraft = patch => onDraftChange(tweet.id, { ...draft, text, ...patch, checkedAt: null, verifiedText: null, verifiedAsOf: null })

  async function handleCopy() {
    if (!contentValidity(tweet, draft).ready) return
    const copyText = renderBankCopy(tweet, draft)
    let copied = false
    if (navigator.clipboard?.writeText) {
      try {
        // Timeout de sécurité : dans certains contextes restreints (webview, onglet sans focus —
        // reproduit en Chromium headless lors des tests), la Clipboard API ne rejette jamais et ne
        // résout jamais non plus, ce qui bloquerait indéfiniment le repli execCommand ci-dessous
        // sans lui — cf. "repli en cascade" demandé, précisément pour ce genre de cas.
        await Promise.race([
          navigator.clipboard.writeText(copyText),
          new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timeout")), 800)),
        ])
        copied = true
      } catch {
        copied = false
      }
    }
    if (!copied) copied = fallbackCopy(copyText)
    if (copied) {
      setCopyLabel('✅ Copié')
      setTimeout(() => setCopyLabel('📋 Copier'), 1500)
    } else {
      setManualCopy(copyText)
      setCopyLabel('Copie manuelle disponible')
      setTimeout(() => setCopyLabel('📋 Copier'), 2200)
    }
  }

  return (
    <article data-tweet-id={tweet.id} className={`tb-tweet${badge?.status === 'cooldown' ? ' cooldown' : ''}`}>
      <div className="tb-tweet-meta">
        <span className="tb-tag-month">{tweet.month}{tweet.month === 'Intemporel' ? '' : ' 2026'}</span>
        <span className={`tb-tag-cat${GOLD_CATEGORIES.includes(tweet.category) ? ' gold' : ''}`}>{tweet.category}</span>
        {(tweet.formats || []).map((f) => (
          <span key={f} className="tb-tag-format">
            {f}
          </span>
        ))}
        {badge && <span className={`tb-pub-badge ${badge.status}`}>{badge.label}</span>}
      </div>

      <p className={`tb-validity${validity.ready ? ' ready' : ''}`} role="status">{validity.ready ? '✅' : '🕒'} {validity.label}</p>
      <TweetText ref={textareaRef} text={text} onChange={value => updateDraft({ text: value })} />
      {(!validity.ready || draft) && <div className="tb-review">
        <p>{reviewPolicy(tweet).kind === 'personal' ? 'Actualise ton bilan ou replace-le explicitement dans sa période d’origine.' : 'Vérifie les chiffres, la période, les hypothèses et les sources avant de réutiliser ce texte.'}</p>
        <label>Date de référence <input type="date" value={draft?.asOf ?? ''} max={bankToday()} onChange={event => updateDraft({ asOf: event.target.value })} /></label>
        <label><input type="checkbox" checked={validity.ready && Boolean(draft?.checkedAt)} disabled={!draft?.asOf || !text.trim() || draft.asOf > bankToday()} onChange={event => onDraftChange(tweet.id, { ...draft, text, checkedAt: event.target.checked ? bankToday() : null, verifiedText: event.target.checked ? text : null, verifiedAsOf: event.target.checked ? draft.asOf : null })} /> J’ai vérifié ce texte et sa date de référence.</label>
        <small>La date de référence sera ajoutée au texte copié. Les bilans et chiffres de marché sont à revérifier le jour de leur réutilisation.</small>
        {draft && <Button type="button" variant="ghost" onClick={() => onDraftChange(tweet.id, null)}>Revenir au texte archivé</Button>}
      </div>}
      {tweet.sources?.length > 0 && <details className="tb-sources">
        <summary>Sources de ce texte</summary>
        <ul>{tweet.sources.map(source => <li key={source.url}>
          <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
        </li>)}</ul>
      </details>}

      {manualCopy && <label>Texte complet à copier <textarea aria-label="Copie manuelle avec date de référence" value={manualCopy} readOnly rows={6} onFocus={event => event.target.select()} /></label>}
      <div className="tb-tweet-actions">
        <Button type="button" onClick={handleCopy} disabled={!validity.ready}>
          {copyLabel}
        </Button>
        <Button type="button" variant="secondary" disabled={!validity.ready} onClick={() => onMarkToday(tweet.id)}>
          Marquer publié aujourd'hui
        </Button>
        <input
          type="date"
          className="tb-date-input"
          value={lastPublished || ''}
          max={todayStr()}
          title="Corriger ou saisir la date de dernière publication"
          onChange={(e) => onSetDate(tweet.id, e.target.value)}
        />
        {lastPublished && (
          <Button type="button" variant="ghost" onClick={() => onClearDate(tweet.id)}>
            Effacer la date
          </Button>
        )}
      </div>
    </article>
  )
}

export default function App() {
  const [today, setToday] = useState(bankToday)
  useEffect(() => { const timer = setInterval(() => setToday(bankToday()), 60_000); return () => clearInterval(timer) }, [])
  const [lastPub, setLastPub] = useState(loadLastPub)
  const [drafts, setDrafts] = useState(loadDrafts)
  const [saveError, setSaveError] = useState(false)
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); setSaveError(false) } catch { setSaveError(true) } }, [drafts])
  function changeDraft(id, value) { setDrafts(previous => { const next = { ...previous }; if (value) next[id] = value; else delete next[id]; return next }) }
  const [filters, setFilters] = useState({
    month: null,
    category: null,
    format: null,
    search: '',
    hideCooldown: false,
    sortByAge: true,
  })

  useEffect(() => saveLastPub(lastPub), [lastPub])

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))

  const list = useMemo(
    () =>
      filterAndSortTweets(TWEETS.map(tweet => ({ ...tweet, text: drafts[tweet.id]?.text ?? tweet.text })), lastPub, {
        month: filters.month ?? 'Tous',
        category: filters.category ?? 'Toutes',
        format: filters.format ?? 'Tous',
        search: filters.search,
        hideCooldown: filters.hideCooldown,
        sortByAge: filters.sortByAge,
      }),
    [lastPub, filters, drafts]
  )

  const available = countAvailable(TWEETS, lastPub, drafts)

  function markToday(id) {
    setLastPub((m) => ({ ...m, [id]: todayStr() }))
  }
  function setDate(id, value) {
    setLastPub((m) => {
      if (!value) {
        const next = { ...m }
        delete next[id]
        return next
      }
      return { ...m, [id]: value }
    })
  }
  function clearDate(id) {
    setLastPub((m) => {
      const next = { ...m }
      delete next[id]
      return next
    })
  }

  return (
    <div className="tb-scope">
      <PageHeader
        title="Banque de tweets à recycler"
        subtitle={`${TWEETS.length} textes archivés — la fraîcheur du contenu et le repos de ${COOLDOWN_DAYS} jours sont contrôlés séparément.`}
      />

      <div className="tb-summary">
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{TWEETS.length}</div>
          <div className="tb-summary-lbl">tweets au total</div>
        </div>
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{TWEETS.filter(tweet => publicationBadge(lastPub[tweet.id])?.status === 'cooldown').length}</div>
          <div className="tb-summary-lbl">en repos (&lt; {COOLDOWN_DAYS}j)</div>
        </div>
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{available}</div>
          <div className="tb-summary-lbl">prêts à réutiliser</div>
        </div>
      </div>

      <p>{TWEETS.filter(tweet => !contentValidity(tweet, drafts[tweet.id], today).ready).length} textes à vérifier ou actualiser. Le mois d’archive n’est pas une date de vérification des chiffres.</p>
      {saveError && <p role="alert">La sauvegarde des brouillons est indisponible sur ce navigateur. Conserve tes modifications avant de quitter la page.</p>}
      <div className="tb-controls">
        <input
          className="tb-search"
          type="text"
          placeholder="Rechercher un mot, un chiffre, un thème…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
        />
        <ChipRow options={MONTHS} allLabel="Tous les mois" value={filters.month} onChange={(v) => set({ month: v })} />
        <ChipRow options={CATEGORIES} allLabel="Toutes catégories" value={filters.category} onChange={(v) => set({ category: v })} gold />
        <ChipRow options={FORMATS} allLabel="Tous les formats" value={filters.format} onChange={(v) => set({ format: v })} />
        <label className="tb-toggle">
          <input type="checkbox" checked={filters.hideCooldown} onChange={(e) => set({ hideCooldown: e.target.checked })} />
          Masquer les tweets encore en repos (moins de {COOLDOWN_DAYS} jours)
        </label>
        <label className="tb-toggle">
          <input type="checkbox" checked={filters.sortByAge} onChange={(e) => set({ sortByAge: e.target.checked })} />
          Trier par ancienneté (jamais publiés puis les plus anciens d'abord)
        </label>
      </div>

      <p className="tb-count-line">
        {list.length} tweet{list.length > 1 ? 's' : ''} trouvé{list.length > 1 ? 's' : ''}
      </p>

      {list.length === 0 ? (
        <div className="tb-empty">Aucun tweet ne correspond à ces filtres.</div>
      ) : (
        <div className="tb-list">
          {list.map((t) => (
            <TweetCard key={t.id} tweet={TWEETS.find(tweet => tweet.id === t.id)} draft={drafts[t.id]} onDraftChange={changeDraft} today={today} lastPublished={lastPub[t.id]} onMarkToday={markToday} onSetDate={setDate} onClearDate={clearDate} />
          ))}
        </div>
      )}
    </div>
  )
}
