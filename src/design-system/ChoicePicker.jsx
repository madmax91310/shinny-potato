import { Children, useId, useLayoutEffect, useRef, useState } from 'react'
import { normalizeSearch } from '../data/asset-selection.js'
import './asset-picker.css'

// Retain the callers' option values while presenting every choice as a real button.
function choices(children, group = '') {
  return Children.toArray(children).flatMap(child => {
    if (!child || typeof child !== 'object') return []
    if (child.type === 'option') return [{ ...child.props, group }]
    return choices(child.props.children, child.type === 'optgroup' ? child.props.label : group)
  })
}
function text(children) {
  return Children.toArray(children).map(child => typeof child === 'object' ? text(child.props.children) : child).join('')
}
export default function ChoicePicker({ children, value, onChange, className = '', id, disabled, ...props }) {
  const uniqueId = useId()
  const ref = useRef(null)
  const [label, setLabel] = useState('')
  const [query, setQuery] = useState('')
  const items = choices(children)
  useLayoutEffect(() => {
    const node = ref.current
    const external = id ? [...document.querySelectorAll('label')].find(item => item.htmlFor === id) : null
    const parent = node.closest('label')
    setLabel(external?.textContent?.trim() || (parent ? [...parent.childNodes].filter(item => item.nodeType === 3).map(item => item.textContent).join('').trim() : '') || 'Choisir une option')
  }, [id])
  const name = props['aria-label'] || label
  const filtered = items.filter(item => normalizeSearch(text(item.children)).includes(normalizeSearch(query)))
  return <div {...props} id={id ?? uniqueId} ref={ref} role="group" aria-label={name}
    data-selector data-value={String(value ?? '')} className={`choice-picker ${className}`}>
    {items.length > 8 && <input type="search" aria-label={`Rechercher : ${name}`} placeholder="Rechercher…" value={query} onChange={event => setQuery(event.target.value)} />}
    <div className="choice-picker-grid">
      {filtered.map(item => <button type="button" key={item.value} data-option data-value={String(item.value)}
        aria-pressed={String(value) === String(item.value)} disabled={disabled || item.disabled}
        onClick={() => onChange?.({ target: { value: String(item.value) } })}>
        {item.group && <small>{item.group}</small>}<span>{item.children}</span><i aria-hidden="true">{String(value) === String(item.value) ? '✓' : '+'}</i>
      </button>)}
      {!filtered.length && <p role="status">Aucun résultat.</p>}
    </div>
  </div>
}
