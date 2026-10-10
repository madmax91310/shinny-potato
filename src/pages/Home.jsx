import ToolCard from '../design-system/ToolCard'
import { HOME_TOOLS } from '../tools'
import './home.css'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_ICONS = ['🌿', '🎯', '💡', '📊', '🛡️', '📝', '⭐']

function ToolList({ tools }) {
  return <div className="workspace-tool-grid">{tools.map(tool => <ToolCard key={tool.to} {...tool} emoji />)}</div>
}

export default function Home() {
  const scheduled = HOME_TOOLS.filter(tool => DAYS.some(day => tool.publicationDay?.startsWith(day)))
  const occasional = HOME_TOOLS.filter(tool => tool.publicationDay === 'Publication ponctuelle')
  const shortcuts = HOME_TOOLS.filter(tool => !scheduled.includes(tool) && !occasional.includes(tool))
  return <div className="workspace-home">
    <header className="home-heading"><h1>Mes outils de la semaine</h1></header>
    <div className="home-week">
      {DAYS.map((day, index) => {
        const tools = scheduled.filter(tool => tool.publicationDay.startsWith(day))
        return <section className="home-day" data-day={index} key={day} aria-labelledby={`home-day-${index}`}>
          <div className="home-day-band"><h2 id={`home-day-${index}`}>{day}</h2><span aria-hidden="true">{DAY_ICONS[index]}</span></div>
          <div className="home-day-content">{tools.length ? <ToolList tools={tools} /> : <p className="home-day-note">Bilan de la semaine · publication libre</p>}</div>
        </section>
      })}
    </div>
    <section className="home-extra" aria-labelledby="home-occasional"><h2 id="home-occasional">À publier quand tu veux</h2><ToolList tools={occasional} /></section>
    <section className="home-extra" aria-labelledby="home-shortcuts"><h2 id="home-shortcuts">Accès rapide</h2><ToolList tools={shortcuts} /></section>
  </div>
}
