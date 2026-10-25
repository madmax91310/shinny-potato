import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Card from '../../design-system/Card'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions'
import { CATEGORIES, QUESTIONS } from './data'
import { drawQuestion, filterQuestions, readPreferences, savePreferences, STORAGE_KEY, emptyPreferences, toggleId, tweetStatus } from './lib'
import './App.css'

export default function App() {
  const editorRef = useRef(null)
  const [loaded] = useState(() => readPreferences())
  const [preferences, setPreferences] = useState(loaded.value)
  const [storageBlocked, setStorageBlocked] = useState(Boolean(loaded.error))
  const [storageError, setStorageError] = useState(loaded.error)
  const [filters, setFilters] = useState({ category: '', search: '', publicOnly: false, unusedOnly: false, favoritesOnly: false })
  const [selectedId, setSelectedId] = useState(QUESTIONS[0].id)
  const [seen, setSeen] = useState([QUESTIONS[0].id])
  const [copyState, setCopyState] = useState('')
  const selected = QUESTIONS.find(question => question.id === selectedId)
  const text = preferences.drafts[selectedId] ?? selected.text
  const status = tweetStatus(text)
  const list = filterQuestions(QUESTIONS, filters, preferences)
  const remaining = list.filter(question => !seen.includes(question.id)).length
  const favorite = preferences.favorites.includes(selectedId)
  const used = preferences.used.includes(selectedId)
  const categoryLabel = CATEGORIES.find(category => category.id === selected.category).label

  function update(next) {
    setPreferences(next)
    if (!storageBlocked) setStorageError(savePreferences(null, next) ? '' : 'Sauvegarde locale indisponible. Les changements restent disponibles pendant cette session.')
  }
  function select(question) {
    setSelectedId(question.id)
    setSeen(previous => previous.includes(question.id) ? previous : [...previous, question.id])
    setCopyState('')
    if (window.matchMedia('(max-width: 900px)').matches) editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  function changeFilter(patch) { setFilters(previous => ({ ...previous, ...patch })) }
  function edit(value) {
    update({ ...preferences, drafts: { ...preferences.drafts, [selectedId]: value } })
    setCopyState('')
  }
  async function copy() {
    if (!tweetStatus(text).canCopy) return
    try { await copyPublicationText(text); setCopyState('Tweet copié. Le statut « Utilisé » reste à ton choix.') }
    catch { setCopyState('Copie impossible. Sélectionne le texte pour le copier manuellement.') }
  }
  function resetStorage() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      setPreferences(emptyPreferences()); setStorageBlocked(false); setStorageError('')
    } catch { setStorageError('Le stockage local reste indisponible.') }
  }

  return <div className="hg-scope">
    <PageHeader title="Hey @Grok" subtitle="Une banque de questions pour lancer la discussion sur X. Aucune réponse générée, aucune connexion à une IA et aucune publication automatique." />
    <p className="hg-intro">Une question qui fait réagir. À toi de choisir quand la publier.</p>
    {storageError && <div className="hg-warning" role="alert"><p>{storageError}</p>{storageBlocked && <Button variant="secondary" onClick={resetStorage}>Effacer les données illisibles de cet outil</Button>}</div>}
    <div className="hg-layout">
      <Card as="section" className="hg-library" aria-labelledby="hg-library-title">
        <h2 id="hg-library-title">Choisir une question</h2>
        <div className="hg-filters">
          <label htmlFor="hg-category">Catégorie<select id="hg-category" aria-label="Catégorie" value={filters.category} onChange={event => changeFilter({ category: event.target.value })}>
            <option value="">Toutes</option>{CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select></label>
          <label>Rechercher<input type="search" placeholder="Voiture, salaire, Apple…" value={filters.search} onChange={event => changeFilter({ search: event.target.value })} /></label>
          <div className="hg-checks">
            <label><input type="checkbox" checked={filters.publicOnly} onChange={event => changeFilter({ publicOnly: event.target.checked })} /> Tout public</label>
            <label><input type="checkbox" checked={filters.unusedOnly} onChange={event => changeFilter({ unusedOnly: event.target.checked })} /> Non utilisés</label>
            <label><input type="checkbox" checked={filters.favoritesOnly} onChange={event => changeFilter({ favoritesOnly: event.target.checked })} /> Favoris</label>
          </div>
        </div>
        <div className="hg-draw">
          <Button disabled={!remaining} onClick={() => { const question = drawQuestion(list, seen); if (question) select(question) }}>Question au hasard</Button>
          <p role="status">{list.length} questions · {remaining} à découvrir</p>
        </div>
        {list.length > 0 && remaining === 0 && <div className="hg-exhausted" role="status">
          <p>Sélection épuisée : toutes ces questions ont été vues.</p>
          <Button variant="secondary" onClick={() => setSeen(previous => previous.filter(id => !list.some(question => question.id === id)))}>Recommencer cette sélection</Button>
        </div>}
        {list.length === 0 ? <p role="status">Aucune question ne correspond aux filtres.</p> : <ul className="hg-list" aria-label="Questions disponibles">
          {list.map(question => <li key={question.id}>
            <button type="button" aria-pressed={selectedId === question.id} onClick={() => select(question)}>
              <span className="hg-meta">{CATEGORIES.find(category => category.id === question.category).label}{preferences.favorites.includes(question.id) && ' · Favori'}{preferences.used.includes(question.id) && ' · Utilisé'}</span>
              <span>{question.text}</span>
            </button>
          </li>)}
        </ul>}
      </Card>
      <Card as="section" ref={editorRef} className="hg-editor" aria-labelledby="hg-editor-title">
        <h2 id="hg-editor-title">Préparer le tweet</h2>
        <p className="hg-meta">{categoryLabel}{selected.public && ' · Tout public'} · {used ? 'Utilisé' : 'Non utilisé'}</p>
        {!list.some(question => question.id === selectedId) && <p className="hg-note">Le brouillon ouvert est hors des filtres actuels. Choisis une question dans la liste pour le remplacer.</p>}
        <label htmlFor="hg-text">Texte du tweet</label>
        <textarea id="hg-text" value={text} onChange={event => edit(event.target.value)} aria-describedby="hg-counter hg-invalid" aria-invalid={!status.canCopy} rows={8} />
        <p id="hg-counter" className={status.over ? 'hg-counter hg-invalid' : 'hg-counter'} role="status">{status.length} / 280{status.over > 0 && ` · Dépassement de ${status.over} caractères`}</p>
        <p id="hg-invalid" className="hg-invalid">{status.over ? 'Raccourcis le tweet pour pouvoir le copier.' : !status.prefix ? 'Le tweet doit commencer par « Hey @grok, ».' : !status.canCopy ? 'Ajoute une question valide après la mention.' : ''}</p>
        <div className="hg-actions">
          <Button disabled={!status.canCopy} onClick={copy}>Copier le tweet</Button>
          <Button variant="secondary" aria-pressed={favorite} onClick={() => update({ ...preferences, favorites: toggleId(preferences.favorites, selectedId) })}>{favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</Button>
          <Button variant="secondary" aria-pressed={used} onClick={() => update({ ...preferences, used: toggleId(preferences.used, selectedId) })}>{used ? 'Annuler « Utilisé »' : 'Marquer « Utilisé »'}</Button>
        </div>
        <p className="hg-copy-state" role="status">{copyState}</p>
        <p className="hg-note">Copier ne publie rien. Favoris, brouillons et usages sont conservés dans ce navigateur.</p>
      </Card>
    </div>
  </div>
}
