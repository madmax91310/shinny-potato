import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_ORDER, CATEGORY_EMOJI, ETFS } from './data'
import { buildText } from './lib'
import { renderETFImage } from './canvasImage'
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

function EtfCard({ etf }) {
  const dot = CATEGORY_EMOJI[etf.category] || '⚫'
  const tickerStr = etf.tickers.join(' / ')

  return (
    <article className="es-card">
      <p className="es-card-kicker">📋 Présentation d'ETF</p>
      <h2 className="es-identity">
        <span className="es-dot">{dot}</span>
        <span className="es-name">{etf.name}</span>
        <span className="es-tickers">({tickerStr})</span>
        {etf.isNew && <span className="es-badge-new">🆕 Nouveau</span>}
      </h2>

      <ul className="es-facts">
        <li className="mono">
          <span className="es-fi">🆔</span>
          <span className="es-fv">ISIN : {etf.isin}</span>
        </li>
        <li>
          <span className="es-fi">💸</span>
          <span className="es-fv">Frais : {etf.ter}</span>
        </li>
        <li>
          <span className="es-fi">📦</span>
          <span className="es-fv">{etf.positions}</span>
        </li>
        <li>
          <span className="es-fi">💰</span>
          <span className="es-fv">Encours : {etf.aum}</span>
        </li>
        <li>
          <span className="es-fi">🔄</span>
          <span className="es-fv">{etf.distribution}</span>
        </li>
        <li>
          <span className="es-fi">🏦</span>
          <span>
            PEA : <span className={etf.pea ? 'es-yes' : 'es-no'}>{etf.pea ? '✅' : '❌'}</span>
            &nbsp;|&nbsp; CTO : <span className={etf.cto ? 'es-yes' : 'es-no'}>{etf.cto ? '✅' : '❌'}</span>
          </span>
        </li>
        <li>
          <span className="es-fi">📍</span>
          <span className="es-fv">{etf.location}</span>
        </li>
      </ul>

      <section className="es-block">
        <h3 className="es-block-title">🔍 C'est quoi ?</h3>
        <p>{etf.whatIs}</p>
      </section>
      <section className="es-block">
        <h3 className="es-block-title">✅ Pourquoi c'est intéressant ?</h3>
        <p>{etf.whyInteresting}</p>
      </section>
      <section className="es-block">
        <h3 className="es-block-title">⚠️ Ce qu'il faut savoir</h3>
        <p>{etf.whatToKnow}</p>
      </section>
      <section className="es-block">
        <h3 className="es-block-title">🏆 Verdict</h3>
        <p>{etf.verdict}</p>
      </section>

      <div className="es-foot">
        <p className="es-engagement">💬 {etf.question} 👇</p>
        <p className="es-disclaimer">⚠️ Pas un conseil en investissement</p>
      </div>
    </article>
  )
}

function Lightbox({ dataUrl, filename, onClose }) {
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
          await navigator.share({ files: [file], title: 'Fiche ETF' })
        } else {
          await navigator.share({ title: 'Fiche ETF' })
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
      <div className="es-lightbox-panel" role="dialog" aria-modal="true" aria-label="Aperçu de l'image de la fiche">
        <button type="button" className="es-lightbox-close" aria-label="Fermer l'aperçu" onClick={onClose}>
          ✕
        </button>
        <div className="es-lightbox-imgwrap">
          <img src={dataUrl} alt="Fiche ETF prête à être enregistrée" />
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
  const [currentId, setCurrentId] = useState('quantique')
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const seenThisSession = useRef([currentId])

  const currentEtf = byId[currentId]

  const optgroups = useMemo(
    () => CATEGORY_ORDER.map((cat) => ({ cat, etfs: ETFS.filter((e) => e.category === cat) })),
    [],
  )

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

  function generateImage() {
    const canvas = renderETFImage(currentEtf)
    setLightbox({ dataUrl: canvas.toDataURL('image/png'), filename: currentEtf.id + '-fiche-etf.png' })
  }

  return (
    <div className="es-scope">
      <PageHeader
        title="Présentation d'ETF"
        subtitle={`Bibliothèque de ${ETFS.length} ETF — vérifie les chiffres (ISIN, encours, performance) avant publication.`}
      />

      <div className="es-controls">
        <div className="es-select-shell">
          <select className="es-select" aria-label="Choisir un ETF" value={currentId} onChange={(e) => selectETF(e.target.value)}>
            {optgroups.map(({ cat, etfs }) => (
              <optgroup key={cat} label={`${CATEGORY_EMOJI[cat] || ''} ${cat}`}>
                {etfs.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.tickers.join('/')})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={pickRandom}>
          🔄 ETF aléatoire
        </Button>
        <Button type="button" onClick={copyCurrent}>
          {copied ? '✅ Copié !' : '📋 Copier le texte'}
        </Button>
        <Button type="button" variant="secondary" onClick={generateImage}>
          🖼️ Générer l'image
        </Button>
      </div>

      <EtfCard etf={currentEtf} />

      <p className="es-disclaimer" style={{ marginTop: 22 }}>
        Contenu pré-rédigé, données stockées en dur — aucune donnée de marché en temps réel.
      </p>

      {lightbox && <Lightbox dataUrl={lightbox.dataUrl} filename={lightbox.filename} onClose={() => setLightbox(null)} />}
    </div>
  )
}
