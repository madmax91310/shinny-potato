# Vérification de publication de #1181

Relevé du 6 novembre 2026. Le rapport principal expose le résultat final et les restrictions. Les preuves de cette reprise distinguent :

- `baseline/` : site public antérieur au correctif, deux versements uniques réellement exécutés, textes copiés, historiques chargés et PNG téléchargés ;
- `public-version/` : reçu public final, HTML, ressources initiales et manifeste ; `sha=2850b220841fa19e4aa561804b474e5e280a956d`, `dataSha=d517425c4aec4635bc87ea2c2e2ea3c1077e6a8a` ;
- `public-calculator/` : huit parcours Chromium, 1440/390 px, montants natifs, unique/DCA ; réponses réellement reçues et vérifiées par leur empreinte, calcul indépendant, presse-papiers, aperçu et PNG téléchargé ;
- `public-restrictions/` : 22 contrôles publics, refus motivés et fenêtres utilisables, huit PNG anniversaire téléchargés ;
- `public-recipe-complete.json` : clôture cohérente de la recette et versions stables ; `navigation-retry/` conserve le premier passage interrompu par un délai de chargement, puis rejoué sans modification des assertions ;
- `post-merge-run-final.json`, `post-merge-jobs-final.json`, `post-merge-exhaustive.json` et logs : run Pages terminé, portail complet, quatre partitions disjointes, 64 contrôles financiers du build et six vidéos ;
- `verified-publication/` : reçu officiel de vérification publique téléchargé depuis l’artifact GitHub 13510883062 ; 382 empreintes du manifeste, dont 42 fichiers publics effectivement téléchargés ;
- `public-record-bindings.json`, `reused-proof-applicability.json` : concordance exacte des observations servies avec le registre source annoncé et applicabilité des preuves officielles déjà valides ;
- `ordinary-collection-receipt.json`, `ordinary-monthly-jobs-final.json` et `radar-incident-summary.json` : conservation après panne et signalements distincts de la correction des prix.

Les scripts de recette sont archivés avec les reçus. Ils utilisent les observations servies, sans importer le moteur financier. `independent-public-check.py` recalcule en `Decimal` depuis les réponses brutes ; `bind-public-records.py` vérifie leur concordance avec le registre Git du `dataSha`. Les chemins `/workspace/...` désignent l’environnement de cette exécution et sont à adapter pour un rejeu ailleurs.

Les images inspectées conservent la maquette existante. Les arrondis propres aux formats sont conservés : capital du calculateur à l’unité, prix anniversaire à l’unité dans le texte et avec décimales dans l’illustration. Ces affichages proviennent des mêmes observations qualifiées.

Les fichiers vidéo complets sont produits et téléchargés pendant la CI ; une suite verte ne les téléverse pas en artifact de diagnostic. Les logs attestent les six exports et le dossier `finalization/` conserve leurs mesures et dernières images locales antérieures. Aucun nouveau rendu vidéo public n’est affirmé.

`SHA256SUMS.json` couvre tous les fichiers de ce dossier, sauf lui-même. La branche documentaire qui archive ce relevé n’est pas une nouvelle correction applicative et ne publie pas le site.
