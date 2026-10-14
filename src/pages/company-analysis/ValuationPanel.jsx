import { useState } from 'react'
import { buildScenarios } from './valuation.js'
const number = x => x == null ? 'Non calculable' : x.toLocaleString('fr-FR', {maximumFractionDigits: 2})
export default function ValuationPanel({company}) {
  const [overrides, setOverrides] = useState({})
  let model, error
  try { model = buildScenarios(company, overrides) } catch (e) { error = e.message }
  const automatic = buildScenarios(company)
  const inputs = automatic.inputs
  function change(index, field, value) {
    setOverrides(old => ({...old, [index]: {...old[index], [field]: value}}))
  }
  return <section className="company-decision" aria-label="Scénarios de valorisation" data-testid="company-valuation">
    <h2>Scénarios de valorisation</h2>
    <p>Calculs automatiques à partir des données publiées. Les hypothèses restent modifiables.</p>
    <p>PER : {number(inputs.pe)} · PER prévisionnel : {number(inputs.forwardPE)}.</p>
    {!inputs.cashReady && <p>Modèle FCF suspendu : {inputs.reasons.join(' ')}</p>}
    {!inputs.earningsReady && <p>Modèle bénéfices suspendu : BPA positif comparable et croissance estimée récente requis.</p>}
    {(inputs.cashReady || inputs.earningsReady) && <>
      <div className="company-history-scroll"><table>
        <caption>Hypothèses et estimations — {company.currency}</caption>
        <thead><tr><th>Scénario</th><th>Croissance FCF</th><th>Croissance BPA</th><th>Rendement exigé</th><th>Multiple de sortie</th><th>Valeur FCF</th><th>Valeur bénéfices</th></tr></thead>
        <tbody>{automatic.scenarios.map((s,i) => {
          const a = {...(s.cashAssumptions ?? s.earningsAssumptions),...overrides[i]}, result = model?.scenarios[i]
          return <tr key={s.name}><th>{s.name}</th>
            <td>{s.cashAssumptions ? <><input aria-label={`Croissance FCF ${s.name}`} type="number" min="-50" max="50" step=".5" value={numberInput((overrides[i]?.cashGrowth ?? s.cashAssumptions.growth)*100)} onChange={e=>change(i,'cashGrowth',e.target.value===''?NaN:Number(e.target.value)/100)} /> %</> : '—'}</td>
            <td>{s.earningsAssumptions ? <><input aria-label={`Croissance BPA ${s.name}`} type="number" min="-50" max="50" step=".5" value={numberInput((overrides[i]?.earningsGrowth ?? s.earningsAssumptions.growth)*100)} onChange={e=>change(i,'earningsGrowth',e.target.value===''?NaN:Number(e.target.value)/100)} /> %</> : '—'}</td>
            <td><input aria-label={`Rendement ${s.name}`} type="number" min="1" max="50" step=".5" value={numberInput(a.discount*100)} onChange={e=>change(i,'discount',e.target.value===''?NaN:Number(e.target.value)/100)} /> %</td>
            <td><input aria-label={`Multiple ${s.name}`} type="number" min="1" max="60" value={numberInput(a.multiple)} onChange={e=>change(i,'multiple',e.target.value===''?NaN:Number(e.target.value))} /></td>
            <td>{number(result?.cash?.value)}</td><td>{number(result?.earnings)}</td></tr>
        })}</tbody>
      </table></div>
      <button type="button" onClick={()=>setOverrides({})}>Rétablir les scénarios automatiques</button>
      {error && <p role="alert">{error}</p>}
      <p>FCF : horizon 10 ans. Bénéfices : horizon 5 ans, prix de revente actualisé hors dividendes. Les deux méthodes utilisent leurs propres croissances automatiques.</p>
      {model?.scenarios[1].cash && <p>Croissance du FCF exigée par le cours, hypothèses centrales : {number(model.scenarios[1].requiredGrowth==null?null:model.scenarios[1].requiredGrowth*100)} %. Rendement implicite : {number(model.scenarios[1].expectedReturn==null?null:model.scenarios[1].expectedReturn*100)} %.</p>}
      <details><summary>Méthodes, règles automatiques et limites</summary><p>{automatic.rules}</p><p>{automatic.note}</p><p>La croissance historique n’est pas une prévision. Les scénarios ne sont pas des recommandations d’achat. Aucun résultat n’est calculé avec une donnée manquante remplacée par zéro.</p></details>
    </>}
  </section>
}
function numberInput(x) { return Number.isFinite(x) ? Math.round(x*100)/100 : '' }
