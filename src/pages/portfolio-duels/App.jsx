import { useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { DUELS } from './data.js'
import { buildDuel, buildTweet, formatCapital, formatPercent } from './lib.js'
import { renderDuelImage } from './canvasImage.js'
import { YEARS } from '../portfolio-generator/data.js'
import './portfolio-duels.css'

const duels = DUELS.map(buildDuel)

function fallbackCopy(value) {
  const area = document.createElement('textarea')
  area.value = value
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.append(area)
  area.select()
  let copied = false
  try { copied = document.execCommand('copy') } catch { /* La sélection manuelle reste disponible. */ }
  area.remove()
  return copied
}

export default function App() {
  const [index, setIndex] = useState(0)
  const [copyStatus, setCopyStatus] = useState('')
  const lastIndex = useRef(0)
  const duel = duels[index]
  const tweet = buildTweet(duel)

  function choose(next) {
    lastIndex.current = next
    setIndex(next)
    setCopyStatus('')
  }

  function randomDuel() {
    const choices = duels.map((_, i) => i).filter((i) => i !== lastIndex.current)
    choose(choices[Math.floor(Math.random() * choices.length)])
  }

  async function copyTweet() {
    let ok = false
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(tweet); ok = true } catch { /* Repli ci-dessous. */ }
    }
    if (!ok) ok = fallbackCopy(tweet)
    setCopyStatus(ok ? 'Copié !' : 'Sélectionne et copie le texte ci-dessous.')
  }

  function downloadImage() {
    const link = document.createElement('a')
    link.href = renderDuelImage(duel)
    link.download = `duel-${duel.id}.png`
    document.body.append(link)
    link.click()
    link.remove()
  }

  return (
    <div className="pd-scope">
      <PageHeader title="Duel de portefeuilles" subtitle="Deux allocations proches, un seul choix qui change · 4 duels préparés sur 2020–2025." />
      <div className="pd-controls">
        <label htmlFor="pd-select">Choisir un duel</label>
        <select id="pd-select" value={index} onChange={(event) => choose(Number(event.target.value))}>
          {duels.map((item, i) => <option key={item.id} value={i}>{item.title}</option>)}
        </select>
        <Button type="button" variant="secondary" onClick={randomDuel}>🎲 Un autre duel</Button>
      </div>

      <article className="pd-result">
        <p className="pd-kicker">⚔️ DUEL DE PORTEFEUILLES</p>
        <h2>{duel.title}</h2>
        <p className="pd-hook">{duel.hook}</p>
        <div className="pd-cards">
          {[duel.a, duel.b].map((portfolio, i) => (
            <section className={`pd-card pd-${i ? 'b' : 'a'}`} key={portfolio.name}>
              <h3>{i ? 'B' : 'A'} · {portfolio.name}</h3>
              <p>70 % {duel.commonAsset.name}</p>
              <p>30 % {portfolio.assets[1].name}</p>
              <strong>{formatCapital(portfolio.final, duel.currency)}</strong>
              <small>pour 10 000 {duel.currency === 'USD' ? '$' : '€'} au départ</small>
            </section>
          ))}
        </div>
        <div className="pd-table-wrap">
          <table className="pd-table">
            <caption>Performances annuelles des deux portefeuilles ({duel.currency})</caption>
            <thead><tr><th>Année</th><th>A · {duel.a.name}</th><th>B · {duel.b.name}</th></tr></thead>
            <tbody>{YEARS.map((year) => <tr key={year}><th>{year}</th><td>{formatPercent(duel.a.annual[year])}</td><td>{formatPercent(duel.b.annual[year])}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="pd-worst">📉 Pire année : A {formatPercent(duel.a.worst)} ({duel.a.worstYear}) · B {formatPercent(duel.b.worst)} ({duel.b.worstYear})</p>
        <p className="pd-question">💬 {duel.question}</p>
      </article>

      <div className="pd-actions">
        <Button type="button" onClick={copyTweet}>📋 Copier le texte</Button>
        <Button type="button" variant="secondary" onClick={downloadImage}>🖼️ Télécharger l’image PNG</Button>
        {copyStatus && <span role="status">{copyStatus}</span>}
      </div>
      <label className="pd-text-label" htmlFor="pd-tweet">Texte prêt à publier</label>
      <textarea id="pd-tweet" readOnly value={tweet} rows={18} onFocus={(event) => event.target.select()} />
      <details className="pd-sources">
        <summary>Sources et calcul</summary>
        <p>Parts exactes en {duel.currency}, revenus réinvestis lorsque le fonds le prévoit. Pondérations rétablies au début de chaque année. Résultats indicatifs hors courtage, fiscalité et change vers l’euro.</p>
        <ul>{duel.sources.map((source) => <li key={source.isin}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> · {source.isin}</li>)}</ul>
      </details>
    </div>
  )
}
