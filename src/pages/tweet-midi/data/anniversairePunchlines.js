// Punchlines de clôture pour le format "Il y a X ans jour pour jour" — génériques (jamais liées à
// un actif précis, pour rester valables quel que soit le tirage), avec un seul placeholder
// {yearsPhrase} déjà accordé ("1 an" / "5 ans" — jamais {years} seul : plusieurs gabarits
// utilisaient "{years} ans" tel quel, ce qui donnait "il y a 1 ans" pour un an en arrière, audit
// "pools de punchlines" du 29/08/2026). Pool distinct de performanceDepuisPunchlines.js pour
// qu'aucune des deux ne se répète d'un format à l'autre (contrainte du brief d'origine).
//
// Trois registres (même audit) : la plupart des gabarits d'origine présumaient un gain ("la
// patience a payé") alors que la performance affichée peut être négative (actif en baisse sur la
// période, ou niveau actuel saisi inférieur au prix historique) — sélection par signe réel dans
// lib.js (pickAnniversairePunchline), jamais un pool unique tiré au hasard sans regarder le
// chiffre affiché juste au-dessus.
export const ANNIVERSAIRE_PUNCHLINES_NEUTRE = [
  "Et toi, tu faisais quoi il y a {yearsPhrase} ?",
  "Ce chiffre, tu l'aurais cru possible il y a {yearsPhrase} ?",
  "Personne ne sonne de cloche au bon moment. {yearsPhrase} plus tard, le résultat, lui, ne ment pas.",
];

export const ANNIVERSAIRE_PUNCHLINES_GAIN = [
  "La meilleure date pour commencer, c'était il y a {yearsPhrase}. La deuxième meilleure, c'est aujourd'hui.",
  "{yearsPhrase} d'attente auraient suffi. Combien de temps tu comptes encore attendre ?",
  "Aucune stratégie compliquée ici. Juste {yearsPhrase} de patience.",
  "Tu regrettes de ne pas avoir commencé plus tôt, ou tu t'y mets maintenant ?",
  "Le temps a fait le travail. {yearsPhrase} plus tard, la preuve est là.",
];

export const ANNIVERSAIRE_PUNCHLINES_PERTE = [
  "Tout n'a pas toujours été en ligne droite. {yearsPhrase} plus tard, ça se voit encore.",
  "Le marché ne doit rien à personne. {yearsPhrase} après, la preuve est là.",
  "Une trajectoire ne se juge pas qu'à l'arrivée. Mais {yearsPhrase} plus tard, celle-ci pique.",
  "Pas toutes les histoires finissent en ligne montante. Celle-ci non plus, pour l'instant.",
  "{yearsPhrase} plus tard, le pari ne s'est pas déroulé comme prévu.",
];
