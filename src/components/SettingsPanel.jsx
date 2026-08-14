import { useState } from 'react'

export default function SettingsPanel({ settings, onUpdateSettings, stockStatus }) {
  const [apiKey, setApiKey] = useState(settings.twelveDataApiKey || '')
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdateSettings({ twelveDataApiKey: apiKey.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Clé API Twelve Data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Utilisée pour récupérer le cours des actions et ETF. Obtenez une clé gratuite sur{' '}
          <span className="font-medium">twelvedata.com</span>. La clé est stockée uniquement dans le
          navigateur (localStorage), jamais envoyée ailleurs qu'à l'API Twelve Data.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Votre clé API Twelve Data"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Enregistrer
          </button>
        </form>
        {saved && <p className="mt-2 text-xs font-medium text-emerald-600">Clé enregistrée.</p>}

        {!settings.twelveDataApiKey && (
          <p className="mt-3 text-xs text-amber-600">
            Sans clé, les actions et ETF passent en mode manuel : mettez à jour leur prix vous-même
            depuis le tableau (icône ✎).
          </p>
        )}

        {stockStatus?.quotaExceeded && (
          <p className="mt-3 text-xs text-rose-600">{stockStatus.error}</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-500">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Bon à savoir</h2>
        <ul className="list-disc space-y-1 pl-4">
          <li>Les cours crypto viennent de CoinGecko (aucune clé requise), rafraîchis toutes les 60 secondes.</li>
          <li>
            Le tier gratuit Twelve Data autorise 8 requêtes par minute : au-delà de 8 lignes actions/ETF,
            les appels sont échelonnés sur plusieurs cycles.
          </li>
          <li>Toutes les données (positions, historique, réglages) restent uniquement dans ce navigateur.</li>
        </ul>
      </div>
    </div>
  )
}
