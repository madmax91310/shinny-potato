// Review the actual consumers of the requested identities; never infer admission from AI prices.
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {ASSETS,ASSET_ORDER} from '../src/data/market-history.js'
import {MARKET_ASSETS,getAnnualReturnStartYears} from '../src/pages/tweet-midi/data/performanceHistory.js'
import {getValidYearsBackOptions,ANNIVERSAIRE_ELIGIBLE_ASSETS} from '../src/pages/tweet-midi/data/marketHistory.js'
import {historyCurrencies} from '../src/data/history-currency.js'
import {ASSETS as PORTFOLIOS} from '../src/data/portfolio-assets.js'
import {CATALOG as DUELS} from '../src/data/duel-assets.js'
import {ETFS} from '../src/data/etf-cards.js'
import {SHEETS} from '../src/data/index-factsheets.js'
import {CATEGORIES,RANKING_ASSETS,ANNUAL_ASSETS} from '../src/pages/performance-rankings/data.js'
import {commonCoverage,periodReturn} from '../src/pages/performance-rankings/engine.js'
import {convertAsset} from '../src/pages/performance-rankings/series.js'
import {getInstrumentFacts} from '../src/data/instrument-facts.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const read=p=>JSON.parse(readFileSync(p))
const scope=read('scripts/ai-tools-scope.json').assets
const catalog=read('src/pages/dca-profiles/catalog.json')
const sources=read('scripts/monthly-automation.json').series
const classifications=read('src/data/dca-security-classifications.json')
const listings=read('data/ai-portfolios/selectable-assets.json').listings
const now=new Date()
const profileIds=['ai-infrastructure','space-stocks','digital-finance','bitcoin-companies','cyber-stocks','cyber-etf-stocks','software-data','digital-platforms','latin-america-business','digital-infrastructure-energy','europe-defense-expanded','robotics-etf-stocks','world','world-nasdaq-funds','themes-world-funds','world-gold-products']
const indexIds={IE00BG0J4C88:'stoxx-global-digital-security',IE00BYZK4552:'stoxx-global-automation-robotics',IE00B1XNHC34:'sp-global-clean-energy-transition',IE00B4L5Y983:'world',IE00B53SZB19:'nasdaq-pea',IE00B6R52259:'acwi',IE00B3RBWM25:'ftse-all-world',IE00BK5BQT80:'ftse-all-world'}
function snapshot(){return scope.map(s=>{
 const histories=Object.entries(ASSETS).filter(([id,a])=>s.id?id===s.id:a.isin===s.isin)
 const [id,a]=histories[0]??[]
 const refs=Object.entries(catalog).filter(([,r])=>r.isin===s.isin)
 const ranking=id&&RANKING_ASSETS[id]
 const fullYears=ranking?.points.filter(p=>p.date.endsWith('-12')).slice(1).map(p=>+p.date.slice(0,4))??[]
 const performanceSources=MARKET_ASSETS.filter(a=>a.isin===s.isin&&getAnnualReturnStartYears(a.id).length).map(a=>({id:a.id,starts:getAnnualReturnStartYears(a.id),frequency:a.frequency??'monthly',currency:a.currency}))
 const annualSources=Object.values(ANNUAL_ASSETS).filter(a=>a.isin===s.isin).map(a=>({id:a.id,years:Object.keys(a.years).map(Number),currency:a.currency,basis:a.basis}))
 const horizons=id&&ANNIVERSAIRE_ELIGIBLE_ASSETS.some(r=>r.id===id)?getValidYearsBackOptions(id,now):[]
 const funds=PORTFOLIOS.filter(r=>r.isin===s.isin)
 return {...s,id,label:a?.label??refs[0]?.[1].name??s.isin,history:histories.map(([id,r])=>({id,start:r.points[0].date,end:r.points.at(-1).date,months:r.points.length,currency:r.currency,convention:r.priceMethod==='adjusted'?'adjusted-income-and-splits':'close'})),
  present:{performance:performanceSources.length>0,investment:ASSET_ORDER.includes(id),anniversary:horizons.length>0,ranking:Boolean(ranking)||annualSources.length>0,rankingAnnual:fullYears.length>=2||annualSources.some(a=>a.years.length>=2),dca:refs.length>0,portfolio:funds.length>0,automatic:funds.some(r=>!r.manualOnly),duels:DUELS.some(r=>r.isin===s.isin),presentation:ETFS.some(r=>r.isin===s.isin),index:SHEETS.some(r=>r.id===indexIds[s.isin])},
  starts:id?getAnnualReturnStartYears(id):[],performanceSources,annualSources,horizons,fullYears,dcaRefs:refs.map(([id,r])=>({id,...r})),portfolioIds:funds.map(r=>r.id)}
})}
const rows=snapshot()
if(process.argv.includes('--snapshot')){writeFileSync(process.argv.at(-1),JSON.stringify({commit:process.env.BASELINE_SHA??null,rows},null,2)+'\n');process.exit(0)}
const before=read('docs/ai-tools-before.json').rows
const cell=(r,key,ok,reason,outside=false)=>({status:outside?'hors périmètre':ok?(before.find(b=>b.isin===r.isin)?.present[key]?'déjà raccordé':'raccordé dans cette PR'):'bloqué',reason})
const matrix=rows.map(r=>{
 const a=ASSETS[r.id],src=sources.find(s=>s.id===r.id),old=before.find(b=>b.isin===r.isin)
 const ai=listings.find(l=>l.id===r.aiListingId)??listings.find(l=>l.isin===r.isin)
 const security=classifications[r.isin]
 const h=r.history[0]
 const exposure=Object.entries(catalog).filter(([,x])=>x.isin===r.isin)
 const overlap=exposure.some(([,x])=>x.kind==='equity'||x.holdings?.complete)
 const period=h?`${h.start} → ${h.end}, ${h.months} clôtures réelles continues`:'Aucun historique mensuel qualifié'
 const currencies=a?historyCurrencies(a):[]
 const index=indexIds[r.isin]
 const report={identity:{name:r.label,isin:r.isin,aiListingId:ai?.id??null,companyId:ai?.companyId??null,shareClass:ai?.shareClass??null,instrumentType:a?.instrumentType??(r.aiListingId?'EQUITY':'ETF'),
  listing:{symbol:src?.symbol,currency:src?.currency,mic:src?.mic??src?.listingEvidence?.exchange,source:src?.listingEvidence??src?.listingEvidenceId},
  countryOfRisk:security?.country??null,domicile:security?null:getInstrumentFacts(r.isin)?.domicile??null,domicileNote:security?'Le pays de risque BlackRock n’est ni un domicile juridique ni une ventilation des revenus.':null},
  before:old,after:{history:r.history,aiDaily:{from:ai?.coverageFrom??null,through:ai?.coverageThrough??null,convention:ai?.convention??null},convention:'Cours de la cotation exacte ajustés des revenus et divisions ; simulation de réinvestissement avant frais du courtier et fiscalité. ETF : frais du fonds reflétés ; ETC or : aucun dividende.',currency:src?.currency,conversion:`BCE aux deux bornes ; EUR/USD proposés selon couverture. BCE mensuelle ${Object.keys(FX.months).sort()[0]} → ${Object.keys(FX.months).sort().at(-1)}. Périodes antérieures conservées en devise native.`,currenciesAtFirstDate:currencies,continuity:src?.continuityNote??null},
  tools:{
   performance:cell(r,'performance',r.present.performance&&r.starts.length,`${period}. Années de départ admissibles : ${r.starts.join(', ')}. Devise native et conversion EUR/USD selon la période.`),
   investmentLump:cell(r,'investment',r.present.investment,`${period}. Tous les mois observés sont sélectionnables. Unités théoriques ajustées, aucun prix d’achat brut inventé.`),
   investmentDca:cell(r,'investment',r.present.investment,`${period}. Achats mensuels de fin de mois, revenus réinvestis, hors courtage/fiscalité ; change historique lorsque choisi.`),
   anniversary:cell(r,'anniversary',r.present.anniversary,`Horizons réellement proposés au ${now.toISOString().slice(0,10)} : ${r.horizons.join(', ')} an(s). Clôtures historiques hors revenus et clôture récente datée ; pas de base 100 IA.`),
   rankingCurrent:cell(r,'ranking',r.present.ranking,`${period}. Période libre ou années complètes, 2 à 6 actifs, devise commune et compatibilité contrôlées.`),
   rankingAnnual:cell(r,'rankingAnnual',r.present.rankingAnnual,`Années complètes : ${r.fullYears.join(', ')}. Au moins deux années communes ; image limitée à sept années et six actifs. ${r.present.rankingAnnual?'Admission individuelle, à revérifier avec chaque sélection.':'Profondeur insuffisante, aucune admission par le seul mode actuel.'}`),
   dcaManual:cell(r,'dca',r.present.dca,'Sélection manuelle d’exposition et recouvrement. Cet outil ne simule pas un historique de versements et ne génère pas de profil éditorial DCA de cet actif.'),
   portfolioManual:cell(r,'portfolio',r.present.portfolio,r.present.portfolio?`Sélecteur manuel : ${r.portfolioIds.join(', ')}. Années EUR et conventions existantes.`:'Trois années civiles complètes consécutives requises ; les nouveaux titres récents restent dans les autres outils.'),
   portfolioAutomatic:cell(r,'automatic',r.present.automatic,r.aiListingId?'Actions individuelles exclues des tirages automatiques ETF.':r.present.automatic?'Recettes et règles déjà existantes conservées ; aucune admission automatique créée par cette PR.':'Aucune qualification distincte du rôle et de l’allocation automatique.',Boolean(r.aiListingId)),
   duels:cell(r,'duels',r.present.duels,r.present.duels?'Sélecteur manuel existant, 1 à 6 actifs par côté, trois à six années civiles communes, rendements EUR et repondération annuelle.':'Moins de trois années civiles complètes consécutives ; pas de duel vide.'),
   exposures:cell(r,'dca',r.present.dca,security?`Pays de risque ${security.country} ; secteur ${security.sector}. ${security.sourceUrl} ; photo ${security.asOf}, contrôle ${security.checkedAt}. Domicile et revenus géographiques non déduits.`:a?.instrumentType==='ETC'?'Or physique distinct ; aucune entreprise, aucun pays ou secteur d’action inventé.':`Compositions réellement publiées : ${exposure.map(([,x])=>JSON.stringify(x.holdings??null)).join('; ')}. Poids non renormalisés, dates et couverture conservées.`),
   overlap:cell(r,'dca',overlap,security?`Identité exacte ${r.isin} ; entreprise ${ai?.companyId??'identifiant de société vérifié absent'}. Recouvrement par titre dans les compositions disponibles ; aucune fusion automatique de classes ou ADR.`:a?.instrumentType==='ETC'?'Or physique hors recouvrement d’entreprises.':'Composition complète requise pour un pourcentage intégral ; un top 10 ne suffit pas.',a?.instrumentType==='ETC'),
   presentation:cell(r,'presentation',r.present.presentation,r.aiListingId?'Présentation ETF réservée aux fonds et produits cotés compatibles.':a?.instrumentType==='ETC'?'Fiche existante or, nature ETC conservée ; aucun statut ETF UCITS.':'Fiche existante de la part exacte ; caractéristiques, TER, encours et PEA gardent leurs sources et leurs dates.',Boolean(r.aiListingId)),
   indexBackstage:cell(r,'index',r.present.index,r.aiListingId?'Action individuelle ; aucun indice sous-jacent à présenter.':a?.instrumentType==='ETC'?'Or physique : aucun sujet d’indice déduit de cet ETC.':r.present.index?`Sujet existant ${index} ; performance et composition de l’indice, distinctes de celles du fonds.`:`Indice ${index} identifié et méthodologie consultée. Pas de jeu qualifié commun composition/poids/pays/secteurs et cinq années de rendement de la variante exacte ; composition ETF non substituée.`,Boolean(r.aiListingId)||a?.instrumentType==='ETC')},
  groups:CATEGORIES.filter(c=>profileIds.includes(c.id)&&c.ids.includes(r.id)).map(c=>c.id),
  automation:{monthly:src,monthlyWorkflow:'.github/workflows/update-market-monthly.yml',dailyLevelWorkflow:'.github/workflows/update-publication-observations.yml',classificationWorkflow:'.github/workflows/update-qualified-exposures.yml',independentOfAiHoldings:true,sharedObservations:'automated-monthly / automated-etf-monthly ; preuves monthly-automated ; change monthly-fx ; projections prébuild partagées'}}
 return report
})
const profiles=profileIds.map(id=>{
 const c=CATEGORIES.find(c=>c.id===id)
 try{
  const assets=c.ids.map(id=>convertAsset(RANKING_ASSETS[id],c.currency??'original',FX)),coverage=commonCoverage(assets)
  const sample=assets.map(a=>({id:a.id,returnPct:periodReturn(a,coverage.start,coverage.end)}))
  return {...c,status:'raccordé dans cette PR',coverage,modes:{current:['period',...(coverage.years.length?['year','years']:[])],annual:coverage.years.length>=2},annualBlocker:coverage.years.length<2?'Au moins deux années civiles communes ; une seule disponible.':null,sample}
 }catch(e){return {...c,status:'bloqué',reason:e.message}}
})
const report={checkedAt:now.toISOString(),scope:'29 actifs exacts ; 16 profils demandés ; statuts fondés sur les consommateurs actuels',matrix,profiles}
writeFileSync('docs/ai-tools-matrix.json',JSON.stringify(report,null,2)+'\n')
const safe=v=>String(v??'—').replaceAll('|','/').replaceAll('\n',' ')
const tools=Object.keys(matrix[0].tools)
const lines=['# Réutilisation des 29 actifs IA','',`Contrôle : ${report.checkedAt}. Avant : ${read('docs/ai-tools-before.json').commit}.`,'','Les statuts « déjà raccordé » portent sur les consommateurs vérifiés avant la PR. Une absence dans ce registre ne signifie jamais une absence de toute l’application. Le quotidien IA est une série synthétique distincte : aucune unité base 100 n’entre dans les historiques de cours.','', '## Identités et profondeur','', '| Actif / part exacte | Cotation retenue | Avant (mensuel) | Après (mensuel) |','|---|---|---|---|',...matrix.map(r=>`| ${safe(r.identity.name)} / ${r.identity.isin} | ${safe(r.identity.listing.symbol)} / ${safe(r.identity.listing.mic)} / ${r.identity.listing.currency} | ${safe(r.before.history.map(h=>`${h.start} → ${h.end}`).join('; ')||'Absent du registre mensuel vérifié ; présent IA')} | ${r.after.history.map(h=>`${h.start} → ${h.end} (${h.months} mois)`).join('; ')} |`),'','## Matrice exhaustive par outil et mode','']
for(const key of tools)lines.push(`### ${key}`,'','| Actif / ISIN | Conclusion | Motif et conditions |','|---|---|---|',...matrix.map(r=>`| ${safe(r.identity.name)} / ${r.identity.isin} | ${r.tools[key].status} | ${safe(r.tools[key].reason)} |`),'')
lines.push('## Comparaisons demandées','','Toutes les périodes sont communes, en EUR via les changes historiques BCE. Cours ajustés avec réinvestissement des revenus ; les frais de fonds sont inclus dans leur rendement, jamais attribués à un indice. Pas de duel Acc/Dist ajouté. Les profils existants cybersécurité, défense européenne, infrastructure IA et ETF mondiaux sont enrichis.','','| Profil | Actifs exacts | Période libre | Années civiles complètes | Modes |','|---|---|---|---|',...profiles.map(p=>`| ${safe(p.label)} | ${p.ids.join(', ')} | ${p.coverage?`${p.coverage.start} → ${p.coverage.end}`:safe(p.reason)} | ${p.coverage?.years.join(', ')??'—'} | ${p.modes?.annual?'Présentation actuelle et Classement annuel':`Présentation actuelle ; Classement annuel bloqué : ${safe(p.annualBlocker)}`} |`),'','## Sources, conventions et actualisation','','Le JSON joint conserve, pour chacune des 29 lignes, les sources et preuves de cotation, la classe, l’identifiant de société IA, la couverture quotidienne, les dates et méthodes mensuelles avant/après, les choix de devise, les bornes de continuité et leurs sources, les groupes, le collecteur et les workflows. Les pays BlackRock sont des pays de risque ; ils ne sont pas présentés comme des domiciles ou des répartitions de chiffre d’affaires.','','Les collectes mensuelles et clôtures récentes fonctionnent sur les sources configurées des consommateurs, indépendamment des positions IA. Les requêtes mensuelles et quotidiennes recoupent la dernière séance terminée ; aucun mois manquant interpolé. Une extension remplace la série entière par une cotation documentée de la même part et même devise, sans perdre les mois déjà qualifiés. Elle ne raccorde jamais deux places par concaténation. Le prébuild régénère les liens, rendements annuels pour les Duels, expositions et sélecteurs. Les échecs conservent les dernières observations validées et restent visibles.','','Les classements annuels requièrent deux années communes ; les Duels et portefeuilles manuels en requièrent trois. Nebius, Reddit et GE Vernova ne sont donc pas admis dans ces derniers. Les 20 actions restent exclues des tirages automatiques ETF. Aucun profil éditorial « DCA de » n’a été ajouté ; le DCA historique est celui du calculateur.','','Aucun changement aux règles, positions, ancrages ou observations des compétitions IA, ni aux outils exclus par la demande. Les limites relatives aux trois indices thématiques sont détaillées dans ai-tools-source-review.md.')
writeFileSync('docs/ai-tools-matrix.md',lines.join('\n')+'\n')
console.log(`AI reuse: ${matrix.length} assets × ${tools.length} tools/modes; ${profiles.length} profiles; ${profiles.filter(p=>p.modes?.annual).length} annual profiles.`)
