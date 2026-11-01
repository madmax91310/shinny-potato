# DCA — livraison du 1er novembre 2026

Base relue : `88f92ed` sur master. Aucune AGENTS.md dans le dépôt. Consignes : CLAUDE.md et audit du 18 octobre ; état requalifié depuis le code et les registres actuels. PR #1086 fusionnée : publications déjà triées, saisie encore en ordre d'origine. PR concurrentes #1108 (banque de tweets), #1042 (Guide court), #1061 (encours iShares PEA explicitement bloqués) examinées ; aucun de leurs lots incorporé ici.

## Livré

- DCA limité à huit positions, compteur et ajout désactivé à huit, garde supplémentaire dans le gestionnaire d'ajout. Neuvième refusée par le moteur, texte automatique et génération PNG. Copie et validation de participation bloquées pour un ancien portefeuille trop long.
- Brouillons, sauvegardes et JSON historiques de 9 à 50 positions intégralement ouverts pour correction, sans troncature. Sauvegarde et export de conservation disponibles ; seules les sorties de publication sont bloquées. Limite des 50 sauvegardes nommées distincte de celle des positions. Poids, versements, texte et options inchangés ; consentement révoqué à la restauration/import.
- Deux listes d'édition reliées au même tableau de positions : allocation par poids, versements par montants. Ordre figé pendant la saisie et entre champs du même groupe ; reclassement à la sortie du groupe ou Entrée. Remplacement/retrait d’un actif : ordre explicitement validé même lorsque le contrôle focalisé disparaît. Identités React stables ; égalités dans l'ordre canonique, sans modifier les données enregistrées. Les zéros restent éditables, les flux nuls restent absents des publications mensuelles.
- Historique unique `el-dca-used-v1`, schéma v2 `{version:2,entries:[{id,publishedAt}]}`. Lecture des anciens tableaux sans écriture au montage ; dates anciennes nulles. Marquer publié, date affichée, annulation et filtre des non-publiés. Copie/téléchargement sans marquage. Protection contre corruption, accès refusé, quota et changement du snapshot entre onglets conservée. Indication de persistance locale.
- Style bleu nuit/crème/jaune conservé. À 5–8 lignes : espace vertical réaffecté, libellés sur deux lignes, légende d'allocation agrandie. Jusqu'à huit actifs détenus distinctement identifiables. Aucun ajout de date/source/note au PNG. Le regroupement au-delà de huit reste réservé au parcours d'expositions, qui conserve explicitement sa capacité de 50.

## Données : nouveau constat, sans reprendre les anciens compteurs

Inventaire initial (`holdings-inventory-initial.json.gz`) : 131 compositions complètes et 87 partielles. Nouveau calcul après rebase sur `b32a7c7` et les collectes exactes de master (`holdings-inventory.json.gz`), via `build-dca-exposures.mjs` : 150 profils, 673 références sélectionnables. Classes de diagnostic : 127 compositions qualifiées complètes, 91 partielles, 454 sans composition de fonds applicable, une indisponible ; ces classes ne mesurent pas un taux d'automatisation. Onze références partielles sont effectivement utilisées dans les profils préparés (les occurrences ne sont pas une mesure d'usage des abonnés).

| Support | Occurrences profils | Poids identifié / portefeuille total | Base et photographie conservées |
| --- | ---: | ---: | --- |
| iShares MSCI ACWI UCITS ETF USD (Acc) · `IE00B6R52259` | 33 | 99.637690 % | fund · 2026-10-30 |
| Xtrackers MSCI Emerging Markets UCITS ETF · `IE00BTJRMP35` | 13 | 99.411629 % | fund · 2026-10-29 |
| iShares MSCI World Small Cap UCITS ETF · `IE00BF4RFH31` | 8 | 99.503660 % | fund · 2026-10-30 |
| iShares Global Infrastructure UCITS ETF USD (Dist) · `IE00B1FZS467` | 6 | 99.317830 % | fund · 2026-10-30 |
| Amundi FTSE EPRA NAREIT Global UCITS ETF · `LU1437018838` | 3 | 99.494177 % | fund · 2026-10-28 |
| iShares Global Timber & Forestry UCITS ETF · `IE00B27YCF74` | 2 | 99.486550 % | fund · 2026-10-30 |
| Amundi PEA Immobilier Europe UCITS ETF Acc · `FR0011869304` | 1 | 45.178547 % | index · 2026-10-28 |
| iShares MSCI EM Small Cap UCITS ETF USD (Dist) · `IE00B3F81G20` | 1 | 99.615440 % | fund · 2026-10-30 |
| iShares MSCI World Consumer Staples Sector Advanced UCITS ETF · `IE00BJ5JP329` | 1 | 99.142220 % | fund · 2026-10-30 |
| iShares MSCI EM ex-China UCITS ETF (Acc) · `IE00BMG6Z448` | 1 | 99.514840 % | fund · 2026-10-30 |
| iShares Edge MSCI World Value Factor UCITS ETF · `IE00BP3QZB59` | 1 | 99.488750 % | fund · 2026-10-30 |

La collecte partagée `collect_dca_complete_holdings.py --only IE00B6R52259 IE00BF4RFH31 IE00B3F81G20` a été réellement rejouée. Trois acquisitions officielles validées, photographies du 30 octobre ; résultats et empreintes dans `priority-source-recheck.json.gz`. Les tentatives initiales sans dépendances Python ont été rejetées, puis refaites après installation des mêmes dépendances que le workflow. Aucune date du registre n'a été renouvelée par ces tentatives. Ce contrôle de source ne vaut ni enregistrement ni publication de nouvelles données : la collecte quotidienne reste leur producteur.

- ACWI : DUMMY Sinopac sans ISIN officiel ; Small Cap : CVR Akero sans ISIN. Ne pas les fusionner avec l'action ordinaire. Résidus de trésorerie conservés dans la réconciliation native.
- EM Small Cap : HEG GRAPHITE LTD reste sans ISIN et sans ticker dans le livre natif (Bse Ltd, INR). Le [document officiel HEG](https://hegltd.com/wp-content/uploads/2025/03/Pre-and-Post-amalgamation-share-holding-pattern-of-unlisted-entity.pdf) publie le candidat INE0Y9J01020 après division, distinct de l'ancien INE0Y9J01012 ; la [page officielle](https://hegltd.com/) indique le changement de nom. Les recherches indépendantes sur les places n'ont pas fourni de correspondance avec un identifiant natif de cette ligne. Le nom seul ne justifie pas son attribution ; aucun alias forcé. La nouvelle observation conserve encore 0,0216 % non identifié.
- Emerging, Infrastructure, REIT mondial, Timber, Staples et Value : titres identifiés mais poids actions inférieur à la totalité du fonds (liquidités/exclusions). Ce sont des compositions financières partielles dans ce périmètre, pas des identités à inventer ni un motif de renormalisation.
- Immobilier PEA : référence économique d'indice partielle, distincte des détentions du fonds synthétique et de son panier de substitution. Europe 600/Nasdaq PEA/immobilier PEA : obtenir le benchmark exact officiel complet, daté, pondéré et identifié ; continuer la surveillance des routes communes existantes. Ne pas insérer le panier du fonds.
- Hors références prioritaires ci-dessus : Battery/GGRA, Uranium, World Hedged brut/net, Quantum et Merck conservent leurs limites documentées par les producteurs communs et le bilan consolidé du 31 octobre. Elles ne sont pas présentées comme des réparations dans ce lot. Aucun seuil, poids, contrôle de fraîcheur ou dernière photographie valide modifié.

## Recette

Contrôles et artefacts dans `checks/`. Tests moteur, historique, actions/transport et régression expositions ; build avec architecture, budgets et manifeste. Chromium en 1440 et 390 px : ajout de la huitième position, refus de la neuvième, tri indépendant sans perte de focus, égalités, sauvegarde/restauration/import surdimensionnés sans perte, texte personnalisé, anciens marquages, dates/annulation et conflits. PNG téléchargés réellement et comparés octet pour octet à l'aperçu. Matrice de 636 rendus : 150 profils × quatre modes, cas 1/2/4/8 longs, petits poids, égalités, zéros, gros montants, anonymes et ancien parcours 50 positions. Les images ont également été inspectées visuellement. Les arrondis d'affichage existants par plus forts restes sont conservés ; les données exactes ne changent pas.

## Réparation du portail CI

Les passages du portail de la PR #1110 ont révélé trois tests devenus incompatibles avec les collectes légitimes : `test_index_composition_gate.py` jugeait les photographies du 30 octobre depuis un 14 octobre figé ; `test-data-review-reminder.mjs` supposait que les 28 investisseurs restaient tous au même trimestre, alors que Gayner était déjà passé au suivant. Le correctif équivalent d’horloge a été fusionné indépendamment via #1112 pendant ce travail ; sa version et ses tests de bornes J/J−75/J+1/J−76 sont intégralement repris de master, sans seconde implémentation. Échéances individuelles selon le trimestre réellement publié et fenêtre exacte de sept jours dans le second. `test-gold-consumers.mjs` bornait aussi à tort le personnalisé EUR au mois de l’or : son assertion suit maintenant la véritable borne INSEE, indépendamment de la cadence de l’or. Aucune donnée ni politique de fraîcheur modifiée. Les rejets de compositions futures/périmées et la conservation des dernières valeurs restent exercés.

Le workflow de fiches d’indices 41317496933 a également refusé le nouveau STOXX 600 pour dates incompatibles entre positions, pays et secteurs ; les dernières données admises restent conservées. Ce refus de source n’est pas contourné par le parcours DCA.

Publication : la PR, les contrôles requis, le workflow Pages et le SHA public sont à consigner après livraison. Les blocages de source restent ouverts : aucune déclaration d'automatisation complète.
