// Question de clôture pour le format "Performance depuis [année]" en mode Simple — génériques
// (jamais liées à un actif précis, jamais liées au signe d'une année précise puisque le vert/rouge
// de chaque ligne du détail annuel porte déjà cette information), pool distinct de
// anniversairePunchlines.js pour qu'aucune des deux ne se répète d'un format à l'autre (contrainte
// du brief d'origine). Remplace l'ancien système à 3 registres (neutre/gain/perte) : le nouveau
// format affiche une performance PAR ANNÉE (🟢/🔴), donc une seule punchline générale n'a plus à
// choisir un ton gain/perte pour l'ensemble de la période (cf. refonte du 29/08/2026, sur demande
// utilisateur — nouveau gabarit ligne par ligne avec pastille de couleur).
// Élargi de 6 à 25 le 29/08/2026 (audit : pool trop réduit pour un usage quotidien, risque de
// répétition perçue par les lecteurs assidus) — même ton, toujours générique et sans présupposer
// gain ou perte.
export const PERFORMANCE_DEPUIS_QUESTIONS = [
  "💬 Tu en as dans ton portefeuille ?",
  "💬 Tu l'aurais tenu sur toute la période ?",
  "💬 Ça te donne envie d'y regarder de plus près ?",
  "💬 T'aurais tenu bon sur les années rouges ?",
  "💬 Ça correspond à ce que t'imaginais ?",
  "💬 Combien de ces années tu aurais vraiment tenues ?",
  "💬 T'aurais vendu à quel moment ?",
  "💬 Ça te fait relativiser tes propres résultats ?",
  "💬 Tu vois le pattern se répéter ?",
  "💬 C'est le genre de série qui te tenterait ?",
  "💬 Tu remets ce genre de graphique en question ?",
  "💬 Ça t'aurait fait paniquer, une année comme ça ?",
  "💬 Tu penses pouvoir refaire pareil sur les 10 prochaines années ?",
  "💬 Qu'est-ce que t'en retiens ?",
  "💬 T'as un avis sur la suite ?",
  "💬 Ça change ta vision du risque ?",
  "💬 Tu miserais dessus aujourd'hui ?",
  "💬 T'aurais deviné cette trajectoire ?",
  "💬 Ça te rassure ou ça t'inquiète ?",
  "💬 Tu retiens quelle année en particulier ?",
  "💬 T'as vécu cette période en investisseur, toi ?",
  "💬 Ça vaut le coup de s'y intéresser maintenant ?",
  "💬 Tu suis ce genre d'actif de près ?",
  "💬 On en reparle dans 10 ans ?",
  "💬 T'aurais fait quoi à la place ?",
];
