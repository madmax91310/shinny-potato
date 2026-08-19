import { NavLink, Outlet } from 'react-router-dom'
import { TOOLS } from '../tools'

// Ossature commune : en-tête + nav (scroll horizontal sur mobile) + contenu de la page active.
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <NavLink to="/" className="text-sm font-semibold tracking-wide text-slate-100">
            Patrimoine <span className="text-teal-400">&amp; Compagnie</span>
          </NavLink>
          <nav className="-mx-4 mt-2 flex gap-1 overflow-x-auto px-4 pb-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                  isActive ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
                }`
              }
            >
              Accueil
            </NavLink>
            {TOOLS.map((tool) => (
              <NavLink
                key={tool.to}
                to={tool.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-1.5 transition-colors ${
                    isActive ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
                  }`
                }
              >
                {tool.navLabel ?? tool.title}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
