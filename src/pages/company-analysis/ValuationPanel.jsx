import { useEffect, useState } from 'react'
import TargetExplanation from './TargetExplanation.jsx'
import ForecastEvaluation from './ForecastEvaluation.jsx'
import ValuationPublication from './ValuationPublication.jsx'
import { buildPriceScenarios, targetChart, targetReading } from './priceTargets.js'
import { dateLabel, calculatedRatios } from './lib.js'
import { formatValue as n } from './valuationPresentation.js'
import ValuationChart from './ValuationChart.jsx'
import DataQualification from './DataQualification.jsx'
import ValuationExplorer from './ValuationExplorer.jsx'

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
      {metric('PER',n(inputs.pe),calculatedRatios(company,now).peTTM?'Bénéfices sur 12 mois':`Exercice ${company.annual?.end?.slice(0,4)??'—'}`)}{metric('PER prév. ajusté',n(automatic.evidence.earnings?inputs.price/automatic.evidence.earnings.base:null),'Base du modèle bénéfices')}
      {metric('FCF / action',Number.isFinite(inputs.reportedCashPerShare)?`${n(inputs.reportedCashPerShare,2)} ${currency}`:'—',`Exercice ${company.annual?.end?.slice(0,4)??'—'}`)}
      {metric('Rendement FCF',Number.isFinite(inputs.reportedCashPerShare)&&inputs.price?`${n(inputs.reportedCashPerShare/inputs.price*100)} %`:'—','FCF annuel / cours')}
    </dl>
    <p>Choisis un horizon et un scénario pour voir quel cours les hypothèses retenues pourraient donner. Tu peux ensuite les ajuster et comparer les deux méthodes.</p>
    <DataQualification company={company} model={automatic} now={now}/>
    <div className="valuation-horizon" role="group" aria-label="Horizon de prévision"><span>Objectifs à</span>{[1,3,5].map(h=><button type="button" key={h} aria-pressed={years===h} onClick={()=>setYears(h)}>{h} an{h>1?'s':''}</button>)}<span>{automatic.targetDate?dateLabel(automatic.targetDate):''}</span></div>
    <div className="valuation-main"><div className="valuation-thesis">
      <span className="valuation-eyebrow">{ready?`OBJECTIF ${automatic.scenarios[selected].name.toUpperCase()} À ${years} AN${years>1?'S':''}`:'PRÉVISION NON DISPONIBLE'}</span>
      <strong className="valuation-hero" data-testid="price-target">{n(reading?.value,2)}<small> {currency}</small></strong>
      {reading?<><p>Objectif de cours futur au {dateLabel(model.targetDate)}, selon les hypothèses ci-dessous.</p><div className="valuation-return"><span>Potentiel par rapport au cours</span><strong data-testid="target-upside">{pct(reading.upside)}</strong><span data-testid="target-annualised">{pct(reading.annualised)} / an · hors dividendes</span></div></>:<p>{error?'Corrige les hypothèses pour recalculer les objectifs.':'Les objectifs seront activés automatiquement lorsque les données nécessaires seront qualifiées.'}</p>}
      {ready&&<div className="valuation-method" role="group" aria-label="Méthode de valorisation"><button type="button" disabled={!inputs.earningsReady} aria-pressed={method==='earnings'} onClick={()=>setPreferred('earnings')}>Bénéfices</button><button type="button" disabled={!inputs.cashReady} aria-pressed={cash} onClick={()=>setPreferred('cash')}>Flux de trésorerie</button></div>}
    </div><ValuationChart chart={chart} selected={selected}/></div>
    {ready&&<>
      <div className="valuation-scenarios" role="group" aria-label="Choisir un scénario">{automatic.scenarios.map((s,i)=>{const r=model?.scenarios[i],a=cash?r?.cashAssumptions:r?.earningsAssumptions,t=cash?r?.cashTarget:r?.earningsTarget;return <button type="button" key={s.name} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`scenario-${i}`}><span>{s.name}</span><strong>{n(t?.value,2)} <small>{currency}</small></strong><span>{pct(t?.upside)} · {pct(t?.annualised)} / an</span><small>{a?`${n(a.growth*100)} % / an en moyenne · multiple final ${n(a.multiple)}×`:'Hypothèses à corriger'}</small></button>})}</div>
      {model?.orderChanged&&<p className="valuation-projection-note">Avec tes réglages, les objectifs ne suivent plus l’ordre prudent → central → favorable.</p>}
      <p className="valuation-projection-note">📌 Ces scénarios à {years} an{years>1?'s':''} dépendent des hypothèses retenues, hors dividendes. Le scénario central n’est pas une prévision certaine ; le prudent n’est pas un plancher de perte.</p>
      <details className="valuation-assumptions"><summary>Ajuster les hypothèses</summary><p>La croissance concerne le bénéfice ou le FCF par action, pas directement le cours. Le multiple indique combien le marché paierait pour une unité de ce résultat à l’échéance. Modifier la croissance remplace la trajectoire automatique par un taux constant chaque année.</p><p>{automatic.rules}</p>
        <div className="company-history-scroll"><table><caption>Objectif futur = {cash?'FCF/action':'BPA'} projeté × multiple de sortie</caption><thead><tr><th>Scénario</th><th>Croissance annualisée équivalente</th><th>Multiple de sortie</th><th>Objectif à {years} ans</th></tr></thead><tbody>{automatic.scenarios.map((s,i)=>{
          const original=cash?s.cashAssumptions:s.earningsAssumptions,field=cash?'cashGrowth':'earningsGrowth',multipleField=cash?'cashMultiple':'earningsMultiple'
          const growth=overrides[i]?.[field]??original.growth,multiple=overrides[i]?.[multipleField]??original.multiple
          const target=cash?model?.scenarios[i].cashTarget:model?.scenarios[i].earningsTarget
          return <tr key={s.name}><th>{s.name}</th><td><input type="number" aria-label={`Croissance ${cash?'FCF':'BPA'} ${s.name}`} min="-50" max="50" step="0.5" value={Number.isFinite(growth)?Math.round(growth*10000)/100:''} onChange={e=>change(i,field,e.target.value===''?NaN:Number(e.target.value)/100)}/> %</td><td><input type="number" aria-label={`Multiple ${s.name}`} min="0.01" max="500" step="0.5" value={Number.isFinite(multiple)?Math.round(multiple*100)/100:''} onChange={e=>change(i,multipleField,e.target.value===''?NaN:Number(e.target.value))}/></td><td>{n(target?.value,2)} {currency}</td></tr>
        })}</tbody></table></div><button type="button" className="valuation-reset" onClick={()=>setOverrides({})}>Rétablir les scénarios automatiques</button>
      </details>
    </>}
    {error&&<p role="alert" className="valuation-error">{error} Les prévisions sont masquées jusqu’à correction.</p>}
    {reading&&<TargetExplanation company={company} model={model} selected={selected} method={method} reading={reading}/>}
    {reading&&<ValuationExplorer model={model} selected={selected} method={method} currency={currency}/>}
    {cash&&automatic.evidence.cash&&<details className="valuation-methodology" data-testid="cash-drivers"><summary>Construction du FCF : trésorerie, investissements et actions</summary>
      <p>{automatic.evidence.cash.drivers.explanation}</p>
      {automatic.evidence.cash.drivers.warning&&<p className="valuation-projection-note">{automatic.evidence.cash.drivers.warning}</p>}
      <p>FCF / résultat net : {n(automatic.evidence.cash.drivers.conversion,2)}×. Rémunération en actions / trésorerie opérationnelle : {automatic.evidence.cash.drivers.sbc===null?'non disponible':`${n(automatic.evidence.cash.drivers.sbc*100)} %`}. Ces indicateurs servent à examiner la qualité du flux ; ils ne retirent pas automatiquement les éléments exceptionnels.</p>
      <div className="company-history-scroll"><table><caption>Composantes annuelles du scénario central automatique</caption><thead><tr><th>Exercice / origine</th><th>CA (millions)</th><th>Trésorerie opérationnelle (millions)</th><th>Investissements (millions)</th><th>Actions diluées (millions)</th><th>FCF/action</th></tr></thead><tbody>{automatic.evidence.cash.curve.slice(0,years+2).map(p=><tr key={p.end}><th>{p.end} · {p.kind==='published'?'publié':'modèle'}</th><td>{n(p.revenue/1e6)}</td><td>{n(p.ocf/1e6)}</td><td>{n(p.capex/1e6)}</td><td>{n(p.shares/1e6)}</td><td>{n(p.value,2)} {currency}</td></tr>)}</tbody></table></div><p>{automatic.evidence.cash.drivers.limits}</p>
    </details>}
    <ForecastEvaluation company={company}/>
    <details className="valuation-publication-details" onToggle={e=>setPublicationOpen(e.currentTarget.open)}><summary>Préparer la publication pour X</summary>{publicationOpen&&<ValuationPublication company={company} overrides={overrides} selected={selected} method={method} now={now} years={years}/>}</details>
    <footer className="valuation-footer"><span>Collecte automatique · disponibilité contrôlée</span><span>Pas un conseil financier</span></footer>
    <details className="valuation-methodology"><summary>Sources, disponibilité et méthode</summary><p>{automatic.note}</p><p>{automatic.rules}</p><p>Bénéfices : BPA ajusté du premier exercice se terminant après chaque échéance, associé à un PER prévisionnel ajusté. Les exercices sourcés et extrapolés sont distingués. FCF : croissance ramenée progressivement vers une référence de chiffre d’affaires. Le multiple rejoint progressivement celui du scénario ; cette trajectoire est une convention, pas une prévision des fluctuations de marché.</p>
      {!inputs.cashReady&&<p>Modèle FCF suspendu : {automatic.evidence.methodReasons.cash.join(' ')}</p>}{!inputs.earningsReady&&<p>Modèle bénéfices suspendu : {automatic.evidence.methodReasons.earnings.join(' ')}</p>}
      {company.quote?.sourceUrl&&<p><a href={company.quote.sourceUrl} target="_blank" rel="noreferrer">Cours de clôture · Yahoo Finance</a> · {dateLabel(company.quote.asOf)} · hors dividendes réinvestis.</p>}
      {company.targetForecast&&<p><a href={company.targetForecast.sourceUrl} target="_blank" rel="noreferrer">BPA ajustés et multiples historiques · Stock Analysis / S&amp;P Global</a> · {dateLabel(company.targetForecast.asOf)}</p>}
      {company.valuationShareBasis&&<p><a href={company.valuationShareBasis.sourceUrl} target="_blank" rel="noreferrer">Base comparable du FCF/action</a> · {dateLabel(company.valuationShareBasis.observedAt)}</p>}
    </details>
  </section>
}

