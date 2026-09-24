import { useCallback, useMemo, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './index-comparator.css'
import { FAMILIES } from './data.js'

// Comparateur d'indices — génère un tweet comparatif (structure fixe en 5 blocs numérotés +
// verdict + question finale) pour une famille d'indices concurrents. Données (FAMILIES) dans
// ./data.js depuis le 14/09/2026 (cf. son en-tête pour la méthodologie de sourcing) — ce fichier
// ne porte plus que la logique de rendu du tweet et le composant.

const PERF_COLOR_EMOJI = ['🟢', '🔵', '🟡', '🟣', '🟠']

function fmtPct(raw) {
  if (raw === '' || raw === null || raw === undefined) return null
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  const sign = n > 0 ? '+' : n < 0 ? '' : '+'
  return `${sign}${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

// Formate un groupe de fonds pour un indice donné du bloc 2. Un seul fonds
// disponible → format détaillé (4 lignes). Plusieurs fonds → format
// condensé (2-3 lignes par fonds), pour rester lisible dans un tweet.
function renderFundGroup(group) {
  const lines = []
  const headerEmoji = group.pea === false ? '⛔' : '🟢'
  lines.push(`${headerEmoji} ${group.indexName} → ${group.choiceNote}`)
  if (group.subNote) lines.push(group.subNote)
  if (group.narrativeNote) {
    lines.push(group.narrativeNote)
    return lines.join('\n')
  }
  const multi = group.funds.length > 1
  group.funds.forEach((f) => {
    lines.push(f.name)
    const idLine = f.ticker ? `📍 Ticker : ${f.ticker} · ISIN : ${f.isin}` : `📍 ISIN : ${f.isin}`
    lines.push(idLine)
    if (multi) {
      const feeParts = [`💰 TER ${f.ter}`]
      if (f.aum) feeParts.push(`📦 ${f.aum}`)
      lines.push(feeParts.join(' · ') + (f.note ? ` ${f.note}` : ''))
    } else {
      lines.push(`💰 TER ${f.ter}`)
      if (f.repl || f.dist) lines.push([f.repl, f.dist].filter(Boolean).join(' · '))
      if (f.aum) lines.push(`📦 ${f.aum} d'encours`)
      if (f.note) lines.push(f.note)
    }
  })
  return lines.join('\n')
}

function buildTweetText(family, perfValues) {
  const out = []
  out.push(family.intro)
  out.push('')
  out.push('1️⃣ L\'EXPOSITION')
  out.push('')
  family.indices.forEach((idx, i) => {
    out.push(`🔹 ${idx.name}`)
    out.push(idx.desc)
    if (idx.bullets) idx.bullets.forEach((b) => out.push(b))
    out.push(`→ ${idx.tag}`)
    if (i < family.indices.length - 1) out.push('')
  })
  out.push('')
  out.push(family.block2Title)
  out.push('')
  family.etfGroups.forEach((g, i) => {
    out.push(renderFundGroup(g))
    if (i < family.etfGroups.length - 1) out.push('')
  })
  out.push('')
  out.push('3️⃣ DIVERSIFICATION 📊')
  out.push('')
  out.push(family.diversification.chain.join('\n⬇️\n'))
  out.push('')
  family.diversification.notes.forEach((n) => out.push(n))
  out.push('')
  out.push('4️⃣ PERFORMANCE 📈')
  out.push('')
  family.perfFunds.forEach((f, i) => {
    const v = perfValues[f.key] || {}
    out.push(`${PERF_COLOR_EMOJI[i % PERF_COLOR_EMOJI.length]} ${f.label}`)
    if (f.perfNote) {
      out.push(f.perfNote)
    } else {
      out.push(`2023 ${fmtPct(f.y2023) ?? '[à vérifier]'}`)
      out.push(`2024 ${fmtPct(f.y2024) ?? '[à vérifier]'}`)
      out.push(`2025 ${fmtPct(f.y2025) ?? '[à vérifier]'}`)
    }
    if (v.ytdEnabled) out.push(`YTD ${fmtPct(v.ytd) ?? '[à compléter]'}`)
    if (i < family.perfFunds.length - 1) out.push('')
  })
  if (family.perfMethodNote) {
    out.push('')
    out.push(family.perfMethodNote)
  }
  out.push('')
  out.push(family.verdictTitle)
  out.push('')
  family.verdict.forEach((v, i) => {
    out.push(v.q)
    out.push(`→ ${v.a}`)
    if (i < family.verdict.length - 1) out.push('')
  })
  out.push('')
  out.push(family.closing)
  return out.join('\n')
}


export default function IndexComparator() {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id)
  const [perfValues, setPerfValues] = useState({})
  const [copyState, setCopyState] = useState('idle')
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

  return (
    <div className="xc-scope">
      <PageHeader
        title="Comparateur d'indices"
        subtitle="Compare les indices concurrents d'une même famille : exposition, ETF PEA/CTO, diversification, performance."
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
            <p className="xc-hint">2023/2024/2025 : rendements annuels stockés dans le code. Vérifie leur source et leur devise avant publication. Seul le YTD est saisi ici.</p>
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
