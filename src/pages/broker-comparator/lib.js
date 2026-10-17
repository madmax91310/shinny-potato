import { brokerShortCopy } from './shortCopy.js';
import { BROKER_TARIFFS } from '../../data/broker-tariffs.js';

export function buildBrokerTweet(brokers, observations, today) {
  if (brokers.length !== 2 || brokers.some(b => !b)) return '';
  const copies = new Map(brokers.map(b => [b.id, brokerShortCopy(b.id, observations, today)]));
  const copy = b => copies.get(b.id);
  const pair = (label, describe) => {
    const lines = brokers.flatMap(b => { const text = describe(b); return text ? [`${b.emoji} ${b.nom} → ${text}`] : []; });
    return lines.length ? `${label}\n\n${lines.join('\n')}` : '';
  };
  const [a, b] = brokers;
  return [
    `${a.emoji} ${a.nom} 🆚 ${b.emoji} ${b.nom}`,
    `Lequel choisir pour ton PEA en ${(today ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())).slice(0, 4)} ?\nOn décortique les deux 👇`,
    pair('💰 FRAIS DE COURTAGE PEA', x => copy(x).frais),
    pair('🎁 OFFRES', x => copy(x).offres.join(' ')),
    pair('💱 FRAIS DE CHANGE', x => copy(x).change),
    pair('📈 DCA AUTOMATIQUE', x => copy(x).dca),
    pair('🛡️ FRAIS DE GARDE', x => copy(x).garde),
    pair('🏦 ENVELOPPES', x => copy(x).enveloppes),
    pair('📄 IFU', x => copy(x).ifu),
    pair('💶 LIQUIDITÉS RÉMUNÉRÉES', x => copy(x).cash),
    pair('🔄 TRANSFERT DU PEA', x => [copy(x).entrant, copy(x).sortant && `Sortie : ${copy(x).sortant}`].filter(Boolean).join(' ')),
    pair('⚠️ POINTS FAIBLES', x => copy(x).faible),
    pair('🎯 VERDICT', x => copy(x).verdict),
    '💬 Tu choisirais lequel pour ton PEA ?',
    brokers.some(x => x.id === 'xtb') && '🤝 Je suis affilié à XTB. Ce comparatif est réalisé de ma propre initiative, sans rémunération pour ce post ni lien affilié.',
  ].filter(Boolean).join('\n\n');
}

// The card shows the dates of the tariff observations it is built from, never the day it is generated:
// latest control date and latest official grid date among the selected brokers.
export function tariffDates(ids, observations = BROKER_TARIFFS) {
  const rows = ids.map(id => observations[id]).filter(Boolean);
  const latest = key => rows.map(row => row[key]).filter(Boolean).sort().at(-1) ?? null;
  return { checkedAt: latest('checkedAt'), asOf: latest('asOf') };
}
