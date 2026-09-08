import { useEffect, useRef, useState } from 'react'
import { ASSET_ORDER, ASSETS } from './data'
import {
  isVideoExportSupported,
  renderResultVideo,
  renderComparativeVideo,
  getComparativeAssetIssue,
  computeComparativeSeries,
} from './videoExport'
import { pct } from './lib'
import Button from '../../design-system/Button'

function triggerAnchorDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 'custom' (saisie manuelle) n'a pas de points[] ni de date min vérifiée — hors périmètre du mode
// Comparatif, qui compare deux séries historiques réelles.
const COMPARATIVE_ASSET_IDS = ASSET_ORDER

// Bouton "Générer la vidéo" du Calculateur — anime sur un <canvas> une (mode Simple) ou deux (mode
// Comparatif) série(s) déjà calculée(s) par derive()/computeAssetSeries (aucun nouveau calcul, cf.
// videoExport.js) et l'enregistre via MediaRecorder. 100% côté client, aucun service tiers.
export default function VideoExport({ videoParams, filenameBase, comparativeInputs }) {
  const canvasRef = useRef(null)
  const [compMode, setCompMode] = useState('simple') // simple | comparative
  const [status, setStatus] = useState('idle') // idle | recording | done | error
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const supported = isVideoExportSupported()

  const defaultAsset1 = comparativeInputs?.defaultAssetId ?? COMPARATIVE_ASSET_IDS[0]
  const defaultAsset2 = COMPARATIVE_ASSET_IDS.find((id) => id !== defaultAsset1) ?? COMPARATIVE_ASSET_IDS[1]
  const [asset1Id, setAsset1Id] = useState(defaultAsset1)
  const [asset2Id, setAsset2Id] = useState(defaultAsset2)

  useEffect(
    () => () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    },
    [videoUrl]
  )

  function resetVideo() {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    setStatus('idle')
    setProgress(0)
  }

  function switchMode(next) {
    if (next === compMode) return
    setCompMode(next)
    resetVideo()
  }

  function changeAsset1(id) {
    setAsset1Id(id)
    resetVideo()
  }

  function changeAsset2(id) {
    setAsset2Id(id)
    resetVideo()
  }

  const issue1 = compMode === 'comparative' && comparativeInputs
    ? getComparativeAssetIssue(asset1Id, comparativeInputs.startYm, comparativeInputs.mode)
    : null
  const issue2 = compMode === 'comparative' && comparativeInputs
    ? getComparativeAssetIssue(asset2Id, comparativeInputs.startYm, comparativeInputs.mode)
    : null
  const comparativeBlocked = Boolean(issue1 || issue2)

  async function handleGenerateSimple() {
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

  async function handleGenerateComparative() {
    const { amount, startYm, endYm, mode, periodLabel, modeLabel, overrideAssetId, overridePriceRaw } = comparativeInputs
    setStatus('recording')
    setProgress(0)
    try {
      const s1 = computeComparativeSeries(asset1Id, startYm, endYm, amount, mode, asset1Id === overrideAssetId ? overridePriceRaw : '')
      const s2 = computeComparativeSeries(asset2Id, startYm, endYm, amount, mode, asset2Id === overrideAssetId ? overridePriceRaw : '')
      const params = {
        canvas: canvasRef.current,
        series1: s1.series,
        series2: s2.series,
        invested1: s1.invested,
        invested2: s2.invested,
        asset1Label: `${ASSETS[asset1Id].icon} ${ASSETS[asset1Id].label}`,
        asset2Label: `${ASSETS[asset2Id].icon} ${ASSETS[asset2Id].label}`,
        periodLabel,
        modeLabel,
        finalValue1: s1.finalValue,
        finalValue2: s2.finalValue,
        gainPct1: pct(s1.finalValue, s1.totalInvested),
        gainPct2: pct(s2.finalValue, s2.totalInvested),
      }
      const blob = await renderComparativeVideo(params, setProgress)
      setVideoUrl(URL.createObjectURL(blob))
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  function handleGenerate() {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    if (compMode === 'comparative') handleGenerateComparative()
    else handleGenerateSimple()
  }

  if (!supported) {
    return <p className="ic-hint">🎬 Génération vidéo indisponible sur ce navigateur (MediaRecorder non supporté).</p>
  }

  const filename =
    compMode === 'comparative'
      ? `${filenameBase}-comparatif-${asset1Id}-vs-${asset2Id}.webm`
      : `${filenameBase}.webm`

  return (
    <div className="ic-video-export">
      <div className="ic-segmented ic-video-mode-toggle">
        <button type="button" className={compMode === 'simple' ? 'active' : ''} onClick={() => switchMode('simple')}>
          Simple
        </button>
        <button type="button" className={compMode === 'comparative' ? 'active' : ''} onClick={() => switchMode('comparative')}>
          Comparatif
        </button>
      </div>

      {compMode === 'comparative' && comparativeInputs && (
        <div className="ic-video-comparative-fields">
          <div className="ic-row2">
            <div>
              <select className="ic-control" value={asset1Id} onChange={(e) => changeAsset1(e.target.value)}>
                {COMPARATIVE_ASSET_IDS.filter((id) => id !== asset2Id).map((id) => (
                  <option key={id} value={id}>
                    {ASSETS[id].icon} {ASSETS[id].label}
                  </option>
                ))}
              </select>
              {issue1 && <p className="ic-field-error">{issue1}</p>}
            </div>
            <div>
              <select className="ic-control" value={asset2Id} onChange={(e) => changeAsset2(e.target.value)}>
                {COMPARATIVE_ASSET_IDS.filter((id) => id !== asset1Id).map((id) => (
                  <option key={id} value={id}>
                    {ASSETS[id].icon} {ASSETS[id].label}
                  </option>
                ))}
              </select>
              {issue2 && <p className="ic-field-error">{issue2}</p>}
            </div>
          </div>
        </div>
      )}

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
        <Button
          type="button"
          variant="secondary"
          onClick={handleGenerate}
          disabled={status === 'recording' || (compMode === 'comparative' && comparativeBlocked)}
        >
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
