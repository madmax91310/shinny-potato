// Question de clôture pour le format "Performance depuis [année]" en mode Simple — génériques
// (jamais liées à un actif précis, jamais liées au signe d'une année précise puisque le vert/rouge
// de chaque ligne du détail annuel porte déjà cette information), pool distinct de
// anniversairePunchlines.js pour qu'aucune des deux ne se répète d'un format à l'autre (contrainte
// du brief d'origine). Remplace l'ancien système à 3 registres (neutre/gain/perte) : le nouveau
// format affiche une performance PAR ANNÉE (🟢/🔴), donc une seule punchline générale n'a plus à
// choisir un ton gain/perte pour l'ensemble de la période (cf. refonte du 29/08/2026, sur demande
// utilisateur — nouveau gabarit ligne par ligne avec pastille de couleur).
export const PERFORMANCE_DEPUIS_QUESTIONS = [
  "💬 Tu en as dans ton portefeuille ?",
  "💬 Tu l'aurais tenu sur toute la période ?",
  "💬 Ça te donne envie d'y regarder de plus près ?",
  "💬 T'aurais tenu bon sur les années rouges ?",
  "💬 Ça correspond à ce que t'imaginais ?",
  "💬 Combien de ces années tu aurais vraiment tenues ?",
];
