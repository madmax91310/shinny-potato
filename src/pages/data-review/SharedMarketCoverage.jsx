import {useEffect,useState} from 'react'
export default function SharedMarketCoverage(){
 const [report,setReport]=useState(null),[failed,setFailed]=useState(false)
 useEffect(()=>{const controller=new AbortController();fetch(`${import.meta.env.BASE_URL}data/shared-market-coverage.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(r=>{if(r.schemaVersion!==1||!r.summary||!Array.isArray(r.histories)||!Array.isArray(r.exposures))throw Error();setReport(r)}).catch(e=>{if(e.name!=='AbortError')setFailed(true)});return()=>controller.abort()},[])
 return <details><summary>Actions, historiques et expositions hors Analyse d’entreprise</summary>
 {failed?<p role="status">Le bilan des données partagées n’a pas pu être chargé.</p>:!report?<p role="status">Chargement du bilan des données partagées…</p>:<>
 <p>Contrôle du {report.checkedAt.slice(0,10)} : {report.summary.histories} historiques, dont {report.summary.equityHistories} actions. {report.summary.historyStates.current??0} avec contrôle récent. Les prix historiques sont vérifiés séparément des séries de performance ajustées.</p>
 <p>{report.summary.exposures} supports pour les expositions : {report.summary.positionStates['partial-list']??0} listes de positions partielles et {report.summary.positionStates.unavailable??0} sans liste exploitable. Une répartition pays ou secteurs complète ne prouve pas une composition intégrale.</p>
 <p>Les comptes, prévisions et valorisations réservés à Analyse d’entreprise sont exclus de ce bilan. Les actions utilisées ailleurs restent incluses. {report.summary.identityLimits} liaisons d’identité restent à qualifier ; les ADR et actions ordinaires ne sont pas assimilés.</p>
 <a href={`${import.meta.env.BASE_URL}data/shared-market-coverage.json`} download>Télécharger les champs, sources, dates et destinations (JSON)</a>
 </>}
 </details>
}
