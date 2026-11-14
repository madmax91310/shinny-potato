// Editorial scope for the partially documented fields. This does not upgrade
// their evidence status: the missing terms remain excluded from publication.
export const PARTIAL_PUBLICATION_SCOPE = {
  tr: {
    garde: { published: 'Aucune réponse publiée tant que les droits de garde PEA restent non établis.', excluded: 'Tarif des droits de garde PEA ; gratuité du CTO non transposable.' },
    change: { published: 'Conversion des revenus en euros, avec marge selon la devise.', excluded: 'Taux ou commission propres au PEA.' },
    transfert: { published: 'Disponibilité du transfert entrant et restrictions documentées.', excluded: 'Tarif de sortie du PEA et remboursement des frais entrants.' },
  },
  ibkr: {
    change: { published: 'Conversion automatique sur PEA ; tarifs du compte général explicitement séparés.', excluded: 'Application au PEA du tarif général de 0,03 %.' },
  },
  bourso: {
    cash: { published: 'Espèces du PEA non rémunérées.', excluded: 'Présence ou absence de rémunération sur CTO.' },
  },
  fortuneo: {
    cash: { published: 'Espèces du PEA non rémunérées.', excluded: 'Présence ou absence de rémunération sur CTO.' },
  },
  bd: {
    cash: { published: 'Espèces du PEA non rémunérées.', excluded: 'Présence ou absence de rémunération sur CTO.' },
  },
  caidf: {
    change: { published: 'Conversion sur CTO au cours de la caisse Île-de-France.', excluded: 'Tarif chiffré du change boursier et application au PEA.' },
    cash: { published: 'Espèces du PEA non rémunérées.', excluded: 'Présence ou absence de rémunération sur CTO.' },
    transfert: { published: 'Transfert entrant possible avec conservation de l’antériorité fiscale ; tarif sortant documenté.', excluded: 'Frais entrants et remboursement éventuel.' },
  },
}
