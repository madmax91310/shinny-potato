# Portefeuilles publics

Route : `/portefeuilles-publics`. Stockage local versionné `el-public-portfolios-v1`, indépendant des outils Budget/DCA/tweets. Aucune donnée fictive préchargée. Les sauvegardes détectent un changement concurrent dans un autre onglet et refusent l’écrasement. Aucun service de synchronisation ou collecteur programmé.

## Acquisition examinée le 15 novembre 2026

- Getquin : `https://app.getquin.com/` répond en HTML (application Next). Les intégrations de comptes décrites sur `https://www.getquin.com/security/` ne documentent pas une API de lecture des portefeuilles publics tiers. Aucun accès stable et documenté validé pour ce cas : saisie manuelle.
- eToro : `https://www.etoro.com/discover/people` retourne HTTP 403 dans l’environnement. `https://builders.etoro.com/faq` et `/reference` documentent une API avec compte et identifiants API. Aucun identifiant eToro fourni ; aucune clé à embarquer dans cette SPA publique : saisie manuelle.
- Mon Petit Portfolio : `https://mon-petit-portfolio.com/community/public-portfolios/list` et `/view/33f28456-3212-438e-ad1b-9eaa9b88d108` sont consultables sans connexion (page HTML récupérée). Les taux de croissance depuis l’origine et performances annuelles affichées ne prouvent pas les rendements cumulés du mois civil et depuis janvier. Démonstrations présentes dans la liste. Pas de contrat API/CORS validé pour cette SPA : saisie manuelle. La lecture publique est possible, aucune récupération automatique implémentée.

La fiche contient les sources ; chaque relevé conserve la provenance et le libellé original. Le bouton de signalement d’un échec conserve les relevés. La date de vérification correspond à la consultation saisie par l’utilisateur, aucune donnée n’est auditée par l’application.

## Conservation éditoriale

Un relevé corrigé ajoute une version. Une publication conserve texte final, date, numéro, URL facultative, profil sans historique récursif, relevé et version du rendu. Les images de l’historique utilisent cette photographie, jamais le dernier relevé. Le rendu v1 doit être conservé si le style évolue.

## Vérifications

`node scripts/test-public-portfolios.mjs` : persistance, conflit d’onglet, relevés multiples, zéro/perte/absence, annualisation et période glissante, allocation incomplète et nature virtuelle, immutabilité éditoriale.

`node scripts/playwright-public-portfolios.mjs` : navigateur Chromium, profil incomplet, rechargement/modification, copie réelle, téléchargement PNG, dimensions 1080 × 1350, noms longs et images complémentaires, historique, largeur mobile et ouverture DCA/Budget/tweets. Fixtures exclusivement dans le contexte éphémère du test.
