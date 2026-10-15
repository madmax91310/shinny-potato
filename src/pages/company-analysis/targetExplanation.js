import { formatValue as n } from './valuationPresentation.js'
// One explanation for screen and exports. No independent price forecast here.
export function targetExplanation(company, model, index, method) {
  const e=model?.evidence[method],s=model?.scenarios[index]
  const a=s?.[method+'Assumptions'],r=s?.[method+'Target']
  if(!e||!a||!r)return null
  const cash=method==='cash',customGrowth=!a.path
  const currentMultiple=model.inputs.price/a.base
  // Ordered bridge: fundamentals at the starting multiple, then revaluation.
  // Interaction belongs to the second term; share changes are already per-share.
  const fundamentalEffect=(r.fundamental-a.base)*currentMultiple
  const multipleEffect=r.fundamental*(a.multiple-currentMultiple)
  const rising=r.fundamental>a.base*1.005,falling=r.fundamental<a.base*.995
  const cheaper=a.multiple<currentMultiple*.995,dearer=a.multiple>currentMultiple*1.005
  const subject=cash?'La trésorerie disponible par action':'Le bénéfice par action'
  const movement=rising?'progresse':falling?'recule':'reste proche de son niveau de départ'
  let summary=`${subject} ${movement} dans ce scénario.`
  if(rising&&cheaper&&r.upside<0)summary+=' Cette progression ne compense pas une valorisation moins élevée : l’objectif reste inférieur au cours actuel.'
  else if(rising&&cheaper)summary+=' Cette progression compense une valorisation moins élevée et laisse un potentiel de hausse.'
  else if(dearer)summary+=' L’objectif suppose aussi que le marché paie plus cher chaque unité de résultat : cette hypothèse contribue au potentiel affiché.'
  else if(cheaper)summary+=' Une valorisation moins élevée pèse également sur l’objectif.'
  else summary+=' La valorisation retenue reste proche de celle du cours actuel.'
  const periods=e.periods.map((end,i)=>({end,value:a.path?.[i]??a.base*(1+a.growth)**(i+1),
    origin:customGrowth?'Réglage personnel':cash?'Projection du modèle':e.curve.find(p=>p.end===end)?.kind==='model'?'Extrapolation du modèle':index===1?'Estimation sourcée':'Estimation sourcée avec scénario appliqué'}))
  const lastEstimate=cash?null:company.targetForecast.points.filter(p=>p.kind==='estimate').at(-1)?.end
  const extrapolated=customGrowth?periods.length:cash?periods.length:periods.filter(p=>p.end>lastEstimate).length
  const coverage=customGrowth?'La croissance a été personnalisée : les résultats affichés suivent ce réglage.':cash?
    'Les flux futurs sont calculés à partir des comptes publiés ; ce ne sont pas des prévisions d’analystes.':
    `Les estimations publiées vont jusqu’à l’exercice ${lastEstimate?.slice(0,4)}. ${extrapolated?'Au-delà, la croissance est prolongée par le modèle pour calculer cet objectif.':'Cet objectif utilise uniquement les exercices couverts par ces estimations.'}`
  const other=s[cash?'earningsTarget':'cashTarget']
  const disagreement=other?Math.abs(r.value-other.value)/((r.value+other.value)/2):null
  const methodComparison=other?`Les deux méthodes donnent des objectifs différents : le bénéfice ajusté et la trésorerie après investissements ne décrivent pas la même chose. L’écart relatif entre leurs objectifs est de ${n(disagreement*100)} %, rapporté à leur moyenne. Aucun objectif moyen n’est calculé.`:null
  const anchorExplanation=customGrowth?'La croissance personnalisée remplace la convergence automatique : le même taux est appliqué chaque année.':`Après la période initiale, la croissance rejoint progressivement ${n(e.anchor*100)} % par an, une référence tirée de l’évolution passée du chiffre d’affaires. Ce prolongement peut être trop favorable ou trop prudent si l’activité change durablement.`
  const limitations=[
    ...(cash&&e.drivers.warning?[e.drivers.warning]:[]),
    ...(cash&&e.drivers.observedShares<0&&!e.drivers.fundingKnown?['Les données de financement sont insuffisantes pour prolonger les rachats : aucune baisse du nombre d’actions n’est projetée.']:[]),
    ...(s.customised?['Les hypothèses personnalisées remplacent tout ou partie des réglages automatiques.']:[]),
    ...(extrapolated&&!cash&&!customGrowth?['L’objectif sélectionné dépasse les prévisions disponibles : il dépend de la croissance prolongée par le modèle.']:[]),
    ...(cash?['Le modèle ne projette pas explicitement les acquisitions, les locations ni les financements futurs.']:[]),
    e.peerMedian?'Les comparables complètent la référence historique ; ils ne garantissent pas le multiple futur.':'Le multiple repose sur l’historique de l’entreprise, sans complément de comparables qualifiés.',
    ...(e.calibration.shortHistory?['L’historique utilisé pour les scénarios est court.']:[]),
    'Les écarts entre scénarios ne mesurent pas une probabilité de réalisation.'
  ]
  return {summary,coverage,limitations,methodComparison,disagreement,anchorExplanation,periods,lastEstimate,extrapolated,customGrowth,
    fundamental:r.fundamental,multiple:a.multiple,currentMultiple,fundamentalEffect,multipleEffect,
    historyCount:company.decision?.years?.length??0,multipleCount:e.calibration.multiples.count,
    sourceDate:e.asOf,period:e.periods.at(-1),cash,
    basis:cash?'FCF par action projeté à l’échéance':'BPA ajusté du premier exercice se terminant après l’échéance'}
}
