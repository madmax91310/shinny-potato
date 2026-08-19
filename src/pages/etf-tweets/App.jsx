import { useState } from 'react'
import { useThemes } from './hooks/useThemes'
import ThemeSidebar from './components/ThemeSidebar'
import ThemeEditor from './components/ThemeEditor'
import TweetPreview from './components/TweetPreview'
import PageHeader from '../../design-system/PageHeader'

export default function App() {
  const { themes, updateTheme, addEtf, updateEtf, removeEtf, resetTheme } = useThemes()
  const [selectedId, setSelectedId] = useState(themes[0]?.id)

  const selectedTheme = themes.find((t) => t.id === selectedId) ?? themes[0]

  return (
    <div>
      <PageHeader
        title="Générateur de tweets ETF"
        subtitle="Comparatifs ETF par thématique, prêts à publier."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
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
      </div>
    </div>
  )
}
