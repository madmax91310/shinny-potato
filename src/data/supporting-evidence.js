import { MARKET_HISTORY_REVIEW } from './market-history-review.js';
import { ARCHIVE_SOURCE_REVIEW } from './archive-source-review.js';
// Sources, périodes et limites individuelles ; aucune date déduite de la consultation.
export const SUPPORTING_EVIDENCE = {
  "lexicon:pea": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F2385",
      "https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : premier versement, délai de cinq ans et taux historiques ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F2385\n  // https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0"
  },
  "lexicon:cto": {
    "sourceUrls": [
      "https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : PFU et imposition du gain réalisé ; confiance élevée.\n  // https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee"
  },
  "lexicon:assurance-vie": {
    "sourceUrls": [
      "https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Fiscalité des rachats, abattement annuel et taux sociaux des contrats ordinaires ; confiance élevée.\n  // https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0"
  },
  "lexicon:per": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F34982"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Déduction et sortie en capital selon les versements ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F34982"
  },
  "lexicon:livret-a": {
    "sourceUrls": [
      "https://www.banque-france.fr/fr/a-votre-service/particuliers/connaitre-pratiques-bancaires-assurance/epargne/livret-a"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : taux réglementé au 01/08/2026 ; confiance élevée.\n  // https://www.banque-france.fr/fr/a-votre-service/particuliers/connaitre-pratiques-bancaires-assurance/epargne/livret-a"
  },
  "lexicon:ldds": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F2368"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Plafond, disponibilité, exonération et taux lié au Livret A ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F2368"
  },
  "lexicon:pee-perco": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F2142"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Plafonds, blocage, taux historiques et anciens Perco ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F2142"
  },
  "lexicon:etf": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Réplication, risque de swap et frais observés en 2025 ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
  },
  "lexicon:action": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/actions/investir-en-actions-cotees-en-bourse"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Droits de vote, dividende et risque de perte ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/actions/investir-en-actions-cotees-en-bourse"
  },
  "lexicon:obligation": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/comprendre-les-obligations-avant-dinvestir"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Coupons, risque de défaut et sensibilité aux taux ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/actions-obligations/obligations/comprendre-les-obligations-avant-dinvestir"
  },
  "lexicon:fcp": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/ce-quil-faut-savoir-sur-les-placements-collectifs-fonds-et-sicav"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Gestion collective active ou indicielle, valeur liquidative et frais ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/ce-quil-faut-savoir-sur-les-placements-collectifs-fonds-et-sicav"
  },
  "lexicon:scpi": {
    "sourceUrls": [
      "https://www.aspim.fr/scpi-en-chiffres/"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : taux moyen 2025/2024 auprès de l'ASPIM ; confiance élevée.\n  // https://www.aspim.fr/scpi-en-chiffres/"
  },
  "lexicon:opci": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/opci-siic-les-autres-produits-de-la-pierre-papier"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Planchers de 60 % immobilier et 5 % liquidités, risques ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/opci-siic-les-autres-produits-de-la-pierre-papier"
  },
  "lexicon:trackers": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Sens du terme tracker, réplication et distinction ETF actif ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
  },
  "lexicon:dca": {
    "sourceUrls": [
      "https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Versements échelonnés et coût du capital non investi ; confiance élevée.\n  // https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf"
  },
  "lexicon:effet-levier": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/effet-de-levier"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Multiplication des gains et pertes, protections selon le produit ; confiance élevée.\n  // https://www.amf-france.org/fr/effet-de-levier"
  },
  "lexicon:diversification": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/conseils-pratiques/diversifier-ses-placements"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Réduction du risque spécifique par répartition des placements ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/conseils-pratiques/diversifier-ses-placements"
  },
  "lexicon:reequilibrage": {
    "sourceUrls": [
      "https://investor.vanguard.com/investor-resources-education/portfolio-management/rebalancing-your-portfolio"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Retour à la cible par versements ou arbitrages et impact fiscal ; confiance élevée.\n  // https://investor.vanguard.com/investor-resources-education/portfolio-management/rebalancing-your-portfolio"
  },
  "lexicon:dca-vs-lumpsum": {
    "sourceUrls": [
      "https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Étude historique Vanguard, deux tiers des périodes et limites ; confiance élevée.\n  // https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf"
  },
  "lexicon:vente-a-decouvert": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/vente-decouvert"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Vente et rachat de titres empruntés, asymétrie des pertes ; confiance élevée.\n  // https://www.amf-france.org/fr/vente-decouvert"
  },
  "lexicon:dividende": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/le-mediateur-de-lamf/journal-de-bord-du-mediateur/dossiers-du-mois/quelle-date-sapprecie-la-qualite-dactionnaire-permettant-de-beneficier-du-droit-au-dividende-qui-y"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Détachement du cours et fiscalité des dividendes selon enveloppe ; confiance élevée.\n  // https://www.amf-france.org/fr/le-mediateur-de-lamf/journal-de-bord-du-mediateur/dossiers-du-mois/quelle-date-sapprecie-la-qualite-dactionnaire-permettant-de-beneficier-du-droit-au-dividende-qui-y"
  },
  "lexicon:reinvestissement-dividendes": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Différence capitalisation/distribution ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/placements-collectifs/trackers-etf"
  },
  "lexicon:blockchain": {
    "sourceUrls": [
      "https://developer.bitcoin.org/devguide/block_chain.html"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Chaînage des blocs et preuve de travail Bitcoin ; généralisation aux autres réseaux nuancée, confiance moyenne.\n  // https://developer.bitcoin.org/devguide/block_chain.html"
  },
  "lexicon:stablecoin": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/crypto-actif-ou-crypto-monnaie"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Parité visée et risque des réserves et du rachat ; confiance élevée sur la définition, moyenne sur les exemples.\n  // https://www.amf-france.org/fr/crypto-actif-ou-crypto-monnaie"
  },
  "lexicon:cold-hot-wallet": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/crypto-actifs-bitcoin-etc/investir-en-crypto-actifs-les-precautions-pratiques"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Clés connectées/hors ligne et risques de garde ; prix matériels indicatif, confiance moyenne.\n  // https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/crypto-actifs-bitcoin-etc/investir-en-crypto-actifs-les-precautions-pratiques"
  },
  "lexicon:rendement-locatif": {
    "sourceUrls": [
      "https://www.anil.org/outil-mise-en-location-simulation-investissement-immobilier-rendement/"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Calcul brut, charges et fiscalité selon type de location ; confiance élevée.\n  // https://www.anil.org/outil-mise-en-location-simulation-investissement-immobilier-rendement/"
  },
  "lexicon:effet-levier-immo": {
    "sourceUrls": [
      "https://www.anil.org/votre-besoin/gerer-un-bien/bailleur/investissement-locatif/"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Dette, apport et flux locatifs ; exemple pédagogique hors frais, confiance moyenne.\n  // https://www.anil.org/votre-besoin/gerer-un-bien/bailleur/investissement-locatif/"
  },
  "lexicon:lmnp": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F10864"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : règles de plus-value et exceptions aux amortissements ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F10864"
  },
  "lexicon:drawdown": {
    "sourceUrls": [
      "https://www.msci.com/documents/10199/54361618-43c2-878f-eeaa-0b237a13ce6d"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Baisse du sommet au creux et calcul illustratif ; confiance élevée.\n  // https://www.msci.com/documents/10199/54361618-43c2-878f-eeaa-0b237a13ce6d"
  },
  "lexicon:volatilite": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/volatilite-des-placements-ce-quil-faut-savoir-0"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Dispersion des rendements et absence de garantie de perte maximale ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/volatilite-des-placements-ce-quil-faut-savoir-0"
  },
  "lexicon:ratio-sharpe": {
    "sourceUrls": [
      "https://www.amf-france.org/sites/institutionnel/files/contenu_simple/rapport_annuel/rapport_annuel_amf/Rapport%20annuel%20AMF%202008%20-%20Chapitre%208%20-%20L%27AMF%20et%20les%20professionnels.pdf"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Excédent de rendement sur taux sans risque rapporté à la volatilité ; confiance élevée.\n  // https://www.amf-france.org/sites/institutionnel/files/contenu_simple/rapport_annuel/rapport_annuel_amf/Rapport%20annuel%20AMF%202008%20-%20Chapitre%208%20-%20L%27AMF%20et%20les%20professionnels.pdf"
  },
  "lexicon:ter": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/les-frais-des-placements-financiers/comprendre-les-frais-des-placements-financiers"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Frais courants intégrés au fonds, exemple arithmétique ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/les-frais-des-placements-financiers/comprendre-les-frais-des-placements-financiers"
  },
  "lexicon:capitalisation-boursiere": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/capitalisation-boursiere"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Cours multiplié par actions en circulation ; confiance élevée.\n  // https://www.amf-france.org/fr/capitalisation-boursiere"
  },
  "lexicon:indice-boursier": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/comprendre-les-marches-financiers/les-marches-dactions-et-les-principaux-indices-en-france"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Composition et pondération des indices actions ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/comprendre-les-marches-financiers/les-marches-dactions-et-les-principaux-indices-en-france"
  },
  "lexicon:rendement-vs-performance": {
    "sourceUrls": [
      "https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Revenus distribués et variation de valeur, exemple arithmétique ; confiance élevée.\n  // https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/cadrer-son-projet/rendement-et-risque-des-placements-en-actions-0"
  },
  "lexicon:inflation": {
    "sourceUrls": [
      "https://www.insee.fr/fr/metadonnees/definition/c1557"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Définition IPC et rendement réel, exemple arithmétique ; confiance élevée.\n  // https://www.insee.fr/fr/metadonnees/definition/c1557"
  },
  "lexicon:taux-interet": {
    "sourceUrls": [
      "https://data.ecb.europa.eu/methodology/what-are-interest-rates"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Prix du crédit, taux nominaux et variables ; confiance élevée.\n  // https://data.ecb.europa.eu/methodology/what-are-interest-rates"
  },
  "lexicon:taux-sans-risque": {
    "sourceUrls": [
      "https://www.ecb.europa.eu/stats/euro-short-term-rates/interest_rate_benchmarks/WG_euro_risk-free_rates/html/index.en.html"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Référence €STR de la BCE à court terme et limite des obligations ; confiance élevée.\n  // https://www.ecb.europa.eu/stats/euro-short-term-rates/interest_rate_benchmarks/WG_euro_risk-free_rates/html/index.en.html"
  },
  "lexicon:flat-tax": {
    "sourceUrls": [
      "https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : taux général du PFU sur cessions mobilières ; confiance élevée.\n  // https://www.impots.gouv.fr/particulier/questions/jai-realise-une-plus-value-mobiliere-comment-est-elle-imposee"
  },
  "lexicon:abattement-pea": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F2385"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : date du premier versement et exonération après cinq ans ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F2385"
  },
  "lexicon:prelevements-sociaux": {
    "sourceUrls": [
      "https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0",
      "https://www.service-public.fr/particuliers/vosdroits/F10864"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : taux général, assurance-vie, taux historiques PEA et plus-value immobilière ; confiance élevée.\n  // https://www.impots.gouv.fr/particulier/lassurance-vie-et-le-pea-0\n  // https://www.service-public.fr/particuliers/vosdroits/F10864"
  },
  "lexicon:plus-value-imposable": {
    "sourceUrls": [
      "https://bofip.impots.gouv.fr/bofip/3648-PGP.html/identifiant=BOI-RPPM-PVBMI-20-10-20-10-20191220"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Prix de cession, prix moyen pondéré et frais d’acquisition ; confiance élevée.\n  // https://bofip.impots.gouv.fr/bofip/3648-PGP.html/identifiant=BOI-RPPM-PVBMI-20-10-20-10-20191220"
  },
  "lexicon:plus-value-immobiliere": {
    "sourceUrls": [
      "https://www.service-public.fr/particuliers/vosdroits/F10864"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : taux et abattements de durée, résidence principale ; confiance élevée.\n  // https://www.service-public.fr/particuliers/vosdroits/F10864"
  },
  "lexicon:halving": {
    "sourceUrls": [
      "https://bitcoin.org/fr/vocabulaire"
    ],
    "asOf": null,
    "checkedAt": "2026-09-25",
    "note": "  // Vérifié le 25/09/2026 : Règle des 210 000 blocs et réduction des émissions, prix non prévisible ; confiance élevée.\n  // https://bitcoin.org/fr/vocabulaire"
  },
  "history:bitcoin": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?period1=1420070400&period2=1788307200&interval=1mo"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "    // Source consultée : https://finance.yahoo.com/quote/BTC-USD/history/\n    // Source : export Yahoo Finance (BTC-USD), prix d'ouverture mensuel réel, août 2026.\n    // Les 140 points ont été recoupés le 29/09/2026 avec le relevé Yahoo figé dans\n    // scripts/source-snapshots/calculator-yahoo-2026-09-29.json. Voir audit:calculator-series.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Export Yahoo Finance archivé et comparé point par point ; colonne open"
  },
  "history:ethereum": {
    "sourceUrls": [],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : clôtures annuelles réelles ETH-USD (CoinMarketCap / recoupement presse : CoinDesk déc. 2016,\n    // WhiteBIT), puis prix quotidiens réels (Fortune \"current price of Ethereum\") pour 2026.\n    // Point 2016-12 : fourchette de sources 7,27-8,07 $, retenu 7,98 $ (confiance moyenne).\n    // Point 2019-12 : recoupement indirect (confiance moyenne). Tous les autres points ci-dessous sont\n    // directement sourcés.\n    // Point 2026-08 mis à jour le 05/09/2026 (recherche demandée pour combler les points manquants) :\n    // remplacé 2371,03 $ (~21/08/2026) par 2453,23 $, la vraie clôture du 31/08/2026 — même source\n    // (Fortune, \"Current price of Ethereum for Aug. 31, 2026\") que le reste de la série 2026, donc\n    // aucun changement de méthode. Dernier point réel : 31/08/2026.\nLimite de provenance : URL de l’article exact / capture d’origine non récupérée. Le nom du fournisseur et la période ne constituent pas une preuve point par point ; cette exception reste explicitement ouverte.",
    "periodStart": "2016-12",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:cac40": {
    "sourceUrls": [
      "https://www.zonebourse.com/actualite-bourse/aout-s-acheve-dans-le-rouge-pour-le-cac-40-et-l-europe-ce7858ddd98df424"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : clôtures annuelles réelles de l'indice CAC 40 (MacroTrends, \"CAC 40 Index (1990-2025)\"),\n    // recoupées avec la presse (CNBC \"European markets on December 31\") pour 2024-2025, puis niveaux\n    // réels de presse pour 2026 (janvier, avril : moyenne sur futures mi-mars/mi-avril).\n    // Point 2026-08 mis à jour le 05/09/2026 (recherche demandée pour combler les points manquants) :\n    // remplacé 8650 (un pic intrajournalier de mi-août, pas une clôture) par 8 334,50, la vraie\n    // clôture du 31/08/2026 (Boursorama, \"Août s'achève dans le rouge pour le CAC 40 et l'Europe\" —\n    // baisse de 0,79 % ce jour-là) — cohérent avec la convention \"clôtures réelles\" du reste de la\n    // série, contrairement au point précédent qui était un record intrajournalier. Dernier point\n    // réel : 31/08/2026.\nSource complémentaire retrouvée le 30/09/2026 pour le dernier point d’août ; elle ne certifie pas toute la série historique.",
    "periodStart": "2015-12",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:stoxx600": {
    "sourceUrls": [
      "https://www.stoxx.com/index-details?symbol=SXXR"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : indice STOXX Europe 600 (rendement total, base 10 000 au 31/12/1986), export CSV mensuel\n    // réel fourni par l'utilisateur. Série complète et fiable de janvier 2015 à juillet 2026 (dernier\n    // point disponible dans l'export).\n    // CORRECTIF du 29/08/2026 : le détail annuel de Tweet Midi (Performance depuis) a révélé des\n    // rendements annuels imprécis par rapport aux vrais rendements connus de l'indice — import CSV\n    // d'origine approximatif. Point de DÉCEMBRE de chaque année 2016-2025 recalculé à partir du\n    // rendement annuel réel vérifié (2016-2024 : iShares STOXX Europe 600 UCITS ETF \"EXSA\", réplication\n    // physique, recoupé avec une recherche directe sur l'indice — écarts trouvés très faibles, <1,3%,\n    // l'import d'origine était déjà proche pour cet indice ; 2025 : +20,66%, confirmé par deux sources\n    // indépendantes convergentes — le bulletin mensuel STOXX de décembre 2025 et l'ETF Invesco STOXX\n    // Europe 600, après qu'une première recherche avait renvoyé un chiffre contradictoire de 35,31%\n    // visiblement confondu avec l'indice \"MSCI Europe 600\", différent du STOXX Europe 600), composé à\n    // partir du point de décembre 2015 existant (non modifié, sert d'ancrage). Seuls les points de\n    // décembre ont été recalculés ; les mois intermédiaires de chaque année restent tels quels (non\n    // re-vérifiés individuellement), d'où un éventuel écart ponctuel entre novembre et décembre d'une\n    // même année, et entre décembre 2025 (corrigé) et janvier 2026 (non corrigé) — limitation assumée,\n    // aucune valeur mensuelle inventée.\n    // Point 2026-08 ajouté le 05/09/2026 (recherche demandée, retentée avec des requêtes plus précises\n    // après un premier échec) : même méthode que les corrections de décembre ci-dessus — pas de niveau\n    // \"STOXX Europe 600 rebasé\" public à chercher (c'est une reconstruction interne), donc calculé en\n    // appliquant le rendement total RÉEL du mois au point de juillet. Rendement retenu : +0,49 %, à\n    // partir du STOXX Europe 600 EUR Net Return Index (STOXXR), 1 654,78 au 31/07/2026 -> 1 662,91 au\n    // 31/08/2026, cohérent avec le retour sur 1 mois publié par l'ETF iShares STOXX Europe 600 (DE)\n    // UCITS (EXSA) sur la même période (+0,59 %) — 2 sources indépendantes convergentes. 224 956 x\n    // 1,0049 = 226 061.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique composite ; points de décembre et derniers mois reconstruits à partir de rendements officiels, autres mois non recertifiés"
  },
  "history:sp500": {
    "sourceUrls": [
      "https://www.spglobal.com/spdji/en/commentary/article/us-equities-market-attributes/"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : indice S&P 500 (rendement total, base 10 000 au 29/02/1992), export CSV mensuel réel\n    // fourni par l'utilisateur. Série complète et fiable de janvier 2015 à juillet 2026 (dernier point\n    // disponible dans l'export).\n    // CORRECTIF du 29/08/2026 : le détail annuel de Tweet Midi (Performance depuis) a révélé des\n    // rendements annuels erronés par rapport aux vrais rendements connus de l'indice (ex. 2017 donnait\n    // +7,1% au lieu de +21,8% réel) — import CSV d'origine imprécis. Point de DÉCEMBRE de chaque année\n    // 2016-2025 recalculé à partir du rendement annuel total réel vérifié (sources multiples\n    // convergentes : Motley Fool, dqydj, FT Portfolios — 2016:+11,96%, 2017:+21,83%, 2018:-4,38%,\n    // 2019:+31,49%, 2020:+18,40%, 2021:+28,71%, 2022:-18,11%, 2023:+26,29%, 2024:+25,02%, 2025:+17,88%),\n    // 2025 corrigé le 23/09/2026 d'après S&P DJI (+17,88 %, ancienne valeur +17,44 %) :\n    // https://www.spglobal.com/spdji/en/commentary/article/us-equities-market-attributes/\n    // Composé à partir du point de décembre 2015 existant (non modifié, sert d'ancrage). Seuls les\n    // points de décembre ont été recalculés ; les mois intermédiaires de chaque année restent tels\n    // quels (non re-vérifiés individuellement), d'où un éventuel écart ponctuel entre novembre et\n    // décembre d'une même année, et entre décembre 2025 (corrigé) et janvier 2026 (non corrigé) —\n    // limitation assumée, aucune valeur mensuelle inventée.\n    // Point 2026-08 ajouté le 05/09/2026 (recherche demandée, retentée avec des requêtes plus précises\n    // après un premier échec) : même méthode que les corrections de décembre ci-dessus, appliquée au\n    // rendement du mois. Rendement retenu : +2,54 %, à partir de l'indice S&P 500 Total Return\n    // (^SP500TR), 16 763,42 au 31/07/2026 -> 17 189,63 au 31/08/2026 — cohérent avec la presse\n    // financière (\"le S&P 500 a gagné plus de 2 % en août, record mensuel\"), 2 sources indépendantes\n    // convergentes. 386 824 x 1,0254 = 396 659.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique composite ; points de décembre et derniers mois reconstruits à partir de rendements officiels, autres mois non recertifiés"
  },
  "history:msciWorld": {
    "sourceUrls": [
      "https://www.msci.com/documents/10199/255599/msci-world-index.pdf"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : indice MSCI World (rendement total, base 10 000 au 31/12/1969), export CSV mensuel réel\n    // fourni par l'utilisateur. Série complète et fiable de janvier 2015 à juillet 2026 (dernier point\n    // disponible dans l'export).\n    // CORRECTIF du 29/08/2026 : le détail annuel de Tweet Midi (Performance depuis) a révélé des\n    // rendements annuels erronés par rapport aux vrais rendements connus de l'indice (ex. 2020 donnait\n    // +6,1% au lieu de +16,5% réel) — import CSV d'origine imprécis. Point de DÉCEMBRE de chaque année\n    // 2016-2025 recalculé à partir du rendement annuel total réel vérifié (sources convergentes : fiches\n    // MSCI, S&P Global — 2016:+8,15%, 2017:+23,07%, 2018:-8,20%, 2019:+28,40%, 2020:+16,50%,\n    // 2021:+22,35%, 2022:-17,73%, 2023:+24,42%, 2024:+19,19%, 2025:+21,60%), composé à partir du point\n    // de décembre 2015 existant (non modifié, sert d'ancrage). Seuls les points de décembre ont été\n    // recalculés ; les mois intermédiaires de chaque année restent tels quels (non re-vérifiés\n    // individuellement), d'où un éventuel écart ponctuel entre novembre et décembre d'une même année,\n    // et entre décembre 2025 (corrigé) et janvier 2026 (non corrigé) — limitation assumée, aucune\n    // valeur mensuelle inventée.\n    // Correction du 23/09/2026 : la fiche MSCI World Index (USD), rendements bruts dividendes\n    // réinvestis au 31/08/2026, donne +13,40 % YTD et +2,60 % sur un mois. Les anciens points\n    // juillet/août ne respectaient même pas le cumul YTD officiel ; le -0,30 % venait de deux\n    // ETF non comparables à cet indice USD brut. Avec décembre 2025 à 971 159, août vaut\n    // 971 159 × 1,134 = 1 101 294 ; juillet vaut 1 101 294 / 1,026 = 1 073 386.\n    // Les autres points de 2026 restent à revérifier avant de permettre un DCA mensuel.\n    // Source primaire : https://www.msci.com/documents/10199/255599/msci-world-index.pdf",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique composite ; points de décembre et derniers mois reconstruits à partir de rendements officiels, autres mois non recertifiés"
  },
  "history:nasdaq100": {
    "sourceUrls": [
      "https://www.nasdaq.com/market-activity/index/ndx/historical"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : indice Nasdaq-100 (NDX), export CSV quotidien réel fourni par l'utilisateur le\n    // 29/08/2026 (Nasdaq.com, colonnes Date/Close/Open/High/Low), 29/08/2016 à 28/08/2026 —\n    // niveaux réels de l'indice, jamais rebasés (contrairement à sp500/msciWorld/stoxx600 : cet\n    // actif n'a donc pas besoin d'être exclu du format Anniversaire de Tweet Midi). Point mensuel\n    // retenu : clôture du dernier jour de bourse de chaque mois (même convention que\n    // apple/microsoft/broadcom/tesla/cac40), agrégé à partir des ~2 500 points quotidiens du CSV —\n    // aucune valeur mensuelle devinée, chaque point vient d'un jour de bourse réel du fichier.\n    // Recoupé avec la mémoire générale de l'indice (ex. clôture du 31/12/2020 = 12 888,28, chiffre\n    // largement documenté) : cohérent. Ajouté en réponse au blocage précédent de la roadmap\n    // (\"Nasdaq-100 non sourcé, faute de données fiables\") — débloqué par l'export fourni.",
    "periodStart": "2016-08",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique mensuel ; convention et limites décrites dans la provenance"
  },
  "history:soxx": {
    "sourceUrls": [],
    "asOf": null,
    "checkedAt": null,
    "note": "    // SÉRIE ENTIÈREMENT REMPLACÉE le 30/08/2026 : l'ancienne série annuelle (2015-2026, 12 points)\n    // était \"dérivée de rendements annuels\" plutôt que des vraies clôtures — un utilisateur a\n    // signalé un DCA anormalement faible sur SOXX, ce qui a révélé que l'échelle entière de la série\n    // dérivait dans le temps par rapport aux vraies clôtures : écart de 2,36x en 2016 à 2,59x en\n    // 2025 (jamais un facteur constant, donc pas juste un split non pris en compte — une accumulation\n    // d'erreur de reconstruction). Seul le dernier point (2026-08) était proche du réel (520,05 vs\n    // 508,62, écart 2%). Remplacée intégralement par un historique mensuel réel (clôtures, colonne\n    // \"Cours\"), capture d'écran fournie par l'utilisateur le 30/08/2026, couvrant janvier 2016 à\n    // août 2026 (128 points). Deux valeurs partiellement masquées dans les captures, retenues au\n    // mieux : 2016-12 (40,91) et 2021-06 (151,41) — confiance légèrement inférieure au reste de la\n    // série, mais cohérentes avec les points encadrants. Pas de point avant 2016-01 : l'ancien point\n    // 2015-12 (69,86 $) était sur l'ancienne échelle erronée, abandonné plutôt que reconverti sans\n    // source réelle — l'actif est donc utilisable à partir de janvier 2016 uniquement.\nLimite de provenance : URL de l’article exact / capture d’origine non récupérée. Le nom du fournisseur et la période ne constituent pas une preuve point par point ; cette exception reste explicitement ouverte.",
    "periodStart": "2016-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique mensuel ; convention et limites décrites dans la provenance"
  },
  "history:or": {
    "sourceUrls": [
      "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "Classeur mis à jour le 2026-09-02, export et comparaison point par point archivés le 2026-09-29. La date de publication du classeur n’est pas la date de valeur de chaque cours.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Banque mondiale, Pink Sheet : moyenne mensuelle des cours spot USD par once troy, pas une clôture"
  },
  "history:silver": {
    "sourceUrls": [
      "https://www.investing.com/commodities/silver-historical-data"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // REMPLACÉ le 02/09/2026 : série annuelle éparse (11 points + 3 en 2026) remplacée par une série\n    // mensuelle complète, clôtures réelles (\"Dernier\") de l'export CSV Investing.com \"Futures Argent\"\n    // (COMEX, contrat continu) fourni par l'utilisateur, janvier 2015 à août 2026. Motivation : cet\n    // actif faisait partie des 3 (avec ethereum et cac40) identifiés lors de l'audit du 01/09/2026 comme\n    // structurellement à risque du même type d'erreur que SOXX (points épars → interpolation linéaire\n    // trompeuse dans le format Anniversaire de Tweet Midi) — la série mensuelle complète résout ce\n    // problème pour cet actif.\n    // Ancrage vérifié avant remplacement : les 11 clôtures de décembre déjà en place (2015-2025,\n    // sourcées spot XAG/USD) correspondent aux nouvelles clôtures de décembre (source futures) à moins\n    // de 2,4% près chaque année — écart normal entre spot et futures continus, aucune dérive de type\n    // SOXX détectée, série d'origine confirmée globalement fiable.\n    // Seule exception : le point 2026-01 (85,17 $, source StatMuse, clôture spot du 31/01) diverge de\n    // ~7,5% de la nouvelle clôture mensuelle futures (78,83 $) — écart plus large que les autres mois,\n    // probablement lié à l'extrême volatilité de ce mois précis (pic intrajournalier réel à 121,58 $ le\n    // 29/01/2026, déjà documenté) plutôt qu'à une erreur. La nouvelle valeur est retenue pour la\n    // cohérence de méthode (une seule source, mensuelle, plutôt que mélanger spot et futures).\n    // Série de prix d'un contrat à terme continu : hors frais de roulement et sans détention réelle du métal.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique mensuel ; convention et limites décrites dans la provenance"
  },
  "history:lvmh": {
    "sourceUrls": [
      "https://live.euronext.com/fr/product/equities/fr0000121014-xpar",
      "https://www.boursorama.com/cours/historique/1rPMC"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Source : clôtures réelles de l'action LVMH (MC.PA, Euronext Paris) pour 2020-2025 et 2026\n    // (MarketScreener pour 2020-2023 ; presse spécialisée pour 2024/2025/2026). Points 2015-01 à\n    // 2019-10 : NON VÉRIFIÉS dans cette session (aucune clôture fiable retrouvée malgré plusieurs\n    // recherches) — valeurs illustratives d'origine conservées, à vérifier manuellement avant\n    // publication (cf. VERIFIED_MIN_DATE_OVERRIDES ci-dessous, qui exclut ces points des calculs).\n    // Point 2026-04 : absent (aucune clôture fiable trouvée), interpolé automatiquement par\n    // l'application entre les points réels de janvier et août 2026.\n    // Point 2026-08 mis à jour le 05/09/2026 (recherche demandée pour combler les points manquants) :\n    // remplacé 450 € (~21/08/2026) par 453,30 €, la vraie clôture du 31/08/2026 (-1,06 % ce jour-là).\n    // Dernier point réel : 31/08/2026.\nSource complémentaire retrouvée le 30/09/2026 pour le dernier point d’août ; elle ne certifie pas toute la série historique.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Historique mensuel ; convention et limites décrites dans la provenance"
  },
  "history:apple": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/AAPL?period1=1420070400&period2=1788307200&interval=1mo"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "    // Source consultée : https://www.macrotrends.net/stocks/charts/AAPL/apple/stock-price-history\n    // Extraction initiale MacroTrends (AAPL), clôtures ajustées des splits et dividendes.\n    // Août 2026 corrigé avec la clôture du 31/08 ; série complète de janvier 2015 à août 2026.\n    // Les 140 points ont été recoupés le 29/09/2026 avec le relevé Yahoo figé dans\n    // scripts/source-snapshots/calculator-yahoo-2026-09-29.json. Voir audit:calculator-series.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Export Yahoo Finance archivé et comparé point par point ; colonne adjclose"
  },
  "history:microsoft": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/MSFT?period1=1420070400&period2=1788307200&interval=1mo"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "    // Source consultée : https://www.macrotrends.net/stocks/charts/MSFT/microsoft/stock-price-history\n    // Extraction initiale MacroTrends (MSFT), clôtures ajustées des splits et dividendes.\n    // Série complète de janvier 2015 à août 2026.\n    // Les 140 points ont été recoupés le 29/09/2026 avec le relevé Yahoo figé dans\n    // scripts/source-snapshots/calculator-yahoo-2026-09-29.json. Voir audit:calculator-series.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Export Yahoo Finance archivé et comparé point par point ; colonne adjclose"
  },
  "history:broadcom": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/AVGO?period1=1420070400&period2=1788307200&interval=1mo"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "    // Source consultée : https://www.macrotrends.net/stocks/charts/AVGO/broadcom/stock-price-history\n    // Extraction initiale MacroTrends (AVGO), puis clôtures ajustées Yahoo après recoupement.\n    // Split 10:1 de juillet 2024. Série complète de janvier 2015 à août 2026 —\n    // comble tous les trous précédents (2015, 2017, 2018, 2020, 2023, 2026-01/04).\n    // Les 140 points ont été recoupés le 29/09/2026 avec le relevé Yahoo figé dans\n    // scripts/source-snapshots/calculator-yahoo-2026-09-29.json. Voir audit:calculator-series.\n    // Les clôtures ajustées historiques ont été alignées sur Yahoo : les ajustements\n    // de dividendes différaient légèrement de l’ancienne extraction MacroTrends.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Export Yahoo Finance archivé et comparé point par point ; colonne adjclose"
  },
  "history:tesla": {
    "sourceUrls": [
      "https://query2.finance.yahoo.com/v8/finance/chart/TSLA?period1=1420070400&period2=1788307200&interval=1mo"
    ],
    "asOf": null,
    "checkedAt": "2026-09-29",
    "note": "    // Source consultée : https://www.macrotrends.net/stocks/charts/TSLA/tesla/stock-price-history\n    // Extraction initiale MacroTrends (TSLA), clôtures ajustées des splits 5:1 (août 2020)\n    // et 3:1 (août 2022). Série complète de janvier 2015\n    // à août 2026.\n    // Les 140 points ont été recoupés le 29/09/2026 avec le relevé Yahoo figé dans\n    // scripts/source-snapshots/calculator-yahoo-2026-09-29.json. Voir audit:calculator-series.",
    "periodStart": "2015-01",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Export Yahoo Finance archivé et comparé point par point ; colonne adjclose"
  },
  "history:nvidia": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/NVDA/nvidia/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 08/09/2026 (audit \"densité du Calculateur\", 4 méga-caps demandées : Nvidia, Amazon,\n    // Google, Meta). Contrairement à apple/microsoft/broadcom/tesla (export CSV mensuel réel fourni\n    // par l'utilisateur), aucun CSV fourni ici — recherche web (WebSearch) seule, car WebFetch/curl\n    // vers les sites financiers est bloqué dans ce sandbox. Testé explicitement : les clôtures\n    // MENSUELLES se sont révélées instables d'une requête à l'autre sur cette source (ex. un résultat\n    // a donné \"301,16 $\" pour début 2025, contredit par 3 autres requêtes de la même session situant\n    // le titre entre 86 $ et 111 $ sur cette période — écart >150%, non exploitable). Les clôtures\n    // ANNUELLES (31 décembre), elles, convergent bien : chaque année listée ci-dessous vient d'une\n    // table MacroTrends (1re requête), puis 5 des 11 années (2018, 2020, 2023, 2024, 2025) ont été\n    // recroisées individuellement via une 2e requête indépendante (StatMuse) — écarts ≤0,5% à chaque\n    // fois, aucune contradiction. Prix split-adjusted (le split 10:1 de juin 2024 est déjà reflété\n    // sur toute la série, jamais un saut artificiel en 2024). Seul le point 2026-08 (le plus récent)\n    // reste à confiance plus faible : une seule source (Finbold, clôture du 31/08/2026 à 220,78 $),\n    // non recoupée par une 2e requête convergente (résultats obtenus trop indirects : fourchette de\n    // marché de prédiction seulement). Conséquence : actif ajouté à SPARSE_MONTHLY_DATA_IDS (DCA\n    // mensuel bloqué, versement unique uniquement), même traitement qu'ethereum/cac40 — pas de points\n    // mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:amazon": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/AMZN/amazon/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 08/09/2026, même audit que nvidia (cf. son commentaire pour le contexte général :\n    // WebSearch seule, clôtures mensuelles testées et jugées non exploitables). Clôtures ANNUELLES\n    // (31 décembre) : table MacroTrends en 1re requête, puis recroisées individuellement en 2e requête\n    // indépendante (StatMuse) pour 2018, 2022 et 2025 — écarts ≤0,1% à chaque fois (2025 : 230,82 $\n    // obtenu deux fois à l'identique). Prix split-adjusted (le split 20:1 de juin 2022 est déjà\n    // reflété sur toute la série — la \"baisse\" apparente 2021→2022 dans les chiffres bruts est un\n    // artefact du split, pas une vraie perte, cf. le commentaire équivalent pour broadcom/tesla).\n    // Point 2026-08 (le plus récent) : une seule source (TradingKey, clôture du 31/08/2026 à 259,77 $,\n    // article daté nommant explicitement cette séance) — confiance correcte mais non recoupée par une\n    // 2e requête convergente. Actif ajouté à SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement\n    // unique uniquement), même traitement qu'ethereum/cac40 — pas de points mensuels inventés entre\n    // les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:google": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/GOOGL/alphabet/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 08/09/2026, même audit que nvidia/amazon (cf. leurs commentaires pour le contexte\n    // général). Titre : Alphabet Inc. Classe A (ticker GOOGL). Clôtures ANNUELLES (31 décembre) :\n    // table MacroTrends en 1re requête (2015-2024), 2025 obtenu séparément (312,78 $, recoupé à\n    // l'identique par une 2e requête indépendante StatMuse). 2018 recoupé indirectement : une requête\n    // a renvoyé le prix PRE-split (1 051,79 $ au 31/12/2018) — divisé par 20 (split 20:1 de juillet\n    // 2022) cela donne 52,59 $, cohérent à 1% près avec le 52,06 $ de la table split-adjusted. 2022\n    // recoupé directement (87,57 $ vs 87,91 $ en table, écart 0,4%). Prix split-adjusted sur toute la\n    // série (pas de saut artificiel en 2022). Point 2026-08 (le plus récent) : deux sources trouvées\n    // mais non convergentes (335,41 $ et 339,35 $ selon l'article) — retenu 337,00 $ (milieu de\n    // fourchette). Point supprimé le 23/09/2026 : une moyenne de fourchette ne prouve pas une\n    // clôture au 31 août. Actif ajouté à SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement\n    // unique uniquement), même traitement qu'ethereum/cac40 — pas de points mensuels inventés entre\n    // les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2025-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:meta": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/META/meta-platforms/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 08/09/2026, même audit que nvidia/amazon/google (cf. leurs commentaires pour le\n    // contexte général). Meta n'a jamais splitté ses actions : aucun ajustement de split nécessaire\n    // sur toute la série, seule source d'incertitude ici est la fiabilité de chaque requête WebSearch\n    // individuelle. Clôtures ANNUELLES (31 décembre), sourcées une par une (StatMuse, requêtes\n    // ciblées par année plutôt qu'un tableau multi-années — méthode jugée plus fiable après le constat\n    // d'instabilité sur nvidia) : chaque valeur recoupée avec la variation % en glissement annuel citée\n    // dans le même résultat (ex. 2017 : \"+52,1% sur l'année\" cohérent avec 175,79 $ vs 114,15 $ en\n    // 2016 ; 2019 : \"+59,1%\" cohérent avec 203,46 $ vs 130,07 $ en 2018 ; 2024 : \"+67,3%\" cohérent avec\n    // 583,17 $ vs 351,20 $ en 2023) — validation croisée systématique plutôt qu'une 2e requête séparée\n    // par année. 2025 (660,09 $) confirmé à l'identique par 2 requêtes indépendantes. Point 2026-08\n    // (le plus récent) : aucune clôture exacte trouvée pour le 31/08/2026 malgré plusieurs requêtes —\n    // seulement un encadrement large (560,43 $ le 24/08 ; 616,77 $ au 04/09) — retenu 590,00 $ (milieu\n    // approximatif). Point supprimé le 23/09/2026 : la valeur n'est pas une clôture vérifiée.\n    // Actif ajouté à SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué,\n    // versement unique uniquement), même traitement qu'ethereum/cac40 — pas de points mensuels\n    // inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2025-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:nestle": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/NSRGY/nestle-sa/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 14/09/2026 (retour utilisateur : roster 100% méga-caps tech US, aucune action\n    // européenne ni secteur défensif — audit \"élargissement du roster\"). Nestlé (Suisse, alimentaire/\n    // consommation de base) répond aux deux manques à la fois : premier actif du roster hors zone\n    // tech ET hors marché américain d'origine.\n    // Cotation retenue : ADR NSRGY (OTC, 1 ADR = 1 action nominative Nestlé SA), pas la cotation\n    // native NESN.SW (Six Swiss Exchange, en CHF) — la donnée CHF/EUR s'est révélée impossible à\n    // sourcer de façon fiable dans ce sandbox (WebFetch bloqué sur tous les sites financiers testés,\n    // WebSearch ne renvoyant jamais de tableau exploitable pour les cotations natives européennes,\n    // contrairement aux ADR USD largement indexées via MacroTrends) — même contrainte documentée sur\n    // plusieurs tentatives ce jour-là (L'Oréal, Air Liquide, ASML, TotalEnergies, écartés pour cette\n    // même raison, cf. rapport de session). Clôtures ANNUELLES (31 décembre) via une table MacroTrends\n    // synthétisée en une seule requête — PAS recoupées par une 2e requête indépendante (les tentatives\n    // de recoupement point par point n'ont renvoyé aucune donnée exploitable ce jour-là), confiance\n    // donc plus faible que les séries megacaps US (nvidia/amazon/google/meta), mais split-clean :\n    // aucun split Nestlé depuis 2008 (confirmé), donc aucun risque de saut artificiel sur cette\n    // fenêtre 2015-2025. Point 2026-08 (99,95 $, au 24/08/2026) trouvé séparément, cohérent avec la\n    // fourchette 52 semaines citée dans la même recherche (88,47-109,59 $). Actif ajouté à\n    // SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement unique uniquement), même traitement\n    // qu'ethereum/cac40 — pas de points mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2026-08",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:sap": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/SAP/sap-se/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 14/09/2026, même audit que nestle (cf. son commentaire pour le contexte général).\n    // SAP (Allemagne, logiciel d'entreprise) — 2e actif européen du roster, diversifie la géographie\n    // (Allemagne, jamais représentée jusqu'ici) même si le secteur reste tech, contrairement à nestle.\n    // Cotation retenue : ADR SAP (NYSE), pas la cotation native SAP.DE (Xetra Francfort, en EUR) —\n    // même contrainte de sandbox que nestle (EUR non sourçable de façon fiable ce jour-là). Clôtures\n    // ANNUELLES (31 décembre) 2015-2024 via une table MacroTrends synthétisée en une seule requête,\n    // non recoupée par une 2e requête indépendante (même limite que nestle, confiance donc plus\n    // faible que les megacaps US). Split-clean : aucun split SAP depuis 2000 (confirmé), aucun risque\n    // de saut artificiel sur la fenêtre.\n    // Les points 2025-12 (296,93 $, daté en réalité du 29/05/2025) et 2026-08 (205,95 $,\n    // daté du 10/09/2026) ont été supprimés le 23/09/2026. On ne peut pas calculer une\n    // performance annuelle avec des clôtures rangées sous de mauvaises dates.\n    // Actif ajouté à SPARSE_MONTHLY_DATA_IDS\n    // (DCA mensuel bloqué, versement unique uniquement), même traitement qu'ethereum/cac40 — pas de\n    // points mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2024-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:visa": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/V/visa/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 14/09/2026 (audit \"double-outil\" : nouveaux actifs cherchés en parallèle pour ce\n    // fichier et le Générateur de portefeuilles — cf. CLAUDE.md, section duplication ; Visa n'existe\n    // que dans ce fichier, pas dans le Générateur qui est 100% ETF/fonds, aucune action individuelle).\n    // Clôtures ANNUELLES (31 décembre) via une table complète en une seule requête (MacroTrends,\n    // format \"Year Close / Annual % Change\") — recoupée une 2e fois de façon indépendante sur 2022\n    // (204,21 $ vs 204,55/204,99 $ selon la source, écart <0,4%) et 2023 (257,94 $ vs 258,37 $, écart\n    // <0,2%) : les deux requêtes convergent, confiance équivalente aux megacaps US déjà en place.\n    // Split-clean : split 4:1 en mars 2015, déjà pris en compte dans la table source (confirmé par la\n    // note \"2015 ending price adjusted for a 4 for 1 stock split\") — aucun ajustement supplémentaire\n    // nécessaire. Point 2026-08 (370,74 $, réellement daté du 13/09/2026) étiqueté par cohérence avec\n    // LATEST_YM et le reste du roster. Point supprimé le 23/09/2026 : prix de septembre\n    // rangé à tort comme clôture d'août. Actif ajouté à\n    // SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement unique uniquement), même traitement\n    // qu'ethereum/cac40 — pas de points mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2025-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:netflix": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/NFLX/netflix/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 14/09/2026, même audit \"double-outil\" que visa ci-dessus (Netflix aussi absent du\n    // Générateur de portefeuilles, qui est 100% ETF/fonds). Clôtures ANNUELLES (31 décembre) via une\n    // table complète MacroTrends. PARTICULARITÉ IMPORTANTE : Netflix a réalisé un split 10:1 le\n    // 17/11/2025 (annoncé le 30/10/2025, cf. communiqué officiel) — la table de prix brute obtenue en\n    // 1re requête (114,38 $ → 1 184,86 $ sur 2015-2025) N'ÉTAIT PAS split-adjustée pour les années\n    // récentes, ce qui aurait produit un saut artificiel incohérent avec le prix actuel (~77 $ en\n    // septembre 2026). Détecté par une 2e requête indépendante donnant 93,76 $ pour la clôture du\n    // 31/12/2025 (soit ~12x moins que 1 184,86 $) — contradiction résolue en confirmant le split 10:1\n    // via une 3e requête dédiée : la valeur pré-split (2015-2024, plus le prix intrajournalier 2025\n    // avant le 17/11) a donc été divisée par 10 pour toute la série 2015-2024, la clôture 2025\n    // (93,76 $) étant elle déjà post-split. Les rendements annuels en % obtenus séparément (55,06% en\n    // 2017, 67,11% en 2020, -51,05% en 2022, 83,07% en 2024...) confirment la cohérence de la série\n    // ainsi corrigée d'une année sur l'autre, y compris le +5,19% de 2025 (89,13 $ en réel début\n    // d'année → 93,76 $ en fin d'année post-split). Point 2026-08 (77,40 $, réellement daté du\n    // 11/09/2026) étiqueté par cohérence avec LATEST_YM et le reste du roster. Point supprimé\n    // le 23/09/2026 : prix de septembre rangé à tort comme clôture d'août. Actif ajouté à\n    // SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement unique uniquement), même traitement\n    // qu'ethereum/cac40 — pas de points mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2025-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  },
  "history:cocacola": {
    "sourceUrls": [
      "https://www.macrotrends.net/stocks/charts/KO/coca-cola/stock-price-history"
    ],
    "asOf": null,
    "checkedAt": null,
    "note": "    // Ajouté le 14/09/2026, même audit \"double-outil\" que visa/netflix ci-dessus (Coca-Cola aussi\n    // absent du Générateur de portefeuilles, 100% ETF/fonds). 3e action défensive/non-tech du roster\n    // avec Nestlé, consommation de base comme elle mais géographie différente (US natif, pas un ADR).\n    // Clôtures ANNUELLES (31 décembre) via une table complète MacroTrends en une seule requête — non\n    // recoupée point par point une 2e fois, mais la variation YTD 2026 citée par une source séparée\n    // (\"+26% depuis le 1er janvier 2026\") est cohérente avec 69,47 $ (clôture 2025) → 88,35 $ (point\n    // le plus récent), ce qui corrobore indirectement au moins les deux derniers points de la série.\n    // Split-clean : dernier split (2:1) en 2012, confirmé aucun split depuis — aucun ajustement\n    // nécessaire sur la fenêtre 2015-2025. Point 2026-08 (88,35 $, réellement daté du 13/09/2026)\n    // étiqueté par cohérence avec LATEST_YM et le reste du roster. Point supprimé le\n    // 23/09/2026 : prix de septembre rangé à tort comme clôture d'août. Actif ajouté à\n    // SPARSE_MONTHLY_DATA_IDS (DCA mensuel bloqué, versement unique uniquement), même traitement\n    // qu'ethereum/cac40 — pas de points mensuels inventés entre les 31 décembre.\nURL du fournisseur historique retrouvée le 30/09/2026. L’accès direct est bloqué ; aucune nouvelle validation point par point ni date de contrôle n’est attribuée à la série. Les cours MacroTrends ajustés des dividendes peuvent différer des clôtures uniquement ajustées des splits.",
    "periodStart": "2015-12",
    "periodEnd": "2025-12",
    "dateStatus": "month-only",
    "method": "Série éparse de points annuels et observations complémentaires ; aucune interpolation certifiée"
  }
};

for (const review of ARCHIVE_SOURCE_REVIEW.filter(r => !r.key)) {
  const evidence = SUPPORTING_EVIDENCE[review.id];
  Object.assign(evidence, review);
  if (review.sourceStatus === 'archive-unverifiable') evidence.note = 'Attributions historiques conservées dans market-history.js ; elles ne sont pas une certification. Raison de la revue dans sourceReason.';
}

// La revue mensuelle prime sur les métadonnées héritées ; son périmètre est explicite.
for (const [id, review] of Object.entries(MARKET_HISTORY_REVIEW)) SUPPORTING_EVIDENCE[id] = { ...SUPPORTING_EVIDENCE[id], ...review };
