import { Link } from 'react-router-dom'

export default function PageHeader({ title, subtitle }) {
  return <header className="workspace-page-header">
    <div className="workspace-page-title">
      <Link to="/" className="workspace-back" aria-label="Retour aux outils"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h15" /></svg></Link>
      <h1>{title}</h1>
    </div>
    {subtitle && <details className="workspace-page-help"><summary>À propos de cet outil</summary><p>{subtitle}</p></details>}
  </header>
}
