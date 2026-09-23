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
const TweetText = forwardRef(function TweetText({ text }, ref) {
  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [text, ref])
  return <textarea ref={ref} className="tb-tweet-text" value={text} readOnly spellCheck={false} rows={2} onFocus={(e) => e.target.select()} />
})

function TweetCard({ tweet, lastPublished, onMarkToday, onSetDate, onClearDate }) {
  const textareaRef = useRef(null)
  const [copyLabel, setCopyLabel] = useState('📋 Copier')
  const badge = publicationBadge(lastPublished)

  async function handleCopy() {
    let copied = false
    if (navigator.clipboard?.writeText) {
      try {
        // Timeout de sécurité : dans certains contextes restreints (webview, onglet sans focus —
        // reproduit en Chromium headless lors des tests), la Clipboard API ne rejette jamais et ne
        // résout jamais non plus, ce qui bloquerait indéfiniment le repli execCommand ci-dessous
        // sans lui — cf. "repli en cascade" demandé, précisément pour ce genre de cas.
        await Promise.race([
          navigator.clipboard.writeText(tweet.text),
          new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timeout")), 800)),
        ])
        copied = true
      } catch {
        copied = false
      }
    }
    if (!copied) copied = fallbackCopy(tweet.text, textareaRef.current)
    if (copied) {
      setCopyLabel('✅ Copié')
      setTimeout(() => setCopyLabel('📋 Copier'), 1500)
    } else {
      setCopyLabel('Sélectionné, copie à la main')
      setTimeout(() => setCopyLabel('📋 Copier'), 2200)
    }
  }

  return (
    <article className={`tb-tweet${badge?.status === 'cooldown' ? ' cooldown' : ''}`}>
      <div className="tb-tweet-meta">
        <span className="tb-tag-month">{tweet.month} 2026</span>
        <span className={`tb-tag-cat${GOLD_CATEGORIES.includes(tweet.category) ? ' gold' : ''}`}>{tweet.category}</span>
        {(tweet.formats || []).map((f) => (
          <span key={f} className="tb-tag-format">
            {f}
          </span>
        ))}
        {badge && <span className={`tb-pub-badge ${badge.status}`}>{badge.label}</span>}
      </div>

      <TweetText ref={textareaRef} text={tweet.text} />

      <div className="tb-tweet-actions">
        <Button type="button" onClick={handleCopy}>
          {copyLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => onMarkToday(tweet.id)}>
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
  const [lastPub, setLastPub] = useState(loadLastPub)
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
      filterAndSortTweets(TWEETS, lastPub, {
        month: filters.month ?? 'Tous',
        category: filters.category ?? 'Toutes',
        format: filters.format ?? 'Tous',
        search: filters.search,
        hideCooldown: filters.hideCooldown,
        sortByAge: filters.sortByAge,
      }),
    [lastPub, filters]
  )

  const available = countAvailable(TWEETS, lastPub)

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
        subtitle={`${TWEETS.length} tweets déjà écrits — recycle-les avec un repos de ${COOLDOWN_DAYS} jours entre deux publications.`}
      />

      <div className="tb-summary">
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{TWEETS.length}</div>
          <div className="tb-summary-lbl">tweets au total</div>
        </div>
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{TWEETS.length - available}</div>
          <div className="tb-summary-lbl">en repos (&lt; {COOLDOWN_DAYS}j)</div>
        </div>
        <div className="tb-summary-cell">
          <div className="tb-summary-num">{available}</div>
          <div className="tb-summary-lbl">disponibles</div>
        </div>
      </div>

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
            <TweetCard key={t.id} tweet={t} lastPublished={lastPub[t.id]} onMarkToday={markToday} onSetDate={setDate} onClearDate={clearDate} />
          ))}
        </div>
      )}
    </div>
  )
}
