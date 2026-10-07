import { useState } from 'react'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { COMPANIES } from './data.js'
import { buildTweetText, canPublish, activeValuation, activeEstimates, activeHistory, amount, dateLabel } from './lib.js'
import { renderCompanyImage } from './image.js'
import './style.css'

export default function App() {
  const [id, setId] = useState(COMPANIES[0].id)
  const [message, setMessage] = useState('')
  const company = COMPANIES.find(item => item.id === id)
  const text = buildTweetText(company)
  const ready = canPublish(company)
  const valuation = activeValuation(company)
  const estimates = activeEstimates(company)
  const history = activeHistory(company)
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Texte copié.') }
    catch { setMessage('La copie a échoué. Tu peux sélectionner le texte dans l’aperçu.') }
  }
  async function download() {
    try {
      const link = document.createElement('a')
      link.href = (await renderCompanyImage(company)).toDataURL('image/png')
      link.download = `analyse-${company.id}-${company.annual.end}.png`
      link.click(); setMessage('Image téléchargée.')
    } catch { setMessage('Impossible de préparer l’image.') }
  }
  return <div className="company-analysis">
    <PageHeader title="Analyse d’entreprise" subtitle="Son activité, ses résultats et les chiffres expliqués." />
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
          {company.quoteListing && <p>Cotation utilisée : {company.quoteListing}.</p>}
          {company.accountsObservedAt && <p>Comptes vérifiés le {dateLabel(company.accountsObservedAt)}.</p>}
          <p><a href={company.accountsSourceUrl ?? `https://www.sec.gov/edgar/browse/?CIK=${company.cik}`} target="_blank" rel="noreferrer">Comptes officiels</a></p>
          <p><a href={company.sourceUrl} target="_blank" rel="noreferrer">Activité de l’entreprise</a></p>
          {company.halfYear && <p>Dernier semestre : <a href={company.halfYear.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(company.halfYear.end)}</a>.</p>}
          {company.quote && <p><a href={`https://finance.yahoo.com/quote/${company.symbol}/`} target="_blank" rel="noreferrer">Cours de clôture · Yahoo Finance</a> · {dateLabel(company.quote.asOf)}</p>}
          {estimates && <p><a href={estimates.sourceUrl} target="_blank" rel="noreferrer">Estimations · Finviz</a> · relevé le {dateLabel(estimates.observedAt)}. PER prévisionnel : prochain exercice fiscal selon le fournisseur. PEG : croissance annuelle estimée sur cinq ans. <a href={estimates.methodUrl} target="_blank" rel="noreferrer">Définitions</a>. {estimates.earningsBasis}.</p>}
          {valuation ? <p><a href={valuation.sourceUrl} target="_blank" rel="noreferrer">Ratios · Alpha Vantage</a> · {dateLabel(valuation.observedAt)}. Le PER prévisionnel n’indique pas un horizon standardisé.</p>
            : !estimates && <p>Les estimations récentes sont indisponibles. Le PER prévisionnel et le PEG sont omis de la publication.</p>}
          <p>Le flux de trésorerie disponible correspond aux flux d’exploitation moins les investissements en immobilisations.</p>
        </div>
      </section>
      <section className="tool-preview">
        {history.length > 0 && <div className="company-history">
          <h2>{history.length} exercices de résultats</h2>
          <p>Comptes consolidés {company.accountingStandard ?? 'GAAP'} · {company.currency}. Marge nette = résultat net {company.annual?.incomeBasis ? 'part du groupe ' : ''}/ chiffre d’affaires. Vérifiés le {dateLabel(company.history.observedAt)}.</p>
          <div className="company-history-scroll"><table data-testid="company-history">
            <thead><tr><th scope="col">Exercice clos le</th><th scope="col">Chiffre d’affaires</th><th scope="col">Résultat net</th><th scope="col">Marge nette</th></tr></thead>
            <tbody>{history.map(year => <tr key={year.end}><th scope="row"><a href={year.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(year.end)}</a></th><td>{amount(year.revenue, company.currency)}</td><td>{amount(year.netIncome, company.currency)}</td><td>{year.margin.toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} %</td></tr>)}</tbody>
          </table></div>
        </div>}

        {ready ? <article className="company-tweet" data-testid="company-tweet">{text}</article>
          : <p role="alert">Les comptes de cette entreprise sont indisponibles ou trop anciens pour générer une publication.</p>}
      </section>
    </ToolWorkspace>
  </div>
}
