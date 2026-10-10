# Scanner ETF

Route : `/scanner-etf`, accessible depuis l’accueil et la navigation.

Le scanner charge le manifeste à son ouverture puis uniquement les compositions
sélectionnées. Il vérifie les SHA-256 des fichiers et recalcule leurs âges côté
client. Une source échouée ou périmée est exclue sans redistribuer son poids.
Le chargement peut être relancé ; les pondérations seules ne retéléchargent pas
les compositions. Un contrôle de dates chaque minute bloque une donnée devenue
périmée pendant une session ouverte.

## Calculs

- Pondérations saisies en pourcentage, somme 100 %, 1 à 12 parts uniques.
- Rapprochement par ISIN du titre ; plusieurs lignes du même ISIN dans un fonds
  sont agrégées. Des classes d’actions différentes restent distinctes. Aucune
  inférence par nom, ticker ou maison mère.
- Contribution = poids de l’ETF dans l’allocation × poids publié dans sa VL.
- Top dix, pays et secteurs restent exprimés en pourcentage du portefeuille
  entier. Les lignes absentes ne sont jamais renormalisées.
- Chevauchement de deux fonds = somme des minima des poids des actions communes
  identifiées. Ce résultat porte sur les fonds et reste limité aux ISIN connus.
- Le poids des titres présents dans plusieurs ETF inclut toutes leurs
  contributions, une fois par titre. Il ne désigne pas un montant « inutile ».
- Les droits sans ISIN sont comptés séparément. Les liquidités et dérivés sont
  hors calcul des doublons. Leur poids net n’est pas une exposition économique.
- Avant/après applique deux allocations aux mêmes fichiers, sans simulation de
  rendement. Les deltas sont désactivés si une allocation est partiellement
  couverte. Les dates des sources restent affichées individuellement.

## Publications et sauvegarde

Texte modifiable, image PNG 1600 × 1200, détail des titres CSV et rapport JSON.
En comparaison, le texte et l’image présentent l’allocation après ; le JSON et
le CSV conservent les deux analyses. Les exports signalent une couverture
partielle. La sauvegarde volontaire des allocations reste dans le navigateur.
Aucun compte, téléversement de portefeuille ou service tiers n’est nécessaire.

## Limite PEA

Les six produits de `peaCoverage` restent visibles dans la recherche et suivis
quotidiennement. Ils peuvent figurer dans une allocation partielle, mais leurs
compositions ne participent pas au calcul. Une allocation entièrement composée
de sources indisponibles bloque les résultats et les exports.

La recherche supplémentaire du 10 octobre n’a pas permis de qualifier une
source publique complète datée pour ces six parts. Le fonds physique MSCI World
ne remplace pas la composition de l’indice d’un ETF PEA synthétique. Les sources
et contrôles existants sont détaillés dans `scanner-holdings-2026-10-10.md`.
Cette couverture est une dépendance externe non résolue, pas une étape annoncée
comme terminée. Aucun chiffre incomplet n’est présenté comme exhaustif.

## Vérification

`npm run test:scanner` : invariants de calcul, frais de couverture, poids négatifs
hors actions, dates invalides, sources partielles, et les 32 portefeuilles réels.
`npm run test:scanner:browser` : parcours desktop et mobile 320/390 px,
chargement différé, comparaison, brouillon, sauvegarde, données périmées et
corrompues, exports PNG/CSV/JSON. Les captures et exports sont conservés dans
l’artifact CI `scanner-visual-checks`.

Le moteur et le test navigateur sont intégrés à la validation de déploiement.
