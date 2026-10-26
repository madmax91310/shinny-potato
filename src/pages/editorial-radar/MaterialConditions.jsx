export default function MaterialConditions({material,event}) {
  return <><ul>{material.missing.map(note=><li key={note}>{note}</li>)}</ul>{event.promotionEndsAt&&<p>Promotion jusqu’au {event.promotionEndsAt} ; le taux promotionnel ne remplace pas le taux normal.</p>}{event.conditions&&<p>Les conditions intégrales restent dans les preuves de la source.</p>}</>
}
