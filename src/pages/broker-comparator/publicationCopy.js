// Reformule la copie collectée pour le tweet, sans modifier les données ni les
// réserves du registre. Une nouvelle formulation non reconnue reste inchangée.
const REPHRASINGS = [
  ['Frais PEA et remboursement éventuel non qualifiés par cette clause.', 'Ce passage du contrat ne précise ni les frais du transfert ni leur éventuel remboursement.'],
  ['la gratuité du CTO ne les qualifie pas.', 'la gratuité annoncée pour le CTO ne permet pas de conclure pour le PEA.'],
  ['gratuité du CTO distincte.', 'la gratuité annoncée pour le CTO ne permet pas de conclure pour le PEA.'],
  ['taux ou commission PEA non chiffrés dans cette page.', 'cette page ne précise pas le taux ni la commission pour le PEA.'],
  ['disponibilité non confirmée par les sources officielles du service.', 'les documents officiels consultés ne permettent pas de confirmer que ce service est disponible.'],
  ['Portée PEA non confirmée.', 'Ces documents ne permettent pas de confirmer que le PEA est concerné.'],
  ['rémunération du cash CTO non confirmée par les documents publics.', 'les documents publics consultés ne confirment pas la rémunération des espèces sur CTO.'],
  ['Change boursier : tarif non confirmé dans le barème régional ; commission bancaire générale exclue.', 'Le barème régional consulté ne précise pas le tarif du change pour les opérations en Bourse. Le tarif bancaire général ne permet pas de le déduire.'],
  ['IFU fourni selon les opérations à déclarer ; modalités dans la source officielle.', 'Le courtier fournit un IFU selon les opérations à déclarer. Les modalités sont précisées dans ses documents officiels.'],
  ['IFU pour l’offre française après migration ; anciens comptes étrangers distincts.', 'IFU prévu pour l’offre française après migration du compte. Les anciens comptes étrangers ont des règles distinctes.'],
  ['frais des fonds selon DIC.', 'Les frais propres aux fonds s’ajoutent : ils figurent dans leur document d’informations clés (DIC).'],
  ['vérifier leur DIC.', 'regarde leur document d’informations clés (DIC).'],
  ['Vérifier la pastille de l’ISIN ;', 'Vérifie que la pastille de l’offre apparaît pour l’ISIN choisi ;'],
  ['Les frais du courtier de départ restent distincts.', 'Ton courtier de départ peut toutefois facturer ses propres frais.'],
  ['Les commissions de change restent dues.', 'Les commissions de change restent à payer.'],
  ['Fonds libres éligibles hors PEA : taux variable ; préférentiel pendant', 'Sur les espèces éligibles hors PEA : taux variable, avec un taux préférentiel pendant'],
  ['Espèces éligibles EUR/USD des clients VIP, taux variable selon le solde ; PEA exclu.', 'Réservé aux clients VIP, sur leurs espèces éligibles en EUR/USD. Le taux dépend du solde ; le PEA est exclu.'],
  ['Justificatif à envoyer dans les 3 mois ; compte toujours ouvert au remboursement.', 'Envoie le justificatif dans les 3 mois et garde le compte ouvert jusqu’au remboursement.'],
  ['Justificatif dans les 3 mois suivant l’ouverture.', 'Envoie le justificatif dans les 3 mois suivant l’ouverture.'],
  ['Dossier finalisé avant l’échéance ; justificatif dans le mois suivant le débit, remboursement sous 30 jours après réception.', 'Finalise le dossier avant l’échéance et envoie le justificatif dans le mois suivant le débit. Le remboursement intervient sous 30 jours après réception.'],
  ['Sous conditions : comptes de même nature sur les 12 derniers mois exclus ; transfert des positions concernées bloqué six mois.', 'Sous conditions : les comptes de même nature sur les 12 derniers mois sont exclus. Le transfert des positions concernées est bloqué six mois.'],
  ['Autres places : barèmes distincts, sous le plafond légal PEA.', 'Les autres places ont leurs propres tarifs, dans la limite du plafond légal PEA.'],
  ['autres marchés et produits : tarifs distincts.', 'les autres marchés et produits ont leurs propres tarifs.'],
  ['Spread, conversion et coûts tiers possibles.', 'Des frais de conversion, un écart entre les prix d’achat et de vente (spread) et des coûts tiers peuvent s’ajouter.'],
  ['frais des produits et spread possibles.', 'Les frais des produits et un écart entre les prix d’achat et de vente (spread) peuvent s’ajouter.'],
];

export function brokerPublicationCopy(text) {
  return REPHRASINGS.reduce((copy, [before, after]) => copy.replaceAll(before, after), text);
}

export function brokerWeakPoint(copy) {
  if (copy.faible === copy.dca && copy.dca.includes('❌')) return 'Si tu veux automatiser tes achats sur PEA, ce service n’est pas disponible dans l’offre présentée ci-dessus.';
  if (copy.faible.startsWith('Les droits de garde hors Integral s’ajoutent au courtage.')) {
    return 'Regarde les conditions d’exonération des droits de garde détaillées ci-dessus : sinon, ces frais s’ajoutent au courtage.';
  }
  return brokerPublicationCopy(copy.faible);
}
