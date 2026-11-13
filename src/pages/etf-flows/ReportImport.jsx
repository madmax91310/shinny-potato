import {useState} from 'react'
import Button from '../../design-system/Button.jsx'
import {parseExpressReport} from './report.js'
import {signedFlow,GROUPS} from './lib.js'
export default function ReportImport({onImport}) {
 const [text,setText]=useState(''),[result,setResult]=useState(null),[selected,setSelected]=useState([]),[message,setMessage]=useState('')
 function analyse(){try{const r=parseExpressReport(text);setResult(r);setSelected(r.rows.flatMap((row,i)=>row.group==='geography'?[i]:[]).slice(0,10));setMessage('')}catch(e){setMessage(e.message)}}
 function apply(){const rows=selected.map(i=>result.rows[i]);if(!rows.length||rows.length>10||!result.currency)return;onImport({...result,rows});setMessage('Flux importés. Vérifie la période, le lien de l’article et les chiffres ci-dessous.');setResult(null)}
 return <div className="flows-paste-import"><label>Coller le bilan ETF Express<textarea aria-label="Coller le bilan ETF Express" value={text} maxLength={50000} onChange={e=>{setText(e.target.value);setResult(null)}} placeholder="Copie le texte de l’article, puis colle-le ici." /></label><Button onClick={analyse}>Analyser le bilan</Button>
 {result&&<><h3>Choisis les flux à importer</h3><p>Jusqu’à 10 flux. Les performances ne sont pas importées.</p>{result.start&&<p>Période reconnue : {result.start} → {result.end}</p>}{result.warnings.map((w,i)=><p role="alert" key={i}>{w}</p>)}{result.rows.map((r,i)=><label className="flows-check" key={i}><input type="checkbox" checked={selected.includes(i)} onChange={e=>setSelected(s=>e.target.checked?[...s,i]:s.filter(n=>n!==i))} />{GROUPS[r.group]} · {r.label} : {signedFlow(r.amount,r.currency)}</label>)}<Button disabled={!selected.length||selected.length>10||!result.currency} onClick={apply}>Importer les flux sélectionnés</Button></>}
 {message&&<p role="status">{message}</p>}</div>
}
