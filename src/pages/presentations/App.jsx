import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Insurance from '../insurance-presentation/App'
import Scpi from '../scpi-presentation/App'
import Actors from './Actors'
import { ACTOR_FAMILIES } from '../../data/presentation-actors.js'
import { PresentationDrafts } from '../presentation-shared/drafts.jsx'
import './style.css'
const families = [{ id: 'insurance', label: 'Assurance-vie' }, { id: 'scpi', label: 'SCPI' }, ...ACTOR_FAMILIES]
export default function App() {
  const [params, setParams] = useSearchParams()
  const family = families.some(row => row.id === params.get('famille')) ? params.get('famille') : 'insurance'
  const drafts = useState({})
  return <div className="presentations">
    <PageHeader title="Présentations" subtitle="Un acteur, son offre et ce que tu détiens : prépare ton texte et son visuel." />
    <section className="presentation-families">
      <h2>Choisir une exposition</h2>
      <ChoicePicker aria-label="Choisir une famille" value={family} onChange={event => setParams({ famille: event.target.value })}>
        {families.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}
      </ChoicePicker>
    </section>
    <PresentationDrafts.Provider value={drafts}>
      {family === 'insurance' ? <Insurance embedded /> : family === 'scpi' ? <Scpi embedded /> : <Actors key={family} family={family} />}
    </PresentationDrafts.Provider>
  </div>
}
