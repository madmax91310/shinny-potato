import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button.jsx'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { normalizeSearch } from '../../data/search-text.js'
import { CATEGORIES } from './data.js'
import './App.css'

export default function RankingIdeas() {
  const categoryMenu = useRef(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState('')
  const terms = normalizeSearch(query).split(' ').filter(Boolean)
  const groups = CATEGORIES.filter(group => category === 'all' || category === group.id)
    .map(group => ({ ...group, ideas: group.ideas.filter(idea => terms.every(term => normalizeSearch(`${group.title} ${idea}`).includes(term))) }))
    .filter(group => group.ideas.length)
  const count = groups.reduce((total, group) => total + group.ideas.length, 0)
  function clearFeedback() { setMessage(''); setManual('') }
  async function copy(idea) {
    clearFeedback()
    try { await copyPublicationText(idea); setMessage('Titre copié.') }
    catch { setManual(idea); setMessage('Copie indisponible : sélectionne le titre ci-dessous pour le copier.') }
  }
  return <div className="ranking-ideas">
    <PageHeader title="Idées de classements" />
    <p className="ri-intro">Des sujets dans lesquels piocher pour tes publications sur X.</p>
    <div className="ri-controls">
      <label htmlFor="ri-search">Rechercher une idée<input id="ri-search" type="search" placeholder="ETF, dividendes, immobilier…" value={query} onChange={event => { setQuery(event.target.value); clearFeedback() }} /></label>
      <div><span>Catégorie</span><details className="ri-category-picker" ref={categoryMenu}>
        <summary>{CATEGORIES.find(group => group.id === category)?.title ?? 'Toutes les catégories'}</summary>
        <ChoicePicker aria-label="Catégorie" value={category} onChange={event => { setCategory(event.target.value); clearFeedback(); categoryMenu.current.open = false }}><option value="all">Toutes les catégories</option>{CATEGORIES.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}</ChoicePicker>
      </details></div>
    </div>
    <div className="ri-status"><p role="status">{count} idée{count !== 1 ? 's' : ''}{message && ` · ${message}`}</p>{(query || category !== 'all') && <Button variant="secondary" onClick={() => { setQuery(''); setCategory('all'); clearFeedback() }}>Tout afficher</Button>}</div>
    {manual && <label className="ri-manual">Titre à copier<textarea readOnly value={manual} onFocus={event => event.target.select()} /></label>}
    {!count && <p className="ri-empty">Aucune idée ne correspond à cette recherche.</p>}
    {groups.map(group => <section className="ri-category" key={group.id} aria-labelledby={`ri-${group.id}`}>
      <h2 id={`ri-${group.id}`}>{group.title}</h2>
      <ul>{group.ideas.map(idea => <li key={idea}><span>{idea}</span><Button variant="secondary" aria-label={`Copier le titre : ${idea}`} onClick={() => copy(idea)}>Copier</Button></li>)}</ul>
    </section>)}
  </div>
}
