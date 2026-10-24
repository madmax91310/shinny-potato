# Retrait de Portefeuilles IA — 24 octobre 2026

L’intervention part de master `be7bffe` et suspend l’audit financier. Les PR #903 (guide éditorial) et #919 (logos) sont préservées ; aucun fichier de leur périmètre n’est modifié, notamment le registre des tests navigateur partagé avec #919.

## Périmètre

Le classement des fichiers et des consommateurs est disponible dans [le suivi consolidé](../reports/donnees-consolidees-2026-10-24/suppression-portefeuilles-ia-perimetre.csv). Les imports, lectures de fichiers, fragments dynamiques, commandes npm, workflows, projections, publication et supervision ont été examinés avant suppression.

La page, la route fonctionnelle, les liens, le moteur, les images/exports, les prompts et bilans hebdomadaires, la saisie de décisions et transactions, la confirmation GitHub, la file d’écriture, les collectes/qualifications et leurs tests exclusifs sont retirés. L’ancienne URL et ses sous-chemins redirigent vers l’accueil. Les deux workflows dédiés ont été désactivés dans GitHub avant intervention puis supprimés du dépôt ; aucun n’était encore en cours. Le registre des producteurs n’autorise plus leurs publications.

Les données privées et publiques exclusivement IA sont supprimées du site et du dépôt courant. Elles restent dans l’historique Git ; aucune nouvelle archive des compétitions, décisions ou cours IA n’est créée.

## Données et fonctions partagées

Les catalogues, historiques mensuels, NAV, performances annuelles, dividendes, compositions, expositions, sources et politiques communes sont conservés. La comparaison ponctuelle de 60 registres sources avec master est consignée dans [la preuve de préservation](../reports/donnees-consolidees-2026-10-24/suppression-ia-sources-partagees.json). Elle n’installe pas un gel permanent des valeurs : les collectes restent autorisées à actualiser ces registres normalement.

Deux consommateurs communs lisaient l’ancien catalogue pour leurs preuves d’identité/cotation : le générateur de candidats actions et les contrôles de raccordement de 29 actifs. Les 30 preuves effectivement utilisées sont transférées sans modifier identités, dates ou sources dans `src/data/shared-listing-identities.json`. Les cours synthétiques, admissions IA et dates de rattrapage quotidien n’y figurent pas. Le contrôle d’action ordinaire/classe/société/cotation est isolé dans `scripts/shared-listing-identities.mjs` ; les substitutions ADR, classe, devise ou symbole restent refusées.

Les tests de raccordement des 29 actifs, 16 profils, calculs de versement unique/DCA/change et comparaisons restent actifs. Les scripts `*ai-tool*` et les profils DCA thématiques sur l’intelligence artificielle sont conservés : ils concernent ces autres outils, pas Portefeuilles IA.

Les changes BCE, les séries mensuelles TWD, les calendriers de séances d’« Il y a X ans », les sources SEC/13F, les transports communs et les mécanismes de reprise, validation et publication sont préservés. `exchange_calendars`, React, Playwright et toutes les dépendances npm restent nécessaires à ces usages. Aucun secret ni accès partagé n’est supprimé.

Trois utilitaires de reconstitution des audits datés sont conservés par prudence : `build_data_review_followup.py`, `build-audit-corrections-report.py` et `report-audit-module-verification.py`. Leurs références IA restent historiques ; ils ne collectent ni ne publient de portefeuille. Les anciens rapports d’audit ne sont pas réécrits. Le générateur du suivi courant classe désormais les anciens composants/exigences exclusifs en « périmètre supprimé », en conservant leurs origines.

## Supervision

Les automatisations IA ne sont plus exigées. Leurs incidents actifs passent en **périmètre supprimé**, jamais en donnée réparée. Pour un incident commun, seule l’attribution IA est retirée ; la cause, la source, la date et les autres outils restent suivis. Le tableau gère aussi une ancienne capture de statut pendant la transition de publication.

Les générateurs ont été actualisés avant les inventaires publics : aucune obligation de catalogue ou de cours IA n’est produite. Les 25 workflows de collecte communs restent programmés. Une exécution ciblée du producteur de métadonnées commun doit confirmer le fonctionnement dans GitHub, sans collecte massive.

## Validation

- Build local, budgets de routes et couverture publiée : réussis.
- Suite Python : 963 tests au premier passage, puis tests ciblés de suppression/supervision et du générateur.
- Contrôles communs : 29 actifs et leurs observations/calculs, LifeStrategy, classement annuel, DCA/expositions, inventaire et supervision.
- Navigateur local mobile/ordinateur : disparition des liens, redirection des anciennes URL, aucune requête IA, fiche ETF commune et PNG, absence d’incidents IA actifs.
- Les preuves GitHub et de production sont ajoutées au reçu de livraison après leur observation. Aucune réussite fournisseur ni publication n’est déduite d’un test local.
