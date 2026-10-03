export default function ActionMenu({ children }) {
  return <details className="workspace-action-menu" onKeyDown={event => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus() }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}>
    <summary aria-label="Plus d’actions"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></summary>
    <div className="workspace-action-popover" onClick={event => { if (event.target.closest('button,a')) event.currentTarget.parentElement.open = false }}>{children}</div>
  </details>
}
