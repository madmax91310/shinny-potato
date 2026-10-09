import { Suspense, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TOOL_GROUPS } from '../tools'
import ToolIcon from './ToolIcon'
import RadarCount from './RadarCount'

function Navigation() {
  return <nav aria-label="Outils">
    <NavLink to="/" end className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><span aria-hidden="true">⌂</span> Accueil</NavLink>
    {TOOL_GROUPS.map(group => <section className="workspace-nav-group" key={group.id}>
      <h2>{group.title}</h2>
      {group.tools.map(tool => <NavLink key={tool.to} to={tool.to} className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}>
        <span aria-hidden="true"><ToolIcon to={tool.to} /></span><span>{tool.navLabel ?? tool.title}</span>{tool.to === '/radar-editorial' && <RadarCount />}
      </NavLink>)}
    </section>)}
  </nav>
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const family = TOOL_GROUPS.find(group => group.tools.some(tool => tool.to === pathname))?.id ?? 'publish'
  return <div data-family={family} className={`workspace ${pathname === '/' ? 'workspace--home' : 'workspace--tool'}`}>
    <a className="workspace-skip" href="#workspace-main">Aller au contenu</a>
    <div className="workspace-body">
      <aside className="workspace-sidebar"><Navigation /></aside>
      <details className="workspace-mobile-menu" key={pathname}>
        <summary><span>Outils</span><span aria-hidden="true">☰</span></summary>
        <Navigation />
      </details>
      <main id="workspace-main" tabIndex={-1} className={`workspace-main ${pathname === '/' ? 'workspace-main--home' : ''}`}>
        <Suspense fallback={<p role="status" className="workspace-loading">Chargement de l’outil…</p>}><Outlet /></Suspense>
      </main>
    </div>
  </div>
}
