import { useMemo, useState } from 'react'
import {
  ASSETS, ASSET_ORDER, MONTHS_FULL, MONTHS_SHORT, YEARS, AMOUNT_PRESETS, DATE_PRESETS,
  getAssetMinDate, SPARSE_MONTHLY_DATA_IDS,
} from './data'
import { derive, fmtEUR, fmtPct, pct, buildTweetText, ymIndex } from './lib'
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
  overridePriceRaw: '',
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
  // Un champ vide (ou un texte non numérique, que le navigateur vide automatiquement) n'est pas
  // une erreur : c'est l'état neutre avant saisie. Un montant réellement saisi à 0 ou en négatif,
  // en revanche, ne doit jamais atteindre le calcul de performance — pct() ne peut pas distinguer
  // "pas encore de montant" de "montant invalide saisi" si on la laisse recevoir cette valeur.
  const amountInvalid = state.amountRaw !== '' && amount <= 0
  // Même logique pour l'actif "Autre" (saisie manuelle) : computeCustomSeries() (lib.js) fait
  // retomber son ratio à 1 dès que customStart <= 0, qu'il soit vide (pas encore saisi, état
  // neutre légitime) ou réellement invalide (0/négatif saisi) — indiscernable une fois dans
  // lib.js. On bloque donc ici, avant que la valeur invalide n'atteigne le calcul.
  const customStartInvalid = isCustom && state.customStart !== '' && parseFloat(state.customStart) <= 0
  const customEndInvalid = isCustom && state.customEnd !== '' && parseFloat(state.customEnd) <= 0
  // Même protection que côté Tweet Midi (getAssetMinDate, importé de data.js — pas une nouvelle
  // règle redéfinie ici) : LVMH n'a de points réellement vérifiés qu'à partir de 2020-12, les
  // points 2015-01 à 2019-10 étant explicitement marqués "NON VÉRIFIÉS... valeurs illustratives"
  // dans data.js. Le Calculateur n'appliquait cette protection nulle part avant le 04/09/2026 —
  // une date de départ antérieure au plancher calculait silencieusement sur ces points illustratifs.
  const assetMinDate = !isCustom ? getAssetMinDate(state.assetId) : null
  const startYm = state.startYear + '-' + (state.startMonth < 10 ? '0' + state.startMonth : state.startMonth)
  const startDateInvalid = assetMinDate !== null && ymIndex(startYm) < ymIndex(assetMinDate)
  const assetMinDateLabel = assetMinDate ? `${MONTHS_SHORT[parseInt(assetMinDate.split('-')[1], 10) - 1]} ${assetMinDate.split('-')[0]}` : null
  // Prix actualisé (saisie manuelle, optionnelle) : mêmes règles que montant/customStart/customEnd
  // — vide = état neutre (on garde le dernier niveau connu), une valeur réellement saisie à 0 ou
  // en négatif ne doit jamais atteindre le calcul.
  const overridePriceInvalid = !isCustom && state.overridePriceRaw !== '' && !(parseFloat(state.overridePriceRaw) > 0)
  const hasValidOverride = !isCustom && !overridePriceInvalid && state.overridePriceRaw !== ''
  const resultBlocked = amountInvalid || customStartInvalid || customEndInvalid || startDateInvalid || overridePriceInvalid
  const d = useMemo(() => derive(state), [state])
  // Avertissement (pas un blocage) : cf. SPARSE_MONTHLY_DATA_IDS dans data.js — ethereum/cac40/lvmh
  // n'ont que des points annuels sur leur plage utilisable, donc un DCA mensuel sur l'un d'eux
  // interpole la quasi-totalité des mois plutôt que d'utiliser une vraie clôture mensuelle.
  const sparseDcaWarning = !isCustom && effectiveMode === 'dca' && SPARSE_MONTHLY_DATA_IDS.has(state.assetId)
  // Dernier point RÉELLEMENT en base pour l'actif choisi (jamais LATEST_YM en dur : pour
  // stoxx600/sp500/msciWorld, le dernier point réel est antérieur d'un mois, cf.
  // data.js — donner LATEST_YM ici afficherait une date à laquelle ce prix n'est pas vérifié).
  // Réutilisé à la fois pour la ligne "dernier niveau connu" (étape 1) et pour le rappel de fin de
  // série en mode DCA (étape 4) — utilisateur demande explicitement à voir ce mois pour le DCA, afin
  // de savoir quand redonner des clôtures fraîches plutôt que de laisser la simulation dater
  // silencieusement au fil du temps.
  const lastPoint = !isCustom ? ASSETS[state.assetId].points[ASSETS[state.assetId].points.length - 1] : null
  const lastPointLabel = lastPoint ? `${MONTHS_FULL[parseInt(lastPoint.date.split('-')[1], 10) - 1]} ${lastPoint.date.split('-')[0]}` : null

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
                <select
                  className="ic-control"
                  value={state.assetId}
                  onChange={(e) => set({ assetId: e.target.value, overridePriceRaw: '' })}
                >
                  {ASSET_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {ASSETS[id].icon} {ASSETS[id].label}
                    </option>
                  ))}
                  <option value="custom">✎ Autre (saisie manuelle)</option>
                </select>
              </div>
              {!isCustom && lastPoint && (
                <>
                  <p className="ic-current-level">
                    📍 Dernier niveau connu :{' '}
                    <strong>{fmtEUR(lastPoint.price, ASSETS[state.assetId].currency)}</strong>
                    {' '}(au {lastPointLabel})
                  </p>
                  <div style={{ marginTop: 6 }}>
                    <input
                      className="ic-control"
                      type="number"
                      min="0"
                      step="any"
                      placeholder={`Prix à jour (optionnel) — sinon ${lastPoint.price}`}
                      value={state.overridePriceRaw}
                      onChange={(e) => set({ overridePriceRaw: e.target.value })}
                      aria-invalid={overridePriceInvalid}
                    />
                    {overridePriceInvalid && <p className="ic-field-error">Le prix à jour doit être supérieur à 0.</p>}
                    {!overridePriceInvalid && state.overridePriceRaw !== '' && (
                      <p className="ic-hint">
                        Calcul basé sur ce prix plutôt que sur le dernier niveau connu — vérifie-le toi-même avant de publier, jamais deviné automatiquement.
                      </p>
                    )}
                  </div>
                </>
              )}
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
                    <div>
                      <input
                        className="ic-control"
                        type="number"
                        placeholder="Prix de départ"
                        value={state.customStart}
                        onChange={(e) => set({ customStart: e.target.value })}
                        aria-invalid={customStartInvalid}
                      />
                      {customStartInvalid && <p className="ic-field-error">Le prix de départ doit être supérieur à 0.</p>}
                    </div>
                    <div>
                      <input
                        className="ic-control"
                        type="number"
                        placeholder="Prix actuel"
                        value={state.customEnd}
                        onChange={(e) => set({ customEnd: e.target.value })}
                        aria-invalid={customEndInvalid}
                      />
                      {customEndInvalid && <p className="ic-field-error">Le prix actuel doit être supérieur à 0.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="ic-eyebrow">Date de départ</p>
            <div className="ic-row2">
              <div className="ic-select-wrap">
                <select
                  className="ic-control"
                  value={state.startMonth}
                  onChange={(e) => set({ startMonth: parseInt(e.target.value, 10) })}
                  aria-invalid={startDateInvalid}
                >
                  {MONTHS_FULL.map((mn, i) => (
                    <option key={mn} value={i + 1}>
                      {mn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ic-select-wrap">
                <select
                  className="ic-control"
                  value={state.startYear}
                  onChange={(e) => set({ startYear: parseInt(e.target.value, 10) })}
                  aria-invalid={startDateInvalid}
                >
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
            {startDateInvalid && (
              <p className="ic-field-error">
                Données {ASSETS[state.assetId].label} non vérifiées avant cette date — choisis une date à partir de {assetMinDateLabel}.
              </p>
            )}
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
                  aria-invalid={amountInvalid}
                />
                <span className="ic-amount-suffix">€</span>
              </div>
              {amountInvalid && <p className="ic-field-error">Le montant doit être supérieur à 0.</p>}
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
                : hasValidOverride
                  ? effectiveMode === 'dca'
                    ? `Un versement de ${amount.toLocaleString('fr-FR')} € chaque mois depuis la date de départ, valorisé aujourd'hui au prix à jour que tu as saisi.`
                    : `Un seul versement à la date de départ, valorisé aujourd'hui au prix à jour que tu as saisi.`
                  : effectiveMode === 'dca'
                    ? `Un versement de ${amount.toLocaleString('fr-FR')} € chaque mois depuis la date de départ jusqu'à ${lastPointLabel} (dernière donnée disponible — au-delà, redonne-moi les clôtures récentes pour actualiser, ou saisis un prix à jour ci-dessus).`
                    : `Un seul versement à la date de départ, valorisé jusqu'à ${lastPointLabel} (dernière donnée disponible — ou saisis un prix à jour ci-dessus).`}
            </p>
            {sparseDcaWarning && (
              <p className="ic-field-warning">
                ⚠️ Cet actif n'a des prix réels qu'en décembre — le DCA mensuel est calculé sur des valeurs interpolées entre deux clôtures, donc indicatif plutôt que précis mois par mois.
              </p>
            )}
          </div>
        </div>

        {resultBlocked ? (
          <div className="ic-card ic-card-invalid">
            <p className="ic-invalid-message">
              {amountInvalid
                ? 'Indique un montant supérieur à 0 pour voir le résultat de la simulation.'
                : startDateInvalid
                  ? `Données ${ASSETS[state.assetId].label} non vérifiées avant ${assetMinDateLabel} — choisis une date de départ plus récente.`
                  : 'Corrige le(s) champ(s) de prix en erreur pour voir le résultat de la simulation.'}
            </p>
          </div>
        ) : (
          <ResultCard state={state} d={d} copied={copied} onCopy={handleCopy} />
        )}
      </div>
    </div>
  )
}
