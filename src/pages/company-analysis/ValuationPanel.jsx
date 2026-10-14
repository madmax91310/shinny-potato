import { useState } from 'react'
import { buildScenarios } from './valuation.js'
import { dateLabel } from './lib.js'
import { formatValue as n, valuationChart, valuationReading } from './valuationPresentation.js'
import ValuationChart from './ValuationChart.jsx'

export default function ValuationPanel({company}) {
  const [overrides,setOverrides]=useState({}), [selected,setSelected]=useState(1), [preferred,setPreferred]=useState('cash')
  const automatic=buildScenarios(company), inputs=automatic.inputs
  const method=preferred==='cash'&&inputs.cashReady?'cash':preferred==='earnings'&&inputs.earningsReady?'earnings':inputs.cashReady?'cash':inputs.earningsReady?'earnings':'history'
  let model,error
  try {model=buildScenarios(company,overrides)}catch(e){error=e.message}
  const selectedScenario=model?.scenarios[selected], reading=valuationReading(model,selected,method)
  const chart=valuationChart(company,model,error?'history':method)
  const cash=method==='cash', price=inputs.price, currency=company.currency
  const metric=(label,value,hint)=><div><dt>{label}</dt><dd>{value}</dd><small>{hint}</small></div>
  function change(index,field,value){setOverrides(old=>({...old,[index]:{...old[index],[field]:value}}))}
  return <section className="valuation-studio" aria-label="Scénarios de valorisation" data-testid="company-valuation">
    <header className="valuation-heading"><div><span className="valuation-eyebrow">L’ENTREPRISE, À CE PRIX</span><h2>{company.name}</h2><span>{company.symbol} · {company.sector}</span></div><div className="valuation-price"><small>Dernière clôture{price&&company.quote?` · ${dateLabel(company.quote.asOf)}`:''}</small><strong>{n(price,2)} <span>{currency}</span></strong></div></header>
    <dl className="valuation-metrics">
      {metric('PER',n(inputs.pe),'Bénéfices publiés')}
      {metric('PER forward',n(inputs.forwardPE),'Prochain exercice estimé')}
      {metric('FCF / action',inputs.cashReady?`${n(inputs.cashBase,2)} ${currency}`:'—',`Exercice ${company.annual?.end?.slice(0,4)??'—'}`)}
      {metric('Rendement FCF',inputs.cashReady?`${n(inputs.cashBase/price*100)} %`:'—','FCF annuel / cours')}
    </dl>
    <div className="valuation-main">
      <div className="valuation-thesis"><span className="valuation-eyebrow">{cash?'CROISSANCE EXIGÉE PAR LE COURS':method==='earnings'?'VALEUR SELON TES HYPOTHÈSES':'HISTORIQUE FINANCIER'}</span>
        <strong className="valuation-hero">{cash?n(selectedScenario?.requiredGrowth==null?null:selectedScenario.requiredGrowth*100):n(reading?.value,2)}<small>{cash?' % / an':` ${currency}`}</small></strong>
        <p>{cash?`Pendant ${selectedScenario?.cashAssumptions.years??10} ans, avec le rendement exigé et le multiple de sortie du scénario sélectionné.`:method==='earnings'?'Prix de revente actualisé sur cinq ans, hors dividendes.':'Le modèle sera activé automatiquement dès que ses données seront qualifiées.'}</p>
        {cash&&<div className="valuation-return"><span>Rendement implicite du scénario</span><strong>{n(selectedScenario?.expectedReturn==null?null:selectedScenario.expectedReturn*100)} % / an</strong></div>}
        {(inputs.cashReady||inputs.earningsReady)&&<div className="valuation-method" role="group" aria-label="Méthode de valorisation">
          <button type="button" disabled={!inputs.cashReady} aria-pressed={cash} onClick={()=>setPreferred('cash')}>Flux de trésorerie</button>
          <button type="button" disabled={!inputs.earningsReady} aria-pressed={method==='earnings'} onClick={()=>setPreferred('earnings')}>Bénéfices</button>
        </div>}
      </div>
      <ValuationChart chart={chart} selected={selected}/>
    </div>
    {(inputs.cashReady||inputs.earningsReady)&&<>
      <div className="valuation-scenarios" role="group" aria-label="Choisir un scénario">{automatic.scenarios.map((s,i)=>{
        const result=model?.scenarios[i],a=cash?result?.cashAssumptions:result?.earningsAssumptions,value=cash?result?.cash?.value:result?.earnings
        return <button type="button" key={s.name} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`scenario-${i}`}><span>{s.name}</span><strong>{n(value,2)} <small>{currency}</small></strong><small>{a?`${n(a.growth*100)} % / an · sortie ${n(a.multiple)}×`:'Hypothèses à corriger'}</small></button>
      })}</div>
      <details className="valuation-assumptions"><summary>Ajuster les hypothèses</summary><p>Scénarios préremplis automatiquement. Les multiples 15 / 20 / 25 et le rendement exigé de 10 % sont des conventions de départ, pas un consensus.</p>
        <div className="company-history-scroll"><table><caption>Hypothèses modifiables · FCF : 10 ans · bénéfices : 5 ans</caption><thead><tr><th>Scénario</th><th>Croissance FCF</th><th>Croissance BPA</th><th>Rendement exigé</th><th>Multiple de sortie</th><th>Valeur FCF</th><th>Valeur bénéfices</th></tr></thead><tbody>{automatic.scenarios.map((s,i)=>{
          const a={...(s.cashAssumptions??s.earningsAssumptions),...overrides[i]},result=model?.scenarios[i]
          function input(label,field,value,min,max,step=.5){return <input aria-label={`${label} ${s.name}`} type="number" min={min} max={max} step={step} value={Number.isFinite(value)?Math.round(value*100)/100:''} onChange={e=>change(i,field,e.target.value===''?NaN:Number(e.target.value)/(field==='multiple'?1:100))}/>}
          return <tr key={s.name}><th>{s.name}</th><td>{s.cashAssumptions?<>{input('Croissance FCF','cashGrowth',(overrides[i]?.cashGrowth??s.cashAssumptions.growth)*100,-50,50)} %</>:'—'}</td><td>{s.earningsAssumptions?<>{input('Croissance BPA','earningsGrowth',(overrides[i]?.earningsGrowth??s.earningsAssumptions.growth)*100,-50,50)} %</>:'—'}</td><td>{input('Rendement','discount',a.discount*100,1,50)} %</td><td>{input('Multiple','multiple',a.multiple,1,60,1)}</td><td>{n(result?.cash?.value,2)}</td><td>{n(result?.earnings,2)}</td></tr>
        })}</tbody></table></div><button className="valuation-reset" type="button" onClick={()=>setOverrides({})}>Rétablir les scénarios automatiques</button>
      </details>
    </>}
    {error&&<p role="alert" className="valuation-error">{error} Les projections sont masquées jusqu’à correction.</p>}
    {reading&&<section className="valuation-reading" data-testid="valuation-reading" aria-live="polite"><span className="valuation-eyebrow">CE QUE ÇA SIGNIFIE</span><h3>{reading.title}</h3><p>{reading.explanation}</p><p>{reading.expectation}</p><details><summary>Recul historique et sensibilité</summary>{reading.historical&&<p>{reading.historical}</p>}<p>En gardant la même croissance et le même rendement exigé, un multiple de sortie de {n(reading.sensitivity.lowerMultiple)} à {n(reading.sensitivity.upperMultiple)} donne une valeur de {n(reading.sensitivity.low,2)} à {n(reading.sensitivity.high,2)} {currency}.</p>{reading.terminalShare!==null&&<p>La valeur de revente représente {n(reading.terminalShare*100)} % de cette valorisation. Le résultat dépend donc aussi du prix auquel l’entreprise pourrait se négocier à terme.</p>}</details></section>}
    <footer className="valuation-footer"><span>Données actualisées automatiquement</span><span>Pas un conseil financier</span></footer>
    <details className="valuation-methodology"><summary>Sources, disponibilité et méthode</summary>
      {!inputs.cashReady&&<p>Modèle FCF suspendu : {inputs.reasons.join(' ')}</p>}{!inputs.earningsReady&&<p>Modèle bénéfices suspendu : BPA positif comparable et croissance estimée récente requis.</p>}
      <p>{automatic.rules}</p><p>{automatic.note}</p><p>FCF/action : dernier FCF annuel divisé par la moyenne diluée publiée, sur une base de divisions comparable. Ce nombre moyen n’est pas le nombre de titres à la clôture. Les projections utilisent cette base annuelle au départ du modèle, puis dix années à partir de la date du cours.</p><p>Les estimations Finviz peuvent utiliser une base comptable différente du BPA publié. Les deux méthodes restent séparées.</p>
      {company.valuationShareBasis&&<p><a href={company.valuationShareBasis.sourceUrl} target="_blank" rel="noreferrer">Contrôle des divisions d’actions</a> · {dateLabel(company.valuationShareBasis.observedAt)}</p>}
      {company.estimates&&<p><a href={company.estimates.sourceUrl} target="_blank" rel="noreferrer">Estimations de bénéfices</a> · {dateLabel(company.estimates.observedAt)}</p>}
      <p>Aucune donnée manquante n’est remplacée par zéro. Les hypothèses personnelles sont réinitialisées au changement d’entreprise.</p>
    </details>
  </section>
}
