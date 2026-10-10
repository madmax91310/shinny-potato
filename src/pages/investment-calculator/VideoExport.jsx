import { copyPublicationText, startPublicationDownload } from '../../design-system/publicationActions.js'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ASSET_ORDER, ASSETS, SPARSE_MONTHLY_DATA_IDS } from '../../data/market-history.js'
import {
  isVideoExportSupported,
  renderResultVideo,
  renderComparativeVideo,
  getComparativeAssetIssue,
} from './videoExport.js'
import { pct } from './lib'
import { computeComparison, buildComparisonTweet } from './comparison.js'
import Button from '../../design-system/Button'

function triggerAnchorDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  startPublicationDownload(a)
  document.body.removeChild(a)
}

// 'custom' (saisie manuelle) n'a pas de points[] ni de date min vérifiée — hors périmètre du mode
// Comparatif, qui compare deux séries historiques réelles.
const COMPARATIVE_ASSET_IDS = ASSET_ORDER

// Mêmes libellés que App.jsx (d.effectiveMode === 'dca' ? 'DCA MENSUEL' : 'VERSEMENT UNIQUE') —
// affichés sur le canvas pour distinguer les deux côtés du duel quand ils portent sur le même actif.
const MODE_LABELS = { lump: 'VERSEMENT UNIQUE', dca: 'DCA MENSUEL' }

// Bouton "Générer la vidéo" du Calculateur — anime sur un <canvas> une (mode Simple) ou deux (mode
// Comparatif) série(s) déjà calculée(s) par derive()/computeAssetSeries (aucun nouveau calcul, cf.
// videoExport.js) et l'enregistre via MediaRecorder. 100% côté client, aucun service tiers.
export default function VideoExport({ videoParams, filenameBase, comparativeInputs, onModeChange }) {
  const canvasRef = useRef(null)
  const [compMode, setCompMode] = useState('simple') // simple | comparative
  const [status, setStatus] = useState('idle') // idle | recording | done | error
  const [copied, setCopied] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const supported = isVideoExportSupported()

  const defaultAsset1 = comparativeInputs?.defaultAssetId ?? COMPARATIVE_ASSET_IDS[0]
  const defaultAsset2 = COMPARATIVE_ASSET_IDS.find((id) => id !== defaultAsset1) ?? COMPARATIVE_ASSET_IDS[1]
  const [asset1Id, setAsset1Id] = useState(defaultAsset1)
  const [asset2Id, setAsset2Id] = useState(defaultAsset2)
  // Mode (versement unique / DCA) par actif — auparavant un seul mode partagé par les deux côtés du
  // duel (cf. comparativeInputs.mode, hérité du panneau Simple). Ajouté pour permettre de comparer le
  // MÊME actif sous ses deux modes (ex. Bitcoin en DCA vs Bitcoin en versement unique) — cf. demande
  // utilisateur du 14/09/2026. Initialisés au mode du panneau Simple pour ne rien changer au
  // comportement par défaut (deux actifs différents, même mode) tant que l'utilisateur ne les change
  // pas explicitement.
  const [mode1, setMode1] = useState(comparativeInputs?.mode ?? 'lump')
  const [mode2, setMode2] = useState(comparativeInputs?.mode ?? 'lump')

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
    onModeChange?.(next)
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

  function changeMode1(m) {
    setMode1(m)
    resetVideo()
  }

  function changeMode2(m) {
    setMode2(m)
    resetVideo()
  }

  const issue1 = compMode === 'comparative' && comparativeInputs
    ? getComparativeAssetIssue(asset1Id, comparativeInputs.startYm, mode1, comparativeInputs.endYm)
    : null
  const issue2 = compMode === 'comparative' && comparativeInputs
    ? getComparativeAssetIssue(asset2Id, comparativeInputs.startYm, mode2, comparativeInputs.endYm)
    : null
  // Un même actif comparé à lui-même avec le même mode n'a rien à montrer (deux courbes identiques) —
  // bloqué comme les autres "issues", jamais silencieusement autorisé. Comparer le même actif reste
  // valide dès que les modes diffèrent (c'est justement le nouveau cas d'usage : DCA vs versement
  // unique sur un même actif).
  const sameDuel = asset1Id === asset2Id && mode1 === mode2
  const comparativeBlocked = Boolean(issue1 || issue2 || sameDuel)

  const comparison = useMemo(() => compMode === 'comparative' && comparativeInputs && !comparativeBlocked
    ? computeComparison(comparativeInputs, asset1Id, asset2Id, mode1, mode2) : null,
    [compMode, comparativeInputs, comparativeBlocked, asset1Id, asset2Id, mode1, mode2])
  const comparisonText = comparison ? buildComparisonTweet(comparison) : ''

  useEffect(() => {
    // URL cleanup is owned by the effect above. Avoid depending on videoUrl:
    // completing an export must not immediately clear the newly created video.
    setVideoUrl(null)
    setStatus('idle')
    setProgress(0)
    setCopied('idle')
  }, [videoParams, comparisonText])

  async function copyComparison() {
    try {
      await copyPublicationText(comparisonText)
      setCopied('done')
    } catch {
      setCopied('error')
    }
  }

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
    const { startYm, endYm, sides } = comparison
    const [s1, s2] = sides.map(side => side.result)
    setStatus('recording')
    setProgress(0)
    try {
      const params = {
        canvas: canvasRef.current,
        series1: s1.series,
        series2: s2.series,
        invested1: s1.invested,
        invested2: s2.invested,
        // months1/months2 + startYm/endYm : permettent au rendu de placer chaque point à sa vraie
        // position chronologique plutôt qu'à une position d'index uniforme — indispensable dès que
        // s1/s2 n'ont pas le même nombre de points (actif à grain annuel comparé à un actif à
        // données mensuelles, cf. sparseAssetSeries dans lib.js et revealSide dans videoExport.js).
        months1: s1.months,
        months2: s2.months,
        startYm,
        endYm,
        sourceCredit: ASSETS[asset1Id].sourceCredit || ASSETS[asset2Id].sourceCredit,
        asset1Label: `${ASSETS[asset1Id].icon} ${ASSETS[asset1Id].label}`,
        asset2Label: `${ASSETS[asset2Id].icon} ${ASSETS[asset2Id].label}`,
        periodLabel: comparativeInputs.periodLabel,
        mode1Label: MODE_LABELS[mode1],
        mode2Label: MODE_LABELS[mode2],
        finalValue1: s1.finalValue,
        finalValue2: s2.finalValue,
        gainPct1: pct(s1.finalValue, s1.totalInvested),
        gainPct2: pct(s2.finalValue, s2.totalInvested),
        currency1: ASSETS[asset1Id].currency,
        currency2: ASSETS[asset2Id].currency,
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



  // Même actif des deux côtés (DCA vs versement unique) : "asset-vs-asset" ne distinguerait plus les
  // deux exports, d'où le suffixe de mode dans ce cas précis.
  const filename =
    compMode === 'comparative'
      ? asset1Id === asset2Id
        ? `${filenameBase}-comparatif-${asset1Id}-${mode1}-vs-${mode2}.webm`
        : `${filenameBase}-comparatif-${asset1Id}-vs-${asset2Id}.webm`
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
              <ChoicePicker className="ic-control" value={asset1Id} onChange={(e) => changeAsset1(e.target.value)}>
                {COMPARATIVE_ASSET_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ASSETS[id].icon} {ASSETS[id].label}
                  </option>
                ))}
              </ChoicePicker>
              <div className="ic-segmented ic-video-mode-toggle">
                <button type="button" className={mode1 === 'lump' ? 'active' : ''} onClick={() => changeMode1('lump')}>
                  Versement unique
                </button>
                <button
                  type="button"
                  className={mode1 === 'dca' ? 'active' : ''}
                  disabled={SPARSE_MONTHLY_DATA_IDS.has(asset1Id)}
                  onClick={() => changeMode1('dca')}
                >
                  Mensuel (DCA)
                </button>
              </div>
              {issue1 && <p className="ic-field-error">{issue1}</p>}
            </div>
            <div>
              <ChoicePicker className="ic-control" value={asset2Id} onChange={(e) => changeAsset2(e.target.value)}>
                {COMPARATIVE_ASSET_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ASSETS[id].icon} {ASSETS[id].label}
                  </option>
                ))}
              </ChoicePicker>
              <div className="ic-segmented ic-video-mode-toggle">
                <button type="button" className={mode2 === 'lump' ? 'active' : ''} onClick={() => changeMode2('lump')}>
                  Versement unique
                </button>
                <button
                  type="button"
                  className={mode2 === 'dca' ? 'active' : ''}
                  disabled={SPARSE_MONTHLY_DATA_IDS.has(asset2Id)}
                  onClick={() => changeMode2('dca')}
                >
                  Mensuel (DCA)
                </button>
              </div>
              {issue2 && <p className="ic-field-error">{issue2}</p>}
            </div>
          </div>
          {sameDuel && (
            <p className="ic-field-error">
              Choisis deux actifs différents, ou le même actif avec deux modes différents (DCA vs versement unique) — deux courbes identiques n'ont rien à comparer.
            </p>
          )}
        </div>
      )}

      {comparisonText && (
        <div className="ic-comparison-post">
          <label htmlFor="ic-comparison-text">Texte du comparatif</label>
          <textarea id="ic-comparison-text" className="ic-control" value={comparisonText} readOnly rows={16} style={{ width: '100%', margin: '12px 0', resize: 'vertical' }} />
          <Button type="button" onClick={copyComparison}>
            {copied === 'done' ? '✓ Copié' : copied === 'error' ? 'Copie impossible — sélectionne le texte ci-dessus' : '𝕏 Copier le texte du comparatif'}
          </Button>
        </div>
      )}
      {!supported && <p className="ic-hint">🎬 Génération vidéo indisponible sur ce navigateur. Le texte du comparatif reste disponible.</p>}
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
          disabled={!supported || status === 'recording' || (compMode === 'comparative' && comparativeBlocked)}
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
