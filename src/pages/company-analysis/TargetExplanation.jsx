import { targetExplanation } from './targetExplanation.js'
import { formatValue as n } from './valuationPresentation.js'
import { dateLabel } from './lib.js'

export default function TargetExplanation({company,model,selected,method,reading}) {
  const x=targetExplanation(company,model,selected,method)
  if(!x)return null
  const money=v=>`${n(v,2)} ${company.currency}`
  const signed=v=>`${v>=0?'+':'−'}${money(Math.abs(v))}`
  return <section className="valuation-reading" data-testid="valuation-reading" aria-live="polite">
    <span className="valuation-eyebrow">💡 COMPRENDRE L’OBJECTIF</span>
    <h3>{reading.title}</h3><p data-testid="target-summary">{x.summary}</p>
    <p data-testid="target-bridge-reading">{x.bridgeText}</p>
    {x.context&&<div data-testid="scenario-context"><p>{x.context.growthText}</p><p>{x.context.multipleText}</p></div>}
    <p data-testid="target-coverage">{x.coverage}</p>
    <p><strong>📌 À garder en tête :</strong> {x.limitations[0]}</p>
    <details><summary>Comprendre le calcul et consulter les sources</summary>
      <h4>🧮 Comment l’objectif est calculé</h4>
      <p>{x.basis} : {money(x.fundamental)} × valorisation retenue {n(x.multiple,2)} = objectif {money(reading.value)}. Calcul effectué avant arrondi.</p>
      <p>{x.cash?'Les flux sont projetés à la date de l’objectif.':`Le bénéfice retenu correspond à l’exercice clos le ${dateLabel(x.period)}. Le PER prévisionnel porte sur l’exercice suivant l’échéance, pas sur le dernier bénéfice publié.`}</p>
      <div className="company-history-scroll"><table data-testid="target-bridge"><caption>Du cours actuel à l’objectif — effets successifs par action</caption><tbody>
        <tr><th>Dernière clôture</th><td>{money(model.inputs.price)}</td></tr>
        <tr><th>Évolution {x.cash?'de la trésorerie':'du bénéfice'} par action, à valorisation constante</th><td>{signed(x.fundamentalEffect)}</td></tr>
        <tr><th>Changement de valorisation : {n(x.currentMultiple,2)}× → {n(x.multiple,2)}×</th><td>{signed(x.multipleEffect)}</td></tr>
        <tr><th>Objectif</th><td>{money(reading.value)}</td></tr>
      </tbody></table></div>
      <p>On applique d’abord la variation du résultat, puis celle du multiple. L’effet combiné est compris dans la ligne « Changement de valorisation ». Le nombre d’actions est déjà pris en compte dans les données par action : aucun effet de rachats supplémentaire n’est ajouté.</p>
      <h4>📊 D’où viennent les projections</h4>
      <div className="company-history-scroll"><table data-testid="target-origins"><caption>Trajectoire du scénario sélectionné</caption><thead><tr><th>Horizon</th><th>{x.cash?'FCF/action':'BPA ajusté'}</th><th>Exercice de référence</th><th>Origine</th></tr></thead><tbody>{x.periods.map((p,i)=><tr key={i}><th>{i+1} an{i?'s':''}</th><td>{money(p.value)}</td><td>{dateLabel(p.end)}</td><td>{p.origin}</td></tr>)}</tbody></table></div>
      <p>{x.historyCount} exercices de comptes ; {x.multipleCount} références de valorisation. Données de la méthode datées du {dateLabel(x.sourceDate)}.</p>
      <p>{model.evidence[method].rationale}</p>
      <p>{x.anchorExplanation}</p>
      {x.methodComparison&&<p data-testid="method-comparison">{x.methodComparison}</p>}
      <p>{model.evidence[method].trajectory}</p>
      <h4>👀 Ce qui peut changer le résultat</h4>
      <ul>{x.limitations.map(t=><li key={t}>{t}</li>)}</ul>
      <p>À croissance identique, un multiple de {n(reading.sensitivity.lowerMultiple)} à {n(reading.sensitivity.upperMultiple)} donne un objectif de {money(reading.sensitivity.low)} à {money(reading.sensitivity.high)}.</p>
      <p><a href={model.evidence[method].sourceUrl} target="_blank" rel="noreferrer">Consulter la source des données</a></p>
    </details>
  </section>
}
