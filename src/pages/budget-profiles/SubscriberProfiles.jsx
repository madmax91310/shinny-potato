import Button from '../../design-system/Button'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { budgetDisplayName } from './lib.js'

export default function SubscriberProfiles({ drafts, activeId, onCreate, onChoose }) {
  const personal = drafts.filter(draft => draft.profile.kind === 'participant')
  return <div className="budget-backup">
    <p>Créez un budget avec vos propres lignes de revenus, dépenses et versements. Le texte et les deux images suivent vos montants ; vous rédigez les questions.</p>
    <Button variant="secondary" onClick={onCreate}>Nouveau profil d’abonné</Button>
    {personal.length ? <label>Profils enregistrés<ChoicePicker aria-label="Choisir un profil d’abonné" value={activeId} onChange={e => onChoose(personal.find(draft => draft.profile.id === e.target.value)?.profile)}>
      {personal.map(({ profile }) => <option key={profile.id} value={profile.id}>{budgetDisplayName(profile).trim() || 'Profil sans prénom'}</option>)}
    </ChoicePicker></label> : <p>Aucun profil d’abonné enregistré pour le moment.</p>}
    <p className="dca-note">Les profils sont conservés dans ce navigateur. « Brouillons et transfert entre appareils » permet de les exporter et de les restaurer sur un autre appareil.</p>
  </div>
}
