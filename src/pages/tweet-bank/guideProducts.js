import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getInstrumentName, getInstrumentPeaStatus } from '../../data/instruments.js'
import { PEA_REVIEWS_BY_ISIN } from '../../data/instrument-pea.js'
import { getInstrumentFacts } from '../../data/instrument-facts.js'
import { getCurrentIndexFacts } from '../../data/index-facts.js'

const date = value => value.slice(0, 10).split('-').reverse().join('/')
const pct = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %'
// Only these revised guides opt into living product slots. No personal or historical
// ranking is rewritten by an updated registry. Editorial review remains explicit.
const revisedIds = new Set([10, 17, 21, 27, 32, 48])
export function reviseProductGuide(tweet) {
  if (!revisedIds.has(tweet.id)) return tweet
  const sources = [], fields = []
  const add = (label, url, checkedAt) => { if (url && !sources.some(s => s.url === url)) sources.push({ label, url, checkedAt }) }
  function product(isin, { pea = false } = {}) {
    const r = AUTOMATED_ETF[isin], proof = r?.characteristicChecks?.terPct
    if (!Number.isFinite(r?.characteristics?.terPct) || !proof?.checkedAt || !proof?.sourceUrl) throw new Error(`Frais du guide non qualifiés : ${isin}`)
    const facts = getInstrumentFacts(isin), status = getInstrumentPeaStatus(isin), peaProof = PEA_REVIEWS_BY_ISIN[isin]
    if (pea && status !== true) throw new Error(`PEA du guide non qualifié : ${isin}`)
    add(`${isin} · frais et caractéristiques de la part`, proof.sourceUrl, proof.checkedAt)
    fields.push({ isin, field: 'terPct', checkedAt: proof.checkedAt, sourceUrl: proof.sourceUrl })
    if (peaProof?.sourceUrl) {
      add(`${isin} · statut PEA de la part`, peaProof.sourceUrl, peaProof.checkedAt)
      fields.push({ isin, field: 'pea', checkedAt: peaProof.checkedAt, sourceUrl: peaProof.sourceUrl })
    }
    return `${getInstrumentName(isin)}\n🆔 ${isin} · 💸 Frais annuels : ${pct(r.characteristics.terPct)}\n${facts.distribution}${status === true ? ' · éligible au PEA' : status === false ? ' · hors PEA' : ''}`
  }
  function index(id) {
    const f = getCurrentIndexFacts(id)
    add(`${f.index} · composition au ${f.asOf}`, f.source.url, f.source.checkedAt)
    fields.push({ id, field: 'indexComposition', asOf: f.asOf, checkedAt: f.source.checkedAt, sourceUrl: f.source.url })
    return f
  }
  const footer = '\n\nLes frais indiqués sont ceux des fonds, hors courtage et fiscalité. Une cotation en euros ne supprime pas le risque de change. Pas un conseil financier.'
  let text
  const notes = []
  if (tweet.id === 10) {
    const world = index('world'), acwi = index('acwi')
    text = `Quels ETF regarder pour commencer à comparer les grandes expositions ? Voici des exemples sur PEA et CTO 👇\n\n🌍 MSCI World\nGrandes et moyennes entreprises des pays développés : ${world.constituents.toLocaleString('fr-FR')} titres au ${date(world.asOf)}.\n${product('FR001400U5Q4', {pea:true})}\n\n${product('IE00B4L5Y983')}\n\n🌏 Marchés émergents\n${product('FR0013412020', {pea:true})}\n\n${product('IE00BTJRMP35')}\nCes deux fonds suivent des indices différents : la part Amundi applique des filtres ESG et climat, absents de l’indice émergent classique de Xtrackers.\n\n🇺🇸 S&P 500\nDe grandes entreprises américaines sélectionnées selon les règles de l’indice, au-delà de leur seule taille.\n${product('FR0011550185', {pea:true})}\n\n${product('IE00B5BMR087')}\n\n💻 Nasdaq-100\nDe grandes entreprises non financières cotées au Nasdaq, avec une place importante de la technologie.\n${product('FR0011871110', {pea:true})}\n\n${product('IE00B53SZB19')}\n\n🇪🇺 STOXX Europe 600\nGrandes, moyennes et petites entreprises européennes.\n${product('FR0011550193', {pea:true})}\n\n${product('LU0908500753')}\n\n🇪🇺 EURO STOXX 50\nDe grandes entreprises de la zone euro.\n${product('FR0007054358', {pea:true})}\n\n${product('IE0008471009')}\n\n🌍 MSCI ACWI\nPays développés et émergents : ${acwi.constituents.toLocaleString('fr-FR')} titres au ${date(acwi.asOf)}.\n${product('IE00B6R52259')}\n\n📈 MSCI World Momentum\nUne sélection selon la dynamique passée des cours, qui peut se retourner.\n${product('IE00BP3QZ825')}\n\nCes exemples se recoupent : les cumuler ne diversifie pas automatiquement ton portefeuille. Tu détiens quelles expositions ?` + footer
  }
  if (tweet.id === 17) {
    text = `Des ETF éligibles au PEA, classés par exposition pour retrouver les bonnes parts 👇\n\n🌍 Monde développé\n${product('FR001400U5Q4', {pea:true})}\n\n${product('IE0002XZSHO1', {pea:true})}\n\n🇺🇸 États-Unis\n${product('FR0011871128', {pea:true})}\n\n${product('FR0011871110', {pea:true})}\nLe S&P 500 et le Nasdaq-100 ne sélectionnent pas les mêmes entreprises.\n\n🇪🇺 Europe\n${product('FR0011550193', {pea:true})}\n\n${product('LU1681047236', {pea:true})}\n\n${product('FR0013412038', {pea:true})}\nLe STOXX 600 et le MSCI Europe incluent notamment le Royaume-Uni et la Suisse ; l’EURO STOXX 50 reste en zone euro.\n\n🌏 Émergents et Asie\n${product('FR0013412020', {pea:true})}\n\n${product('FR0013412012', {pea:true})}\nCes indices appliquent des filtres : ils ne reproduisent pas les indices émergents sans exclusions.\n\n${product('FR0011869320', {pea:true})}\n\n${product('FR0013411980', {pea:true})}\n\n${product('FR0013411998', {pea:true})}\nLes deux parts TOPIX se distinguent notamment par la couverture du yen en euros.\n\nUne petite part ne rend pas l’ETF moins cher en valorisation. Et il n’est pas nécessaire de réunir toutes ces lignes : leurs expositions se recoupent.\n\nTu as lesquelles dans ton PEA ?` + footer
    add('Amundi · CAC 40 ESG, fiche du 31/10/2026', 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681046931/FRA/FRA/RETAIL/ETF/20261031', '2026-11-08')
    notes.push('LU1681046931 : ancienne affirmation PEA retirée. La fiche Amundi au 31/10/2026 documente le CAC 40 ESG et cite compte-titres/assurance-vie, sans preuve PEA explicite ; aucune non-éligibilité déduite.')
  }
  if (tweet.id === 21) {
    text = `MSCI Europe, STOXX Europe 600 ou EURO STOXX 50 : quelle exposition européenne choisir ? 👇\n\n🌍 STOXX Europe 600\nGrandes, moyennes et petites entreprises de plusieurs pays européens, dont le Royaume-Uni et la Suisse.\n${product('FR0011550193', {pea:true})}\n\n💶 EURO STOXX 50\nDe grandes entreprises de la zone euro, avec une sélection plus resserrée.\n${product('IE00B53L3W79', {pea:true})}\n\n${product('IE00B4K6B022', {pea:true})}\nAttention aux revenus : la part iShares capitalise, la part HSBC distribue.\n\n🌍 MSCI Europe\nGrandes et moyennes entreprises des pays développés européens, dont le Royaume-Uni et la Suisse.\n${product('FR0013412038', {pea:true})}\n\n📊 Performances calendaires des parts en euros, revenus réinvestis et frais du fonds inclus\n`
    for (const isin of ['FR0013412038','FR0011550193','IE00B53L3W79']) {
      const r = AUTOMATED_ETF[isin], p = r.performance
      if (p?.basis !== 'fund' || p.currency !== 'EUR' || ![2023,2024,2025].every(y => Number.isFinite(p.years[y]))) throw new Error(`Calendrier du guide non qualifié : ${isin}`)
      text += `\n${getInstrumentName(isin)}\n${[2023,2024,2025].map(y => `${y} : ${p.years[y] > 0 ? '+' : ''}${pct(p.years[y])}`).join(' · ')}\n`
      add(`${isin} · performances historiques 2023–2025`, p.sourceUrl ?? r.sourceUrl, p.checkedAt)
      fields.push({isin,field:'calendarReturns',checkedAt:p.checkedAt,sourceUrl:p.sourceUrl ?? r.sourceUrl})
    }
    text += '\nCes années restent des observations historiques, pas un classement actuel. La zone couverte et la concentration comptent autant que les frais. Tu choisis une exposition européenne large ou la zone euro ?' + footer
  }
  if (tweet.id === 27) {
    text = `Comment départager des ETF MSCI World sur PEA ? Voici trois parts dont l’éligibilité est documentée 👇\n\n${['FR001400U5Q4','IE0002XZSHO1','LU1681043599'].map(isin => product(isin, {pea:true})).join('\n\n')}\n\n🔎 Les critères à comparer\n\nLes frais annuels comptent, mais l’écart réel avec l’indice dépend aussi de la réplication et des revenus. Compare des périodes et des devises identiques.\n\nL’encours donne une indication sur la taille du fonds ou de la part. Un petit encours ne signifie pas une fermeture certaine ; un gros encours ne garantit pas à lui seul un faible écart entre prix d’achat et de vente.\n\nLa devise de la part et celle de la cotation sont deux choses différentes. Les frais de conversion dépendent de la cotation choisie et du courtier.\n\nCes trois parts capitalisent les revenus. Avec une part distribuante, le cash arrive dans le PEA et reste à réinvestir si tu souhaites le maintenir investi.\n\nCette liste n’est pas un inventaire exhaustif du marché. Tu regardes quel critère en premier ?` + footer
    for (const isin of ['LU2655993207','LU1681043672']) add(`${isin} · fiche officielle du 31/10/2026, devise et distribution`, `https://www.amundietf.fr/pdfDocuments/monthly-factsheet/${isin}/FRA/FRA/RETAIL/ETF/20261031`, '2026-11-08')
    notes.push('LU2655993207 (EUR Dist) et LU1681043672 (USD Acc) restent identifiées dans les sources de revue. Leurs fiches officielles confirment ces devises et distributions, mais ne suffisent pas à qualifier leur statut PEA. Anciennes affirmations PEA et encours non datés retirés, sans les transformer en parts non éligibles.')
  }
  if (tweet.id === 32) {
    text = '🌍 MSCI World, MSCI ACWI ou FTSE All-World : ces trois indices ne couvrent pas les mêmes marchés. Voici leurs différences et des exemples d’ETF 👇'
    for (const [id, label, isins] of [['world','MSCI World',['FR001400U5Q4']],['acwi','MSCI ACWI',['FR0014017NX3','IE00B6R52259']],['ftse-all-world','FTSE All-World',['IE00BK5BQT80']]]) {
      const f = index(id)
      text += `\n\n${label}\n${f.markets} · ${f.constituents.toLocaleString('fr-FR')} titres au ${date(f.asOf)}.\n${isins.map(isin => product(isin)).join('\n\n')}`
      text += `\n\nTrois premiers pays de l’indice au ${date(f.asOf)} : ${f.countries.slice(0,3).map(([name,weight]) => `${name} ${pct(weight)}`).join(' · ')}.`
    }
    text += '\n\nLe World laisse les émergents de côté ; ACWI et All-World les incluent, avec des méthodes de sélection et des pondérations différentes. Aucun de ces trois indices ne couvre à lui seul toutes les petites capitalisations.\n\nLes pays des indices ne se déduisent pas du domicile des ETF. Tu choisis ton indice avant de comparer les parts disponibles ?' + footer
    notes.push('Anciennes performances YTD, sur un an et annualisées sans bornes, poids et comptages non datés retirés. Composition actuelle issue des seuls registres d’indices ; aucun portefeuille de fonds substitué à un indice.')
  }
  if (tweet.id === 48) {
    text = tweet.text.replace(/[^\n]+\n🎫[^\n]*?🆔 ([A-Z]{2}[A-Z0-9]{9}\d)[^\n]*/g, (_line, isin) => product(isin, {pea:true}))
  }
  return { ...tweet, text, sources, reviewedAt: '2026-11-08', reviewNotes: notes,
    dataContract: { kind: 'live-guide', fields, remaining: 'Revue éditoriale du 08/11/2026 ; chaque champ conserve la date de sa propre preuve.' } }
}
