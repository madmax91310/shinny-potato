import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button.jsx'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { IDEA_GROUPS, filterIdeas, ideaText } from './lib.js'
import './App.css'

export default function RankingIdeas() {
  const categoryMenu = useRef(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [kind, setKind] = useState('all')
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState('')
  const categories = IDEA_GROUPS.filter(group => kind === 'all' || group.kind === kind)
  const groups = filterIdeas({ query, category, kind })
  const count = groups.reduce((total, group) => total + group.ideas.length, 0)
  function clearFeedback() { setMessage(''); setManual('') }
  async function copy(idea) {
    clearFeedback()
    const text = ideaText(idea)
    try { await copyPublicationText(text); setMessage(idea.angle ? 'Sujet et angle copiés.' : 'Titre copié.') }
    catch { setManual(text); setMessage('Copie indisponible : sélectionne le texte ci-dessous pour le copier.') }
  }
  return <div className="ranking-ideas">
    <PageHeader title="Idées de publications" />
    <p className="ri-intro">Tes classements et des sujets d’argent qui parlent au quotidien. Choisis un angle, fais tes recherches et écris avec tes mots.</p>
    <ChoicePicker className="ri-kind" aria-label="Type de sujets" value={kind} onChange={event => { setKind(event.target.value); setCategory('all'); clearFeedback(); if (categoryMenu.current) categoryMenu.current.open = false }}>
      <option value="all">Tout</option><option value="rankings">Classements</option><option value="everyday">Argent au quotidien</option>
    </ChoicePicker>
    <div className="ri-controls">
      <label htmlFor="ri-search">Rechercher une idée<input id="ri-search" type="search" placeholder="ETF, dividendes, immobilier…" value={query} onChange={event => { setQuery(event.target.value); clearFeedback() }} /></label>
      <div><span>Catégorie</span><details className="ri-category-picker" ref={categoryMenu}>
        <summary>{categories.find(group => group.id === category)?.title ?? 'Toutes les catégories'}</summary>
        <ChoicePicker key={kind} aria-label="Catégorie" value={category} onChange={event => { setCategory(event.target.value); clearFeedback(); categoryMenu.current.open = false }}><option value="all">Toutes les catégories</option>{categories.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}</ChoicePicker>
      </details></div>
    </div>
    <div className="ri-status"><p role="status" aria-live="polite">{count} idée{count !== 1 ? 's' : ''}{message && ` · ${message}`}</p>{(query || category !== 'all' || kind !== 'all') && <Button variant="secondary" onClick={() => { setQuery(''); setCategory('all'); setKind('all'); clearFeedback() }}>Tout afficher</Button>}</div>
    {manual && <label className="ri-manual">Texte à copier<textarea readOnly value={manual} onFocus={event => event.target.select()} /></label>}
    {!count && <p className="ri-empty">Aucune idée ne correspond à cette recherche.</p>}
    {groups.map(group => <section className="ri-category" key={group.id} aria-labelledby={`ri-${group.id}`}>
      <h2 id={`ri-${group.id}`}>{group.title}</h2>
      <ul>{group.ideas.map(idea => <li key={idea.id}>
        {idea.angle ? <div className="ri-idea"><strong>{idea.title}</strong><p><span className="ri-angle-label">Angle : </span>{idea.angle}</p></div> : <span>{idea.title}</span>}
        <Button variant="secondary" aria-label={`Copier ${idea.angle ? 'le sujet et l’angle' : 'le titre'} : ${idea.title}`} onClick={() => copy(idea)}>Copier</Button>
      </li>)}</ul>
    </section>)}
  </div>
}
