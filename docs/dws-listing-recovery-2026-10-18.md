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
