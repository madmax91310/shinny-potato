import { REVIEWED_EXPOSURE_COPY } from '../../data/etf-presentation-copy.js'
import { completePresentation } from './presentationDetails.js'

export function getPresentationCopy(etf) {
  if (etf.presentationCompleted) return etf
  if (!Object.hasOwn(REVIEWED_EXPOSURE_COPY, etf.id)) throw new Error(`Rédaction de présentation à qualifier : ${etf.id}`)
  return completePresentation({ ...etf, ...REVIEWED_EXPOSURE_COPY[etf.id] })
}

export function presentationTicker(etf) {
  return etf.listing?.ticker ?? ''
}
