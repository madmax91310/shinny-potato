import { useMemo, useState } from 'react'
import { usePositions } from './hooks/usePositions'
import { useSettings } from './hooks/useSettings'
import { useLivePrices } from './hooks/useLivePrices'
import { useSnapshots } from './hooks/useSnapshots'
import { computePortfolioSummary, computeDailyChange } from './lib/portfolio'
import SummaryHeader from './components/SummaryHeader'
import AddPositionForm from './components/AddPositionForm'
import PortfolioTable from './components/PortfolioTable'
import AllocationChart from './components/AllocationChart'
import EvolutionChart from './components/EvolutionChart'
import SettingsPanel from './components/SettingsPanel'

function ApiStatusBanner({ cryptoStatus, stockStatus, hasStockPositions, hasApiKey }) {
  const messages = []
  if (cryptoStatus.error) {
    messages.push({ key: 'crypto', text: `CoinGecko : ${cryptoStatus.error}` })
  }
  if (hasStockPositions && hasApiKey && stockStatus.error) {
    messages.push({ key: 'stock', text: `Twelve Data : ${stockStatus.error}` })
  }

  if (messages.length === 0) return null

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <div
          key={m.key}
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          {m.text}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [tab, setTab] = useState('dashboard')
  const [editingPosition, setEditingPosition] = useState(null)

  const { positions, addPosition, updatePosition, deletePosition, setManualPrice } = usePositions()
  const { settings, updateSettings } = useSettings()
  const { livePrices, cryptoStatus, stockStatus } = useLivePrices(positions, settings.twelveDataApiKey)

  const summary = useMemo(() => computePortfolioSummary(positions, livePrices), [positions, livePrices])
  const { snapshots } = useSnapshots(summary.totalValue, positions.length > 0)
  const dailyChange = useMemo(() => computeDailyChange(snapshots, summary.totalValue), [snapshots, summary.totalValue])

  const hasStockPositions = positions.some((p) => p.type === 'stock' || p.type === 'etf')

  const handleAdd = (data) => addPosition(data)
  const handleEditSubmit = (data) => {
    updatePosition(editingPosition.id, data)
    setEditingPosition(null)
  }
  const handleDelete = (id) => {
    if (editingPosition?.id === id) setEditingPosition(null)
    deletePosition(id)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Suivi de portefeuille</h1>
          <nav className="flex gap-1 rounded-lg border border-slate-200 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setTab('dashboard')}
              className={`rounded-md px-3 py-1.5 font-medium ${
                tab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tableau de bord
            </button>
            <button
              type="button"
              onClick={() => setTab('settings')}
              className={`rounded-md px-3 py-1.5 font-medium ${
                tab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Paramètres
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {tab === 'dashboard' ? (
          <>
            <ApiStatusBanner
              cryptoStatus={cryptoStatus}
              stockStatus={stockStatus}
              hasStockPositions={hasStockPositions}
              hasApiKey={Boolean(settings.twelveDataApiKey)}
            />

            <SummaryHeader summary={summary} dailyChange={dailyChange} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EvolutionChart snapshots={snapshots} />
              <AllocationChart positions={positions} livePrices={livePrices} />
            </div>

            {editingPosition ? (
              <AddPositionForm
                key={editingPosition.id}
                initialValues={editingPosition}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingPosition(null)}
              />
            ) : (
              <AddPositionForm key="add" onSubmit={handleAdd} />
            )}

            <PortfolioTable
              positions={positions}
              livePrices={livePrices}
              onEdit={setEditingPosition}
              onDelete={handleDelete}
              onSetManualPrice={setManualPrice}
            />
          </>
        ) : (
          <SettingsPanel settings={settings} onUpdateSettings={updateSettings} stockStatus={stockStatus} />
        )}
      </main>
    </div>
  )
}

export default App
