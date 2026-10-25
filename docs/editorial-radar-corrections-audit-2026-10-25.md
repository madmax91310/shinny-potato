# Radar : corrections de l’audit du 25 octobre 2026

Les nouveautés déjà accessibles attendaient derrière des archives, certaines enquêtes étaient rejetées ou survalorisées et les reprises restaient dispersées. Ce lot corrige la chaîne existante, sans nouveau catalogue financier, modèle génératif, service payant ou nouvelle authentification. Le seul point d’entrée supplémentaire est la page officielle des tarifs LBP, demandée comme cas de contrôle d’une banque déjà suivie.

Base de travail : master `9012ec7a`, incluant #947, #949, #950 et la correction de l’horloge navigateur #952. Aucune PR concurrente ouverte au démarrage. Pendant le lot, #956 a été fusionnée et #957/#958 ont été examinées : elles touchent la supervision partagée et une vérification ETF isolée, sans recouvrement avec les fichiers Radar modifiés. Rebase avant livraison sur master `354a6762`. Les trois livrables de l’audit conservés dans la session (`rapport.md` de la session précédente, correspondant au rapport mentionné, `echantillon.csv`, `matrice-sources.csv`) ont été relus. Les cinq défauts de logique étaient encore présents. Aucun collecteur financier ou registre partagé n’est modifié.

**Implémenté et vérifié localement ; qualification réseau en lecture seule et CI de PR. Pas encore déployé.** La réception des notifications sur téléphone n’est pas vérifiée ; aucun envoi de test ni publication X.

## Les cinq problèmes et leur correction

| Problème confirmé | Correction | Preuve et limite |
|---|---|---|
| Première extraction récente concurrencée par les archives/recontrôles | Réservation de capacité avant extraction, sur date et thème de l’inventaire ; vieillissement et progression des autres sources | Scénario représentatif : première tentative des agios au passage 5 → 1, avec la même enveloppe de 12 documents. Simulation d’ordre, pas mesure de neuf heures gagnées en production. |
| Qualification et classement trop liés à la famille | Nature du fait et population avant score : observation, enquête déclarative, intentions, prévision, enquête/financement professionnels | BPCE devient exploitable comme enquête ; CAT « avant impôt » admissible ; agios classés Frais ; promoteurs/prévisions à suivre, financement professionnel exclu. |
| Catégorie INSEE et marques Xetra fermées | Catégories 12 et 5, recherche bornée de dossiers ; tableaux ETF interprétés par colonnes, sans émetteur préenregistré | Dossier 8996928 découvert depuis l’API puis extrait en réseau réel. Six lignes sur chacun des deux communiqués Xetra rejoués. PDF associé Amundi exploité. |
| Références bancaires trop étroites et impossibilité de qualifier ajouts/retraits | Documents tarifaires et conditions nommées liés aux entrées ; snapshots par produit/périmètre ; changements et ajouts comparables, retraits explicitement documentés | Quatre références conservées, six documents LBP 2026/2027 qualifiés localement. Premières observations silencieuses. Pas de détection de changement réel bancaire nouveau prétendue. |
| Original, reprise et étapes dispersés | Référence au corps utile, corroboration de faits, original prioritaire ; dossiers de versions et liens entre étapes | INSEE/MoneyVox regroupés ; deux versions CSA ensemble ; Amundi relie la cotation Xetra avec ses trois produits, tandis que le bulletin mixte conserve Fidelity/Ossiam. |

## File, coût et objectif de traitement

L’objectif interne est une **première tentative au prochain passage admissible** pour une publication pertinente récente (date documentée dans les sept derniers jours), dans la capacité disponible et réservée. Ce n’est ni un score éditorial final ni une garantie de disponibilité sous trente minutes. Une tentative en panne est distinguée d’une extraction disponible.

- Jusqu’aux deux tiers des places vont aux premières extractions récentes, avant les archives et recontrôles. Les documents restants sont servis par source, avec vieillissement à 24 h ; un flux permanent de nouveautés ne bloque pas les archives. Même avec une capacité d’un seul document, un passage sur trois protège leur progression.
- Le plafond réseau reste borné à 24 documents ; l’admission dépend du p90 des 120 dernières durées et de 75 % de l’enveloppe de 90 secondes. Démarrage conservateur à 5 secondes/document, soit 13 admissions. Le plafond n’est pas un objectif de consommation. La limite temporelle conserve les documents non tentés.
- L’audit mesurait 12 documents et inventaires en environ 25,4 s. Les qualifications locales de ce lot ont traité 12 documents en environ 15 s puis 11 en environ 14 s sur le sous-ensemble testé. Ces mesures ne décrivent pas la charge totale du producteur financier.
- Le scénario comparatif reprend les proportions du stock audité : AMF 139, Amundi 50, INSEE 38, Invesco 24, MoneyVox 10, puis l’article agios. À enveloppe identique de 12, le nouvel ordre tente celui-ci dès le premier passage ; l’ancien ordre au cinquième. Le test d’arrivées continues vérifie aussi la progression intégrale du stock d’archives.
- `recentEligible`, `recentFirstAttempted`, `recentDeferred`, capacité, p90, requêtes, octets, durée et ancienneté sont persistés. Les 512 derniers relevés de file conservent le type de déclenchement et l’identifiant du run. Les différés restent dans la file et sont visibles dans les détails de supervision.

Les délais sont séparés : publication → découverte seulement avec un instant prouvé ; découverte → première tentative ; découverte → disponibilité ; épisode de panne → reprise. Une ancienne date `attemptedAt` ne devient pas une première tentative certaine si plusieurs essais historiques existent. Les dates seules et les indices de recherche ne deviennent jamais des heures de publication.

La garde Europe/Paris et le cron `7,37 6-19 * * *` sont conservés : 08 h à 20 h incluses, changements d’heure compris. Le verrou de production est déplacé sur le job `update` : les workflows dont ce job est ignoré ne prennent plus sa file de concurrence. Les producteurs réels restent sérialisés, sans annuler une publication ou une reprise de notification en cours.

Le producteur enregistre les **vrais** runs `schedule`, leur code exécuté, création et démarrage du job, intervalle entre créations et attente observable avant producteur. Push et lancements manuels ne prouvent pas le cron. GitHub ne fournit pas l’instant nominal individuel d’un déclenchement : ce délai reste explicitement inconnu. Les appels à l’API Actions utilisent le jeton déjà fourni, avec permission de lecture, sans nouveau secret.

Contrôle de production consulté : run [40204955299](https://github.com/madmax91310/shinny-potato/actions/runs/40204955299), `schedule` du 25 à 15:01 UTC, job démarré 15:04, publication réussie, erreurs partielles signalées. Il utilise le code antérieur à ce lot. Les intervalles observés ne démontrent pas une cadence régulière. Les nouvelles séries de métriques se constitueront après déploiement ; **aucune mesure sur une semaine n’est annoncée comme réalisée**.

## Qualification et score

Les poids 30/25/20/15/10, seuils de priorité/alerte et conditions de fiabilité restent inchangés. Aucun seuil financier n’est abaissé.

`qualifyRadarFact` décrit la nature de l’information et sa population. Les prévisions et enquêtes de professionnels sont à suivre. Les intentions et perceptions des ménages restent exploitables comme telles. Une anticipation apporte une information sur une déclaration, pas la preuve d’un effet réalisé sur l’argent : son facteur d’impact est 0,2 et sa comparaison observée reste inconnue. Une enquête déclarative hors intentions utilise 0,5. Une population professionnelle utilise 0,2 en portée ménages. Ces facteurs sont configurables dans `SCORE_RULES` et appliqués à tous les cas de même nature, sans identifiant d’article ni prétention de calibration empirique.

La mention de rendement « avant/après impôt » et une convention de prix TTC n’excluent plus leur sujet principal. Les sujets fiscaux, prestations sociales et aides au logement restent exclus. Une méthode évoquant une redistribution ne transforme pas une étude de niveau de vie en actualité de prestation. Le PTZ des ménages demeure admissible ; un prêt professionnel Bpifrance n’est pas un crédit immobilier des particuliers.

Les vues récentes utilisent la publication (ou le constat prouvé/correction datée), en plus de la détection. Une archive collectée aujourd’hui reste dans l’historique, avec ses dates ; elle n’est pas présentée comme une nouvelle publication.

## INSEE et ETF

La recherche INSEE visite au plus deux pages de 30 résultats des catégories 12/5, une page de 30 dossiers ménages et une page de 30 logements anciens. Les RSS restent indépendants. Le dossier 8996928 porte aussi **`diffusion: false` dans l’index**, malgré sa page publique et datée : ce drapeau n’est plus une preuve d’absence de publication. Type, thème, catégorie et date sont contrôlés ; la date du document reste requise après découverte. Les références bibliographiques ou tables ne sont pas promues par leur simple présence dans l’index.

Le nouveau parseur lit les colonnes « Name », « ISIN/Ticker », « Asset class », « Use of profits/Product costs » et leurs variantes, même lorsque les en-têtes sont des `td`. Une ligne demeure la frontière d’association. ETF UCITS, ETP/ETC/ETN et lignes incomplètes sont distingués. Les ISIN manquants/ambigus, cellules fusionnées et structures non qualifiables sont signalés ; le document reste `partial`, avec reprise bornée, pas entièrement traité.

Les deux Xetra du 21 et du 16 octobre donnent chacun six produits/parts. Les noms Fidelity, Ossiam, L&G, UniActive et Janus Henderson ne dépendent plus d’une liste de marques. Les frais restent ceux de la ligne. PEA, commercialisation et disponibilité courtier restent inconnus en l’absence de preuve.

L’annonce Amundi du 23 contient un lien officiel vers un PDF dont les noms longs sont répartis sur plusieurs lignes. Une seule pièce officielle non ambiguë peut compléter le HTML, dans le même budget mesuré. Le tableau permet les trois associations nom/ISIN/0,25 %. La base « frais de gestion et coûts administratifs » est conservée ; elle ne devient pas l’ensemble des coûts de négociation. Un PDF défaillant ne fait pas inventer ses caractéristiques.

Les anciens rejets redevenus admissibles, les articles journalistiques, Xetra et les annonces sans noms concernés passent par une requalification versionnée. Pas de réinitialisation générale. Les nouveaux faits issus de cette migration sont silencieux, les identifiants/accusés historiques conservés.

## Références bancaires et preuves de changement

Les pages Fortuneo/Bourso déjà suivies découvrent les brochures et conditions officielles nommées liées, sans parcours intégral de leur site. La page [tarifs LBP](https://www.labanquepostale.fr/particulier/footer/tarifs.html) distingue particuliers, outre-mer et documents d’information tarifaire 2026/2027. Les entrées restent des références silencieuses, pas des lancements.

Un nom de fichier, changement de HTML, ordre des lignes ou empreinte PDF ne suffit pas. L’identité de référence et le périmètre sont distincts de l’URL. Une clause conserve son produit lorsqu’il est univoque, sa clientèle, sa base de calcul, les conditions et dates citées ; les inconnues restent inconnues. Un retrait en France ne prouve pas la résidence française du client. Une clause multi-produit demeure une citation complète sans répartition inventée.

Les montants, périodicités et clientèles comparables peuvent changer. Un ajout requiert un contexte produit déjà suivi et une couverture stable. Un retrait requiert une mention explicite concernant la même clause ; une simple disparition ne le prouve jamais. Une omission inexpliquée conserve la dernière référence valide et une version candidate signalée comme partielle, afin que son retour ne provoque pas une fausse nouvelle clause. La référence antérieure au changement de parseur est conservée.

Sans publication datée, le sujet indique **« changement observé entre deux contrôles »**, leurs dates, et la date d’effet seulement si documentée. La première comparaison de l’ancien et du nouveau format initialise silencieusement le nouveau contrat.

## Regroupement, historique et notifications

Les références sont cherchées dans le corps utile, après retrait de navigation et éléments annexes. Un lien n’est pas une confirmation automatique : il faut l’original extrait, une date compatible et des faits corroborés. Le cas salarial peut aussi être rapproché par l’étude INSEE attribuée, la même date et au moins deux chiffres distincts vérifiés. Une analyse indépendante ou des faits financiers supplémentaires demeurent séparés.

La preuve principale est l’original qualifié ; la contribution du média reste accessible, avec son attribution. Les variantes CSA de la même publication/période sont regroupées, tout en conservant les métadonnées contradictoires de date et les IDs.

Une gamme Amundi peut être reliée à la cotation documentée de son ensemble de produits. Il faut une gamme complète nommée, un lancement explicite, une place documentée et des dates compatibles ; ni un thème ni un ISIN commun ne suffisent. Le bulletin Xetra mixte reste une publication autonome pour les autres émetteurs. Les étapes gardent type, source, date et lien propre. La présentation d’un dossier ne crée pas un lancement ou une disponibilité commerciale.

La préparation des notifications conserve la qualification partagée et les étapes distinctes. Reprises déjà acquittées, archives et migrations ne sont pas renotifiées. Les simulations du corpus produisent zéro envoi admissible. Aucune API d’envoi n’est utilisée par les scripts de qualification ou de recette.

## Avant/après sur l’échantillon

Le fichier `scripts/fixtures/radar-audit/audit-sample.json` conserve les **19 publications datées et le contrôle CSA à date incertaine**, sans ajouter des cas au dénominateur. Le rejeu conserve tous les anciens IDs et expose séparément les contrôles promoteurs/prévisions/PTZ professionnel. Son tableau généré est joint aux artefacts CI.

| Cas | Avant audit | Après / limite |
|---|---|---|
| B01 — [Tarifs 2027 Banque Postale](https://www.moneyvox.fr/tarif-bancaire/actualites/110889/carte-bancaires-retraits-decouverts-ce-qui-change-pour-les-tarifs-de-la-banque-postale-au-1er-janvier-2027) | Absent | Référence officielle des tarifs LBP 2027 qualifiée en collecte locale réelle ; première observation silencieuse. Article historique non découvert par ce raccordement. |
| B02 — [Suppression du minimum forfaitaire d’agios](https://www.moneyvox.fr/tarif-bancaire/actualites/110947/la-banque-postale-cic-caisse-epargne-le-minimum-forfaitaire-agios-en-voie-de-disparition) | Restitué | Restitué, classé Frais. Priorité de première extraction vérifiée dans le scénario de file ; aucune mesure de production après déploiement. |
| B03 — [Placement N26 accessible dès 1 euro](https://www.moneyvox.fr/banque-en-ligne/actualites/108839/n26-ce-nouveau-placement-est-desormais-accessible-a-tous-les-clients-des-1-euro) | Absent | Inchangé : N26 non raccordé et article hors du RSS courant. |
| B04 — [Incident Revolut et résolution](https://www.moneyvox.fr/banque-en-ligne/actualites/110904/paiements-par-carte-retraits-virements-une-panne-majeure-touche-les-services-de-revolut) | Non restitué ; reprise en file | Inchangé pour l’incident initial ; reprise préexistante à traiter. Aucune réactivation d’un incident résolu. |
| B05 — [BoursoBank prime jusqu’à 320 euros](https://www.moneyvox.fr/banque-en-ligne/actualites/110843/boursobank-une-prime-exceptionnelle-jusqua-320-euros-cash-pour-les-nouveaux-clients) | Absent | Inchangé : offre expirée avant activation ; aucune alerte rétrospective. |
| B07 — [Enquête comptes à terme](https://www.moneyvox.fr/placement/actualites/110835/des-taux-jusqua-4-avant-impot-quelle-banque-propose-le-meilleur-compte-a-terme-sans-risque) | Absent ; rejet prévisible confirmé hors ligne | Qualification corrigée : titre admissible. Découverte historique toujours absente. |
| B08 — [Difficulté des Français à épargner](https://www.moneyvox.fr/placement/actualites/110887/epargne-pourquoi-de-plus-en-plus-de-francais-peinent-a-mettre-de-argent-de-cote) | Découvert puis rejeté | Rejet corrigé, enquête de ménages admissible ; intentions et perceptions distinctes d’un changement effectif. |
| S01 — [Salaires du privé 2025](https://www.insee.fr/fr/statistiques/9087193) | Restitué, doublon presse ultérieur | Original INSEE et reprise attribuée dans un dossier, original comme preuve principale ; IDs conservés. |
| S02 — [Inflation septembre résultats définitifs](https://www.insee.fr/fr/statistiques/9080209) | Restitué | Maintenu, dates et période préservées ; pas de nouvelle notification. |
| S03 — [Indice de référence des loyers T3](https://www.insee.fr/fr/statistiques/9081853) | Restitué | Maintenu, dates et périmètres préservés ; pas de nouvelle notification. |
| S04 — [Pouvoir d’achat, inégalités et pauvreté](https://www.insee.fr/fr/statistiques/8996928) | Absent | Dossier extrait en rejeu ; découverte depuis l’API et extraction également vérifiées dans la qualification réseau séparée. |
| I01 — [Crédit Logement CSA septembre](https://lobservatoire.creditlogement.fr/publications/analyse-marche-immobilier-septembre-2026/) | Restitué avec réserve de date et doublon historique | Versions à suivre/enrichie regroupées par publication et période ; première mise en ligne reste incertaine, hors dénominateur. |
| I02 — [Sondage encadrement des loyers](https://www.quechoisir.org/action-que-choisir-ensemble-encadrement-des-loyers-plus-de-huit-francais-sur-dix-favorable-que-choisir-ensemble-appelle-le-senat-a-le-perenniser-n178718/) | Absent | Inchangé : source non raccordée, aucune extension générale. |
| E01 — [Amundi trois ETF thématiques IA](https://www.amundietf.fr/fr/professionnels/a-propos/news/investors-notice/amundi-renforce-sa-gamme-d-etf-thematiques-lies-a-l-ia) | Restitué | Trois produits groupés, dates et inconnues préservées. |
| E02 — [Amundi trois ETF actions actifs](https://presse.credit-agricole.com/amundi-elargit-sa-gamme-detf-actifs-avec-trois-nouveaux-etf-actifs-actions) | Restitué, doublon entre canaux | Complément PDF officiel pour nommer la gamme et relier la cotation Xetra ; étapes distinctes et bulletin mixte conservé. |
| E03 — [Franklin Putnam premier ETF UCITS actif](https://www.franklintempleton.co.uk/press-releases/news-room/2026/franklin-templeton-expands-active-etf-range-with-putnam-investments-first-active-ucits-etf) | Absent | Inchangé : communiqué primaire Franklin non raccordé. |
| E04 — [Fidelity deux ETF Dynamic Buffer](https://cashmarket.deutsche-boerse.com/cash-en/Stay-Informed/newsroom/press-releases/New-ETF-and-ETP-Listings-on-October-21-2026-on-Deutsche-B-rse-5652560) | Document présent ; Fidelity non extrait | Six lignes structurées ; deux Fidelity et Ossiam restitués, champs par ligne, cotation distincte du lancement. |
| E05 — [Nouvelles cotations Xetra du 16 octobre](https://cashmarket.deutsche-boerse.com/cash-en/Stay-Informed/newsroom/press-releases/New-ETF-and-ETP-Listings-on-October-16-2026-on-Deutsche-B-rse-5639098) | Document présent ; extraction partielle | Six lignes structurées ; L&G, deux UniActive, Janus Henderson et deux iShares ; inconnues préservées. |
| B09 — [Bourse Direct prêt de titres étendu aux PEA](https://groupe.boursedirect.fr/actualites/actualites/pret-de-titres-bourse-direct-etend-son-service-aux-pea-20261012) | Restitué | Maintenu : extension PEA distincte du lancement d’un PEA, archive silencieuse. |
| E06 — [Global X Responsible Gold Miners : cotation](https://cashmarket.deutsche-boerse.com/cash-en/Stay-Informed/newsroom/press-releases/New-ETF-and-ETP-Listings-on-October-15-2026-on-Deutsche-B-rse-5630662) | Restitué | Maintenu : cotation Global X, sans disponibilité courtier déduite. |

Les corrections ne signifient pas « 19/19 détectés rapidement » : N26 et Franklin restent non raccordés, l’article CAT ancien n’est pas redécouvert par le RSS courant, l’offre Bourso expirée n’est pas réactivée, l’incident Revolut résolu n’est pas recréé, Que Choisir n’est pas ajouté. Les tarifs LBP constituent une référence silencieuse, pas une détection rétroactive de l’article du 20.

## Vérification reproductible

- `npm run test:radar` : tests existants et comportements de l’audit, équité, panne/reprise, dates, fiscalité, produits inconnus, ajouts/retraits, regroupements et migrations.
- `node scripts/replay-radar-audit.mjs /tmp/radar-replay` : corpus figé, avant/après, conservation des IDs, simulation de file et notifications ; aucune découverte réelle prétendue.
- `node scripts/check-radar-audit-fixes.mjs /tmp/radar-live` : accès publics actuels, découverte depuis entrées, extraction, deux passages avec persistance JSON ; aucune publication de données ni notification. Coût et limites par source dans `report.json`.
- `npm run build`, puis `npm run test:radar:browser` : budget de route inchangé, ordinateur et mobile Chromium, données rejouées, sélection, types, six lignes Xetra, étapes Amundi, recherche/historique, lecture persistante et pannes. Les captures ne prouvent ni un déploiement ni une réception téléphone.
- CI : validation Radar, artefact `radar-audit-fixes-validation`, construction et recettes navigateur de l’application. Les diagnostics réseau distinguent blocage et réussite : leur présence ne transforme pas une URL accessible en connecteur qualifié.

Les limites documentées de Revolut/Trade Republic, des portails émetteurs, du national Notaires et des autres sources non qualifiées restent visibles. Aucune extension exhaustive, simulation immobilière nouvelle, collecte massive DVF ou publication automatique sur X n’est introduite.
