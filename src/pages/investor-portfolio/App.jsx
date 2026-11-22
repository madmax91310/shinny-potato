import { MODEL_INVESTORS, investorModel, modelNatureLabel } from '../../data/investor-models.js'
const PortfolioDetails=lazy(()=>import('./PortfolioDetails.jsx'))
import { notifyPublication, copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import { downloadImage } from '../../design-system/downloadImage.js'
import { cachedImageRenderer } from './image-export.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { lazy, Suspense, useEffect, useState, useRef, useMemo } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { ATTRIBUTION, buildTweet, dateFR, holdingName, INVESTORS, loadPortfolio, percentage } from './data.js'
import { portraitCredits } from './media.js'
import { INVESTOR_PROFILES, investorIntroduction as profileIntroduction } from '../../data/investor-profiles.js'
import { publicationPlan, portfolioOwner, cash, reportedAmount } from './publication.js'
import { draftBasis, editorialCopy, quarterLabel } from './editorial.js'
import { readPreference, writePreference } from '../../lib/publication-preferences.js'
import './style.css'

// Load the Canvas renderer when the user opens or downloads the image.
const renderPortfolioImage = async portfolio => (await import('./image.js')).renderPortfolioImage(portfolio)
const investorIntroduction = slug => investorModel(slug)?.intro ?? profileIntroduction(slug)
const draftKey = slug => `investor-draft:${slug}`
const validDraft = value => typeof value?.text === 'string' && typeof value.basis === 'string'
const introKey = slug => `investor-intro:${slug}`
const stringValue = value => typeof value === 'string'
const timestampFR = value => {
  const date = new Date(value || NaN)
  return Number.isNaN(date.valueOf()) ? 'inconnue' : `${date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })} UTC`
}

export default function InvestorPortfolio() {
  const retained = useRef(new Map())
  const [retry, setRetry] = useState(0)
  const [slug, setSlug] = useState('tepper')
  const [portfolio, setPortfolio] = useState(null)
  const [intro, setIntro] = useState(() => investorIntroduction('tepper'))
  const [modelDraft, setModelDraft] = useState('')
  const [drafts, setDrafts] = useState({})
  const [tweetLength, setTweetLength] = useState(null)
  const [limitInput, setLimitInput] = useState('')
  const [storageFailed, setStorageFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const previous = retained.current.get(slug)
    setPortfolio(previous || null)
    setIntro(investorModel(slug) ? investorIntroduction(slug) : readPreference(introKey(slug), investorIntroduction(slug), stringValue))
    setModelDraft(previous?.kind === 'model' ? buildTweet(previous) : '')
    setDrafts(values => Object.hasOwn(values, slug) ? values : { ...values, [slug]: readPreference(draftKey(slug), null, validDraft) })
    setLoading(true); setError(''); setCopied(false)
    loadPortfolio(slug, controller.signal).then((next) => {
      if (controller.signal.aborted) return
      if (next.problem && retained.current.get(slug) && !retained.current.get(slug).problem) throw new Error(`Dernière version valide conservée : ${next.problem}`)
      retained.current.set(slug,next)
      setPortfolio(next)
      if (next.kind === 'model') setModelDraft(buildTweet(next))
    }).catch((problem) => {
      if (problem.name !== 'AbortError') setError(problem.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug, retry])

  const model = investorModel(slug)
  useEffect(() => {
    if (model || tweetLength) return
    let active = true
    import('twitter-text/dist/parseTweet.js').then(({ default: parseTweet }) => {
      if (active) setTweetLength(() => text => parseTweet(text).weightedLength)
    }).catch(() => { if (active) setTweetLength(() => text => [...text].length) })
    return () => { active = false }
  }, [model, tweetLength])
  const portrait=portfolio && !model ? portraitCredits(portfolio) : null
  const ready = portfolio && portfolio.identity.slug === slug && !portfolio.problem
  const review = useMemo(() => portfolio?.identity.slug === slug && !model ? editorialCopy(portfolio) : null, [portfolio, model, slug])
  const basis = useMemo(() => !model ? draftBasis(portfolio) : null, [portfolio, model])
  const saved = drafts[slug]
  const draft = model ? modelDraft : saved?.text ?? (portfolio ? buildTweet(portfolio) : '')
  const limit = Number(limitInput) || 280
  const count = tweetLength?.(draft) ?? 0
  const needsReview = ready && !model && (saved ? saved.basis !== basis : review.status === 'review')
  const canCopy = ready && Boolean(draft.trim()) && !needsReview
  const plan = ready && !model ? publicationPlan(portfolio) : null
  const shown = plan?.entries || portfolio?.holdings || []
  const imageFilename = `portefeuille-${slug}-${model ? 'allocation-modele' : portfolio?.snapshot.periodEnd || 'releve'}.png`
  const renderImage = useMemo(() => cachedImageRenderer(() => renderPortfolioImage(portfolio)), [portfolio])
  const sources = INVESTOR_PROFILES[slug]?.sourceUrls ?? model?.sourceUrls ?? []

  function updateIntro(value) {
    setIntro(value)
    setCopied(false)
    if (model && portfolio) setModelDraft(buildTweet(portfolio, value))
    else if (!writePreference(introKey(slug), value, stringValue)) setStorageFailed(true)
  }

  function saveDraft(text, reviewedBasis = saved?.basis ?? (needsReview ? 'pending' : basis)) {
    setCopied(false)
    if (model) return setModelDraft(text)
    const record = { text, basis: reviewedBasis }
    setDrafts(values => ({ ...values, [slug]: record }))
    setStorageFailed(!writePreference(draftKey(slug), record, validDraft))
  }

  async function copy(text) {
    try {
      await copyPublicationText(text)
      setCopied(text === draft)
      if (text !== draft) notifyPublication('Version courte copiée.')
    } catch { setCopied(false); setError('Copie impossible : sélectionne le texte ci-dessous.') }
  }

  function save(content, type, suffix) {
    const url=URL.createObjectURL(new Blob([content],{type})), link=document.createElement('a')
    link.href=url;link.download=`portefeuille-${slug}-${portfolio.snapshot.periodEnd}.${suffix}`
    startPublicationDownload(link);setTimeout(()=>URL.revokeObjectURL(url),30000)
  }
  async function downloadData(format) {
    setError('')
    try {
      const {detailedExport,detailedCSV}=await import('./exports.js')
      save(format==='json'?JSON.stringify(detailedExport(portfolio),null,2):detailedCSV(portfolio),format==='json'?'application/json':'text/csv;charset=utf-8',format)
    } catch(problem) {setError(problem.message)}
  }
  async function downloadDetails() {
    setExporting(true);setError('')
    try {
      const [{detailedExport,detailedCSV,renderDetailedPages},{zipStore,dataURLBytes}]=await Promise.all([import('./exports.js'),import('../../lib/zip-store.js')])
      const pages=await renderDetailedPages(portfolio)
      const files=pages.map((png,i)=>({name:`detail-${i+1}.png`,bytes:dataURLBytes(png)}))
      const encode=value=>new TextEncoder().encode(value)
      files.push({name:'positions.json',bytes:encode(JSON.stringify(detailedExport(portfolio),null,2))},{name:'positions.csv',bytes:encode(detailedCSV(portfolio))})
      save(zipStore(files),'application/zip','zip')
    } catch(problem) { setError(problem.message) } finally { setExporting(false) }
  }
  async function download() {
    setExporting(true); setError('')
    try {
      const image = await renderImage()
      downloadImage(image, imageFilename)
    } catch (problem) { setError(problem.message); notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
    finally { setExporting(false) }
  }

  return <div className="ip-scope">
    <PageHeader title="Portefeuille d’investisseur" subtitle="Déclarations 13F et allocations modèles publiées, avec texte modifiable et visuel assorti." />
    {error && <p role="alert" className="ip-error">{error} <Button type="button" onClick={() => setRetry(value => value+1)}>Réessayer le chargement</Button>{ready && <Button type="button" onClick={download} disabled={exporting}>Réessayer le PNG</Button>}</p>}
    <ToolWorkspace renderImage={renderImage} imageFilename={imageFilename} imageDisabled={!ready} imageAlt={`Portefeuille ${portfolio ? portfolioOwner(portfolio) : "investisseur"}`}>
    <section className="ip-panel tool-settings">
      <label htmlFor="ip-investor">Choisir un investisseur</label>
      <ChoicePicker id="ip-investor" value={slug} onChange={(event) => setSlug(event.target.value)}>
        <optgroup label="Déclarations de sociétés ou de fonds · 13F">{INVESTORS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</optgroup>
        <optgroup label="Méthodes · allocations modèles et adaptations">{MODEL_INVESTORS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</optgroup>
      </ChoicePicker>
      <p className="ip-bio">{intro.trim() || investorIntroduction(slug)}</p>
      {loading && <p role="status">Chargement du portefeuille…</p>}

    </section>
    <section className="ip-panel tool-preview">
      {portfolio && <>
        <div className="ip-meta">
          <strong>{portfolio.identity.displayName} · {portfolio.identity.entityName}</strong>
          {model ? <><span>{modelNatureLabel(model)} · {model.publication}</span><span>{model.scope}</span><span>Source contrôlée le {dateFR(model.checkedAt)} · {model.locator}</span></> : <span>{ready ? 'Positions' : 'Période du relevé incomplet'} · {quarterLabel(portfolio.snapshot.periodEnd)} · {dateFR(portfolio.snapshot.periodEnd)}{portfolio.snapshot.filedAt && ` · déposées le ${dateFR(portfolio.snapshot.filedAt)}`}</span>}
          <span>{portfolio.holdings.length} {model ? 'classes d’actifs · poids cibles' : 'positions accessibles · hors options'}</span>
          {!model && <><span role="status">{portfolio.problem ? `Données incomplètes : ${portfolio.problem}` : 'Données prêtes · montants et total cohérents'}</span>
          {portfolio.snapshot.reconciliationWarning && <span role="status">{portfolio.snapshot.reconciliationWarning}</span>}
          {portfolio.lastError && <span role="alert">Dernière actualisation en échec : {portfolio.lastError}. Dernier relevé conservé.</span>}
          <span>{ready ? `Relevé SEC vérifié le ${timestampFR(portfolio.positionsCollectedAt || portfolio.fetchedAt)}` : 'Aucun relevé SEC qualifié.'}</span>
          <span>Dernière tentative de collecte le {timestampFR(portfolio.lastAttemptAt)}</span>
          {!portfolio.snapshot.filedAt && <span>Date de publication non transmise par la source.</span>}
          {portfolio.snapshot.reconciliationDifference !== undefined && portfolio.snapshot.reconciliationDifference !== 0 && <span>Écart d’arrondi de la déclaration : {portfolio.snapshot.reconciliationDifference} USD. Les poids utilisent la somme des lignes.</span>}
          {portfolioOwner(portfolio)!==portfolio.identity.displayName && <span>Lien de gestion non confirmé pour cette période : publication au nom de l’entité déclarante.</span>}
          {portfolio.identity.declaringCik && <span>Déclarant SEC : CIK {portfolio.identity.declaringCik}</span>}
          {portfolio.snapshot.securityIdentityNote && <span>{portfolio.snapshot.securityIdentityNote}</span>}
          {portfolio.total && <span>Valeur des positions déclarées hors options : {cash(portfolio.total, portfolio.snapshot.currency)}</span>}
          <Button type="button" variant="secondary" onClick={() => setRetry(value=>value+1)} disabled={loading}>Actualiser les données disponibles</Button></>}

        </div>
        <div className="ip-grid">
          <div className="ip-preview" aria-label={model ? "Répartition cible complète" : "Positions du visuel"}>
            {shown.map((row, i) => <div className="ip-row" key={`${row.ticker}-${i}`}>
              <span className="ip-dot" style={{ background: ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9'][i % 5] }} />
              <span>{row.label || row.displayLabel || holdingName(row)} <small>{row.ticker}{Number.isFinite(row.value) && ` · ${reportedAmount(row)}`}</small></span><strong>{percentage(row.weight)}</strong>
            </div>)}
          </div>
          <div className="ip-editor">
            <label htmlFor="ip-intro">Présentation de l’investisseur (modifiable)</label>
            <textarea id="ip-intro" value={intro} onChange={(event) => updateIntro(event.target.value)} rows="3" />
            <Button type="button" variant="secondary" onClick={() => { updateIntro(investorIntroduction(slug)); notifyPublication('Présentation d’origine rétablie.') }}>Rétablir la présentation</Button>
        <p className="ip-note">Source de la présentation proposée : {sources.map((url, i) => <span key={url}>{i > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer">{new URL(url).hostname} ↗</a></span>)}</p>
            <label htmlFor="ip-draft">Tweet modifiable</label>
            <textarea id="ip-draft" value={draft} onChange={(event) => saveDraft(event.target.value)} rows="16" readOnly={!model && !ready} />
            {needsReview && <div className="ip-note" role="status">
              <strong>À réviser</strong> · {saved ? 'Ton brouillon a été conservé.' : review.text ? `Le texte relu couvre ${quarterLabel(review.review.period)}.` : 'Aucun texte relu pour ce relevé.'}
              {review.facts && <p>Relevé disponible en {quarterLabel(review.facts.period)} · {cash(review.facts.total, 'USD')} hors options. Les trois premières lignes représentent {percentage(review.facts.topThree)}.
                {' '}{review.facts.leading.map(row => `${holdingName(row)} (${percentage(row.weight)})`).join(', ')}.</p>}
              <Button type="button" variant="secondary" disabled={!saved?.text.trim() || saved.text === review.text} onClick={() => saveDraft(draft, basis)}>Valider le texte pour ce relevé</Button>
            </div>}
            {storageFailed && <p className="ip-note" role="status">Le navigateur n’a pas enregistré cette modification.</p>}
            {!model && ready && tweetLength && <div className="ip-note">
              <label htmlFor="ip-x-limit">Limite de caractères de ton compte X</label>
              <input id="ip-x-limit" type="number" min="1" step="1" placeholder="280" value={limitInput}
                onChange={event => setLimitInput(event.target.value === '' || Number.isSafeInteger(event.target.valueAsNumber) && event.target.valueAsNumber > 0 ? event.target.value : limitInput)} />
              <p aria-live="polite">{count.toLocaleString('fr-FR')} / {limit.toLocaleString('fr-FR')}{count > limit && ' · Le texte développé dépasse cette limite.'}</p>
              {count > limit && review.status === 'reviewed' && !needsReview && <details>
                <summary>Voir la version courte ({tweetLength(review.short)} caractères)</summary>
                <p>{review.short}</p>
                {saved && <p>Cette version courte correspond au texte relu d’origine.</p>}
                {tweetLength(review.short) > limit && <p>La version courte dépasse aussi la limite saisie.</p>}
                <Button type="button" variant="secondary" onClick={() => copy(review.short)}>Copier la version courte</Button>
              </details>}
            </div>}
          </div>
        </div>
        <WorkspaceActions>
          <Button type="button" onClick={() => copy(draft)} disabled={!canCopy}>{copied ? '✅ Copié' : '📋 Copier le tweet'}</Button>
          <Button type="button" variant="secondary" onClick={download} disabled={exporting || !ready}>{exporting ? 'Création du PNG…' : '⬇️ Télécharger le PNG'}</Button>
        </WorkspaceActions>
        {!model && <>
        <WorkspaceActions>
          <Button type="button" variant="secondary" onClick={() => downloadData('json')}>Télécharger le détail JSON et les crédits</Button>
          <Button type="button" variant="secondary" onClick={() => downloadData('csv')}>Télécharger toutes les positions CSV</Button>
          <Button type="button" variant="secondary" onClick={downloadDetails} disabled={exporting}>Télécharger les PNG détaillés (ZIP)</Button>
        </WorkspaceActions>
        <Suspense fallback={<p>Chargement du détail…</p>}><PortfolioDetails {...{portfolio,portrait,plan}} /></Suspense></>}
        {model && <><p className="ip-note">{model.method}</p><p className="ip-note">{model.caution}</p><p className="ip-note">Cibles théoriques, sans performance ni conversion en produits UCITS. Le visuel utilise les poids du modèle ; une modification manuelle du texte ne modifie pas ces cibles.</p></>}
        <p className="ip-credit">{model ? "Source : publication de la méthode" : portfolio.identity.dataProvider === 'FolioFact' ? 'Données : FolioFact · déclarations SEC 13F' : portfolio.identity.dataProvider === 'SEC' ? 'Données : SEC EDGAR' : ATTRIBUTION} · <a href={portfolio.sourceUrl} target="_blank" rel="noreferrer">Voir {model ? 'la publication' : portfolio.identity.dataProvider === 'FolioFact' ? 'FolioFact' : portfolio.identity.dataProvider === 'SEC' ? 'la déclaration' : 'Tracefour'} ↗</a></p>
      </>}
      {!portfolio && <p role="status">{loading ? 'Chargement du portefeuille…' : 'Choisis un investisseur dans les réglages.'}</p>}
    </section>
    </ToolWorkspace>
  </div>
}
