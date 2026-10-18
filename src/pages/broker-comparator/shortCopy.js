import { BROKER_TARIFFS, brokerFieldCopies, brokerProfile, brokerOffers } from '../../data/broker-tariffs.js';

const n = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 4 }).replaceAll('\u202f', ' ');
const yes = value => value ? '✅' : '❌';
const date = value => value.split('-').reverse().join('/');

// Unknown answers stay in the evidence panel, never become negative answers.
export function brokerShortCopy(id, observations = BROKER_TARIFFS, today) {
  const o = observations[id], v = o.values, p = brokerProfile(id, observations, today);
  const f = brokerFieldCopies(id, observations, today);
  const values = field => o.fields?.[field]?.values;
  const copy = {};
  switch (id) {
    case 'tr':
      copy.frais = `${n(v.minimum)} €/ordre ponctuel${f.directPrice ? ` ; ${n(values('directPrice').fee)} € avec Direct Price` : ''}, plafonné à 0,5 % sur PEA en ligne.`;
      copy.faible = 'Les PEA contenant des titres non cotés ne sont pas acceptés au transfert.';
      copy.verdict = p.dca?.available === true ? 'Pour les achats programmés sur PEA sans frais d’exécution.' : `Pour des ordres ponctuels à ${n(v.minimum)} €, dans la limite du plafond PEA.`;
      break;
    case 'bourso':
      copy.frais = `Découverte, actions Euronext : ${n(v.minimum)} € jusqu’à ${n(v.threshold)} €, puis ${n(v.rate)} % ; plafond PEA en ligne : 0,5 %.`;
      copy.faible = 'Le plan automatique utilise des fonds avec leurs propres frais de gestion.';
      if (f.minimumOrder) copy.faible += ` ${f.minimumOrder}`;
      copy.verdict = `Pour réunir banque et PEA${p.pme?.available === true ? ', avec accès au PEA-PME' : ''}, au même endroit.`;
      break;
    case 'fortuneo':
      copy.frais = `Starter, Euronext/Equiduct : ${n(v.freeFee)} € le premier ordre du mois ≤ ${n(v.threshold)} €, puis ${n(v.rate)} %.`;
      copy.faible = 'Le tarif Starter présenté ici ne s’applique pas aux autres places boursières.';
      copy.verdict = `Pour un premier ordre mensuel jusqu’à ${n(v.threshold)} € sans courtage avec Starter.`;
      break;
    case 'ibkr':
      copy.frais = `Actions France : dégressif ${n(v.rate)} %, min. ${n(v.minimum)} € + frais de Bourse ; fixe ${n(v.fixedRate)} %, min. ${n(v.fixedMinimum)} € ; routage direct ${n(v.directRate)} %, min. ${n(v.directMinimum)} €. Plafond PEA en ligne : 0,5 %.`;
      copy.faible = 'Le tarif dépend de la Bourse et du routage choisi ; des frais tiers s’ajoutent au dégressif.';
      copy.verdict = 'Pour accéder à de nombreuses Bourses européennes et choisir ton mode de tarification.';
      break;
    case 'xtb':
      copy.frais = `0 % jusqu’à ${n(v.threshold)} € de transactions/mois cumulées sur tes comptes, puis ${n(v.rate)} %.`;
      copy.faible = values('entrant')?.available === 0 ? 'Le transfert entrant de ton PEA existant n’est pas encore disponible.' : 'La commission de change s’ajoute pour les titres dans une autre devise.';
      copy.verdict = `Pour investir sans courtage sous ${n(v.threshold)} € de transactions mensuelles.`;
      break;
    case 'caidf':
      copy.frais = `Île-de-France, Initial : ${n(v.initial)} % ; Integral : ${n(v.small)} % jusqu’à ${n(v.threshold)} €, ${n(v.middle)} % jusqu’à ${n(v.upperThreshold)} €, puis ${n(v.large)} %. Integral : ${n(v.annual)} €/an sous ${n(v.orders)} ordres, gratuit dès ${n(v.orders)} ordres ou à ${v.ageStart}–${v.ageEnd} ans.`;
      copy.faible = `Hors exemptions, les droits de garde s’ajoutent ; Integral coûte ${n(v.annual)} €/an sous ${n(v.orders)} ordres, sauf à ${v.ageStart}–${v.ageEnd} ans.`;
      copy.verdict = 'Pour garder un conseiller en agence, avec le barème Île-de-France.';
      break;
    case 'bd':
      copy.frais = o.copy.full;
      copy.faible = 'Des frais de conservation s’appliquent sur les Bourses étrangères.';
      copy.verdict = 'Pour des ordres ponctuels sur Euronext avec un tarif par palier.';
      break;
    case 'saxo':
      copy.frais = `${n(v.rate)} % sur Euronext (Classic), minimum ${n(v.minimum)} €, plafonné à 0,5 % sur PEA en ligne.`;
      copy.faible = p.dca?.available === false ? 'Le DCA automatique est indisponible sur PEA.' : 'Le minimum de courtage pèse sur les petits ordres, dans la limite du plafond PEA.';
      copy.verdict = `Pour le courtage à partir de ${n(v.minimum)} €${p.pme?.available === true ? ' et l’accès au PEA-PME' : ''}.`;
      break;
  }
  if (p.dca?.available != null) {
    copy.dca = p.dca.available ? `✅ ${p.dca.copy.full}` : '❌ Sur PEA.';
    if (id === 'tr' && p.dca.available) copy.dca = '✅ PEA — plans programmés sans frais d’exécution sur les titres éligibles.';
    if (id === 'bd' && p.dca.available) copy.dca = '✅ PEA & CTO — ETF de la sélection sans courtage ; actions au tarif habituel.';
    if (id === 'saxo' && p.dca.programmed) copy.dca += ` ✅ PEPS hors PEA — ETF et fonds, mensuel, ${n(p.dca.programmed.purchaseFee)} € de courtage à l’achat ; ventes payantes, change éventuel.`;
    if (id === 'ibkr' && p.dca.available === false) copy.dca += ' Hors PEA : investissements récurrents sous conditions.';
  }
  if (p.ifu?.available != null) copy.ifu = `${yes(p.ifu.available)} ${p.ifu.available ? 'Oui' : 'Non'}${id === 'tr' ? ' pour l’offre française après migration' : ''}.`;
  copy.enveloppes = ['pea', 'pme', 'jeune'].filter(key => p[key]?.available != null)
    .map(key => `${{pea:'PEA',pme:'PEA-PME',jeune:'PEA Jeune'}[key]} ${yes(p[key].available)}`).join(' / ');
  if (['confirmé','corroboré'].includes(p.garde?.status) && p.garde.available != null) copy.garde = p.garde.copy.full;
  else if (!p.garde && f.garde) copy.garde = f.garde;
  // A proved PEA exclusion says nothing about the availability on CTO.
  const officialCash = o.profile?.cash;
  if (/Espèces du PEA non rémunérées|espèces du PEA exclues|PEA exclu/i.test(officialCash?.copy.full ?? '')) {
    copy.cash = '❌ Sur PEA.';
    if (id === 'tr') copy.cash += ' Hors PEA : intérêts après activation, sous conditions.';
    if (id === 'saxo') copy.cash += ' Hors PEA : clients VIP uniquement, sous conditions.';
    if (id === 'ibkr') copy.cash = p.cash.copy.full.replace('Espèces du PEA non rémunérées.', '❌ Sur PEA.');
  } else if (['confirmé','corroboré'].includes(p.cash?.status) && p.cash.available === false) copy.cash = '❌ Non.';
  else if (id === 'xtb' && p.cash?.available === true) copy.cash = `❌ Sur PEA. ${p.cash.copy.full}`;
  if (id === 'ibkr' && p.cash?.available === true && !copy.cash) copy.cash = `Compte général : ${p.cash.copy.full.split(' Portée PEA')[0]}`;
  copy.entrant = p.entrant?.status === 'confirmé' ? p.entrant.copy.full : f.entrant;
  if (id === 'saxo' && /expirée/.test(copy.entrant ?? '')) copy.entrant = '✅ Transfert entrant possible.';
  const transfer = values('entrant');
  if (id === 'saxo' && f.entrant && o.fields.entrant.until && (today ?? new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris'}).format(new Date())) <= o.fields.entrant.until) {
    copy.entrant = `✅ Transfert total : frais remboursés jusqu’à ${n(transfer.maximum)} €, sous conditions, jusqu’au ${date(o.fields.entrant.until)}.`;
  }
  if (id === 'ibkr' && p.entrant?.status === 'confirmé') copy.entrant = '✅ Transfert entrant possible ; IBKR annonce 0 € de frais de transfert. Frais du courtier de départ distincts.';
  if (id === 'bd' && p.entrant?.status === 'confirmé') copy.entrant = p.entrant.copy.full;
  if (id === 'fortuneo' && transfer && f.entrant) copy.entrant = `✅ Premier transfert : jusqu’à ${n(transfer.small)} € remboursés si encours < ${n(transfer.lower)} €, ${n(transfer.middle)} € sous ${n(transfer.high)} €, ${n(transfer.maximum)} € dès ${n(transfer.high)} €, sous conditions.`;
  if (id === 'bourso' && transfer && f.entrant) copy.entrant = `✅ Premier transfert total : frais remboursés au double, jusqu’à ${n(transfer.maximum)} € et dans la limite de la valeur du compte, sous conditions.`;
  if (id === 'tr' && values('entrant')?.available === 1) copy.entrant = '✅ Transfert entrant possible, sauf titres non cotés.';
  if (id === 'caidf' && values('entrant')?.available === 1) copy.entrant = '✅ Transfert entrant possible, antériorité fiscale conservée.';
  copy.sortant = id === 'tr' ? undefined : f.sortant;
  if (f.change && !p.change && id !== 'ibkr') copy.change = f.change;
  else if (p.change?.status === 'confirmé' && p.change.available != null) copy.change = p.change.copy.full;
  if (id === 'tr' && p.change?.conversion?.incomeToEuro && p.change.conversion.marginByCurrency) copy.change = 'Revenus en devises : conversion en euros au cours Trade Republic, avec marge selon la devise.';
  if (id === 'caidf' && p.change?.conversion?.account === 'CTO' && p.change.conversion.toEuro) copy.change = p.change.conversion.feesConditional
    ? 'CTO : conversion en euros au taux de la caisse Île-de-France au moment de l’opération ; frais éventuels.'
    : 'CTO : conversion en euros au cours de la caisse Île-de-France, avec frais et commissions associés.';
  // Generic IBKR FX pricing is not attributed to the PEA.
  if (id === 'ibkr' && values('change')) {
    const fx = values('change');
    copy.change = `${p.change?.conversion?.automaticOnPea ? 'PEA : conversion automatique pour les titres dans une autre devise. ' : ''}Compte général : conversion automatique généralement ${n(fx.automaticRate)} % ; manuelle ${n(fx.manualRate)} %, min. ${n(fx.minimumUsd)} USD.`;
  }
  copy.offres = brokerOffers(id, today, observations).map(full => {
    const offer = Object.values(o.fields).find(field => field.copy.full === full);
    const until = offer.until ? ` Jusqu’au ${date(offer.until)}.` : '';
    if (offer === o.fields.offerPea) return `0 € sur ${n(offer.values.count)} actions européennes, achat et vente, pour les nouveaux PEA ouverts ou transférés éligibles ; change éventuel.${until}`;
    if (id === 'saxo' && offer === o.fields.offerAmundi) return `ETF Amundi de la sélection : 0 € à l’achat ; vente payante, comptes de même nature détenus dans les ${n(offer.values.priorAccountMonths)} derniers mois exclus, transfert des positions bloqué ${n(offer.values.transferLockMonths)} mois.${until}`;
    return full + until;
  });
  if (p.boursomarkets?.status === 'confirmé' && p.boursomarkets.available) copy.offres.unshift('BoursoMarkets : ETF Amundi éligibles à l’offre, 0 € de courtage à l’achat ; vente au tarif applicable.');
  return copy;
}
