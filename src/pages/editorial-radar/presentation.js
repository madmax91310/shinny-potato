import { frenchCharacteristic } from '../../data/french-characteristics.js'
import { factualTitle, readableInvestorFiling } from '../../lib/radar-editorial.js'
export function readableSignal(event) {
  event = readableInvestorFiling(event)
  const title = factualTitle(event).replace(/(poids du (?:pays|secteur) )(.+?)(,| en mouvement)/i, (_,prefix,label,end) => prefix+frenchCharacteristic(label)+end)
  const composition = /poids du (pays|secteur) (.+?) en mouvement/i.exec(title)
  const angle = composition
    ? `${composition[1]==='pays'?'La place de ce pays':'Le poids de ce secteur'} passe de ${event.beforeText} à ${event.afterText}. Qu’est-ce que cela change dans l’exposition de cet ETF ? Une variation de poids ne prouve pas un achat ou une vente.`
    : event.angle
  return { ...event, title, angle }
}
export function signalPriority(event) {
  if (/frais|tarif|éligib|eligib|fermeture|suspend/i.test(event.title+' '+event.reason)) return 0
  if (event.family==='pouvoir-achat' || event.family==='investisseurs') return 1
  if (/composition|poids du/i.test(event.title)) return 2
  return 3
}

const radarDay = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeZone: 'Europe/Paris' })
const radarInstant = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })
export function formatRadarDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Non documenté'
  const instant = new Date(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (instant.toISOString().slice(0,10) !== value) return 'Non documenté'
    return `${radarDay.format(instant)} (heure non documentée)`
  }
  return radarInstant.format(instant)
}
