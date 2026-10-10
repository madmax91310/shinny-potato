import { useState } from 'react'

// Native disclosure keeps fields and their values mounted while simplifying the first view.
export default function SettingsDetails({ title, summary, children, defaultOpen = false, ...props }) {
  const [open, setOpen] = useState(defaultOpen)
  return <details {...props} open={open} onToggle={event => setOpen(event.currentTarget.open)} className={`settings-details ${props.className ?? ''}`}>
    <summary><span>{title}</span>{summary && <small>{summary}</small>}</summary>
    <div className="settings-details-content">{children}</div>
  </details>
}
