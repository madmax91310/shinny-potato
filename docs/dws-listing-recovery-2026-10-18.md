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

## Intégration avec l’audit #798

Les deux chantiers avaient qualifié les mêmes dix parts. Les registres sont rapprochés par identifiant : les configurations et cours bruts sont identiques, leur ordre seul différait. Les observations mensuelles et leurs preuves de #799 restent ensemble ; les caractéristiques plus complètes et les diagnostics de #798 sont conservés. Aucune série ni preuve n’est assemblée point par point.

Le collecteur conserve les contrôles d’identité et la table de cotation strictement délimitée de #799, ainsi que la lecture des caractéristiques et le rejet des champs dupliqués de #798. Les régressions des deux branches restent testées. Une nouvelle collecte de contrôle des dix parts réussit sans renouvellement en échec.

Le portail Pages régénère désormais les raccourcis de performance avant le test des raccordements ETF. Le défaut a été reproduit sur un checkout propre : le test lisait l’ancienne projection avant la compilation. Aucun contrôle ni critère financier n’est supprimé. Compilation et budgets, 235 historiques ETF/ETC, 664 preuves historiques, 605 liens de performance, 649 liens de simulation, change BCE et 55 tests de suivi/workflows réussissent sur l’intégration.

## Résolution après publication de #798 et #800 — 19 octobre 2026

La branche est rapprochée de `master` au commit `ef9632a2a044621c5f7d23de52e832f510a72f51`. Les dix parts sont déjà présentes dans les collectes publiées. Les configurations et identités sont identiques par identifiant ; leur ordre différait seulement. Les deux conflits portent sur les valeurs ajustées et les preuves de réponses mensuelles renouvelées depuis la préparation de #799.

Les observations, preuves, cours bruts, configurations et statuts de qualification de `master` sont conservés ensemble, sans fusion de valeurs point par point et sans modification de date. Cette résolution remplace le choix des observations décrit dans la section précédente. Le changement restant porte sur le contrôle strict des sections DWS, ses tests et l'ordre de régénération du portail Pages. Les améliorations publiées par #798 et #800 sont conservées.

Les 19 tests du collecteur, l'audit des 664 historiques et les raccordements des 235 historiques ETF/ETC passent sur cet instantané. L'échec de l'ancienne collecte entreprises de #799 concernait une prévision Teradyne périmée ou datée dans le futur ; aucun seuil de fraîcheur ni contrôle financier n'est assoupli dans cette résolution.

La compilation et les budgets passent également. Le parcours Chromium contrôle sept sélections manuelles, dont les parts Xtrackers IE00BJ0KDQ92 et IE00BK1PV551 : chargement différé, reprise après erreur, allocation, PNG et écran mobile. Les Duels, les expositions et Performance depuis sont exercés ; la part IE00BK1PV551 produit le texte attendu dans Performance depuis. Aucun fichier dérivé du build n’est ajouté à la résolution.
