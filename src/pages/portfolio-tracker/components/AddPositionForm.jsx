import { useState } from 'react'

const EMPTY_FORM = {
  name: '',
  ticker: '',
  type: 'crypto',
  quantity: '',
  buyPrice: '',
  buyDate: new Date().toISOString().slice(0, 10),
}

export default function AddPositionForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValues || EMPTY_FORM)
  const isEditing = Boolean(initialValues)

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.ticker.trim() || !form.quantity || !form.buyPrice || !form.buyDate) {
      return
    }
    onSubmit(form)
    if (!isEditing) setForm(EMPTY_FORM)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Nom</label>
        <input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Bitcoin"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Ticker</label>
        <input
          type="text"
          value={form.ticker}
          onChange={handleChange('ticker')}
          placeholder="BTC"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
        <select
          value={form.type}
          onChange={handleChange('type')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="crypto">Crypto</option>
          <option value="stock">Action</option>
          <option value="etf">ETF</option>
        </select>
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Quantité</label>
        <input
          type="number"
          step="any"
          min="0"
          value={form.quantity}
          onChange={handleChange('quantity')}
          placeholder="0.5"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Prix d'achat</label>
        <input
          type="number"
          step="any"
          min="0"
          value={form.buyPrice}
          onChange={handleChange('buyPrice')}
          placeholder="27000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Date d'achat</label>
        <input
          type="date"
          value={form.buyDate}
          onChange={handleChange('buyDate')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {isEditing ? 'Enregistrer' : 'Ajouter la ligne'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
