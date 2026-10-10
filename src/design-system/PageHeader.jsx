import { Link, useLocation } from 'react-router-dom'
import { TOOLS } from '../tools'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function PageHeader({ title, subtitle }) {
  const { pathname } = useLocation()
  const tool = TOOLS.find(item => item.to === pathname)
  const day = DAYS.findIndex(name => tool?.publicationDay?.startsWith(name))
  return <header className="workspace-page-header" data-publication-day={day >= 0 ? day : undefined}>
    <div className="workspace-page-title">
      <Link to="/" className="workspace-back" aria-label="Retour aux outils"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h15" /></svg></Link>
      <h1>{tool?.icon && <span className="workspace-page-emoji" aria-hidden="true">{tool.icon}</span>}{title}</h1>
    </div>
    {tool?.publicationDay && <p className="workspace-page-schedule">{tool.publicationDay}</p>}
    {subtitle && <details className="workspace-page-help"><summary>À propos de cet outil</summary><p>{subtitle}</p></details>}
  </header>
}
