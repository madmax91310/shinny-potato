# Coordination — Cohérence chiffres, 2 novembre 2026

Base `master` 414bd67 ; PR #1141/#1140/#1061/#1042 relues. Les réparations d’automatisation #1136/#1137/#1138 ne sont pas dupliquées ; l’image Générateur #1139 reste intacte.

Le lot `fix/financial-consistency-20261102` possède uniquement le routage du prix final saisi pour la comparaison d’un même actif en DCA/versement unique, les mentions de convention dans les consommateurs mensuels et la matrice/régressions associées. Aucun collecteur, donnée financière, calendrier, preuve, seuil de qualification ou interface de supervision modifié. Les prix valides, refus historiques et calendriers de part restent ceux du master.

Le [rapport et sa matrice](../reports/financial-consistency-2026-11-02/README.md) distinguent les comparaisons compatibles, différences de mesure non certifiées et fenêtres encore refusées. Les 58 écarts NAV/cotation échantillonnés ne sont pas de nouvelles résolutions d’incidents et ne remplacent pas les enquêtes consolidées. Les accès AUM #1061 et autres réparations sources restent au chantier Automatisation ; les comptes/situations et l’affichage des preuves restent à Données à revoir #1141.

PR #1142 relue après son ouverture : complément documentaire des preuves d’automatisation, sans modification applicative ; aucun de ses fichiers repris ici.
