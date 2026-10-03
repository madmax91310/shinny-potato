import { Suspense, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TOOLS, TOOL_GROUPS } from '../tools'
import ToolIcon from './ToolIcon'

function Navigation() {
  return <nav aria-label="Outils">
    <NavLink to="/" end className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}><span aria-hidden="true">⌂</span> Accueil</NavLink>
    {TOOL_GROUPS.map(group => <section className="workspace-nav-group" key={group.id}>
      <h2>{group.title}</h2>
      {group.tools.map(tool => <NavLink key={tool.to} to={tool.to} className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}>
        <span aria-hidden="true"><ToolIcon to={tool.to} /></span><span>{tool.navLabel ?? tool.title}</span>
      </NavLink>)}
    </section>)}
  </nav>
}

export default function Layout() {
  const { pathname } = useLocation()
  const activeTool = TOOLS.find(tool => tool.to === pathname)
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return <div className="workspace">
    <a className="workspace-skip" href="#workspace-main">Aller au contenu</a>
    <header className="workspace-topbar">
      <NavLink to="/" className="workspace-brand"><span className="workspace-monogram" aria-hidden="true">ÉL</span><span>Épargnant Libre<small>Atelier de publications</small></span></NavLink>
      <span className="workspace-context">{activeTool?.navLabel ?? 'Boîte à outils'}</span>
    </header>
    <div className="workspace-body">
      <aside className="workspace-sidebar"><Navigation /></aside>
      <details className="workspace-mobile-menu" key={pathname}>
        <summary>Explorer les outils <span aria-hidden="true">☰</span></summary>
        <Navigation />
      </details>
      <main id="workspace-main" tabIndex={-1} className="workspace-main">
        <Suspense fallback={<p role="status" className="workspace-loading">Chargement de l’outil…</p>}><Outlet /></Suspense>
      </main>
    </div>
  </div>
}
