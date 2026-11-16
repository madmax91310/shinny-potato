# Corrections fonctionnelles des portefeuilles investisseurs

Le bouton principal PNG utilisait directement une URL de données, alors que le
téléchargement de l’aperçu passait par le transfert Blob partagé, adapté aux gros
PNG sur mobile. Les deux chemins utilisent désormais ce transfert et le même
rendu mis en cache pour le relevé sélectionné. Un nouveau relevé invalide le
cache ; un échec de rendu permet un réessai.

Le détail paginait auparavant une liste plate de lignes. Une position pouvait
donc commencer sur une image et se terminer sur la suivante, comme Monro chez
Icahn. La pagination conserve maintenant chaque bloc complet (nom, identifiants,
montant et poids). Le titre de section des options accompagne la première option.
Une position exceptionnellement trop longue produit une erreur explicite qui
renvoie vers les exports JSON/CSV complets, au lieu de perdre des informations.

La ligne agrégée « Autres » porte la devise du relevé et l’unité normalisée, comme
les positions qualifiées dont elle est la somme. Les valeurs et poids ne changent
pas. Les virgules finales des noms courts sont nettoyées. Le CUSIP 464286772,
associé à la classe source MSCI STH KOR ETF, reçoit le libellé « ETF MSCI Corée du
Sud » ; le seul nom de l’émetteur iShares ne suffit jamais à attribuer ce libellé.

Ce lot ne modifie pas la maquette principale, la palette, la typographie, les
portraits, les logos ni leurs fichiers. La refonte graphique reste un chantier
distinct confié à Codex. Aucun collecteur ou fichier d’observations financières
n’est modifié.

## Vérifications

- Build complet réussi ; budget de la route investisseurs respecté (724,4/725 kB).
- Tests purs existants et audit des 28 profils réussis.
- Nouveau contrôle : 26 profils qualifiés, 2 refus conservés ; 1 496 pages logiques
  à deux capacités, positions/options intactes, unités et réessai/cache PNG.
- Vérification Decimal indépendante : 26 relevés qualifiés ; totaux et poids
  inchangés ; 2 relevés incomplets conservés.
- Régressions navigateur enrichies : vrais détails Icahn/Gayner/Tepper sans
  position coupée, téléchargement Blob et égalité des deux boutons avec l’aperçu,
  sur ordinateur et mobile ; ces contrôles sont dans le test screenprint déjà
  exécuté par le portail GitHub.
- Limite locale : Chromium ne démarre pas dans l’exécuteur (socket système
  refusé) et le navigateur distant ne peut joindre le serveur localhost. Les
  résultats navigateur doivent être établis par le portail de la PR avant fusion.

## Sources bloquées

Les métadonnées de collecte conservées du 16 novembre signalent toujours un
conflit SEC/fournisseur pour Druckenmiller (5 210 856 contre 5 210 856 000 USD)
et Klarman (5 045 853 contre 5 045 853 000 USD). Le collecteur refuse explicitement
une conversion inférée d’un facteur 1 000. Aucun montant n’est corrigé au jugé,
aucune date de preuve n’est renouvelée et ces deux profils restent incomplets.

La fusion et la publication attendent la validation navigateur et l’autorisation
explicite de mise en production exigée dans CLAUDE.md.
