import snapshot from './automated-broker-tariffs.json' with { type: 'json' }
const number = value => value.toLocaleString('fr-FR', {maximumFractionDigits: 2}).replace(/\u202f/g, ' ')
export const BROKER_TARIFFS = snapshot.brokers
export function brokerTariffCopy(id, observations = snapshot.brokers) {
  const o = observations[id]
  if (!o) return null
  if (o.copy) return o.copy
  const v = o.values
  return id === 'bourso' ? {
    resume: `${number(v.minimum)} € puis ${number(v.rate)} %`,
    detail: `Découverte · actions Euronext · seuil ${number(v.threshold)} €`,
    full: `Découverte, actions Euronext Paris, Amsterdam et Bruxelles : ${number(v.minimum)} € jusqu’à ${number(v.threshold)} €, puis ${number(v.rate)} %. Les plafonds légaux PEA s’appliquent aux ordres en ligne ; autres marchés et produits : tarifs distincts.`,
  } : {
    resume: `${number(v.freeFee)} € le 1er ordre/mois`,
    detail: `Starter · Euronext/Equiduct · ≤${number(v.threshold)} €, puis ${number(v.rate)} %`,
    full: `Starter sur Euronext Paris, Bruxelles, Amsterdam ou Equiduct : ${number(v.freeFee)} € le premier ordre du mois si son montant est inférieur ou égal à ${number(v.threshold)} €, puis ${number(v.rate)} % par ordre. Anciens tarifs possibles pour les clients qui les conservent.`,
  }
}

export function brokerFieldCopies(id, observations = snapshot.brokers, today = new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Paris'}).format(new Date())) {
  return Object.fromEntries(Object.entries(observations[id]?.fields ?? {}).filter(([,o]) => !o.until || ((!o.start || o.start <= today) && o.until >= today)).map(([key,o]) => [key,o.copy.full]));
}
export function brokerOffers(id, today, observations = snapshot.brokers) {
  const copies = brokerFieldCopies(id, observations, today);
  return Object.entries(copies).filter(([key]) => key.startsWith('offer')).map(([,full]) => full);
}
