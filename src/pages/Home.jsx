import { useState } from 'react'
import { Link } from 'react-router-dom'
import ToolCard from '../design-system/ToolCard'
import { HOME_TOOLS } from '../tools'
import './home.css'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_ICONS = ['🌿', '🎯', '💡', '📊', '🛡️', '📝', '⭐']
const QUICK_PATHS = ['/radar-editorial', '/le-dca-de', '/generateur-portefeuilles', '/banque-tweets']
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function ToolList({ tools }) {
  return <div className="workspace-tool-grid">{tools.map(tool => <ToolCard key={tool.to} {...tool} emoji />)}</div>
}

export default function Home() {
  const [query, setQuery] = useState('')
  const terms = normalize(query).split(' ').filter(Boolean)
  const searching = terms.length > 0
  const results = HOME_TOOLS.filter(tool => {
    const text = normalize([tool.title, tool.navLabel, tool.summary, tool.description, tool.publicationDay, tool.to, tool.to === '/le-dca-de' ? 'recouvrement' : ''].join(' '))
    return terms.every(term => text.includes(term))
  })
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' }).format(new Date())
  const scheduled = HOME_TOOLS.filter(tool => DAYS.some(day => tool.publicationDay?.startsWith(day)))
  const occasional = HOME_TOOLS.filter(tool => tool.publicationDay === 'Publication ponctuelle')
  const shortcuts = HOME_TOOLS.filter(tool => !scheduled.includes(tool) && !occasional.includes(tool))
  return <div className="workspace-home">
    <header className="home-heading"><h1>Mes outils de la semaine</h1></header>
    <nav className="home-quick-links" aria-label="Outils favoris">
      {QUICK_PATHS.map(path => {
        const tool = HOME_TOOLS.find(item => item.to === path)
        return <Link key={path} to={path}><span aria-hidden="true">{tool.icon}</span>{tool.title === 'Banque de tweets à recycler' ? 'Banque de tweets' : tool.title}</Link>
      })}
    </nav>
    <div className="home-search">
      <label htmlFor="home-tool-search">Rechercher un outil</label>
      <div className="home-search-field">
        <input id="home-tool-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery('') }} placeholder="ETF, DCA, performances…" aria-controls="home-search-results" />
        {query && <button type="button" onClick={() => { setQuery(''); document.getElementById('home-tool-search')?.focus() }}>Effacer</button>}
      </div>
    </div>
    <div id="home-search-results">
      <p className="home-search-count" role="status">{searching ? `${results.length} outil${results.length === 1 ? '' : 's'} trouvé${results.length === 1 ? '' : 's'}` : ''}</p>
      {searching && (results.length ? <ToolList tools={results} /> : <p className="home-day-note">Aucun outil ne correspond. Essaie un autre mot ou efface la recherche pour retrouver la semaine.</p>)}
    </div>
    {!searching && <>
    <div className="home-week">
      {DAYS.map((day, index) => {
        const tools = scheduled.filter(tool => tool.publicationDay.startsWith(day))
        const isToday = day.toLowerCase() === today
        return <section className={`home-day${isToday ? ' home-day--today' : ''}`} data-day={index} key={day} aria-labelledby={`home-day-${index}`}>
          <div className="home-day-band"><h2 id={`home-day-${index}`}>{day}</h2>{isToday && <small className="home-today">Aujourd’hui</small>}<span aria-hidden="true">{DAY_ICONS[index]}</span></div>
          <div className="home-day-content">{tools.length ? <ToolList tools={tools} /> : <p className="home-day-note">Bilan de la semaine · publication libre</p>}</div>
        </section>
      })}
    </div>
    <section className="home-extra" aria-labelledby="home-occasional"><h2 id="home-occasional">À publier quand tu veux</h2><ToolList tools={occasional} /></section>
    <section className="home-extra" aria-labelledby="home-shortcuts"><h2 id="home-shortcuts">Accès rapide</h2><ToolList tools={shortcuts} /></section>
    </>}
  </div>
}
