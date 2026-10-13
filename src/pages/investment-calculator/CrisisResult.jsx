import { useState } from 'react'
import { downloadImage } from '../../design-system/downloadImage.js'
import { renderCrisisImage } from './crisisImage.js'
import Button from '../../design-system/Button'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import { fmtEUR, fmtPct, pct } from './lib.js'
import { crisisDateLabel, crisisMethodNote } from './crisis.js'

export default function CrisisResult({ comparison, copied, onCopy }) {
  const [imageError, setImageError] = useState('')
  async function saveImage() {
    try { setImageError(''); downloadImage(await renderCrisisImage(comparison), `investissement-${comparison.assetId}-${comparison.crisis.id}-${comparison.mode}.png`) }
    catch (error) { setImageError(error.message || 'Création de l’image impossible.') }
  }
  if (!comparison.available) return <div className="ic-card ic-card-invalid"><p className="ic-invalid-message" role="status">{comparison.message}</p></div>
  const { asset, crisis, mode, endYm, entries } = comparison
  return <div className="ic-card">
    <div className="ic-card-head"><div><h2>Et si tu avais commencé au mauvais moment ?</h2><p className="ic-period">{asset.label} · {crisis.label}</p></div></div>
    <p className="ic-hint">Trois dates de départ, une même date finale : {crisisDateLabel(endYm)}.</p>
    <div className="ic-crisis-results">
      {entries.map(({ label, startYm, result, loss }) => <article className="ic-crisis-entry" key={startYm}>
        <h3>{label}</h3><p className="ic-period">{crisisDateLabel(startYm)}</p>
        <dl>
          <dt>Sommes versées</dt><dd>{fmtEUR(result.totalInvested, asset.currency)}</dd>
          <dt>Capital final</dt><dd className="ic-crisis-capital">{fmtEUR(result.finalValue, asset.currency)}</dd>
          <dt>Gain / perte sur les versements</dt><dd>{fmtPct(pct(result.finalValue, result.totalInvested))}</dd>
          <dt>Mois en perte au total</dt><dd>{loss.total}</dd>
          <dt>Plus longue période en perte</dt><dd>{loss.longest} mois consécutifs</dd>
        </dl>
        {loss.stillUnderwater && <p className="ic-field-warning">Encore en perte à la fin de la simulation.</p>}
      </article>)}
    </div>
    {mode === 'dca' && <p className="ic-hint">Même versement mensuel, mais durées et sommes totales versées différentes. Les capitaux finaux ne mesurent donc pas seulement l’effet de la date de départ.</p>}
    <p className="ic-method-note">Les dates sont des repères fixes autour de la crise, pas les sommets ou creux exacts de cet actif. Un mois est compté en perte lorsque le capital est inférieur aux versements cumulés à sa clôture. Les pertes entre deux clôtures ne sont pas mesurées. {crisisMethodNote(asset)} {asset.sourceCredit}</p>
    <p className="ic-disclaimer">Les performances passées ne préjugent pas des performances futures. Pas un conseil financier.</p>
    <WorkspaceActions><Button type="button" onClick={onCopy}>{copied === 'done' ? '✓ Copié' : copied === 'error' ? 'Copie impossible' : '𝕏 Copier le texte du post'}</Button><Button type="button" variant="secondary" onClick={saveImage}>Télécharger une image</Button></WorkspaceActions>
    {imageError && <p role="alert">{imageError}</p>}
  </div>
}
