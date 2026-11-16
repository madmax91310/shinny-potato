import { useRef, useEffect, useState } from 'react'
import Button from '../../design-system/Button'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { zipStore } from '../../lib/zip-store.js'
import { euro } from './lib.js'
import { staleBudgetText } from './completion.js'
import { reviewBudget } from './review.js'
const statusLabels = { listed: 'Ligne présente', grouped: 'Enveloppe identifiée', provision: 'Provision présente', external: 'Prise en charge documentée', 'not-applicable': 'Non applicable documenté', unknown: 'Périmètre à préciser' }
export default function PreparationPanel({ record, image, onFeedback }) {
  const [busy, setBusy] = useState(false), latest = useRef({ record, format: image.format }), active = useRef(true)
  latest.current = { record, format: image.format }
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const review = reviewBudget(record.profile), stale = staleBudgetText(record)
  async function download() {
    const snapshot = latest.current
    setBusy(true)
    try {
      const blobs = await image.allBlobs()
      const files = [{ name: 'publication.txt', bytes: new TextEncoder().encode(record.text) }]
      for (let i = 0; i < blobs.length; i++) files.push({ name: `image-${String(i + 1).padStart(2, '0')}.png`, bytes: new Uint8Array(await blobs[i].arrayBuffer()) })
      if (!active.current || latest.current.record !== snapshot.record || latest.current.format !== snapshot.format) throw new Error('Le budget, le texte ou le format a changé. Relance le téléchargement.')
      const url = URL.createObjectURL(zipStore(files)), link = document.createElement('a')
      link.href = url; link.download = `budget-publication-${image.format}.zip`; document.body.append(link)
      try { startPublicationDownload(link) } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
      onFeedback('Texte et images du format sélectionné téléchargés ensemble. Aucun statut publié n’a changé.')
    } catch (error) { if (active.current) onFeedback(error.message || 'Archive indisponible. Réessaie.') }
    finally { if (active.current) setBusy(false) }
  }
  return <section aria-label="Relecture de la publication">
    <p>Relis le texte exact et les chiffres avant de publier. Le dossier contient ce texte et toutes les images du format sélectionné dans l’aperçu.</p>
    <dl className="budget-review-totals">{[['Revenus', review.totals.income], ['Dépenses', review.totals.expenses], ['Versements', review.totals.savings], ['Reste après versements', review.totals.balance]].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{Number.isFinite(amount) ? euro(amount, record.profile.currency) : 'À compléter'}</dd></div>)}</dl>
    <pre className="budget-import-text">{record.text}</pre>
    {image.url && <img className="budget-review-image" src={image.url} alt={`Aperçu sélectionné · image ${image.index + 1} sur ${image.count}`}/>}
    <details><summary>Points à vérifier dans la fiche</summary><ul>{review.notes.map(note => <li key={note}>{note}</li>)}</ul><ul>{review.coverage.map(item => <li key={item.id}><strong>{item.label}</strong> : {statusLabels[item.status]}{item.rows.length ? ` · ${item.rows.join(' ; ')}` : ''}{item.basis && <p>{item.basis}</p>}{item.limits.length > 0 && <p>{item.limits.join(' ')}</p>}</li>)}</ul><p>Ces indications servent à la relecture ; elles ne certifient pas qu’un budget est complet. Les sources et créations restent dans le panneau de vérification.</p></details>
    {stale && <p role="alert">Le texte personnalisé est conservé. Vérifie ses anciens chiffres ou régénère-le volontairement avant de télécharger le dossier.</p>}
    <Button disabled={busy || image.busy || !!image.error || !image.url || !!review.totals.errors.length || !record.text.trim() || stale} onClick={download}>{busy ? 'Préparation du dossier…' : `Télécharger texte + ${image.count || ''} PNG (ZIP)`}</Button>
  </section>
}
