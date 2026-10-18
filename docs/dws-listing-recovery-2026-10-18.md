# Cotations Xtrackers : récupération du 18 octobre 2026

Le contrôle d’identité cherchait tous les ISIN de la réponse DWS et exigeait qu’un seul soit présent. Les pages de dix fonds contiennent également des titres prêtés, des garanties et des suggestions d’autres ETF : ces références sans rapport avec les cotations faisaient rejeter la page entière.

Le collecteur vérifie désormais l’ISIN explicite de la section des caractéristiques du fonds, ainsi que l’en-tête et l’identifiant produit quand ils sont présents. Il lit exclusivement la section de cotation de ce même fonds. Un identifiant absent, contradictoire ou une section dupliquée reste bloquant. Les tables des garanties et des suggestions ne peuvent pas alimenter les cotations.

## Collecte réelle

Les dix réponses officielles ont été relues avec le collecteur corrigé. Les observations enregistrées conservent leur URL, leur empreinte SHA-256, la date de contrôle et l’extrait de la ligne associant place, devise, ticker et code Reuters.

| ISIN | Cotations reconnues |
| --- | ---: |
| IE000L6ZMMC4 | 4 |
| IE00BJ0KDQ92 | 4 |
| IE00BK1PV551 | 4 |
| IE00BTJRMP35 | 4 |
| LU0274209237 | 4 |
| LU0328475792 | 3 |
| LU0380865021 | 3 |
| LU1875395870 | 2 |
| LU2196470426 | 1 |
| LU2903252349 | 4 |

Total : 33 cotations pour dix parts. Le registre commun reconnaît désormais 242 ISIN avec cotations, contre 232 avant cette collecte. Ce relevé ne certifie pas à nouveau les cotations des autres fonds.

## Vérifications et limites

Les tests vérifient notamment qu’un titre détenu ou une suggestion d’autre ETF ne change pas les cotations du fonds, et qu’une contradiction de l’en-tête, de l’identifiant produit ou de la section ISIN reste rejetée. Les contrôles préexistants sur les autres émetteurs sont conservés.

La collecte des caractéristiques est déjà programmée quotidiennement ; la modification du collecteur déclenche aussi son workflow après fusion. Les nouveaux champs alimentent le registre partagé et les fiches ETF. Les cotations EUR/USD deviennent candidates à la qualification mensuelle existante, qui reste une étape distincte : cette correction ne fabrique aucun historique et ne rend pas un fonds admissible à un outil de performance sans les contrôles habituels de profondeur, identité et devise.

Les rapports et projections produits par le build ne sont pas ajoutés au commit. Leur génération utilise les observations mises à jour et conserve les corrections du chantier #791.

## Qualification et raccordement des historiques

Les 24 cotations candidates EUR/USD des dix parts ont ensuite passé le qualificateur existant : identité et devise Yahoo, mois clos, rapprochement quotidien/mensuel, preuves de réponse et cours brut du dernier anniversaire. Une seule série par part entre dans le registre, selon l’ordre déterministe des cotations du collecteur. Les dix sources sont enregistrées dans la collecte mensuelle ; les autres observations, dont l’ajout Amundi de #791, sont conservées.

Après génération : 235 historiques ETF/ETC automatisés au lieu de 225 ; 17 instruments restent sans cotation documentée au lieu de 27. Trente historiques sont trop courts pour la génération automatique, contre 28 auparavant : les deux nouveaux fonds récents restent correctement limités. Huit supports supplémentaires sont accessibles manuellement ; les conditions de profondeur et de périodes communes du Générateur et des Duels restent inchangées.

Vérification de cette intégration : compilation et budgets, 664 historiques avec preuves, 235 raccordements ETF/ETC, raisons de blocage et 432 choix manuels contrôlés. Les fichiers dérivés produits par la compilation restent exclus du commit.
