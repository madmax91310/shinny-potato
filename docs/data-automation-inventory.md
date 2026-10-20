# Inventaire permanent des données

L’écran « Données à revoir » propose l’inventaire des données utilisées par l’application. Son résumé se charge à l’ouverture de la page ; le détail est téléchargé uniquement lorsque l’utilisateur le demande.

`npm run audit:data-automation` régénère les fichiers publics puis vérifie les règles d’inventaire. Le prebuild les régénère également à chaque publication, avec les données réellement utilisées par ce build :

- `data/data-automation-inventory.json` : champs du catalogue, preuves, dates, consommateurs, chemins numériques, modules, schémas complets des fichiers JSON et couverture par champ ;
- `data/data-automation-summary.json` : résumé léger ;
- `data/data-automation-inventory.md` : bilan lisible ;
- `data/pea-automation.csv` : statut, valeur explicite, source, date réelle, empreinte de preuve, dernière tentative et prochaine action pour chaque part.

Le JSON couvre aussi les modules et projections absents du catalogue : historiques, portefeuilles SEC 13F, observations économiques/réglementaires, paramètres et données éditoriales. Les schémas parcourent tous les éléments des fichiers JSON ; les tableaux utilisent un chemin `[]`, les identifiants et périodes variables des segments dédiés. Un nombre peut être une observation, une hypothèse ou un identifiant : sa présence ne certifie pas sa nature financière.

## Lire les modes

- `scheduled-output` : le fichier figure dans la liste explicite de publication d’un workflow programmé ;
- `event-output` : publication configurée sans cron ;
- `mixed-or-derived` : le module dépend d’une sortie de collecte, avec des valeurs manuelles ou éditoriales possibles ;
- `manual-or-editorial` : aucune chaîne de publication trouvée dans les listes analysées. Une qualification reste nécessaire : le fichier peut contenir une fonction, du texte, une hypothèse ou une donnée vivante.

Un filtre de chemins de PR ne constitue jamais une preuve de collecte. Les listes de publication, dépendances et crons UTC sont extraits du dépôt courant. Les derniers succès/échecs réseau restent consultables dans le suivi des automatisations ; l’inventaire ne prétend pas avoir relu tous les fournisseurs. Les champs du catalogue portent donc la qualification `source-configuration-only`, distincte des observations automatiques et des diagnostics de couverture.

## Renouvellement des statuts PEA

Le collecteur quotidien de métadonnées lit les déclarations explicitement liées à la part exacte. Trois accès publics complètent les sources existantes :

- DWS : panneau `fundinformation-taxdata` de l’API française, ligne `Eligible au PEA`, type `BOOL`, après validation de l’identité exacte ;
- extraETF : réponse publique rendue dans `script#frontend-state`, unique paquet `api-v2/detail/`, une seule part, ISIN exact et booléen `international_features.fr.PEA`.
- FranceTransactions : cellule `Éligibilité PEA` de l’unique tableau `Fiche fonds` dont la ligne `Code ISIN` identifie la part, distincte des offres promotionnelles et de l’assurance-vie.

Une valeur absente, un tiret, une chaîne de caractères ou un champ PEA-PME ne devient jamais `false`. Les états contradictoires restent bloqués jusqu’à résolution, même lorsqu’un autre fournisseur ajoute une opinion majoritaire. Les refus HTTP et les pannes suivent la temporisation partagée ; les dernières preuves valides gardent leurs dates réelles.

Les fixtures sont des extraits de réponses effectivement observées ; `scripts/fixtures/metadata-connections/french-pea-provenance.json` distingue leurs empreintes de celles des réponses complètes. Le probe `scripts/probe_pea_completion.py` conserve les réponses et diagnostics sans publier de données. La publication reste effectuée par le collecteur validé et son workflow existant.
