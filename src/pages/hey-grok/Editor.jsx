import { useEffect, useRef, useState } from 'react'
import ManualCopy from './ManualCopy'
import Button from '../../design-system/Button'
import { BANK_BY_ID } from './catalog.js'
import { TEMPLATES, THEMES } from './taxonomy.js'
import { renderTemplate, templateDefaults, tweetStatus } from './lib.js'
export default function Editor({ editor, open, personal, error, notice, manual, onChange, onClose, onSave, onDiscard, onCopy }) {
  const dialog = useRef(null)
  const [pendingTemplate, setPendingTemplate] = useState(null)
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal()
    if (!open && dialog.current.open) dialog.current.close()
  }, [open])
  useEffect(() => { if (!open) setPendingTemplate(null) }, [open])
  const status = tweetStatus(editor.text)
  const original = BANK_BY_ID.get(editor.sourceId) ?? BANK_BY_ID.get(personal.find(q => q.id === editor.sourceId)?.originId)
  const model = TEMPLATES.find(t => t.id === editor.template) ?? TEMPLATES[0]
  function changeTemplate(id) {
    if (id === editor.template) return
    if (editor.text.trim() && (editor.customized || editor.paramsDirty)) setPendingTemplate(id)
    else applyTemplate(id)
  }
  function applyTemplate(id) {
    const params = templateDefaults(id)
    onChange({ ...editor, template: id, params, text: renderTemplate(id, params), customized: false, paramsPending: false, paramsDirty: false })
    setPendingTemplate(null)
  }
  function changeParam(key, value) {
    const params = { ...editor.params, [key]: value }
    onChange({ ...editor, params, paramsDirty: true, paramsPending: editor.customized, text: editor.customized ? editor.text : renderTemplate(editor.template, params) })
  }
  function containKeyboard(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex="0"]')].filter(node => node.getClientRects().length)
    if (!controls.length) return
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return <dialog className="hg-dialog" ref={dialog} onKeyDown={containKeyboard} aria-labelledby="hg-editor-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="hg-editor-heading"><h2 id="hg-editor-title">{editor.sourceId ? 'Modifier la question' : 'Créer ma question'}</h2><Button variant="ghost" onClick={onClose}>Fermer et garder le brouillon</Button></div>
    {error && <p role="alert" className="hg-invalid">{error}</p>}
    {editor.sourceKind === 'bank' && <p className="hg-note">Enregistrer crée une variante personnelle. Le texte de la banque, ses favoris et ses usages restent indépendants.</p>}
    <details className="hg-models"><summary>Modèles de question</summary><p className="hg-note">Exemples hypothétiques : adapte les montants et les choix à ta question.</p><div role="group" aria-label="Modèles" className="hg-chips">{TEMPLATES.map(template => <button type="button" key={template.id} aria-pressed={editor.template === template.id} onClick={() => changeTemplate(template.id)}>{template.label}</button>)}</div></details>
    {pendingTemplate !== null && <div className="hg-warning" role="alert"><p>Changer de modèle remplace le texte actuel. Ton brouillon reste intact tant que tu n’as pas confirmé.</p><Button variant="secondary" onClick={() => applyTemplate(pendingTemplate)}>Appliquer le modèle</Button><Button variant="ghost" onClick={() => setPendingTemplate(null)}>Garder mon texte</Button></div>}
    {model.fields.length > 0 && <div className="hg-params">{model.fields.map(field => <label key={field.key}>{field.label}<input value={editor.params[field.key] ?? ''} onChange={event => changeParam(field.key, event.target.value)} /></label>)}</div>}
    {editor.paramsPending && <div className="hg-warning"><p>Le texte personnalisé est conservé. Appliquer les paramètres le remplacera par le modèle.</p><Button variant="secondary" onClick={() => onChange({ ...editor, text: renderTemplate(editor.template, editor.params), customized: false, paramsPending: false })}>Appliquer les paramètres</Button></div>}
    <label htmlFor="hg-editor-text">Tweet complet</label>
    <textarea autoFocus id="hg-editor-text" rows={7} value={editor.text} aria-describedby="hg-counter hg-editor-status" aria-invalid={!status.canCopy} onChange={event => onChange({ ...editor, text: event.target.value, customized: true })} />
    <p id="hg-counter" role="status" className={status.over ? 'hg-counter hg-invalid' : 'hg-counter'}>{status.length} / 280{status.over ? ` · Dépassement de ${status.over} caractères` : ''}</p>
    <p id="hg-editor-status" className="hg-note">{status.over ? 'Tu peux enregistrer ce brouillon trop long ; la copie restera désactivée.' : !status.prefix ? 'Le tweet doit commencer par « Hey @grok ».' : !status.canCopy ? 'Ajoute une question après la mention pour pouvoir copier.' : 'Le compteur inclut exactement ce qui sera copié, mention et retours à la ligne compris.'}</p>
    <details className="hg-personal-theme"><summary>Thème de ma question : {THEMES.find(theme => theme.id === editor.theme)?.label}</summary><div className="hg-chips" role="group" aria-label="Thème de ma question">{THEMES.map(theme => <button key={theme.id} type="button" aria-pressed={editor.theme === theme.id} onClick={() => onChange({ ...editor, theme: theme.id })}>{theme.label}</button>)}</div></details>
    <div className="hg-editor-actions"><Button disabled={!status.canCopy} onClick={() => onCopy(editor.text)}>Copier</Button><Button variant="secondary" onClick={onSave}>Enregistrer</Button><Button variant="ghost" onClick={onDiscard}>Annuler</Button>{original && <Button variant="ghost" onClick={() => onChange({ ...editor, text: original.text, customized: true, paramsPending: false })}>Restaurer l’original</Button>}</div>
    {notice && <p role="status">{notice}</p>}
    {manual !== null && <ManualCopy text={manual} />}
    <p className="hg-note">Fermer ou changer d’écran garde le brouillon. « Annuler » l’abandonne explicitement. Copier ne marque jamais la question comme utilisée.</p>
  </dialog>
}
