import { useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions'
import { BANK } from './catalog.js'
import { emptyFilters, filterQuestions, drawBatch, toggleId, newEditor, tweetStatus, switchPersonalWorkspace } from './lib.js'
import { markUsed, saveEditor, deletePersonal } from './storage.js'
import useGrokStore from './use-store.js'
import QuestionCard from './QuestionCard'
import Filters from './Filters'
import Editor from './Editor'
import ManualCopy from './ManualCopy'
import './App.css'

export default function App() {
  const { state, error, commit } = useGrokStore()
  const { filters, view, editor } = state.workspace
  const [editorOpen, setEditorOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [manual, setManual] = useState(null)
  const [undoDelete, setUndoDelete] = useState(null)
  const [page, setPage] = useState({ key: '', ids: null })
  const [seenByFilter, setSeenByFilter] = useState({})
  const knownIds = new Set([...BANK, ...state.personal].map(q => q.id))
  const recovered = Object.entries(state.history).filter(([id]) => !knownIds.has(id)).map(([id, record]) => ({ id, text: record.text, theme: record.theme, sourceKind: 'history', deleted: true }))
  const all = [...BANK, ...state.personal, ...recovered]
  const matching = filterQuestions(all, filters, state, view).sort((a, b) => view === 'historique'
    ? (state.history[b.id]?.markedAt ?? '').localeCompare(state.history[a.id]?.markedAt ?? '')
    : Number(state.used.includes(a.id)) - Number(state.used.includes(b.id)))
  const key = JSON.stringify({ view, ...filters })
  const byId = new Map(matching.map(q => [q.id, q]))
  const visible = page.key === key && page.ids ? page.ids.map(id => byId.get(id)).filter(Boolean) : matching.slice(0, 6)
  const seen = [...new Set([...(seenByFilter[key] ?? []), ...visible.map(q => q.id)])]
  const remaining = matching.filter(q => !seen.includes(q.id)).length
  function remember() { setSeenByFilter(previous => ({ ...previous, [key]: seen })) }
  function changeFilters(patch) {
    remember(); setPage({ key: '', ids: null }); setManual(null)
    commit(previous => ({ ...previous, workspace: { ...previous.workspace, filters: { ...previous.workspace.filters, ...patch } } }))
  }
  function changeView(next) {
    remember(); setPage({ key: '', ids: null }); setManual(null)
    commit(previous => ({ ...previous, workspace: { ...previous.workspace, view: next } }))
  }
  function showPersonal() {
    remember(); setPage({ key: '', ids: null }); setManual(null)
    commit(previous => ({ ...previous, workspace: switchPersonalWorkspace(previous.workspace) }))
    setNotice(filters.personalOnly ? 'Retour à la banque : tes filtres précédents sont repris.' : 'Mes questions : les filtres de la banque sont conservés séparément.')
  }
  function resetFilters() { changeFilters({ ...emptyFilters(), personalOnly: filters.personalOnly }) }
  function renew(append = false) {
    const batch = drawBatch(matching, seen, state.used, 6, append ? null : Math.random)
    setSeenByFilter(previous => ({ ...previous, [key]: [...seen, ...batch.map(q => q.id)] }))
    setPage({ key, ids: [...(append ? visible.map(q => q.id) : []), ...batch.map(q => q.id)] })
  }
  function restart() {
    setSeenByFilter(previous => ({ ...previous, [key]: [] }))
    setPage({ key: '', ids: null })
  }
  async function copy(text) {
    if (!tweetStatus(text).canCopy) return
    setNotice(''); setManual(null)
    try { await copyPublicationText(text); setNotice('Texte copié. Le marquage « Utilisé » reste manuel.') }
    catch { setNotice('Copie refusée : la copie manuelle est disponible.'); setManual(text) }
  }
  function openEditor(question = null) {
    setManual(null)
    if (editor) {
      if (editor.sourceId !== (question?.id ?? null)) setNotice('Un brouillon est déjà en cours. Enregistre-le ou annule-le avant d’ouvrir une autre question.')
      setEditorOpen(true); return
    }
    commit(previous => ({ ...previous, workspace: { ...previous.workspace, editor: newEditor(question, question ? previous.drafts[question.id] : undefined) } }))
    setNotice(''); setEditorOpen(true)
  }
  function edit(next) {
    setManual(null); setNotice('')
    commit(previous => ({ ...previous, drafts: next.sourceId ? { ...previous.drafts, [next.sourceId]: next.text } : previous.drafts, workspace: { ...previous.workspace, editor: next } }))
  }
  function save() {
    const ok = commit(previous => saveEditor(previous, `personal-${crypto.randomUUID()}`))
    setEditorOpen(false); setPage({ key: '', ids: null })
    setNotice(ok ? 'Question personnelle enregistrée. Retrouve-la dans « Mes questions ».' : 'Question gardée dans cette session. La sauvegarde locale est indisponible.')
  }
  function discard() {
    commit(previous => {
      const drafts = { ...previous.drafts }; if (previous.workspace.editor?.sourceId) delete drafts[previous.workspace.editor.sourceId]
      return { ...previous, drafts, workspace: { ...previous.workspace, editor: null } }
    })
    setEditorOpen(false); setNotice('Brouillon abandonné. La question enregistrée reste intacte.'); setManual(null)
  }
  function remove(question) {
    remember()
    setUndoDelete({ question, favorite: state.favorites.includes(question.id), draft: state.drafts[question.id] })
    commit(previous => deletePersonal(previous, question.id))
    setNotice('Question personnelle supprimée. Son éventuel historique d’utilisation est conservé.')
  }
  function restoreDeleted() {
    commit(previous => ({ ...previous, personal: [...previous.personal.filter(q => q.id !== undoDelete.question.id), undoDelete.question], favorites: undoDelete.favorite && !previous.favorites.includes(undoDelete.question.id) ? [...previous.favorites, undoDelete.question.id] : previous.favorites, drafts: undoDelete.draft === undefined ? previous.drafts : { ...previous.drafts, [undoDelete.question.id]: undoDelete.draft } }))
    setUndoDelete(null); setNotice('Question personnelle restaurée.')
  }
  return <div className="hg-scope">
    <PageHeader title="Hey @Grok" />
    {error && <p className="hg-warning" role="alert">{error}</p>}
    <nav className="hg-nav" aria-label="Navigation Hey @Grok">{[['explorer', 'Explorer'], ['favoris', 'Favoris'], ['historique', 'Historique']].map(([id, label]) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => changeView(id)}>{label}</button>)}</nav>
    <div className="hg-toolbar"><Button onClick={() => openEditor()}>Créer ma question</Button><Button variant="ghost" aria-pressed={filters.personalOnly} onClick={showPersonal}>Mes questions</Button>{editor && <Button variant="secondary" onClick={() => setEditorOpen(true)}>Reprendre le brouillon</Button>}{Object.keys(state.drafts).length > 0 && <Button variant="ghost" aria-pressed={filters.draftsOnly} onClick={() => changeFilters({ draftsOnly: !filters.draftsOnly })}>Brouillons</Button>}</div>
    <Filters filters={filters} count={matching.length} onChange={changeFilters} onReset={resetFilters} />
    {notice && !editorOpen && <p role="status" className="hg-notice">{notice}</p>}
    {undoDelete && <Button variant="secondary" onClick={restoreDeleted}>Annuler la suppression</Button>}
    {manual !== null && !editorOpen && <ManualCopy text={manual} />}
    {matching.length === 0 ? <section className="hg-empty"><h2>Aucune question ne correspond</h2><p>{view === 'favoris' ? 'Ajoute un favori ou ajuste les filtres.' : view === 'historique' ? 'Aucun marquage ne correspond aux filtres. Copier ne crée pas d’historique.' : 'Essaie un autre thème ou retire un filtre.'}</p><Button variant="secondary" onClick={resetFilters}>Réinitialiser les filtres</Button>{view !== 'explorer' && <Button variant="ghost" onClick={() => changeView('explorer')}>Explorer les questions</Button>}</section>
      : <>
        <div className="hg-suggestions"><p>{visible.length} question{visible.length > 1 ? 's' : ''} affichée{visible.length > 1 ? 's' : ''}</p><Button variant="secondary" disabled={!remaining} onClick={() => renew(false)}>Propose-moi autre chose</Button></div>
        <section className="hg-cards" aria-label="Questions">{visible.map(question => <QuestionCard key={question.id} question={question} state={state} history={view === 'historique'} onCopy={copy} onEdit={openEditor} onFavorite={id => { remember(); commit(previous => ({ ...previous, favorites: toggleId(previous.favorites, id) })) }} onUsed={(q, text) => { remember(); commit(previous => markUsed(previous, q, text)) }} onDelete={remove} />)}</section>
        <div className="hg-pagination">{remaining > 0 ? <Button variant="secondary" onClick={() => renew(true)}>Voir plus</Button> : <><p role="status">Sélection épuisée : toutes les questions correspondantes ont été proposées.</p><Button variant="secondary" onClick={restart}>Recommencer cette sélection</Button></>}</div>
      </>}
    {editor && <Editor editor={editor} open={editorOpen} personal={state.personal} error={error} notice={notice} manual={manual} onChange={edit} onClose={() => { setEditorOpen(false); setManual(null) }} onSave={save} onDiscard={discard} onCopy={copy} />}
  </div>
}
