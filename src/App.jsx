import { useState } from 'react'
import { useThemes } from './hooks/useThemes'
import ThemeSidebar from './components/ThemeSidebar'
import ThemeEditor from './components/ThemeEditor'
import TweetPreview from './components/TweetPreview'

function App() {
  const { themes, updateTheme, addEtf, updateEtf, removeEtf, resetTheme } = useThemes()
  const [selectedId, setSelectedId] = useState(themes[0]?.id)

  const selectedTheme = themes.find((t) => t.id === selectedId) ?? themes[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <span className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-1 font-mono text-xs font-semibold text-teal-400">
            ETF
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-50">Générateur de tweets ETF</h1>
            <p className="text-xs text-slate-500">Éducation financière · comparatifs ETF prêts à publier</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <ThemeSidebar themes={themes} selectedId={selectedTheme?.id} onSelect={setSelectedId} />

        {selectedTheme && (
          <>
            <div className="flex-1 lg:max-w-2xl">
              <ThemeEditor
                theme={selectedTheme}
                onUpdateTheme={(patch) => updateTheme(selectedTheme.id, patch)}
                onAddEtf={() => addEtf(selectedTheme.id)}
                onUpdateEtf={(etfId, patch) => updateEtf(selectedTheme.id, etfId, patch)}
                onRemoveEtf={(etfId) => removeEtf(selectedTheme.id, etfId)}
                onReset={() => resetTheme(selectedTheme.id)}
              />
            </div>

            <div className="flex-1">
              <TweetPreview theme={selectedTheme} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
