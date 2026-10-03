import WorkspaceActions from '../../design-system/WorkspaceActions'
import { useEffect, useRef, useState } from 'react'
import Button from '../../design-system/Button'
import { drawBrokerVersus } from './versus-image'

export default function BrokerVersusCard({ selected }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const duel = selected.length === 2
  const left = selected[0]
  const right = selected[1]

  useEffect(() => {
    if (!duel) return
    let active = true
    setError('')
    setReady(false)
    drawBrokerVersus(canvasRef.current, left, right, () => active).then(() => {
      if (active) setReady(true)
    }).catch((cause) => {
      if (active) setError(cause.message)
    })
    return () => { active = false }
  }, [duel, left, right])

  function download() {
    const canvas = canvasRef.current
    if (!canvas || error || !ready) return
    canvas.toBlob((blob) => {
      if (!blob) { setError('Impossible de préparer le PNG.'); return }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `duel-courtiers-${left}-${right}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <section className="bc-panel bc-versus" aria-labelledby="bc-versus-title">
      <h2 id="bc-versus-title">Image du duel</h2>
      <p className="bc-hint">Visuel 1600 × 900 inspiré de ta référence. Logos repris des sites ou documents officiels des courtiers ; les données du comparatif restent dans le post et le registre.</p>
      {duel ? <>
        <canvas ref={canvasRef} className="bc-versus-canvas" aria-label={`Visuel ${left} contre ${right}`} />
        {error && <p role="alert" className="bc-select-warning">{error}</p>}
        <WorkspaceActions><Button type="button" onClick={download} disabled={Boolean(error) || !ready}>Télécharger l’image PNG</Button></WorkspaceActions>
      </> : <p className="bc-select-warning">Sélectionne exactement deux courtiers pour créer l’image du duel.</p>}
    </section>
  )
}
