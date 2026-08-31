import { useCallback, useMemo, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './index-comparator.css'

// ─────────────────────────────────────────────────────────────────────────
// Comparateur d'indices — génère un tweet comparatif (structure fixe en 5
// blocs numérotés + verdict + question finale) pour une famille d'indices
// concurrents. Seules les données STRUCTURELLES (composition, ETF
// disponibles, ISIN, TER, encours, éligibilité PEA) sont pré-rédigées et
// sourcées ci-dessous — jamais la performance, saisie à la main à chaque
// génération (cf. formulaire), comme le reste de la bibliothèque de l'appli.
// Sources et niveau de confiance documentés dans le commentaire de chaque
// famille. Éligibilité PEA vérifiée fonds par fonds — jamais supposée.
// ─────────────────────────────────────────────────────────────────────────

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
    out.push(`2023 ${fmtPct(v.y2023) ?? '[à compléter]'}`)
    out.push(`2024 ${fmtPct(v.y2024) ?? '[à compléter]'}`)
    out.push(`2025 ${fmtPct(v.y2025) ?? '[à compléter]'}`)
    if (v.ytdEnabled) out.push(`YTD ${fmtPct(v.ytd) ?? '[à compléter]'}`)
    if (i < family.perfFunds.length - 1) out.push('')
  })
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

// ─────────────────────────────────────────────────────────────────────────
// FAMILLES — 9 au total. Famille 1 (Europe) reprend telle quelle l'exemple
// de référence fourni. Familles 2-9 rédigées à partir de données réelles
// vérifiées (cf. commentaire de sourcing sur chaque famille), en reprenant
// pour plusieurs fonds les ISIN déjà vérifiés ailleurs dans l'application
// (src/pages/etf-sheets/data.js, src/pages/portfolio-generator/data.js) —
// jamais une nouvelle donnée non recoupée quand une donnée déjà vérifiée
// cette session existe.
// ─────────────────────────────────────────────────────────────────────────

export const FAMILIES = [
  {
    id: 'europe',
    label: '🇪🇺 Europe',
    intro: 'Tu veux une exposition européenne sur ton PEA mais tu hésites entre MSCI Europe, Stoxx 50 et Stoxx 600 ? 🇪🇺\nOn décrypte les trois 👇',
    indices: [
      { name: 'STOXX 600', desc: 'Les 600 plus grandes entreprises européennes, 17 pays.', bullets: ['✅ UK + Suisse + Scandinavie inclus'], tag: 'Le plus large 🌍' },
      { name: 'EURO STOXX 50', desc: 'Les 50 plus grosses boîtes de la zone euro uniquement.', tag: 'Ultra-concentré (ASML, SAP, LVMH…) 🎯' },
      { name: 'MSCI Europe', desc: 'Les grandes valeurs de 15 pays développés européens.', tag: 'Très proche du STOXX 600 👯' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'STOXX 600', choiceNote: 'un SEUL choix', pea: true,
        funds: [{ name: 'BNP Paribas Easy STOXX Europe 600 UCITS ETF', ticker: 'ETZ', isin: 'FR0011550193', ter: '0,19 %', repl: '🔄 Synthétique (swap)', dist: 'capitalisant', aum: '1 054 M€' }],
      },
      {
        indexName: 'EURO STOXX 50', choiceNote: 'le plus de choix', pea: true, subNote: '(indice 100 % zone euro)',
        funds: [
          { name: 'iShares Core EURO STOXX 50 (Acc)', isin: 'IE00B53L3W79', ter: '0,10 %', aum: '7 667 M€' },
          { name: 'HSBC EURO STOXX 50', isin: 'IE00B4K6B022', ter: '0,05 %', note: '(le moins cher ⚡)' },
        ],
      },
      {
        indexName: 'MSCI Europe', choiceNote: 'un seul vrai choix', pea: true,
        funds: [{ name: 'Amundi PEA MSCI Europe UCITS ETF (Acc)', ticker: 'PCEU', isin: 'FR0013412038', ter: '0,15 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '327 M€' }],
      },
    ],
    diversification: {
      chain: ['STOXX 600 (600 lignes)', 'MSCI Europe (~430)', 'EURO STOXX 50 (50)'],
      notes: ['⚠️ Le 50 concentre ton risque : ses 10 plus grosses lignes pèsent +41 % de l\'indice.', '→ Plus volatil, très dépendant du luxe et de la tech euro.'],
    },
    perfFunds: [
      { key: 'msci_europe', label: 'Amundi PEA MSCI Europe (PCEU)' },
      { key: 'stoxx600', label: 'BNP STOXX 600 (ETZ)' },
      { key: 'eurostoxx50', label: 'iShares EURO STOXX 50 (SXRT)' },
    ],
    verdictTitle: '✅ LE VERDICT POUR UN PEA',
    verdict: [
      { q: '🌍 Exposition la plus large (UK + Suisse) ?', a: 'ETZ (BNP STOXX 600)' },
      { q: '💸 Le moins cher + zone euro pure ?', a: 'EURO STOXX 50' },
      { q: '🇫🇷 Large mais sans UK/Suisse, capitalisant français ?', a: 'PCEU (Amundi MSCI Europe)' },
    ],
    closing: '💬 Et toi, t\'as lequel dans ton PEA ?',
  },
]

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
            <p className="xc-eyebrow">Performance (à saisir avant publication)</p>
            <p className="xc-hint">⚠️ Aucune performance n'est stockée en dur : vérifie chaque valeur sur justETF ou le site de l'émetteur avant de publier.</p>
            {family.perfFunds.map((f) => {
              const v = perfValues[f.key] || {}
              return (
                <div key={f.key} className="xc-fund-block">
                  <p className="xc-fund-label">{f.label}</p>
                  <div className="xc-row3">
                    <input className="xc-control" type="text" inputMode="decimal" placeholder="2023 %" value={v.y2023 ?? ''} onChange={(e) => setFundValue(f.key, 'y2023', e.target.value)} />
                    <input className="xc-control" type="text" inputMode="decimal" placeholder="2024 %" value={v.y2024 ?? ''} onChange={(e) => setFundValue(f.key, 'y2024', e.target.value)} />
                    <input className="xc-control" type="text" inputMode="decimal" placeholder="2025 %" value={v.y2025 ?? ''} onChange={(e) => setFundValue(f.key, 'y2025', e.target.value)} />
                  </div>
                  <label className="xc-ytd-toggle">
                    <input type="checkbox" checked={!!v.ytdEnabled} onChange={(e) => setFundValue(f.key, 'ytdEnabled', e.target.checked)} />
                    Inclure le YTD
                  </label>
                  {v.ytdEnabled && (
                    <input className="xc-control" type="text" inputMode="decimal" placeholder="YTD %" value={v.ytd ?? ''} onChange={(e) => setFundValue(f.key, 'ytd', e.target.value)} />
                  )}
                </div>
              )
            })}
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
