import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ToolIcon from '../design-system/ToolIcon'
import { HOME_TOOLS, TOOL_GROUPS } from '../tools'
import { EDITORIAL_WEEK } from '../data/editorial-calendar'
import { readLocalPreference, writeLocalPreference } from '../lib/publication-preferences.js'
import './home.css'

const VIEW_KEY = 'epargnant-libre:home-view'
const FAVORITES_KEY = 'epargnant-libre:home-favorites'
const DEFAULT_FAVORITES = ['/radar-editorial', '/le-dca-de', '/generateur-portefeuilles', '/banque-tweets']
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const validView = value => ['overview', 'calendar'].includes(value)
const validFavorites = value => Array.isArray(value) && value.every(path => typeof path === 'string')

function ToolList({ tools, favorites, toggleFavorite }) {
  return <div className="workspace-tool-grid">{tools.map(tool => <div className="home-tool-entry" key={tool.to}>
    <Link className="workspace-tool-card" to={tool.to}>
      <span className="workspace-tool-icon"><ToolIcon to={tool.path ?? tool.to} /></span>
      <div><h2>{tool.title}</h2>{tool.publicationDay && <span className="workspace-publication-day">{tool.publicationDay}</span>}</div>
    </Link>
    <button className="home-favorite" type="button" aria-label={`Favori : ${tool.title}`} aria-pressed={favorites.includes(tool.path ?? tool.to)} data-favorite-path={tool.path ?? tool.to} onClick={event => toggleFavorite(tool.path ?? tool.to, event.detail === 0)} title="Ajouter ou retirer des favoris">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" /></svg>
    </button>
  </div>)}</div>
}

export default function Home() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState(() => new URLSearchParams(search).get('vue') === 'ensemble' ? 'overview' : readLocalPreference(VIEW_KEY, 'overview', validView) === 'calendar' ? 'calendar' : 'overview')
  const [favorites, setFavorites] = useState(() => {
    const stored = readLocalPreference(FAVORITES_KEY, DEFAULT_FAVORITES, validFavorites)
    return Array.isArray(stored) ? [...new Set(stored)].filter(path => HOME_TOOLS.some(tool => tool.to === path)) : DEFAULT_FAVORITES
  })
  const [preferenceErrors, setPreferenceErrors] = useState({})
  const [query, setQuery] = useState('')
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' }).format(new Date())
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, EDITORIAL_WEEK.findIndex(({ day }) => day.toLowerCase() === today)))
  const toolbar = useRef(null)
  const dayButtons = useRef([])
  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.get('vue') === 'ensemble') {
      setView('overview')
      params.delete('vue')
      navigate({ search: params.toString() }, { replace: true })
    }
  }, [search, navigate])
  useEffect(() => { setPreferenceErrors(previous => ({...previous, view: !writeLocalPreference(VIEW_KEY, view, validView)})) }, [view])
  useEffect(() => {
    // Keep unavailable/older routes in storage even though this build cannot display them.
    const unknown = readLocalPreference(FAVORITES_KEY, [], validFavorites).filter(path => !HOME_TOOLS.some(tool => tool.to === path))
    setPreferenceErrors(previous => ({...previous, favorites: !writeLocalPreference(FAVORITES_KEY, [...favorites, ...unknown], validFavorites)}))
  }, [favorites])
  useEffect(() => {
    const element = toolbar.current
    const observer = new ResizeObserver(() => {
      if (element.isConnected) document.documentElement.style.setProperty('--home-toolbar-height', `${element.offsetHeight + 12}px`)
    })
    observer.observe(element)
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--home-toolbar-height') }
  }, [])
  const toggleFavorite = (path, keyboard) => {
    setFavorites(current => current.includes(path) ? current.filter(item => item !== path) : [...current, path])
    if (keyboard) requestAnimationFrame(() => document.querySelector(`[data-favorite-path="${CSS.escape(path)}"]`)?.focus())
  }
  const list = tools => <ToolList tools={tools} favorites={favorites} toggleFavorite={toggleFavorite} />
  const terms = normalize(query).split(' ').filter(Boolean)
  const searching = terms.length > 0
  const results = HOME_TOOLS.filter(tool => terms.every(term => normalize([tool.title, tool.navLabel, tool.summary, tool.description, tool.publicationDay, tool.to, tool.to === '/le-dca-de' ? 'recouvrement' : ''].join(' ')).includes(term)))
  const selectedDay = EDITORIAL_WEEK[dayIndex]
  return <div className="workspace-home" onFocusCapture={event => {
    if (toolbar.current.contains(event.target)) return
    const top = event.target.getBoundingClientRect().top
    const bottom = toolbar.current.getBoundingClientRect().bottom + 8
    if (top < bottom) window.scrollBy(0, top - bottom)
  }}>
    {Object.values(preferenceErrors).some(Boolean) && <p role="alert">Les préférences locales ne peuvent pas être enregistrées. Les données existantes sont conservées.</p>}
    <header className="home-heading"><h1>Mes outils</h1><p>Tout pour préparer tes publications.</p></header>
    <div className="home-toolbar" ref={toolbar}>
      <div className="home-view-switch" role="group" aria-label="Vue de l’accueil">
        <button type="button" aria-pressed={view === 'overview'} onClick={() => setView('overview')}>Vue d’ensemble</button>
        <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendrier</button>
      </div>
      <div className="home-search">
        <label htmlFor="home-tool-search">Rechercher un outil</label>
        <div className="home-search-field">
          <input id="home-tool-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery('') }} placeholder="ETF, DCA, performances…" aria-controls="home-search-results" />
          {query && <button type="button" onClick={() => { setQuery(''); document.getElementById('home-tool-search')?.focus() }}>Effacer</button>}
        </div>
      </div>
    </div>
    <div id="home-search-results">
      <p className="home-search-count" role="status">{searching ? `${results.length} outil${results.length === 1 ? '' : 's'} trouvé${results.length === 1 ? '' : 's'}` : ''}</p>
      {searching && <section className="home-panel" aria-label="Résultats de recherche">{results.length ? list(results) : <p className="home-day-note">Aucun outil ne correspond. Essaie un autre mot ou efface la recherche.</p>}</section>}
    </div>
    {!searching && (view === 'overview' ? <div className="home-overview">
      <section className="home-panel home-favorites" aria-labelledby="home-favorites-title"><div className="home-section-heading"><h2 id="home-favorites-title">Mes favoris</h2><p>Une étoile pour les retrouver ici.</p></div>
        {favorites.length ? list(favorites.map(path => HOME_TOOLS.find(tool => tool.to === path))) : <p className="home-day-note">Ajoute tes outils avec leur étoile.</p>}
      </section>
      {TOOL_GROUPS.map(group => {
        const tools = group.tools.filter(tool => HOME_TOOLS.some(item => item.to === tool.to) && !favorites.includes(tool.to))
        return tools.length > 0 && <section key={group.id} className="home-panel" data-group={group.id} aria-labelledby={`home-group-${group.id}`}><div className="home-section-heading"><h2 id={`home-group-${group.id}`}>{group.title}</h2><span>{tools.length}</span></div>{list(tools)}</section>
      })}
    </div> : <div className="home-calendar">
      <p className="home-calendar-intro">Un format par créneau, le midi et le soir.</p>
      <div className="home-days" role="tablist" aria-label="Jour de la semaine">{EDITORIAL_WEEK.map(({ day }, index) => <button key={day} ref={node => { dayButtons.current[index] = node }} type="button" role="tab" id={`home-tab-${index}`} aria-controls={`home-day-${index}`} aria-selected={index === dayIndex} tabIndex={index === dayIndex ? 0 : -1} onClick={() => setDayIndex(index)} onKeyDown={event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 6 : event.key === 'ArrowRight' ? (index + 1) % 7 : event.key === 'ArrowLeft' ? (index + 6) % 7 : null
        if (next !== null) { event.preventDefault(); setDayIndex(next); dayButtons.current[next].focus() }
      }}><span className="home-day-short" aria-hidden="true">{day.slice(0, 3)}.</span><span className="home-day-full">{day}</span>{day.toLowerCase() === today && <span className="home-today" aria-label="Aujourd’hui">•</span>}</button>)}</div>
      <section className="home-panel home-day" data-day={dayIndex} role="tabpanel" id={`home-day-${dayIndex}`} aria-labelledby={`home-tab-${dayIndex}`}>
        <div className="home-day-band"><h2>{selectedDay.day}</h2>{selectedDay.day.toLowerCase() === today && <span>Aujourd’hui</span>}</div>
        {[['midday', 'Midi', selectedDay.midday], ['evening', 'Soir', selectedDay.evening]].map(([period, label, entries]) => <div className="home-period" data-period={period} key={period}>
          <h3>{label}</h3>
          {selectedDay[`${period}Note`] && <p className="home-day-note">{selectedDay[`${period}Note`]}</p>}
          {list(entries.map(entry => ({ ...HOME_TOOLS.find(tool => tool.to === entry.path), path: entry.path, ...(entry.title ? { title: entry.title } : {}), to: entry.href ?? entry.path, publicationDay: entry.note || `${selectedDay.day} ${label.toLowerCase()}` })))}
        </div>)}
      </section>
    </div>)}
  </div>
}
