import { useMemo, useState } from 'react'
import { valuationPublication } from './valuationPublication.js'
import { renderValuationImage } from './valuationImage.js'
import { copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'

export default function ValuationPublication({company,overrides,selected,method,now,years=5}) {
  const [message,setMessage]=useState('')
  const result=useMemo(()=>{
    try {const snapshot=valuationPublication(company,overrides,selected,method,now,years);return {snapshot,image:renderValuationImage(snapshot).toDataURL('image/png')}}
    catch(error){return {error:error.message}}
  },[company,overrides,selected,method,now,years])
  async function act(kind) {
    try {
      const snapshot=valuationPublication(company,overrides,selected,method,new Date(),years)
      if(kind==='copy'){await copyPublicationText(snapshot.text);setMessage('Texte des objectifs copié.')}
      else {const link=document.createElement('a');link.href=renderValuationImage(snapshot).toDataURL('image/png');link.download=snapshot.filename;startPublicationDownload(link);setMessage('Téléchargement lancé.')}
    }catch(error){setMessage(error.message)}
  }
  return <section className="valuation-publication" aria-label="Publication de valorisation">
    <p>L’image et le texte reprennent les hypothèses affichées. Change un scénario ou un réglage pour actualiser les deux.</p>
    {result.error?<p role="alert">{result.error}</p>:<>
      <div className="valuation-export-preview">
        <img src={result.image} alt={`Objectifs de cours de ${company.name} · ${result.snapshot.scenarios[selected].name}`} width="1200" height="1500"/>
        <div><p className="valuation-export-length">{result.snapshot.text.length} caractères · publication longue sur X</p><article data-testid="valuation-tweet">{result.snapshot.text}</article></div>
      </div>
      <div className="valuation-export-actions"><button type="button" onClick={()=>act('copy')}>Copier le texte de valorisation</button><button type="button" onClick={()=>act('download')}>Télécharger l’image de valorisation</button></div>
    </>}
    <p role="status">{message}</p>
  </section>
}
