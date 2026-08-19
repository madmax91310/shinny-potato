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
import PageHeader from '../../design-system/PageHeader'

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
          className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-300"
        >
          {m.text}
        </div>
      ))}
    </div>
  )
}

export default function App() {
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Suivi de portefeuille"
          subtitle="Valorisation en direct d'un portefeuille crypto / actions / ETF."
        />
        <nav className="flex gap-1 rounded-lg border border-slate-800 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === 'dashboard' ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Tableau de bord
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === 'settings' ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Paramètres
          </button>
        </nav>
      </div>

      {tab === 'dashboard' ? (
        <div className="space-y-6">
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
        </div>
      ) : (
        <SettingsPanel settings={settings} onUpdateSettings={updateSettings} stockStatus={stockStatus} />
      )}
    </div>
  )
}
