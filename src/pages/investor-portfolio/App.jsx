import WorkspaceActions from '../../design-system/WorkspaceActions'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useEffect, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { ATTRIBUTION, buildTweet, dateFR, holdingName, INVESTORS, loadPortfolio, percentage } from './data.js'
import { renderPortfolioImage } from './image.js'
import { INVESTOR_PROFILES, investorIntroduction } from '../../data/investor-profiles.js'
import './style.css'

export default function InvestorPortfolio() {
  const [slug, setSlug] = useState('tepper')
  const [portfolio, setPortfolio] = useState(null)
  const [intro, setIntro] = useState(() => investorIntroduction('tepper'))
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setPortfolio(null); setIntro(investorIntroduction(slug)); setDraft(''); setLoading(true); setError(''); setCopied(false)
    loadPortfolio(slug, controller.signal).then((next) => {
      if (controller.signal.aborted) return
      setPortfolio(next)
      setIntro(investorIntroduction(next.identity.slug))
      setDraft(buildTweet(next))
    }).catch((problem) => {
      if (problem.name !== 'AbortError') setError(problem.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug])

  function updateIntro(value) {
    setIntro(value)
    setCopied(false)
    if (portfolio) setDraft(buildTweet(portfolio, value))
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
    } catch { setError('Copie impossible : sélectionne le texte ci-dessous.') }
  }

  function download() {
    try {
      const link = document.createElement('a')
      link.href = renderPortfolioImage(portfolio)
      link.download = `portefeuille-${slug}-${portfolio.snapshot.periodEnd}.png`
      link.click()
    } catch (problem) { setError(problem.message) }
  }

  return <div className="ip-scope">
    <PageHeader title="Portefeuille d’investisseur" subtitle="La dernière photographie 13F disponible, un tweet modifiable et un visuel assorti." />
    <ToolWorkspace renderImage={() => renderPortfolioImage(portfolio)} imageDisabled={!portfolio} imageAlt={`Portefeuille ${portfolio?.identity.displayName ?? "investisseur"}`}>
    <section className="ip-panel tool-settings">
      <label htmlFor="ip-investor">Choisir un investisseur</label>
      <select id="ip-investor" value={slug} onChange={(event) => setSlug(event.target.value)}>
        {INVESTORS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
      <p className="ip-bio">{intro.trim() || investorIntroduction(slug)}</p>
      {loading && <p role="status">Chargement des déclarations…</p>}
      {error && <p role="alert" className="ip-error">{error}</p>}
    </section>
    <section className="ip-panel tool-preview">
      {portfolio && <>
        <div className="ip-meta">
          <strong>{portfolio.identity.displayName} · {portfolio.identity.entityName}</strong>
          <span>Positions au {dateFR(portfolio.snapshot.periodEnd)}{portfolio.snapshot.filedAt && ` · déposées le ${dateFR(portfolio.snapshot.filedAt)}`}</span>
          <span>{portfolio.holdings.length} positions affichées · poids hors options</span>
        </div>
        <div className="ip-grid">
          <div className="ip-preview" aria-label="Répartition des cinq principales positions">
            {portfolio.holdings.slice(0, 5).map((row, i) => <div className="ip-row" key={`${row.ticker}-${i}`}>
              <span className="ip-dot" style={{ background: ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9'][i] }} />
              <span>{holdingName(row)} <small>{row.ticker}</small></span><strong>{percentage(row.weight)}</strong>
            </div>)}
          </div>
          <div className="ip-editor">
            <label htmlFor="ip-intro">Présentation de l’investisseur (modifiable)</label>
            <textarea id="ip-intro" value={intro} onChange={(event) => updateIntro(event.target.value)} rows="3" />
            <Button type="button" variant="secondary" onClick={() => updateIntro(investorIntroduction(slug))}>Rétablir la présentation</Button>
            <p className="ip-note">Source de la présentation proposée : {INVESTOR_PROFILES[slug]?.sourceUrls.map((url, i) => <span key={url}>{i > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer">{new URL(url).hostname} ↗</a></span>)}</p>
            <label htmlFor="ip-draft">Tweet modifiable</label>
            <textarea id="ip-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows="16" />
          </div>
        </div>
        <WorkspaceActions>
          <Button type="button" onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le tweet'}</Button>
          <Button type="button" variant="secondary" onClick={download}>⬇️ Télécharger le PNG</Button>
        </WorkspaceActions>
        <p className="ip-note">Le visuel reprend les chiffres chargés et peut différer si tu modifies manuellement le tweet. Les déclarations 13F paraissent après la fin du trimestre et ne montrent pas toutes les positions du gestionnaire.</p>
        <p className="ip-credit">{portfolio.identity.dataProvider === 'FolioFact' ? 'Données : FolioFact · déclarations SEC 13F' : portfolio.identity.dataProvider === 'SEC' ? 'Données : SEC EDGAR' : ATTRIBUTION} · <a href={portfolio.sourceUrl} target="_blank" rel="noreferrer">Voir {portfolio.identity.dataProvider === 'FolioFact' ? 'FolioFact' : portfolio.identity.dataProvider === 'SEC' ? 'la déclaration' : 'Tracefour'} ↗</a></p>
      </>}
      {!portfolio && <p role="status">{loading ? 'Chargement des déclarations…' : 'Choisis un investisseur dans les réglages.'}</p>}
    </section>
    </ToolWorkspace>
  </div>
}
