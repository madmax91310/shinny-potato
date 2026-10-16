import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace.jsx'
import AssetPicker from '../../design-system/AssetPicker.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { copyPublicationText, notifyPublication, startPublicationDownload } from '../../design-system/publicationActions.js'
import { ALL_CATEGORIES, ANNUAL_ASSETS, COLORS, RANKING_ASSETS } from './data.js'
import FX from '../../data/monthly-fx.json' with { type: 'json' }
import { convertAsset, buildPortfolio } from './series.js'
import PortfolioEditor from './PortfolioEditor.jsx'
import { DEFAULT_PORTFOLIOS } from './portfolio-defaults.js'
import { basisLabel, buildRanking, buildTweet, commonCoverage, formatPercent, rollingRegularity } from './engine.js'
import './rankings.css'

const CATEGORY = ALL_CATEGORIES.find(c => c.id === 'world')
const SOURCES = { ...RANKING_ASSETS, ...ANNUAL_ASSETS }
const ELIGIBLE = Object.values(RANKING_ASSETS).filter(a => !['monthly-average', 'price-index', 'futures-price'].includes(a.basis))
function defaultDates(assets) {
  const c = commonCoverage(assets)
  return { start: c.start, end: c.end, startYear: c.years.at(-6) ?? c.years[0], endYear: c.years.at(-1) }
}

export default function App() {
  const [categoryId, setCategoryId] = useState(CATEGORY.id)
  const [ids, setIds] = useState(CATEGORY.ids)
  const [mode, setMode] = useState('years')
  const [dates, setDates] = useState(() => defaultDates(CATEGORY.ids.map(id => SOURCES[id])))
  const [annualized, setAnnualized] = useState(false)
  const [title, setTitle] = useState(CATEGORY.label)
  const [showRegularity, setShowRegularity] = useState(false)
  const [months, setMonths] = useState(60)
  const [slot, setSlot] = useState(0)
  const [manual, setManual] = useState(false)
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
      return { assets }
    } catch (e) { return { assets: [], error: e.message } }
  }, [ids, currency, comparison, portfolios])
  const assets = prepared.assets
  const computed = useMemo(() => {
    try {
      if (prepared.error) throw new Error(prepared.error)
      const coverage = commonCoverage(assets)
      const result = buildRanking(assets, { ...dates, mode, annualized })
      const regularity = showRegularity ? rollingRegularity(assets, months) : null
      return { coverage, result, regularity }
    } catch (error) {
      let coverage = null
      try { coverage = commonCoverage(assets) } catch { /* A new selection may still have fewer than two assets. */ }
      return { error: error.message, coverage }
    }
  }, [assets, prepared.error, dates, mode, annualized, showRegularity, months])
  const { coverage, result, regularity, error } = computed
  const generatedText = result ? buildTweet(result, title, regularity) : ''
  // Keep a manual draft only for its exact calculation snapshot.
  const text = draft?.owner === generatedText ? draft.value : generatedText
  const renderImage = useCallback(async () => {
    if (!result) throw new Error('Choisis une période valide.')
    return (await import('./image.js')).renderRankingImage(result, title, regularity)
  }, [result, title, regularity])

  function applyIds(next, nextCurrency = currency) {
    setIds(next); setStatus('')
    if (next.length >= 2) {
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
    setCategoryId(id); applyIds(c.ids, nextCurrency); setTitle(c.label); setSlot(0); setManual(false)
    if (c.frequency === 'annual') setMode('years')
  }
  const otherIds = ids.filter((_, i) => i !== slot)
  const reference = SOURCES[otherIds[0]]
  const universe = bank === 'annual' ? Object.values(ANNUAL_ASSETS) : ELIGIBLE
  const options = universe.filter(a => !otherIds.includes(a.id) && (!reference || (bank !== 'annual' || a.basis === reference.basis)) && (currency !== 'original' || !reference || a.currency === reference.currency))
    .map(a => ({ ...a, label: a.shortLabel, name: a.label, detail: `${a.label} · ${a.currency} · ${a.frequency === 'annual' ? 'Calendrier NAV / indice officiel' : a.points[0].date + ' → ' + a.points.at(-1).date}`, badges: [a.instrumentType ?? (a.isin ? 'ETF' : a.priceUnit === 'points' ? 'Indice' : a.priceMethod === 'adjusted' ? 'Action' : 'Actif')] }))
  async function download() {
    setBusy(true); setStatus('')
    try {
      const canvas = await renderImage()
      const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = `classement-${categoryId}-${result.end}.png`
      document.body.append(link); startPublicationDownload(link); link.remove(); setStatus('Téléchargement lancé.')
    } catch (e) { setStatus(e.message); notifyPublication(e.message, 'error') }
    finally { setBusy(false) }
  }
  async function copy() { try { await copyPublicationText(text); setStatus('Texte copié.') } catch (e) { setStatus(e.message) } }
  function dateField(name, value) { setDates(d => ({ ...d, [name]: value })); setStatus('') }
  return <div className="rankings-tool">
    <PageHeader title="Qui a vraiment gagné ?" subtitle="Classe des actifs par année ou sur une période commune. Les calculs utilisent les clôtures mensuelles partagées, sans interpolation. Les choix suivent la profondeur réelle des historiques." />
    <ToolWorkspace renderImage={renderImage} imageDisabled={!result} imageAlt={`Classement : ${title}`} actions={<>
      <button type="button" onClick={copy} disabled={!result}>Copier le texte</button>
      <button type="button" onClick={download} disabled={!result || busy}>{busy ? 'Préparation…' : 'Télécharger l’image'}</button>
      <span role="status">{status}</span>
    </>}>
      <section className="tool-settings rk-settings" aria-label="Réglages du classement">
        <div className="rk-intro"><span>LES MARCHÉS EN PERSPECTIVE</span><h2>Un classement.<br />Plusieurs façons de le lire.</h2><p>Choisis un univers, puis la période qui t’intéresse.</p></div>
        <label className="rk-field">Catégorie<ChoicePicker aria-label="Catégorie" value={categoryId} onChange={e => chooseCategory(e.target.value)}>{ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</ChoicePicker></label>
        <fieldset className="rk-modes"><legend>Comparer</legend>{[['assets', 'Actifs'], ['portfolios', 'Portefeuilles']].map(([value, label]) => <button type="button" key={value} aria-pressed={comparison === value} onClick={() => {
          setComparison(value)
          if (value === 'portfolios') {
            setCurrency('EUR'); setTitle('Comparaison de portefeuilles')
            try { setDates(defaultDates(portfolios.map(d => buildPortfolio(d, RANKING_ASSETS, 'EUR', FX)))) } catch { /* Shown below. */ }
          } else {
            setTitle(ALL_CATEGORIES.find(c => c.id === categoryId)?.label ?? 'Ma sélection')
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
        <div className="rk-selected" aria-label="Actifs sélectionnés">{assets.map((a, i) => <div key={a.id} style={{ '--rk-color': COLORS[i] }}>
          <span className="rk-dot" /><span><strong>{a.shortLabel}</strong><small>{a.currency} · {a.isin ? a.instrumentType ?? 'ETF' : a.priceUnit === 'points' ? 'Indice' : a.priceMethod === 'adjusted' ? 'Action' : 'Actif'}</small></span>
          {manual && <><button type="button" aria-label={`Modifier ${a.shortLabel}`} onClick={() => setSlot(i)}>Modifier</button><button type="button" aria-label={`Retirer ${a.shortLabel}`} onClick={() => { applyIds(ids.filter((_, j) => i !== j)); setSlot(0) }}>×</button></>}
        </div>)}</div>
        <button type="button" className="rk-text-button" aria-expanded={manual} onClick={() => setManual(!manual)}>{manual ? 'Fermer la sélection manuelle' : 'Personnaliser les actifs'}</button>
        {manual && <div className="rk-manual">
          <label className="rk-field">Historique disponible<ChoicePicker aria-label="Historique disponible" value={bank} onChange={e => { setBank(e.target.value); applyIds([]); setSlot(0); setMode('years') }}><option value="monthly">Cotations mensuelles</option><option value="annual">Calendriers annuels officiels</option></ChoicePicker></label>
          <div className="rk-inline"><button type="button" onClick={() => { applyIds([]); setSlot(0); setTitle('Ma sélection') }}>Nouvelle sélection</button><button type="button" disabled={ids.length >= 6} onClick={() => setSlot(ids.length)}>Ajouter un actif</button></div>
          <p>{slot >= ids.length ? 'Ajouter un actif' : `Remplacer l’actif ${slot + 1}`} · de 2 à 6 actifs</p>
          <AssetPicker label="Actif du classement" items={options} value={ids[slot] ?? ''} hideIdleResults clearSearchOnSelect onChange={id => {
            const next = [...ids]; next[Math.min(slot, ids.length)] = id; applyIds(next); setSlot(Math.min(next.length, 5)); setTitle('Ma sélection')
          }} />
          <p className="rk-note">Les indices nets et bruts restent distincts. Choisis EUR ou USD pour comparer des devises différentes. Les calendriers annuels sont séparés des cotations mensuelles. « Nouvelle sélection » permet de repartir sur une autre base.</p>
        </div>}
        </>}
        <fieldset className="rk-modes"><legend>Temporalité</legend>{[['year', 'Une année'], ['years', 'Année par année'], ['period', 'Période libre']].map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}</fieldset>
        {mode === 'period' ? <>
          <div className="rk-date-fields"><label>Début, fin de mois<input type="month" min={coverage?.start} max={coverage?.end} value={dates.start} onChange={e => dateField('start', e.target.value)} /></label><label>Fin, fin de mois<input type="month" min={coverage?.start} max={coverage?.end} value={dates.end} onChange={e => dateField('end', e.target.value)} /></label></div>
          <label className="rk-check"><input type="checkbox" checked={annualized} onChange={e => setAnnualized(e.target.checked)} /> Afficher la performance annualisée</label>
        </> : <div className="rk-date-fields">
          <label>{mode === 'year' ? 'Année' : 'Première année'}<ChoicePicker aria-label={mode === 'year' ? 'Année' : 'Première année'} value={dates.startYear ?? ''} onChange={e => dateField('startYear', Number(e.target.value))}>{coverage?.years.map(y => <option key={y} value={y}>{y}</option>)}</ChoicePicker></label>
          {mode === 'years' && <label>Dernière année<ChoicePicker aria-label="Dernière année" value={dates.endYear ?? ''} onChange={e => dateField('endYear', Number(e.target.value))}>{coverage?.years.map(y => <option key={y} value={y}>{y}</option>)}</ChoicePicker></label>}
        </div>}
        {coverage && <p className="rk-coverage"><strong>{coverage.currency} · {basisLabel(coverage.basis)}</strong><br />Historique commun : {coverage.start} → {coverage.end}{coverage.years.length ? ` · ${coverage.years.length} années civiles complètes` : ' · aucune année civile complète'}</p>}
        {error && <p className="rk-error" role="alert">{error}</p>}
        <label className="rk-field">Titre de l’image<input maxLength={85} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <details className="rk-regularity"><summary>Ajouter la régularité historique</summary>
          <label className="rk-check"><input type="checkbox" checked={showRegularity} onChange={e => setShowRegularity(e.target.checked)} /> Montrer la fréquence de première place</label>
          <label className="rk-field">Durée de chaque période<ChoicePicker aria-label="Durée de chaque période" value={months} onChange={e => setMonths(Number(e.target.value))}>{[12, 36, 60, 120].map(m => <option key={m} value={m}>{m / 12} an{m > 12 ? 's' : ''}</option>)}</ChoicePicker></label>
          {showRegularity && (regularity ? <p>{regularity.count} périodes mensuelles de départ, sur tout l’historique commun {regularity.start} → {regularity.end}.</p> : <p role="status">{coverage?.frequency === 'annual' ? 'Les périodes glissantes mensuelles exigent une série mensuelle.' : 'Recul insuffisant pour calculer au moins deux périodes.'} Cette mesure sera absente de l’export.</p>)}
          <p className="rk-note">Les périodes se chevauchent. Les victoires sont partagées en cas d’égalité. Ces fréquences historiques ne sont pas des probabilités futures.</p>
        </details>
        <details className="rk-method"><summary>Supports et méthode</summary><p>Les indices, les ETF et les actions conservent leur identité. Les ETF sont comparés via leurs cotations exactes, frais du fonds inclus et revenus réinvestis. Les cotations mensuelles désignent des clôtures de fin de mois. Les indices officiels historiques peuvent contenir des périodes rétropolées avant leur lancement, distinctes d’un rendement de fonds réel. Une année civile va de décembre précédent à décembre de l’année choisie. Aucune année partielle n’est présentée comme complète.</p>
          <p>La devise d’origine ou une conversion BCE peut être choisie. La conversion ne constitue pas une couverture de change. Les calendriers annuels utilisent les rendements NAV officiels ; aucune valeur mensuelle n’en est déduite. Hors frais du courtier et fiscalité. Les portefeuilles LifeStrategy sont les ETF réels.</p>
          {assets.map(a => <p key={a.id}><strong>{a.shortLabel}</strong> — {a.label}{a.isin ? ` · ${a.isin}` : ''}{a.ticker ? ` · ${a.ticker}` : ''} · {a.currency}<br /><Link to={`/bibliotheque-donnees?q=${encodeURIComponent(a.isin ?? a.label)}`}>Consulter les données et leurs sources</Link></p>)}
        </details>
      </section>
      <section className="tool-preview rk-preview">
        {result ? <>
          <h2>{title || 'Classement'}</h2>
          <div className="rk-table-scroll"><table className="rk-table"><caption>{mode === 'period' ? `${result.start} → ${result.end}` : 'Classement par année civile'} · {coverage.currency}</caption><thead><tr><th scope="col">Rang</th>{result.columns.map(c => <th key={c.label} scope="col">{c.label}</th>)}</tr></thead><tbody>{assets.map((_, i) => <tr key={i}><th scope="row">{i + 1}</th>{result.columns.map(c => { const r = c.rows[i]; return <td key={c.label} style={{ '--rk-color': COLORS[r.order] }}><strong>{r.label}</strong><span>{formatPercent(r.value)}</span>{r.rank !== i + 1 && <small>ex æquo, rang {r.rank}</small>}</td> })}</tr>)}</tbody></table></div>
          <label className="rk-field">Texte à publier<textarea aria-label="Texte à publier" rows={16} value={text} onChange={e => setDraft({ owner: generatedText, value: e.target.value })} /></label>
          <button type="button" className="rk-text-button" onClick={() => setDraft(null)}>Rétablir le texte généré</button>
        </> : <p>Complète la sélection et choisis une période couverte pour préparer le classement.</p>}
      </section>
    </ToolWorkspace>
  </div>
}
