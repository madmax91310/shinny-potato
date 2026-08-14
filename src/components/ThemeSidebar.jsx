function isThemeFilled(theme) {
  return Boolean(
    theme.hookAction?.trim() ||
      theme.hookDilemme?.trim() ||
      theme.transition?.trim() ||
      theme.etfs.length > 0,
  )
}

export default function ThemeSidebar({ themes, selectedId, onSelect }) {
  return (
    <nav className="flex flex-col gap-1 lg:w-64 lg:shrink-0" aria-label="Thématiques ETF">
      <div className="mb-1 px-2 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
        Thématiques
      </div>
      <div className="flex flex-col gap-0.5 overflow-y-auto lg:max-h-[calc(100vh-9rem)]">
        {themes.map((theme) => {
          const filled = isThemeFilled(theme)
          const active = theme.id === selectedId
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? 'border-teal-500/40 bg-teal-500/10 text-slate-50'
                  : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none">{theme.emoji}</span>
              <span className="flex-1 truncate font-medium">{theme.nom}</span>
              <span
                title={filled ? 'Thème renseigné' : 'Thème vide'}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  filled ? 'bg-teal-400' : 'bg-slate-700'
                }`}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
