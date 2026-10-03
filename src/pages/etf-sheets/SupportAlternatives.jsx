import { useState } from 'react'
import { ETFS } from '../../data/etf-cards.js'
import { instrumentOption, sameBenchmarkSupports } from '../../data/asset-selection.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'
import { ETF_TER_BY_ISIN } from '../../data/etf-ter.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
import Button from '../../design-system/Button'

export default function SupportAlternatives({ etf, onSelect }) {
  const alternatives = sameBenchmarkSupports(etf.isin)
  const [selected, setSelected] = useState([])
  const [compare, setCompare] = useState(false)
  const funds = [instrumentOption(etf), ...alternatives.filter(item => selected.includes(item.isin))]
  if (!alternatives.length) return null
  return <section className="support-alternatives" aria-label="Autres supports du même indice">
    <h3>Même indice, autres supports</h3>
    <p>Caractéristiques des parts référencées dans la banque. Sélectionne les supports à comparer.</p>
    {alternatives.map(item => <div className="support-alternative" key={item.isin}>
      <label><input type="checkbox" checked={selected.includes(item.isin)} onChange={event => {
        setSelected(previous => event.target.checked ? [...previous, item.isin] : previous.filter(isin => isin !== item.isin))
        setCompare(false)
      }} /><strong>{item.label}</strong></label>
      <span>{item.badges.join(' · ')}</span>
      <small>{item.isin}</small>
      {ETFS.some(card => card.isin === item.isin) && <Button type="button" variant="secondary" onClick={() => onSelect(ETFS.find(card => card.isin === item.isin).id)}>Présenter cet ETF</Button>}
    </div>)}
    <Button type="button" variant="secondary" disabled={!selected.length} onClick={() => setCompare(true)}>Comparer ces supports</Button>
    {compare && <div className="support-comparison" tabIndex={0} role="region" aria-label="Comparaison des supports">
      <table><thead><tr><th>Caractéristique</th>{funds.map(fund => <th key={fund.isin}>{fund.label}</th>)}</tr></thead>
        <tbody>{[
          ['ISIN', fund => fund.isin],
          ['Indice', fund => INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.benchmark],
          ['Frais annuels', fund => ETF_TER_BY_ISIN[fund.isin] ? `${ETF_TER_BY_ISIN[fund.isin]} %` : null],
          ['PEA', fund => { const pea = getInstrumentPeaStatus(fund.isin); return pea === true ? 'Oui' : pea === false ? 'Non' : null }],
          ['Revenus', fund => INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.distribution],
          ['Réplication et domicile', fund => INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.location],
          ['Couverture de change', fund => INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.currencyHedge ?? 'Aucune couverture indiquée'],
        ].map(([label, getValue]) => <tr key={label}><th>{label}</th>{funds.map(fund => <td key={fund.isin}>{getValue(fund) ?? 'Non documenté'}</td>)}</tr>)}</tbody>
      </table>
    </div>}
  </section>
}
