// Publication facts and approved visual summaries. No canvas, DOM or resource loading.
import { familyLabel } from '../../data/presentation-actors.js'
import { dateLabel, format, annualPublicationNote } from './labels.js'
import { fundAllocation, fundGuarantee, fundOperations } from '../insurance-presentation/lib.js'

const pct = value => `${format(value)} %`
const euro = value => `${format(value)} €`
const row = (label, value) => ({ label, value: String(value) })
const sourceHosts = urls => [...new Set(urls.filter(Boolean).map(url => new URL(url).hostname.replace(/^www\./, '')))].join(' · ')
const split = (rows, limit = 3) => {
  const sorted = [...rows].sort((a,b) => b.value-a.value)
  const result = sorted.slice(0,limit).map(r => row(r.label,pct(r.value)))
  if (sorted.length>limit) result.push(row('Autres',pct(sorted.slice(limit).reduce((sum,r)=>sum+r.value,0))))
  return result
}
export function presentationImageModel(record, kind) {
  if (kind === 'actor') return { title: record.name, subtitle: familyLabel(record.family), kind, sections: [],
    footer: 'Capital et revenus non garantis. Liquidité limitée.',
    sources: `Sources officielles : ${sourceHosts(record.sources.map(row => row.url))}. Vérifié manuellement le ${dateLabel(record.checkedAt)}.` }
  const sections = []
  let footer
  if (kind === 'scpi') {
    const { snapshot, annual, conditions:c, price } = record
    sections.push({title:'Patrimoine',columns:[{title:'Pays',rows:split(snapshot.countries)},{title:'Secteurs',rows:split(snapshot.sectors)}],notes:[snapshot.asOf ? `Répartition au ${dateLabel(snapshot.asOf)}.` : 'Date des graphiques non publiée.',snapshot.dateNote].filter(Boolean)})
    const metrics = Object.entries(record.portfolio ?? {}).map(([key,r]) => row(r.label,`${format(r.value)}${key==='occupancy'?' %':''} · ${dateLabel(r.asOf)}`))
    if (metrics.length) sections.push({title:'Actifs et occupation',rows:metrics,notes:['Le taux financier ne mesure pas l’occupation physique.',record.portfolio?.occupancy?.basis].filter(Boolean)})
    sections.push({title:'Distributions',annual:annual.years.map(r=>({year:r.year,value:pct(r.distribution)})),notes:['Taux de distribution, bruts de fiscalité étrangère ; distincts de la performance totale.',annualPublicationNote(annual.publication)].filter(Boolean)})
    const management=c.managementZones ? `${pct(c.managementZones.euro)} TTC en zone euro ; ${pct(c.managementZones.outside)} TTC hors zone euro` : `${c.managementFeeMax || record.id==='iroko-zen'?'Maximum ':''}${pct(c.managementFee)} ${c.managementTax ?? 'TTC'}`
    sections.push({title:'Accès et frais',columns:[{title:'Souscription',rows:[row('Prix de la part',`${euro(price.value)} · ${dateLabel(price.asOf)}`),row('Minimum initial',euro(c.minimum)),row('Revenus potentiels',c.frequency)]},{title:'Commissions',rows:[row('Souscription',`${c.subscriptionFeeMax?'Maximum ':''}${pct(c.subscriptionFee)} ${c.subscriptionTax ?? ''}`.trim()),row('Gestion',management),row('Assiette de gestion',c.managementBasis)]}],notes:[c.enjoyment,...(record.priceHistory?.corporateActions ?? []).map(a=>a.description)]})
    footer='Capital et revenus non garantis. Revente non immédiate. Distributions passées non garanties à l’avenir.'
  } else {
    const {fees,access,supports,euroFunds}=record
    sections.push({title:'Supports et accès',columns:[{title:'Versements minimums',rows:[row('Ouverture',euro(access.initial)),row('Versement libre',euro(access.free)),row('Programmé',`${euro(access.monthly)}/mois`)]},{title:'Supports annoncés',rows:[row('Nombre',`Plus de ${format(supports.minimumCount)}`),row('Catégories',supports.categories.join(', '))]}],notes:[`Assureur : ${record.insurer}. Gestion libre.`]})
    sections.push({title:'Frais du contrat',columns:[{title:'Opérations',rows:[row('Versement',pct(fees.subscription)),row('Arbitrage en ligne',pct(fees.arbitrage))]},{title:'Gestion et transactions',rows:[row('Unités de compte',`${pct(fees.units)}/an`),row('Transactions ETF',`${pct(fees.etfTrade)} par opération`)]}],notes:[fees.notes,'Les frais propres aux supports et aux options s’ajoutent.'].filter(Boolean)})
    for (const fund of euroFunds) {
      sections.push({title:fund.name,annual:fund.years.map(r=>({year:r.year,value:r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`})),notes:[...fund.years.filter(r=>r.condition).map(r=>`${r.year} : ${r.condition}.`),`Gestion du fonds : ${pct(fund.managementFeeMax)} maximum/an.`,annualPublicationNote(fund.publication),fundGuarantee(fund),fundAllocation(fund),fundOperations(fund),fund.notes].filter(Boolean)})
      const latest=fund.years.at(-1)
      if(latest.tiers) sections.push({title:`Barème ${latest.year} · ${fund.name}`,table:latest.tiers,notes:['Ce barème dépend de l’encours et de la part d’unités de compte.']})
    }
    footer='Rendements nets de gestion, avant prélèvements sociaux et fiscaux, hors bonus commerciaux. UC non garanties. Rendements passés non garantis à l’avenir.'
  }
  const urls=kind==='scpi' ? [record.sourceUrl,...record.snapshot.sourceUrls,record.annual.sourceUrl,...(record.conditions.sourceUrls ?? [record.conditions.sourceUrl])] : [record.sourceUrl,...(record.fees.sourceUrls ?? [record.fees.sourceUrl]),...record.euroFunds.flatMap(f=>f.sourceUrls ?? [f.sourceUrl])]
  return {title:record.name,subtitle:kind==='scpi'?'Immobilier d’entreprise':'Assurance-vie',kind,sections,footer,sources:`Sources officielles : ${sourceHosts(urls)}. Relevé le ${dateLabel(record.checkedAt)}${kind==='insurance'?' ; dates d’effet des frais non toujours publiées':''}.`}
}
// The approved reference is a square editorial card, with three summary panels.
// Full product conditions remain in the adjacent text publication.
export function presentationCardModel(record, kind) {
  const model=presentationImageModel(record,kind)
  if(kind==='actor') return { ...model, cards: [], compactFooter: 'Capital et revenus non garantis · Liquidité limitée' }
  if(kind==='scpi') {
    const c=record.conditions
    const top=[...record.snapshot.sectors].sort((a,b)=>b.value-a.value)[0]
    const management=c.managementZones
      ? `${pct(c.managementZones.euro)} / ${pct(c.managementZones.outside)} TTC`
      : `${c.managementFeeMax || record.id==='iroko-zen'?'≤ ':''}${pct(c.managementFee)} ${c.managementTax ?? 'TTC'}`
    model.cards=[
      {title:'Patrimoine',icon:'buildings',rows:[row('Prix de la part',euro(record.price.value)),row('Minimum initial',euro(c.minimum)),...(top?[row(top.label,pct(top.value))]:[])],note:`Prix au ${dateLabel(record.price.asOf)}`},
      {title:'Distributions',icon:'coins',rows:record.annual.years.slice(-3).map(r=>row(String(r.year),pct(r.distribution))),note:'Taux de distribution bruts de fiscalité étrangère.'},
      {title:'Frais',icon:'document',rows:[row('Souscription',`${c.subscriptionFeeMax?'≤ ':''}${pct(c.subscriptionFee)} ${c.subscriptionTax ?? ''}`.trim()),row('Gestion',management)],note:c.managementZones?'Zone euro / hors zone euro. '+c.managementBasis:c.managementBasis},
    ]
    model.compactFooter='Capital et revenus non garantis · Revente non immédiate'
  } else {
    model.cards=[
      {title:'Supports',icon:'leaf',rows:[row('Supports annoncés',`> ${format(record.supports.minimumCount)}`),row('Ouverture',euro(record.access.initial)),row('Versement programmé',`${euro(record.access.monthly)}/mois`)],note:'Gestion libre · '+record.insurer},
      {title:'Fonds euros',icon:'coins',rows:record.euroFunds.map(f=>{const r=f.years.at(-1);return row(`${f.name} · ${r.year}`,r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`)}),note:record.euroFunds.map(f=>f.years.at(-1).condition).filter(Boolean).join('; ') || 'Nets de gestion, avant prélèvements sociaux et fiscaux. Hors bonus.'},
      {title:'Frais',icon:'document',rows:[row('Versement',pct(record.fees.subscription)),row('Gestion des UC',`${pct(record.fees.units)}/an`),row('Transactions ETF',pct(record.fees.etfTrade))],note:'Hors frais des supports et options. Transactions : par opération.'},
    ]
    model.compactFooter='UC non garanties · Rendements passés non garantis à l’avenir'
  }
  return model
}
// One identity per product, including separate identities for contracts from one distributor.
export const presentationBrands = {
  tudigo: { color:'#cf7658', light:'#ffe1d4', dark:'#663126' },
  lendosphere: { color:'#68ae82', light:'#d4ffe0', dark:'#2b5e40' },
  fundora: { color:'#9e83cb', light:'#ecdaff', dark:'#493066' },
  anaxago: { color:'#d4b26b', light:'#fff0c3', dark:'#66502b' },
  mymarguerit: { color:'#63aa76', light:'#d5ffdb', dark:'#295739' },
  bacchus: { color:'#ad627e', light:'#ffd4e7', dark:'#642f46' },
  'france-valley': { color:'#a8b964', light:'#f0ffbf', dark:'#4e6029' },
  enerfip: { color:'#d0ab44', light:'#fff2b2', dark:'#6d5016' },
  hectarea: { color:'#95ae61', light:'#edffc4', dark:'#445f29' },
  bricks: { color:'#c87859', light:'#ffdfc8', dark:'#6b3328' },
  matis: { color:'#7996c6', light:'#dceaff', dark:'#2c446e' },
  'iroko-zen': { color:'#1688db', light:'#a6e5ff', dark:'#073361' },
  'remake-live': { color:'#e4518c', light:'#ffd0df', dark:'#681d42' },
  'corum-origin': { color:'#c59b54', light:'#ffe9b8', dark:'#6d4622' },
  'corum-xl': { color:'#cb695b', light:'#ffd8bf', dark:'#6c2928' },
  'corum-eurion': { color:'#56aa92', light:'#c0f4df', dark:'#245e50' },
  'transitions-europe': { color:'#ce536b', light:'#ffced7', dark:'#6a2439' },
  'activimmo': { color:'#5599bd', light:'#c4edff', dark:'#1b455f' },
  'epargne-pierre': { color:'#dc934a', light:'#ffe3b9', dark:'#704323' },
  'linxea-spirit-2': { color:'#aa73d5', light:'#ebd4ff', dark:'#4d2c71' },
  'linxea-avenir-2-plus': { color:'#4da3e1', light:'#c9eeff', dark:'#1a4976' },
  'linxea-avenir-2': { color:'#4da3e1', light:'#c9eeff', dark:'#1a4976' },
  'linxea-zen': { color:'#68b4a6', light:'#d2fff0', dark:'#285b52' },
  'linxea-vie': { color:'#d86b93', light:'#ffd5e5', dark:'#6d304e' },
  'lucya-cardif': { color:'#59b9a4', light:'#d0fff0', dark:'#18594f' },
  'placement-direct-vie': { color:'#e49642', light:'#ffe5b4', dark:'#71431c' },
}
export function presentationReliefModel(record,kind) {
  const model=presentationCardModel(record,kind)
  if(kind==='actor') return { ...model, highlights: record.highlights.map(([label,value]) => row(label,
    record.id==='tudigo' && label==='Exposition' && value==='Entreprises non cotées' ? 'Non coté' :
    record.id==='lendosphere' && label==='Exposition' && value==='Transition énergétique' ? 'Énergie' : value)),
    qualifier: record.activity?.status==='ceased' ? 'Activité cessée · Jugement du '+dateLabel(record.activity.judgmentAt)+' · Avis contrôlé le '+dateLabel(record.activity.checkedAt) : (record.selectedOffer?.availability?.status === 'closed' ? record.selectedOffer.name+' · Souscriptions clôturées le '+dateLabel(record.selectedOffer.availability.asOf) : record.selectedOffer?.warnings.length ? 'Durées officielles divergentes · Confirmer les conditions du titre' : (record.selectedOffer?.scopeType === 'platform' ? 'Fiche générale · Conditions selon le projet' : (record.selectedOffer?.name ?? 'Fonctionnement général de l’acteur')+' · Conditions publiques'))+' · Vérifié le '+dateLabel(record.checkedAt),
    brand: presentationBrands[record.id] }
  if(kind==='scpi') {
    const latest=record.annual.years.at(-1)
    model.highlights=[
      row(`Distribution ${latest.year}`,pct(latest.distribution)),
      row('Prix de la part',euro(record.price.value)),
      row('Minimum initial',euro(record.conditions.minimum)),
    ]
    model.qualifier='Taux de distribution brut de fiscalité étrangère · Prix au '+dateLabel(record.price.asOf)
  } else {
    model.highlights=record.euroFunds.slice(0,2).map(f=>{
      const r=f.years.at(-1)
      return row(`${f.name} · ${r.year}`,r.return!=null?pct(r.return):`${format(r.returnMin)} à ${pct(r.returnMax)}`)
    })
    if(model.highlights.length===1)model.highlights.push(row('Ouverture',euro(record.access.initial)))
    model.highlights.push(row('Gestion des UC',`${pct(record.fees.units)}/an`))
    const conditions=record.euroFunds.slice(0,2).map(f=>f.years.at(-1).condition).filter(Boolean)
    model.qualifier=['Fonds euros : nets de gestion, avant prélèvements sociaux et fiscaux. Hors bonus.',...conditions.map(c=>c+'.'),
      'Gestion des UC : hors frais des supports et options.'].join(' ')
  }
  model.brand=presentationBrands[record.id]
  if(!model.brand)throw new Error('Identité visuelle de ce placement non référencée.')
  return model
}
