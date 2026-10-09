import { useCallback, useMemo, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import ChoicePicker from '../../design-system/ChoicePicker'
import { downloadImage } from '../../design-system/downloadImage.js'
import { ENVELOPES, SCENARIOS, HORIZONS, SAVINGS, emptyPlan, examplePlan, newPocket } from './data.js'
import { validatePlan, project, envelopeAllocation, money, percent, buildTweet } from './lib.js'
import { renderProjectionImage } from './image.js'
import './style.css'

const STORAGE = 'epargnant-libre-wealth-v1'
const CEILINGS = Object.fromEntries(ENVELOPES.filter(e => e.ceiling).map(e => [e.id, e.ceiling]))
function NumberField({ label, value, onChange, min = 0, max = 1e9, step = 1 }) {
  return <label className="wealth-field"><span>{label}</span><input type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></label>
}
function Chart({ curves, years }) {
  const all = curves.flatMap(c=>c.points)
  const max = Math.max(1,...all.map(p=>p.capital)) * 1.08
  const min = 0
  const x = year => 105 + year / years * 675, y = value => 300 - (value - min) / (max - min) * 260
  const path = (points, field) => points.map((p,i)=>`${i?'L':'M'}${x(p.year)},${y(p[field])}`).join(' ')
  return <div className="wealth-chart"><svg viewBox="0 0 810 350" role="img" aria-label="Projection du capital pour les trois scénarios au fil des années">
    {[0,1,2,3,4].map(i=>{const v=min+(max-min)*i/4;return <g key={i}><line x1="105" x2="780" y1={y(v)} y2={y(v)} stroke="#31423e"/><text x="95" y={y(v)+5} textAnchor="end">{money(v)}</text></g>})}
    {curves.map(c=><path key={c.label} d={path(c.points,'capital')} stroke={c.color} fill="none" strokeWidth="3.5" strokeDasharray={c.dash.join(" ")} strokeLinecap="round" />)}

    <text x="105" y="335">Aujourd’hui</text><text x="780" y="335" textAnchor="end">{years} ans</text>
  </svg><div className="wealth-legend">{curves.map(c=><span key={c.label} style={{color:c.color}}><svg viewBox="0 0 45 12" aria-hidden="true"><line x1="1" y1="6" x2="44" y2="6" stroke={c.color} strokeWidth="3" strokeDasharray={c.dash.map(v=>v/2).join(" ")} strokeLinecap="round" /></svg>{c.label}</span>)}</div></div>
}
export default function App() {
  const [plan,setPlan] = useState(emptyPlan)
  const [tab,setTab] = useState('projection'), [message,setMessage] = useState(''), [draft,setDraft] = useState(null)
  const portfolio = plan.portfolios[plan.active]
  function change(update) { setPlan(current => {const next=structuredClone(current);update(next);return next});setDraft(null) }
  const computation = useMemo(()=>{
    try {
      validatePlan(plan)
      const results=Object.fromEntries(['a','b'].map(k=>[k,project(plan.portfolios[k],{...plan, ceilings:CEILINGS})]))
      const scenarios=SCENARIOS.map(s=>({...s,points:project(portfolio,{...plan,scenario:s.id,ceilings:CEILINGS}).points}))
      return {results,scenarios,allocation:envelopeAllocation(portfolio,results[plan.active])}
    } catch(error) {return {error:error.message}}
  },[plan,portfolio])
  const text = computation.results ? draft ?? buildTweet(plan,computation.results) : ''
  const renderImage = useCallback(()=>renderProjectionImage(plan,computation.scenarios),[plan,computation.scenarios])
  const patchPocket = (id,field,value) => change(next=>{next.portfolios[next.active].pockets.find(p=>p.id===id)[field]=value})
  const patchEvent = (index,field,value) => change(next=>{const e=next.portfolios[next.active].events[index];e[field]=value;if(field==='month')e.endMonth=Math.max(e.endMonth,value)})
  function saveFile(content,name,type) {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  async function importFile(event) {
    const file=event.target.files?.[0];if(!file)return
    try {if(file.size>1e6)throw new Error('Fichier trop volumineux (1 Mo maximum).');const next=validatePlan(JSON.parse(await file.text()));setPlan(next);setDraft(null);setMessage('Simulation importée.')}catch(error){setMessage(error.message)}finally{event.target.value=''}
  }
  function restore() {try {const raw=localStorage.getItem(STORAGE);if(!raw)throw new Error('Aucune sauvegarde locale.');setPlan(validatePlan(JSON.parse(raw)));setDraft(null);setMessage('Sauvegarde chargée.')}catch(error){setMessage(error.message)}}
  const result=computation.results?.[plan.active]
  const curves=computation.scenarios ?? []
  return <div className="wealth-simulator">
    <PageHeader title="Simulateur de patrimoine" subtitle="Projette ton patrimoine par enveloppe et prépare des comparaisons pour X." />
    <div className="wealth-toolbar">
      <Button variant="secondary" onClick={()=>{setPlan(examplePlan());setDraft(null);setMessage('Exemple fictif chargé : les rendements sont des hypothèses pédagogiques.')}}>Charger un exemple</Button>
      <Button variant="secondary" disabled={!!computation.error} onClick={()=>{try{localStorage.setItem(STORAGE,JSON.stringify(plan));setMessage('Simulation sauvegardée sur cet appareil.')}catch{setMessage('Stockage local indisponible : utilise l’export JSON.')}}}>Sauvegarder sur cet appareil</Button>
      <Button variant="secondary" onClick={restore}>Charger ma sauvegarde</Button>
      <Button variant="secondary" disabled={!!computation.error} onClick={()=>saveFile(JSON.stringify(plan,null,2),'simulation-patrimoine.json','application/json')}>Exporter JSON</Button>
      <label className="wealth-import">Importer JSON<input type="file" accept="application/json,.json" onChange={importFile}/></label>
      <Button variant="secondary" onClick={()=>{try{localStorage.removeItem(STORAGE);setMessage('Sauvegarde locale effacée.')}catch{setMessage('Stockage local indisponible.')}}}>Effacer la sauvegarde</Button>
    </div>
    <p className="wealth-note">Les montants restent dans ton navigateur. La sauvegarde est volontaire ; les exports contiennent les données affichées.</p>
    <div role="group" aria-label="Mode du simulateur" className="wealth-tabs">{[['personal','Mon patrimoine'],['compare','Comparaison pour X']].map(([id,label])=><button key={id} aria-pressed={plan.mode===id} onClick={()=>change(p=>{p.mode=id})}>{label}</button>)}</div>
    <ToolWorkspace renderImage={computation.error ? undefined : renderImage} imageAlt="Graphique du patrimoine : scénarios prudent, central et favorable" imageDisabled={!!computation.error} actions={<>
      <Button disabled={!!computation.error} onClick={async()=>{try{await navigator.clipboard.writeText(text);setMessage('Texte copié.')}catch{setMessage('Copie indisponible : sélectionne le texte du brouillon.')}}}>Copier le texte</Button>
      <Button disabled={!!computation.error} onClick={()=>{try{downloadImage(renderImage(),'projection-patrimoine.png');setMessage('Image téléchargée.')}catch(e){setMessage(e.message)}}}>Télécharger l’image</Button>
      <Button disabled={!!computation.error} variant="secondary" onClick={()=>{
        const keys=plan.mode==='compare'?['a','b']:[plan.active]
        const rows=['patrimoine;annee;capital;capital_reel;versements_cumules;retraits;gains;especes;capital_apres_taxe_hypothetique',...keys.flatMap(k=>computation.results[k].points.map(p=>[k,p.year,p.capital,p.real,p.paid,p.withdrawn,p.gains,p.cash,p.afterTax].map(v=>typeof v==='number'?v.toFixed(2).replace('.',','):v).join(';')))]
        saveFile(rows.join('\n'),'projection-patrimoine.csv','text/csv;charset=utf-8')
      }}>Exporter les projections CSV</Button>
      <span role="status">{message}</span>
    </>}>
      <section className="tool-settings wealth-settings">
        <div className="wealth-panel"><h2>Horizon et hypothèses communes</h2>
          <div className="wealth-fields"><NumberField label="Durée (années)" value={plan.years} min={1} max={50} onChange={v=>change(p=>{p.years=v})}/><NumberField label="Inflation annuelle (%)" value={plan.inflation} min={-20} max={30} step={0.1} onChange={v=>change(p=>{p.inflation=v})}/></div>
          <div className="wealth-tabs">{HORIZONS.map(n=><button key={n} aria-pressed={plan.years===n} onClick={()=>change(p=>{p.years=n})}>{n} ans</button>)}</div>
          <ChoicePicker aria-label="Scénario à publier" value={plan.scenario} onChange={e=>change(p=>{p.scenario=e.target.value})}>{SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</ChoicePicker>
        </div>
        {plan.mode==='compare' && <div className="wealth-panel"><ChoicePicker aria-label="Patrimoine à modifier" value={plan.active} onChange={e=>change(p=>{p.active=e.target.value})}><option value="a">Patrimoine A</option><option value="b">Patrimoine B</option></ChoicePicker>
          <Button variant="secondary" onClick={()=>change(p=>{p.portfolios[p.active==='a'?'b':'a']=structuredClone(p.portfolios[p.active]);p.portfolios[p.active==='a'?'b':'a'].name=`Copie de ${p.portfolios[p.active].name}`})}>Copier vers l’autre patrimoine</Button>
          {computation.results && <p>Capital initial A/B : {money(computation.results.a.points[0].capital)} / {money(computation.results.b.points[0].capital)}. Versements mensuels A/B : {money(plan.portfolios.a.pockets.reduce((s,p)=>s+p.monthly,0))} / {money(plan.portfolios.b.pockets.reduce((s,p)=>s+p.monthly,0))}. Les budgets peuvent être différents.</p>}
        </div>}
        <label className="wealth-field"><span>Nom du patrimoine</span><input maxLength={100} value={portfolio.name} onChange={e=>change(p=>{p.portfolios[p.active].name=e.target.value})}/></label>
        {portfolio.pockets.map(p=><article className="wealth-panel" key={p.id}>
          <div className="wealth-row"><h2>{p.name}</h2><button className="wealth-remove" aria-label={`Supprimer ${p.name}`} onClick={()=>change(next=>{const a=next.portfolios[next.active];a.pockets=a.pockets.filter(x=>x.id!==p.id);a.events=a.events.filter(e=>e.pocketId!==p.id)})}>Retirer</button></div>
          <label className="wealth-field"><span>Nom de la poche</span><input maxLength={100} value={p.name} onChange={e=>patchPocket(p.id,'name',e.target.value)}/></label>
          <div className="wealth-fields"><NumberField label="Capital actuel (€)" value={p.initial} onChange={v=>patchPocket(p.id,'initial',v)}/><NumberField label="Versement mensuel (€)" value={p.monthly} max={1e7} onChange={v=>patchPocket(p.id,'monthly',v)}/></div>
          <div className="wealth-rates">{SCENARIOS.map(s=><NumberField key={s.id} label={`${s.label} (%/an)`} value={p.rates[s.id]} min={-99} max={100} step={0.1} onChange={v=>patchPocket(p.id,'rates',{...p.rates,[s.id]:v})}/>)}</div>
          {['livret-a','ldds'].includes(p.envelope) && <p className="wealth-note">Taux prérempli : {SAVINGS ? <a href={SAVINGS.sourceUrl} target="_blank" rel="noreferrer">{percent(SAVINGS.rate)} depuis le {SAVINGS.effectiveAt}</a> : 'non disponible'}. Ce taux peut changer ; la projection le maintient constant. Plafond : {money(CEILINGS[p.envelope] ?? 0)}, partagé entre les poches de cette enveloppe.</p>}
          <details><summary>Frais, fiscalité et hausse des versements</summary>
            <ChoicePicker aria-label={`Convention de rendement ${p.name}`} value={p.rateMode} onChange={e=>patchPocket(p.id,'rateMode',e.target.value)}><option value="net">Rendement déjà net de frais</option><option value="gross">Rendement avant frais</option></ChoicePicker>
            {p.rateMode==='gross' && <NumberField label="Frais annuels (%)" value={p.fee} max={30} step={0.01} onChange={v=>patchPocket(p.id,'fee',v)}/>}
            <NumberField label="Hausse annuelle du versement (%)" value={p.contributionGrowth} min={-100} max={100} step={1} onChange={v=>patchPocket(p.id,'contributionGrowth',v)}/>
            <NumberField label="Taxe hypothétique à la sortie sur les gains (%)" value={p.tax} max={100} step={0.1} onChange={v=>patchPocket(p.id,'tax',v)}/>
            <p className="wealth-note">La taxe sert uniquement à une estimation de liquidation finale. Aucun régime fiscal, abattement, prélèvement annuel ou impôt sur les retraits n’est calculé. La base initiale est supposée égale au capital actuel.</p>
          </details>

        </article>)}
        <details className="wealth-panel"><summary>Ajouter une poche / détailler une enveloppe</summary><p>Tu peux séparer une enveloppe en plusieurs poches avec des rendements ou des frais différents.</p><div className="wealth-tabs">{ENVELOPES.map(e=><button key={e.id} disabled={portfolio.pockets.length>=30} onClick={()=>change(p=>{p.portfolios[p.active].pockets.push(newPocket(e.id))})}>+ {e.name}</button>)}</div></details>
        <section className="wealth-panel"><h2>Changements programmés</h2><p className="wealth-note">Mois 1 = premier mois de la simulation. Retraits après rendement, avant versement du mois. Le dernier changement de versement saisi prime en cas de doublon.</p>
          {portfolio.events.map((e,i)=><div className="wealth-event" key={i}><ChoicePicker aria-label={`Poche événement ${i+1}`} value={e.pocketId} onChange={v=>patchEvent(i,'pocketId',v.target.value)}>{portfolio.pockets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</ChoicePicker><ChoicePicker aria-label={`Type événement ${i+1}`} value={e.type} onChange={v=>patchEvent(i,'type',v.target.value)}><option value="monthly">Changer le versement mensuel</option><option value="pause">Suspendre les versements</option><option value="withdrawal">Retirer du capital</option></ChoicePicker>
            <div className="wealth-fields"><NumberField label={e.type==='withdrawal'?'Retrait après (années)':'À partir du mois'} value={e.type==='withdrawal'?e.month/12:e.month} min={e.type==='withdrawal'?1/12:1} max={e.type==='withdrawal'?50:600} step={e.type==='withdrawal'?1/12:1} onChange={v=>patchEvent(i,'month',e.type==='withdrawal'?Math.round(v*12):v)}/>{e.type==='pause'?<NumberField label="Jusqu’au mois inclus" value={e.endMonth} min={e.month} max={600} onChange={v=>patchEvent(i,'endMonth',v)}/>:<NumberField label={e.type==='monthly'?'Nouveau versement (€)':'Retrait demandé (€)'} value={e.amount} onChange={v=>patchEvent(i,'amount',v)}/>}</div>
            {e.type==='withdrawal' && <p className="wealth-note">5 ans = retrait à la fin de la cinquième année. Le montant sort de l’enveloppe choisie et réduit les trois projections. Si le capital est insuffisant, seul le montant disponible est retiré.</p>}
            {e.month>plan.years*12 && <p>Événement hors de l’horizon actuel.</p>}<button onClick={()=>change(p=>{p.portfolios[p.active].events.splice(i,1)})}>Retirer cet événement</button></div>)}
          <Button variant="secondary" disabled={!portfolio.pockets.length||portfolio.events.length>=100} onClick={()=>change(p=>{p.portfolios[p.active].events.push({pocketId:p.portfolios[p.active].pockets[0].id,type:'monthly',month:12,endMonth:12,amount:0})})}>Ajouter un changement</Button>
          <Button variant="secondary" disabled={!portfolio.pockets.length||portfolio.events.length>=100} onClick={()=>change(p=>{const month=Math.min(5,p.years)*12;p.portfolios[p.active].events.push({pocketId:p.portfolios[p.active].pockets[0].id,type:'withdrawal',month,endMonth:month,amount:0})})}>Ajouter un retrait</Button>
        </section>
      </section>
      <section className="tool-preview wealth-preview">
        {computation.error ? <p role="alert">{computation.error}</p> : <>
          <div role="group" aria-label="Résultats du simulateur" className="wealth-tabs">{[['projection','Projection'],['analysis','Répartition par enveloppe'],['post','Publication X']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
          {tab==='projection' && <>
            {plan.mode==='compare' && <p className="wealth-note">Trois scénarios pour {portfolio.name}. Sélectionne A ou B dans les réglages pour afficher l’autre patrimoine.</p>}
            <Chart curves={curves} years={plan.years}/>
            <div className="wealth-metrics"><div><small>Capital projeté · {portfolio.name}</small><strong>{money(result.final.capital)}</strong></div><div><small>Capital initial + versements</small><strong>{money(result.final.paid)}</strong></div><div><small>Gains / pertes simulés</small><strong>{money(result.final.gains)}</strong></div><div><small>Pouvoir d’achat estimé</small><strong>{money(result.final.real)}</strong></div></div>
            {plan.mode==='compare' && <div className="wealth-panel"><p>A : {money(computation.results.a.final.capital)} · B : {money(computation.results.b.final.capital)}</p><strong>Écart simulé : {money(Math.abs(computation.results.a.final.capital-computation.results.b.final.capital))}</strong></div>}
            {result.final.tax>0 && <p>Capital après taxe hypothétique de liquidation : {money(result.final.afterTax)}. Estimation simplifiée.</p>}
            <h2>Répartition actuelle et future</h2><div className="wealth-table-wrap"><table><thead><tr><th>Poche</th><th>Aujourd’hui</th><th>À {plan.years} ans</th><th>Poids futur</th></tr></thead><tbody>{result.final.pockets.map(p=><tr key={p.id}><td>{p.name}</td><td>{money(portfolio.pockets.find(x=>x.id===p.id).initial)}</td><td>{money(p.capital)}</td><td>{percent(result.final.capital?p.capital/result.final.capital*100:0)}</td></tr>)}{result.final.cash>0&&<tr><td>Espèces hors livrets</td><td>0 €</td><td>{money(result.final.cash)}</td><td>{percent(result.final.cash/result.final.capital*100)}</td></tr>}</tbody></table></div>
            <details><summary>Projection année par année</summary><div className="wealth-table-wrap"><table><thead><tr><th>Année</th><th>Capital</th><th>Versé</th><th>Retiré</th><th>Gains</th><th>Pouvoir d’achat</th></tr></thead><tbody>{result.points.map(p=><tr key={p.year}><td>{p.year}</td><td>{money(p.capital)}</td><td>{money(p.paid)}</td><td>{money(p.withdrawn)}</td><td>{money(p.gains)}</td><td>{money(p.real)}</td></tr>)}</tbody></table></div></details>
            <p className="wealth-note">Projection à rendement constant, taux mensuel équivalent au taux annuel, versements en fin de mois et revenus réinvestis. Hors fiscalité dans le graphique et les totaux principaux. Frais appliqués une seule fois selon la convention sélectionnée.</p>
            {result.warnings.map(w=><p className="wealth-warning" key={w}>{w}</p>)}
          </>}
          {tab==='analysis' && <><h2>Répartition de {portfolio.name}</h2><p>Les montants sont regroupés par enveloppe. Plusieurs poches d’assurance-vie ou de PEA restent réunies dans le même total.</p>
            {computation.allocation.map(row=><div className="wealth-panel" key={row.envelope}><h3>{ENVELOPES.find(e=>e.id===row.envelope)?.name}</h3><div className="wealth-metrics"><div><small>Aujourd’hui · {percent(row.currentWeight)}</small><strong>{money(row.initial)}</strong></div><div><small>Dans {plan.years} ans · {percent(row.futureWeight)}</small><strong>{money(row.future)}</strong></div></div><p>Versement mensuel initial : {money(row.monthly)}</p></div>)}
            {result.final.cash>0 && <p>Espèces issues des plafonds de livrets : {money(result.final.cash)} · {percent(result.final.cash/result.final.capital*100)} du patrimoine futur.</p>}
          </>}
          {tab==='post' && <><h2>Brouillon pour X</h2><p>Les hypothèses et les changements programmés sont inclus. Vérifie les noms et montants que tu souhaites partager.</p><textarea aria-label="Brouillon de publication" value={text} onChange={e=>setDraft(e.target.value)} rows={24}/><p>{text.length.toLocaleString('fr-FR')} caractères · texte long, à adapter à ton format de publication.</p><Button variant="secondary" onClick={()=>setDraft(null)}>Rétablir le texte</Button></>}
        </>}
      </section>
    </ToolWorkspace>
  </div>
}
