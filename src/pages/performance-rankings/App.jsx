import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace.jsx'
import AssetPicker from '../../design-system/AssetPicker.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { copyPublicationText, notifyPublication, startPublicationDownload } from '../../design-system/publicationActions.js'
import { ALL_CATEGORIES, ANNUAL_ASSETS, BENCHMARK_CATEGORIES, BENCHMARK_OPTIONS, COLORS, RANKING_ASSETS } from './data.js'
import { markBenchmark, randomSuggestion } from './suggestions.js'
import { isStock, replaceBenchmark } from './selection.js'
import SelectionGrid from './SelectionGrid.jsx'
import Favorites from './Favorites.jsx'
import FX from '../../data/monthly-fx.json' with { type: 'json' }
import { convertAsset, buildPortfolio } from './series.js'
import PortfolioEditor from './PortfolioEditor.jsx'
import { DEFAULT_PORTFOLIOS } from './portfolio-defaults.js'
import { annualColumns, basisLabel, buildRanking, buildTweet, commonCoverage, formatPercent, monthIndex, rollingRegularity } from './engine.js'
import { annualImagePercent, annualRankingColumns, annualRankingError, contrastText } from './annualRanking.js'
import './rankings.css'

const CATEGORY = ALL_CATEGORIES.find(c => c.id === 'world')
const SOURCES = { ...RANKING_ASSETS, ...ANNUAL_ASSETS }
const ELIGIBLE = Object.values(RANKING_ASSETS).filter(a => !['monthly-average', 'price-index', 'futures-price'].includes(a.basis))
// A category usable for a short custom period is not necessarily usable for annual images.
const ANNUAL_CATEGORY_IDS = new Set(ALL_CATEGORIES.filter(c => {
  try { return commonCoverage(c.ids.map(id => convertAsset(SOURCES[id], c.currency ?? 'original', FX))).years.length >= 2 }
  catch { return false }
}).map(c => c.id))
function defaultDates(assets) {
  const c = commonCoverage(assets)
  return { start: c.start, end: c.end, startYear: c.years.at(-6) ?? c.years[0], endYear: c.years.at(-1) }
}

export default function App() {
  const [categoryId, setCategoryId] = useState(CATEGORY.id)
  const [ids, setIds] = useState(CATEGORY.ids)
  const [mode, setMode] = useState('years')
  const [presentation, setPresentation] = useState('current')
  const [dates, setDates] = useState(() => defaultDates(CATEGORY.ids.map(id => SOURCES[id])))
  const [title, setTitle] = useState(CATEGORY.label)
  const [showRegularity, setShowRegularity] = useState(false)
  const [months, setMonths] = useState(60)
  const [slot, setSlot] = useState(0)
  const [manual, setManual] = useState(false)
  const [manualMode, setManualMode] = useState('batch')
  const [benchmarkId, setBenchmarkId] = useState('')
  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [currency, setCurrency] = useState('original')
  const [bank, setBank] = useState('monthly')
  const [comparison, setComparison] = useState('assets')
  const [portfolios, setPortfolios] = useState(DEFAULT_PORTFOLIOS)
  const prepared = useMemo(() => {
    try {
      const assets = comparison === 'portfolios'
        ? portfolios.map(d => buildPortfolio(d, RANKING_ASSETS, currency === 'original' ? 'EUR' : currency, FX))
        : ids.map(id => convertAsset(SOURCES[id], currency, FX))
      return { assets: markBenchmark(assets, benchmarkId) }
    } catch (e) { return { assets: [], error: e.message } }
  }, [ids, currency, comparison, portfolios, benchmarkId])
  const assets = prepared.assets
  const categories = presentation === 'annual' ? ALL_CATEGORIES.filter(c => ANNUAL_CATEGORY_IDS.has(c.id) || c.id === categoryId) : ALL_CATEGORIES
  const computed = useMemo(() => {
    try {
      if (prepared.error) throw new Error(prepared.error)
      const coverage = commonCoverage(assets)
      const result = buildRanking(assets, { ...dates, mode, annualized: monthIndex(dates.end) - monthIndex(dates.start) > 12 })
      const regularity = showRegularity ? rollingRegularity(assets, months) : null
      return { coverage, result, regularity }
    } catch (error) {
      let coverage = null
      try { coverage = commonCoverage(assets) } catch { /* A new selection may still have fewer than two assets. */ }
      return { error: error.message, coverage }
    }
  }, [assets, prepared.error, dates, mode, showRegularity, months])
  const { coverage, result, regularity, error } = computed
  const imageColumns = result ? annualColumns(result) : []
  const imageError = result && presentation === 'annual' ? annualRankingError(result) : ''
  const rankedColumns = result && presentation === 'annual' && !imageError ? annualRankingColumns(result) : []
  const generatedText = result ? buildTweet(result, title, regularity) : ''
  // Keep a manual draft only for its exact calculation snapshot.
  const text = draft?.owner === generatedText ? draft.value : generatedText
  const renderImage = useCallback(async () => {
    if (!result) throw new Error('Choisis une période valide.')
    await document.fonts.ready
    return (await import('./image.js')).renderRankingImage(result, title, regularity, presentation)
  }, [result, title, regularity, presentation])

  function applyIds(next, nextCurrency = currency, resetPeriod = false) {
    setIds(next); setStatus('')
    if (benchmarkId && !next.includes(benchmarkId)) setBenchmarkId('')
    // Manual edits preserve the requested years. Only choosing a prepared category
    // resets its period; incompatible manual selections are explained below.
    if (next.length >= 2 && resetPeriod) {
      try {
        const nextDates = defaultDates(next.map(id => convertAsset(SOURCES[id], nextCurrency, FX)))
        setDates(nextDates)
        if (nextDates.startYear === undefined) setMode('period')
      } catch { /* Error is shown in the editor. */ }
    }
  }
  function chooseCategory(id) {
    const c = ALL_CATEGORIES.find(c => c.id === id)
    const nextCurrency = c.currency ?? 'original'
    setCurrency(nextCurrency); setComparison('assets'); setBank(c.frequency ?? 'monthly')
    setCategoryId(id); applyIds(c.ids, nextCurrency, true); setTitle(c.label); setSlot(0); setManual(false)
    setBenchmarkId(c.benchmarkId ?? '')
    if (c.frequency === 'annual') setMode('years')
  }
  function suggest() {
    try {
      const suggestion = randomSuggestion(categoryId, Math.random, undefined, presentation === 'annual' ? 7 : 10)
      const c = suggestion.category
      setCategoryId(c.id); setIds(c.ids); setTitle(c.label); setBenchmarkId(c.benchmarkId ?? '')
      setCurrency(suggestion.currency); setDates(suggestion.dates); setMode(suggestion.mode)
      setComparison('assets'); setBank('monthly'); setSlot(0); setManual(false); setShowRegularity(false)
      setStatus(`Sélection proposée : ${c.label}, de ${suggestion.dates.startYear} à ${suggestion.dates.endYear}.`)
    } catch (e) { setStatus(e.message) }
  }
  function changeBenchmark(nextId, selectedIds = ids, previousId = benchmarkId) {
    try {
      const next = replaceBenchmark({ ids: selectedIds, benchmarkId: previousId, currency, dates, mode }, nextId)
      setIds(next.ids); setBenchmarkId(next.benchmarkId); setCurrency(next.currency); setDates(next.dates); setMode(next.mode)
      const label = BENCHMARK_OPTIONS.find(option => option.id === nextId).label
      setTitle(`${title.replace(/ · face à un ETF.*$/, '')} · face à un ETF ${label}`.slice(0, 85))
      setStatus(next.adjusted ? 'Période adaptée à l’historique commun de la nouvelle référence.' : 'ETF de référence remplacé ; période conservée.')
    } catch (e) { setStatus(e.message) }
  }
  function startBenchmark() {
    if (comparison === 'assets' && bank === 'monthly' && ids.length === 5 && ids.every(id => isStock(SOURCES[id]))) {
      const ref = BENCHMARK_OPTIONS[0].id
      changeBenchmark(ref, [...ids, ref], ref)
      return
    }
    chooseCategory((BENCHMARK_CATEGORIES.find(c => c.id === categoryId || c.id === `${categoryId}-benchmark`) ?? BENCHMARK_CATEGORIES[0]).id)
  }
  function restoreFavorite(saved) {
    setIds(saved.ids); setCurrency(saved.currency); setDates(saved.dates); setMode(saved.mode)
    setTitle(saved.title); setBank(saved.bank); setCategoryId(saved.categoryId); setBenchmarkId(saved.benchmarkId)
    setComparison('assets'); setManual(true); setManualMode('batch'); setSlot(0); setShowRegularity(false); setDraft(null); setStatus('Favori restauré.')
  }
  const otherIds = ids.filter((_, i) => i !== slot)
  const reference = SOURCES[otherIds[0]]
  const universe = bank === 'annual' ? Object.values(ANNUAL_ASSETS) : ELIGIBLE
  const options = universe.filter(a => !otherIds.includes(a.id) && (!reference || (bank !== 'annual' || a.basis === reference.basis)) && (currency !== 'original' || !reference || a.currency === reference.currency))
    .map(a => ({ ...a, label: a.shortLabel, name: a.label, detail: `${a.label} · ${a.currency} · ${a.frequency === 'annual' ? 'Calendrier NAV / indice officiel' : a.points[0].date + ' → ' + a.points.at(-1).date}`, badges: [a.instrumentType === 'EQUITY' ? 'Action' : a.instrumentType ?? (a.isin ? 'ETF' : a.priceUnit === 'points' ? 'Indice' : a.priceMethod === 'adjusted' ? 'Action' : 'Actif')] }))
  async function download() {
    setBusy(true); setStatus('')
    try {
      const canvas = await renderImage()
      const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = `classement-${presentation}-${categoryId}-${result.coverage.currency}-${result.start}-${result.end}.png`
      document.body.append(link); startPublicationDownload(link); link.remove(); setStatus('Téléchargement lancé.')
    } catch (e) { setStatus(e.message); notifyPublication(e.message, 'error') }
    finally { setBusy(false) }
  }
  async function copy() { try { await copyPublicationText(text); setStatus('Texte copié.') } catch (e) { setStatus(e.message) } }
  function dateField(name, value) { setDates(d => ({ ...d, [name]: value })); setStatus('') }
  return <div className="rankings-tool">
    <PageHeader title="Qui a vraiment gagné ?" subtitle="Classe des actifs par année ou sur une période commune. Les calculs utilisent les historiques mensuels ou les calendriers annuels officiels, sans interpolation. Les choix suivent la profondeur réelle des historiques." />
    <ToolWorkspace renderImage={renderImage} imageDisabled={!result || Boolean(imageError)} imageAlt={`${presentation === 'annual' ? 'Classement annuel' : 'Performances annuelles'} : ${title}`} actions={<>
      <button type="button" onClick={copy} disabled={!result}>Copier le texte</button>
      <button type="button" onClick={download} disabled={!result || Boolean(imageError) || busy}>{busy ? 'Préparation…' : 'Télécharger l’image'}</button>
      <span role="status">{status}</span>
    </>}>
      <section className="tool-settings rk-settings" aria-label="Réglages du classement">
        <div className="rk-intro"><span>LES MARCHÉS EN PERSPECTIVE</span><h2>Un classement.<br />Plusieurs façons de le lire.</h2><p>Choisis un univers, puis la période qui t’intéresse.</p></div>
        <fieldset className="rk-modes"><legend>Présentation de l’image</legend>
          {[['current', 'Présentation actuelle'], ['annual', 'Classement annuel']].map(([value, label]) => <button type="button" key={value} aria-pressed={presentation === value} onClick={() => setPresentation(value)}>{label}</button>)}
        </fieldset>
        {presentation === 'annual' && <p className="rk-note">Une colonne par année, du meilleur au moins performant. Chaque actif garde sa couleur. Les rangs utilisent les valeurs non arrondies ; les égalités exactes sont signalées « ex æquo ». Jusqu’à 6 actifs et 7 années complètes. Le tweet conserve la synthèse annualisée sur la période.</p>}
        <div className="rk-inline rk-suggestions">
          <button type="button" onClick={suggest}>Sélection aléatoire</button>
          <button type="button" onClick={startBenchmark}>5 actions face à un ETF</button>
        </div>
        <label className="rk-field">Catégorie<ChoicePicker aria-label="Catégorie" value={categoryId} onChange={e => chooseCategory(e.target.value)}>
          <optgroup label="Univers de comparaison">{categories.filter(c => !c.benchmarkId).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</optgroup>
          <optgroup label="5 actions face à un ETF">{categories.filter(c => c.benchmarkId).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</optgroup>
        </ChoicePicker></label>
        <fieldset className="rk-modes"><legend>Comparer</legend>{[['assets', 'Actifs'], ['portfolios', 'Portefeuilles']].map(([value, label]) => <button type="button" key={value} aria-pressed={comparison === value} onClick={() => {
          setComparison(value)
          if (value === 'portfolios') {
            setCurrency('EUR'); setTitle('Comparaison de portefeuilles')
            try { setDates(defaultDates(portfolios.map(d => buildPortfolio(d, RANKING_ASSETS, 'EUR', FX)))) } catch { /* Shown below. */ }
          } else {
            const base = ALL_CATEGORIES.find(c => c.id === categoryId)?.label ?? 'Ma sélection'
            const ref = BENCHMARK_OPTIONS.find(option => option.id === benchmarkId)
            setTitle(ref ? `${base.replace(/ · face à un ETF.*$/, '')} · face à un ETF ${ref.label}` : base)
            applyIds(ids)
          }
        }}>{label}</button>)}</fieldset>
        <label className="rk-field">Devise du classement<ChoicePicker aria-label="Devise du classement" value={currency} onChange={e => setCurrency(e.target.value)}>{[['original', 'Devise d’origine'], ['EUR', 'Euros (EUR)'], ['USD', 'Dollars (USD)']].map(([value, label]) => <option key={value} value={value} disabled={comparison === 'portfolios' && value === 'original'}>{label}</option>)}</ChoicePicker></label>
        {currency !== 'original' && <p className="rk-note">Conversion aux références BCE de fin de mois, sans couverture de change.</p>}
        {comparison === 'portfolios' && <PortfolioEditor definitions={portfolios} assets={Object.fromEntries(ELIGIBLE.map(a => [a.id, a]))} onChange={next => {
          setPortfolios(next)
          try { setDates(defaultDates(next.map(d => buildPortfolio(d, RANKING_ASSETS, currency === 'original' ? 'EUR' : currency, FX)))) } catch { /* Incomplete weights remain editable. */ }
        }} />}
        {comparison === 'assets' && <>
        {assets.some(a => a.benchmark) && <label className="rk-field">ETF de référence<ChoicePicker aria-label="ETF de référence" value={benchmarkId} onChange={e => changeBenchmark(e.target.value)}>
          {BENCHMARK_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </ChoicePicker></label>}
        <div className="rk-selected" aria-label="Actifs sélectionnés">{assets.map((a, i) => <div key={a.id} style={{ '--rk-color': COLORS[i] }}>
          <span className="rk-dot" /><span><strong>{a.shortLabel}</strong><small>{a.currency} · {a.instrumentType === 'EQUITY' ? 'Action' : a.isin ? a.instrumentType ?? 'ETF' : a.priceUnit === 'points' ? 'Indice' : a.priceMethod === 'adjusted' ? 'Action' : 'Actif'}</small></span>
          {manual && <><button type="button" aria-label={`Modifier ${a.shortLabel}`} onClick={() => { setSlot(i); setManualMode('single') }}>Modifier</button><button type="button" aria-label={`Retirer ${a.shortLabel}`} onClick={() => { applyIds(ids.filter((_, j) => i !== j)); setSlot(0) }}>×</button></>}
        </div>)}</div>
        <button type="button" className="rk-text-button" aria-expanded={manual} onClick={() => setManual(!manual)}>{manual ? 'Fermer la sélection manuelle' : 'Personnaliser les actifs'}</button>
        {manual && <div className="rk-manual">
          <label className="rk-field">Historique disponible<ChoicePicker aria-label="Historique disponible" value={bank} onChange={e => { setBank(e.target.value); applyIds([]); setSlot(0); setMode('years') }}><option value="monthly">Cotations mensuelles</option><option value="annual">Calendriers annuels officiels</option></ChoicePicker></label>
          <div className="rk-inline"><button type="button" onClick={() => { applyIds([]); setSlot(0); setTitle('Ma sélection') }}>Nouvelle sélection</button><button type="button" disabled={ids.length >= 6} onClick={() => { setSlot(ids.length); setManualMode('single') }}>Ajouter un actif</button></div>
          {bank === 'monthly' && <fieldset className="rk-modes"><legend>Sélection manuelle</legend>
            <button type="button" aria-pressed={manualMode === 'batch'} onClick={() => setManualMode('batch')}>Cocher les actifs</button>
            <button type="button" aria-pressed={manualMode === 'single'} onClick={() => setManualMode('single')}>Un par un</button>
          </fieldset>}
          {bank === 'monthly' && manualMode === 'batch' ? <SelectionGrid ids={ids} currency={currency} assets={RANKING_ASSETS} onChange={next => {
            setCurrency(next.currency); applyIds(next.ids, next.currency); setSlot(0); setTitle('Ma sélection')
          }} /> : <>
          <p>{slot >= ids.length ? 'Ajouter un actif' : `Remplacer l’actif ${slot + 1}`} · de 2 à 6 actifs</p>
          <AssetPicker label="Actif du classement" items={options} value={ids[slot] ?? ''} hideIdleResults clearSearchOnSelect onChange={id => {
            const next = [...ids]; next[Math.min(slot, ids.length)] = id; applyIds(next); setSlot(Math.min(next.length, 5)); setTitle('Ma sélection')
          }} />
          </>}
          <p className="rk-note">Les indices nets et bruts restent distincts. Choisis EUR ou USD pour comparer des devises différentes. Les calendriers annuels sont séparés des cotations mensuelles. « Nouvelle sélection » permet de repartir sur une autre base.</p>
        </div>}
        </>}
        <fieldset className="rk-modes"><legend>Temporalité</legend>{[['year', 'Une année'], ['years', 'Année par année'], ['period', 'Période libre']].map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}</fieldset>
        {mode === 'period' ? <>
          <div className="rk-date-fields"><label>Début, fin de mois<input type="month" min={coverage?.start} max={coverage?.end} value={dates.start} onChange={e => dateField('start', e.target.value)} /></label><label>Fin, fin de mois<input type="month" min={coverage?.start} max={coverage?.end} value={dates.end} onChange={e => dateField('end', e.target.value)} /></label></div>
          <p className="rk-note">Le tweet affiche la performance annualisée au-delà d’un an. L’image détaille chaque année ; les périodes partielles sont signalées.</p>
        </> : <div className="rk-date-fields">
          <label>{mode === 'year' ? 'Année' : 'Première année'}<ChoicePicker aria-label={mode === 'year' ? 'Année' : 'Première année'} value={dates.startYear ?? ''} onChange={e => dateField('startYear', Number(e.target.value))}>{coverage?.years.map(y => <option key={y} value={y}>{y}</option>)}</ChoicePicker></label>
          {mode === 'years' && <label>Dernière année<ChoicePicker aria-label="Dernière année" value={dates.endYear ?? ''} onChange={e => dateField('endYear', Number(e.target.value))}>{coverage?.years.map(y => <option key={y} value={y}>{y}</option>)}</ChoicePicker></label>}
        </div>}
        {coverage && <p className="rk-coverage"><strong>{coverage.currency} · {basisLabel(coverage.basis)}</strong><br />Historique commun : {coverage.start} → {coverage.end}{coverage.years.length ? ` · ${coverage.years.length} années civiles complètes` : ' · aucune année civile complète'}</p>}
        {error && <p className="rk-error" role="alert">{error}</p>}
        {imageError && <p className="rk-error" role="alert">{imageError}</p>}
        {(error || imageError) && coverage?.years.length > 0 && <div className="rk-note">
          <p>Années civiles complètes communes disponibles : {coverage.years.join(', ')}. Aucun actif ni aucune année n’a été retiré.</p>
          <button type="button" className="rk-text-button" onClick={() => {
            const years = coverage.years
            let first = years.length - 1
            while (first > 0 && years[first - 1] === years[first] - 1 && years.length - first < 7) first--
            setDates(d => ({ ...d, startYear: years[first], endYear: years.at(-1) })); setMode('years')
          }}>Utiliser la dernière période commune (7 années maximum)</button>
        </div>}
        {(error || imageError) && assets.length > 0 && <ul className="rk-note">{assets.map(a => <li key={a.id}>{a.shortLabel ?? a.label} · {a.currency} · {basisLabel(a.basis)} · {a.frequency === 'annual' ? `années ${Object.keys(a.years).join(', ')}` : `${a.points[0]?.date ?? 'borne absente'} → ${a.points.at(-1)?.date ?? 'borne absente'}`}</li>)}</ul>}
        <label className="rk-field">Univers du tweet<input maxLength={85} value={title} onChange={e => setTitle(e.target.value)} /></label>
        {comparison === 'assets' && <Favorites disabled={!result} selection={{ ids, currency, dates, mode, title, bank, categoryId, benchmarkId: assets.some(a => a.benchmark) ? benchmarkId : '' }} onRestore={restoreFavorite} />}
        <details className="rk-regularity"><summary>Ajouter la régularité historique</summary>
          {presentation === 'annual' && <p>La régularité glissante s’affiche dans la présentation actuelle. Le classement annuel conserve uniquement les performances des années choisies.</p>}
          <label className="rk-check"><input type="checkbox" checked={showRegularity} onChange={e => setShowRegularity(e.target.checked)} /> Montrer la fréquence de première place</label>
          <label className="rk-field">Durée de chaque période<ChoicePicker aria-label="Durée de chaque période" value={months} onChange={e => setMonths(Number(e.target.value))}>{[12, 36, 60, 120].map(m => <option key={m} value={m}>{m / 12} an{m > 12 ? 's' : ''}</option>)}</ChoicePicker></label>
          {showRegularity && (regularity ? <p>{regularity.count} périodes mensuelles de départ, sur tout l’historique commun {regularity.start} → {regularity.end}.</p> : <p role="status">{coverage?.frequency === 'annual' ? 'Les périodes glissantes mensuelles exigent une série mensuelle.' : 'Recul insuffisant pour calculer au moins deux périodes.'} Cette mesure sera absente de l’export.</p>)}
          <p className="rk-note">Les périodes se chevauchent. Les victoires sont partagées en cas d’égalité. Ces fréquences historiques ne sont pas des probabilités futures.</p>
        </details>
        <details className="rk-method"><summary>Supports et méthode</summary><p>Les indices, les ETF et les actions conservent leur identité. Les ETF sont comparés via leurs cotations exactes, frais du fonds inclus et revenus réinvestis. Les cotations mensuelles désignent des clôtures de fin de mois. Les indices officiels historiques peuvent contenir des périodes rétropolées avant leur lancement, distinctes d’un rendement de fonds réel. Une année civile va de décembre précédent à décembre de l’année choisie. Aucune année partielle n’est présentée comme complète.</p>
          <p>La devise d’origine ou une conversion BCE peut être choisie. La conversion ne constitue pas une couverture de change. Les calendriers annuels utilisent les rendements NAV officiels ; aucune valeur mensuelle n’en est déduite. Hors frais du courtier et fiscalité. Les portefeuilles LifeStrategy sont les ETF réels.</p>
          {[...new Map(assets.flatMap(a => a.portfolio ? a.portfolio.lines.map(l => l.asset) : [a]).map(a => [a.id, a])).values()].map(a => <p key={a.id}><strong>{a.shortLabel}</strong> — {a.label}{a.isin ? ` · ${a.isin}` : ''}{a.ticker ? ` · ${a.ticker}` : ''} · {a.currency}<br />{basisLabel(a.basis)} · {a.frequency === 'annual' ? `Années documentées : ${Object.keys(a.years).join(', ')}` : `Observations financières : ${a.points[0].date} → ${a.points.at(-1).date}`}{a.asOf ? ` · Photographie : ${a.asOf}` : ''}{a.fxConverted ? ' · Conversion BCE aux deux bornes historiques' : ''}<br /><Link to={`/bibliotheque-donnees?q=${encodeURIComponent(a.isin ?? a.label)}`}>Consulter les données et leurs sources</Link>{a.sourceUrls?.[0] && <> · <a href={a.sourceUrls[0]} target="_blank" rel="noreferrer">Source de cet historique</a></>}</p>)}
        </details>
      </section>
      <section className="tool-preview rk-preview">
        {result ? <>
          <h2>{title || 'Classement'}</h2>
          {presentation === 'annual' ? rankedColumns.length > 0 && <div className="rk-table-scroll"><table className="rk-table rk-annual-table"><caption>Classement annuel · {coverage.currency} · valeurs affichées arrondies, rangs calculés avant arrondi</caption><thead><tr><th scope="col">Rang</th>{rankedColumns.map(c => <th scope="col" key={c.label}>{c.label}</th>)}</tr></thead><tbody>{assets.map((_, index) => <tr key={index}><th scope="row">{index + 1}</th>{rankedColumns.map(c => {
            const row = c.rows[index]
            return <td key={c.label} data-asset={row.id} data-rank={row.rank} style={{ background: row.color, color: contrastText(row.color), '--rk-color': row.color }}><strong>{row.label}</strong><span>{annualImagePercent(row.value)}</span>{row.tied && <small>{row.rank} ex æquo</small>}</td>
          })}</tr>)}</tbody></table></div> : <div className="rk-table-scroll"><table className="rk-table"><caption>Performances par année · {coverage.currency} · 🏆 Meilleure performance</caption><thead><tr><th scope="col">Actif</th>{imageColumns.map(c => <th key={c.label} scope="col" title={c.detail}>{c.label}{c.partial ? '*' : ''}</th>)}</tr></thead><tbody>{assets.map((asset, i) => <tr key={asset.id}><th scope="row">{asset.shortLabel}</th>{imageColumns.map(c => { const r = c.rows.find(r => r.id === asset.id); return <td key={c.label} style={{ '--rk-color': COLORS[i] }} className={`${r.rank === 1 ? 'rk-winner ' : ''}${r.value < 0 ? 'rk-negative' : 'rk-positive'}`}><span>{r.rank === 1 && <span aria-label="Meilleure performance">🏆 </span>}{formatPercent(r.value)}</span></td> })}</tr>)}</tbody></table></div>}
          {imageColumns.filter(c => c.partial).map(c => <p className="rk-note" key={c.label}>* {c.label} : clôtures {c.detail} (période partielle).</p>)}
          <label className="rk-field">Texte à publier<textarea aria-label="Texte à publier" rows={16} value={text} onChange={e => setDraft({ owner: generatedText, value: e.target.value })} /></label>
          <button type="button" className="rk-text-button" onClick={() => setDraft(null)}>Rétablir le texte généré</button>
        </> : <p>Complète la sélection et choisis une période couverte pour préparer le classement.</p>}
      </section>
    </ToolWorkspace>
  </div>
}

