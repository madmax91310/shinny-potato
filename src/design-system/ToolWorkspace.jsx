import { useRef, useState } from 'react'

// Panels stay mounted when changing views: drafts and selected instruments persist.
// Desktop shows both columns; mobile shows one focused view at a time.
export default function ToolWorkspace({ children, className = '', actions }) {
  const [view, setView] = useState('settings')
  const container = useRef(null)
  function show(next) {
    setView(next)
    if (container.current?.getBoundingClientRect().top < 0) container.current.scrollIntoView({ block: 'start' })
  }
  return <div ref={container} className="workspace-tool-view" data-view={view}>
    <div className="workspace-view-switch" role="group" aria-label="Afficher une partie de l’outil">
      <button type="button" aria-pressed={view === 'settings'} onClick={() => show('settings')}>Réglages</button>
      <button type="button" aria-pressed={view === 'preview'} onClick={() => show('preview')}>Aperçu</button>
    </div>
    <div className={`workspace-tool-columns ${className}`}>{children}</div>
    {actions && <div className="workspace-actions">{actions}</div>}
  </div>
}
