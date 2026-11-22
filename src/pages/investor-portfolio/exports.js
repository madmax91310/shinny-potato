import { mediaCredits } from './media.js'
import { portfolioOwner } from './publication.js'
export function detailedExport(portfolio) {
  return { schemaVersion: 1, identity: portfolio.identity, publicationName: portfolioOwner(portfolio), snapshot: portfolio.snapshot,
    sourceUrl: portfolio.sourceUrl, discoverySourceUrl: portfolio.discoverySourceUrl, positionsCollectedAt: portfolio.positionsCollectedAt || portfolio.fetchedAt, lastAttemptAt: portfolio.lastAttemptAt || null, lastSuccessfulPollAt: portfolio.lastSuccessfulPollAt || null,
    scope: 'Positions longues déclarées hors options ; les options et leur dénominateur original sont conservés dans snapshot.',
    currency: portfolio.snapshot.currency || null, total: portfolio.total,
    status: portfolio.problem ? 'incomplete' : 'ready', problem: portfolio.problem, warnings: portfolio.snapshot.reconciliationWarning ? [portfolio.snapshot.reconciliationWarning] : [], lastError: portfolio.lastError || null,
    holdings: portfolio.holdings, credits: mediaCredits(portfolio) }
}
export function detailedCSV(portfolio) {
  const rows = [['Titre','Ticker','Classe','CUSIP','Identifiant fournisseur','Type','Date positions','Date publication','Valeur déclarée','Devise','Unité','Poids du total déclaré','Poids hors options','Source','Qualification','Problème actuel'],
    ...portfolio.snapshot.holdings.map(r => [r.issuerName,r.ticker,r.shareClass,r.cusip,r.securityId,r.putCall || 'DIRECT',portfolio.snapshot.periodEnd,portfolio.snapshot.filedAt,r.value,r.currency,r.unit,r.weight,!r.putCall && portfolio.total ? r.value/portfolio.total : '',portfolio.sourceUrl,portfolio.problem?'INCOMPLET':'SEC vérifiée',portfolio.lastError || portfolio.problem || portfolio.snapshot.reconciliationWarning || ''])]
  return '\uFEFF' + rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"','""') + '"').join(';')).join('\r\n')
}
// The paginated Canvas renderer is only needed when exporting its ZIP.
export async function renderDetailedPages(portfolio) {
  return (await import('./detail-image.js')).renderDetailedPages(portfolio)
}
