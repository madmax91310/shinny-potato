# Revue des présentations ETF — 23 octobre 2026

## Périmètre et résultat

Le sélecteur `/fiches-etf` propose **258 fiches, correspondant à 258 ISIN distincts**. Aucune n’a été retirée. Les 258 textes ont été revus et corrigés. L’inventaire initial et leur texte avant modification sont conservés dans [initial-inventory.json](initial-inventory.json).

**La certification financière complète reste bloquée pour les 258 fiches.** Ce travail ne doit pas être présenté comme 258 ETF entièrement vérifiés. Les collecteurs existants ont été relancés pour chaque ISIN et les textes sont corrigés, mais plusieurs champs matériels n’ont pas une preuve officielle explicite suffisante. Le PEA et l’absence de couverture sont notamment souvent documentés par des sources secondaires. Leurs contrôles ne sont pas transformés en preuves de l’émetteur. Certains comptages restent indisponibles. Une contradiction PEA persiste pour IE00B0M62S72.

La [matrice exhaustive](review-matrix.md) comporte une ligne par fiche, les corrections, les liens, les dates des observations et les blocages. Sa [version technique JSON](review-matrix.json) conserve les valeurs, la devise, les conventions de performance, les périmètres et les sources par champ. Le total se réconcilie avec l’inventaire initial. « Corrigée » signifie que le texte final diffère de l’original ; « revue » ne signifie pas « certifiée ».

Les [résultats de collecte par ISIN](source-checks.json) distinguent date du contrôle et photographie. Ils contiennent les réponses structurées utiles des collecteurs, les erreurs et les preuves de caractéristiques/cotation. Les données financières n’ont pas été réécrites globalement à partir d’une collecte de revue : les observations déjà automatisées gardent leur chaîne habituelle. Seuls les comptages et durations nouvellement recueillis par le collecteur iShares sont ajoutés au registre actif.

## Fonctionnement inventorié

- `src/tools.js` / `src/App.jsx` : route `/fiches-etf`, libellée Présentation d’ETF.
- `src/data/etf-cards.js` : catalogue exhaustif, façades de plusieurs extensions et anciennes fiches rédigées. `records.js` fournit le sélecteur et la sélection par ISIN ; aucune IA ni requête d’émetteur n’est appelée à l’ouverture d’une fiche.
- Textes enregistrés : `routing-presentations.js`, `presentation-etf-expansion.js`, `presentation-etf-additions.js`, `exposure-additions.js`, `qualified-exposure-sheets.js`, `round3-fund-sheets.js`, `non-bond-expansion.js`, `lifestrategy.js`, anciennes fiches et `etf-sheets/editorial.js`. Les anciennes façades peuvent encore contenir un texte historique de comparaison ou de secours ; les présentations publiables exigent désormais l’entrée explicite du registre éditorial revu.
- Registres communs : `instruments.js` (identité), `instrument-listings.js` (cotation), `etf-ter.js`, `instrument-facts.js`, `instrument-pea.js`, `instrument-aum.js`, `instrument-returns.js`. Une cotation est un ensemble ticker/MIC/place/devise, jamais un ticker isolé.
- Observations : `automated-etf.json`, `exposure-etf-expansion-records.json`, `qualified-exposure-etfs.json`, `non-bond-qualified-records.json`, `non-bond-etf-records.json`, registres LifeStrategy et métadonnées instrument. Les performances officielles et les cours ajustés restent des conventions distinctes.
- Collecteurs conservés : iShares, Amundi, State Street, `refresh_additional_etf.py`, expositions qualifiées, extensions non obligataires et LifeStrategy ; caractéristiques via `collect_instrument_metadata.py`. La collecte de revue a observé chaque ISIN avec ces mécanismes, sans application globale ni déploiement. Les chevauchements entre collecteurs ont été dédupliqués par ISIN.
- Génération à la demande : `getPresentationCopy` compose les paragraphes enregistrés avec les photographies datées. `buildText` génère la copie. `EtfCard` affiche le même modèle enrichi. `canvasImage.js` produit un **récapitulatif des faits et performances**, pas une image de tous les paragraphes.
- Exports existants : presse-papiers, téléchargement PNG, aperçu, partage de l’image lorsque le navigateur le permet. Aucun export PDF ou document texte n’existait dans cet outil et aucun n’a été ajouté.
- Projections : `project-tool-data.mjs`, `split-etf-records.mjs` et plugins Vite régénèrent les données chargées. Pas de second cache de présentations à corriger manuellement. Le build a régénéré ces projections pour la recette ; elles ne sont pas committées.
- Préférences locales : dernier ETF et devise de performance. Elles ne stockent pas un ancien texte final ; changer de sélection régénère le texte et invalide l’ancien aperçu.

## Changements du générateur

1. Registre `etf-presentation-copy.js` : chaque fiche existante possède une correction explicite. Les explications communes à des parts d’une même exposition ne partagent jamais leurs chiffres. Le World explique son univers développé et la capitalisation flottante ; les émergents distinguent MSCI et FTSE ; les secteurs détaillent les métiers ; les stratégies expliquent la sélection ou le mécanisme.
2. Les nouvelles fiches doivent avoir une rédaction qualifiée et figurer dans le registre de couverture. Le contrôle lancé avant chaque build refuse une fiche sans revue. Il refuse également les anciens paragraphes et questions de secours génériques. Il ne remplace pas une lecture éditoriale ou un contrôle financier.
3. Les huit éléments demandés sont présents dans le texte final, avec « Pas un conseil financier. ». Les trois rubriques sont séparées et les questions liées à l’exposition. Les chiffres vivants ne sont pas recopiés dans les nouvelles explications.
4. Le périmètre **fonds / part** n’est plus supprimé de l’encours. La devise de cotation et celle de la part sont distinctes. Un statut PEA faux documenté est visible ; un statut inconnu n’est pas transformé en faux.
5. Les positions et pays datés enrichissent le modèle commun à l’aperçu et à la copie. Les compositions d’indices restent explicitement des compositions d’indices. Les paniers de substitution des swaps et les portefeuilles hybrides ne sont pas décrits comme leur exposition économique.
6. Le collecteur iShares demande aussi `fundamentalsAndRisk`. Le nombre de positions exclut liquidités et dérivés selon la définition de l’émetteur et conserve sa propre date. Une métrique invalide devient un échec de champ, sans effacer les autres observations valides. Le merge préserve une métrique précédente lors d’une absence ou d’une photographie plus ancienne.
7. Les métriques des expositions qualifiées étaient déjà collectées, mais perdues dans la projection `automatedRecord`. L’adaptateur les expose maintenant au registre commun. Les durations disponibles restent datées et distinguées d’une durée de détention.
8. Les performances annuelles excluent une année civile non terminée. Les observations YTD restent identifiées comme telles. La convention de calcul figure dans le texte ; les historiques de cours ajustés conservent leur libellé spécifique et leurs limites dans la matrice.
9. Les PNG conservent le design porcelaine existant. Ils utilisent les comptages corrigés, séparent part et fonds pour l’encours et indiquent les devises et la couverture documentée. Les frais de swap des ETC concernés sont distingués des frais de gestion.

## Exemples

Six [avant/après complets](before-after.md) sont fournis : blockchain, World, Taïwan, obligations longues, Quality et Brent.

Pour IE000RDRMSD1, la source officielle publie désormais **40 positions hors liquidités et dérivés au 21/10/2026**, contre 39 au 03/09 dans l’ancien texte. L’encours de **262,37 M USD concerne la part au 22/10/2026**. Les trois premières positions publiées au 21/10 pèsent **33,24 %**. Le texte distingue plateformes, mineurs et technologies, puis analyse le risque commun du cycle crypto. La matrice maintient les réserves sur les preuves officielles de structure non résolues, notamment le PEA et le change.

## Contrôles et recette

Voir [validation.md](validation.md) et les [résultats navigateur par fiche](browser-results.json). Les tests de code protègent l’inventaire, les textes réellement produits, les dates, les périmètres, l’absence de substitution des collatéraux et les métriques optionnelles. Ils ne certifient pas les chiffres de l’émetteur.

Les contrôles communs régénèrent des projections : aucun de ces fichiers générés n’est inclus dans la PR sauf son générateur lorsqu’il est modifié. Les registres financiers conservent leur collecte programmée. Aucun autre outil n’est modifié dans son interface ; les consommateurs partagés des comptages continuent de lire les registres communs.

## Reliquat exact

La matrice fournit la liste fermée des 258 fiches avec les champs encore bloqués. Le nombre d’ISIN non traités est **zéro** ; le nombre de fiches encore à compléter pour une certification financière intégrale est **258**. Ce reliquat ne doit pas être confondu avec un défaut d’affichage ou de rédaction.

Il reste à obtenir ou qualifier des preuves officielles explicites des champs signalés, compléter les comptages publiés par les autres émetteurs et qualifier les calendriers annuels officiels manquants. Les sources secondaires documentées ne sont pas effacées, mais ne suffisent pas à valider la demande de preuve officielle. La tentative complémentaire sur l’API régionale française BlackRock a retourné HTTP 503 ; la page produit française accessible laisse notamment le champ PEA à « - », ce qui n’est pas une déclaration négative.

La PR doit rester un **brouillon avec certification incomplète**, sans fusion ni déploiement dans le cadre de cette demande.
