import { useMemo, useState } from 'react'
import {
  ASSETS, ASSET_ORDER, MONTHS_FULL, MONTHS_SHORT, YEARS, AMOUNT_PRESETS, DATE_PRESETS,
} from './data'
import { derive, fmtEUR, fmtPct, pct, buildTweetText } from './lib'
import Sparkline from './Sparkline'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import './investment-calculator.css'

const INITIAL_STATE = {
  assetId: 'bitcoin',
  startYear: 2020,
  startMonth: 1,
  amountRaw: '1000',
  mode: 'lump',
  customLabel: '',
  customStart: '',
  customEnd: '',
}

function CompareItem({ label, value, deltaVal, highlight }) {
  return (
    <div className={`ic-compare-item${highlight ? ' highlight' : ''}`}>
      <p className="ic-compare-label">{label}</p>
      <p className="ic-compare-value">{fmtEUR(value)}</p>
      <p className={`ic-compare-delta ${deltaVal >= 0 ? 'pos' : 'neg'}`}>{fmtPct(deltaVal)}</p>
    </div>
  )
}

function ResultCard({ state, d, copied, onCopy }) {
  const asset = d.isCustom ? null : ASSETS[state.assetId]
  const assetLabel = d.isCustom ? state.customLabel || 'cet actif' : asset.label
  const gainAbs = d.result.finalValue - d.result.totalInvested
  const gainPct = pct(d.result.finalValue, d.result.totalInvested)
  const livretPct = pct(d.livretA.finalValue, d.livretA.totalInvested)
  const inflPct = pct(d.inflation.finalValue, d.inflation.totalInvested)
  const monthShort = MONTHS_SHORT[parseInt(d.startYm.split('-')[1], 10) - 1]
  const yearLabel = d.startYm.split('-')[0]

  return (
    <div className="ic-card">
      <div className="ic-card-head">
        <div className="ic-card-head-left">
          <div className="ic-asset-badge">{d.isCustom ? '✎' : asset.icon}</div>
          <div>
            <h2>{assetLabel}</h2>
            <p className="ic-period">
              {monthShort} {yearLabel} → aujourd'hui
            </p>
          </div>
        </div>
        <span className="ic-mode-pill">{d.effectiveMode === 'dca' ? 'DCA mensuel' : 'Versement unique'}</span>
      </div>

      <div className="ic-hero">
        <p className="ic-hero-label">
          {d.effectiveMode === 'dca' ? (
            <>
              Avec <b>{fmtEUR(d.amount)}/mois</b> placés, ton capital serait devenu :
            </>
          ) : (
            <>
              Ton <b>{fmtEUR(d.amount)}</b> serait devenu :
            </>
          )}
        </p>
        <p className="ic-hero-number">{fmtEUR(d.result.finalValue)}</p>
        <div className="ic-hero-sub">
          <span className={`ic-delta-pill ${gainPct >= 0 ? 'pos' : 'neg'}`}>{fmtPct(gainPct)}</span>
          <span className="ic-gain-abs">
            {gainAbs >= 0 ? '+' : ''}
            {fmtEUR(gainAbs)} de plus-value · {fmtEUR(d.result.totalInvested)} investis
          </span>
        </div>
      </div>

      <div className="ic-chart-wrap">
        <div className="ic-chart-legend">
          <span className="ic-legend-item">
            <span className="ic-legend-swatch" style={{ background: '#2dd4bf' }} />
            {assetLabel}
          </span>
          <span className="ic-legend-item">
            <span className="ic-legend-swatch" style={{ background: '#5b6688', opacity: 0.8 }} />
            Capital investi
          </span>
        </div>
        <Sparkline series={d.result.series} invested={d.result.invested} />
      </div>

      <div className="ic-compare">
        <CompareItem label={assetLabel} value={d.result.finalValue} deltaVal={gainPct} highlight />
        <CompareItem label="Livret A" value={d.livretA.finalValue} deltaVal={livretPct} />
        <CompareItem label="Inflation" value={d.inflation.finalValue} deltaVal={inflPct} />
      </div>

      <div className="ic-card-footer">
        <p className="ic-disclaimer">
          Éducation financière, pas un conseil en investissement. Données historiques approximatives, performances passées ≠ garanties futures.
        </p>
        <Button type="button" onClick={onCopy}>
          {copied ? '✓ Copié' : '𝕏 Copier le texte du post'}
        </Button>
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE)
  const [copied, setCopied] = useState(false)

  const isCustom = state.assetId === 'custom'
  const effectiveMode = isCustom ? 'lump' : state.mode
  const amount = parseFloat(state.amountRaw) || 0
  const d = useMemo(() => derive(state), [state])

  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  async function handleCopy() {
    const text = buildTweetText(state, d)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard indisponible : on affiche quand même la confirmation, l'utilisateur peut copier le texte à la main
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ic-scope">
      <PageHeader
        title="Et si tu avais investi ?"
        subtitle="Simulateur d'éducation financière — données 2015 → aujourd'hui."
      />

      <div className="ic-layout">
        <div className="ic-panel">
          <div>
            <p className="ic-eyebrow">Actif</p>
            <div className="ic-field">
              <div className="ic-select-wrap">
                <select className="ic-control" value={state.assetId} onChange={(e) => set({ assetId: e.target.value })}>
                  {ASSET_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {ASSETS[id].icon} {ASSETS[id].label}
                    </option>
                  ))}
                  <option value="custom">✎ Autre (saisie manuelle)</option>
                </select>
              </div>
              {isCustom && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <input
                    className="ic-control"
                    type="text"
                    placeholder="Nom de l'actif"
                    value={state.customLabel}
                    onChange={(e) => set({ customLabel: e.target.value })}
                  />
                  <div className="ic-row2">
                    <input
                      className="ic-control"
                      type="number"
                      placeholder="Prix de départ"
                      value={state.customStart}
                      onChange={(e) => set({ customStart: e.target.value })}
                    />
                    <input
                      className="ic-control"
                      type="number"
                      placeholder="Prix actuel"
                      value={state.customEnd}
                      onChange={(e) => set({ customEnd: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="ic-eyebrow">Date de départ</p>
            <div className="ic-row2">
              <div className="ic-select-wrap">
                <select className="ic-control" value={state.startMonth} onChange={(e) => set({ startMonth: parseInt(e.target.value, 10) })}>
                  {MONTHS_FULL.map((mn, i) => (
                    <option key={mn} value={i + 1}>
                      {mn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ic-select-wrap">
                <select className="ic-control" value={state.startYear} onChange={(e) => set({ startYear: parseInt(e.target.value, 10) })}>
                  {YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ic-chips">
              {DATE_PRESETS.map((dp) => (
                <button
                  key={dp.label}
                  type="button"
                  className={`ic-chip${dp.y === state.startYear && dp.m === state.startMonth ? ' active' : ''}`}
                  onClick={() => set({ startYear: dp.y, startMonth: dp.m })}
                >
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="ic-eyebrow">Montant</p>
            <div className="ic-field">
              <div className="ic-amount-wrap">
                <input
                  className="ic-control"
                  type="number"
                  min="1"
                  value={state.amountRaw}
                  onChange={(e) => set({ amountRaw: e.target.value })}
                />
                <span className="ic-amount-suffix">€</span>
              </div>
              <div className="ic-chips">
                {AMOUNT_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`ic-chip${v === amount ? ' active' : ''}`}
                    onClick={() => set({ amountRaw: String(v) })}
                  >
                    {v.toLocaleString('fr-FR')} €
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="ic-eyebrow">Mode</p>
            <div className="ic-segmented">
              <button type="button" className={effectiveMode === 'lump' ? 'active' : ''} disabled={isCustom} onClick={() => set({ mode: 'lump' })}>
                Versement unique
              </button>
              <button type="button" className={effectiveMode === 'dca' ? 'active' : ''} disabled={isCustom} onClick={() => set({ mode: 'dca' })}>
                Mensuel (DCA)
              </button>
            </div>
            <p className="ic-hint">
              {isCustom
                ? 'Le mode DCA nécessite un historique de prix : indisponible en saisie manuelle.'
                : effectiveMode === 'dca'
                  ? `Un versement de ${amount.toLocaleString('fr-FR')} € chaque mois depuis la date de départ.`
                  : "Un seul versement à la date de départ, laissé investi jusqu'à aujourd'hui."}
            </p>
          </div>
        </div>

        <ResultCard state={state} d={d} copied={copied} onCopy={handleCopy} />
      </div>
    </div>
  )
}
