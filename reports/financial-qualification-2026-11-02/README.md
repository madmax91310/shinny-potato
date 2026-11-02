# Qualification financière ciblée — état actualisé après #1149 et #1150

Base : master `ad7daeb42a7a4887c383723215de3676a251e63e`, après #1154, #1155 et #1156 ; intégration finale de `dca0158baf6e9c4fafb27cd76572c463af8a08ae`, qui contient #1157. PR ouvertes #1061 (bloquée) et #1042 examinées et préservées. Les apports des conversations d’automatisation ne sont pas réimplémentés. Ce chantier ne change aucun transport, collecteur, workflow, calcul financier, allocation, visuel ou texte applicatif validé.

L’[archive #1149](README-1149.md), sa [matrice](matrix-1149.json) et son [CSV d’usages](usage-matrix-1149.csv) sont conservés. La [matrice courante](matrix.json) et le [CSV courant](usage-matrix.csv) sont régénérés par `node scripts/audit-financial-reserves.mjs --write`, sans audit général des 4 206 contrôles.

## Résultat par réserve

| Lot initial | Résultat courant | Correction / portée |
|---|---|---|
| 23 différences de précision déjà expliquées | Toutes préservées | Aucun changement à leurs preuves, valeurs ni seuils |
| 35 résidus cotation/NAV | 1 explication officielle nouvelle, IWDA 2025 ; 34 restent non certifiés | Le suivi exploite maintenant les captures vérifiées au lieu de rouvrir systématiquement ce cas |
| Cinq refus de borne NAV d’octobre | **Deux mois d’octobre nouvellement qualifiés**, trois encore refusés | Publication officielle concordante du 30/10 pour SmallCap 600 et World Communication ; collecte ordinaire et contrôles financiers inchangés |
| Trois politiques Amundi, dont deux réserves initiales | Politique mixte de #1149 maintenue ; affectations et acomptes 2023/2024 documentés séparément ; historique cash incomplet | Six rapports officiels supplémentaires et limites par exercice conservés, sans adjustment de rendement |

Les 58 comparaisons restent 58, sur 9 ISIN et 53 couples ISIN/année : 23 anciennes explications + 1 nouvelle + 34 réserves. Les cinq années cuivre comportent deux canaux distincts ; la clé inclut la série. Les cinq bornes d’octobre concernent cinq autres ISIN, pas cinq anomalies supplémentaires parmi les 58. Les deux parts Amundi initiales et le troisième cas découvert par #1149 restent distingués. Les lignes d’usages ne sont pas des anomalies à additionner.

## Deux mois rétablis avec des bornes communes

Lecture officielle du 2 novembre à 16:48 UTC, puis `refresh_monthly_history.py --only … --apply` sur les deux configurations existantes :

| ISIN / canal exact | Avant | Preuve officielle nouvelle | Après |
|---|---|---|---|
| IE00B2QWCY14 / `etfIE00B2QWCY14` | Dernier mois qualifié septembre ; NAV du 30/10 et rendement réinvesti du 29/10 | NAV et indice de rendement réinvesti datés du **30/10**, 6 contrôles de cash isolés, 142 contrôles mensuels d’unités et contrôles calendaires réussis | Octobre disponible ; NAV native USD, conversion EUR avec le change historique de chaque borne ; aucune distribution ajoutée une seconde fois |
| IE00BJ5JP436 / `etf_world_communication` | Même refus d’octobre | NAV et rendement réinvesti du **30/10**, 2 contrôles de cash isolés, 54 contrôles mensuels d’unités et contrôles calendaires réussis | Octobre disponible en USD ; méthodes, part et identité conservées |

La NAV SmallCap du 30/10 est **113,625838 USD** ; la série consommée en EUR utilise **101,70590584 EUR** à cette borne. La NAV Communication est **7,326780 USD**. Les niveaux réinvestis historiques restent des unités de performance normalisées sur la NAV exacte ; ils ne sont pas présentés comme des cotations historiques.

Les deux observations proviennent du **point d’entrée ordinaire**, avec sa validation de continuité, identité, devise, revenus réinvestis, frais, unités de cash et calendriers. Aucun point n’est saisi à la main dans une sortie générée ; aucun décalage du 29 au 30 n’est pratiqué. Les trois autres séries et toutes les autres observations existantes restent inchangées. Les projections nécessaires sont régénérées selon le dépôt.

[Lecture officielle actuelle des cinq bornes](followup/source-boundaries-20261102T1648.json). Les preuves détaillées de la version active restent dans les registres et `scripts/source-snapshots/monthly-automated.json` ; elles portent les empreintes des réponses réellement utilisées.

### Refus maintenus et usages indépendants

| Part | Qualification conservée | Preuve manquante |
|---|---|---|
| IE00B1XNHC34 / Clean Energy | Rendements jusqu’à septembre ; NAV brute du 30/10 indépendante | Rendement réinvesti officiel au 30/10 ou preuve équivalente de même portée ; source actuelle arrêtée au 29 |
| IE00BJ5JP097 / Financials | Même séparation | Même preuve, sans compléter artificiellement octobre |
| IE00B4556L06 / Palladium | Rendements jusqu’à septembre ; niveau qualifié du **29/10**, ancienne exclusion 2014 conservée | Cohérence NAV/rendement au 30/10 ; `No Income` ne permet pas de supprimer le contrôle de cohérence ni de redater le niveau |

Les quatre niveaux bruts du 30/10 et le niveau palladium du 29 étaient déjà admissibles avant cette reprise ; ils ne deviennent pas cinq nouveaux usages. #1150 avait rétabli le rafraîchissement de la partie antérieure en gardant octobre exclu. **La nouvelle publication du rendement du 30**, et non une tolérance, rétablit maintenant deux fenêtres mensuelles.

Le script distingue désormais le refus historique, la qualification financière conservée et le résultat du dernier producteur. Il ne déduit pas le succès d’une collecte courante de la simple présence d’un historique. Un champ `checkedAt` n’est jamais substitué à la date de NAV.

## IWDA 2025 : explication durable, sans changer les chiffres

Part **IE00B4L5Y983**, cotation **IWDA / XAMS / EUR**. Les captures officielles permettent de reconstituer chaque borne :

| Date | Clôture Euronext EUR | NAV BlackRock USD | BCE : USD pour 1 EUR |
|---|---:|---:|---:|
| 31/12/2024 | 104,16 | 107,612370 | 1,0389 |
| 31/12/2025 | 111,53 | 130,383540 | 1,1750 |

Les cours officiels reproduisent exactement la représentation float32 puis six décimales des cours consommés : 104,160004 et 111,529999. Le rendement consommé est +7,0756477698 %, contre +7,1260629787 % pour le calendrier NAV à deux décimales USD converti au change historique.

Décomposition en points de pourcentage : valorisations marché/NAV au fixing BCE **−0,0507326314**, précision du calendrier **+0,0003224944**, représentation des cours **−0,0000050720**, total **−0,0504152090**. Les facteurs `cours EUR × fixing USD/EUR / NAV USD` sont 1,0055704934 puis 1,0050942780. L’identité géométrique reconstitue l’écart ; elle ne force pas l’égalité des mesures et n’attribue pas leur différence au seul spread ou à un seul horaire.

[Manifeste et captures](followup/market-nav-evidence.json). Le chargeur contrôle les empreintes, les hôtes officiels, l’ISIN, la cotation, les dates, les colonnes, la NAV et le rendement réinvesti, les calendriers et les deux fixings. Le rapprochement ne s’applique que si les valeurs **effectivement consommées** correspondent à ces preuves. Un cours révisé, une autre place, part, devise, date, un fixing différent ou une capture manquante laissent le cas ouvert. Aucune tolérance financière n’est ajoutée ou élargie.

Le graphique BlackRock par défaut porte le ticker SWDA : ses prix ne sont pas transférés à IWDA. Les cours ici proviennent directement de la cotation Euronext exacte. Les heures historiques de valorisation ne sont pas inventées à partir d’un prospectus de 2026.

## Les 34 comparaisons non certifiées

[Bornes quotidiennes réellement observées](followup/measurement-boundaries.json) et [preuve précise manquante par cas](followup/remaining-proof-by-case.csv). Les six cotations ont été relues par le collecteur ordinaire sans modifier ses transports ; quotidien et mensuel concordent, mais ce sont deux fréquences d’un même fournisseur.

| ISIN / canal | Périodes restantes | Convention et preuve manquante |
|---|---|---|
| IE00B4L5Y983 / IWDA.AS | 2020–2024, 5 | EUR Amsterdam / NAV USD ; clôtures officielles aux deux bornes, ajustements et fixings applicables. La preuve 2025 n’est pas étendue aux autres années |
| IE00BYYHSQ67 / WQDV.L | 2020–2025, 6 | USD Londres / NAV USD distribuante ; les **13 événements USD publiés** concordent exactement entre Yahoo et BlackRock, mais les clôtures officielles et facteurs d’ajustement/horaires restent à rapprocher |
| IE00BK5BQT80 / VWCE.DE | 2020–2025, 6 | EUR Xetra / part USD accumulante, GPX portId 9679 exact ; NAV quotidiennes et clôtures officielles aux bornes. Un calendrier annuel n’est pas une observation quotidienne |
| IE00B4ND3602 / IGLN.L | 2020–2025, 6 | ETC physique, `No Income` ; clôtures officielles IGLN/USD et convention de valorisation LBMA/NAV. Le graphique SGLN ne remplace pas cette cotation |
| GB00B15KXQ89 / COPA.L | 2021–2025, 5 | Cotation USD / NAV-TR de l’ETC exact ; cours officiels, unités et horaires des bornes. Aucun rendement du benchmark Bloomberg adjacent ne remplace celui de l’ETC |
| IE00BDBRDM35 / AGGH.MI | 2020–2025, 6 | Cotation Milan EUR / NAV EUR couverte ; bornes et horaires officiels. Cinq comparaisons présentent déjà au moins une date différente. La couverture EUR ne rend pas cours et NAV identiques |

Ce sont des **preuves insuffisantes**, pas 34 erreurs financières démontrées. Ni une amplitude faible ni une différence générale de convention ne certifie le résidu. Aucune série existante indépendamment qualifiée n’est bloquée par ces seules réserves.

## Amundi : politique et cash restent distincts

Les six nouveaux PDF sont fournis par l’API documentaire publique du site Amundi. Les ISIN et pages sont conservés dans le [registre de revue](followup/amundi-evidence.json), les [rapports annuels](followup/annual-report-manifest.json) et les [semestriels](followup/semi-report-manifest.json).

| Part | Preuve documentaire acquise | Qualification permise et limite |
|---|---|---|
| FR0013412020 / ACC | Rapport annuel 2025, identité p. 39, comptes comparatifs p. 71–72 ; affectation 2025 p. 47 et 49 | Affectations et acomptes sur résultat et plus-values explicitement à zéro pour les clôtures 2023 et 2024 ; affectations ACC 2025 à zéro. Ce n’est pas une preuve de tout paiement sur l’année civile 2025. FR001400ZGO4 S-ACC reste distincte |
| FR0013412012 | Identité p. 37, comptes comparatifs p. 68–69, évolution d’actif net p. 61 | Affectations et acomptes 2023/2024 explicitement à zéro ; montants vides en 2025 non assimilés à zéro cash |
| FR0013412038 | Identité p. 38, comptes comparatifs p. 68–69 | Même preuve d’affectations et acomptes 2023/2024 à zéro ; ne prouve pas une capitalisation juridique exclusive |

Les pages scannées ont été inspectées, et les PDF font foi. Les semestriels au 31/12/2025 contiennent p. 7 des lignes de dividendes versés/à verser avec des **montants vides**. Les champs API null, le facteur NAV/ajusté voisin de cinq et le nom « Acc » ne prouvent ni versement ni absence historique.

Manquent notamment les rapports/avis complets **2019–2022**, les périodes de cash non corroborées et les versions juridiques antérieures aux documents déjà retrouvés par #1149. Aucune date d’effet n’est déduite d’un nom de fichier. La politique **capitalisation et/ou distribution** reste affichée ; aucune distribution ni correction de rendement n’est inventée. Les canaux de cotation ajustée et calendriers annuels déjà qualifiés restent disponibles indépendamment.

## Consommateurs, validation et déploiement

- Calculateur : deux nouvelles fenêtres septembre→octobre, versement unique et DCA ; méthode de réinvestissement et historique de change conservés.
- Présentation ETF, Comparatif, Performance depuis, Générateur et Duels : mêmes parts, rôles, conventions et années civiles closes. Aucune performance d’indice attribuée au fonds, aucune admission automatique ni allocation modifiée.
- Il y a X ans : niveaux bruts et dates réelles indépendants du rendement mensuel ; le palladium n’est pas redaté du 30.
- Fiches pratiques : politiques mixtes et distinction S-ACC de #1149 préservées ; textes personnalisés, brouillons et visuels inchangés.
- Tests : captures officielles et identités, refus des petites différences non prouvées, fixings datés, dates communes, distinction historique/partiel/courant, contrôles de cash et d’unités inchangés, consommateurs et compilation. Les nombres du bilan ne sont pas figés par les tests.

Validation locale réussie : compilation, budgets, 4 583 certificats et 42 fichiers publics concordants ; régressions financières, preuves officielles, politiques mixtes, 42 parts NAV et consommateurs. Chromium à 390 px : 8 vrais PNG des deux parts, copie réelle, calcul indépendant sur deux mois et égalité binaire aperçu/export. [Résultats](followup/consumer-proofs/local-results.json), exemples [SmallCap 600](followup/consumer-proofs/etfIE00B2QWCY14-lump.png) et [World Communication](followup/consumer-proofs/etf_world_communication-lump.png).

Les résultats effectifs de CI, fusion et production seront consignés dans la PR et le reçu de livraison. Une qualification locale n’est pas une preuve de déploiement. Aucun audit général des 4 206 contrôles ni recette complète des images n’est relancé.
