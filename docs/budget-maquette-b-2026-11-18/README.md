# Budget de… — maquette B

Le générateur commun applique la maquette B aux 101 profils de la banque et à l’éditeur de nouveaux profils. L’aperçu, le téléchargement direct et le ZIP utilisent le même PNG 1 080 × 1 350. L’image présente les flux mensuels. Le texte garde le détail, le patrimoine, les projets et les questions.

- Fond crème, bandeau vert, cartes saumon pour les dépenses, menthe pour les versements et jaune pour le reste. La colonne de droite réunit les dépenses non contraintes et les versements. La capacité d’épargne figure en bas, suivie de la signature.
- Si le budget est négatif, le PNG affiche le reste signé et retire la barre. Les dépenses mixtes indivisibles sont signalées et comptées en entier avec les dépenses contraintes, dans un sous-total explicitement intitulé. Le détail est intact dans le texte.
- Les postes regroupés gardent leur somme exacte. La sélection privilégie les principaux postes et garde une place pour un poste cité dans les questions lorsque le libellé est reconnu. La capacité d’épargne et les versements effectifs, prévus ou budgétés restent distincts lorsqu’ils sont documentés.
- L’original de `Budget-Noemie-B.png` est visible dans le message de référence. Le fichier binaire n’a pas été transmis à l’espace de travail. Le PNG de Noémie ci-dessous est la sortie du générateur.

## Correction des données de Noémie

| Flux mensuel | Avant | Maquette B |
| --- | ---: | ---: |
| Salaire net encaissé | 4 400 € | 3 500 € |
| Titres-restaurant hors salaire | — | 200 € |
| Dépenses contraintes | 2 330 € | 2 350 € |
| Dépenses non contraintes | 270 € | 320 € |
| Total des dépenses | 2 600 € | 2 670 € |
| Capacité d’épargne | 1 800 € | 830 € |
| Versements | 1 317 € | 750 € |
| Reste après versements | 483 € | 80 € |

Les courses débitées passent de 180 à 200 € et les vêtements et cadeaux de 30 à 80 €. Les versements passent de 450 à 400 € sur l’ETF World, de 200 à 100 € vers la réserve, de 300 à 200 € pour la prochaine voiture et de 100 à 50 € vers les cryptos. L’ancien versement retraite de 267 € et le bonus de l’ancien scénario sont absents de la référence éditoriale. Les montants et hypothèses d’origine sont archivés dans le lot du 15 novembre. Les 21 mois restants sur le crédit auto sont présentés comme une estimation, avec un capital arrondi et sans échéancier.

## Brouillons et limites

Les textes personnalisés sont conservés. À la réouverture d’un brouillon de Noémie rattaché à l’ancien budget, les libellés et valeurs de l’ancien relevé reconnus sont mis à jour avec un relevé avant/après visible dans l’éditeur. Les passages d’origine reconnus mot pour mot concernant le patrimoine ou les anciens projets et questions sont actualisés ou retirés. Tout montant non rapprochable dans une phrase personnalisée reste en place et le brouillon reste signalé pour relecture. Le test navigateur conserve par exemple « Je vise un autre objectif à 7 200 € », avec un relevé des deux corrections sur le salaire et les dépenses. Les brouillons personnels, dates, statuts et ordres de file sont vérifiés sur des sauvegardes de test. Le stockage des utilisateurs reste sur leur appareil.

Les 100 autres profils gardent leurs montants de référence. Les incertitudes des sources, frais non chiffrés et enveloppes non ventilées restent documentés dans les audits précédents. Les données de projet et les provisions annuelles déjà connues gardent leur périmètre. Aucun montant manquant n’a été estimé pour remplir la maquette.

## Exemples et contrôles

| Profil | Contrôle visuel | Export natif |
| --- | --- | --- |
| Noémie | Maquette B et cinq montants principaux | [PNG](noemie.png) |
| Mélina et Loïc | 24 postes de dépenses, poste cité dans la question, plusieurs versements | [PNG](melina-loic.png) |
| Julie et Alex | Plusieurs revenus encaissés | [PNG](julie-alex.png) |
| Mélissa et Johan | Francs suisses, reste négatif et aucune barre | [PNG](melissa-johan.png) |
| Sébastien | Reste nul, barre sans segment jaune | [PNG](sebastien.png) |

[Comparaison des cinq PNG à 390 px](apercus-390.jpg) · [Tous les profils et empreintes des PNG](audit.csv)

Le contrôle à 390 px ouvre les aperçus dans Chromium, décode et télécharge leur PNG, vérifie le format et compare les octets aux aperçus. Le texte généré est comparé au champ affiché et au presse-papiers. Les tests recoupent séparément les montants, sous-totaux, pourcentages et groupes. Les recettes de l’éditeur contrôlent aussi le ZIP, les provisions annualisées, les statuts, la file de publication et les brouillons personnalisés.

```sh
npm run test:budget
npm run build
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-social-image.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-studio.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-budget-subscribers.mjs
```
