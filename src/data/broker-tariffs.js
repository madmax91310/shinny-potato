import snapshot from './automated-broker-tariffs.json' with { type: 'json' }
import reviewed from './reviewed-broker-profiles.json' with { type: 'json' }
const number = value => value.toLocaleString('fr-FR', {maximumFractionDigits: 2}).replace(/\u202f/g, ' ')
export const BROKER_TARIFFS = snapshot.brokers
export const BROKER_PROFILE_FIELDS = ['dca','pea','pme','jeune','ifu','cash','boursomarkets'];
export function brokerProfile(id, observations = snapshot.brokers, today = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris'}).format(new Date())) {
  const profile = {...observations[id]?.profile};
  for (const [key, claim] of Object.entries(reviewed.claims[id] ?? {})) {
    // A current explicit issuer answer wins. Expired external reviews never
    // turn an unknown official answer into a permanent negative.
    if (profile[key]?.available != null || profile[key]?.status === 'confirmé' || claim.checkedAt > today || claim.reviewUntil < today) continue;
    const refs = claim.sources.map(document => ({document:`reviewed_${document}`,sourceUrl:reviewed.sources[document].url,kind:'secondary-page',title:reviewed.sources[document].title,asOf:reviewed.sources[document].asOf}));
    profile[key] = {available:claim.available,status:claim.status,checkedAt:claim.checkedAt,reviewUntil:claim.reviewUntil,
      asOf:null,sourceUrl:refs[0].sourceUrl,refs,checkedSources:refs,copy:{full:claim.text},scope:`${id} ; ${key} ; recoupement externe manuel`,
      method:'Deux sources externes relues ; cette corroboration ne constitue pas une confirmation contractuelle du courtier.',reviewed:true};
  }
  return profile;
}
export function applyBrokerProfile(broker, observations = snapshot.brokers) {
  const profile = brokerProfile(broker.id, observations);
  const result = {...broker, post:{...broker.post}, pea:{...broker.pea}};
  const minimumOrder = observations[broker.id]?.fields?.minimumOrder;
  if (minimumOrder) {
    result.pointFaible = `Frais des fonds du plan automatique en supplément. ${minimumOrder.copy.full}`;
    result.post.faibles = [result.pointFaible];
  }
  for (const key of ['dca','ifu','garde','boursomarkets']) {
    const o = profile[key]; if (!o) continue;
    const text=o.copy.full;
    const resume=o.available === null ? 'À vérifier' : key==='dca' ? (o.available ? 'Oui · sous conditions' : 'Non actuellement sur PEA') : key==='ifu' ? (o.available ? 'Oui · selon les opérations' : 'Non') : text;
    result[key]={resume:resume+(o.status === 'corroboré' ? '*' : ''), detail:text};
    result.post[key]=[text];
  }
  for (const key of ['pea','pme','jeune']) if (profile[key]) result.pea[key]=profile[key].available;
  if (profile.cash) {
    const o=profile.cash;
    result.cash={resume:o.available === null ? 'À vérifier' : o.available ? 'Non sur PEA · hors PEA sous conditions' : o.status === 'corroboré' ? 'Non*' : 'Non',detail:o.copy.full,post:o.copy.full};
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
