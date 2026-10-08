import { BROKER_EVIDENCE } from './evidence.js';
import { BROKER_EDITORIAL } from './editorial.js';

export function buildBrokerTweet(brokers) {
  if (brokers.length !== 2 || brokers.some(b => !b)) return '';
  const copy = b => BROKER_EDITORIAL[b.id];
  const name = b => copy(b).nom ?? b.nom;
  const pair = (label, describe) => `${label}\n\n${brokers.map(b => `${name(b)} : ${describe(b)}`).join('\n\n')}`;
  const common = (label, describe, shared) => describe(brokers[0]) === describe(brokers[1])
    ? `${label}\n\n${shared(describe(brokers[0]))}`
    : pair(label, describe);
  const envelope = (field, label) => {
    const answer = b => b.pea[field] == null ? 'À confirmer' : `${b.pea[field] ? '✅' : '❌'}${BROKER_EVIDENCE[b.id][field].status === 'corroboré' ? ' selon les analyses consultées' : ''}`;
    const [a, b] = brokers.map(answer);
    return `${label} : ${a === b && brokers[0].pea[field] != null ? `${brokers[0].pea[field] ? 'les deux' : 'aucun des deux'} ${a}` : brokers.map(x => `${name(x)} ${answer(x)}`).join(' · ')}`;
  };
  const activeOffers = brokers.filter(b => copy(b).offres?.length);
  const offers = activeOffers.length
    ? `🎁 Les offres${activeOffers.length === 1 ? ` ${name(activeOffers[0])}` : ''}\n\n${activeOffers.map(b => [activeOffers.length === 2 && `${name(b)} :`, copy(b).offreDate, ...copy(b).offres.map(offer => `→ ${offer}`)].filter(Boolean).join('\n')).join('\n\n')}`
    : '';
  const [a, b] = brokers;
  const outgoing = copy(a).sortant && copy(a).sortant === copy(b).sortant
    ? `Pour quitter l’un ou l’autre : ${copy(a).sortant}`
    : brokers.filter(x => copy(x).sortant).map(x => `Pour quitter ${name(x)} : ${copy(x).sortant}`).join('\n\n');
  const cash = common('💵 Liquidités rémunérées', x => copy(x).cash, text => `${text}`);
  // Aucune gratuité de sortie inventée si le registre ne donne pas de tarif (Trade Republic).
  const transfers = ['🔄 Transfert du PEA', brokers.map(x => `Vers ${name(x)} : ${copy(x).entrant}`).join('\n\n'), outgoing, ...brokers.map(x => copy(x).restriction)].filter(Boolean).join('\n\n');
  return [
    `${a.emoji} ${name(a)} ou ${b.emoji} ${name(b)} pour ton PEA ?`,
    `${activeOffers.length ? 'Frais, offres, transferts' : 'Frais et transferts'} : on compare les deux courtiers 👇`,
    pair('💰 Frais de courtage PEA', x => copy(x).frais),
    pair('💱 Si une conversion est nécessaire', x => BROKER_EVIDENCE[x.id].change.post),
    offers,
    pair('📅 Achats automatiques sur PEA', x => copy(x).dca),
    common('🗂️ Frais de garde', x => copy(x).garde, text => text),
    `🌱 Enveloppes proposées\n\n${['pea', 'pme', 'jeune'].map((f, i) => envelope(f, ['PEA', 'PEA-PME', 'PEA Jeune'][i])).join('\n')}`,
    common('🧾 IFU',x => copy(x).ifu ?? BROKER_EVIDENCE[x.id].ifu.summary,text => text),
    cash,
    transfers,
    pair('⚠️ Le point faible à retenir', x => copy(x).faible),
    '💬 Tu es chez quel courtier, et qu’est-ce qui a fait la différence dans ton choix ?',
    '⚠️ Pas un conseil financier',
    brokers.some(x => x.id === 'xtb') && '🤝 Par souci de transparence : je suis affilié à XTB, mais ce comparatif est réalisé de ma propre initiative, sans rémunération pour cette publication ni lien affilié.',
  ].filter(Boolean).join('\n\n');
}
