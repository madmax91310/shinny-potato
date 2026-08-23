import { useState, useEffect, useRef, Fragment } from 'react'
import { BROKERS, ROWS, DUELS, MAX_SELECT, byId, rankRow, buildTweet } from './data'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './broker-comparator.css'

const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

function PeaPill({ val, label }) {
  const cls = val === null ? 'nc' : val ? 'yes' : 'no'
  const mark = val === null ? '?' : val ? '✓' : '✕'
  return (
    <span className={`bc-pea-pill ${cls}`}>
      {mark} {label}
    </span>
  )
}

const getRow = (key) => ROWS.find((r) => r.key === key)

function RankedRow({ rowKey, brokers, gridStyle }) {
  const row = getRow(rowKey)
  const best = rankRow(row, brokers)
  return (
    <div className="bc-row">
      <div className="bc-row-label">
        {row.icon} {row.label}
      </div>
      <div className="bc-cells" style={gridStyle}>
        {brokers.map((b) => {
          const c = b[row.key]
          const isBest = best !== null && c.rank === best
          return (
            <div className={`bc-cell${isBest ? ' best' : ''}`} key={b.id}>
              <div className="bc-resume">{c.resume}</div>
              {c.detail && <div className="bc-detail">{c.detail}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TextRow({ icon, label, dataKey, brokers, gridStyle }) {
  return (
    <div className="bc-row">
      <div className="bc-row-label">
        {icon} {label}
      </div>
      <div className="bc-cells" style={gridStyle}>
        {brokers.map((b) => (
          <div className="bc-cell" key={b.id}>
            <div className="bc-resume">{b[dataKey] ? b[dataKey].resume : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonCard({ selected }) {
  if (selected.length < 2) {
    return (
      <div className="bc-card">
        <div className="bc-empty-state">Sélectionne au moins 2 courtiers pour générer le comparatif.</div>
      </div>
    )
  }
  const brokers = selected.map(byId)
  const n = brokers.length
  const cheapest = [...brokers].sort((x, y) => x.frais.rank - y.frais.rank)[0]
  const gridStyle = { gridTemplateColumns: `repeat(${n}, 1fr)` }

  return (
    <div className="bc-card">
      <div className="bc-eyebrow">
        <span>Comparatif courtiers · 2026</span>
        <span className="bc-handle">{fmtDate}</span>
      </div>
      <h1 className="bc-title">
        {brokers.map((b, i) => (
          <Fragment key={b.id}>
            {i > 0 && ' vs '}
            <em>{b.nom}</em>
          </Fragment>
        ))}
      </h1>
      <p className="bc-subtitle">PEA, frais &amp; investissement programmé — vue synthétique</p>

      <div className="bc-head-row" style={gridStyle}>
        {brokers.map((b) => (
          <div className="bc-head-cell" key={b.id}>
            <div className="bc-badge" style={{ background: b.color }}>
              {b.code}
            </div>
            <div className="bc-head-name">
              {b.emoji} {b.nom}
            </div>
          </div>
        ))}
      </div>

      <RankedRow rowKey="frais" brokers={brokers} gridStyle={gridStyle} />
      <RankedRow rowKey="boursomarkets" brokers={brokers} gridStyle={gridStyle} />
      <RankedRow rowKey="dca" brokers={brokers} gridStyle={gridStyle} />
      <RankedRow rowKey="garde" brokers={brokers} gridStyle={gridStyle} />

      <div className="bc-row">
        <div className="bc-row-label">🌱 PEA / PEA-PME / PEA Jeune</div>
        <div className="bc-cells" style={gridStyle}>
          {brokers.map((b) => (
            <div className="bc-pea-pills" key={b.id}>
              <PeaPill val={b.pea.pea} label="PEA" />
              <PeaPill val={b.pea.pme} label="PME" />
              <PeaPill val={b.pea.jeune} label="Jeune" />
            </div>
          ))}
        </div>
      </div>

      <RankedRow rowKey="ifu" brokers={brokers} gridStyle={gridStyle} />
      <RankedRow rowKey="liquidites" brokers={brokers} gridStyle={gridStyle} />
      <TextRow icon="🔄" label="Transfert PEA" dataKey="transfertPea" brokers={brokers} gridStyle={gridStyle} />

      <div className="bc-row">
        <div className="bc-row-label">⚠️ Point faible</div>
        <div className="bc-cells" style={gridStyle}>
          {brokers.map((b) => (
            <div className="bc-weak-cell" key={b.id}>
              {b.pointFaible}
            </div>
          ))}
        </div>
      </div>

      <div className="bc-synth">
        <div className="bc-label">En bref</div>
        <div className="bc-line">
          💰 Frais les plus bas : <strong>{cheapest.nom}</strong> — {cheapest.frais.resume}
        </div>
      </div>

      <div className="bc-footer">
        <span className="bc-disclaimer">
          Données indicatives arrêtées au {fmtDate}. Vérifie les tarifs avant publication — ceci ne constitue pas un
          conseil en investissement.
        </span>
        <span className="bc-datestamp">📊 Éducation financière</span>
      </div>
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState(['tr', 'bourso'])
  const [tweet, setTweet] = useState(() => buildTweet(['tr', 'bourso']))
  const [copied, setCopied] = useState(false)
  const editedRef = useRef(false)

  useEffect(() => {
    if (!editedRef.current) setTweet(buildTweet(selected))
  }, [selected])

  function selectDuel(d) {
    editedRef.current = false
    setSelected([d.a, d.b])
  }

  function toggleBroker(id) {
    editedRef.current = false
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECT) return prev
      return [...prev, id]
    })
  }

  async function copyTweet() {
    try {
      await navigator.clipboard.writeText(tweet)
    } catch {
      // clipboard indisponible : l'utilisateur peut copier le texte à la main
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const doneCount = DUELS.filter((d) => d.done).length

  return (
    <div className="bc-scope">
      <PageHeader
        title="Générateur de comparatif courtiers"
        subtitle="Choisis un duel de la série, ou coche 2 à 3 courtiers à la main. La carte se génère automatiquement, prête à capturer."
      />

      <div className="bc-panel">
        <h2>Prochain duel de la série</h2>
        <p className="bc-hint">Les duels déjà publiés restent cliquables si tu veux régénérer un visuel.</p>
        <div className="bc-duels-grid">
          {DUELS.map((d, i) => {
            const active = selected.length === 2 && selected.includes(d.a) && selected.includes(d.b)
            return (
              <button
                key={i}
                type="button"
                className={`bc-duel-chip${d.done ? ' pending' : ''}${active ? ' active' : ''}`}
                title={d.done ? 'Déjà publié — cliquer pour régénérer' : 'À publier'}
                onClick={() => selectDuel(d)}
              >
                <span className="bc-dot" />
                {byId(d.a).code} vs {byId(d.b).code}
              </button>
            )
          })}
        </div>
        <div className="bc-progress-line">
          <span>
            {doneCount} / {DUELS.length} duels publiés
          </span>
          <span className="bc-progress-track">
            <span className="bc-progress-fill" style={{ width: (doneCount / DUELS.length) * 100 + '%' }} />
          </span>
        </div>
      </div>

      <div className="bc-panel">
        <h2>Sélection manuelle</h2>
        <p className="bc-hint">2 ou 3 courtiers maximum — utile pour un comparatif hors-série.</p>
        <div className="bc-broker-select">
          {BROKERS.map((b) => {
            const checked = selected.includes(b.id)
            const disabled = !checked && selected.length >= MAX_SELECT
            return (
              <div className="bc-broker-pill" key={b.id}>
                <input
                  type="checkbox"
                  id={'chk-' + b.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleBroker(b.id)}
                />
                <label htmlFor={'chk-' + b.id}>
                  <span className="bc-swatch" style={{ background: b.color }} />
                  {b.nom}
                </label>
              </div>
            )
          })}
        </div>
        {selected.length < 2 && <div className="bc-select-warning">Sélectionne au moins 2 courtiers pour générer la carte.</div>}
      </div>

      <div className="bc-stage">
        <ComparisonCard selected={selected} />
      </div>

      <div className="bc-panel">
        <h2>Post X (format duel)</h2>
        <p className="bc-hint">
          Reproduit le squelette de la série — fonctionne pour un duel de 2 courtiers. Modifiable avant publication.
        </p>
        <textarea
          className="bc-tweet-textarea"
          spellCheck={false}
          value={tweet}
          onChange={(e) => {
            editedRef.current = true
            setTweet(e.target.value)
          }}
        />
        <div className="bc-tweet-actions">
          <Button type="button" onClick={copyTweet}>
            Copier le tweet
          </Button>
          <span className={`bc-copy-msg${copied ? ' show' : ''}`}>Copié ✓</span>
          <span className="bc-char-count">{tweet.length} caractères</span>
        </div>
      </div>
    </div>
  )
}
