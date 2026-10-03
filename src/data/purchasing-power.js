// Historique : variations moyennes annuelles INSEE, jusqu’à 2025 inclus.
// Arrivée : niveau mensuel observé, base 100 = moyenne 2025. Le facteur est le produit
// des variations annuelles Y0+1..2025 puis indice courant / 100 ; jamais le glissement annuel.
// IRL et SMIC restent des ratios de niveaux, avec leurs dates propres.
export { INFLATION as GENERAL_INFLATION, LATEST_YM, AMOUNT_PRESETS } from './market-history.js'

export const YEAR_MIN = 2010
export const YEAR_MAX = 2025 // dernière année de départ sélectionnable — 2026 est l'année d'arrivée (en cours, non terminée)
export const YEAR_PRESETS = [2010, 2015, 2020]

// Indice de référence des loyers (IRL), INSEE, valeur du 1er trimestre de chaque année (base 100 au
// 4e trimestre 1998) — sert de proxy officiel à l'évolution des loyers en France (c'est la série que
// les bailleurs utilisent légalement pour réviser un loyer). Recherchée et recoupée le 05/09/2026 sur
// deux passes de recherche indépendantes, convergentes sur toutes les années qui se recoupent (ex. le
// 1er trimestre 2011 = 119,69 retrouvé identique dans les deux passes, de même pour 2016-2019 et
// 2021-2025) — voir communiqués INSEE « Au premier trimestre AAAA, l'indice de référence des loyers... »
// (par ex. insee.fr/fr/statistiques/6327279 pour 2022, /8558868 pour 2025, /3975845 pour 2019).
// Point 2026 : valeur du 2e TRIMESTRE (148,37) retenue plutôt que le 1er trimestre (146,60), pour rester
// cohérente avec LATEST_YM = 2026-08 (dernière donnée disponible dans le reste de l'app) — seule
// exception à la convention « 1er trimestre » du reste de la série, signalée ici explicitement.
export const IRL_LOYER = {
  2010: 117.81, 2011: 119.69, 2012: 122.37, 2013: 124.25, 2014: 125.00,
  2015: 125.19, 2016: 125.26, 2017: 125.90, 2018: 127.22, 2019: 129.38,
  2020: 130.57, 2021: 130.69, 2022: 133.93, 2023: 138.61, 2024: 143.46,
  2025: 145.47, 2026: 148.37,
}

// SMIC brut mensuel (151,67 h, 35 h/semaine), en euros — valeur au 1er janvier de chaque année sauf
// mention contraire. Source : montants légaux SMIC (JORF/décrets de revalorisation), recoupés le
// 05/09/2026 sur deux passes de recherche indépendantes convergentes (ex. 2016 = 1466,62 €, 2017 =
// 1480,27 € retrouvés identiques dans les deux passes). Des années ont connu plusieurs revalorisations
// en cours d'année (inflation) : on retient ici la valeur en vigueur le plus longtemps dans l'année,
// sauf pour 2026 où l'on retient la valeur de JUIN 2026 (1867,02 €, après la revalorisation de juin),
// plus proche de LATEST_YM = 2026-08 que la valeur de janvier (1823,03 €) — seule exception à la
// convention « 1er janvier », signalée ici explicitement, comme pour IRL_LOYER ci-dessus.
// 2022 : 3 revalorisations (janv. 1603,12 € -> mai 1645,58 € -> août 1678,95 €), on retient janv.
// 2023 : 2 revalorisations (janv. 1709,28 € -> mai 1747,20 €), on retient janv.
// 2024 : revalorisation de nov. 2024 (1801,80 €) qui reste en vigueur jusqu'à fin 2025 (aucune hausse
//        au 1er janv. 2025), donc SMIC[2024]=janv. 2024 (1766,92 €) et SMIC[2025]=1801,80 € (déjà en
//        vigueur depuis nov. 2024, inchangé sur 2025).
export const SMIC = {
  2010: 1343.80, 2011: 1365.00, 2012: 1398.40, 2013: 1430.20, 2014: 1445.40,
  2015: 1457.50, 2016: 1466.62, 2017: 1480.27, 2018: 1498.47, 2019: 1521.22,
  2020: 1539.42, 2021: 1554.58, 2022: 1603.12, 2023: 1709.28, 2024: 1766.92,
  2025: 1801.80, 2026: 1867.02,
}

// Indice des prix à la consommation INSEE, regroupement conjoncturel "Alimentation" — variation moyenne annuelle, %. Recherché le 05/09/2026 à partir des communiqués
// annuels INSEE « Prix à la consommation » ; chaque valeur se recoupe avec le "après +X% en (année-1)"
// cité dans le communiqué de l'année suivante (chaîne d'auto-cohérence sur 2011-2024 : ex. le
// communiqué 2012 cite "+1,9% en 2011" qui correspond exactement à la valeur retenue pour 2011).
// 2015 : deux formulations légèrement différentes trouvées (+0,4% et +0,5% selon le communiqué source)
// — écart probable définitif/provisoire, +0,4% retenu (version la plus citée).
// Le niveau mensuel observé est séparé de ces taux annuels : PRICE_OBSERVATION ci-dessous.
export const ALIMENTATION = {
  2010: 0.8, 2011: 1.9, 2012: 3.0, 2013: 1.4, 2014: -0.6,
  2015: 0.4, 2016: 0.6, 2017: 1.0, 2018: 1.9, 2019: 2.5,
  2020: 1.9, 2021: 0.6, 2022: 6.8, 2023: 11.8, 2024: 1.4,
  2025: 1.2,
}

// Indice des prix à la consommation INSEE, fonction "Énergie" (carburants, électricité, gaz, fioul,
// combustibles) — variation moyenne annuelle, %. C'est la série que l'INSEE lui-même utilise pour
// suivre les prix des carburants au sens large (le communiqué mensuel INSEE ventile "Énergie" en
// carburants/électricité/gaz — les carburants en sont la composante la plus volatile). Recherché le
// 05/09/2026, même méthode de recoupement par chaîne d'auto-cohérence que ALIMENTATION ci-dessus
// (ex. le communiqué 2019 cite "+9,7% en 2018" qui correspond à la valeur retenue pour 2018 ; le
// communiqué 2018 cite "-2,8% en 2016... +6,2% en 2017" qui correspond aux valeurs retenues 2016/2017).
// Le niveau mensuel observé est séparé de ces taux annuels : PRICE_OBSERVATION ci-dessous.
export const ENERGIE = {
  2010: 10.0, 2011: 12.3, 2012: 5.2, 2013: 0.8, 2014: -0.9,
  2015: -4.7, 2016: -2.8, 2017: 6.2, 2018: 9.7, 2019: 1.9,
  2020: -6.1, 2021: 10.5, 2022: 23.1, 2023: 5.6, 2024: 2.3,
  2025: -5.6,
}

// INSEE, résultats définitifs août 2026, tableau national, base 100 = moyenne 2025.
// Source : https://www.insee.fr/fr/statistiques/9051406, contrôlé le 03/10/2026.
// Capture : scripts/source-snapshots/household-benchmarks-2026-10-03.json.
export const PRICE_OBSERVATION = {
  asOf: '2026-08', label: 'août 2026', baseYear: 2025,
  general: 103.35, alimentation: 101.69, energie: 115.60,
}

export const POSTES = {
  loyer: {
    id: 'loyer', label: 'Loyer', icon: '🏠',
    tweetNoun: 'ton loyer', tweetVerb: 'de loyer',
    series: IRL_LOYER, seriesType: 'level',
    sourceLabel: "Indice de référence des loyers (IRL), INSEE",
  },
  alimentation: {
    id: 'alimentation', label: 'Alimentation', icon: '🛒',
    tweetNoun: 'tes courses', tweetVerb: "d'alimentation",
    series: ALIMENTATION, seriesType: 'rate', latestFactor: PRICE_OBSERVATION.alimentation / 100,
    sourceLabel: "Indice des prix à la consommation - fonction Alimentation, INSEE",
  },
  carburant: {
    id: 'carburant', label: 'Carburant', icon: '⛽',
    tweetNoun: 'le plein', tweetVerb: "de carburant",
    series: ENERGIE, seriesType: 'rate', latestFactor: PRICE_OBSERVATION.energie / 100,
    sourceLabel: "Indice des prix à la consommation - fonction Énergie, INSEE",
  },
}
export const POSTE_ORDER = ['loyer', 'alimentation', 'carburant']
