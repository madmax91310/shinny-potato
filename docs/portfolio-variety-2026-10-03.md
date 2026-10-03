# Variété du générateur après la PR #211

La correction conserve 93 constructions et les 31 couples profil × risque.
Les poids peuvent varier de ±25 points par poche, avec un minimum de 5 points ;
les règles Europe/Bitcoin et le filtre de pire année restent contrôlés après chaque échange.
Le levier et la poche centrale thématique gardent leurs poids de départ.

Le Rentier Dynamique utilise les obligations américaines distribuantes dans sa recette
avec options en complément. Les deux nouvelles constructions Rentier Offensif passent
à trois poches : dividendes + immobilier coté + SCPI ; options + dividendes + coupons.
Les variantes Anti-Inflation Prudent, Défensif et Dynamique centrées sur les obligations
indexées se distinguent du panier de matières premières de leur construction historique.

La sélection compare plusieurs candidats de la recette retenue et mesure les distances
entre familles et poids. Un changement d’émetteur ne compte plus à lui seul comme une
nouvelle composition. Les familles regroupent parfois des indices voisins et ne constituent
pas une mesure du chevauchement des entreprises ni une assimilation de leurs rendements.

## Mesure reproductible

Commande : `node scripts/audit-portfolio-variety.mjs --baseline-ref=cd577fc`.
Trois graines fixes, 100 tirages par couple et graine, soit 9 300 tirages par version.
Historique borné à 40 pour conserver la méthode du premier audit ; l’interface conserve
son historique de session entier. Une composition proche requiert au plus 10 points de
capital à déplacer. Les moyennes portent sur les 31 couples, également représentés.

| Mesure | PR #211 | Après correction |
|---|---:|---:|
| Allocations distinctes sur 100, regroupées par familles | 87,43 | 98,39 |
| Tirages consécutifs proches | 0,945 % | 0,076 % |
| Tirages proches d’un des 20 précédents | 86,08 % | 10,77 % |
| Rentier Offensif : allocations distinctes sur 100 | 62,67 | 98,33 |
| Couples avec deux recettes partageant une structure observée | 4 | 0 |

Aucun des 31 couples ne régresse sur le nombre moyen d’allocations distinctes dans cet
échantillon. Ces résultats décrivent ces graines et ce protocole ; ils ne garantissent pas
l’absence de répétitions dans une session arbitrairement longue.

Les contrôles exhaustifs des poids de départ couvrent 9 450 combinaisons de supports.
Les tests génératifs contrôlent aussi les poids modifiés, les règles de profil, la rotation,
la détection de répétitions par familles et le fonctionnement avec un historique de session
long. Aucun chiffre de marché, conversion de devise ou avertissement des tweets n’est ajouté.
