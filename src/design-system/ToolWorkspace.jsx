import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react'
import PublicationPreview from './PublicationPreview'
import { ActionTarget } from './actionTarget'

// Panels stay mounted when changing views: drafts and selected instruments persist.
// Desktop shows both columns; mobile shows one focused view at a time.
export default function ToolWorkspace({ children, className = '', actions, renderImage, imageContent, imageAlt, imageDisabled }) {
  const [view, setView] = useState('settings')
  const container = useRef(null)
  const [actionTarget, setActionTarget] = useState(null)
  useEffect(() => {
    if (!actionTarget) return
    const observer = new ResizeObserver(() => container.current?.style.setProperty('--action-height', `${actionTarget.getBoundingClientRect().height + 24}px`))
    observer.observe(actionTarget)
    return () => observer.disconnect()
  }, [actionTarget])
  function show(next) {
    setView(next)
    if (container.current?.getBoundingClientRect().top < 0) container.current.scrollIntoView({ block: 'start' })
  }
  return <div ref={container} className="workspace-tool-view" data-view={view}>
    <div className="workspace-view-switch" role="group" aria-label="Afficher une partie de l’outil">
      <button type="button" aria-pressed={view === 'settings'} onClick={() => show('settings')}>Réglages</button>
      <button type="button" aria-pressed={view === 'preview'} onClick={() => show('preview')}>Aperçu</button>
    </div>
    <ActionTarget.Provider value={actionTarget}>
      <div className={`workspace-tool-columns ${className}`}>{Children.map(children, child => {
        if (!isValidElement(child) || !child.props.className?.split(' ').includes('tool-preview') || (!renderImage && !imageContent)) return child
        return <div className="tool-preview studio-preview"><PublicationPreview {...{ renderImage, imageContent, imageAlt, imageDisabled }}>{cloneElement(child, { className: child.props.className.replace(/\btool-preview\b/g, '') })}</PublicationPreview></div>
      })}</div>
      <div ref={setActionTarget} className="workspace-actions" role="group" aria-label="Actions de publication">{actions}</div>
    </ActionTarget.Provider>
  </div>
}
