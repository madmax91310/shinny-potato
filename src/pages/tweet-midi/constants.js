export const FORMATS = {
  DILEMME: "dilemme",
  FICHE_LEXIQUE: "fiche-lexique",
  COMPARATIF_ETF: "comparatif-etf",
  ANNIVERSAIRE: "anniversaire",
  PERFORMANCE_DEPUIS: "performance-depuis",
  POUVOIR_ACHAT: "pouvoir-achat",
  ALEATOIRE: "aleatoire",
};

// Mode "Simple" (un actif) vs "Comparatif" (deux actifs) — propre aux formats Anniversaire et
// Performance depuis, au choix de l'utilisateur à chaque génération (jamais un 3e format séparé,
// cf. brief). Portée par chaque item (`item.mode`) pour que l'anti-répétition globale et le mode
// Aléatoire traitent les deux variantes d'un même actif comme des tirages distincts.
export const MODES = {
  SIMPLE: "simple",
  COMPARATIF: "comparatif",
};

export const FORMAT_LABELS = {
  [FORMATS.DILEMME]: "Dilemme",
  [FORMATS.FICHE_LEXIQUE]: "Fiche lexique",
  [FORMATS.COMPARATIF_ETF]: "Comparatif ETF",
  [FORMATS.ANNIVERSAIRE]: "Il y a X ans",
  [FORMATS.PERFORMANCE_DEPUIS]: "Performance depuis",
  [FORMATS.POUVOIR_ACHAT]: "Pouvoir d'achat",
  [FORMATS.ALEATOIRE]: "Aléatoire (tous formats)",
};

// Ancrée une seule fois au chargement du module (donc à chaque ouverture/rechargement de page,
// jamais codée en dur) : sert à déterminer quels décalages "il y a X ans" restent dans la plage
// réellement couverte par chaque actif. Le prix "actuel" du Format A, lui, n'est jamais dérivé de
// cette date — dernière observation datée qualifiée, avec correction manuelle facultative.
export const TODAY = new Date();

// Sentinelle pour "pas de sujet précis choisi à l'étape 2" — ne collisionne avec aucun id réel
// (termes du lexique, situations de dilemme, thématiques ETF).
export const SUBJECT_ALEATOIRE = "aleatoire";

