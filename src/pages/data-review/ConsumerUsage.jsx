import {useMemo,useState} from 'react'
const LABELS={connected:'Raccordé',blocked:'À compléter','qualification-needed':'Renouvellement à qualifier','scheduled-evidence':'Cycles à confirmer',reference:'Référence',excluded:'Archive ou hypothèse','not-required':'Non requis ou publication attendue'}
export default function ConsumerUsage({report,query}){
 const usage=report.consumerUsage,[selected,setSelected]=useState(''),[pending,setPending]=useState(true)
 const fields=useMemo(()=>new Map([...(report.assets??[]),...(usage?.externalAssets??[])].flatMap(a=>a.fields.map(f=>[`${a.id}:${f.key}`,{...f,id:a.id,name:a.name,field:f.label}]))),[report,usage])
 if(!usage)return <p>Le bilan des usages n’est pas disponible pour cet instantané.</p>
 const tool=usage.tools.find(t=>t.path===selected)??usage.tools[0]
 const q=query.trim().toLocaleLowerCase('fr')
 const rows=(tool?.rows??[]).map(r=>({...fields.get(`${r.id}:${r.key}`),...r})).filter(r=>(!pending||(r.required&&r.state!=='connected'))&&[r.id,r.name,r.field,r.reason].join(' ').toLocaleLowerCase('fr').includes(q))
 return <>
  <p>Chaque ligne relie un actif, un champ et un outil. Les références, archives et hypothèses restent séparées des données à renouveler. Les usages sont déclarés dans les registres ; ils ne prouvent pas une collecte réussie.</p>
  <label>Outil consommateur <select value={tool?.path??''} onChange={e=>setSelected(e.target.value)}>{usage.tools.map(t=><option key={t.path} value={t.path}>{t.name}</option>)}</select></label>
  <label><input type="checkbox" checked={pending} onChange={e=>setPending(e.target.checked)}/>Afficher seulement les champs à compléter ou à confirmer</label>
  {tool&&<p>{tool.assets} actifs · {tool.required} champs requis · {tool.connected} raccordés · {tool.blocked} à compléter · {tool.unconfirmed} renouvellements à confirmer.</p>}
  <p>{rows.length} usages correspondants · {Math.min(rows.length,50)} affichés.</p>
  <div className="dr-list">{rows.slice(0,50).map(r=><article className="dr-item" key={`${r.id}:${r.key}`}><h3>{r.name} · {r.field}</h3><p>{r.id} · {LABELS[r.state]??r.state}</p><p>{r.nextAction}</p><dl><dt>Dernier contrôle de la source</dt><dd>{r.checkedAt??'Non documenté'}</dd><dt>Date de la donnée</dt><dd>{r.asOf??'Non documentée'}</dd></dl>{r.scope&&<p>{r.scope}</p>}{r.currency&&<p>Devise : {r.currency}</p>}{r.workflows.map(w=><p key={w.path}>Collecte : {w.name}</p>)}{r.sourceUrls.map(url=><p key={url}><a href={url} target="_blank" rel="noreferrer">Source ↗</a></p>)}</article>)}</div>
  <p><a href={`${import.meta.env.BASE_URL}data/consumer-data-usage.json`} download>Télécharger tous les usages, sources et statuts (JSON)</a></p>
  {usage.unmapped.length>0&&<p role="status">{usage.unmapped.length} usages sans outil identifié restent à raccorder ; ils ne sont pas comptés comme automatisés.</p>}
 </>
}
