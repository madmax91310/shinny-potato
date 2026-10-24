import {useState} from 'react'
export default function PagedList({children,items:provided,renderItem,label='Liste',size=40}){
 const [page,setPage]=useState(0),items=provided??(Array.isArray(children)?children:[children].filter(Boolean))
 const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(page,pages-1)
 return <><p role="status">{items.length?current*size+1:0}–{Math.min((current+1)*size,items.length)} sur {items.length} éléments · page {current+1}/{pages}</p>
 <div className="dr-list">{items.slice(current*size,(current+1)*size).map((item,index)=>renderItem?renderItem(item,current*size+index):item)}</div>
 <nav className="dr-pagination" aria-label={label}><button disabled={!current} onClick={()=>setPage(0)}>Première page</button><button disabled={!current} onClick={()=>setPage(current-1)}>Précédente</button><button disabled={current===pages-1} onClick={()=>setPage(current+1)}>Suivante</button><button disabled={current===pages-1} onClick={()=>setPage(pages-1)}>Dernière page</button></nav></>
}
