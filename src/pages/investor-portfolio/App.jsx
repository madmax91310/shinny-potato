import { MODEL_INVESTORS, investorModel, modelNatureLabel } from '../../data/investor-models.js'
import History from './History.jsx'
import { notifyPublication, copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useEffect, useState, useRef, useCallback } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { ATTRIBUTION, buildTweet, dateFR, holdingName, INVESTORS, loadPortfolio, percentage } from './data.js'
import { investorPortrait } from './portrait.js'
import { INVESTOR_PROFILES, investorIntroduction as profileIntroduction } from '../../data/investor-profiles.js'
import { zipStore, dataURLBytes } from '../../lib/zip-store.js'
import { publicationPlan, cash, reportedAmount } from './publication.js'
import { detailedExport, detailedCSV, renderDetailedPages } from './exports.js'
import './style.css'

// Load the Canvas renderer when the user opens or downloads the image.
const renderPortfolioImage = async portfolio => (await import('./image.js')).renderPortfolioImage(portfolio)
const investorIntroduction = slug => investorModel(slug)?.intro ?? profileIntroduction(slug)

export default function InvestorPortfolio() {
  const retained = useRef(new Map())
  const [retry, setRetry] = useState(0)
  const [slug, setSlug] = useState('tepper')
  const [portfolio, setPortfolio] = useState(null)
  const [intro, setIntro] = useState(() => investorIntroduction('tepper'))
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setPortfolio(retained.current.get(slug) || null); setIntro(investorIntroduction(slug)); setDraft(retained.current.has(slug) ? buildTweet(retained.current.get(slug)) : ''); setLoading(true); setError(''); setCopied(false)
    loadPortfolio(slug, controller.signal).then((next) => {
      if (controller.signal.aborted) return
      if (next.problem && retained.current.get(slug) && !retained.current.get(slug).problem) throw new Error(`Dernière version valide conservée : ${next.problem}`)
      retained.current.set(slug,next)
      setPortfolio(next)
      setIntro(investorIntroduction(next.identity.slug))
      setDraft(buildTweet(next))
    }).catch((problem) => {
      if (problem.name !== 'AbortError') setError(problem.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug, retry])

  const model = investorModel(slug)
  const ready = portfolio && !portfolio.problem
  const shown = portfolio && !model && ready ? publicationPlan(portfolio).entries : portfolio?.holdings || []
  const renderImage = useCallback(() => renderPortfolioImage(portfolio), [portfolio])
  const sources = INVESTOR_PROFILES[slug]?.sourceUrls ?? model?.sourceUrls ?? []

  function updateIntro(value) {
    setIntro(value)
    setCopied(false)
    if (portfolio) setDraft(buildTweet(portfolio, value))
  }

  async function copy() {
    try {
      await copyPublicationText(draft)
      setCopied(true)
    } catch { setCopied(false); setError('Copie impossible : sélectionne le texte ci-dessous.') }
  }

  function save(content, type, suffix) {
    const url=URL.createObjectURL(new Blob([content],{type})), link=document.createElement('a')
    link.href=url;link.download=`portefeuille-${slug}-${portfolio.snapshot.periodEnd}.${suffix}`
    startPublicationDownload(link);setTimeout(()=>URL.revokeObjectURL(url),30000)
  }
  async function downloadDetails() {
    setExporting(true);setError('')
    try {
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
      const link = document.createElement('a')
      link.href = await renderPortfolioImage(portfolio)
      link.download = `portefeuille-${slug}-${model ? "allocation-modele" : portfolio.snapshot.periodEnd}.png`
      startPublicationDownload(link)
    } catch (problem) { setError(problem.message); notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
    finally { setExporting(false) }
  }

  return <div className="ip-scope">
    <PageHeader title="Portefeuille d’investisseur" subtitle="Déclarations 13F et allocations modèles publiées, avec texte modifiable et visuel assorti." />
    {error && <p role="alert" className="ip-error">{error} <Button type="button" onClick={() => setRetry(value => value+1)}>Réessayer le chargement</Button>{ready && <Button type="button" onClick={download} disabled={exporting}>Réessayer le PNG</Button>}</p>}
    <ToolWorkspace renderImage={renderImage} imageFilename={`portefeuille-${slug}-${portfolio?.snapshot.periodEnd || "modele"}.png`} imageDisabled={!ready} imageAlt={`Portefeuille ${portfolio?.identity.displayName ?? "investisseur"}`}>
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
          {model ? <><span>{modelNatureLabel(model)} · {model.publication}</span><span>{model.scope}</span><span>Source contrôlée le {dateFR(model.checkedAt)} · {model.locator}</span></> : <span>Positions au {dateFR(portfolio.snapshot.periodEnd)}{portfolio.snapshot.filedAt && ` · déposées le ${dateFR(portfolio.snapshot.filedAt)}`}</span>}
          <span>{portfolio.holdings.length} {model ? 'classes d’actifs · poids cibles' : 'positions accessibles · hors options'}</span>
          {!model && <><span role="status">{portfolio.problem ? `Données incomplètes : ${portfolio.problem}` : 'Données prêtes · montants et total cohérents'}</span>
          {portfolio.lastError && <span role="alert">Dernière actualisation en échec : {portfolio.lastError}. Dernier relevé conservé.</span>}
          <span>Dernière vérification : {portfolio.lastSuccessfulPollAt || portfolio.fetchedAt || 'inconnue'}</span>
          {!portfolio.snapshot.filedAt && <span>Date de publication non transmise par la source.</span>}
          {portfolio.snapshot.reconciliationDifference !== undefined && portfolio.snapshot.reconciliationDifference !== 0 && <span>Écart d’arrondi de la déclaration : {portfolio.snapshot.reconciliationDifference} USD. Les poids utilisent la somme des lignes.</span>}
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
            <textarea id="ip-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows="16" />
          </div>
        </div>
        <WorkspaceActions>
          <Button type="button" onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le tweet'}</Button>
          <Button type="button" variant="secondary" onClick={download} disabled={exporting || !ready}>{exporting ? 'Création du PNG…' : '⬇️ Télécharger le PNG'}</Button>
        </WorkspaceActions>
        {!model && <>
        <WorkspaceActions>
          <Button type="button" variant="secondary" onClick={() => save(JSON.stringify(detailedExport(portfolio),null,2),'application/json','json')}>Télécharger le détail JSON et les crédits</Button>
          <Button type="button" variant="secondary" onClick={() => save(detailedCSV(portfolio),'text/csv;charset=utf-8','csv')}>Télécharger toutes les positions CSV</Button>
          <Button type="button" variant="secondary" onClick={downloadDetails} disabled={exporting}>Télécharger les PNG détaillés (ZIP)</Button>
        </WorkspaceActions>
        <details><summary>Détail intégral · {portfolio.holdings.length} positions</summary>{portfolio.holdings.map((row,i)=><p key={i}>{row.issuerName} · {row.ticker} · {row.shareClass || 'classe non transmise'} · {row.cusip || row.securityId || 'identifiant non transmis'} · {Number.isFinite(row.value)?reportedAmount(row):'montant indisponible'} · {percentage(row.weight)}</p>)}</details>
        {portfolio.snapshot.holdings.some(row=>row.putCall) && <details><summary>Options déclarées · hors image et total</summary><p>Poids sur le total déclaré, options incluses. Les valeurs déclarées ne mesurent pas les primes ni l’exposition nette.</p>{portfolio.snapshot.holdings.filter(row=>row.putCall).map((row,i)=><p key={i}>{row.issuerName} · {row.putCall} · {row.shareClass} · {row.cusip || 'identifiant non transmis'} · {Number.isFinite(row.value)?reportedAmount(row):'montant indisponible'} · {percentage(row.weight)}</p>)}</details>}
        <p className="ip-note">Les lignes et classes transmises restent distinctes. Certains fournisseurs regroupent déjà des classes en amont ; ce manque de détail est conservé dans les exports. Les poids du visuel portent sur la somme des positions hors options, calculée sans arrondi.</p>
        <p className="ip-note">Le visuel reprend les chiffres chargés et peut différer si tu modifies manuellement le tweet. Les déclarations 13F paraissent après la fin du trimestre et ne montrent pas toutes les positions du gestionnaire.</p>
        <p className="ip-note">Portrait de référence : {investorPortrait(portfolio.identity.slug).person} : <a href={investorPortrait(portfolio.identity.slug).source} target="_blank" rel="noreferrer">{investorPortrait(portfolio.identity.slug).author} ↗</a> · {investorPortrait(portfolio.identity.slug).license} · Affichage par initiales si la réutilisation, l’identité ou le détourage ne sont pas établis.</p>
        <History portfolio={portfolio} /></>}
        {model && <><p className="ip-note">{model.method}</p><p className="ip-note">{model.caution}</p><p className="ip-note">Cibles théoriques, sans performance ni conversion en produits UCITS. Le visuel utilise les poids du modèle ; une modification manuelle du texte ne modifie pas ces cibles.</p></>}
        <p className="ip-credit">{model ? "Source : publication de la méthode" : portfolio.identity.dataProvider === 'FolioFact' ? 'Données : FolioFact · déclarations SEC 13F' : portfolio.identity.dataProvider === 'SEC' ? 'Données : SEC EDGAR' : ATTRIBUTION} · <a href={portfolio.sourceUrl} target="_blank" rel="noreferrer">Voir {model ? 'la publication' : portfolio.identity.dataProvider === 'FolioFact' ? 'FolioFact' : portfolio.identity.dataProvider === 'SEC' ? 'la déclaration' : 'Tracefour'} ↗</a></p>
      </>}
      {!portfolio && <p role="status">{loading ? 'Chargement du portefeuille…' : 'Choisis un investisseur dans les réglages.'}</p>}
    </section>
    </ToolWorkspace>
  </div>
}
