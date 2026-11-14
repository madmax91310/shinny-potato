import { lazy, Suspense, useState } from 'react'
import Button from '../../design-system/Button.jsx'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { normalizeText } from '../../lib/tweet-discovery.js'
import { SUNDAY_THEMES } from './sunday-questions.js'
import { isInCooldown, randomAvailableQuestion } from './lib.js'
import { COOLDOWN_DAYS } from './data.js'
const QuestionCounter = lazy(() => import('./QuestionCounter.jsx'))

export default function SundayPanel({ tweets, drafts, setDrafts, resetFilters, list, groupDates, randomId, setRandomId }) {
  const [personalText, setPersonalText] = useState('')
  const [personalTheme, setPersonalTheme] = useState(SUNDAY_THEMES[0])
  const [addError, setAddError] = useState('')
  function addQuestion(event) {
    event.preventDefault()
    const text = personalText.trim()
    if (!text) { setAddError('Écris une question avant de l’ajouter.'); return }
    if (tweets.some(t => [t.text, drafts[t.id]?.text].some(value => value && normalizeText(value) === normalizeText(text)))) {
      setAddError('Ce texte existe déjà dans la banque.'); return
    }
    const id = `sunday:personal:${crypto.randomUUID()}`
    const question = { id, text, theme: personalTheme, category: 'Question dimanche', month: 'Intemporel', formats: ['Question dimanche'], personal: true }
    setDrafts(previous => ({ ...previous, [id]: { text, question } }))
    setPersonalText(''); setAddError(''); resetFilters({ search: '', theme: null, unpublished: false, month: null, format: null })
  }
  return <section className="tb-sunday-intro">
        <h2>Question dimanche</h2>
        <p>Une question le dimanche soir pour parler argent, choix et vécu. Personnalise le texte, puis copie-le. Coche « Publié » après publication.</p>
        <p>Chaque question publiée reste au repos pendant {COOLDOWN_DAYS} jours, puis peut être tirée à nouveau. Après une nouvelle publication, clique sur « Marquer republié aujourd’hui » pour relancer le délai.</p>
        <p>Questions personnelles, modifications et dates sont conservées dans ce navigateur.</p>
        <Button type="button" disabled={!list.some(t => !isInCooldown(groupDates[t.id]))} onClick={() => setRandomId(randomAvailableQuestion(list, groupDates)?.id ?? null)}>Tirer une question disponible</Button>
        {randomId && <Button type="button" variant="ghost" onClick={() => setRandomId(null)}>Revoir toutes les questions</Button>}
        <details className="tb-personal-question">
          <summary>＋ Ajouter une question personnelle</summary>
          <form onSubmit={addQuestion}>
            <label>Thème de ma question <ChoicePicker value={personalTheme} onChange={event => setPersonalTheme(event.target.value)}>{SUNDAY_THEMES.map(theme => <option key={theme}>{theme}</option>)}</ChoicePicker></label>
            <label>Ma question<textarea value={personalText} onChange={event => setPersonalText(event.target.value)} rows={6} /></label>
            <Suspense fallback={<p>Comptage des caractères…</p>}><QuestionCounter text={personalText} /></Suspense>
            {addError && <p role="alert">{addError}</p>}
            <Button type="submit">Ajouter à la banque</Button>
          </form>
        </details>
      </section>
}
