# Validation du lot qualifié

## Périmètre et données

77 profils avant, 91 après : 64 sujets candidats consultés, 14 retenus (neuf sources de 2026, cinq de 2025), 50 non retenus avec motifs individuels. Comparaison profonde des 77 objets initiaux : identiques, dont Guillaume et son PEL de 45 €/mois. Les onze déficits antérieurs restent inchangés. Aucun profil de 76 ans réintroduit.

Treize budgets reçoivent des dépenses créées (107 lignes) ; Alban conserve son enveloppe source de 800 €, répartie entre sept lignes sans double compte. Huit lignes de dépenses sont directement sourcées et deux sont calculées à partir de montants annuels. `financial-audit.csv` rapproche les montants, origines et soldes ; un total source partiel n'est jamais présenté comme un budget original complet.

Les 14 sources ont été consultées, leurs messages attribuables conservés par références et empreintes. La recherche ne prétend pas couvrir tous les commentaires de chaque grand fil. Le message 63 du sujet 26044 a été contrôlé directement : son auteur diffère de l'auteur initial du sujet et des nouveaux candidats. Le logement parental de Manon est un choix de préparation documenté, pas une déclaration vérifiée.

## Contrôles automatiques et compilation

- `npm run test:budget` : calculs indépendants en centimes, pourcentages, annualisation, regroupements, provenance, doublons, questions, filtres EUR/CHF, sauvegardes, migrations, conflits et stockage corrompu.
- `npm run build` : réussi avec les seuils existants, après intégration du master incluant la PR #1327.
- Chromium réel, polices chargées : les 14 nouvelles images principales complètes tiennent chacune dans 1080 × 1350, police financière de 40 px. Aucun secours long ni remplacement par les seuls totaux.

## Recette réelle du navigateur

Chromium avec les polices de l'application, à 1440, 390 et 320 px :

- 21 profils (les sept ajouts précédents et les 14 nouveaux), 726 PNG effectivement téléchargés, rapprochés des aperçus octet par octet. Tous les modes et toutes leurs pages, chaque ligne et montant, les limites de cadre et chevauchements, la copie exacte, le panneau de provenance, la personnalisation et la régénération volontaire sont contrôlés.
- Après la dernière précision sur Manon, nouvelle recette de ce profil aux trois largeurs : 30 téléchargements supplémentaires, mêmes contrôles.
- Contrôle complémentaire des 14 principales au moyen du vérificateur général, y compris échec simulé d'encodage puis nouvelle tentative ; cinq filtres combinés pour Florent (pays, tranche EUR, foyer inconnu, enfants inconnus, location), débordement UI à 390/320 ; téléchargement de Romain en CHF à 320.
- Un ancien brouillon personnalisé et les statuts utilisé/à publier/publié daté de Guillaume sont semés dans le navigateur de test : préservés. Copie et téléchargement ne publient aucun nouveau profil. Les statuts réels d'un appareil utilisateur restent inaccessibles depuis le dépôt.

Preuves locales : `test-artifacts/budget-qualified-final/results-1440-390-320.json`, `test-artifacts/budget-qualified-manon/`, `test-artifacts/budget-qualified-smoke/`. Les PNG ne sont pas ajoutés au dépôt.

## Inspection visuelle réellement effectuée

Tous les 14 PNG principaux et les 43 pages détaillées des nouveaux profils ont été rouverts après téléchargement et examinés à une largeur de 390 px (57 images). La page narrative de Manon a été réinspectée après sa dernière précision. Contrôles complémentaires visuels : déficit de Patrice, synthèses de Léna/Gaëtan et Mélodie/Yann, CHF de Romain. Lisibilité, montants, retours à la ligne, absence de troncature/chevauchement, couleurs et signature contrôlés. Les paragraphes détaillés demeurent sur leurs pages séparées conformément à #1327 ; la principale ne perd aucun poste financier ni réserve/projet affiché.

Il s'agit de Chromium et de largeurs mobiles émulées, pas d'essais sur tous les appareils physiques. Aucune publication sur X.

## Répartition de la recette GitHub

La première exécution intégrée de la dernière recette a dépassé le plafond de 300 secondes par commande à 390 px : le passage aux pages 4:5 détaillées porte le lot complet à 242 téléchargements par largeur. La recette CI est donc répartie en trois lots disjoints (les sept profils précédents et deux moitiés des quatorze nouveaux), à chacune des trois largeurs. Chaque profil demeure couvert exactement une fois par largeur. Aucun contrôle de contenu, téléchargement ou persistance n’est retiré ; le délai de 300 secondes reste inchangé et les preuves de chaque lot sont séparées.

## Livraison

Les contrôles GitHub, la fusion et la version réellement publiée seront rapportés dans la PR #1337 et le compte rendu de livraison après leur exécution. Un build local ne prouve pas la publication. `sha` identifie le code applicatif (qui embarque les profils), `dataSha` l'overlay de données automatisées : ils peuvent légitimement différer.
