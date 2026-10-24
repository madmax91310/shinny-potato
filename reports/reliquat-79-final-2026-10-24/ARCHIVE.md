# Rapports séparés et conservation

Les fichiers de livraison CSV, JSON et Markdown sont conservés individuellement dans la branche `reports/reliquat-79-final-20261024`, dossier `reports/reliquat-79-final-2026-10-24`. Cette branche documentaire conserve le code de son parent sans modification de fonctionnement ; elle n’est pas une nouvelle livraison de l’application.

Les gros fichiers bruts, journaux et PNG restent dans les sous-dossiers locaux `preuves/`, avec leurs empreintes dans INDEX-PREUVES.json et leurs origines dans INDEX-ORIGINES-PREUVES.json. Les réponses sources et résultats GitHub indispensables de chaque correctif sont aussi dans les PR et leurs artefacts explicitement référencés. Les artefacts GitHub ont leur propre rétention ; cette archive ne prétend pas les héberger tous. Aucun fichier complet de code fournisseur n’est republié dans la nouvelle archive.

ARCHIVE-GITHUB.json, fourni séparément après création, donne le commit immuable de conservation des rapports. Le code et les données de production sont ceux de PUBLICATION.md ; le commit d’archive n’est jamais présenté comme code déployé.
