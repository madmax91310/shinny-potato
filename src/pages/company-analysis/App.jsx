import { useState } from 'react'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { COMPANIES } from './data.js'
import { buildTweetText, canPublish, activeValuation, calculatedRatios, dateLabel } from './lib.js'
import { renderCompanyImage } from './image.js'
import './style.css'

export default function App() {
  const [id, setId] = useState(COMPANIES[0].id)
  const [message, setMessage] = useState('')
  const company = COMPANIES.find(item => item.id === id)
  const text = buildTweetText(company)
  const ready = canPublish(company)
  const valuation = activeValuation(company)
  const ratios = calculatedRatios(company)
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Texte copié.') }
    catch { setMessage('La copie a échoué. Tu peux sélectionner le texte dans l’aperçu.') }
  }
  function download() {
    try {
      const link = document.createElement('a')
      link.href = renderCompanyImage(company).toDataURL('image/png')
      link.download = `analyse-${company.id}-${company.annual.end}.png`
      link.click(); setMessage('Image téléchargée.')
    } catch { setMessage('Impossible de préparer l’image.') }
  }
  return <div className="company-analysis">
    <PageHeader title="Analyse d’entreprise" subtitle="Ce qu’elle fait, ses résultats et les points à suivre." />
    <ToolWorkspace renderImage={() => renderCompanyImage(company)} imageDisabled={!ready} imageAlt={`Les chiffres de ${company.name}`} actions={<>
      <Button onClick={copy} disabled={!ready}>Copier le texte</Button>
      <Button variant="secondary" onClick={download} disabled={!ready}>Télécharger le PNG</Button>
      <span role="status">{message}</span>
    </>}>
      <section className="tool-settings">
        <ChoicePicker aria-label="Choisir une entreprise" value={id} onChange={event => { setId(event.target.value); setMessage('') }}>
          {COMPANIES.map(item => <option key={item.id} value={item.id}>{item.name} · {item.symbol}</option>)}
        </ChoicePicker>
        <div className="company-evidence">
          <h2>Les données utilisées</h2>
          {company.annual && <p>Dernier exercice : {dateLabel(company.annual.end)}.</p>}
          {company.accountsObservedAt && <p>Comptes vérifiés le {dateLabel(company.accountsObservedAt)}.</p>}
          <p><a href={company.accountsSourceUrl ?? `https://www.sec.gov/edgar/browse/?CIK=${company.cik}`} target="_blank" rel="noreferrer">Comptes officiels de l’entreprise</a></p>
          {company.quarter?.sourceUrl && <p><a href={company.quarter.sourceUrl} target="_blank" rel="noreferrer">Publication trimestrielle</a></p>}
          <p><a href={company.sourceUrl} target="_blank" rel="noreferrer">Activité de l’entreprise</a></p>
          {company.quote && <p><a href={`https://finance.yahoo.com/quote/${company.symbol}/`} target="_blank" rel="noreferrer">Cours de clôture · Yahoo Finance</a> · {dateLabel(company.quote.asOf)}</p>}
          {ratios.peTTM && <p>PER calculé avec la clôture du {dateLabel(company.quote.asOf)} et la somme des quatre BPA dilués trimestriels clos le {dateLabel(company.trailing.end)}. Les arrondis publiés peuvent créer un léger écart avec un fournisseur.</p>}
          {company.trailing?.sourceUrls?.map((url, i) => <p key={url}><a href={url} target="_blank" rel="noreferrer">BPA trimestriel · source {i + 1}</a></p>)}
          {valuation ? <p><a href={valuation.sourceUrl} target="_blank" rel="noreferrer">Estimations · {valuation.sourceName ?? 'Alpha Vantage'}</a> · {dateLabel(valuation.observedAt)}.</p>
            : <p>Le PER prévisionnel et le PEG sont omis lorsqu’aucune estimation récente et documentée n’est disponible.</p>}
          <p>Le FCF correspond aux flux d’exploitation moins les achats d’immobilisations ; chez Nvidia, les acquisitions d’actifs incorporels sont également incluses. Les contrats de location ne sont pas inclus dans la dette présentée.</p>
        </div>
      </section>
      <section className="tool-preview">
        {ready ? <article className="company-tweet" data-testid="company-tweet">{text}</article>
          : <p role="alert">Les comptes de cette entreprise sont indisponibles ou trop anciens pour générer une publication.</p>}
      </section>
    </ToolWorkspace>
  </div>
}
