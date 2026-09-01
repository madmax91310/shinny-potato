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

  // ── Famille 2 : Monde large ─────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026) pour tous les ISIN/TER/
  // encours ci-dessous. Amundi PEA Monde déjà vérifié ailleurs dans l'appli
  // (etf-sheets/data.js). Nombre de lignes par indice : ordre de grandeur
  // (source MSCI/FTSE factsheets), non recompté précisément cette session —
  // à vérifier avant publication si le chiffre exact importe.
  {
    id: 'monde',
    label: '🌍 Monde large',
    intro: 'Tu veux investir « sur le monde entier » mais tu hésites entre MSCI World, MSCI ACWI et FTSE All-World ? 🌍\nOn décrypte les trois 👇',
    indices: [
      { name: 'MSCI World', desc: 'Les ~1 500 plus grandes entreprises de 23 pays développés.', tag: 'Le classique du monde développé 🏛️' },
      { name: 'MSCI ACWI', desc: 'Le MSCI World + les marchés émergents (Chine, Inde, Brésil…), ~2 900 valeurs.', tag: 'Le monde presque entier 🌐' },
      { name: 'FTSE All-World', desc: 'Développés + émergents comme l\'ACWI, mais avec en plus les mid caps : ~4 300 valeurs.', tag: 'Le plus large des trois 🔭' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World', choiceNote: 'un seul choix réel', pea: true,
        funds: [{ name: 'Amundi PEA Monde (MSCI World) UCITS ETF (Acc)', ticker: 'DCAM', isin: 'FR001400U5Q4', ter: '0,20 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '1,37 Md€' }],
      },
      {
        indexName: 'MSCI ACWI', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'SPDR MSCI ACWI UCITS ETF (Acc)', isin: 'IE00B44Z5B48', ter: '0,12 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '15,9 Md€' }],
      },
      {
        indexName: 'FTSE All-World', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'Vanguard FTSE All-World UCITS ETF (Acc)', ticker: 'VWCE', isin: 'IE00BK5BQT80', ter: '0,14 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '50 Md€' }],
      },
    ],
    diversification: {
      chain: ['MSCI World (~1 500 lignes)', 'MSCI ACWI (~2 900)', 'FTSE All-World (~4 300)'],
      notes: ['⚠️ Peu importe lequel des trois : tous pèsent 60-70 % d\'actions américaines.', '→ Le vrai choix se joue sur les émergents (inclus ou non) et le nombre de lignes, pas sur le poids US.'],
    },
    perfFunds: [
      { key: 'msci_world', label: 'Amundi PEA Monde (DCAM)' },
      { key: 'acwi', label: 'SPDR MSCI ACWI' },
      { key: 'ftse_aw', label: 'Vanguard FTSE All-World (VWCE)' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'DCAM (Amundi PEA Monde) — seule option PEA de la famille, mais MSCI World uniquement, sans émergents.' },
      { q: '🌐 Tu veux les émergents inclus, en CTO ?', a: 'SPDR MSCI ACWI ou Vanguard VWCE (FTSE All-World, le plus large des deux).' },
      { q: '💸 Le moins cher en CTO ?', a: 'VWCE (Vanguard, TER 0,14 %).' },
    ],
    closing: '💬 Toi, t\'es plutôt Monde développé ou Monde entier ?',
  },

  // ── Famille 3 : USA large ────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Amundi PEA S&P 500 /
  // Nasdaq-100 déjà vérifiés ailleurs dans l'appli (etf-sheets/data.js).
  // Point notable : le seul ETF PEA jamais lancé sur le Russell 1000 « pur »
  // (Russell 1000 THEAM Easy, FR0010616292) a été liquidé — plus aucune
  // option PEA active sur cet indice à ce jour (vérifié via recherche web).
  {
    id: 'usa',
    label: '🇺🇸 USA large',
    intro: 'S&P 500, Nasdaq 100, MSCI USA, Russell 1000… tous des indices américains, mais pas du tout la même chose 🇺🇸\nOn décrypte les quatre 👇',
    indices: [
      { name: 'S&P 500', desc: 'Les 500 plus grandes entreprises cotées aux États-Unis.', tag: 'La référence mondiale 🏆' },
      { name: 'Nasdaq 100', desc: 'Les 100 plus grosses non-financières du Nasdaq : ultra tech.', tag: 'Le plus concentré tech 💻' },
      { name: 'MSCI USA', desc: 'Grandes ET moyennes capitalisations US, ~600 valeurs.', tag: 'Un peu plus large que le S&P 500 📏' },
      { name: 'Russell 1000', desc: 'Les 1 000 plus grandes valeurs US, ~93 % de la capitalisation du marché américain.', tag: 'Le plus large des quatre 🌊' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'S&P 500', choiceNote: 'un SEUL choix', pea: true,
        funds: [{ name: 'Amundi PEA S&P 500 UCITS ETF (Acc)', isin: 'FR0011871128', ter: '0,12 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '1,15 Md€' }],
      },
      {
        indexName: 'Nasdaq 100', choiceNote: 'un SEUL choix', pea: true,
        funds: [{ name: 'Amundi PEA Nasdaq-100 UCITS ETF (Acc)', isin: 'FR0011871110', ter: '0,30 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '1,17 Md€' }],
      },
      {
        indexName: 'MSCI USA', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI USA UCITS ETF (Acc)', isin: 'IE00B52SFT06', ter: '0,07 %', repl: '🔄 Sampling', dist: 'capitalisant', aum: '2,9 Md€' }],
      },
      {
        indexName: 'Russell 1000', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [],
        narrativeNote: 'Pas de tracker « pur » du Russell 1000 en UCITS : seules des déclinaisons Growth/Value existent (iShares Russell 1000 Growth / Value UCITS ETF, CTO uniquement). Le seul ETF PEA jamais lancé sur cet indice (THEAM Easy Russell 1000) a été liquidé — aucune option PEA active aujourd\'hui.',
      },
    ],
    diversification: {
      chain: ['Russell 1000 (1 000 lignes)', 'MSCI USA (~600)', 'S&P 500 (500)', 'Nasdaq 100 (100)'],
      notes: ['⚠️ Le Nasdaq 100 exclut tout le secteur financier et concentre près de 50 % sur ses 10 plus grosses lignes.', '→ Le plus étroit des quatre, et le plus volatil.'],
    },
    perfFunds: [
      { key: 'sp500', label: 'Amundi PEA S&P 500' },
      { key: 'nasdaq100', label: 'Amundi PEA Nasdaq-100' },
      { key: 'msci_usa', label: 'iShares MSCI USA' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'Amundi PEA S&P 500 (large et simple) ou Amundi PEA Nasdaq-100 (concentré tech).' },
      { q: '📏 Le compromis large/mid-cap, en CTO ?', a: 'iShares MSCI USA.' },
      { q: '🌊 L\'exposition la plus large possible ?', a: 'Une déclinaison Russell 1000 Growth/Value en CTO — pas de version PEA active.' },
    ],
    closing: '💬 Toi, PEA ou CTO pour ta poche US ?',
  },

  // ── Famille 4 : Émergents ────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). MSCI EM (iShares Core
  // IMI) déjà vérifié ailleurs dans l'appli (etf-sheets/data.js). Aucune
  // option PEA trouvée pour cette famille — affiché explicitement plutôt
  // que de laisser la section 2 vide.
  {
    id: 'emergents',
    label: '🌏 Émergents',
    intro: 'MSCI EM, FTSE EM, MSCI EM ex-China… tu veux investir sur les émergents mais lequel choisir ? 🌏\nOn décrypte les trois 👇',
    indices: [
      { name: 'MSCI EM', desc: '~1 400 valeurs de ~24 pays émergents (Chine, Inde, Taïwan, Brésil…).', tag: 'La référence émergents 🏳️' },
      { name: 'FTSE EM', desc: 'Composition proche mais différente : la Corée du Sud y est classée « développée », donc exclue.', bullets: ['✅ Plus de mid/small caps'], tag: 'Sans la Corée du Sud 🇰🇷' },
      { name: 'MSCI EM ex-China', desc: 'Le MSCI EM… sans la Chine, pour qui veut diversifier son risque chinois.', tag: 'L\'anti-concentration Chine 🚫' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES — AUCUNE OPTION PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI EM', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Core MSCI EM IMI UCITS ETF (Acc)', isin: 'IE00BKM4GZ66', ter: '0,18 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '36,8 Md€' }],
      },
      {
        indexName: 'FTSE EM', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [
          { name: 'Vanguard FTSE Emerging Markets UCITS ETF (Dist)', isin: 'IE00B3VVMM84', ter: '0,17 %', aum: '3,2 Md€' },
          { name: 'Vanguard FTSE Emerging Markets UCITS ETF (Acc)', isin: 'IE00BK5BR733', ter: '0,17 %', aum: '2,0 Md€' },
        ],
      },
      {
        indexName: 'MSCI EM ex-China', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI EM ex-China UCITS ETF (Acc)', isin: 'IE00BMG6Z448', ter: '0,18 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '6,3 Md€' }],
      },
    ],
    diversification: {
      chain: ['MSCI EM (~1 400 lignes)', 'FTSE EM (~1 900, sans la Corée du Sud)', 'MSCI EM ex-China (~800, sans la Chine)'],
      notes: ['⚠️ La Chine pèse encore ~25-30 % du MSCI EM malgré sa baisse ces dernières années.', '→ Le ex-China est un pari géopolitique assumé, pas juste une diversification de plus.'],
    },
    perfFunds: [
      { key: 'msci_em', label: 'iShares Core MSCI EM IMI' },
      { key: 'ftse_em', label: 'Vanguard FTSE Emerging Markets' },
      { key: 'em_exchina', label: 'iShares MSCI EM ex-China' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🏳️ La référence la plus large ?', a: 'iShares Core MSCI EM IMI.' },
      { q: '🇰🇷 Tu veux exclure la Corée du Sud (classée développée) ?', a: 'Vanguard FTSE Emerging Markets.' },
      { q: '🚫 Tu veux réduire ton risque chinois ?', a: 'iShares MSCI EM ex-China.' },
    ],
    closing: '💬 Toi, tu limites ton exposition à la Chine ou pas ?',
  },

  // ── Famille 5 : Style ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Value Factor déjà
  // vérifié ailleurs dans l'appli (etf-sheets/data.js, portfolio-generator).
  // AUCUN ETF UCITS répliquant l'indice « MSCI World Growth » (au sens
  // strict) n'a été trouvé lors de cette recherche — affiché honnêtement
  // comme non confirmé plutôt que remplacé par un fonds Momentum différent.
  {
    id: 'style',
    label: '🎨 Style (facteurs)',
    intro: 'MSCI World Growth, Value, Quality… les grands styles d\'investissement factoriel, expliqués simplement 🎨\nOn décrypte (presque) les trois 👇',
    indices: [
      { name: 'MSCI World Value', desc: 'Entreprises jugées « décotées » par rapport à leurs fondamentaux (banques, énergie, industrie…).', tag: 'Le style contrarian 📉' },
      { name: 'MSCI World Quality', desc: 'Entreprises à la rentabilité stable et à l\'endettement maîtrisé (ROE élevé, bénéfices réguliers).', tag: 'Le style « qualité avant tout » 💎' },
      { name: 'MSCI World Growth', desc: 'Entreprises à forte croissance attendue des bénéfices (tech, santé innovante…).', tag: 'Non confirmé cette session ⚠️' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES — AUCUNE OPTION PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World Value', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Edge MSCI World Value Factor UCITS ETF (Acc)', isin: 'IE00BP3QZB59', ter: '0,25 %', repl: '🔄 Sampling', dist: 'capitalisant', aum: '6,1 Md€' }],
      },
      {
        indexName: 'MSCI World Quality', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Edge MSCI World Quality Factor UCITS ETF (Acc)', isin: 'IE00BP3QZ601', ter: '0,25 %', repl: '🔄 Sampling', dist: 'capitalisant', aum: '5,3 Md€' }],
      },
      {
        indexName: 'MSCI World Growth', choiceNote: 'Non confirmé — à vérifier avant publication', pea: false,
        funds: [],
        narrativeNote: 'Aucun ETF UCITS répliquant spécifiquement l\'indice « MSCI World Growth » n\'a été trouvé lors de cette recherche (les fonds « Momentum Factor » existants ciblent un facteur différent — l\'élan de cours, pas la croissance des bénéfices). Ne pas présenter de fonds ici sans vérification supplémentaire.',
      },
    ],
    diversification: {
      chain: ['MSCI World (~1 500 lignes, univers de départ)', 'MSCI World Value (~380)', 'MSCI World Quality (~300)'],
      notes: ['⚠️ Contrairement à la famille Europe, ces indices factoriels ne s\'emboîtent pas : ce sont des sous-ensembles indépendants du MSCI World, pas des poupées russes.'],
    },
    perfFunds: [
      { key: 'value', label: 'iShares Edge MSCI World Value Factor' },
      { key: 'quality', label: 'iShares Edge MSCI World Quality Factor' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '📉 Tu crois à un retour de balancier vers les décotées ?', a: 'iShares Edge MSCI World Value Factor.' },
      { q: '💎 Tu préfères la stabilité des bénéfices ?', a: 'iShares Edge MSCI World Quality Factor.' },
      { q: '🌱 Tu cherches la croissance pure ?', a: 'Pas d\'ETF UCITS dédié confirmé — à vérifier avant de promettre quoi que ce soit.' },
    ],
    closing: '💬 Toi, plutôt Value, Quality… ou toujours MSCI World tout court ?',
  },

  // ── Famille 6 : Dividendes ───────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). High Dividend et
  // Quality Dividend (part Dist) déjà référencés ailleurs dans l'appli
  // (portfolio-generator/data.js) ; part Acc et Aristocrats confirmées
  // cette session.
  {
    id: 'dividendes',
    label: '🟣 Dividendes',
    intro: 'High Dividend, Quality Dividend, Dividend Aristocrats… 3 façons différentes de viser le rendement 🟣\nOn décrypte les trois 👇',
    indices: [
      { name: 'High Dividend', desc: 'Les entreprises mondiales au rendement de dividende le plus élevé, sans filtre de qualité.', tag: 'Le rendement brut, sans filtre 💰' },
      { name: 'Quality Dividend', desc: 'Dividende + critères de solidité financière (rentabilité, faible endettement).', tag: 'Le compromis rendement/solidité 💎' },
      { name: 'Dividend Aristocrats', desc: 'Des entreprises qui versent ET augmentent leur dividende depuis au moins 10 ans consécutifs.', tag: 'Le plus exigeant des trois 🏅' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES — AUCUNE OPTION PEA 💳',
    etfGroups: [
      {
        indexName: 'High Dividend', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF (Acc)', isin: 'IE00BK5BR626', ter: '0,29 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '2,94 Md€' }],
      },
      {
        indexName: 'Quality Dividend', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI World Quality Dividend Advanced UCITS ETF (Acc)', isin: 'IE00BKPSFC54', ter: '0,38 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '519 M€' }],
      },
      {
        indexName: 'Dividend Aristocrats', choiceNote: 'le plus de choix', pea: false,
        funds: [
          { name: 'SPDR S&P Global Dividend Aristocrats UCITS ETF', isin: 'IE00B9CQXS71', ter: '0,45 %', aum: '1,6 Md€', note: '(mondial)' },
          { name: 'SPDR S&P US Dividend Aristocrats UCITS ETF', isin: 'IE00B6YX5D40', ter: '0,35 %', aum: '3,4 Md€', note: '(US uniquement, le moins cher ⚡)' },
        ],
      },
    ],
    diversification: {
      chain: ['High Dividend (~1 900 lignes)', 'Quality Dividend (~300)', 'Dividend Aristocrats mondial (~100)'],
      notes: ['⚠️ Plus le filtre est exigeant (Quality, Aristocrats), plus le nombre de lignes chute.', '→ Concentration sectorielle plus forte (finance, énergie, conso de base) sur les deux derniers.'],
    },
    perfFunds: [
      { key: 'high_div', label: 'Vanguard FTSE AW High Dividend' },
      { key: 'quality_div', label: 'iShares MSCI World Quality Dividend' },
      { key: 'aristocrats', label: 'SPDR S&P Global Dividend Aristocrats' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '💰 Le rendement le plus élevé, sans filtre ?', a: 'Vanguard FTSE All-World High Dividend Yield.' },
      { q: '💎 Le compromis rendement/solidité financière ?', a: 'iShares MSCI World Quality Dividend Advanced.' },
      { q: '🏅 Le plus exigeant (10 ans de hausses consécutives) ?', a: 'SPDR S&P Global (ou US) Dividend Aristocrats.' },
    ],
    closing: '💬 Toi, tu vises le rendement pur ou la régularité ?',
  },

  // ── Famille 7 : Faible volatilité ────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026), Min Vol déjà vérifié
  // ailleurs dans l'appli (etf-sheets/data.js). MSCI World classique :
  // mêmes fonds que la famille « Monde large » ci-dessus.
  {
    id: 'lowvol',
    label: '🛡️ Faible volatilité',
    intro: 'MSCI World Minimum Volatility vs MSCI World classique : est-ce que « moins de risque » veut vraiment dire « moins de performance » ? 🛡️\nOn décrypte les deux 👇',
    indices: [
      { name: 'MSCI World Min Vol', desc: 'Sélectionne et pondère les valeurs du MSCI World pour minimiser la volatilité globale du panier.', tag: 'Le style « anti-turbulences » 🛡️' },
      { name: 'MSCI World classique', desc: 'Les ~1 500 plus grandes entreprises de 23 pays développés, sans filtre de volatilité.', tag: 'Le point de comparaison 🏛️' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'MSCI World Min Vol', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Edge MSCI World Minimum Volatility UCITS ETF (Acc)', isin: 'IE00B8FHGS14', ter: '0,30 %', repl: '🔄 Sampling', dist: 'capitalisant', aum: '2,3 Md€' }],
      },
      {
        indexName: 'MSCI World classique', choiceNote: 'un seul choix réel', pea: true,
        funds: [{ name: 'Amundi PEA Monde (MSCI World) UCITS ETF (Acc)', ticker: 'DCAM', isin: 'FR001400U5Q4', ter: '0,20 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '1,37 Md€' }],
      },
    ],
    diversification: {
      chain: ['MSCI World classique (~1 500 lignes)', 'MSCI World Min Vol (~300, sous-ensemble)'],
      notes: ['⚠️ Le Min Vol n\'est pas « diversifié au hasard » : il surpondère fortement certains secteurs défensifs (santé, conso de base, utilities).', '→ Moins de casse en baisse, mais aussi moins de participation aux fortes hausses (comme 2023-2024).'],
    },
    perfFunds: [
      { key: 'minvol', label: 'iShares Edge MSCI World Min Vol' },
      { key: 'world', label: 'Amundi PEA Monde (DCAM)' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🛡️ Tu veux amortir les baisses, en CTO ?', a: 'iShares Edge MSCI World Minimum Volatility.' },
      { q: '💳 Tu veux rester en PEA ?', a: 'DCAM (Amundi PEA Monde) — pas de version Min Vol éligible PEA.' },
    ],
    closing: '💬 Toi, tu acceptes plus de volatilité pour plus de performance long terme ?',
  },

  // ── Famille 8 : Chine ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Attention : l'option
  // PEA sur la Chine (Amundi PEA Chine) ne réplique pas le MSCI China
  // "vanille" mais une version filtrée ESG (MSCI China Screened Select ex
  // Thermal Coal) — précisé explicitement plutôt que présenté comme
  // strictement identique. iShares China Large Cap réplique le FTSE China
  // 50 (les 50 plus grosses lignes), pas l'indice FTSE China complet.
  {
    id: 'chine',
    label: '🇨🇳 Chine',
    intro: 'MSCI China, FTSE China, MSCI China A… la Chine boursière n\'est pas un seul marché, mais trois univers différents 🇨🇳\nOn décrypte les trois 👇',
    indices: [
      { name: 'MSCI China', desc: 'Actions chinoises cotées à Hong Kong, ADR aux USA et quelques A-shares : la Chine « offshore ».', tag: 'La référence la plus suivie 🏙️' },
      { name: 'FTSE China 50', desc: 'Seulement les 50 plus grosses valeurs chinoises cotées à Hong Kong.', tag: 'Ultra-concentré 🎯' },
      { name: 'MSCI China A', desc: 'Uniquement les actions domestiques cotées à Shanghai/Shenzhen (marché intérieur, via Stock Connect).', tag: 'La Chine « intérieure » 🏯' },
    ],
    block2Title: '2️⃣ LES ETF DISPONIBLES (PEA / CTO) 💳',
    etfGroups: [
      {
        indexName: 'MSCI China', choiceNote: 'CTO conseillé, 1 option PEA imparfaite', pea: false,
        subNote: '(l\'option PEA ci-dessous suit un indice filtré ESG, pas le MSCI China standard)',
        funds: [
          { name: 'iShares MSCI China UCITS ETF (Acc)', isin: 'IE00BJ5JPG56', ter: '0,28 %', aum: '2,19 Md€', note: '(CTO, réplique le MSCI China standard)' },
          { name: 'Amundi PEA Chine (MSCI China) Screened UCITS ETF', isin: 'FR0011871078', ter: '0,65 %', aum: '72 M€', note: '(seule option PEA — indice filtré ESG, plus cher)' },
        ],
      },
      {
        indexName: 'FTSE China 50', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares China Large Cap UCITS ETF', isin: 'IE00B02KXK85', ter: '0,74 %', repl: '🔄 Physique', dist: 'capitalisant' }],
      },
      {
        indexName: 'MSCI China A', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares MSCI China A UCITS ETF (Acc)', isin: 'IE00BQT3WG13', ter: '0,40 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '2,4 Md€' }],
      },
    ],
    diversification: {
      chain: ['MSCI China (~700 lignes, offshore + ADR)', 'MSCI China A (~480, domestique uniquement)', 'FTSE China 50 (50, ultra-concentré)'],
      notes: ['⚠️ MSCI China et MSCI China A ne se recoupent quasiment pas : deux marchés séparés, deux risques différents (régulation offshore vs contrôle des capitaux domestique).', '→ Le FTSE China 50 concentre l\'essentiel du risque sur une poignée de méga-caps (tech, finance).'],
    },
    perfFunds: [
      { key: 'msci_china', label: 'iShares MSCI China' },
      { key: 'ftse_china50', label: 'iShares China Large Cap (FTSE China 50)' },
      { key: 'msci_china_a', label: 'iShares MSCI China A' },
    ],
    verdictTitle: '✅ LE VERDICT',
    verdict: [
      { q: '🏙️ La référence la plus suivie, en CTO ?', a: 'iShares MSCI China.' },
      { q: '💳 Tu veux rester en PEA malgré tout ?', a: 'Amundi PEA Chine — mais version filtrée ESG, pas le MSCI China standard.' },
      { q: '🏯 Tu veux viser le marché intérieur chinois précisément ?', a: 'iShares MSCI China A.' },
    ],
    closing: '💬 Toi, tu distingues Chine offshore et Chine domestique dans ton allocation ?',
  },

  // ── Famille 9 : Japon ────────────────────────────────────────────────
  // Sources : justETF (recherche web du 01/09/2026). Point notable :
  // contrairement à l'hypothèse de départ, il EXISTE une option PEA réelle
  // sur cette famille (Amundi PEA Japon, indice TOPIX) — vérifié, pas
  // supposé.
  {
    id: 'japon',
    label: '🇯🇵 Japon',
    intro: 'Nikkei 225, TOPIX, MSCI Japan… le plus connu (Nikkei) n\'est pas forcément le plus pertinent pour investir 🇯🇵\nOn décrypte les trois 👇',
    indices: [
      { name: 'Nikkei 225', desc: 'Les 225 plus grandes valeurs de la Bourse de Tokyo, indice pondéré par le PRIX de l\'action (pas la capitalisation).', tag: 'Le plus connu, pas le plus rigoureux 📰' },
      { name: 'TOPIX', desc: 'Quasiment toutes les valeurs du 1er compartiment de la Bourse de Tokyo, pondérées par capitalisation.', tag: 'Le plus large et le plus représentatif 🗾' },
      { name: 'MSCI Japan', desc: 'Les grandes et moyennes capitalisations japonaises selon la méthodologie MSCI (comparable aux autres indices MSCI Pays).', tag: 'Le standard international 🌐' },
    ],
    block2Title: '2️⃣ LES ETF ÉLIGIBLES PEA 💳',
    etfGroups: [
      {
        indexName: 'Nikkei 225', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'Xtrackers Nikkei 225 UCITS ETF 1D', isin: 'LU0839027447', ter: '0,09 %', aum: '1,97 Md€' }],
      },
      {
        indexName: 'TOPIX', choiceNote: 'un seul choix, mais PEA ✅', pea: true,
        funds: [{ name: 'Amundi PEA Japon (TOPIX) UCITS ETF', isin: 'FR0013411980', ter: '0,20 %', repl: '🔄 Synthétique', dist: 'capitalisant', aum: '148 M€' }],
      },
      {
        indexName: 'MSCI Japan', choiceNote: 'Non éligible PEA — CTO uniquement', pea: false,
        funds: [{ name: 'iShares Core MSCI Japan IMI UCITS ETF (Acc)', isin: 'IE00B4L5YX21', ter: '0,12 %', repl: '🔄 Physique', dist: 'capitalisant', aum: '7,2 Md€' }],
      },
    ],
    diversification: {
      chain: ['TOPIX (~2 000 lignes)', 'MSCI Japan IMI (~1 200)', 'Nikkei 225 (225, prix-pondéré)'],
      notes: ['⚠️ Le Nikkei 225, pondéré par le prix de l\'action et non la capitalisation, peut sur-pondérer des valeurs chères mais économiquement mineures.', '→ TOPIX et MSCI Japan (pondérés par capitalisation) sont jugés plus représentatifs de l\'économie japonaise réelle.'],
    },
    perfFunds: [
      { key: 'nikkei', label: 'Xtrackers Nikkei 225' },
      { key: 'topix', label: 'Amundi PEA Japon (TOPIX)' },
      { key: 'msci_japan', label: 'iShares Core MSCI Japan IMI' },
    ],
    verdictTitle: '✅ LE VERDICT POUR UN PEA',
    verdict: [
      { q: '💳 Tu veux rester en PEA ?', a: 'Amundi PEA Japon — seule option, mais indice TOPIX (pas Nikkei).' },
      { q: '📰 Tu veux spécifiquement le Nikkei 225, en CTO ?', a: 'Xtrackers Nikkei 225.' },
      { q: '🌐 Tu veux le standard international, en CTO ?', a: 'iShares Core MSCI Japan IMI.' },
    ],
    closing: '💬 Toi, tu savais que le Nikkei n\'est PAS pondéré par la capitalisation ?',
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
