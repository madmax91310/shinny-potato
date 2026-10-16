import { ALL_WEATHER_PRESETS, ALL_WEATHER_NOTE } from './allWeather.js'
import { getAsset } from '../../data/portfolio-assets.js'
import Button from '../../design-system/Button'

export default function AllWeatherPanel({ selected, onSelect, onEdit }) {
  const preset = ALL_WEATHER_PRESETS.find(item => item.id === selected)
  return <div className="pg-panel pg-all-weather">
    <div className="pg-panel-title">Portefeuilles All Weather</div>
    <label className="pg-manual-label" htmlFor="pg-all-weather-preset">Choisir une variante</label>
    <select id="pg-all-weather-preset" className="pg-manual-select" value={selected} onChange={event => onSelect(event.target.value)}>
      {ALL_WEATHER_PRESETS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
    <p>{preset.description}</p>
    <ul>{preset.assets.map(row => <li key={row.id} title={getAsset(row.id).name}>
      {row.role} : <strong>{row.pct.toLocaleString('fr-FR')} %</strong>
    </li>)}</ul>
    <p className="pg-fine-print">{ALL_WEATHER_NOTE}</p>
    <Button type="button" variant="secondary" className="w-full" onClick={() => onEdit(preset)}>Modifier cette allocation</Button>
  </div>
}
