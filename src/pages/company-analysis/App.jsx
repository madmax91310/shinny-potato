import ValuationPanel from './ValuationPanel.jsx'
import { notifyPublication, copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import { useState } from 'react'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { COMPANIES } from './data.js'
import { buildTweetText, canPublish, activeValuation, activeEstimates, activeHistory, activeAnnualContext, activeDecision, activeSolidity, decisionIndicators, decisionReadings, amount, dateLabel } from './lib.js'
import { renderCompanyImage } from './image.js'
import './style.css'

export default function App() {
  const [id, setId] = useState(COMPANIES[0].id)
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState({})
  const [editing, setEditing] = useState(false)
  const company = COMPANIES.find(item => item.id === id)
  const generatedText = buildTweetText(company)
  const text = drafts[id] ?? generatedText
  const ready = canPublish(company)
  const valuation = activeValuation(company)
  const estimates = activeEstimates(company)
  const history = activeHistory(company)
  const annualContext = activeAnnualContext(company)
  const solidity = activeSolidity(company)
  const decision = activeDecision(company)
  const indicators = decisionIndicators(company)
  const readings = decisionReadings(company)
  const cashHistory = decision?.years.filter(year => Number.isFinite(year.freeCashFlow)) ?? []
  async function copy() {
    try { await copyPublicationText(text); setMessage('Texte copié.') }
    catch { setMessage('La copie a échoué. Tu peux sélectionner le texte dans l’aperçu.') }
  }
  async function download() {
    try {
      const link = document.createElement('a')
      link.href = (await renderCompanyImage(company)).toDataURL('image/png')
      link.download = `analyse-${company.id}-${company.annual.end}.png`
      startPublicationDownload(link); setMessage('Téléchargement lancé.')
    } catch { setMessage('Impossible de préparer l’image.'); notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
  }
  return <div className="company-analysis">
    <PageHeader title="Analyse d’entreprise" subtitle="Son activité, ses résultats et les chiffres expliqués." />
    <ToolWorkspace renderImage={() => renderCompanyImage(company)} imageDisabled={!ready} imageAlt={`Les chiffres de ${company.name}`} actions={<>
      <Button onClick={copy} disabled={!ready}>Copier le texte</Button>
      <Button variant="secondary" onClick={() => setEditing(value => !value)} disabled={!ready}>{editing ? 'Voir le texte' : 'Modifier le texte'}</Button>
      <Button variant="secondary" onClick={download} disabled={!ready}>Télécharger le PNG</Button>
      <span>{message}</span>
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
          {annualContext && <p><a href={annualContext.sourceUrl} target="_blank" rel="noreferrer">Contexte annuel : services, matériel et charge fiscale</a> · exercice clos le {dateLabel(annualContext.end)} · vérifié le {dateLabel(annualContext.reviewedAt)}. Ce contexte est retiré si les comptes changent.</p>}
          {company.quarter && <p>Dernière période trimestrielle : <a href={company.quarter.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(company.quarter.end)}</a>{company.quarter.durationWeeks ? ` · ${company.quarter.durationWeeks} semaines` : ''} · revenus : {amount(company.quarter.revenue, company.currency)} · résultat net : {amount(company.quarter.netIncome, company.currency)}.</p>}
          {company.halfYear && <p>Dernier semestre : <a href={company.halfYear.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(company.halfYear.end)}</a>.</p>}
          {company.quote && <p><a href={`https://finance.yahoo.com/quote/${company.symbol}/`} target="_blank" rel="noreferrer">Cours de clôture · Yahoo Finance</a> · {dateLabel(company.quote.asOf)}</p>}
          {estimates && <p><a href={estimates.sourceUrl} target="_blank" rel="noreferrer">Estimations · Finviz</a> · relevé le {dateLabel(estimates.observedAt)}. PER prévisionnel = cours de clôture / BPA attendu du prochain exercice fiscal ({estimates.forwardEPS.toLocaleString('fr-FR', {maximumFractionDigits: 2})} {company.currency}). PEG prévisionnel = ce PER prévisionnel / croissance annuelle du BPA estimée sur cinq ans ({estimates.growthEPS5Y?.toLocaleString('fr-FR', {maximumFractionDigits: 2}) ?? 'indisponible'} %). <a href={estimates.methodUrl} target="_blank" rel="noreferrer">Définitions</a>. {estimates.earningsBasis}.</p>}
          {valuation ? <p><a href={valuation.sourceUrl} target="_blank" rel="noreferrer">Ratios · Alpha Vantage</a> · {dateLabel(valuation.observedAt)}. Le PER prévisionnel n’indique pas un horizon standardisé.</p>
            : !estimates && <p>Les estimations récentes sont indisponibles. Le PER prévisionnel et le PEG ne sont pas affichés sans estimations vérifiées.</p>}
          <p>Le flux de trésorerie disponible correspond aux flux d’exploitation moins les investissements en immobilisations.</p>
        </div>
      </section>
      <section className="tool-preview">
        <ValuationPanel key={company.id} company={company} />
        {ready && <section className="company-decision" aria-label="Indicateurs pour analyser l’entreprise">
          <h2>Cash, solidité et valorisation</h2>
          <p>Flux annuels : exercice clos le {dateLabel(company.annual.end)}. Les ratios de valorisation utilisent la dernière clôture disponible.</p>
          {indicators.length ? <dl data-testid="company-decision-indicators">{indicators.map(row => <div key={row.key}>
            <dt>{row.label}</dt><dd><strong>{row.value}</strong><span>{row.explanation}</span></dd>
          </div>)}</dl> : <p>Les composantes nécessaires ne sont pas disponibles avec une collecte vérifiée pour cet exercice.</p>}
          {readings.length > 0 && <ul className="company-decision-readings">{readings.map(line => <li key={line}>{line}</li>)}</ul>}
          {cashHistory.length > 0 && <div className="company-history-scroll"><table data-testid="company-cash-history">
            <caption>{cashHistory.length} exercice{cashHistory.length > 1 ? 's' : ''} de trésorerie disponible</caption>
            <thead><tr><th scope="col">Exercice clos le</th><th scope="col">Flux d’exploitation</th><th scope="col">Investissements</th><th scope="col">FCF</th><th scope="col">Marge de FCF</th></tr></thead>
            <tbody>{cashHistory.map(year => <tr key={year.end}><th scope="row"><a href={year.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(year.end)}</a></th><td>{amount(year.operatingCashFlow, company.currency)}</td><td>{amount(year.capitalExpenditure, company.currency)}</td><td>{amount(year.freeCashFlow, company.currency)}</td><td>{(year.freeCashFlow/year.revenue*100).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1})} %</td></tr>)}</tbody>
          </table></div>}
          {solidity && <p className="company-decision-source">Bilans vérifiés le {dateLabel(solidity.observedAt)}. <a href={solidity.annualBalances[1].sourceUrl} target="_blank" rel="noreferrer">Capitaux propres annuels comparatifs</a> ; <a href={solidity.latestBalance.sourceUrl} target="_blank" rel="noreferrer">bilan au {dateLabel(solidity.latestBalance.asOf)}</a>.</p>}
          {decision && <p className="company-decision-source">Composantes vérifiées le {dateLabel(decision.observedAt)}. {decision.years.at(-1).freeCashFlowDefinition ?? decision.method}. <a href={decision.years.at(-1).sourceUrl} target="_blank" rel="noreferrer">Source des composantes annuelles</a>. {decision.years.at(-1).additionalSourceUrls?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer"> Source complémentaire.</a>)}</p>}
        </section>}
        {history.length > 0 && <div className="company-history">
          <h2>{history.length} exercices de résultats</h2>
          <p>Comptes consolidés {company.accountingStandard ?? 'GAAP'} · {company.currency}. Marge nette = résultat net {company.annual?.incomeBasis ? 'part du groupe ' : ''}/ chiffre d’affaires. Vérifiés le {dateLabel(company.history.observedAt)}.</p>
          <div className="company-history-scroll"><table data-testid="company-history">
            <thead><tr><th scope="col">Exercice clos le</th><th scope="col">Chiffre d’affaires</th><th scope="col">Résultat net</th><th scope="col">Marge nette</th></tr></thead>
            <tbody>{history.map(year => <tr key={year.end}><th scope="row"><a href={year.sourceUrl} target="_blank" rel="noreferrer">{dateLabel(year.end)}</a></th><td>{amount(year.revenue, company.currency)}</td><td>{amount(year.netIncome, company.currency)}</td><td>{year.margin.toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} %</td></tr>)}</tbody>
          </table></div>
        </div>}

        {ready ? <>
          {editing ? <label className="company-editor">Texte de la publication
            <textarea value={text} onChange={event => { setDrafts(previous => ({...previous, [id]: event.target.value})); setMessage('') }} rows={22} />
          </label> : <article className="company-tweet" data-testid="company-tweet">{text}</article>}
          {drafts[id] !== undefined && <div className="company-edit-note">
            <p>Le texte est modifié. L’image conserve les chiffres des données sources.</p>
            <Button variant="secondary" onClick={() => { setDrafts(previous => { const next = {...previous}; delete next[id]; return next }); setMessage('Texte d’origine rétabli.'); notifyPublication('Texte d’origine rétabli.') }}>Rétablir le texte d’origine</Button>
          </div>}
        </>
          : <p role="alert">Les comptes de cette entreprise sont indisponibles ou trop anciens pour générer une publication.</p>}
      </section>
    </ToolWorkspace>
  </div>
}
