import { useEffect, useRef, useState } from 'react'
import { isVideoExportSupported, renderResultVideo } from './videoExport'
import Button from '../../design-system/Button'

function triggerAnchorDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Bouton "Générer la vidéo" du Calculateur — anime sur un <canvas> la même série déjà calculée par
// derive() (aucun nouveau calcul, cf. videoExport.js) et l'enregistre via MediaRecorder. 100% côté
// client, aucun service tiers.
export default function VideoExport({ videoParams, filename }) {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | recording | done | error
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const supported = isVideoExportSupported()

  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    },
    [videoUrl]
  )

  async function handleGenerate() {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    setStatus('recording')
    setProgress(0)
    try {
      const blob = await renderResultVideo({ canvas: canvasRef.current, ...videoParams }, setProgress)
      setVideoUrl(URL.createObjectURL(blob))
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (!supported) {
    return <p className="ic-hint">🎬 Génération vidéo indisponible sur ce navigateur (MediaRecorder non supporté).</p>
  }

  return (
    <div className="ic-video-export">
      <canvas ref={canvasRef} className="ic-video-canvas" hidden={status === 'idle'} />
      {status === 'recording' && (
        <div className="ic-video-progress">
          <div className="ic-video-progress-track">
            <div className="ic-video-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="ic-hint">Génération de la vidéo… {Math.round(progress * 100)}%</p>
        </div>
      )}
      {status === 'error' && (
        <p className="ic-field-error">
          La génération a échoué — réessaie, ou vérifie que ton navigateur supporte l'enregistrement vidéo.
        </p>
      )}
      <div className="ic-video-actions">
        <Button type="button" variant="secondary" onClick={handleGenerate} disabled={status === 'recording'}>
          {status === 'recording' ? '⏳ Génération…' : status === 'done' ? '🔄 Régénérer la vidéo' : '🎬 Générer la vidéo'}
        </Button>
        {status === 'done' && videoUrl && (
          <Button type="button" onClick={() => triggerAnchorDownload(videoUrl, filename)}>
            ⬇️ Télécharger (.webm)
          </Button>
        )}
      </div>
    </div>
  )
}
