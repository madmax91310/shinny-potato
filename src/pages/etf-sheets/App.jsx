import { getPresentationCopy, presentationTicker } from './editorial.js'
import ActionMenu from '../../design-system/ActionMenu'
import { downloadImage } from '../../design-system/downloadImage'
import AssetPicker from '../../design-system/AssetPicker'
import SupportAlternatives from './SupportAlternatives'
import { instrumentOption } from '../../data/asset-selection.js'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_EMOJI, ETFS } from '../../data/etf-cards.js'
import { formatTweetPerformance, getAnnualPerformance } from './annualPerformance'
import { accountLabel, buildText } from './lib'
import { renderETFImage } from './canvasImage'
import { INSTRUMENT_AUM_BY_ISIN } from '../../data/instrument-aum'
import { commodityAllocationLines } from '../../data/commodity-allocation'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './etf-sheets.css'

const byId = Object.fromEntries(ETFS.map((e) => [e.id, e]))

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(ta)
  return ok
}

function triggerAnchorDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function EtfCard({ etf: sourceEtf }) {
  const etf = getPresentationCopy(sourceEtf)
  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  const tickerStr = presentationTicker(etf)
  const annual = getAnnualPerformance(etf)
  const commodities = commodityAllocationLines(etf.isin)

  return (
    <article className="es-card">
      <p className="es-engagement">{etf.hook}</p>
      <h2 className="es-identity">
        <span className="es-dot">{dot}</span>
        <span className="es-name">{etf.name}</span>
        {tickerStr && <span className="es-tickers">({tickerStr})</span>}
      </h2>

      <ul className="es-facts">
        <li className="mono">
          <span className="es-fi">🆔</span>
          <span className="es-fv">ISIN : {etf.isin}</span>
        </li>
        {etf.listing && <li><span className="es-fi">📍</span><span className="es-fv">Cotation : {etf.listing.exchange} · {etf.listing.currency}</span></li>}
        <li>
          <span className="es-fi">💸</span>
          <span className="es-fv">Frais annuels : {etf.ter}</span>
        </li>
        <li>
          <span className="es-fi">📦</span>
          <span className="es-fv">{etf.positions}</span>
        </li>
        <li>
          <span className="es-fi">💰</span>
          <span className="es-fv">
            Encours : {etf.aum}
            {etf.lastVerified && !INSTRUMENT_AUM_BY_ISIN[etf.isin]?.source && <span className="es-last-verified"> · vérifié le {etf.lastVerified}</span>}
          </span>
        </li>
        <li>
          <span className="es-fi">🔄</span>
          <span className="es-fv">{etf.distribution}</span>
        </li>
        <li>
          <span className="es-fi">🏦</span>
          <span className="es-fv">{accountLabel(etf)}</span>
        </li>
        <li>
          <span className="es-fi">📍</span>
          <span className="es-fv">{etf.location}</span>
        </li>
        {annual && <li>
          <span className="es-fi">📈</span>
          <span className="es-fv">{formatTweetPerformance(annual)}</span>
        </li>}
      </ul>

      {commodities.length > 0 && <section className="es-block">
        <h3 className="es-block-title">{commodities[0]}</h3>
        {commodities.slice(1).map(line => <p key={line}>{line}</p>)}
      </section>}

      <section className="es-block">
        <h3 className="es-block-title">🔍 Ce que tu achètes</h3>
        <p>{etf.whatIs}</p>
      </section>
      <section className="es-block">
        <h3 className="es-block-title">✅ L’intérêt de cette exposition</h3>
        <p>{etf.whyInteresting}</p>
      </section>
      <section className="es-block">
        <h3 className="es-block-title">⚠️ Ce qu’il faut garder en tête</h3>
        <p>{etf.whatToKnow}</p>
      </section>
      {etf.closing && <section className="es-block">
        <p>{etf.closing}</p>
      </section>}

      <div className="es-foot">
        <p className="es-engagement">💬 {etf.question}</p>
      </div>
    </article>
  )
}

function Lightbox({ dataUrl, filename, title, onClose }) {
  const [shareLabel, setShareLabel] = useState('📤 Partager / Enregistrer')
  const [downloadLabel, setDownloadLabel] = useState('⬇️ Télécharger')

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function shareOrSave() {
    if (navigator.share) {
      try {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        let file = null
        try {
          file = new File([blob], filename, { type: 'image/png' })
        } catch {
          file = null
        }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title })
        } else {
          await navigator.share({ title })
        }
        setShareLabel('✅ Partagé')
      } catch (err) {
        if (err?.name === 'AbortError') return
        triggerAnchorDownload(dataUrl, filename)
        setShareLabel('✅ Téléchargé')
      }
    } else {
      triggerAnchorDownload(dataUrl, filename)
      setShareLabel('✅ Téléchargé')
    }
    setTimeout(() => setShareLabel('📤 Partager / Enregistrer'), 1800)
  }

  function download() {
    triggerAnchorDownload(dataUrl, filename)
    setDownloadLabel('✅ Téléchargé')
    setTimeout(() => setDownloadLabel('⬇️ Télécharger'), 1800)
  }

  return (
    <div className="es-lightbox">
      <div className="es-lightbox-backdrop" onClick={onClose} />
      <div className="es-lightbox-panel" role="dialog" aria-modal="true" aria-label={`Aperçu : ${title}`}>
        <button type="button" className="es-lightbox-close" aria-label="Fermer l'aperçu" onClick={onClose}>
          ✕
        </button>
        <div className="es-lightbox-imgwrap">
          <img src={dataUrl} alt={`${title} prêt à être enregistré`} />
        </div>
        <p className="es-lightbox-hint">
          📱 Sur mobile : appuie longuement sur l'image puis choisis « Enregistrer l'image » pour l'ajouter à tes
          photos. 💻 Sur ordinateur : clic droit → « Enregistrer l'image sous » — ou utilise les boutons ci-dessous.
        </p>
        <div className="es-lightbox-actions">
          <Button type="button" onClick={shareOrSave}>
            {shareLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={download}>
            {downloadLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [currentId, setCurrentId] = useState('sp500')
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState('')
  const seenThisSession = useRef([currentId])

  const currentEtf = byId[currentId]

  const options = useMemo(() => ETFS.map(instrumentOption), [])

  function selectETF(id) {
    setCurrentId(id)
    setCopied(false)
    if (!seenThisSession.current.includes(id)) seenThisSession.current.push(id)
  }

  function pickRandom() {
    let pool = ETFS.filter((e) => !seenThisSession.current.includes(e.id))
    if (pool.length === 0) {
      seenThisSession.current = currentId ? [currentId] : []
      pool = ETFS.filter((e) => e.id !== currentId)
    }
    const candidates = pool.filter((e) => e.id !== currentId)
    const finalPool = candidates.length ? candidates : pool
    const choice = finalPool[Math.floor(Math.random() * finalPool.length)]
    selectETF(choice.id)
  }

  async function copyCurrent() {
    const text = buildText(currentEtf)
    let ok = true
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        ok = fallbackCopy(text)
      }
    } else {
      ok = fallbackCopy(text)
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  async function generateSummaryImage(directDownload = false) {
    if (imageBusy) return
    setImageBusy(true)
    setImageError('')
    try {
      const canvas = await renderETFImage(currentEtf)
      if (directDownload) downloadImage(canvas, `${currentEtf.id}-fiche-etf.png`)
      else setLightbox({ dataUrl: canvas.toDataURL('image/png'), filename: currentEtf.id + '-fiche-etf.png', title: currentEtf.name })
    } catch (error) {
      setImageError(error.message || 'L’image n’a pas pu être créée. Réessaie.')
    } finally {
      setImageBusy(false)
    }
  }


  return (
    <div className="es-scope">
      <PageHeader
        title="Présentation d'ETF"
        subtitle={`Bibliothèque de ${ETFS.length} ETF — vérifie les chiffres (ISIN, encours, performance) avant publication.`}
      />

      <ToolWorkspace renderImage={() => renderETFImage(currentEtf)} imageAlt={`Fiche ETF ${currentEtf.name}`} actions={<>
        <Button type="button" variant="secondary" onClick={copyCurrent}>{copied ? '✅ Copié !' : '📋 Copier le texte'}</Button>
        <Button type="button" onClick={() => generateSummaryImage(true)} disabled={imageBusy}>{imageBusy ? 'Création de l’image…' : 'Télécharger l’image'}</Button>
        <ActionMenu><Button type="button" variant="secondary" onClick={() => generateSummaryImage()} disabled={imageBusy}>🖼️ Image récapitulative</Button>
        </ActionMenu>
      </>}>
        <section className="es-preparation tool-settings" aria-labelledby="es-preparation-title">
          <div className="es-panel-heading"><h2 id="es-preparation-title">Réglages de la fiche</h2></div>
          <div className="es-controls">
            <div className="es-select-shell">
              <AssetPicker id="es-etf-select" className="es-select" label="Choisir un ETF" items={options} value={currentId} onChange={selectETF} selectOnGroupChange />
            </div>
            <Button type="button" variant="secondary" onClick={pickRandom}>🔄 ETF aléatoire</Button>
          </div>
          <p className="es-disclaimer" style={{ marginTop: 16 }}>Choisis un ETF, puis ouvre l’aperçu pour relire ta publication. Les boutons ci-dessous créent les visuels.</p>
          <SupportAlternatives key={currentId} etf={currentEtf} onSelect={selectETF} />
          {imageError && <p role="alert" className="es-disclaimer">{imageError}</p>}
        </section>
        <section className="tool-preview" aria-label="Publication ETF">
          <div className="es-preview-heading"><h2>Aperçu de la publication</h2></div>
          <EtfCard etf={currentEtf} />
          <p className="es-disclaimer" style={{ marginTop: 16 }}>Contenu pré-rédigé, données stockées en dur — aucune donnée de marché en temps réel.</p>
        </section>
      </ToolWorkspace>

      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
