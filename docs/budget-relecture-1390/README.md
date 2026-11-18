# Relecture de « Budget de… » pour la PR #1390

Les 101 profils ont été relus de la présentation aux questions. Le relevé de chaque profil a été rapproché au centime de la version précédente de la PR, avec les mêmes 12 déficits. Les modifications de contenu ont été intégrées au générateur commun. Les saisies manuelles utilisent la même présentation et leurs propres données.

## Preuves

- [Matrice des 101 profils](matrice.csv) avec un résultat distinct pour la relecture, les calculs et l’image. Les cinq fiches avec une donnée essentielle à confirmer ont un statut ouvert dans la colonne texte. Les informations absentes restent non renseignées.
- [Corrections de contenu et compléments](../../src/pages/budget-profiles/publication-review-1390.json) avec le champ, l’avant/après, la justification et la provenance. Les compléments conditionnels concernent Gaspard, Corentin, et Laurent et Eva. Ils donnent des repères de financement sans modifier les flux ni déclarer un stock réel.
- [Libellés d’image revus](../../src/pages/budget-profiles/social-labels.json). Le libellé complet de Julie et Alex est « Provision cadeaux et remplacements », pour 80 €. L’image affiche « Cadeaux, remplac. » et conserve les 80 € dans les dépenses non contraintes.
- [PNG téléchargés examinés à 390 px](apercus-390.jpg) et exports natifs de [Noémie](noemie.png), [Julie et Alex](julie-alex.png), [Mélina et Loïc, le profil le plus dense](melina-loic.png), [Romain, en CHF](romain.png) et [Djamila, en déficit](djamila.png).

Le PNG de Noémie est l’export de l’application. La maquette originale fournie à l’écran a servi de référence. Son fichier binaire reste en attente de transfert dans l’espace de travail ou d’un lien de téléchargement.

## Contrôles

Les PNG téléchargés à 390 px ont été comparés à leurs aperçus octet pour octet. Les montants, les lignes regroupées, les débordements, la présence de la barre de répartition et les libellés tronqués ont été vérifiés. Le texte généré a été comparé au texte affiché et au presse-papiers pour chaque profil. Les recettes de saisie manuelle et de l’atelier ont été exécutées à 1 440, 390 et 320 px, avec un cas à 72 lignes, des sauvegardes personnalisées, des dates de publication et un ZIP contenant un seul PNG.

Les modifications de la revue ne changent aucun montant de référence. Les corrections chiffrées historiques de Noémie restent visibles dans son relevé de migration. À l’ouverture d’un ancien brouillon personnalisé, seule une ligne de qualification exactement identique à celle ajoutée par l’ancien modèle peut être retirée automatiquement. Le reste du texte est conservé selon la migration existante.

```sh
npm run test:budget
npm run build
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-social-image.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-studio.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-subscribers.mjs
node scripts/audit-budget-maquette-review.mjs test-artifacts/budget-single-image-0-of-1
```
