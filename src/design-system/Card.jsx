// Carte de base : même fond/bordure/arrondi pour tous les outils.
export default function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm shadow-black/20 ${className}`}
      {...props}
    />
  )
}
