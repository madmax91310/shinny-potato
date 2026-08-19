// Bouton unique de l'app : 3 variantes, mêmes rayons/tailles partout.
const VARIANTS = {
  primary: 'bg-teal-500 text-slate-950 hover:bg-teal-400 focus-visible:outline-teal-400',
  secondary:
    'bg-transparent text-slate-100 border border-slate-700 hover:border-teal-500 hover:text-teal-300 focus-visible:outline-slate-400',
  ghost: 'bg-transparent text-slate-400 hover:text-slate-100 focus-visible:outline-slate-400',
}

export default function Button({ variant = 'primary', className = '', as: As = 'button', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  return <As className={`${base} ${VARIANTS[variant]} ${className}`} {...props} />
}
