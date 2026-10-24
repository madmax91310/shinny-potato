# Finalisation des données communes — bilan consolidé

État de la capture : 2026-10-24T20:41:03.560499+00:00. Ce document prolonge #887/#889/#920/#921/#922 et le retrait #923. Le suivi financier reste unique. **L’objectif d’automatisation complète n’est pas atteint ni certifié.** Des réparations ont été livrées et exercées ; des sources et des qualifications restent ouvertes.

## Résultats concrets

| Chaîne | Résultat démontré | Réserve |
| --- | --- | --- |
| Annuaires et SoFi | Producteur ordinaire 40111462777 : 21 identités, quatre requêtes mutualisées, validation, enregistrement et publication. SoFi : seuls les espaces consécutifs changent ; société, classe, XNAS, ticker et USD conservés. | Déclenchement manuel ordinaire. Premier cron post-correctif non encore observé. Les neuf preuves de fonds partagées restent conservées. Aucun cours quotidien IA réactivé. |
| Or Banque mondiale | 40108621544 : acquisition, validation, enregistrement ; données adoptées par une publication ultérieure après l’échec du premier test de calendrier. Valeur publique 4 319 USD/once, moyenne de septembre 2026, rapprochée du registre exact. | L’échec de publication initial n’est pas effacé. Une collecte inchangée renouvelle le contrôle, jamais le mois observé. |
| INSEE / Pouvoir d’achat / Il y a X ans | Reprise automatique 40110829062 et passage 40115332183 : collecte, validation, enregistrement et publication. Contrôles persistés séparément des périodes ; trois séries de prix atomiques, IRL et SMIC indépendants. | L’or projeté conserve le contrôle Banque mondiale et un derivedAt distinct ; aucune réussite réseau déduite de la projection. |
| Assurance-vie | 40108578843 : collecte/validation/enregistrement réparés, valeurs réellement adoptées par une publication ultérieure. | Premier échec de publication conservé ; pas de date financière renouvelée sur un simple accès documentaire. |
| Indices | Neuf requalifications réparées : structure physique distincte de méthode optimisée ; synthétique refusé. Cycles ordinaires 40111859799 et 40117395020 publiés ; 40120104021 exerce le nouveau contrat. | 34 modèles **déjà disponibles** préservés ; pas neuf nouveaux actifs. Des positions ETF restent une approximation explicitement qualifiée, pas l’indice exact. Disponibilité d’un modèle ≠ collecte directe de chaque champ. |
| Historiques mensuels / enregistrement | Incident initial workflow:update-market-monthly.yml, run 40090641233, étape Commit validated observations. Cycle ciblé 40117402200 : acquisition des identités, validation complète, enregistrement f900480 et données publiées. | Aucun prix sain à retenter : ce cycle ne prouve pas une nouvelle collecte de tous les cours. Sa validation de code restante a été annulée après adoption publique ; le run global n’est pas compté comme réussite. |
| Publication | #932 reconnaît un préfixe de données déjà servi sur du code inchangé, sans certifier les scripts, workflows ou consommateurs non publiés. Reproduction réelle code2b/dataf900 puis data59a et tests avec véritables dépôts Git isolés. | Les demandes de nouveau code gardent tous leurs contrôles. La première occurrence naturelle du chemin corrigé après publication reste à observer si elle n’est pas documentée dans les preuves finales. |
| Radar INSEE | 40122424700 : ancienne erreur Indice des prix publié absente ; lecteur commun sans erreur sur les registres consolidés. | Run global partiel : date officielle HANetf absente, HTTP403 et HTTP500 restent distincts. #930 répare HTTP304 et heures inconnues ; ne réutilise pas une date de publication comme contrôle source. |

Les PR #924, #927, #928, #925 et #932 sont fusionnées. #930 est préservée ; #931 complète l’ingestion avant fin de publication, sous la responsabilité du chantier supervision. La version publique d73c560 inclut #931 et #934 ; les parcours finaux et le déploiement réussi 40124897241 sont vérifiés.

## Ce qui a changé dans les producteurs

Les dates de tentative, contrôle réussi et observation sont séparées. Une lecture locale ou une requalification de cache ne devient pas un contrôle fournisseur. Les rapports déclarent leur périmètre, y compris les reprises ciblées, attentes normales et dérivations. Les identifiants qualification: ne peuvent pas effacer une panne réseau du même indice.

L’enregistrement concurrent reconstruit uniquement ses projections déclarées puis rejoue les contrôles financiers. Une entrée source modifiée impose une recollecte ; aucun conflit financier n’est résolu aveuglément. Les runs terminaux annulés/ignorés ne gèlent plus une reprise ; plafonds et temporisations restent inchangés. Les chemins rares non observés en production restent qualifiés comme tels, même si leurs régressions isolées passent.

Un test calendaire dépendant de données vivantes a été remplacé par une fixture de date fixe ; les vrais contrôles 13F et offres restent exécutés. Aucun seuil de fraîcheur ou de qualité financière n’est augmenté.

## Matrice et limites de preuve

La [matrice](matrice-donnees-usages.csv) rapproche **31712 contrats logiques champ/série × outil**, **23 outils consommateurs**, **3544 identifiants de profils** et **671 ISIN distincts**. Les profils contiennent alias et variantes : ne pas les lire comme autant d’instruments économiques. Deux autres entrées applicatives sont la supervision et Dilemme, dont les hypothèses éditoriales ne constituent pas des données vivantes à collecter.

Le contrôle automatique des preuves classe **0 A, 27987 B et 3725 non applicables** dans cette capture. **Ce n’est pas un taux réel d’automatisation.** Il exige une correspondance fine entre valeur présente, propriétaire du fichier dans la version exécutée, contrôle source ciblé, fraîcheur et reçu publié. Les journaux hérités ne permettent pas tous cette jointure. Les chaînes exercées du tableau précédent sont des preuves séparées ; leur succès global ne certifie pas tous les champs du fichier.

La règle refuse notamment qu’un reçu global de publication de l’or certifie 3M, ou qu’un succès annuaires du même workflow certifie des prix non tentés. Une qualification locale, un simple label, des poids inconnus ou un champ annoncé sans valeur ne valent pas preuve financière. Les dates non redémontrées sont explicitement déclarées comme dates du registre ; une tentative globale n’est pas attribuée à chaque champ.

**B reste du travail non résolu** : absence de source, qualification financière, raccordement, fraîcheur ou preuve incomplète. Un B documentaire n’est pas une valeur fausse ni une nouvelle panne. Les données valides gardent leurs dates et les usages restent soumis à leurs contrôles existants ; seules les fenêtres démontrées non fiables sont refusées. Les blocages effectivement identifiés remontent via les contrats des producteurs et les lacunes nécessaires de Données à revoir. La réconciliation fine de tous les anciens journaux n’est pas achevée ; elle n’est pas présentée comme un succès fournisseur.

La matrice contient unités, devises, méthodes, périodes, sources, contrôles, tentatives observées, correction attendue et preuve de publication. Les [chaînes](chaines-donnees.csv) mutualisent les références ; les [commandes des producteurs](producteurs-commandes.csv) donnent les scripts et appels déclarés, sans confondre déclaration et exécution.

## Les 79 divergences et usages financiers

**79 → 79 cas ouverts sur 50 parts**. Les 90 comparaisons d’origine sur 53 parts et les 175 périodes non comparables sont conservées. Les 72 preuves quotidiennes déjà acquises et sept absences ne deviennent pas des causes expliquées.

Les **27 fenêtres NAV distinctes sur 17 parts** restent qualifiées ; les **52 fenêtres de cotation contestées** restent refusées pour les usages concernés. Les périodes valides indépendantes restent disponibles. Les 79 lignes conservent outils, périodes, conventions, consommation initiale et pièce manquante. Une NAV fiable ne répare pas l’ancienne cotation.

HSBC IE00B4K6B022 : rapports fiscaux officiels 2023/2024 retrouvés, distributions de 0,2214 EUR le 01/02/2024 et 1,2623 EUR le 08/08/2024. L’ajustement supplémentaire Yahoo du 01/08 reproduit le facteur de dividende à 1,35e-7 près : **2,7610055 points** expliqués ; résidu **0,121920317 point** face à 11,6 % NAV. Le cas reste ouvert. Aucun dividende ou prix de production supprimé ; PDF, empreintes et calcul reproductible conservés.

ABTC conserve ses questions dates/devise/split. PALAT conserve la distinction dernier échange/clôture de valorisation. Les neuf bornes brutes Euronext déjà recoupées ne prouvent pas les ajustements ou les bornes NAV. Mining et Aerospace gardent leurs voies indépendantes ; aucune réparation de leurs anciennes cotations n’est annoncée.

## Limites précises restantes

- Copper et quatre compositions intégrales WisdomTree : voie officielle autorisée exploitable depuis GitHub encore nécessaire ; pas de nouveaux essais identiques 403 ni de recouvrement complet inventé.
- PEA IE00B0M62S72 en conflit, IE0003R87OG3 inconnu : aucune conversion de l’inconnu en booléen par défaut.
- FR0007054358 : continuité juridique entre 2001 et 2018 non démontrée ; périodes NAV annuelles 2020–2025 préservées.
- Compositions économiques exactes, identités de positions, chiffres vivants non typés et politiques non qualifiées : reliquat conservé. Panier de substitution, top10 et positions complètes restent distincts, sans renormalisation silencieuse.
- SCPI : échéance non annoncée = limite documentaire/attente normale. Délai interne de surveillance distinct de la publication émetteur ; aucune date inventée.
- Conditions de réutilisation : inconnues conservées ; HTTP200 ne constitue pas une licence.
- Preuves fines : certains corps d’artefacts sont inaccessibles depuis cet espace (403) ; métadonnées, captures disponibles et raisons de non-vérification conservées. Une lecture de code ou un test local ne devient pas une collecte fournisseur.

## Inventaires, actions et périmètre supprimé

Le suivi garde **8 600 origines sur 8 600**, 90 comparaisons et 19 actions. Statut des actions : **10 corrigées, 5 partielles, 1 bloquée, 1 déjà résolue et 2 périmètres supprimés**. L’ancien passage 12→11 venait de P2-04 rouvert pour stockage/validation IA ; après #923, P2-04 et P1-01 sortent du périmètre, sans être renommés données réparées.

Les 138 références de modules du suivi comprennent neuf suppressions de périmètre et 92 vérifications en attente au sens du suivi. Les 119 lignes du premier inventaire et le reliquat initial de 81 modules restent traçables. Rôle réseau, orchestrateur ou auxiliaire et limites de branches restent dans [modules-suivis.csv](modules-suivis.csv). Les compteurs finaux du [bilan](bilan.json) font référence si les captures suivantes ajoutent des incidents.

Les **25 workflows planifiés** sont présents. Le registre comprend désormais **24 entrées : 23 planifiées et Deploy Pages**. Deux planifiés restent hors de ce registre : publication du moniteur et sonde Bitcoin. Avec Publish validated data non planifié, la table décrit **27 workflows** de collecte, contrôle, pilote ou publication. Les 20 lignes classées collecte/validation ne sont pas 20 fournisseurs ni une certification de toutes leurs branches. Le détail initial 25/22 et le détail actuel 25/24 sont conservés séparément.

Portefeuilles IA reste supprimé ; d7ab632 et la fusion #923 sont ancêtres de master. Aucun catalogue, moteur, cours, export, transaction ou workflow exclusif n’est restauré. Les trois utilitaires historiques restent inactifs. Sources, identités et historiques partagés sont conservés.

## Tests, production et procédure

1 000 tests Python du lot source réussis ; 104 tests de supervision lors de l’intégration, 16 tests ciblés de matrice et 14 du suivi. Les premiers trois échecs OCR étaient dus au modèle français absent ; la suite complète a été rejouée avec ce modèle. Ne pas additionner les suites recouvrantes comme des tests uniques.

Les gates complets #924/#927/#928/#925/#932 et les builds associés sont consignés dans les preuves. Les scénarios isolés couvrent panne, vide, changement de structure, résultat partiel, absence de changement, maintien des dates, observation hors ordre, conflit Git, reprise et frontières de calendrier. Aucun défaut fournisseur n’a été provoqué en production.

Parcours publics : neuf indices, 18 téléchargements PNG correspondant à l’aperçu sur 390/1280 pixels ; or, Pouvoir d’achat, assurance et retrait IA contrôlés. Les captures indiquent leur version, sans interception. Les contrôles du code final et les captures ultérieures complètent ces preuves ; un test antérieur n’est pas présenté comme portant sur une version future.

Une commande de nettoyage de 40117402200 a continué après un assert d’égalité trop strict : le site avait déjà avancé de dataf900 à data59a. L’écart de procédure est consigné. Vérification immédiate : f900 ancêtre de 59a, trois blobs inchangés, identité conforme au manifeste public ; seules les validations restantes ont été annulées après réussite collecte/enregistrement/publication. Ce run global n’est jamais compté comme réussite. Le nouveau sélecteur utilise le préfixe et la frontière de code ; aucun gate du nouveau code n’est supprimé.

**Publication de la capture : code `d73c56031078c11994644eaf53b8728159750698`, données `d73c56031078c11994644eaf53b8728159750698`**, build `2026-10-24T19:47:32Z`. Le script du rapport extrait les registres depuis ce commit publié, en lecture seule ; les projections ne se certifient pas elles-mêmes. Les corrections fusionnées après cette version restent « à vérifier en production » jusqu’à leur capture effective.

## Coordination finale

Les PR concurrentes #936 (Radar) et #937 (supervision) ont été rapprochées avant cette livraison. Le présent lot final ne modifie que le suivi et les preuves ; aucun fichier de leurs mécanismes en cours n’est réécrit. Leurs évolutions non publiées ne sont pas comptées dans la capture d73c560.

## Téléchargements séparés

[Livraison](LIVRAISON.md) · [Matrice donnée × outil](matrice-donnees-usages.csv) · [Chaînes](chaines-donnees.csv) · [Producteurs](producteurs-commandes.csv) · [Bilan par outil](bilan-par-outil.csv) · [Suivi unique](suivi-consolide.csv) · [19 actions](statut-19-actions.csv) · [79 divergences](reconciliation-79-ecarts.csv) · [Reliquat](restant-a-verifier.csv) · [Bilan](bilan.json).
