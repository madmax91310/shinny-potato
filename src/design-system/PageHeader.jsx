import { Link } from 'react-router-dom'

// En-tête commune à chaque page outil : fil d'ariane retour + titre + sous-titre.
export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 space-y-2">
      <Link to="/" className="text-sm text-slate-500 transition-colors hover:text-teal-300">
        ← Retour aux outils
      </Link>
      <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 sm:text-base">{subtitle}</p>}
    </div>
  )
}
