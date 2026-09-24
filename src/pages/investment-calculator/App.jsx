import { useMemo, useState } from 'react'
import {
  ASSETS, ASSET_ORDER, MONTHS_FULL, MONTHS_SHORT, YEARS, AMOUNT_PRESETS, DATE_PRESETS,
  getAssetMinDate, SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS,
  REDUCED_CONFIDENCE_LAST_POINT, LATEST_YM,
} from './data'
import { derive, fmtEUR, fmtPct, pct, buildTweetText, ymIndex, sparseAssetSeries, applyPriceOverride, currencySymbol } from './lib'
import Sparkline from './Sparkline'
import VideoExport from './VideoExport'
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

function CompareItem({ label, value, deltaVal, currency, highlight }) {
  return (
    <div className={`ic-compare-item${highlight ? ' highlight' : ''}`}>
      <p className="ic-compare-label">{label}</p>
      <p className="ic-compare-value">{fmtEUR(value, currency)}</p>
      <p className={`ic-compare-delta ${deltaVal >= 0 ? 'pos' : 'neg'}`}>{fmtPct(deltaVal)}</p>
    </div>
  )
}

function ResultCard({ state, d, copied, onCopy }) {
  const asset = d.isCustom ? null : ASSETS[state.assetId]
  const monthlyIndex = INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)
  const assetLabel = d.isCustom ? state.customLabel || 'cet actif' : asset.label
  // Actif coté en dollars (Amazon, S&P 500, Or...) : montant/résultat/comparaisons restent dans
  // cette devise plutôt que mélangés avec un € qui donnerait un faux air de conversion (demande
  // utilisateur du 22/09/2026, plutôt qu'une conversion EUR/USD historique — cf. commentaire sur
  // ic-compare-note plus bas pour Livret A/Inflation, qui restent des produits en euros).
  const currency = d.isCustom ? 'EUR' : asset.currency
  const gainAbs = d.result.finalValue - d.result.totalInvested
  const gainPct = pct(d.result.finalValue, d.result.totalInvested)
  const livretPct = pct(d.livretA.finalValue, d.livretA.totalInvested)
  const inflPct = pct(d.inflation.finalValue, d.inflation.totalInvested)
  const monthShort = MONTHS_SHORT[parseInt(d.startYm.split('-')[1], 10) - 1]
  const yearLabel = d.startYm.split('-')[0]
  const endLabel = `${MONTHS_SHORT[Number(d.endYm.split('-')[1]) - 1]} ${d.endYm.split('-')[0]}`

  // Vidéo uniquement : série réduite aux vrais points pour un actif à grain annuel (DCA bloqué,
  // donc toujours en mode lump ici) — la grille mensuelle complète de d.result (utilisée pour le
  // Sparkline statique et les stats, INCHANGÉE) rendait mal animée sur ces actifs (retour
  // utilisateur du 14/09/2026, cf. sparseAssetSeries dans lib.js pour le détail).
  const videoResult =
    !d.isCustom && SPARSE_MONTHLY_DATA_IDS.has(state.assetId) && d.effectiveMode !== 'dca'
      ? applyPriceOverride(sparseAssetSeries(asset.points, d.startYm, d.endYm, d.amount), asset.points, state.overridePriceRaw, d.endYm)
      : d.result

  return (
    <div className="ic-card">
      <div className="ic-card-head">
        <div className="ic-card-head-left">
          <div className="ic-asset-badge">{d.isCustom ? '✎' : asset.icon}</div>
          <div>
            <h2>{assetLabel}</h2>
            <p className="ic-period">
              {monthShort} {yearLabel} → {endLabel}{state.overridePriceRaw !== '' && !d.isCustom ? ' (prix saisi)' : ''}
            </p>
          </div>
        </div>
        <span className="ic-mode-pill">{d.effectiveMode === 'dca' ? 'DCA mensuel' : 'Versement unique'}</span>
      </div>

      <div className="ic-hero">
        <p className="ic-hero-label">
          {d.effectiveMode === 'dca' ? (
            <>
              Avec <b>{fmtEUR(d.amount, currency)}/mois</b> placés, ton capital serait devenu :
            </>
          ) : (
            <>
              Tes <b>{fmtEUR(d.amount, currency)}</b> seraient devenus :
            </>
          )}
        </p>
        <p className="ic-hero-number">{fmtEUR(d.result.finalValue, currency)}</p>
        <div className="ic-hero-sub">
          <span className={`ic-delta-pill ${gainPct >= 0 ? 'pos' : 'neg'}`}>{fmtPct(gainPct)} sur les versements</span>
          <span className="ic-gain-abs">
            {gainAbs < 0 ? 'Perte : ' : 'Gain : '}
            {fmtEUR(Math.abs(gainAbs), currency)} · {fmtEUR(d.result.totalInvested, currency)} investis
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
        <CompareItem label={assetLabel} value={d.result.finalValue} deltaVal={gainPct} currency={currency} highlight />
        {currency === 'EUR' ? (
          <>
            <CompareItem label="Livret A" value={d.livretA.finalValue} deltaVal={livretPct} currency="EUR" />
            <CompareItem label="Panier de dépenses (inflation indicative)" value={d.inflation.finalValue} deltaVal={inflPct} currency="EUR" />
          </>
        ) : (
          // Livret A et inflation sont des repères français en euros : les afficher à côté d'un
          // montant en dollars donnerait l'illusion d'une comparaison directe alors qu'aucun taux de
          // change n'est appliqué (demande utilisateur du 22/09/2026 — même principe que le montant
          // simulé, jamais mélanger deux devises sans le dire).
          <p className="ic-compare-note">
            Comparaison Livret A / inflation non affichée : {assetLabel} est coté en dollars, pas
            directement comparable à un produit d'épargne en euros sans taux de change.
          </p>
        )}
      </div>

      <p className="ic-method-note">
        Le versement unique achète au prix de départ ; en DCA, chaque versement mensuel achète au prix du mois. Les prix manquants entre points connus sont interpolés. Le pourcentage rapporte le gain ou la perte à la somme versée, sans annualisation. Le panier de dépenses illustre la hausse des prix : ce n'est pas un placement. Livret A et inflation sont estimés avec des taux annuels moyens.
        {monthlyIndex ? ' Pour cet indice, la simulation part d’une clôture de décembre et relie uniquement les points annuels vérifiés ; elle ne représente pas la performance nette d’un ETF précis.' : ''}
      </p>

      <div className="ic-card-footer">
        <p className="ic-disclaimer">
          Éducation financière, pas un conseil en investissement. Données historiques parfois approximatives, frais et fiscalité non pris en compte. Les performances passées ne préjugent pas des performances futures.
        </p>
        <div className="ic-card-footer-actions">
          <Button type="button" onClick={onCopy}>
            {copied === 'done' ? '✓ Copié' : copied === 'error' ? 'Copie impossible' : '𝕏 Copier le texte du post'}
          </Button>
        </div>
        <VideoExport
          videoParams={{
            series: videoResult.series,
            invested: videoResult.invested,
            assetLabel: `${d.isCustom ? '✎' : asset.icon} ${assetLabel}`,
            periodLabel: `${monthShort} ${yearLabel} → ${endLabel}`,
            modeLabel: d.effectiveMode === 'dca' ? 'DCA MENSUEL' : 'VERSEMENT UNIQUE',
            totalInvested: videoResult.totalInvested,
            finalValue: videoResult.finalValue,
            gainPct,
            currency,
          }}
          filenameBase={`investissement-${d.isCustom ? 'actif' : state.assetId}-${d.effectiveMode}`}
          comparativeInputs={{
            amount: d.amount,
            startYm: d.startYm,
            endYm: d.endYm,
            mode: d.effectiveMode,
            periodLabel: `${monthShort} ${yearLabel} → ${endLabel}`,
            modeLabel: d.effectiveMode === 'dca' ? 'DCA MENSUEL' : 'VERSEMENT UNIQUE',
            defaultAssetId: !d.isCustom ? state.assetId : undefined,
            // Reporte le "prix à jour" saisi dans le formulaire Simple, pour que la vidéo Comparatif
            // affiche la même valeur finale que l'aperçu statique quand cet actif y est comparé —
            // au lieu de retomber silencieusement sur le dernier point de data.js (cf. lib.js/
            // applyPriceOverride et computeComparativeSeries dans videoExport.js).
            overrideAssetId: !d.isCustom ? state.assetId : undefined,
            overridePriceRaw: !d.isCustom ? state.overridePriceRaw : '',
          }}
        />
      </div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE)
  const [copied, setCopied] = useState('idle')

  const isCustom = state.assetId === 'custom'
  const monthlyIndex = !isCustom && INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)
  const effectiveMode = isCustom || monthlyIndex ? 'lump' : state.mode
  // Actif coté en dollars (Amazon, S&P 500, Or...) : formulaire de saisie dans cette devise plutôt
  // que mélangé avec un € qui donnerait un faux air de conversion (demande utilisateur du
  // 22/09/2026) — cf. le même choix dans ResultCard et videoExport.js.
  const currency = isCustom ? 'EUR' : ASSETS[state.assetId].currency
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
  const lastAvailableYm = isCustom ? null : ASSETS[state.assetId].points.at(-1).date
  const startDateAfterLast = !isCustom && ymIndex(startYm) > ymIndex(lastAvailableYm)
  const indexStartInvalid = monthlyIndex && state.startMonth !== 12
  const startDateInvalid = (assetMinDate !== null && ymIndex(startYm) < ymIndex(assetMinDate)) || startDateAfterLast || indexStartInvalid
  const assetMinDateLabel = assetMinDate ? `${MONTHS_SHORT[parseInt(assetMinDate.split('-')[1], 10) - 1]} ${assetMinDate.split('-')[0]}` : null
  // Badge de confiance visible en UI (pas seulement en commentaire de code), à la demande de
  // l'utilisateur (audit "outils" du 14/09/2026) : vrai dès que le plancher vérifié (assetMinDate)
  // est postérieur au tout premier point brut de l'actif — jamais un id codé en dur, pour que
  // tout futur ajout à VERIFIED_MIN_DATE_OVERRIDES déclenche automatiquement le même badge.
  const hasTruncatedHistory = !isCustom && assetMinDate !== null && assetMinDate !== ASSETS[state.assetId].points[0].date
  // Prix actualisé (saisie manuelle, optionnelle) : mêmes règles que montant/customStart/customEnd
  // — vide = état neutre (on garde le dernier niveau connu), une valeur réellement saisie à 0 ou
  // en négatif ne doit jamais atteindre le calcul.
  const overridePriceInvalid = !isCustom && state.overridePriceRaw !== '' && !(parseFloat(state.overridePriceRaw) > 0)
  const hasValidOverride = !isCustom && !overridePriceInvalid && state.overridePriceRaw !== ''
  const resultBlocked = amountInvalid || customStartInvalid || customEndInvalid || startDateInvalid || overridePriceInvalid
  const d = useMemo(() => derive(state), [state])
  // Bloqué (pas juste un avertissement) : cf. SPARSE_MONTHLY_DATA_IDS dans data.js — ethereum/cac40/lvmh
  // n'ont que des points annuels sur leur plage utilisable, donc un DCA mensuel sur l'un d'eux
  // interpolerait la quasi-totalité des mois plutôt que d'utiliser une vraie clôture mensuelle. Seul
  // le versement unique reste possible pour ces actifs (même règle que le mode Comparatif de la vidéo,
  // cf. getComparativeAssetIssue dans videoExport.js — réutilisée ici, pas redéfinie).
  const sparseDcaAsset = !isCustom && (SPARSE_MONTHLY_DATA_IDS.has(state.assetId) || monthlyIndex)
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
      setCopied('done')
    } catch {
      setCopied('error')
    }
    setTimeout(() => setCopied('idle'), 2000)
  }

  return (
    <div className="ic-scope">
      <PageHeader
        title="Et si tu avais investi ?"
        subtitle={`Simulateur d'éducation financière — données arrêtées au plus tard en ${MONTHS_FULL[Number(LATEST_YM.split('-')[1]) - 1]} ${LATEST_YM.split('-')[0]}.`}
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
                  onChange={(e) => {
                    const id = e.target.value
                    set({
                      assetId: id,
                      overridePriceRaw: '',
                      startMonth: INCONSISTENT_MONTHLY_DATA_IDS.has(id) ? 12 : state.startMonth,
                      mode: id !== 'custom' && (SPARSE_MONTHLY_DATA_IDS.has(id) || INCONSISTENT_MONTHLY_DATA_IDS.has(id)) ? 'lump' : state.mode,
                    })
                  }}
                >
                  {ASSET_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {ASSETS[id].icon} {ASSETS[id].label}
                    </option>
                  ))}
                  <option value="custom">✎ Autre (saisie manuelle)</option>
                </select>
              </div>
              {hasTruncatedHistory && (
                <p className="ic-field-warning" title={`Les points antérieurs à ${assetMinDateLabel} restent affichés dans le graphique mais ne sont jamais utilisés pour un calcul.`}>
                  ⚠️ Données {ASSETS[state.assetId].label} non vérifiées avant {assetMinDateLabel} (valeurs illustratives) — simulation bloquée avant cette date.
                </p>
              )}
              {!isCustom && lastPoint && (
                <>
                  <p className="ic-current-level">
                    📍 Dernier niveau connu :{' '}
                    <strong>{fmtEUR(lastPoint.price, ASSETS[state.assetId].currency)}</strong>
                    {' '}(au {lastPointLabel})
                  </p>
                  {REDUCED_CONFIDENCE_LAST_POINT[state.assetId] && (
                    <p className="ic-field-warning">⚠️ {REDUCED_CONFIDENCE_LAST_POINT[state.assetId]}</p>
                  )}
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
                        Le prix saisi revalorise les parts acquises ; les versements restent arrêtés au dernier mois documenté ({lastPointLabel}). Vérifie ce prix avant publication.
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
                {startDateAfterLast
                  ? `Aucune donnée ${ASSETS[state.assetId].label} à cette date — choisis un mois au plus tard en ${lastPointLabel}.`
                  : indexStartInvalid
                    ? `Pour ${ASSETS[state.assetId].label}, choisis décembre : les autres mois de l'historique ne sont pas comparables aux clôtures annuelles recalées.`
                    : `Données ${ASSETS[state.assetId].label} non vérifiées avant cette date — choisis une date à partir de ${assetMinDateLabel}.`}
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
                <span className="ic-amount-suffix">{currencySymbol(currency)}</span>
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
                    {fmtEUR(v, currency)}
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
              <button type="button" className={effectiveMode === 'dca' ? 'active' : ''} disabled={isCustom || sparseDcaAsset} onClick={() => set({ mode: 'dca' })}>
                Mensuel (DCA)
              </button>
            </div>
            <p className="ic-hint">
              {isCustom
                ? 'Le mode DCA nécessite un historique de prix : indisponible en saisie manuelle.'
                : hasValidOverride
                  ? effectiveMode === 'dca'
                    ? `Un versement de ${fmtEUR(amount, currency)} chaque mois jusqu'à ${lastPointLabel}, puis une valorisation au prix que tu as saisi.`
                    : `Un seul versement à la date de départ, valorisé au prix que tu as saisi (historique arrêté en ${lastPointLabel}).`
                  : effectiveMode === 'dca'
                    ? `Un versement de ${fmtEUR(amount, currency)} chaque mois depuis la date de départ jusqu'à ${lastPointLabel} (dernière donnée disponible — au-delà, redonne-moi les clôtures récentes pour actualiser, ou saisis un prix à jour ci-dessus).`
                    : `Un seul versement à la date de départ, valorisé jusqu'à ${lastPointLabel} (dernière donnée disponible — ou saisis un prix à jour ci-dessus).`}
            </p>
            {sparseDcaAsset && (
              <p className="ic-field-warning">
                ⚠️ DCA non disponible pour {ASSETS[state.assetId].label} — {monthlyIndex ? 'série mensuelle incohérente avec les rendements annuels vérifiés' : 'données mensuelles insuffisantes sur cette période'}. Versement unique uniquement.
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
                  ? startDateAfterLast
                    ? `Aucune donnée ${ASSETS[state.assetId].label} après ${lastPointLabel} — choisis une date de départ plus ancienne.`
                    : indexStartInvalid
                      ? `Choisis une clôture de décembre pour ${ASSETS[state.assetId].label} : les autres mois restent à vérifier.`
                      : `Données ${ASSETS[state.assetId].label} non vérifiées avant ${assetMinDateLabel} — choisis une date de départ plus récente.`
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
