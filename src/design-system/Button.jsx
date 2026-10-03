function ActionIcon({ label }) {
  const paths = /copié|copie.*✓|partagé|téléchargé/i.test(label) ? <path d="m5 12 4 4L19 6" />
    : /copier/i.test(label) ? <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>
    : /télécharger|enregistrer|exporter/i.test(label) ? <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>
    : /image|graphique|visuel/i.test(label) ? <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m3 17 5-5 4 4 4-6 5 7" /><circle cx="8" cy="8" r="1" /></>
    : /rétablir|réinitialiser|aléatoire|autre|générer/i.test(label) ? <><path d="M4 10a8 8 0 1 1 2 8M4 4v6h6" /></>
    : null
  return paths && <svg className="workspace-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>
}
export default function Button({ variant = 'primary', className = '', as: As = 'button', children, ...props }) {
  // Decorative emoji in legacy action labels do not belong to the minimal UI.
  // Preserve the existing accessible name used by callers and automation.
  const label = typeof children === 'string'
    ? children.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/u, '')
    : children
  return <As aria-label={typeof children === 'string' && label !== children ? children : undefined} className={`workspace-button workspace-button--${variant} ${className}`} {...props}>{typeof label === 'string' && <ActionIcon label={label} />}<span>{label}</span></As>
}
