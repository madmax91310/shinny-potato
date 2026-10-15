import { formatValue as n } from './valuationPresentation.js'
import { amount, dateLabel } from './lib.js'
import { targetExplanation } from './targetExplanation.js'

const signed=v=>`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`
const methods=[{key:'earnings',title:'💰 Prix projetés à partir des bénéfices',unit:'du bénéfice ajusté par action'},
  {key:'cash',title:'🏦 Prix projetés à partir de la trésorerie',unit:'de la trésorerie par action après investissements'}]

// The tweet covers every qualified method, independently of the image selection.
export function valuationTweet(company,model) {
  const available=methods.filter(m=>model.evidence[m.key])
  const {years,targetDate,inputs:{price},scenarios}=model
  const horizon=`${years} an${years>1?'s':''}`, money=v=>`${n(v,2)} ${company.currency}`
  const central=available.map(m=>({...m,target:scenarios[1][`${m.key}Target`]}))
  const rows=available.map(m=>`${m.title} :\n${scenarios.map(s=>`• ${s.name} : ${money(s[`${m.key}Target`].value)}`).join('\n')}`)
  const assumptions=available.map(m=>{
    const a=scenarios[1][`${m.key}Assumptions`],value=scenarios[1][`${m.key}Target`].value
    const growth=Math.abs(a.growth)<.00005?'une stabilité':`une ${a.growth<0?'baisse':'hausse'} moyenne de ${n(Math.abs(a.growth)*100)} % par an`
    return `Pour arriver à ${money(value)} avec ${m.key==='earnings'?'les bénéfices':'la trésorerie'}, le scénario central suppose ${growth} ${m.unit}. À l’arrivée, le marché devrait payer ${n(a.multiple)} fois ${m.key==='earnings'?'le bénéfice ajusté du premier exercice se terminant après cette échéance':'cette trésorerie annuelle'}.`
  })
  const returns=central.map(m=>`${m.key==='earnings'?'Bénéfices':'Trésorerie'} : ${signed(m.target.upside)}`).join(' ; ')
  let reading
  if(central.length===2) {
    const [earnings,cash]=central.map(m=>m.target.value)
    const position=central.every(m=>m.target.upside>0)?'Les deux scénarios centraux dépassent le cours de départ.'
      :central.every(m=>m.target.upside<0)?'Les deux scénarios centraux restent sous le cours de départ.'
      :central.some(m=>m.target.upside>0)&&central.some(m=>m.target.upside<0)?'Les scénarios centraux ne vont pas dans le même sens : l’un dépasse le cours de départ, l’autre reste en dessous.'
      :'Au moins un scénario central rejoint le cours de départ.'
    reading=`${position} ${money(Math.abs(earnings-cash))} séparent les deux projections.${Math.abs(earnings-cash)>=.005?` L’approche par ${cash<earnings?'la trésorerie':'les bénéfices'} donne le prix le moins élevé.`:''} Cet écart ne permet pas, à lui seul, de choisir la meilleure méthode.`
  } else reading=`Une seule approche est exploitable avec les données qualifiées. Son scénario central ${central[0].target.upside>0?'dépasse':central[0].target.upside<0?'reste sous':'rejoint'} le cours de départ ; aucune seconde projection ne vient compléter la lecture.`
  const prudent=available.map(m=>scenarios[0][`${m.key}Target`].upside)
  const risk=prudent.every(v=>v<0)?`${available.length===2?'Les deux scénarios prudents arrivent':'Le scénario prudent arrive'} sous le cours actuel. Une perte reste donc possible dans ces hypothèses.`
    :prudent.some(v=>v<0)?'Un des scénarios prudents arrive sous le cours actuel : le risque de baisse apparaît aussi dans les projections.'
    :'Même les scénarios prudents ne couvrent pas toutes les mauvaises surprises. Leurs résultats ne constituent pas un plancher pour le cours.'
  return [
    `🔎 ${company.name} cote ${money(price)}. Que pourrait valoir son action dans ${horizon} ?`,
    company.activity,
    Number.isFinite(company.annual?.revenue)?`Sur l’exercice clos le ${dateLabel(company.annual.end)}, son chiffre d’affaires atteint ${amount(company.annual.revenue,company.currency)}. Reste à voir ce que la suite pourrait donner pour quelqu’un qui achète l’action au cours de référence du ${dateLabel(company.quote.asOf)}.`:`Cours de référence : clôture du ${dateLabel(company.quote.asOf)}.`,
    available.length===2?'📊 Deux approches permettent d’explorer la question : l’une part des bénéfices ajustés, l’autre de la trésorerie disponible après les investissements.':'📊 La projection repose ici sur '+(available[0].key==='cash'?'la trésorerie disponible après les investissements.':'les bénéfices ajustés.'),
    `Trois scénarios au ${dateLabel(targetDate)} : prudent, central et favorable. Ils font varier la croissance et la valorisation retenues.`,
    ...rows,
    'Ces prix dépendent de ce qu’on suppose pour la suite.',
    ...assumptions,
    available.map(m=>targetExplanation(company,model,1,m.key).coverage).join(' '),
    'Si l’entreprise grandit moins vite, ou si le marché accepte de payer moins cher ses résultats, le prix projeté baisse.',
    `💡 Que montrent ces résultats ?\n${reading}`,
    `${returns}. Ce sont les variations cumulées du cours sur ${horizon}, hors dividendes, frais et fiscalité.${years>1?' Pas des rendements annuels.':''}`,
    risk,
    model.orderChanged?null:'Le scénario favorable repose sur des hypothèses plus optimistes. Le présenter seul donnerait une lecture incomplète.',
    company.watch?`👀 Le point à surveiller : ${company.watch}`:null,
    scenarios.some(s=>s.customised)?'Certaines hypothèses ont été personnalisées : ces résultats reprennent les réglages saisis.':null,
    model.orderChanged?'Les réglages personnalisés ont modifié l’ordre des prix : les noms des scénarios ne décrivent plus leur classement.':null,
    `Sources :\n${[...new Set([company.annual?.sourceUrl,company.quote?.sourceUrl,...available.map(m=>`${model.evidence[m.key].sourceUrl} · données du ${dateLabel(model.evidence[m.key].asOf)}`)])].filter(Boolean).join('\n')}`,
    '⚠️ Ces projections à une échéance future ne sont ni des valeurs actuelles ni des prix garantis. Le scénario central n’est pas forcément le plus probable.\nPas un conseil financier.',
  ].filter(Boolean).join('\n\n')
}
