// Chaque paire reste propre à un profil et un palier. Les montants viennent de la sélection
// définitive (après variation des poids), et le risque de la simulation recalculée.
export function dynamicHookPair(profileId, riskId, index, selection, worst, fmtPct) {
  const p = (i) => selection[i].pct;
  const name = (i) => selection[i].name;
  const loss = `${fmtPct(worst.value)} en ${worst.year}`;
  const pairs = {
    generaliste: {
      prudent: () => [
        [`${p(0)}% de fonds euros et ${p(2)}% d'actions monde. Tu appellerais ça un vrai portefeuille prudent ?`, "Le fonds euros amortit les variations des autres lignes, sans les faire disparaître."],
        [`${p(2)}% d'actions monde, avec ${p(0)}% de fonds euros. Trop calme pour toi ?`, `Dans cette simulation, la pire année est ${loss}.`],
      ],
      defensif: () => [
        [`${p(0)}% de fonds euros et ${p(2)}% d'actions monde : tu sens la différence avec un Prudent ?`, `Ce tirage a connu ${loss} dans sa pire année simulée.`],
        [`L'or pèse ${p(3)}% dans ce Défensif. Protection ou pari à part entière ?`, "Il diversifie le portefeuille, mais son cours peut aussi baisser."],
      ],
      equilibre: () => [
        [`${p(5)}% d'immobilier coté dans cet Équilibré. Tu t'attendais à cette place ?`, `${selection.length} lignes, dont la plus grosse pèse ${Math.max(...selection.map(s => s.pct))}%.`],
        [`${loss} pour cet Équilibré. Tu encaisserais cette baisse ?`, `${selection.length} lignes différentes : leur nombre ne garantit pas qu'elles résistent ensemble.`],
      ],
      dynamique: () => [
        [`${p(4)}% de marchés émergents dans ce Dynamique. Tu prendrais cette exposition ?`, `L'indice monde pèse ${p(0)}% : les deux lignes peuvent baisser en même temps.`],
        [`${p(3)}% d'ETF à levier, à côté de ${p(0)}% d'indice monde. Ça vaut le risque ?`, "Même à petit poids, le levier peut peser sur le résultat lors d'une forte baisse."],
      ],
      offensif: () => [
        [`${p(4)}% de Bitcoin et ${p(1)}% d'ETF à levier dans le même portefeuille. Ça te tente ?`, `La pire année simulée atteint ${loss} : ces deux lignes ajoutent du risque.`],
        [`${loss} pour ce Généraliste Offensif. Tu encaisserais ça sans paniquer ?`, `${p(0)}% de Nasdaq-100 et ${p(2)}% d'émergents : les paris sur la croissance occupent une grande place.`],
      ],
    },
    rentier: {
      prudent: () => [
        [`${p(1)}% en obligations high yield pour un Rentier Prudent. Ça te surprend ?`, "Le coupon potentiel est plus élevé, avec un risque de crédit plus fort."],
        [`${p(2)}% de SCPI et ${p(3)}% de dividendes. Tu compterais sur ces revenus ?`, `Le fonds euros représente ${p(0)}% du portefeuille ; les autres distributions ne sont pas garanties.`],
      ],
      defensif: () => [
        [`${p(2)}% en actions à dividendes et ${p(3)}% en high yield. Ce duo te convient ?`, `Le fonds euros pèse ${p(0)}% ; les autres lignes exposent aussi le capital.`],
        [`${p(1)}% d'immobilier coté, en plus des dividendes et du high yield. Trop de sources de risque ?`, "Trois moteurs de revenu possibles, dont les cours peuvent baisser ensemble."],
      ],
      equilibre: () => [
        [`${p(1)}% en foncières et ${p(0)}% en SCPI : ${p(1)+p(0)}% d'immobilier. Tu irais jusque-là ?`, "Ce poids donne une place centrale à l'immobilier et à ses risques."],
        [`${p(1)}% en foncières cotées. Tu trouves ça trop concentré ?`, "SCPI, dividendes et obligations complètent cette position sans effacer sa taille."],
      ],
      dynamique: () => [
        [`${p(0)}% en QYLD, un fonds qui vend des options. Tu sais ce que ça implique ?`, "Les options limitent une partie de la hausse ; le revenu versé peut varier."],
        [`Le covered call pèse ${p(0)}% ici. Tu privilégierais le revenu potentiel à la hausse du capital ?`, "Foncières, dividendes et high yield apportent d'autres risques et d'autres sources de revenu potentiel."],
      ],
      offensif: () => [
        [`${p(0)}% sur QYLD, un seul fonds à vente d'options. Trop concentré pour un Rentier ?`, "La recherche de revenu s'accompagne d'une forte dépendance à cette stratégie."],
        [`QYLD pèse ${p(0)}% du Rentier Offensif. C'est une place que tu assumerais ?`, "Les primes d'options peuvent générer du revenu, sans garantir le capital ni les distributions."],
      ],
    },
    pro_europe: {
      prudent: () => [
        [`${p(0)}% en obligations d'État courtes, ${p(1)}% en actions de la zone euro. Encore un pari européen ?`, "Oui, avec une large place réservée aux actifs moins exposés aux actions."],
        [`${p(0)+p(2)}% entre fonds euros et obligations courtes. Tu appellerais ça « Pro-Européen » ?`, "La conviction géographique concerne surtout la part investie en actions."],
      ],
      defensif: () => [
        [`${p(0)}% d'Euro Stoxx 50 et ${p(1)}% de CAC 40. La zone euro te suffit ?`, `${p(0)+p(1)}% du portefeuille dans ces deux indices, avec des entreprises en commun.`],
        [`Zéro action américaine dans ce Défensif. Tu ferais ce choix ?`, `${p(0)+p(1)}% dans l'Euro Stoxx 50 et le CAC 40 : une conviction européenne assumée.`],
      ],
      equilibre: () => [
        [`${p(3)}% de petites capitalisations européennes dans cet Équilibré. Tu leur donnerais cette place ?`, "Leur risque s'ajoute à celui des grandes entreprises européennes."],
        [`${selection.length-1} lignes d'actions européennes et aucune action US. Tu tiendrais ce cap ?`, "Même la ligne technologique reste centrée sur l'Europe."],
      ],
      dynamique: () => [
        [`${p(3)}% d'or dans un portefeuille tourné vers l'Europe. Ça te semble contradictoire ?`, "L'or apporte un autre risque ; la tech et les petites valeurs européennes restent des paris marqués."],
        [`${p(1)}% de tech européenne et ${p(3)}% d'or. Tu tenterais ce mélange ?`, "Pas d'actions US ici ; l'or est la seule ligne hors de la conviction européenne."],
      ],
      offensif: () => [
        [`${p(1)+p(2)}% entre tech et petites valeurs européennes. Tu pousserais le pari aussi loin ?`, "La grande capitalisation classique garde une place, mais le risque est surtout concentré sur ces deux lignes."],
        [`${loss} pour ce Pro-Européen Offensif. Tu accepterais cette baisse ?`, `L'or pèse ${p(3)}% ; les trois autres lignes restent des actions européennes.`],
      ],
    },
    anti_inflation: {
      prudent: () => [
        [`${loss} dans la pire année de cet Anti-Inflation Prudent. Tu t'attendais à ce résultat ?`, "Ce résultat vaut pour les années simulées, pas pour toutes les périodes d'inflation."],
        [`${p(2)}% d'or et ${p(3)}% de matières premières. Trop pour un profil Prudent ?`, "Ces deux lignes peuvent varier fortement, même dans une allocation prudente."],
      ],
      defensif: () => [
        [`La pire année simulée de cet Anti-Inflation Défensif : ${loss}. Ça te surprend ?`, "L'or et les matières premières ont parfois compensé d'autres baisses, sans garantie pour l'avenir."],
        [`${p(0)}% d'or, ${p(1)}% de matières premières : ${p(0)+p(1)}% à eux deux. Trop concentré ?`, "Ils portent une grande part du risque du portefeuille."],
      ],
      equilibre: () => [
        [`${p(1)}% d'argent, aux côtés de l'or et des matières premières. Tu ferais ce pari ?`, `Ces trois lignes pèsent ${p(0)+p(1)+p(2)}% ; l'argent est ici estimé via un ETC.`],
        [`${loss} dans la pire année simulée. Quel serait le point faible de cette composition ?`, "Une forte place donnée aux métaux et aux matières premières peut aussi peser quand leurs cours reculent."],
      ],
      dynamique: () => [
        [`${selection.length} lignes, dont ${p(0)+p(1)}% entre or et matières premières. Trop concentré ?`, "À ce palier, la conviction anti-inflation prend une large place."],
        [`${p(0)}% d'or à lui seul. Diversification ou pari dominant ?`, "Le cours du métal peut décider d'une grande partie du résultat."],
      ],
      offensif: () => [
        [`Deux lignes : ${p(0)}% d'or et ${p(1)}% de matières premières. Tu retirerais vraiment le reste ?`, "Sans actions ni obligations, cette composition dépend des cours de ces deux actifs."],
        [`Même la pire année simulée est ${loss}. Quel est le piège ?`, "Six années de données ne suffisent pas à conclure que cette allocation ne peut pas perdre."],
      ],
    },
    bouclier: {
      prudent: () => [
        [`${p(3)}% de santé et ${p(0)}% de fonds euros. Cette répartition te rassure ?`, "Le fonds euros amortit les variations possibles des autres lignes."],
        [`${loss} dans la pire année simulée. Assez prudent pour toi ?`, "Ce résultat historique n'est pas une perte maximale garantie."],
      ],
      defensif: () => [
        [`La santé pèse ${p(3)}%, le fonds euros ${p(0)}%. Ce dosage te rassure ?`, "Même un secteur réputé défensif peut connaître de fortes baisses."],
        [`${selection.length} lignes, la plus grosse à ${Math.max(...selection.map(s=>s.pct))}%. Bien réparti à ton avis ?`, "Les poids ne suffisent pas à montrer comment ces lignes réagiraient ensemble."],
      ],
      equilibre: () => [
        [`${p(1)}% d'immobilier coté et ${p(2)}% d'actions à dividendes. Tu t'attendais à ce duo ?`, `Le fonds euros ne représente plus que ${p(0)}% de cette composition.`],
        [`${p(1)+p(2)}% entre foncières et dividendes. Diversification ou risques qui se recoupent ?`, "Les deux restent exposés aux marchés actions, même si leurs revenus viennent d'activités différentes."],
      ],
    },
    crypto_curieux: {
      defensif: () => [
        [`${p(2)}% de Bitcoin avec ${p(0)}% de fonds euros. Une dose de crypto que tu supporterais ?`, "Le fonds euros limite le poids de Bitcoin, sans empêcher les pertes sur la partie risquée."],
        [`Tester Bitcoin à ${p(2)}% tout en gardant ${p(0)}% en fonds euros : ça te parle ?`, "Même une petite ligne crypto peut compter lors d'une forte baisse."],
      ],
      equilibre: () => [
        [`${p(1)}% de Bitcoin et ${p(5)}% d'or. Deux risques très différents : tu les associerais ?`, "Bitcoin reste très volatil ; l'or n'est pas non plus une protection garantie."],
        [`Bitcoin pèse ${p(1)}% dans cet Équilibré. Tu sens le risque que ça ajoute ?`, `La pire année simulée atteint ${loss} pour l'ensemble du portefeuille.`],
      ],
      dynamique: () => [
        [`${p(1)}% de Bitcoin et ${p(3)}% d'ETF à levier. Tu cumulerais ces deux paris ?`, "Deux expositions volatiles qui peuvent amplifier la baisse du portefeuille."],
        [`${loss} dans la pire année simulée. C'est trop pour toi ?`, "Bitcoin et la tech à levier expliquent une grande partie du risque pris ici."],
      ],
      offensif: () => [
        [`${p(0)+p(1)}% entre Bitcoin et Ethereum. Tu irais jusque-là sans or ni fonds euros ?`, `La pire année simulée atteint ${loss} ; cette concentration compte.`],
        [`Crypto, tech et émergents, sans fonds euros. Encore un portefeuille pour toi ?`, "L'absence de plancher historique à ce palier ne protège pas des pertes futures."],
      ],
    },
    thematique: {
      defensif: () => [
        [`${p(0)}% sur ${name(0)}, avec un indice monde à ${p(1)}%. Tu prendrais ce pari sectoriel ?`, "La ligne sectorielle peut bouger bien plus que le reste du portefeuille."],
        [`${loss} dans la pire année simulée de ce Thématique Défensif. Tu t'attendais à ça ?`, `Cette mesure dépend notamment du secteur choisi ici : ${name(0)}.`],
      ],
      equilibre: () => [
        [`${p(0)}% sur ${name(0)}. Tu miserais autant sur ce secteur ?`, `L'or pèse ${p(5)}% et n'efface pas le risque de la première ligne.`],
        [`${p(2)}% sur ${name(2)}, à côté d'un pari sectoriel à ${p(0)}%. Ce mélange te parle ?`, "Cette ligne ajoute une autre exposition géographique, avec ses propres risques."],
      ],
      dynamique: () => [
        [`${p(0)}% sur ${name(0)}. Un secteur à ce poids, tu le garderais ?`, `L'or à ${p(3)}% apporte une exposition différente, sans garantir la protection.`],
        [`${loss} dans la pire année simulée. Tu resterais investi ?`, `${p(0)}% sur un secteur : la concentration reste le premier risque.`],
      ],
      offensif: () => [
        [`${p(0)}% sur ${name(0)}, avec ${p(2)}% d'ETF à levier. Tu ferais ce pari ?`, "Le levier ajoute encore au risque de la ligne sectorielle dominante."],
        [`${loss} dans la pire année simulée. Tu prendrais ce risque sectoriel ?`, "Le portefeuille est concentré ; cette simulation ne fixe aucun plafond aux pertes futures."],
      ],
    },
  };
  const pair = pairs[profileId]?.[riskId]?.()[index];
  if (!pair) throw new Error(`Accroche manquante : ${profileId}/${riskId}/${index}`);
  return { hook: pair[0], intro: pair[1] };
}
