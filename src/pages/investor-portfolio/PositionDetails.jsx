import {lazy,Suspense,useState} from 'react'
const PositionRows=lazy(()=>import('./PositionRows.jsx'))
function Disclosure({rows,options=false}) {
  const [open,setOpen]=useState(false)
  return <details onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary>{options?'Options déclarées · hors image et total':`Détail intégral · ${rows.length} positions`}</summary>
    {options&&<p>Poids sur le total déclaré, options incluses. Les valeurs déclarées ne mesurent pas les primes ni l’exposition nette.</p>}
    {open&&<Suspense fallback={<p>Chargement des positions…</p>}><PositionRows rows={rows} options={options}/></Suspense>}
  </details>
}
export default function PositionDetails({portfolio}) {
  const options=portfolio.snapshot.holdings.filter(row=>row.putCall)
  return <><Disclosure rows={portfolio.holdings}/>{options.length>0&&<Disclosure rows={options} options/>}</>
}
