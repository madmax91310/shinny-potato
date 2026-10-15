import { reverseComparison } from './scenarioContext.js'
import { useState } from 'react'
import { distributionCashAssumptions, requiredTargetGrowth, discountedCash, reverseCashGrowth, sensitivityGrid } from './valuationExplorer.js'
import { formatValue as n } from './valuationPresentation.js'

export default function ValuationExplorer({model,selected,method,currency}) {
  const [rate,setRate]=useState(10)
  const a=model.scenarios[selected]?.[method+'Assumptions']
  if(!a)return null
  const price=model.inputs.price,valid=Number.isFinite(rate)&&rate>0&&rate<=50
  const required=valid?requiredTargetGrowth(a,price,rate/100):null
  const breakeven=requiredTargetGrowth(a,price)
  const grid=sensitivityGrid(a,price)
  const distribution=method==='cash'?distributionCashAssumptions(model,selected):null
  const cash=distribution&&valid?discountedCash(distribution,rate/100):null
  const reverse=cash?reverseCashGrowth(distribution,price,rate/100):null
  const pct=v=>`${n(v*100)} %`,money=v=>`${n(v,2)} ${currency}`
  return <details className="valuation-explorer" data-testid="valuation-explorer"><summary>Ce que suppose le cours et ce qui fait varier l’objectif</summary>
    <p>🔎 On part ici du cours actuel pour chercher la croissance nécessaire. Le résultat dépend du multiple final choisi : il ne mesure pas directement les attentes réelles des investisseurs.</p>
    <p>Avec un multiple de sortie de {n(a.multiple)}×, une croissance de <strong data-testid="breakeven-growth">{pct(breakeven)} par an</strong> {method==='cash'?'du FCF':'du bénéfice ajusté'} par action ramènerait le cours au niveau actuel dans {a.years} ans, hors dividendes.</p>
    <p data-testid="breakeven-comparison">{reverseComparison(breakeven,a.growth)}</p>
    <label>Progression annualisée du cours visée, hors dividendes <input aria-label="Rendement annuel visé" type="number" min="0.5" max="50" step="0.5" value={Number.isFinite(rate)?rate:''} onChange={e=>setRate(e.target.value===''?NaN:Number(e.target.value))}/> %</label>
    {valid?<p>Pour viser {n(rate)} % par an avec ce même multiple, il faudrait une croissance de <strong data-testid="required-growth">{pct(required)} par an</strong>. C’est un calcul inverse à croissance constante, pas une prévision.</p>:<p role="alert">Choisis un rendement supérieur à 0 et inférieur ou égal à 50 %.</p>}
    {valid&&<p data-testid="required-comparison">{reverseComparison(required,a.growth)}</p>}
    {grid&&<div className="company-history-scroll"><table data-testid="valuation-sensitivity"><caption>Objectif de cours à {a.years} ans selon la croissance et le multiple de sortie</caption><thead><tr><th>Croissance / multiple</th>{grid.multiples.map((m,i)=><th key={i}>{n(m)}×</th>)}</tr></thead><tbody>{grid.rates.map((g,i)=><tr key={i}><th>{pct(g)} / an</th>{grid.rows[i].map((r,j)=><td key={j} className={i===1&&j===1?'sensitivity-selected':''}>{money(r.value)}<small>{pct(r.annualised)} / an</small></td>)}</tr>)}</tbody></table><p>La cellule centrale reproduit l’objectif sélectionné. Les autres cellules font varier la croissance de 2 points et le multiple de 20 %, dans les limites du modèle. Aucune probabilité n’est attribuée à ces variantes.</p></div>}
    {cash&&<section data-testid="reverse-dcf"><h3>💰 Quelle valeur aujourd’hui si les flux étaient distribués ?</h3><p>Le DCF ramène les flux futurs à une valeur aujourd’hui. Le calcul inverse cherche la croissance qui permettrait de retrouver le cours actuel.</p><p>Avec un nombre d’actions constant à partir de la date du cours, si les flux étaient distribués chaque année, leur valeur actualisée avec un rendement exigé de {n(rate)} % serait de <strong>{money(cash.value)}</strong> par action, revente finale comprise. La revente représente {pct(cash.terminalShare)} de cette valeur.</p><p>{reverse===null?'Aucune croissance constante entre −50 et +50 % ne reproduit le cours avec ces paramètres.':`Pour retrouver le cours actuel de ${money(price)}, il faudrait une croissance constante du FCF par action de ${pct(reverse)} par an avec ce rendement exigé et ce multiple final.`}</p><p>Cette valeur est estimée aujourd’hui. L’objectif de cours principal correspond au prix de revente futur. Ici, le FCF après intérêts est supposé distribué, avec financement net par dette nul. La variation du nombre d’actions intégrée aux objectifs automatiques est neutralisée : la même trésorerie ne peut pas financer des rachats et être entièrement distribuée. Une croissance personnalisée est interprétée à nombre d’actions constant. Le DCF et l’objectif peuvent donc utiliser des flux par action différents. Les besoins de financement futurs ne sont pas modélisés.</p></section>}
  </details>
}
