# Automatisation : bilan consolidé du 31 octobre 2026

Photographie publique : 2026-10-31T04:48:47.334Z. Code `9994d531a9cc942a08bd311fc38d99662a0f03ae`, données `6694df723b35245437ca3fe9c653acea6ccc0c2c`. Ce relevé précède l’archivage final des rapports ; la dernière version servie se vérifie dans `build-info.json`.

Les lots validés sont fusionnés et leurs preuves source, enregistrement, publication et consommateurs sont distinguées dans `LIVRAISON.md`. Le chantier n’est pas déclaré entièrement automatisé.

- **Encours et caractéristiques** : quinze encours WisdomTree natifs déjà raccordés, puis renouvellement réel de sept d’entre eux et du nouvel encours ABTC. Huit montants/devises/périmètres/dates concordent avec la publication ; 24 recettes fiche/JSON, seize PNG. Frais ABTC 1,49 % vérifiés dans fiche, Bibliothèque et Comparatif ; sa date d’effet n’est pas inventée.
- **Historiques et portefeuilles** : cinq voies mensuelles WisdomTree rétablies et exercées ; Copper annuel utilisable en manuel/Duels. Six calculs annuels corrigés, calendriers partiels exacts conservés, minimum de six années de l’automatique maintenu. La reprise mensuelle ABTC est publiée avec huit calculs unique/DCA EUR/USD et deux PNG Performance depuis ; niveaux inchangés jusqu’à septembre 2026.
- **Expositions et autres producteurs** : six ventilations pays WT et les identités communes sont publiées ; nouvelle position Goldgroup de Global X Silver Miners vérifiée dans l’analyse et les PNG, sans nouvel actif de catalogue. Deux bulletins SCPI T3, IPC/anniversaire, Tudigo et 28 contrôles 13F ont leurs preuves distinctes. Les positions 13F ne sont pas redatées à la date de contrôle.
- **Enregistrement et publication** : ordre des cibles/couverture ETF corrigé ; reprises validées effectivement enregistrées et publiées. Les protections de concurrence et d’identité restent actives. Le nouveau champ de provenance FX a été retenu jusqu’au portail complet du code, puis publié.
- **Change commun** : le secours officiel Fed XML fonctionne réellement dans GitHub et jusqu’à la publication ; 333 mois identiques aux taux antérieurs. Les deux expirations FRED restent tracées. Aucun usage financier TWD nouveau n’est annoncé : aucune des 738 séries sélectionnables ne possède cette devise native.
- **Preuves de source** : 106 des 109 conflits DWS initiaux confirmés après stabilité, trois classifications partielles conservées. HANetf a effectivement recontrôlé 24 liens ; son extraction d’articles reste datée du 30 octobre. INSEE a acquis le sommaire et mis douze chapitres en file ; leurs chiffres ne sont pas encore certifiés.

## Périmètres et dénominateurs

Boîte active : 4834 diagnostics, classes `{"monitoring": 7, "failure": 24, "qualification": 4773, "connection": 30}`. L’export complet contient 6822 identités et conserve aussi l’historique et les états non actifs. Ces nombres ne sont pas des nombres de pannes distinctes.

La matrice conserve 34951 couples logiques donnée × usage, sur 24 routes, avec variantes détaillées. États `{"non applicable": 3792, "B": 31067, "A": 92}` : B désigne une limite ou une preuve manquante, sans transformer les références, hypothèses et archives en pannes. Aucun taux de couverture global n’est calculé. Les 661 identités initiales et toutes les anciennes identités de suivi sont conservées et vérifiées.

Les 79 cas financiers restent distincts : **70 fenêtres mensuelles qualifiées, neuf refusées ; zéro nouvelle fenêtre dans cette reprise**. Leur qualification a été rapprochée des voies réellement publiées, individuellement. Les 77 anciennes divergences et deux résidus ne sont pas expliqués automatiquement par une voie NAV indépendante. Statut des 19 actions : `{"partiellement corrigée": 5, "corrigée": 10, "périmètre supprimé": 2, "bloquée": 1, "déjà résolue": 1}` ; les deux périmètres supprimés ne sont pas des données réparées.

## Limites qui restent ouvertes

- Neuf fenêtres : DE000A0H08P6/2019 ; DE000A27Z304/2021,2023,2024 ; FR0010755611/2021,2024 ; FR0013411998/2025 ; FR0013412004/2025 ; IE00B4K6B022/2024. Bornes NAV, distributions exhaustives, niveaux réinvestis ou continuité exacts encore nécessaires. Palladium décembre 2014 reste un cas distinct hors des 79.
- Quatre acquisitions complètes : Battery/GGRA refusés depuis GitHub avec secours trop ancien ; Uranium sans poids du contrat de devise ; World Hedged brut/net incompatible. Quantum reste partiel pour le recouvrement intégral à 100,0002 %, sans preuve suffisante de convention. Les autres limites d’indices, de positions et d’identités sont détaillées par champ.
- Deux qualifications PEA, convention/positions QYLD, deux contrôles d’encours iShares PEA, conditions documentaires ou encore manuelles : pas de booléen ni de valeur de remplacement déduit du silence. Les anciens montants récents ne sont pas remplacés par un PDF plus ancien.
- WTAI : dernier contrôle en échec 403, non dépassé. Le passage conditionnel 41166439703 a tenté zéro historique ; il ne certifie ni WTAI ni les 684 séries. La prochaine collecte pleine reste programmée ; aucune nouvelle tentative fournisseur n’est inventée.
- Sources Radar encore en accès/extraction/qualification limités, douze chapitres INSEE en attente normale de la file, publications SCPI non encore annoncées : motifs conservés séparément. Les prochains cron après les derniers correctifs restent à observer ; les lancements push/manuels ne les remplacent pas.

## Fichiers séparés

- `bilan-par-outil.csv` : les 24 routes, fonctions opérationnelles/partielles/bloquées et preuves.
- `matrice-donnees-usages.csv.gz` : matrice unique ; `matrice-bilan.json` : dénominateurs.
- `suivi-consolide.csv.gz`, `causes-consolidees.csv.gz`, `restant-a-verifier.csv.gz` : mêmes identités, causes, impacts et pièces manquantes.
- `reconciliation-79-ecarts.csv`, `statut-19-actions.csv`, `perimetre-initial-complet.csv.gz` : périmètres constants rapprochés.
- `preuves/reprise-2026-10-30/` : reçus et réponses, résultats individuels, contrôles navigateur, empreintes et scripts de reproduction. La matrice et les autres CSV sont UTF-8, séparateur point-virgule, gzip pour les grands fichiers.
