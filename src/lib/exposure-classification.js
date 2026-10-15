import { frenchCharacteristic } from '../data/french-characteristics.js'

// Qualification is tied to a known source contract, never to the ETF name.
// Issuer taxonomies remain separate: no inferred equivalence to GICS/ICB.
const broadSectors = new Set([
  'Technologie','Finance','Industrie','Santé','Consommation cyclique','Consommation de base',
  'Communication','Énergie','Matériaux','Immobilier','Services publics',
  'Liquidités et dérivés','Liquidités','Autres','Cash and/or Derivatives','Other',
])
const methods = [
  ['iShares','countries','Country of risk, all published holdings including cash/derivatives, no renormalisation','ishares-risk-net','Pays de risque · iShares','country-of-risk'],
  ['iShares','sectors','Sector of all published holdings, signed cash/derivatives included, no renormalisation','ishares-holdings-sector-net','Secteurs des positions · iShares','sector'],
  ['DWS','countries','Full physical securities portfolio; registration country and industry; net cash/derivatives retained','dws-registration-net','Pays d’enregistrement · DWS','registration-country'],
  ['Vanguard','countries','FTSE Country of Risk','vanguard-ftse-risk','Pays de risque FTSE · Vanguard','country-of-risk'],
  ['Vanguard','countries','Published bond market allocation (CNTRYATPCB)','vanguard-bond-market','Marchés obligataires · Vanguard','bond-market'],
  ['Vanguard','sectors','Published distribution by issuer, percent of fund; no equity sector substitution','vanguard-bond-issuer','Types d’émetteurs obligataires · Vanguard','issuer-type'],
  ['VanEck','sectors','Published Sector weights, percent of net assets, no renormalisation','vaneck-sector','Secteurs · VanEck','sector'],
  ['VanEck','sectors','Published SubIndustry weights, percent of net assets, no renormalisation','vaneck-subindustry','Sous-secteurs · VanEck','subindustry'],
]
const issuerHosts = {
 iShares:['blackrock.com','ishares.com'],DWS:['etf.dws.com'],Vanguard:['vanguard.co.uk','fund-docs.vanguard.com'],VanEck:['vaneck.com'],Amundi:['amundietf.fr','amundietf.com','amundi.com'],
}
const officialHost = (hostname,hosts=[]) => hosts.some(host=>hostname===host||hostname.endsWith('.'+host))

export function qualifyExposureClassification(observation, field) {
 if (!['countries','sectors'].includes(field) || !observation?.rows?.length) return null
 let url
 try { url=new URL(observation.sourceUrl) } catch { return null }
 if(url.protocol!=='https:' || !officialHost(url.hostname,issuerHosts[observation.provider]))return null
 const published=methods.find(([provider,type,method])=>provider===observation.provider&&type===field&&method===observation.method)
 if(published) {
  const [, ,method,id,label,level]=published
  return {id, label, level, method, sourceUrl:observation.sourceUrl, evidence:'published-method'}
 }
 // The official iShares endpoint has separate geography/countries and sector
 // components. Signed holdings-derived tables above deliberately use other IDs.
 if (observation.provider==='iShares' && !observation.method && observation.basis==='fund'
     && url.pathname.endsWith('/product-data/api/v2/get-product-data')
     && url.searchParams.get('component')?.split(',').includes('exposureBreakdowns')) {
  const component=field==='countries'?'exposureBreakdowns.geography.countries':'exposureBreakdowns.sector'
  if(observation.sourceComponent && observation.sourceComponent!==component)return null
  if(field==='sectors' && !observation.rows.every(r=>broadSectors.has(frenchCharacteristic(r.name))))return null
  return {id:`ishares-published-${field}`,label:field==='countries'?'Géographie publiée · iShares':'Secteurs publiés · iShares',
   level:field==='countries'?'issuer-geography':'sector',method:`Ventilation publiée dans ${component}, poids conservés sans renormalisation.`,
   sourceUrl:observation.sourceUrl,sourceComponent:component,evidence:observation.sourceComponent?'source-component':'documented-collector-contract'}
 }
 // Amundi's API explicitly distinguishes the physical fund from its benchmark.
 // Geography is qualified within that source only. Sector taxonomies of different
 // index families are not assumed equivalent merely because labels look alike.
 if(observation.provider==='Amundi' && !observation.method && field==='countries'
    && ['fund','index'].includes(observation.basis) && url.pathname==='/mapi/ProductAPI/getProductsData') {
  const component=observation.basis==='index'?'INDEX_COUNTRIES':'FUND_COUNTRIES'
  if(observation.sourceComponent && observation.sourceComponent!==component)return null
  return {id:`amundi-${component.toLowerCase()}`,label:'Géographie publiée · Amundi',level:'issuer-geography',
   method:`Ventilation ${component} de l’API Amundi, poids conservés sans renormalisation.`,sourceUrl:observation.sourceUrl,
   sourceComponent:component,evidence:observation.sourceComponent?'source-component':'documented-collector-contract'}
 }
 return null
}
