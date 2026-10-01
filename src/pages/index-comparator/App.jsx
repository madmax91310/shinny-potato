import { useCallback, useMemo, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './index-comparator.css'
import { FAMILIES } from './data.js'
import { downloadIndexImage } from './imageExport.js'

import { buildTweetText, fmtPct } from './lib.js'

export default function IndexComparator() {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id)
  const [perfValues, setPerfValues] = useState({})
  const [copyState, setCopyState] = useState('idle')
  const [imageState, setImageState] = useState('idle')
  const textareaRef = useRef(null)

  const family = useMemo(() => FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0], [familyId])
  const text = useMemo(() => buildTweetText(family, perfValues), [family, perfValues])

  const setFundValue = useCallback((key, field, value) => {
    setPerfValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('done')
    } catch {
      const ta = textareaRef.current
      if (ta) {
        ta.value = text
        ta.style.display = 'block'
        ta.select()
        try {
          document.execCommand('copy')
          setCopyState('done')
        } catch {
          setCopyState('error')
        }
        ta.style.display = 'none'
      } else {
        setCopyState('error')
      }
    }
    window.setTimeout(() => setCopyState('idle'), 2200)
  }, [text])

  const handleDownload = useCallback(async () => {
    setImageState('loading')
    try {
      await downloadIndexImage(family)
      setImageState('idle')
    } catch (error) {
      console.error('Export du comparateur :', error)
      setImageState('error')
    }
  }, [family])

  return (
    <div className="xc-scope">
      <PageHeader
        title="Comparateur d'indices"
        subtitle="Comprends ce que chaque indice change : pays, taille des entreprises et règles de sélection."
      />

      <div className="xc-layout">
        <section className="xc-control-col">
          <div className="xc-panel">
            <p className="xc-eyebrow">Famille d'indices</p>
            <div className="xc-select-wrap">
              <select className="xc-control" value={familyId} onChange={(e) => { setFamilyId(e.target.value); setPerfValues({}) }}>
                {FAMILIES.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="xc-panel">
            <p className="xc-eyebrow">Performance</p>
            <p className="xc-hint">Les chiffres 2023–2025 ci-dessous sont ceux des ETF et parts nommés, pas les rendements bruts des indices décrits dans le premier bloc. Vérifie la part et sa devise avant publication. Seul le YTD est saisi ici.</p>
            {family.perfFunds.map((f) => {
              const v = perfValues[f.key] || {}
              return (
                <div key={f.key} className="xc-fund-block">
                  <p className="xc-fund-label">{f.label}</p>
                  <p className="xc-perf-readout">
                    {f.perfNote ?? `2023 ${fmtPct(f.y2023) ?? '[à vérifier]'} · 2024 ${fmtPct(f.y2024) ?? '[à vérifier]'} · 2025 ${fmtPct(f.y2025) ?? '[à vérifier]'}`}
                  </p>
                  <label className="xc-ytd-toggle">
                    <input type="checkbox" checked={!!v.ytdEnabled} onChange={(e) => setFundValue(f.key, 'ytdEnabled', e.target.checked)} />
                    Inclure le YTD
                  </label>
                  {v.ytdEnabled && (
                    <>
                      <input className="xc-control" type="text" inputMode="decimal" placeholder="YTD %" value={v.ytd ?? ''} onChange={(e) => setFundValue(f.key, 'ytd', e.target.value)} />
                      <p className="xc-hint xc-hint-tight">⚠️ Donnée continue : vérifie le YTD sur justETF ou le site de l'émetteur avant publication.</p>
                    </>
                  )}
                </div>
              )
            })}
            {family.perfMethodNote && <p className="xc-hint">{family.perfMethodNote}</p>}
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
            {copyState === 'done' ? '✅ Copié !' : copyState === 'error' ? '⚠️ Copie manuelle requise' : '📋 Copier le texte'}
          </Button>
          <Button type="button" className="w-full" disabled={imageState === 'loading'} onClick={handleDownload}>
            {imageState === 'loading' ? 'Création du PNG…' : imageState === 'error' ? 'Réessayer le téléchargement PNG' : 'Télécharger l’image PNG'}
          </Button>
          <p className="xc-hint">L’image compare les expositions côte à côte, avec les produits, les ISIN et les frais. Les performances sont dans le tweet.</p>
          <textarea ref={textareaRef} className="xc-clipboard-fallback" readOnly />
        </section>

        <section className="xc-preview-col">
          <div className="xc-preview">
            <pre className="xc-preview-text">{text}</pre>
          </div>
        </section>
      </div>
    </div>
  )
}
