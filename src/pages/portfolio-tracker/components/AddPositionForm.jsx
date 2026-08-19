import { useState } from 'react'
import Card from '../../../design-system/Card'
import Button from '../../../design-system/Button'

const EMPTY_FORM = {
  name: '',
  ticker: '',
  type: 'crypto',
  quantity: '',
  buyPrice: '',
  buyDate: new Date().toISOString().slice(0, 10),
}

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none'

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
    <Card as="form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Nom</label>
        <input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Bitcoin"
          className={INPUT_CLASS}
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Ticker</label>
        <input
          type="text"
          value={form.ticker}
          onChange={handleChange('ticker')}
          placeholder="BTC"
          className={`${INPUT_CLASS} uppercase`}
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
        <select value={form.type} onChange={handleChange('type')} className={INPUT_CLASS}>
          <option value="crypto">Crypto</option>
          <option value="stock">Action</option>
          <option value="etf">ETF</option>
        </select>
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Quantité</label>
        <input
          type="number"
          step="any"
          min="0"
          value={form.quantity}
          onChange={handleChange('quantity')}
          placeholder="0.5"
          className={INPUT_CLASS}
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Prix d'achat</label>
        <input
          type="number"
          step="any"
          min="0"
          value={form.buyPrice}
          onChange={handleChange('buyPrice')}
          placeholder="27000"
          className={INPUT_CLASS}
          required
        />
      </div>

      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-400">Date d'achat</label>
        <input type="date" value={form.buyDate} onChange={handleChange('buyDate')} className={INPUT_CLASS} required />
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit">{isEditing ? 'Enregistrer' : 'Ajouter la ligne'}</Button>
        {isEditing && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </Card>
  )
}
