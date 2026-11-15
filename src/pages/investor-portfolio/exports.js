import { mediaCredits } from './media.js'
import { dateFR, percentage } from './data.js'
import { cash, labelLines } from './publication.js'
export function detailedExport(portfolio) {
  return { schemaVersion: 1, identity: portfolio.identity, snapshot: portfolio.snapshot,
    sourceUrl: portfolio.sourceUrl, positionsCollectedAt: portfolio.fetchedAt, lastSuccessfulPollAt: portfolio.lastSuccessfulPollAt || null,
    scope: 'Positions longues déclarées hors options ; les options et leur dénominateur original sont conservés dans snapshot.',
    currency: portfolio.snapshot.currency || null, total: portfolio.total,
    status: portfolio.problem ? 'incomplete' : 'ready', problem: portfolio.problem,
    holdings: portfolio.holdings, credits: mediaCredits(portfolio) }
}
export function detailedCSV(portfolio) {
  const rows = [['Titre','Ticker','Classe','CUSIP','Identifiant fournisseur','Date positions','Date publication','Valeur','Devise','Unité','Poids hors options','Source'],
    ...portfolio.holdings.map(r => [r.issuerName,r.ticker,r.shareClass,r.cusip,r.securityId,portfolio.snapshot.periodEnd,portfolio.snapshot.filedAt,r.value,r.currency,r.unit,r.weight,portfolio.sourceUrl])]
  return '\uFEFF' + rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"','""') + '"').join(';')).join('\r\n')
}
export async function renderDetailedPages(portfolio) {
  const lines = portfolio.holdings.flatMap(r => [
    ...labelLines(r.issuerName, 56),
    ...labelLines([r.ticker,r.shareClass,r.cusip,r.securityId].filter(Boolean).join(' · ') || 'Identifiant et classe non transmis',56),
    `${Number.isFinite(r.value)?cash(r.value,r.currency):'Montant indisponible'} · ${percentage(r.weight)}`,
    '',
  ])
  const pages=[]
  for(let start=0;start<lines.length;start+=28) {
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f8f2';ctx.fillRect(0,0,1080,1350)
    const text=(v,x,y,size=28)=>{ctx.font=`600 ${size}px monospace`;ctx.fillStyle='#183b2d';ctx.fillText(v,x,y)}
    text(`Détail · ${dateFR(portfolio.snapshot.periodEnd)}`,40,65)
    text(portfolio.identity.displayName,40,110)
    lines.slice(start,start+28).forEach((line,i)=>text(line,40,175+i*38))
    text(`Épargnant libre · page ${pages.length+1}`,40,1290)
    pages.push(canvas.toDataURL('image/png'))
  }
  return pages
}
