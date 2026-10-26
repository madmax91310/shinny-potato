import { useEffect, useRef } from 'react'
import Button from '../../design-system/Button'
export default function ManualCopy({ text }) {
  const field = useRef(null)
  useEffect(() => { field.current?.focus(); field.current?.select() }, [])
  return <div className="hg-manual"><p>Le presse-papiers est indisponible. Sélectionne le texte puis utilise la copie de ton navigateur.</p><label>Copie manuelle<textarea ref={field} readOnly value={text} rows={5} onFocus={event => event.target.select()} /></label><Button variant="secondary" onClick={() => { field.current.focus(); field.current.select() }}>Sélectionner le texte</Button></div>
}
