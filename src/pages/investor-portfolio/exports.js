import { mediaCredits } from './media.js'
import { dateFR, percentage } from './data.js'
import { reportedAmount, labelLines } from './publication.js'
export function detailedExport(portfolio) {
  return { schemaVersion: 1, identity: portfolio.identity, snapshot: portfolio.snapshot,
    sourceUrl: portfolio.sourceUrl, discoverySourceUrl: portfolio.discoverySourceUrl, positionsCollectedAt: portfolio.fetchedAt, lastSuccessfulPollAt: portfolio.lastSuccessfulPollAt || null,
    scope: 'Positions longues déclarées hors options ; les options et leur dénominateur original sont conservés dans snapshot.',
    currency: portfolio.snapshot.currency || null, total: portfolio.total,
    status: portfolio.problem ? 'incomplete' : 'ready', problem: portfolio.problem, lastError: portfolio.lastError || null,
    holdings: portfolio.holdings, credits: mediaCredits(portfolio) }
}
export function detailedCSV(portfolio) {
  const rows = [['Titre','Ticker','Classe','CUSIP','Identifiant fournisseur','Type','Date positions','Date publication','Valeur déclarée','Devise','Unité','Poids du total déclaré','Poids hors options','Source','Qualification','Problème actuel'],
    ...portfolio.snapshot.holdings.map(r => [r.issuerName,r.ticker,r.shareClass,r.cusip,r.securityId,r.putCall || 'DIRECT',portfolio.snapshot.periodEnd,portfolio.snapshot.filedAt,r.value,r.currency,r.unit,r.weight,!r.putCall && portfolio.total ? r.value/portfolio.total : '',portfolio.sourceUrl,portfolio.problem?'INCOMPLET':'SEC vérifiée',portfolio.lastError || portfolio.problem || ''])]
  return '\uFEFF' + rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"','""') + '"').join(';')).join('\r\n')
}
export async function renderDetailedPages(portfolio) {
  const lines = portfolio.holdings.flatMap(r => [
    ...labelLines(r.issuerName, 56),
    ...labelLines([r.ticker,r.shareClass,r.cusip,r.securityId].filter(Boolean).join(' · ') || 'Identifiant et classe non transmis',56),
    ...labelLines(`${reportedAmount(r)} · ${percentage(r.weight)}`,56),
    '',
  ])
  const options=portfolio.snapshot.holdings.filter(r=>r.putCall)
  if(options.length) {
    lines.push('Options déclarées · hors image et total', 'Poids sur le total déclaré, options incluses.', '')
    for(const r of options) lines.push(...labelLines(`${r.issuerName} · ${r.putCall}`,56),...labelLines([r.shareClass,r.cusip].filter(Boolean).join(' · '),56),...labelLines(`${reportedAmount(r)} · ${percentage(r.weight)}`,56),'')
  }
  const note=labelLines(portfolio.lastError || portfolio.problem || 'Positions hors options ; options séparées en fin de détail.',60).slice(0,3)
  const contentTop=220+note.length*30
  const perPage=Math.floor((1210-contentTop)/38)+1
  const pages=[]
  for(let start=0;start<lines.length;start+=perPage) {
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f8f2';ctx.fillRect(0,0,1080,1350)
    const text=(v,x,y,size=28)=>{ctx.font=`600 ${size}px monospace`;ctx.fillStyle='#183b2d';ctx.fillText(v,x,y)}
    text(`Détail · ${dateFR(portfolio.snapshot.periodEnd)}`,40,65)
    text(portfolio.identity.displayName,40,110)
    text(portfolio.problem?'DONNÉES INCOMPLÈTES':'DÉCLARATION SEC VÉRIFIÉE',40,155)
    note.forEach((line,i)=>text(line,40,190+i*30,25))
    lines.slice(start,start+perPage).forEach((line,i)=>text(line,40,contentTop+i*38))
    text(`Épargnant libre · page ${pages.length+1}`,40,1290)
    pages.push(canvas.toDataURL('image/png'))
    // Release the backing surface before the next page and let mobile paint
    // its busy state. Thousands of holdings must not retain hundreds of canvases.
    canvas.width=1;canvas.height=1
    await new Promise(resolve=>requestAnimationFrame(resolve))
  }
  return pages
}
