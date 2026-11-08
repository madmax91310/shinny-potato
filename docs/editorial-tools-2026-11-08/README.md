# Outils éditoriaux — revue du 8 novembre 2026

Base : `master` **fe9acdda6eef146527e78f7b3fb7d70414888579**. Lecture de `CLAUDE.md` et de la référence d’audit du 18 octobre. Aucun `AGENTS.md` dans l’arbre courant. PR ouvertes examinées : #1211 (enregistrement ETF), #1201 (Trade Republic), #1061 (encours iShares), conservées sans reprise de leurs fichiers. Corrections déjà livrées préservées : #1156 (« réf. »), #1042 (versions LifeStrategy), #1179 (dates/copie des guides), #1181 (prix historiques et splits).

## Périmètre et changements

- **Qui a vraiment gagné ?** : présentation des choix uniquement. « ETF PEA · … · calendriers NAV » → « ETF PEA · … » ; « … · ETF et ETC du registre » → exposition seule ; « … · VL » retiré des titres de choix. Identifiants, noms complets, parts, devises et méthodes restent disponibles ; les méthodes se lisent dans les détails. Les familles et filtres déjà présents sont conservés. Aucun nouveau classement, univers, calcul, libellé de publication ou dessin.
- **Guides** : tous les 17 textes des 16 groupes examinés, y compris les deux versions LifeStrategy et les deux images. Six textes remplacent des chiffres et affirmations non datés par des champs des registres communs qualifiés. Les autres guides gardent leurs revues et dates antérieures : il ne s’agit pas de nouvelles certifications externes de chaque affirmation. `guides.json` précise chaque entrée et sa portée.
- **Présentation d’ETF** : rédaction commune du S&P 500 et variantes, explication du swap et des principales lignes ; noms éditoriaux avec classes d’actions distinctes. Aucune observation brute renommée. Les petits blocs gagnent en largeur et en hauteur utile, avec un interligne adapté, dans le même fond et la même hiérarchie.
- **Il y a X ans** : retrait du second nom dans les rendus sans logo ; multiplicateur adapté à la hausse, avant arrondi du pourcentage. +638,9 % → « son prix a été multiplié par environ 7,39 ». Les observations, prix, dates, exclusions et logos sont inchangés. « Aujourd’hui » reste dans l’image, les sources restent hors image.

Le calendrier et les autres outils ne sont pas modifiés. Aucun ajout d’instrument, aucune collecte programmée changée, aucun message sur X.

## Revue des guides et limites financières

À données et date du 08/11, le contrôle de réutilisation passe de neuf à trois groupes à revoir. Ce nombre décrit la politique de la banque, pas une certification financière exhaustive.

| Texte | Traitement |
|---|---|
| LifeStrategy court | Années civiles 2024–2025 et sources datées préservées ; aucun classement actuel inventé. |
| Multi-actifs original | Cinq produits, allocations cibles, variante et revue du 12/10 conservés. |
| Sectoriels PEA | Treize parts, sources et revue du 24/10 conservées ; frais communs déjà automatisés. |
| Actifs | Quatre stratégies et revue du 13/10 conservées ; pas de fausse nouvelle vérification des quatre parts hors registre. |
| Levier | Levier quotidien, exemple arithmétique, cinq parts et revue du 13/10 conservés. |
| Matières premières | ETF/ETC, contrats à terme, frais de gestion/swap et revue du 12/10 conservés. |
| Covered call | Gestion indicielle/active et revue du 12/10 conservées ; distributions variables, aucune promesse de rendement. |
| Or | Métal, titres de dette, minières et revue du 12/10 conservés. |
| 10, exemples PEA/CTO | Comptages d’indices datés, parts et frais communs ; émergents ESG distincts de l’indice classique ; descriptions S&P/Nasdaq/STOXX corrigées. |
| 17, expositions PEA | Prix de part approximatif et superlatifs non prouvés retirés. Ancienne affirmation PEA de LU1681046931 retirée seulement de la sélection PEA ; référence et limite documentées. |
| 21, Europe | Encours non datés et exclusivités retirés ; années 2023–2025 conservées et raccordées aux parts exactes en EUR, revenus réinvestis. MSCI Europe 2025 : 19,42 → 19,41 %. Capitalisation/distribution distinguées. |
| 27, World PEA | Trois parts PEA documentées, liste explicitement non exhaustive. Deux anciennes parts EUR Dist/USD Acc restent identifiées dans les notes/sources ; leurs assertions PEA non prouvées et encours non datés sont retirés. Aucun statut négatif déduit d’une absence de preuve. Risque de fermeture/liquidité reformulé sans seuil automatique de 100 M€. |
| 32, indices mondiaux | Comptages et pays issus des registres d’indices avec leurs dates, frais des parts exactes ; VWCE 0,19 → 0,14 %. Ancien YTD et performances sans bornes retirés, sans les transformer en classements actuels. |
| 48, sept ETF PEA | Les sept ISIN sont conservés et rapprochés des frais, distributions et preuves PEA communes ; noms et cotations non recopiés en dur dans la nouvelle sortie. |
| 49, vingt ETF | Image conservée et signalée comme archive. Seize parts raccordées aux registres ; Global X Data Center et Lithium relus sur les pages officielles (0,50/0,60 %). WisdomTree Cybersecurity et Global X Cloud restent à vérifier. |
| 50, dividendes | Image conservée et signalée comme archive. Quatre parts communes et Global X SuperDividend officiel rapprochés (0,45 %, mensuel variable). Frais/parts Xtrackers, Fidelity et WisdomTree restent à vérifier. |
| 37, ancien classement | Archive classée « Août 2026 » explicitement identifiée (mois de classement, pas date des observations) ; bornes de rendement et univers inconnus conservés comme restriction. Aucun renouvellement des valeurs ni de leur période. |

`sources.json` conserve URL, empreinte et champs effectivement relus. Les réponses 403/404, la page DWS générique et le HTML Fidelity sans preuve exploitable ne sont pas des succès financiers. Les preuves PEA et les caractéristiques absentes ne sont pas inventées. Les vérifications manuelles futures portent toujours sur le texte et la date exacts, jamais sur une simple ouverture de la page.

## Vérifications exhaustives

- `test-editorial-tools-20261108.mjs` : 17 variantes, 16 groupes, 156 sélections, 1 077 entrées de choix, frais des six guides raccordés, PEA explicites, archives, classes A/C et seuils mathématiques.
- `test-etf-presentation-quality.mjs` : 279 textes, identité, sources, devises et distinction indice/panier de substitution.
- `audit-editorial-rendering-20261108.mjs` : **279 fiches et 709 anniversaires admissibles** rendus dans Chromium ; aucune troncature ou collision de texte ; titre anniversaire unique ; logos chargés sans recoloration. 601 rendus sans logo officiel chargé, dont les scènes dédiées déjà approuvées ; aucun nouveau logo créé. Taille minimale mesurée dans les deux petits blocs ETF : **32 px**. Détail par actif dans `rendering.json`. Le contrôle couvre les actifs admissibles, pas les actifs exclus financièrement.
- Suites de validité/stockage/curation, classements, fenêtres financières, détails des comparatifs et cohérence des frais ; build complet, budgets inchangés, couverture et manifeste publics.

## Recette visuelle ciblée et livraison

Les tests navigateur et les inspections humaines des aperçus et PNG sont consignés dans le reçu final. Ils ne doivent pas être assimilés à une inspection visuelle des 988 rendus du contrôle exhaustif. La publication et son identité réellement servie sont vérifiées séparément après fusion.

### Reçu local final

`npm run build` réussi (précontrôles inclus), sans relèvement de budget : 4 583 certificats et 42 fichiers publics cohérents. Les projections régénérées sont exclues du commit. Lint ciblé sans avertissement ; cohérence des frais sur 730 lignes / 280 ISIN réussie. Fenêtres financières et comparatifs conservent leurs refus et conventions. La régression des anciens brouillons des guides de marché conserve leur exigence de relecture quotidienne ; elle n’est pas prolongée par la nouvelle revue du texte canonique.

Chromium réel, build de production, **1440 et 390 px** : 17 textes/variantes affichés et contrôlés par largeur, copie exacte des guides autorisés ; dates saisies à l’événement input, vérification d’un texte inchangé, invalidation après modification du texte ou de la date, suivi de publication, effacement et rechargement, ancien brouillon vérifié la veille refusé. **30 PNG téléchargés, tous identiques aux aperçus** : deux images d’archives, neuf fiches représentatives et quatre anniversaires, sur les deux largeurs. Réception détaillée dans `browser.json`. Tests supplémentaires de stockage corrompu/refusé, quota et conflit entre onglets à 1440/390 réussis. Recette des classements à 1440/390 réussie, sans modification de calcul ni de texte de publication.

Inspection visuelle ciblée des PNG et aperçus : S&P 500 PEA, TOPIX couvert avec bloc dense, nom le plus long (technologie mondiale distribuante), covered call synthétique distribuant, Keysight dix ans, fonds ESE avec identité complète et « Aujourd’hui » ; les deux images statiques de guides ont été relues intégralement. Les autres rendus ont fait l’objet des contrôles automatisés décrits plus haut, pas d’une prétendue inspection humaine exhaustive. Les deux PNG et deux aperçus mobiles joints illustrent les cas longs et le doublon corrigé.

Firefox et WebKit ne sont pas revendiqués dans cette recette locale. Le contrôle de production reste distinct du build local.

### Rapprochement avec les collectes concurrentes et contrats de secours

L’union avec `master` d451cd6, incluant #1211 et ses collectes, se fusionne sans conflit. Les sorties complètes des 17 guides et 279 présentations sont identiques à celles qualifiées ci-dessus. Build de l’union réussi avec ses propres dépendances et les budgets d’origine ; 30 PNG à nouveau téléchargés et comparés sur 1440/390 (`integration-browser.json`). Le lien vers les dépendances d’un autre checkout faussait les longueurs de modules préminifiés comptées par l’audit ; aucun budget ni fonction produit n’a été modifié pour contourner cette mesure.

Le premier portail GitHub a relevé deux attentes obsolètes du double nom dans les tests de secours. Ces assertions exigent désormais un nom unique **par rendu**. La présence effective du logo lors de la reprise est également contrôlée, distinctement du compte des noms. La recette complète corrigée `test-anniversary-logos.mjs` passe sur le build isolé : 224 aperçus, 448 PNG réels, pixels et texte/layout concordants, logos manquants/corrompus, reprise et chargements retardés. Le scénario précis de `test-anniversary-art.mjs` a été rejoué avec son callback réel (`fallback-replay.json`) ; son ancien contrôle exigeant deux noms avait été atteint après les rendus exhaustifs dans GitHub. Une tentative locale complète a rencontré un rechargement du serveur de développement pendant une édition du mois d’archive ; elle n’est pas revendiquée comme réussie. La nouvelle CI doit rejouer intégralement ce contrôle sur un arbre immuable.

Le mois « Août 2026 » du guide 37 reste une catégorie d’archive, sans prétendre dater la réception du document ou les deux bornes du rendement. Son avertissement et le refus de copie par défaut ont été vérifiés dans le build à 1440/390.
