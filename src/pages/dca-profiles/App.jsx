import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { PROFILES } from './data.js'
import { buildTweetText, pickUnseenProfile } from './lib.js'
import './dca-profiles.css'

export default function App() {
  const [id, setId] = useState(PROFILES[0].id)
  const [draft, setDraft] = useState(buildTweetText(PROFILES[0]))
  const [feedback, setFeedback] = useState('')
  const seen = useRef(new Set([PROFILES[0].id]))
  const profile = PROFILES.find(item => item.id === id)
  function select(next) {
    setId(next.id)
    setDraft(buildTweetText(next))
    seen.current.add(next.id)
    setFeedback('')
  }
  async function copy() {
    try { await copyPublicationText(draft); setFeedback('Texte copié.') }
    catch { setFeedback('Copie impossible. Sélectionne le texte pour le copier.') }
  }
  return <div className="dca-profiles-scope">
    <PageHeader title="Le DCA de…" subtitle="30 scénarios fictifs pour discuter de choix d’investissement. Les revenus sont individuels ; les montants investis sont des objectifs mensuels. Selon le courtier, les achats peuvent nécessiter des fractions ou être regroupés sur plusieurs mois." />
    <ToolWorkspace actions={<Button type="button" onClick={copy} disabled={!draft.trim()}>Copier le texte</Button>}>
      <section className="tool-settings">
        <p className="dca-note">30 profils fictifs · Revenus nets mensuels individuels</p>
        <ChoicePicker aria-label="Choisir un profil DCA" value={id} onChange={event => select(PROFILES.find(item => item.id === event.target.value))}>
          {PROFILES.map(item => <option key={item.id} value={item.id}>{item.name} · {item.age} ans · {item.job} · {item.monthly}€/mois</option>)}
        </ChoicePicker>
        <div className="dca-buttons">
          <Button type="button" variant="secondary" onClick={() => select(pickUnseenProfile(PROFILES, id, seen.current))}>Autre profil aléatoire</Button>
          <Button type="button" variant="secondary" onClick={() => { setDraft(buildTweetText(profile)); setFeedback('') }}>Rétablir le texte</Button>
        </div>
        <p className="dca-note">Les scénarios sont construits pour ouvrir la discussion, avec des allocations plus ou moins concentrées.</p>
      </section>
      <section className="tool-preview">
        <label className="dca-label" htmlFor="dca-draft">Texte prêt à publier</label>
        <textarea id="dca-draft" value={draft} onChange={event => { setDraft(event.target.value); setFeedback('') }} />
        <p className="dca-note">{Array.from(draft).length} caractères</p>
        <p role="status" aria-live="polite">{feedback}</p>
      </section>
    </ToolWorkspace>
  </div>
}
