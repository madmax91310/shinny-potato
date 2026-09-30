import { useEffect, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { ATTRIBUTION, buildTweet, dateFR, INVESTORS, loadPortfolio, percentage } from './data.js'
import { renderPortfolioImage } from './image.js'
import './style.css'

export default function InvestorPortfolio() {
  const [slug, setSlug] = useState('tepper')
  const [portfolio, setPortfolio] = useState(null)
  const [intro, setIntro] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setPortfolio(null); setLoading(true); setError(''); setCopied(false)
    loadPortfolio(slug, controller.signal).then((next) => {
      setPortfolio(next)
      setIntro('')
      setDraft(buildTweet(next))
    }).catch((problem) => {
      if (problem.name !== 'AbortError') setError(problem.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [slug])

  function updateIntro(value) {
    setIntro(value)
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
    <section className="ip-panel">
      <label htmlFor="ip-investor">Choisir un investisseur</label>
      <select id="ip-investor" value={slug} onChange={(event) => setSlug(event.target.value)}>
        {INVESTORS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
      {loading && <p role="status">Chargement des données Tracefour…</p>}
      {error && <p role="alert" className="ip-error">{error}</p>}
      {portfolio && <>
        <div className="ip-meta">
          <strong>{portfolio.identity.displayName} · {portfolio.identity.entityName}</strong>
          <span>Positions au {dateFR(portfolio.snapshot.periodEnd)} · déposées le {dateFR(portfolio.snapshot.filedAt)}</span>
          <span>{portfolio.holdings.length} positions affichées · poids hors options</span>
        </div>
        <div className="ip-grid">
          <div className="ip-preview" aria-label="Répartition des cinq principales positions">
            {portfolio.holdings.slice(0, 5).map((row, i) => <div className="ip-row" key={`${row.ticker}-${i}`}>
              <span className="ip-dot" style={{ background: ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9'][i] }} />
              <span>{row.issuerName} <small>{row.ticker}</small></span><strong>{percentage(row.weight)}</strong>
            </div>)}
          </div>
          <div className="ip-editor">
            <label htmlFor="ip-intro">Présentation personnelle (facultative, à vérifier avant publication)</label>
            <textarea id="ip-intro" value={intro} onChange={(event) => updateIntro(event.target.value)} placeholder="Ex. David Tepper a fondé Appaloosa en 1993…" rows="3" />
            <label htmlFor="ip-draft">Tweet modifiable</label>
            <textarea id="ip-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows="16" />
          </div>
        </div>
        <div className="ip-actions">
          <Button type="button" onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le tweet'}</Button>
          <Button type="button" variant="secondary" onClick={download}>⬇️ Télécharger le PNG</Button>
        </div>
        <p className="ip-note">Le visuel reprend les chiffres chargés et peut différer si tu modifies manuellement le tweet. Les déclarations 13F paraissent après la fin du trimestre et ne montrent pas toutes les positions du gestionnaire.</p>
        <p className="ip-credit">{ATTRIBUTION} · <a href={portfolio.sourceUrl} target="_blank" rel="noreferrer">Voir Tracefour ↗</a> · <a href={portfolio.filingHistory?.[0]?.sourceUrl || `https://www.sec.gov/edgar/search/`} target="_blank" rel="noreferrer">Voir la SEC ↗</a></p>
      </>}
    </section>
  </div>
}
