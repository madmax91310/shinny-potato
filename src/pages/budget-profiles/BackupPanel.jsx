import { useState } from 'react'
import Button from '../../design-system/Button'
import { budgetDisplayName } from './lib.js'
import { budgetStorageSnapshot, exportBudgetBackup, parseBudgetBackup, previewBudgetImport, restoreBudgetBackup, listBudgetRecoveries, validDraft } from './storage.js'

const statusLabel = (workspace, id) => [['used', 'Utilisé'], ['published', 'Publié'], ['queued', 'À publier prochainement']].map(([key, label]) => `${label} : ${workspace[key].includes(id) ? 'oui' : 'non'}`).join(' · ')

export default function BackupPanel({ onRestored, record, drafts }) {
  const [versions, setVersions] = useState(listBudgetRecoveries), [selectedVersion, setSelectedVersion] = useState('')
  const [pending, setPending] = useState(null), [message, setMessage] = useState(''), [strategy, setStrategy] = useState('keep-local')
  function download() {
    try {
      const backup = exportBudgetBackup()
      if (validDraft(record)) backup.workspace = { ...backup.workspace, activeId: record.profile.id, drafts: [...new Map([...backup.workspace.drafts, ...drafts.filter(validDraft), record].map(d => [d.profile.id, d])).values()] }
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = `le-budget-de-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage(backup.readable ? 'Sauvegarde exportée.' : 'Export de récupération : les enregistrements illisibles sont conservés dans le fichier.')
    } catch { setMessage('Export impossible : le stockage local est inaccessible.') }
  }
  async function inspect(file) {
    setPending(null)
    if (!file) return
    try {
      if (file.size > 10000000) throw new Error('Fichier trop volumineux (10 Mo maximum).')
      const incoming = parseBudgetBackup(await file.text()), preview = previewBudgetImport(incoming, drafts)
      setPending({ incoming, preview, snapshot: budgetStorageSnapshot() }); setStrategy('keep-local'); setMessage('')
    } catch (error) { setMessage(error.message) }
  }
  function restore() {
    if (restoreBudgetBackup(pending.incoming, strategy, pending.snapshot, drafts)) {
      setPending(null); setVersions(listBudgetRecoveries()); setMessage('Import terminé. Une copie des données locales précédentes est conservée dans les exports de récupération.'); onRestored()
    } else setMessage('Import non appliqué : les données locales ont changé ou leur enregistrement est impossible. Relis le fichier pour actualiser l’aperçu. Aucune donnée locale n’a été supprimée.')
  }
  return <div className="budget-backup">
    <p>Transfert manuel par fichier entre appareils. Les brouillons, textes personnalisés et trois statuts sont enregistrés dans ce navigateur.</p>
    <Button variant="secondary" onClick={download}>Exporter les brouillons et statuts</Button>
    {versions.length > 0 && <><label>Version locale archivée<select aria-label="Version locale archivée" value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}><option value="">Choisir une version précédente</option>{versions.map(v => <option key={v.key} value={v.key}>{new Date(v.createdAt).toLocaleString('fr-FR')} · {v.workspace.drafts.length} brouillon(s)</option>)}</select></label><Button variant="secondary" disabled={!selectedVersion} onClick={() => { const incoming = versions.find(v => v.key === selectedVersion).workspace; setPending({ incoming, preview: previewBudgetImport(incoming, drafts), snapshot: budgetStorageSnapshot() }); setStrategy('keep-local'); setMessage('') }}>Examiner cette version archivée</Button></>}
    <label>Restaurer une sauvegarde<input type="file" accept="application/json,.json" onChange={e => inspect(e.target.files[0])}/></label>
    {pending && <section aria-label="Aperçu de l’import">
      <p>{pending.preview.drafts} brouillon(s), dont {pending.preview.custom} texte(s) personnalisé(s) · {pending.preview.additions.length} nouveau(x) profil(s) · {pending.preview.conflicts.length} conflit(s).</p>
      <p>{pending.incoming.used.length} utilisé(s) · {pending.incoming.published.length} publié(s) · {pending.incoming.queued.length} à publier prochainement.</p>
      <ul>{pending.incoming.drafts.map(d => <li key={d.profile.id}><details><summary>{budgetDisplayName(d.profile)} · {d.edited ? 'texte personnalisé' : 'texte automatique'}{pending.preview.conflicts.includes(d.profile.id) ? ' · conflit' : ''}</summary><p>{statusLabel(pending.incoming, d.profile.id)}</p><p className="budget-import-text">{d.text}</p></details></li>)}</ul>
      {pending.preview.ids.filter(id => !pending.incoming.drafts.some(d => d.profile.id === id)).map(id => <p key={id}>{id} · {statusLabel(pending.incoming, id)}{pending.preview.conflicts.includes(id) ? ' · conflit' : ''}</p>)}
      {pending.preview.conflicts.length > 0 && <label>Gestion des conflits<select aria-label="Gestion des conflits" value={strategy} onChange={e => setStrategy(e.target.value)}><option value="keep-local">Conserver les versions et statuts locaux</option><option value="use-imported">Prendre les versions et statuts du fichier</option></select></label>}
      {!pending.preview.readable && <p>Le stockage local contient des données illisibles. L’import les archivera pour récupération avant de les remplacer.</p>}
      <p>Les profils absents du fichier restent conservés. Toute version remplacée est archivée et récupérable dans un nouvel export.</p>
      <Button onClick={restore}>Appliquer cet import</Button><Button variant="secondary" onClick={() => setPending(null)}>Annuler l’import</Button>
    </section>}
    <p role="status">{message}</p>
  </div>
}
