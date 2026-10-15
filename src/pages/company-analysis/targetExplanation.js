import { scenarioContext } from './scenarioContext.js'
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
  const subject=cash?'La trésorerie disponible par action':'Le bénéfice ajusté par action'
  const movement=rising?'progresse':falling?'recule':'reste proche de son niveau de départ'
  let summary=`${subject} ${movement} dans ce scénario.`
  if(rising&&cheaper&&Math.abs(r.upside)<.00005)summary+=' La progression du résultat compense le changement de multiple : l’objectif reste proche du cours actuel.'
  else if(rising&&cheaper&&r.upside<0)summary+=' Cette progression ne compense pas une valorisation moins élevée : l’objectif reste inférieur au cours actuel.'
  else if(rising&&cheaper)summary+=' Cette progression compense le prix plus faible payé pour chaque unité de résultat : l’objectif reste au-dessus du cours actuel.'
  else if(dearer)summary+=' Le calcul suppose aussi que le marché paie plus cher chaque unité de résultat. Cela relève l’objectif, sans garantir une hausse par rapport au cours actuel.'
  else if(cheaper)summary+=' Une valorisation moins élevée pèse également sur l’objectif.'
  else summary+=' La valorisation retenue reste proche de celle du cours actuel.'
  const periods=e.periods.map((end,i)=>({end,value:a.path?.[i]??a.base*(1+a.growth)**(i+1),
    origin:customGrowth?'Réglage personnel':cash?'Projection du modèle':e.curve.find(p=>p.end===end)?.kind==='model'?'Extrapolation du modèle':index===1?'Estimation sourcée':'Estimation sourcée avec scénario appliqué'}))
  const lastEstimate=cash?null:company.targetForecast.points.filter(p=>p.kind==='estimate').at(-1)?.end
  const extrapolated=customGrowth?periods.length:cash?periods.length:periods.filter(p=>p.end>lastEstimate).length
  const coverage=customGrowth?'La croissance a été personnalisée : les résultats affichés suivent ce réglage.':cash?
    'Le modèle part des comptes publiés pour projeter la trésorerie après investissements. Ces montants futurs sont calculés par l’outil, pas fournis par des analystes.':
    `Les estimations publiées vont jusqu’à l’exercice ${lastEstimate?.slice(0,4)}. ${extrapolated?'Pour les années suivantes, l’outil prolonge la croissance selon ses hypothèses.':'Cet objectif utilise uniquement les exercices couverts par ces estimations.'}`
  const other=s[cash?'earningsTarget':'cashTarget']
  const disagreement=other?Math.abs(r.value-other.value)/((r.value+other.value)/2):null
  const methodComparison=other?`Les deux méthodes regardent l’entreprise sous un angle différent : l’une part du bénéfice ajusté, l’autre de la trésorerie après investissements. Leurs objectifs peuvent donc s’écarter. L’écart relatif entre leurs objectifs est de ${n(disagreement*100)} %, rapporté à leur moyenne. Aucun objectif moyen n’est calculé.`:null
  const anchorExplanation=customGrowth?'La croissance personnalisée remplace la convergence automatique : le même taux est appliqué chaque année.':`Après la période initiale, la croissance rejoint progressivement ${n(e.anchor*100)} % par an, une référence tirée de l’évolution passée du chiffre d’affaires. Ce prolongement peut être trop favorable ou trop prudent si l’activité change durablement.`
  const limitations=[
    ...(cash&&e.drivers.warning?[e.drivers.warning]:[]),
    ...(cash&&e.drivers.observedShares<0&&!e.drivers.fundingKnown?['Les données de financement sont insuffisantes pour prolonger les rachats : aucune baisse du nombre d’actions n’est projetée.']:[]),
    ...(s.customised?['Les hypothèses personnalisées remplacent tout ou partie des réglages automatiques.']:[]),
    ...(extrapolated&&!cash&&!customGrowth?['L’objectif sélectionné dépasse les prévisions disponibles : il dépend de la croissance prolongée par le modèle.']:[]),
    ...(cash?['Le modèle ne projette pas explicitement les acquisitions, les locations ni les financements futurs.']:[]),
    e.peerMedian?'Les comparables complètent la référence historique ; ils ne garantissent pas le multiple futur.':'Le multiple repose sur l’historique de l’entreprise, sans complément de comparables qualifiés.',
    ...(e.calibration.shortHistory?['L’historique utilisé pour les scénarios est court.']:[]),
    'Prudent, central et favorable décrivent des hypothèses différentes. Ces noms ne disent pas quel scénario a le plus de chances de se réaliser.'
  ]
  const money=v=>`${n(Math.abs(v),2)} ${company.currency}`
  const effect=(v,label)=>Math.abs(v)<.005?`${label} a un effet inférieur à 0,01 ${company.currency}`:`${label} ${v>=0?'ajoute':'retire'} ${money(v)}`
  const bridgeText=`À partir du cours de ${n(model.inputs.price,2)} ${company.currency}, ${effect(fundamentalEffect,cash?"l’évolution du FCF par action":"l’évolution du bénéfice ajusté par action")}, puis ${effect(multipleEffect,"le changement de multiple")}. On arrive ainsi à ${n(r.value,2)} ${company.currency}. Les effets sont calculés dans cet ordre, avant arrondi ; ce ne sont pas deux rendements à additionner.`
  const context=scenarioContext(company,model,index,method)
  return {bridgeText,context,summary,coverage,limitations,methodComparison,disagreement,anchorExplanation,periods,lastEstimate,extrapolated,customGrowth,
    fundamental:r.fundamental,multiple:a.multiple,currentMultiple,fundamentalEffect,multipleEffect,
    historyCount:company.decision?.years?.length??0,multipleCount:e.calibration.multiples.count,
    sourceDate:e.asOf,period:e.periods.at(-1),cash,
    basis:cash?'FCF par action projeté à l’échéance':'BPA ajusté du premier exercice se terminant après l’échéance'}
}
