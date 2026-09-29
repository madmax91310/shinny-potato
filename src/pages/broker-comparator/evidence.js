// Registre éditorial : PDF officiels et pages publiées par les courtiers.
// Dans les PDF, la première page porte le numéro 1.
// « Non établi » ne signifie jamais « non proposé ».
export const OFFICIAL_SOURCES = {
  trInterest: { title: 'Trade Republic · Intérêts sur espèces', edition: 'page en ligne', checked: '29/09/2026', url: 'https://traderepublic.com/fr-fr/interets', kind: 'page' },
  xtbInterest: { title: 'XTB · Intérêts sur fonds non investis', edition: 'taux variables', checked: '29/09/2026', url: 'https://www.xtb.com/fr/interets', kind: 'page' },
  saxoInterest: { title: 'Saxo · Intérêts sur les espèces', edition: 'page en ligne', checked: '29/09/2026', url: 'https://www.home.saxo/fr-fr/campaigns/interest-rates-cal', kind: 'page' },
  ibkrPea: { title: 'Interactive Brokers · PEA France', edition: 'page en ligne', checked: '29/09/2026', url: 'https://www.interactivebrokers.ie/fr/accounts/plan-depargne-en-action-accounts.php', kind: 'page' },
  ibkrFees: { title: 'Interactive Brokers · Commissions Europe', edition: 'page en ligne', checked: '29/09/2026', url: 'https://www.interactivebrokers.ie/fr/pricing/commissions-stocks-europe.php', kind: 'page' },
  ibkrInterest: { title: 'Interactive Brokers · Intérêts sur espèces', edition: 'taux variables', checked: '29/09/2026', url: 'https://www.interactivebrokers.ie/fr/index.php?f=47097', kind: 'page' },
  fortuneoContract: { title: 'Fortuneo · Conditions générales', edition: '01/09/2025', checked: '29/09/2026', url: 'https://www.fortuneo.fr/datas/files/fortuneo_cg.pdf' },
  bdPea: { title: 'Bourse Direct · Fonctionnement du PEA', edition: 'page en ligne', checked: '29/09/2026', url: 'https://epargne.boursedirect.fr/epargne/placements-epargne/compte-titres-dont-pea-et-pea-pme/le-pea-plan-d-epargne-en-actions', kind: 'page' },
  boursoMarkets: { title: 'BoursoBank · BoursoMarkets', edition: 'page en ligne', checked: '29/09/2026', url: 'https://www.boursobank.com/bourse/boursomarkets-courtage-bourse-gratuit', kind: 'page' },
  caInvest: { title: 'Crédit Agricole · Invest Store', edition: 'page nationale ; tarifs régionaux distincts', checked: '29/09/2026', url: 'https://www.credit-agricole.fr/particulier/epargne/bourse/service-de-bourse-en-ligne-invest-store.html', kind: 'page' },
  trContract: {
    title: 'Trade Republic · Contrat client France', edition: '09/2026', checked: '29/09/2026',
    url: 'https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf',
  },
  boursoTariff: {
    title: 'BoursoBank · Brochure tarifaire 2026', edition: '2026', checked: '29/09/2026',
    url: 'https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf',
  },
  fortuneoTariff: {
    title: 'Fortuneo · Conditions tarifaires', edition: '09/02/2026', checked: '29/09/2026',
    url: 'https://www.fortuneo.fr/files/fortuneo-tarifs-09022026.pdf',
  },
  xtbTariff: {
    title: 'XTB · Table des frais et commissions', edition: '05/2026', checked: '29/09/2026',
    url: 'https://www.xtb.com/fr/fichiers/table-des-frais-et-commissions_052026.pdf',
  },
  xtbContract: {
    title: 'XTB · Règlement des services de courtage', edition: '15/09/2023', checked: '29/09/2026',
    url: 'https://xtb.com/fr/Reglement_Portant_Sur_La_Prestation_De_Services_De_Courtage-15092023.pdf',
  },
  xtbOverview: {
    title: 'XTB · Présentation de l’offre', edition: '2026', checked: '29/09/2026',
    url: 'https://xas-new-cdn.xtb.com/file/0104/53/271ced41-db62-499b-9e83-f3b4557f9bf1/fr-meet-xtb-one-pager-2026-docx.pdf',
  },
  caTariff: {
    title: 'Crédit Agricole Île-de-France · Tarifs particuliers', edition: '01/04/2026', checked: '29/09/2026',
    url: 'https://ca-paris.credit-agricole.fr/tarif/2026/CADIF_tarif2026_PART/conditions_tarifaires_particuliers_caidf_04_2026.pdf',
    availability: 'Lien officiel indisponible (404) lors du contrôle',
  },
  bdTariff: {
    title: 'Bourse Direct · Conditions tarifaires', edition: '06/01/2026', checked: '29/09/2026',
    url: 'https://www.boursedirect.fr/pdf/tarifs_bd.pdf',
  },
  bdPlans: {
    title: 'Bourse Direct · Communiqué sur les plans programmés', edition: '11/05/2026', checked: '29/09/2026',
    url: 'https://groupe.boursedirect.fr/download/bourse-direct-lance-ses-plans-dinvestissement-programmes-sans-frais-sur-etf-a-partir-de-quelques-euros-disponibles-sur-pea-et-compte-titres?filename=2026_BD_CP_Plan-Investissement.pdf',
  },
  saxoTariff: {
    title: 'Saxo Banque · Brochure tarifaire', edition: '05/05/2026', checked: '29/09/2026',
    url: 'https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/brochure-tarifaire-generale-2026.pdf?revision=2996f32d-c87a-4efc-9596-658f98c61848',
  },
  saxoContract: {
    title: 'Saxo Banque · Conditions générales', edition: '09/04/2026', checked: '29/09/2026',
    url: 'https://www.home.saxo/-/media/documents/regional/fr-fr/manuals/conditions-generales-applicables-a-partir-du-9-avril-2026.pdf?revision=3add9d56-0ee9-43ff-8c6b-b25897ebbfe8',
  },
}

const proved = (summary, document, page) => ({ status: 'confirmé', summary, refs: [{ document, ...(page ? { page } : {}) }] })
const unknown = (summary, checked = []) => ({ status: 'non établi', summary, checked })

// Une entrée par champ affiché et par enveloppe pour le cash. Les restrictions font partie
// de la preuve : un tarif CTO ne prouve pas la rémunération des espèces du PEA.
export const BROKER_EVIDENCE = {
  tr: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: unknown('Barème PEA actuel absent des PDF consultés.', ['trContract']),
    dca: proved('Plans programmés prévus ; tarifs et liste des titres renvoyés à l’application.', 'trContract', 91),
    garde: unknown('Frais de garde actuels à confirmer par barème.', ['trContract']),
    pea: proved('PEA prévu par les conditions France.', 'trContract', 189),
    pme: unknown('Offre PEA-PME non établie.', ['trContract']),
    jeune: proved('PEA ouvert sous conditions aux jeunes rattachés au foyer fiscal.', 'trContract', 190),
    ifu: proved('IFU lié à la migration vers l’offre française.', 'trContract', 3),
    cashCto: { status: 'partiel', summary: 'Offre 3 % jusqu’à 50 000 € pour les nouveaux clients après activation ; traitement exact des espèces CTO à confirmer.', refs: [{ document: 'trContract', page: 57 }, { document: 'trInterest' }] },
    cashPea: proved('Aucun intérêt transféré sur le solde espèces du PEA.', 'trContract', 190),
    transfert: proved('Transfert entrant du PEA prévu par le contrat.', 'trContract', 189),
  },
  bourso: {
    boursomarkets: proved('ETF iShares éligibles : 0 € à l’achat ; vente non annoncée gratuite. Éligibilité à contrôler par titre.', 'boursoMarkets'),
    frais: proved('Découverte : 1,99 € jusqu’à 500 €, puis 0,60 % ; plafond PEA à 0,5 %.', 'boursoTariff', 20),
    dca: proved('Plan d’épargne : négociation gratuite, minimum 10 € par fonds et frais de gestion selon DIC.', 'boursoTariff', 20),
    garde: proved('Droits de garde gratuits dans le barème indiqué.', 'boursoTariff', 23),
    pea: proved('Tarifs PEA prévus.', 'boursoTariff', 20),
    pme: proved('Tarifs PEA-PME prévus.', 'boursoTariff', 20),
    jeune: proved('Tarifs PEA 18-25 ans prévus.', 'boursoTariff', 20),
    ifu: unknown('Émission de l’IFU non documentée par la brochure consultée.', ['boursoTariff']),
    cashCto: unknown('Rémunération du solde espèces CTO non documentée.', ['boursoTariff']),
    cashPea: unknown('Rémunération du solde espèces PEA non documentée.', ['boursoTariff']),
    transfert: proved('Transfert PEA sortant : 15 € par ligne, plafond 150 €.', 'boursoTariff', 25),
  },
  ibkr: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: { status: 'partiel', summary: 'PEA : courtage à partir de 0,05 % ; minimum par ordre selon le marché et le routage.', refs: [{ document: 'ibkrPea' }, { document: 'ibkrFees' }] },
    dca: unknown('Périmètre PEA et CTO non établi par PDF officiel.'),
    garde: proved('Aucun droit de garde ni frais de tenue de compte PEA annoncés.', 'ibkrPea'),
    pea: proved('PEA Classique commercialisé.', 'ibkrPea'),
    pme: unknown('PEA-PME non annoncé sur la page PEA consultée.', ['ibkrPea']),
    jeune: unknown('PEA Jeune non annoncé sur la page PEA consultée.', ['ibkrPea']),
    ifu: proved('IFU disponible pour le PEA.', 'ibkrPea'),
    cashCto: { status: 'partiel', summary: 'Intérêts sur espèces éligibles : 0 % jusqu’à 10 000 € en EUR, taux variable au-delà et lié à la valeur du compte ; application au CTO précis à confirmer.', refs: [{ document: 'ibkrInterest' }] },
    cashPea: unknown('La page d’intérêts générale ne confirme pas le traitement du PEA.', ['ibkrInterest', 'ibkrPea']),
    transfert: proved('Transfert du PEA possible, sans frais de transfert annoncés.', 'ibkrPea'),
  },
  fortuneo: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: proved('Starter : premier ordre mensuel ≤ 500 € gratuit sur Euronext/Equiduct, puis 0,35 %.', 'fortuneoTariff', 10),
    dca: unknown('Absence de plan automatique non démontrée par la brochure.', ['fortuneoTariff']),
    garde: proved('Droits de garde gratuits.', 'fortuneoTariff', 10),
    pea: proved('Tarifs PEA prévus.', 'fortuneoTariff', 10),
    pme: proved('Tarifs PEA-PME prévus.', 'fortuneoTariff', 10),
    jeune: proved('PEA Jeune non commercialisé selon les conditions générales.', 'fortuneoContract', 35),
    ifu: unknown('IFU non établi par la brochure consultée.', ['fortuneoTariff']),
    cashCto: unknown('Rémunération du solde espèces CTO non établie.', ['fortuneoTariff']),
    cashPea: proved('Compte espèces PEA et PEA-PME non rémunéré.', 'fortuneoContract', 35),
    transfert: proved('Transfert PEA sortant 15 € par ligne, plafond 150 € ; clôture distincte à 85 €.', 'fortuneoTariff', 13),
  },
  xtb: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: proved('0 % avant 100 000 € de volume mensuel ; 0,20 % ensuite ; minimum 10 € non appliqué au PEA.', 'xtbTariff', 4),
    dca: unknown('Disponibilité du DCA sur PEA non établie par les PDF consultés.', ['xtbOverview']),
    garde: proved('0,02 % annuel sur la part du portefeuille au-delà de 250 000 €.', 'xtbTariff', 6),
    pea: proved('Tarif applicable au PEA mentionné.', 'xtbTariff', 4),
    pme: unknown('PEA-PME non établi par les PDF consultés.', ['xtbTariff']),
    jeune: unknown('PEA Jeune non établi par les PDF consultés.', ['xtbTariff']),
    ifu: unknown('IFU non établi par les PDF consultés.', ['xtbTariff']),
    cashCto: { status: 'partiel', summary: 'Intérêts sur fonds non investis du compte de trading, sans minimum ni maximum ; taux préférentiel 90 jours jusqu’à 100 000 €, puis standard. Taux variable chaque semaine ; rattachement au CTO à confirmer.', refs: [{ document: 'xtbOverview', page: 2 }, { document: 'xtbInterest' }] },
    cashPea: unknown('Le PDF ne permet pas d’affirmer que les espèces PEA perçoivent des intérêts.', ['xtbTariff', 'xtbContract']),
    transfert: unknown('Transfert entrant PEA non établi ; tarif du transfert sortant documenté p. 6.', ['xtbTariff']),
  },
  caidf: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: unknown('Page nationale Invest Store consultée ; barème Île-de-France 2026 indisponible (404).', ['caTariff', 'caInvest']),
    dca: unknown('Fonction DCA non établie par PDF accessible.', ['caTariff']),
    garde: unknown('Offre Intégral nationale annonce une exonération, sans confirmer le tarif Île-de-France.', ['caTariff', 'caInvest']),
    pea: proved('PEA proposé par Invest Store ; tarifs régionaux à vérifier.', 'caInvest'),
    pme: proved('PEA-PME mentionné par Invest Store ; tarifs régionaux à vérifier.', 'caInvest'),
    jeune: unknown('Offre PEA Jeune non vérifiée dans un PDF accessible.', ['caTariff']),
    ifu: unknown('IFU non vérifié dans un PDF accessible.', ['caTariff']),
    cashCto: unknown('Rémunération des espèces CTO non vérifiée.', ['caTariff']),
    cashPea: unknown('Rémunération des espèces PEA non vérifiée.', ['caTariff']),
    transfert: unknown('Frais de transfert non vérifiés dans un PDF accessible.', ['caTariff']),
  },
  bd: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: proved('PEA ≤ 198 € : 0,5 % ; puis paliers à partir de 0,99 €.', 'bdTariff', 2),
    dca: proved('Plans automatiques PEA et CTO ; ETF éligibles sans courtage, actions aux frais habituels.', 'bdPlans', 1),
    garde: proved('0 € hors bourses étrangères ; 0,036 % annuel sur bourses étrangères.', 'bdTariff', 2),
    pea: proved('PEA prévu dans le barème.', 'bdTariff', 2),
    pme: proved('PEA-PME prévu dans le barème.', 'bdTariff', 2),
    jeune: proved('PEA Jeunes prévu dans le barème.', 'bdTariff', 2),
    ifu: unknown('IFU non établi par la brochure consultée.', ['bdTariff']),
    cashCto: unknown('Absence de rémunération des espèces CTO non démontrée.', ['bdTariff']),
    cashPea: proved('Compte espèces PEA non rémunéré selon la page officielle.', 'bdPea'),
    transfert: proved('Transfert PEA sortant 15 € par ligne, plafond 150 € ; remboursement entrant à vérifier.', 'bdTariff', 4),
  },
  saxo: {
    boursomarkets: unknown('Offre BoursoMarkets non applicable ; comparaison PDF non établie.'),
    frais: proved('Classic Euronext : 0,08 % avec minimum de 2 €.', 'saxoTariff', 5),
    dca: unknown('Accès PEA et frais du programme PEPS non établis par PDF.', ['saxoTariff']),
    garde: proved('0 € sur titres cotés ; exception pour non cotés en PEA.', 'saxoTariff', 3),
    pea: proved('PEA couvert par le barème.', 'saxoTariff', 16),
    pme: proved('PEA-PME couvert par le barème.', 'saxoTariff', 16),
    jeune: unknown('Absence de PEA Jeune non établie par PDF.', ['saxoTariff']),
    ifu: proved('IFU en ligne gratuit dans la brochure.', 'saxoTariff', 3),
    cashCto: { status: 'partiel', summary: 'Intérêts possibles en EUR/USD sur solde disponible ; niveau de compte et montant conditionnent le taux, non confirmé par le simulateur dynamique.', refs: [{ document: 'saxoContract', page: 24 }, { document: 'saxoInterest' }] },
    cashPea: proved('Comptes PEA explicitement exclus de l’offre d’intérêts.', 'saxoInterest'),
    transfert: proved('Transfert PEA/PEA-PME sortant à 15 € par ligne, plafond 150 €.', 'saxoTariff', 16),
  },
}

export const EVIDENCE_FIELDS = [
  ['frais', 'Ordres PEA'], ['boursomarkets', 'BoursoMarkets'], ['dca', 'Investissement programmé'], ['garde', 'Frais de garde'],
  ['pea', 'PEA'], ['pme', 'PEA-PME'], ['jeune', 'PEA Jeune'], ['ifu', 'IFU'],
  ['cashCto', 'Espèces CTO'], ['cashPea', 'Espèces PEA'], ['transfert', 'Transfert PEA'],
]
