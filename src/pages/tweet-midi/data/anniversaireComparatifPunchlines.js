// Punchlines de clôture pour le format "Il y a X ans" en mode Comparatif — génériques (jamais
// liées à un actif précis, pour rester valables quelle que soit la paire tirée), avec un seul
// placeholder {yearsPhrase} déjà accordé ("1 an" / "5 ans" — jamais {years} seul, cf. audit "pools
// de punchlines" du 29/08/2026, même correctif que anniversairePunchlines.js). Pool distinct des
// trois autres pools de punchlines de Tweet Midi (Simple Anniversaire, Simple Performance depuis,
// Comparatif Performance depuis) pour qu'aucun ne se répète d'un mode/format à l'autre (contrainte
// du brief d'origine). Portent sur l'écart entre deux actifs, jamais sur un jugement de valeur
// absolu — restent valables quel que soit le signe des deux performances, donc pas de registre
// gain/perte séparé ici (contrairement aux deux pools Simple).
export const ANNIVERSAIRE_COMPARATIF_PUNCHLINES = [
  "{yearsPhrase}, un seul point de départ, deux trajectoires. L'écart parle de lui-même.",
  "Même ligne de départ il y a {yearsPhrase}. Le reste, c'est le marché qui l'a écrit.",
  "Tu aurais parié sur lequel des deux il y a {yearsPhrase} ?",
  "Deux actifs, {yearsPhrase}, un seul gagnant sur cette période précise.",
  "Le hasard n'explique pas tout. Mais {yearsPhrase} d'écart, ça interroge.",
  "Un seul de ces deux choix s'est vraiment démarqué il y a {yearsPhrase}.",
  "{yearsPhrase} plus tard, le classement est sans appel — pour cette fois.",
  "Deux paris, un seul horizon commun. Lequel tu aurais tenu {yearsPhrase} ?",
  "Rien ne dit que ça se reproduira. Mais sur {yearsPhrase}, l'écart est net.",
];
