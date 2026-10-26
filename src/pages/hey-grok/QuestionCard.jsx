import Button from '../../design-system/Button'
import Card from '../../design-system/Card'
import { themeLabel } from './catalog.js'
import { tweetStatus } from './lib.js'
export default function QuestionCard({ question, state, history = false, onCopy, onEdit, onFavorite, onUsed, onDelete }) {
  const record = state.history[question.id]
  const text = history && record ? record.text : question.text
  const status = tweetStatus(text)
  const used = state.used.includes(question.id), favorite = state.favorites.includes(question.id)
  const date = record?.markedAt ? new Date(record.markedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : null
  return <Card as="article" className="hg-question" data-question-id={question.id} aria-label={`Question · ${themeLabel(history && record ? record.theme : question.theme)}`}>
    <div className="hg-question-meta"><span>{themeLabel(history && record ? record.theme : question.theme)}</span>{question.collection && <span>Nouvelle sélection</span>}{question.sourceKind === 'personal' && <span>Personnelle</span>}{question.archived && <span>Archive</span>}{question.deleted && <span>Supprimée</span>}</div>
    <p className="hg-tweet">{text || 'Question vide · à compléter dans Modifier.'}</p>
    <div className="hg-question-note"><span>{Object.hasOwn(state.drafts, question.id) && 'Brouillon à reprendre'}{used && (date ? ` · Marquée utilisée le ${date}` : ' · Ancien marquage, date inconnue')}</span><span className={status.over ? 'hg-invalid' : ''}>{status.length} / 280</span></div>
    {history && <p className="hg-note">{record?.legacy ? 'Texte repris à la migration, sans date de publication connue.' : 'Cette date correspond à ton marquage manuel, pas à une preuve de publication sur X.'}</p>}
    {status.over > 0 && <p className="hg-invalid">Dépassement de {status.over} caractères. Brouillon conservé, copie désactivée.</p>}
    {question.archiveReason && <p className="hg-note">{question.archiveReason}</p>}
    {question.previousText && <details className="hg-previous"><summary>Ancienne formulation conservée</summary><p className="hg-tweet">{question.previousText}</p></details>}
    <div className="hg-card-actions">
      <Button disabled={!status.canCopy} onClick={() => onCopy(text)}>Copier</Button>
      <Button variant="secondary" onClick={() => onEdit({ ...question, text })}>Modifier</Button>
      <Button variant="ghost" aria-pressed={favorite} onClick={() => onFavorite(question.id)}>{favorite ? 'Retirer des favoris' : 'Favori'}</Button>
      <Button variant="ghost" onClick={() => onUsed(question, text)}>{used ? 'Annuler « Utilisé »' : 'Marquer comme utilisé'}</Button>
      {question.sourceKind === 'personal' && !question.deleted && <Button variant="ghost" onClick={() => onDelete(question)}>Supprimer</Button>}
    </div>
  </Card>
}
