import snapshot from './automated-broker-tariffs.json' with { type: 'json' }
const number = value => value.toLocaleString('fr-FR', {maximumFractionDigits: 2}).replace(/\u202f/g, ' ')
export const BROKER_TARIFFS = snapshot.brokers
export const BROKER_PROFILE_FIELDS = ['dca','pea','pme','jeune','ifu','cash','boursomarkets'];
export function brokerProfile(id, observations = snapshot.brokers) { return observations[id]?.profile ?? {}; }
export function applyBrokerProfile(broker, observations = snapshot.brokers) {
  const profile = brokerProfile(broker.id, observations);
  const result = {...broker, post:{...broker.post}, pea:{...broker.pea}};
  for (const key of ['dca','ifu','garde','boursomarkets']) {
    const o = profile[key]; if (!o) continue;
    const text=o.copy.full;
    const resume=o.available === null ? 'À vérifier' : key==='dca' ? (o.available ? 'Oui · sous conditions' : 'Non actuellement sur PEA') : key==='ifu' ? (o.available ? 'Oui · selon les opérations' : 'Non') : text;
    result[key]={resume, detail:text};
    result.post[key]=[text];
  }
  for (const key of ['pea','pme','jeune']) if (profile[key]) result.pea[key]=profile[key].available;
  if (profile.cash) {
    const o=profile.cash;
    result.cash={resume:o.available === null ? 'À vérifier' : o.available ? 'Oui' : 'Non',detail:o.copy.full,post:o.copy.full};
  }
  return result;
}
export function brokerTariffCopy(id, observations = snapshot.brokers) {
  const o = observations[id]
  if (!o) return null
  if (id === 'tr' && o.fields?.directPrice) {
    const v = o.fields.directPrice.values;
    return {resume:`${number(o.values.minimum)} € ponctuel / ${number(v.fee)} € Direct Price`,
      detail:'Barème des transactions ponctuelles ; tarifs des plans distincts',
      full:`${number(o.values.minimum)} € de règlement externe par transaction ponctuelle hors plans d’épargne ; ${number(v.fee)} € avec Direct Price. Spread, conversion et coûts tiers possibles. Les plafonds légaux PEA s’appliquent.`};
  }
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
  return Object.fromEntries(Object.entries(observations[id]?.fields ?? {}).flatMap(([key,o]) => {
    if (o.start && o.start > today) return [];
    if (o.until && o.until < today) return o.after ? [[key,o.after]] : [];
    return [[key,o.copy.full]];
  }));
}
export function brokerOffers(id, today, observations = snapshot.brokers) {
  const copies = brokerFieldCopies(id, observations, today);
  return Object.entries(copies).filter(([key]) => key.startsWith('offer')).map(([,full]) => full);
}
