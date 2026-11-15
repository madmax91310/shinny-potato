# Preuve JEPG — 15 novembre 2026

Réponses publiques brutes : `product-2026-11-15.json` (product-data, SG/per/en, part IE0003UVYC20) et `history-2026-11-15.json` (historicalData, GB/per/en, même part). Ce dernier endpoint a été observé dans les requêtes de la page britannique officielle. Le paramètre de version du client est inutile à la réponse canonique, également collectée et validée.

Identité et convention : produit SG qualifié, USD distribuante, divulgation explicite NAV avec revenus bruts réinvestis et frais courants inclus. NAV finale identique dans les deux réponses : 27,1835 USD au 13 novembre. Le calendrier de la part est séparé du benchmark, de l’excès géométrique et du YTD.

Le composant officiel `pdp` associe les dix labels à oneYear, twoYears, …, tenYears : ces noms de propriétés sont ici des colonnes de calendrier, pas des durées glissantes. Extrait contrôlé : `case"YEARLY":{const e=(0,j.A)([],["labels"],this.props.historicalData.historicalCalendarYearPerformanceReturn);t={oneYear:e[0],twoYears:e[1],threeYears:e[2],fourYears:e[3],fiveYears:e[4],sixYears:e[5],sevenYears:e[6],eightYears:e[7],nineYears:e[8],tenYears:e[9]};break}`.

SHA256 du script officiel contrôlé : cc958b189a48f4899ca1ef82578780e50f8dadf34506d6cd6270a79314a9fa26. Les rendements décimaux 0,080845 et 0,123492 donnent les valeurs de présentation 8,08 % et 12,35 %, identiques au PDF déjà qualifié. Le YTD 0,067387 n’est pas une performance annuelle 2026. Aucun dividende n’est ajouté à ces rendements déjà réinvestis.

La recette 2027 modifie uniquement des copies en mémoire de ces fixtures. Aucune observation future n’est écrite dans les registres. La collecte GitHub, l’enregistrement, la publication et le prochain cron restent des preuves distinctes.
