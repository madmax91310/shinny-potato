import { useEffect, useState } from 'react'
import ValuationPublication from './ValuationPublication.jsx'
import { buildPriceScenarios, targetChart, targetReading } from './priceTargets.js'
import { dateLabel } from './lib.js'
import { formatValue as n } from './valuationPresentation.js'
import ValuationChart from './ValuationChart.jsx'

const pct=v=>Number.isFinite(v)?`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`:'—'
export default function ValuationPanel({company}) {
  const [overrides,setOverrides]=useState({}),[selected,setSelected]=useState(1),[preferred,setPreferred]=useState('earnings'),[years,setYears]=useState(5)
  const [now,setNow]=useState(()=>new Date()),[publicationOpen,setPublicationOpen]=useState(false)
  useEffect(()=>{const refresh=()=>setNow(new Date()),timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}},[])
  const automatic=buildPriceScenarios(company,{},now,years),inputs=automatic.inputs
  const method=preferred==='cash'&&inputs.cashReady?'cash':preferred==='earnings'&&inputs.earningsReady?'earnings':inputs.earningsReady?'earnings':inputs.cashReady?'cash':'history'
  const cash=method==='cash',currency=company.currency
  let model,error
  try{model=buildPriceScenarios(company,overrides,now,years)}catch(e){error=e.message}
  const reading=targetReading(model,selected,method),chart=targetChart(company,model??automatic,error?'history':method)
  const ready=inputs.cashReady||inputs.earningsReady
  const metric=(label,value,hint)=><div><dt>{label}</dt><dd>{value}</dd><small>{hint}</small></div>
  function change(index,field,value){setOverrides(old=>({...old,[index]:{...old[index],[field]:value}}))}
  return <section className="valuation-studio" aria-label="Objectifs de cours" data-testid="company-valuation">
    <header className="valuation-heading"><div><span className="valuation-eyebrow">OBJECTIFS DE COURS</span><h2>{company.name}</h2><span>{company.symbol}</span></div><div className="valuation-price"><small>Dernière clôture{inputs.price?` · ${dateLabel(company.quote.asOf)}`:''}</small><strong>{n(inputs.price,2)} <span>{currency}</span></strong></div></header>
    <dl className="valuation-metrics">
      {metric('PER',n(inputs.pe),'Bénéfices publiés')}{metric('PER prév. ajusté',n(automatic.evidence.earnings?inputs.price/automatic.evidence.earnings.base:null),'Base du modèle bénéfices')}
      {metric('FCF / action',inputs.cashReady?`${n(inputs.cashBase,2)} ${currency}`:'—',`Exercice ${company.annual?.end?.slice(0,4)??'—'}`)}
      {metric('Rendement FCF',inputs.cashReady?`${n(inputs.cashBase/inputs.price*100)} %`:'—','FCF annuel / cours')}
    </dl>
    <div className="valuation-horizon" role="group" aria-label="Horizon de prévision"><span>Objectifs à</span>{[1,3,5].map(h=><button type="button" key={h} aria-pressed={years===h} onClick={()=>setYears(h)}>{h} an{h>1?'s':''}</button>)}<span>{automatic.targetDate?dateLabel(automatic.targetDate):''}</span></div>
    <div className="valuation-main"><div className="valuation-thesis">
      <span className="valuation-eyebrow">{ready?`OBJECTIF ${automatic.scenarios[selected].name.toUpperCase()} À ${years} AN${years>1?'S':''}`:'PRÉVISION NON DISPONIBLE'}</span>
      <strong className="valuation-hero" data-testid="price-target">{n(reading?.value,2)}<small> {currency}</small></strong>
      {reading?<><p>Objectif de cours futur au {dateLabel(model.targetDate)}, selon les hypothèses ci-dessous.</p><div className="valuation-return"><span>Potentiel par rapport au cours</span><strong data-testid="target-upside">{pct(reading.upside)}</strong><span data-testid="target-annualised">{pct(reading.annualised)} / an · hors dividendes</span></div></>:<p>{error?'Corrige les hypothèses pour recalculer les objectifs.':'Les objectifs seront activés automatiquement lorsque les données nécessaires seront qualifiées.'}</p>}
      {ready&&<div className="valuation-method" role="group" aria-label="Méthode de valorisation"><button type="button" disabled={!inputs.earningsReady} aria-pressed={method==='earnings'} onClick={()=>setPreferred('earnings')}>Bénéfices</button><button type="button" disabled={!inputs.cashReady} aria-pressed={cash} onClick={()=>setPreferred('cash')}>Flux de trésorerie</button></div>}
    </div><ValuationChart chart={chart} selected={selected}/></div>
    {ready&&<>
      <div className="valuation-scenarios" role="group" aria-label="Choisir un scénario">{automatic.scenarios.map((s,i)=>{const r=model?.scenarios[i],a=cash?r?.cashAssumptions:r?.earningsAssumptions,t=cash?r?.cashTarget:r?.earningsTarget;return <button type="button" key={s.name} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`scenario-${i}`}><span>{s.name}</span><strong>{n(t?.value,2)} <small>{currency}</small></strong><span>{pct(t?.upside)} · {pct(t?.annualised)} / an</span><small>{a?`${n(a.growth*100)} % annualisés équivalents · sortie ${n(a.multiple)}×`:'Hypothèses à corriger'}</small></button>})}</div>
      {model?.orderChanged&&<p className="valuation-projection-note">Avec tes réglages, les objectifs ne suivent plus l’ordre prudent → central → favorable.</p>}
      <p className="valuation-projection-note">Prévisions conditionnelles à {years} an{years>1?'s':''}, hors dividendes. Les scénarios ne sont ni des garanties ni des objectifs de cours d’analystes.</p>
      <details className="valuation-assumptions"><summary>Ajuster les hypothèses</summary><p>{automatic.rules}</p>
        <div className="company-history-scroll"><table><caption>Objectif futur = {cash?'FCF/action':'BPA'} projeté × multiple de sortie</caption><thead><tr><th>Scénario</th><th>Croissance annualisée équivalente</th><th>Multiple de sortie</th><th>Objectif à {years} ans</th></tr></thead><tbody>{automatic.scenarios.map((s,i)=>{
          const original=cash?s.cashAssumptions:s.earningsAssumptions,field=cash?'cashGrowth':'earningsGrowth',multipleField=cash?'cashMultiple':'earningsMultiple'
          const growth=overrides[i]?.[field]??original.growth,multiple=overrides[i]?.[multipleField]??original.multiple
          const target=cash?model?.scenarios[i].cashTarget:model?.scenarios[i].earningsTarget
          return <tr key={s.name}><th>{s.name}</th><td><input type="number" aria-label={`Croissance ${cash?'FCF':'BPA'} ${s.name}`} min="-50" max="50" step="0.5" value={Number.isFinite(growth)?Math.round(growth*10000)/100:''} onChange={e=>change(i,field,e.target.value===''?NaN:Number(e.target.value)/100)}/> %</td><td><input type="number" aria-label={`Multiple ${s.name}`} min="0.01" max="500" step="0.5" value={Number.isFinite(multiple)?Math.round(multiple*100)/100:''} onChange={e=>change(i,multipleField,e.target.value===''?NaN:Number(e.target.value))}/></td><td>{n(target?.value,2)} {currency}</td></tr>
        })}</tbody></table></div><button type="button" className="valuation-reset" onClick={()=>setOverrides({})}>Rétablir les scénarios automatiques</button>
      </details>
    </>}
    {error&&<p role="alert" className="valuation-error">{error} Les prévisions sont masquées jusqu’à correction.</p>}
    {reading&&<section className="valuation-reading" data-testid="valuation-reading" aria-live="polite"><span className="valuation-eyebrow">CE QUE CES DONNÉES SUGGÈRENT</span><h3>{reading.title}</h3><p>{reading.explanation}</p><p>{reading.expectation}</p><details><summary>Données de départ et sensibilité</summary><p>{reading.historical}</p><div className="company-history-scroll"><table><caption>Trajectoire centrale automatique avant personnalisations</caption><thead><tr><th>Échéance</th><th>{cash?'FCF/action projeté':'BPA ajusté prévisionnel'}</th><th>Exercice / origine</th></tr></thead><tbody>{model.evidence[method].values.map((v,i)=><tr key={i}><td>{i+1} an{i?'s':''}</td><td>{n(v,2)} {currency}</td><td>{cash?'Modèle à croissance variable':`${model.evidence.earnings.periods[i]} · ${model.evidence.earnings.curve.find(p=>p.end===model.evidence.earnings.periods[i]).kind==='model'?'extrapolation':'estimation sourcée'}`}</td></tr>)}</tbody></table></div><p>Source de la méthode : <a href={model.evidence[method].sourceUrl} target="_blank" rel="noreferrer">données du {dateLabel(model.evidence[method].asOf)}</a>.</p><p>Avec un multiple de sortie de {n(reading.sensitivity.lowerMultiple)} à {n(reading.sensitivity.upperMultiple)}, l’objectif passe de {n(reading.sensitivity.low,2)} à {n(reading.sensitivity.high,2)} {currency}, à croissance identique.</p></details></section>}
    <details className="valuation-publication-details" onToggle={e=>setPublicationOpen(e.currentTarget.open)}><summary>Préparer la publication pour X</summary>{publicationOpen&&<ValuationPublication company={company} overrides={overrides} selected={selected} method={method} now={now} years={years}/>}</details>
    <footer className="valuation-footer"><span>Données actualisées automatiquement</span><span>Pas un conseil financier</span></footer>
    <details className="valuation-methodology"><summary>Sources, disponibilité et méthode</summary><p>{automatic.note}</p><p>{automatic.rules}</p><p>Bénéfices : BPA ajusté du premier exercice se terminant après chaque échéance, associé à un PER prévisionnel ajusté. Les exercices sourcés et extrapolés sont distingués. FCF : croissance ramenée progressivement vers une référence de chiffre d’affaires. Le multiple rejoint progressivement celui du scénario ; cette trajectoire est une convention, pas une prévision des fluctuations de marché.</p>
      {!inputs.cashReady&&<p>Modèle FCF suspendu : {inputs.reasons.join(' ')}</p>}{!inputs.earningsReady&&<p>Modèle bénéfices suspendu : {inputs.reasons.join(' ')}</p>}
      {company.quote?.sourceUrl&&<p><a href={company.quote.sourceUrl} target="_blank" rel="noreferrer">Cours de clôture · Yahoo Finance</a> · {dateLabel(company.quote.asOf)} · hors dividendes réinvestis.</p>}
      {company.targetForecast&&<p><a href={company.targetForecast.sourceUrl} target="_blank" rel="noreferrer">BPA ajustés et multiples historiques · Stock Analysis / S&amp;P Global</a> · {dateLabel(company.targetForecast.asOf)}</p>}
      {company.valuationShareBasis&&<p><a href={company.valuationShareBasis.sourceUrl} target="_blank" rel="noreferrer">Base comparable du FCF/action</a> · {dateLabel(company.valuationShareBasis.observedAt)}</p>}
    </details>
  </section>
}
