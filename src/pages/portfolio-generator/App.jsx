import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { dataLabels } from './compact.js'
import { instrumentOption, normalizeSearch } from '../../data/asset-selection.js'
import ReplacementPanel from './ReplacementPanel'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useMemo, useState, useRef, useCallback } from 'react'
import {
  generatePortfolio,
  replacePortfolioAsset,
  buildManualPortfolio,
  renderTweetText,
  fmtPct,
  RISK_ORDER,
  RISK_LABELS,
  PROFILES,
  isCompatible,
} from './engine.js'
import { CATEGORIES, YEARS, ASSETS, getAsset } from '../../data/portfolio-assets.js'
import { renderPortfolioImage } from './canvasImage.js'
import { getLengthStatus } from '../etf-tweets/lib/tweetFormat.js'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './portfolio-generator.css'

// Mode Composition manuelle (demande utilisateur du 22/09/2026) : seuils des garde-fous non
// bloquants, cf. ManualComposer plus bas.
const MANUAL_CONCENTRATION_WARN = 50
const MANUAL_LINE_COUNT_WARN = 8

const RISK_CHIPS = [
  { key: 'auto', label: '🎲 Auto' },
  ...RISK_ORDER.map((key) => ({ key, label: RISK_LABELS[key] })),
]
const PROFILE_CHIPS = [
  { key: 'auto', label: '🎲 Auto' },
  ...PROFILES.map((p) => ({ key: p.id, label: p.label })),
]

// Deux rangées indépendantes : choisir un niveau de risque grise les profils incompatibles
// (et inversement), via isCompatible — jamais de paire invalide accessible depuis l'UI, donc pas
// besoin de logique de "rattrapage" côté génération.
function RiskSelector({ selectedRisk, selectedProfile, onSelect }) {
  return (
    <div className="pg-panel">
      <div className="pg-panel-title">1. Niveau de risque</div>
      <div className="pg-tier-chips" role="group" aria-label="Choisir un niveau de risque cible">
        {RISK_CHIPS.map((r) => {
          const disabled =
            r.key !== 'auto' && selectedProfile !== 'auto' && !isCompatible(selectedProfile, r.key)
          return (
            <button
              key={r.key}
              type="button"
              className={`pg-tier-chip${selectedRisk === r.key ? ' active' : ''}`}
              aria-pressed={selectedRisk === r.key}
              disabled={disabled}
              onClick={() => onSelect(r.key)}
            >
              {r.label}
            </button>
          )
        })}
      </div>
      <p className="pg-tier-hint">
        {selectedRisk === 'auto'
          ? 'Le risque est déterminé par le tirage aléatoire du profil et du combo.'
          : 'Chaque génération est recalculée pour rester dans ce niveau de risque.'}
      </p>
    </div>
  )
}

function ProfileSelector({ selectedRisk, selectedProfile, onSelect }) {
  return (
    <div className="pg-panel">
      <div className="pg-panel-title">2. Profil d'investisseur</div>
      <div className="pg-tier-chips" role="group" aria-label="Choisir un profil d'investisseur">
        {PROFILE_CHIPS.map((p) => {
          const disabled = p.key !== 'auto' && selectedRisk !== 'auto' && !isCompatible(p.key, selectedRisk)
          return (
            <button
              key={p.key}
              type="button"
              className={`pg-tier-chip${selectedProfile === p.key ? ' active' : ''}`}
              aria-pressed={selectedProfile === p.key}
              disabled={disabled}
              onClick={() => onSelect(p.key)}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      <p className="pg-tier-hint">
        {selectedProfile === 'auto'
          ? 'La thèse (accroche, actifs, avertissement) est tirée parmi tous les profils compatibles.'
          : 'Chaque génération suit la thèse narrative de ce profil, quel que soit le palier de risque choisi.'}
      </p>
    </div>
  )
}

function RiskGauge({ riskId, riskLabel, profileName, worst, bound }) {
  const idx = RISK_ORDER.indexOf(riskId)
  const pct = (idx / (RISK_ORDER.length - 1)) * 100
  return (
    <div className="pg-riskgauge">
      <div className="pg-riskgauge-row">
        <span className="pg-riskgauge-label">Palier de risque</span>
        <span className="pg-riskgauge-value">{riskLabel}</span>
      </div>
      <div className="pg-riskgauge-track">
        <div className="pg-riskgauge-marker" style={{ left: `${pct}%` }} />
      </div>
      <p className="pg-riskgauge-detail">
        Pire année simulée : <b className={worst.value >= 0 ? 'pos' : 'neg'}>{fmtPct(worst.value)}</b> en {worst.year}
        <span className="pg-riskgauge-bound"> · objectif {bound.text}</span>
      </p>
      <p className="pg-riskgauge-profile">
        Profil : <b>{profileName}</b>
      </p>
    </div>
  )
}

// Pas de gabarit RISK_ORDER pour une composition manuelle (aucun palier imposé) : affiche la pire
// année réellement calculée, plus le palier le plus proche pour comparaison informative uniquement
// (cf. closestRiskId/closestBound sur le portefeuille manuel, engine.js).
function ManualRiskInfo({ worst, closestRiskLabel, closestBound }) {
  return (
    <div className="pg-riskgauge">
      <div className="pg-riskgauge-row">
        <span className="pg-riskgauge-label">Pire année simulée</span>
        <span className={`pg-riskgauge-value ${worst.value >= 0 ? 'pos' : 'neg'}`}>
          {fmtPct(worst.value)} en {worst.year}
        </span>
      </div>
      <p className="pg-riskgauge-detail">
        Composition libre — aucun plancher de perte imposé.
        {closestBound && (
          <span className="pg-riskgauge-bound">
            {' '}
            · palier le plus proche pour comparaison : {closestRiskLabel} ({closestBound.text})
          </span>
        )}
      </p>
    </div>
  )
}

function ManualComposer({
  profile,
  onProfileChange,
  selection,
  onAdd,
  onRemove,
  onPctChange,
  search,
  onSearchChange,
  onGenerate,
}) {
  const selectedIds = useMemo(() => new Set(selection.map((s) => s.id)), [selection])
  const [category, setCategory] = useState('Tous')
  const query = normalizeSearch(search.trim())
  const available = useMemo(
    () =>
      ASSETS.filter(
        (a) =>
          !selectedIds.has(a.id) &&
          (category === 'Tous' || category === a.cat) &&
          normalizeSearch(`${instrumentOption(a).search} ${CATEGORIES[a.cat].label}`).includes(query)
      ),
    [selectedIds, query, category]
  )
  // Regroupé par grande catégorie (même code couleur que AllocationList/CategorySummary plus bas)
  // — demande utilisateur du 25/09/2026 : 71 actifs en liste plate, sans distinction visuelle,
  // rendaient la sélection manuelle illisible ("tout est mélangé").
  const groupedAvailable = useMemo(() => {
    const byCat = new Map()
    for (const a of available) {
      if (!byCat.has(a.cat)) byCat.set(a.cat, [])
      byCat.get(a.cat).push(a)
    }
    return Object.keys(CATEGORIES)
      .filter((cat) => byCat.has(cat))
      .map((cat) => ({ cat, items: byCat.get(cat) }))
  }, [available])
  const total = selection.reduce((sum, s) => sum + s.pct, 0)
  const maxPct = selection.reduce((max, s) => Math.max(max, s.pct), 0)
  const lineCount = selection.length
  const canGenerate = total === 100 && lineCount > 0

  return (
    <div className="pg-panel">
      <div className="pg-panel-title">Composition manuelle</div>

      <label className="pg-manual-label" htmlFor="pg-manual-profile">
        Profil (étiquette de la composition)
      </label>
      <ChoicePicker
        id="pg-manual-profile"
        className="pg-manual-select"
        value={profile}
        onChange={(e) => onProfileChange(e.target.value)}
      >
        {PROFILES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </ChoicePicker>

      <label className="pg-manual-label" htmlFor="pg-manual-search">
        Ajouter un actif ({ASSETS.length} disponibles)
      </label>
      <input
        id="pg-manual-search"
        type="text"
        className="pg-manual-search"
        placeholder="Nom, catégorie, indice, ticker ou ISIN…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <div className="asset-picker-groups" role="group" aria-label="Catégories des actifs">
        <button type="button" aria-pressed={category === 'Tous'} onClick={() => setCategory('Tous')}>Tous</button>
        {Object.entries(CATEGORIES).map(([cat, info]) => <button key={cat} type="button" aria-pressed={category === cat} onClick={() => setCategory(cat)}>{info.label}</button>)}
      </div>
      <div className="pg-manual-asset-list">
        {groupedAvailable.map(({ cat, items }) => (
          <div key={cat} className="pg-manual-asset-group">
            <p className="pg-manual-asset-group-title">
              <span className="pg-manual-asset-group-swatch" style={{ background: CATEGORIES[cat].color }} aria-hidden="true" />
              {CATEGORIES[cat].label}
            </p>
            {items.map((a) => (
              <button key={a.id} type="button" className="pg-manual-asset-option" data-asset-id={a.id} title={a.name} onClick={() => onAdd(a.id)}>
                <strong>{a.emoji} {instrumentOption(a).label}</strong>
                <small className="pg-asset-description">{instrumentOption(a).detail || CATEGORIES[a.cat].label}{instrumentOption(a).badges.length ? ` · ${instrumentOption(a).badges.join(' · ')}` : ''}</small>
              </button>
            ))}
          </div>
        ))}
        {available.length === 0 && <p className="pg-manual-empty">Aucun actif ne correspond, ou tous sont déjà ajoutés.</p>}
      </div>

      {selection.length > 0 && (
        <ul className="pg-manual-selection-list">
          {selection.map((s) => {
            const asset = getAsset(s.id)
            return (
              <li key={s.id} className="pg-manual-selection-row">
                <span className="pg-manual-selection-name">
                  {asset.emoji} {asset.name}
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="pg-manual-pct-input"
                  value={s.pct}
                  onChange={(e) => onPctChange(s.id, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  aria-label={`Pourcentage pour ${asset.name}`}
                />
                <span className="pg-manual-pct-sign">%</span>
                <button
                  type="button"
                  className="pg-manual-remove"
                  onClick={() => onRemove(s.id)}
                  aria-label={`Retirer ${asset.name}`}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className={`pg-manual-total ${total === 100 ? 'ok' : 'bad'}`}>
        Total : <b>{total}%</b>
        {total !== 100 && (
          <span className="pg-manual-total-hint">
            {total < 100 ? ` — il manque ${100 - total}%` : ` — ${total - 100}% en trop`}
          </span>
        )}
      </div>

      {maxPct > MANUAL_CONCENTRATION_WARN && (
        <p className="pg-manual-warning">⚠️ Une ligne dépasse {MANUAL_CONCENTRATION_WARN}% du portefeuille — concentration très élevée.</p>
      )}
      {lineCount > MANUAL_LINE_COUNT_WARN && (
        <p className="pg-manual-warning">⚠️ {lineCount} lignes : le tweet risque d'être très long.</p>
      )}

      <Button type="button" className="w-full text-base" disabled={!canGenerate} onClick={onGenerate}>
        Générer le tweet
      </Button>
    </div>
  )
}

function AllocationList({ selection }) {
  return (
    <ul className="pg-alloc-list">
      {selection
        .slice()
        .sort((a, b) => b.pct - a.pct)
        .map((s) => (
          <li key={s.id} className="pg-alloc-row">
            <span className="pg-alloc-swatch" style={{ background: CATEGORIES[s.cat].color }} />
            <span className="pg-alloc-name">
              <span className="pg-alloc-name-text">
                {s.emoji} {s.name}
              </span>
              {dataLabels(s).map(label => (
                <span key={label} className="pg-data-label" title={s.confidenceNote}>{label}</span>
              ))}
            </span>
            <span className="pg-alloc-cat">{CATEGORIES[s.cat].label}</span>
            <span className="pg-alloc-pct">{s.pct}%</span>
            <div className="pg-alloc-bar-track">
              <div className="pg-alloc-bar-fill" style={{ width: `${s.pct}%`, background: CATEGORIES[s.cat].color }} />
            </div>
          </li>
        ))}
    </ul>
  )
}

function CategorySummary({ selection }) {
  const totals = selection.reduce((acc, asset) => {
    acc[asset.cat] = (acc[asset.cat] || 0) + asset.pct
    return acc
  }, {})
  return (
    <div className="pg-category-summary" aria-label="Répartition par grandes catégories">
      <p>Vue par grandes catégories</p>
      <ul>
        {Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([cat, pct]) => (
          <li key={cat}><span style={{ background: CATEGORIES[cat].color }} aria-hidden="true" />{CATEGORIES[cat].label} : <strong>{Number(pct.toFixed(1))} %</strong></li>
        ))}
      </ul>
      <small>Selon la catégorie de chaque ligne. Les ETF peuvent détenir les mêmes titres ; cette vue ne mesure pas les doublons ni les pays détenus.</small>
    </div>
  )
}

function PerfChart({ perf }) {
  const values = YEARS.map((y) => perf[y])
  const maxAbs = Math.max(1, ...values.filter(Number.isFinite).map((v) => Math.abs(v)))
  const half = 62
  return (
    <div className="pg-chart-wrap">
      <div className="pg-chart-title-row">
        <span className="pg-chart-title">Performance annuelle simulée du portefeuille</span>
        <span className="pg-chart-legend">
          <i className="pg-dot" style={{ background: 'var(--positive)' }} /> Positive
          <i className="pg-dot" style={{ background: 'var(--negative)' }} /> Négative
        </span>
      </div>
      <div className="pg-chart-area">
        <div className="pg-chart-baseline" style={{ top: half }} />
        {YEARS.map((y, i) => {
          const v = values[i]
          if (!Number.isFinite(v)) return <div className="pg-bar-col" key={y} title={`${y} : non disponible`}><span className="pg-bar-year">{y} · n.d.</span></div>
          const h = Math.max(2, (Math.abs(v) / maxAbs) * half)
          const positive = v >= 0
          return (
            <div className="pg-bar-col" key={y} title={`${y} : ${fmtPct(v)}`} tabIndex={0}>
              <div
                className={`pg-bar-fill ${positive ? 'pos' : 'neg'}`}
                style={positive ? { bottom: half, height: h } : { top: half, height: h }}
              />
              <span
                className={`pg-bar-value ${positive ? 'pos' : 'neg'}`}
                style={positive ? { bottom: half + h + 4 } : { top: half + h + 4 }}
              >
                {fmtPct(v)}
              </span>
              <span className="pg-bar-year">{y}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TweetCard({ portfolio }) {
  const text = useMemo(() => renderTweetText(portfolio), [portfolio])
  const paragraphs = text.split('\n\n')

  return (
    <article className="pg-tweet-card" aria-label="Aperçu du post X">
      <div className="pg-tweet-body">
        {paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? 'pg-tweet-title' : undefined}>
            {p}
          </p>
        ))}
      </div>
    </article>
  )
}

export default function App() {
  const [mode, setMode] = useState('auto')
  const [selectedRisk, setSelectedRisk] = useState('auto')
  const [selectedProfile, setSelectedProfile] = useState('auto')
  const [history, setHistory] = useState(() => [generatePortfolio([], 'auto', 'auto')])
  const [copyState, setCopyState] = useState('idle')
  const [replacementNotice, setReplacementNotice] = useState('')
  const textareaRef = useRef(null)

  // Composition manuelle : état séparé du tirage auto, jamais mélangé (cf. engine.js,
  // buildManualPortfolio/pickManualHookPair scopés sur riskId === "manuel").
  const [manualProfile, setManualProfile] = useState(PROFILES[0].id)
  const [manualSelection, setManualSelection] = useState([])
  const [manualSearch, setManualSearch] = useState('')
  const [manualEditing, setManualEditing] = useState(true)

  const current = history[history.length - 1]
  const imageDataUrl = useMemo(() => renderPortfolioImage(current).toDataURL('image/png'), [current])

  const handleGenerate = useCallback(
    (riskOverride, profileOverride) => {
      const risk = riskOverride ?? selectedRisk
      const profile = profileOverride ?? selectedProfile
      setHistory((h) => [...h, generatePortfolio(h, risk, profile)])
      setReplacementNotice('')
      setCopyState('idle')
    },
    [selectedRisk, selectedProfile],
  )

  const handleSelectRisk = useCallback(
    (riskKey) => {
      setSelectedRisk(riskKey)
      handleGenerate(riskKey, selectedProfile)
    },
    [handleGenerate, selectedProfile],
  )

  const handleSelectProfile = useCallback(
    (profileKey) => {
      setSelectedProfile(profileKey)
      handleGenerate(selectedRisk, profileKey)
    },
    [handleGenerate, selectedRisk],
  )

  const handleModeChange = useCallback((next) => {
    setMode(next)
    if (next === 'manual') setManualEditing(true)
  }, [])

  const handleManualAdd = useCallback((id) => {
    setManualSelection((sel) => (sel.some((s) => s.id === id) ? sel : [...sel, { id, pct: 0 }]))
  }, [])
  const handleManualRemove = useCallback((id) => {
    setManualSelection((sel) => sel.filter((s) => s.id !== id))
  }, [])
  const handleManualPctChange = useCallback((id, pct) => {
    setManualSelection((sel) => sel.map((s) => (s.id === id ? { ...s, pct } : s)))
  }, [])
  const handleManualGenerate = useCallback(() => {
    setHistory((h) => [...h, buildManualPortfolio(manualSelection, manualProfile, h)])
    setCopyState('idle')
    setManualEditing(false)
  }, [manualSelection, manualProfile])

  const handleCopy = useCallback(async () => {
    const text = renderTweetText(current)
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('done')
    } catch {
      const ta = textareaRef.current
      if (ta) {
        ta.value = text
        ta.style.display = 'block'
        ta.select()
        try {
          document.execCommand('copy')
          setCopyState('done')
        } catch {
          setCopyState('error')
        }
        ta.style.display = 'none'
      } else {
        setCopyState('error')
      }
    }
    window.setTimeout(() => setCopyState('idle'), 2200)
  }, [current])

  return (
    <div className="pg-scope">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Générateur de portefeuilles"
          subtitle="Portefeuilles illustratifs par profil d'investisseur et niveau de risque."
        />
        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-400">
          {history.length} portefeuille{history.length > 1 ? 's' : ''} généré{history.length > 1 ? 's' : ''} cette session
        </span>
      </div>

      <ToolWorkspace renderImage={() => imageDataUrl} imageAlt={`Répartition ${current.title}`} className="pg-main" actions={<>
          <div className="pg-tweet-actions">
            <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
              {copyState === 'done' ? '✅ Copié !' : copyState === 'error' ? '⚠️ Copie manuelle requise' : '📋 Copier le texte'}
            </Button>
          </div>
            <a className="pg-image-download" href={imageDataUrl} download="repartition-portefeuille.png">⬇️ Télécharger l’image PNG</a>
        </>}>
        <section className="pg-tweet-col tool-preview">
          <TweetCard portfolio={current} />

          <textarea ref={textareaRef} className="pg-clipboard-fallback" readOnly />
        </section>

        <section className="pg-control-col tool-settings">
          <div className="pg-mode-toggle" role="group" aria-label="Mode de génération">
            <button
              type="button"
              className={`pg-mode-btn${mode === 'auto' ? ' active' : ''}`}
              aria-pressed={mode === 'auto'}
              onClick={() => handleModeChange('auto')}
            >
              🎲 Auto
            </button>
            <button
              type="button"
              className={`pg-mode-btn${mode === 'manual' ? ' active' : ''}`}
              aria-pressed={mode === 'manual'}
              onClick={() => handleModeChange('manual')}
            >
              ✍️ Composition manuelle
            </button>
          </div>

          {mode === 'auto' ? (
            <>
              <Button type="button" className="w-full text-base" onClick={() => handleGenerate()}>
                🔄 Générer un nouveau portefeuille
              </Button>

              <RiskSelector selectedRisk={selectedRisk} selectedProfile={selectedProfile} onSelect={handleSelectRisk} />
              <ProfileSelector selectedRisk={selectedRisk} selectedProfile={selectedProfile} onSelect={handleSelectProfile} />
            </>
          ) : manualEditing ? (
            <ManualComposer
              profile={manualProfile}
              onProfileChange={setManualProfile}
              selection={manualSelection}
              onAdd={handleManualAdd}
              onRemove={handleManualRemove}
              onPctChange={handleManualPctChange}
              search={manualSearch}
              onSearchChange={setManualSearch}
              onGenerate={handleManualGenerate}
            />
          ) : (
            <div className="pg-panel pg-manual-result-panel">
              <div className="pg-panel-title">Composition manuelle</div>
              <p className="pg-fine-print">
                {manualSelection.length} ligne{manualSelection.length > 1 ? 's' : ''} · profil {PROFILES.find((p) => p.id === manualProfile)?.label}
              </p>
              {current.mode === 'manual' && (
                <p className={`pg-manual-length pg-manual-length-${getLengthStatus(renderTweetText(current).length).level}`}>
                  {getLengthStatus(renderTweetText(current).length).label}
                </p>
              )}
              <div className="pg-manual-result-actions">
                <Button type="button" variant="secondary" className="w-full" onClick={() => setManualEditing(true)}>
                  ✏️ Modifier la composition
                </Button>
                <Button type="button" className="w-full" onClick={handleManualGenerate}>
                  🔄 Nouveau texte, même composition
                </Button>
              </div>
            </div>
          )}

          <div className="pg-panel">
            {current.mode === 'manual' ? (
              <ManualRiskInfo worst={current.worst} closestRiskLabel={current.closestRiskLabel} closestBound={current.closestBound} />
            ) : (
              <RiskGauge
                riskId={current.riskId}
                riskLabel={current.riskLabel}
                profileName={current.profileName}
                worst={current.worst}
                bound={current.bound}
              />
            )}
          </div>

          <div className="pg-panel">
            <div className="pg-panel-title">Répartition — {current.selection.length} lignes</div>
            {current.recipeLabel && <p className="pg-fine-print pg-recipe-label">{current.recipeLabel}</p>}
            <AllocationList selection={current.selection} />
            <CategorySummary selection={current.selection} />
            {current.mode === 'auto' && <ReplacementPanel key={current.id} portfolio={current} onReplace={(assetId, replacementId) => {
              const updated = replacePortfolioAsset(current, assetId, replacementId, history.slice(0, -1))
              setHistory(previous => [...previous.slice(0, -1), updated])
              setCopyState('idle')
              setReplacementNotice('Support remplacé. Répartition, calculs, tweet et image actualisés.')
            }} />}
            <p role="status">{replacementNotice}</p>
          </div>

          <div className="pg-panel">
            <PerfChart perf={current.perf} />
          </div>

          {current.selection.some(asset => dataLabels(asset).includes('Données en USD')) && (
            <p className="pg-method-summary">Simulation à partir des devises publiées, sans conversion : ce résultat ne représente pas une performance en euros.</p>
          )}
          {current.selection.some((asset) => asset.confidenceNote) && (
            <details className="pg-panel pg-panel-muted">
              <summary>Sources et méthode</summary>
              <ul>
                {current.selection.filter((asset) => asset.confidenceNote).map((asset) => (
                  <li key={asset.id}><strong>{asset.name}</strong> : {asset.confidenceNote}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="pg-panel pg-panel-muted">
            <p className="pg-fine-print">
              Rendements 2020-2025 : données historiques approximatives par actif, à titre pédagogique et
              éditables manuellement. Chaque année additionne les rendements des lignes selon des poids
              affichés, sans simuler les versements ni un capital cumulé ; des devises différentes peuvent
              coexister sans conversion. Chaque combinaison est validée pour respecter la borne de pire année
              de son palier de risque avant d'être affichée.
            </p>
          </div>
        </section>
      </ToolWorkspace>
    </div>
  )
}
