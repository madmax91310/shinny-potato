# Corrections du reliquat — 23 octobre 2026

Base relue : `master` `80bc745142687ae07a34ff90a245d8c88f976159`, après les PR #884 et #885. Branche isolée `fix/reliquat-20261023`. Le travail précédent et ses preuves sont conservés. Ce lot n’est pas une certification indépendante de toutes les données.

## Résultat financier : 84 cas à expliquer

- **5 erreurs expliquées et corrigées**, contre 84 cas initialement inexpliqués. XDEW.MI, 2016–2020 : les deux niveaux annuels étiquetés EUR correspondent aux NAV officielles USD, à moins de 10⁻⁶ en ratio. L’erreur commune se situe dans la série de niveaux, pas dans la devise du calendrier DWS. La conversion BCE reste nécessaire.
- **79 causes encore incomplètement expliquées**. Chaque ligne précise ses recherches, ses données et les pièces manquantes. Aucune différence de prix n’est baptisée prime/décote certifiée sans preuve de cotation.
- **73/84 cas disposent de nouvelles observations quotidiennes officielles**, pour un total de **44 parts** avec série quotidienne obtenue dans cette investigation. Parmi les 50 parts des 84 cas, 43 disposent de ces preuves quotidiennes. Pour les 11 autres cas, la voie NAV quotidienne n’a pas été qualifiée dans ce lot.
- Les **90 alertes originales**, leurs chiffres, seuils et empreintes sont conservés. Les **175 périodes non comparables** restent inchangées. La suppression des alertes par remplacement de la source ne compte pas comme une explication de l’ancienne divergence.

DWS 2016 : 36,9434013367 et 42,1665000916 attribués à l’EUR contre 36,9434 et 42,1665 USD officiels. Rendement natif 14,138114 %, soit 17,884607 % après conversion cohérente avec les niveaux BCE du registre ; le CSV donne les calculs exacts propres à chaque année. Pour 2019 et 2020, les dernières NAV de décembre diffèrent aussi des jours utilisés par le fournisseur. DWS 2021 et CSKR présentent des indices de changement d’unité ; le reliquat non attribué reste ouvert. Les courbes BlackRock `priceData` anciennes ou d’une autre cotation ne servent pas de preuve de la clôture demandée.

Les recherches supplémentaires ont identifié dans le JavaScript officiel Amundi les indicateurs `officialNav`, `countervalorisedAdjustedNAV` et `navCurrency`. Une collecte mutualisée vérifie la devise de chaque NAV historique, indépendamment de la devise de l’indice et du fonds. Treize cas supplémentaires restent donc inexpliqués malgré une devise NAV explicitement vérifiée. Les exports officiels de quatre autres fonds VanEck et la série ABTC ajustée du split 14:1 complètent les 73 preuves de cas ; aucun de ces nouveaux diagnostics ne change automatiquement un cours actif.

## Historiques et raccordements livrables

Trois instruments existants utilisent désormais une **voie de NAV de la part exacte**, identifiée par `valuationBasis=fund-nav-total-return` et un libellé financier « VL ». Les cotations originales sont archivées, pas prétendument réparées.

| Actif | Convention et fenêtre mensuelle | Preuve |
|---|---|---|
| IE00BLNMYC90 — Equal Weight | NAV USD converties en EUR par la méthode BCE existante ; depuis juin 2015, après la fusion documentée | Workbook officiel DWS, identité/devise et calendriers contrôlés |
| IE000U9ODG19 — Aerospace | NAV USD capitalisantes ; depuis mars 2024 | NAV du 31/12/2024 : 5,875646 ; du 31/12/2025 : 9,081010 ; **+54,5533885 %**. Courbe officielle de revenus réinvestis recoupée |
| IE00BDFBTQ78 — Mining | NAV USD capitalisantes converties en EUR ; depuis juin 2018 | Workbook VanEck et PDF de la part ; distinction date du fonds 18/04/2018 / date de l’indice 17/04/2023 |

Calculateur (versement unique et DCA), Performance depuis, comparaisons/classifications mensuelles et anniversaires partagent ces historiques. Les niveaux actuels des anniversaires viennent de la même convention NAV, avec la date réelle de NAV et de change. Aucun cours d’une autre place ni dividende ajouté une seconde fois. Les anciens calendriers de marché retirés de la projection Duels ne sont pas réétiquetés NAV : les calendriers officiels de fonds restent la voie de ce moteur. Les profils automatiques et l’univers IA ne sont pas étendus.

Copper : NAV quotidiennes officielles obtenues localement (2018 : −22,174131 %, 2019 : +6,160854 %), mais **HTTP 403 dans GitHub**. Sa voie active reste inchangée. La cotation suisse Aerospace et les anciennes cotations Mining/Copper ne sont pas déclarées réparées.

## Automatisations et autres corrections

- **IBKR cash** : non-rémunération du compte espèces PEA prouvée par la fiche officielle Service-Public F2385 ; intérêts du CTO conservés distinctement. Les deux documents ont été téléchargés et parsés réellement localement et depuis GitHub. Seul ce champ est renouvelé. Bourse Direct reste bloqué ; ses dates de preuve ne changent pas.
- **VanEck** : reprise documentaire mutualisée utilisée pour Mining ; succès effectif dans GitHub. Les workflows mensuels et de valorisation installent le navigateur nécessaire à cette reprise.
- **WisdomTree** : les quatre collecteurs complets restent 403 dans GitHub, malgré les réussites locales. Aucun déblocage de recouvrement, aucune renormalisation et aucun poids/identifiant inventé.
- **SCPI** : `internalReviewDue` et `deadlineBasis` remplacent l’ambiguïté d’une date de publication supposée ; `issuerPublicationDeadline=null`. Consultation Remake réelle, dernier bulletin et dates financières conservés. Aucun délai émetteur confirmé n’est inventé.
- **Consommateurs dynamiques** : huit registres `src` restants ont des lecteurs déclarés de build, collecte ou validation, distincts des imports runtime. Le petit `holdings.json` est une projection de validation, pas le portefeuille complet utilisé par l’application. Aucun fichier supprimé.
- **Chiffres vivants** : slots « Gestion » et swap des guides raccordés séparément aux preuves des caractéristiques communes. Les hypothèses, archives, phrases et verrous éditoriaux sont conservés. Les autres chiffres non typés restent à qualifier, pas automatiquement certifiés.
- **Lancements** : dates officielles documentées pour **53/53 parts** contre 26/53 ; une ambiguïté de date/continuité reste ouverte. FR0007054358 affiche une date de classe 20/09/2018 dans le PDF, LAUNCH_DATE 19/09/2018 dans l’API et une première VL 19/02/2001 : continuité à qualifier, sans blocage automatique de son historique sur ce seul constat. Les nouvelles preuves documentaires ne valent pas requalification universelle des historiques antérieurs.
- **PEA** : deux cas toujours non résolus. Le factsheet BlackRock courant imprime « - » pour IE00B0M62S72 ; ce n’est pas un NON. La page Avantis essayée ne fournit pas de preuve PEA consommable dans ce lot. Conflit et inconnu sont préservés.

## État des 19 actions et vérifications

**11 corrigées, 7 partiellement corrigées, 1 bloquée**, contre 10/7/2. Le tableau séparé donne les limites de chaque action. P3-01 est corrigée sur le graphe des registres `src` concernés ; P1-03 passe de bloquée à partiellement corrigée grâce à IBKR, Bourse Direct restant indisponible.

Les 115 modules initiaux restent inventoriés : 71 collecteurs réseau, 25 auxiliaires, 19 orchestrateurs. Le groupe initial des 81 contient 44 collecteurs, 21 auxiliaires et 16 orchestrateurs ; ces derniers ne nécessitent pas 37 sondes fournisseur artificielles. Les 81 lignes sont conservées et leurs limites de branches restent explicites. Aucune campagne massive de cotations IA ; aucune transaction fictive.

Contrôles locaux : suite Python, 113 commandes de validation du workflow principal (trois échecs initiaux corrigés et rejoués), contrôles ciblés NAV, conservation des 90 cas, catalogue/raccordements, build et 12 téléchargements PNG réels sur les trois actifs (versement unique, DCA, performance, anniversaire), plus contrôle mobile. Les journaux séparés donnent les résultats exacts. Les formats des tweets et les maquettes sont conservés ; « VL » indique la convention financière, sans ajout généralisé de sources ou de texte technique.

**Preuve GitHub** : [exécution 39905526499](https://github.com/madmax91310/shinny-potato/actions/runs/39905526499). DWS, Aerospace, Mining et IBKR validés ; Copper et quatre portefeuilles WisdomTree en échec explicite. C’est un lancement isolé dans l’environnement planifié, pas une preuve d’un cycle cron ultérieur. Les résultats détaillés, et non la couleur d’une étape `continue-on-error`, font foi.

## Livraison et limites

PR, commit final, résultats des contrôles distants et version effectivement publiée : consignés dans `PUBLICATION.md` après validation. Aucun raccordement n’est annoncé en ligne dans ce rapport avant cette vérification.

Les 201 lignes du suivi initial sont conservées ; 169 portent encore un suivi actif, ce décompte incluant les 81 modules et leurs limites de vérification. Ce n’est ni 169 actifs ni 169 collecteurs en panne. Les priorités restantes sont les 79 causes financières, les accès WisdomTree/Bourse Direct, les deux PEA, l’ambiguïté de date/continuité de FR0007054358 et les chiffres vivants/calendriers encore incomplets.

## Rapports séparés

- `reconciliation-84-ecarts.csv` : les 84 cas du reliquat, preuves nouvelles, cause ou pièce manquante.
- `reconciliation-90-ecarts.csv` et `.json` : réconciliation complète et valeurs originales conservées.
- `statut-19-actions.csv` et `.json` : statut avant/après et limites.
- `restant-a-verifier.csv` : aucune ligne initiale perdue ; statut courant et suivi actif explicites.
- `inceptions-53-parts.csv` : dates, portées et continuité non résolue.
- `modules-verification.csv` : inventaire des 115 modules et périmètres de preuve précédents conservés.
- `textes-reutilisables.csv` : 90 textes et 62 faits, slots automatisés et reliquat éditorial.
- `bilan.json`, `bilan-84-ecarts.json`, `performances-non-comparables.csv`.
- `preuves/` : réponses officielles compressées individuellement, archives des anciennes cotations, résultats réels et journaux. L’index recense les fichiers, tailles et empreintes.
