# Le budget de… · une image pour X

La banque et la saisie manuelle utilisent le même rendu 1080 × 1350. Le téléchargement direct et le ZIP reprennent les octets du PNG affiché. Le ZIP contient `publication.txt` et `image-01.png`. Les principaux postes restent visibles avec leurs montants. Les enveloppes mixtes ou insuffisamment ventilées gardent leurs montants dans une rubrique dédiée. Les petits postes sont regroupés en centimes au sein de leur rubrique.

Le texte présente le foyer, les revenus, les dépenses et la capacité calculée. Il indique ensuite les versements renseignés, le solde, la réserve et les projets quand ces éléments sont disponibles. Les versements à venir sont qualifiés « prévus ». La saisie manuelle permet de préciser l’état de chaque versement, la nature d’une dépense et la valeur d’un avantage en nature. Un avantage ainsi saisi figure en dehors du montant disponible. Si les revenus sont explicitement nuls, le déficit s’affiche sans pourcentage.

Les textes personnalisés restent disponibles intégralement. La relecture signale ceux qui se réfèrent à des postes modifiés et demande une vérification avant l’export conjoint. Le format des sauvegardes, les dates de publication déclarées et prévues, et l’ordre de la file restent les mêmes.

## Profils complétés

| Profil | Enveloppe ventilée | Lignes ajoutées | Revenus / dépenses / capacité / versements / solde |
| --- | --- | --- | --- |
| Julien | 600 € de vie courante | Courses et hygiène 300 €, télécoms 35 €, transports 45 €, soins à charge 40 €, restaurants et sorties 60 €, vêtements 35 €, provisions vacances et cadeaux 55 €, équipement et imprévus 30 € | 2 900 € / 2 160 € / 740 € / — / 740 € |
| Julie et Alex | 1 367 € de charges fixes | Loyer et charges 820 €, énergie et eau 120 €, assurances 80 €, télécoms 47 €, transports courants 120 €, crédits du foyer 180 € | 2 464 € / 2 257 € / 207 € / 100 € prévus / 107 € |
| Jade | 200 € de charges et abonnements | Charges locatives et eau 55 €, énergie 50 €, assurance habitation 15 €, télécoms 45 €, abonnements loisirs 35 € | 3 500 € / 2 500 € / 1 000 € / 1 000 € / 0 € |

Ces montants détaillés sont des hypothèses éditoriales à l’intérieur d’enveloppes conservées. L’image et le texte identifient les trois budgets comme reconstitués. Chaque ventilation a sa justification dans la fiche de provenance. Pour Julien, le logement et le prêt étudiant conservent leurs montants. La part locative est supposée couvrir l’énergie et l’assurance, et les soins sont limités au reste à charge. Chez Julie et Alex, les deux postes de transport couvrent les déplacements courants et la provision pour les trajets familiaux. Chez Jade, aucune deuxième facturation de l’eau, de la mutuelle ou des voyages n’est ajoutée.

La revue a rapproché les 101 fiches et les sources et hypothèses déjà conservées. Les prises en charge documentées restent à zéro côté foyer, comme la voiture et le carburant d’Iris ou les dépenses réglées par le conjoint de Monique. Les lignes mixtes sans base fiable restent groupées. Les champs biographiques et couvertures sans information restent indéterminés. Les 12 soldes déficitaires sont conservés.

## Comparaisons à 390 px

Chaque planche juxtapose l’ancien PNG téléchargé sur le site public et le nouveau PNG téléchargé depuis le build de la branche. Chaque côté est affiché à 390 px.

| Profil | Avant | Après | Comparaison |
| --- | --- | --- | --- |
| Mélina et Loïc · 24 postes | Les grands totaux de l’image principale n’expliquaient pas les dépenses | Logement, alimentation, crédits, garde et autres postes répartis en rubriques, 550 € de capacité, 450 € prévus, 100 € de solde | [Planche](melina-loic-390.jpg) · [PNG](melina-loic.png) |
| Julien · dossier incomplet | Trois postes dont une enveloppe de 600 €, reste donné seul | Dépenses ventilées et qualifiées, capacité de 740 €, réserve sur livrets | [Planche](julien-390.jpg) · [PNG](julien.png) |
| Maël · alternance | L’image principale alignait les détails et les éléments de contexte | Revenus de 1 170 €, postes principaux, 440 € de capacité, 400 € de versements effectués, 40 € de solde. La prise en charge familiale et le choix d’allocation restent dans le texte | [Planche](mael-390.jpg) · [PNG](mael.png) |

[Textes générés avant et après](textes.md) · [Calculs des 101 profils en centimes](audit.csv)

## Recette

- `npm run test:budget` et `node scripts/test-browser-shards.mjs`.
- `npm run build` avec les seuils de poids du dépôt.
- Vérification de tous les fichiers téléchargés et des mesures de texte à 390 px avec `node scripts/playwright-budget-social-image.mjs`.
- Recettes studio et saisie manuelle à 1440, 390 et 320 px. Migration v4→v5, texte personnalisé, avertissement après modification, conflit de sauvegarde et de file, dates, échec d’encodage avec réessai, ZIP avec l’image exacte.
- Contrôle manuel des planches denses et des profils complétés. Les comparaisons utilisent le code public `5bca0be7`. Les fichiers Budget sont identiques dans le master de départ `33cf4519`.
