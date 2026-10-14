# Point 3 — compositions économiques et suivi automatique

Contrôle des sources officielles le 14 octobre 2026. **Le point 3 reste partiel : l'automatisation du contrôle est livrée, les compositions manquantes ne sont pas inventées.**

| Périmètre | Disponible | Reste à obtenir |
|---|---|---|
| LifeStrategy 20/40/60/80 | Fonds sous-jacents, allocation actions/obligations/liquidités, performances, frais et encours de chaque part | Pays et secteurs économiques du fonds entier ; la poche actions seule ne couvre pas les obligations |
| Silver Miners IE000UL6CLP7 | Pays et positions datés, performances, frais et encours | Tableau sectoriel complet du fonds ; absent de la page officielle contrôlée |
| Avantis IE0003R87OG3 | Secteurs complets, dix premières positions, performances, frais et encours | Tous les pays ; la fiche au 30 septembre ne donne que cinq pays totalisant 88,72 % |

## Automatisation livrée

- Chaque collecte quotidienne enregistre le statut du champ, la date du contrôle, l'URL et l'empreinte du document ou de la page. Les preuves sont conservées dans `fieldQualification` et reprises dans l'inventaire des champs manquants.
- Silver Miners : un tableau « Sector Breakdown » du fonds est automatiquement intégré lorsqu'il apparaît dans le format qualifié, avec date valide, lignes uniques et total entre 99 et 101 %. Un tableau d'indice, une table tronquée ou une date future ne peuvent pas alimenter le champ. Un format nouveau déclenche une erreur de collecte ciblée.
- Avantis : extraction et contrôle des cinq pays publiés et de leur couverture. Ces lignes restent des preuves de publication partielle et ne deviennent pas une allocation complète. Un changement de format déclenche une qualification à reprendre et un signal de collecte.
- LifeStrategy : nouvelle vérification de la page et du champ `marketAllocation` GPX pour chaque part. Une nouvelle section économique est signalée pour qualifier son périmètre avant publication. Les fonds détenus et la poche actions ne sont pas convertis en pays/secteurs par supposition.
- Le workflow quotidien LifeStrategy régénère et versionne aussi l'inventaire des manques. Les workflows existants assurent collecte, contrôles, publication et signalement des échecs ; pas de tâche manuelle quotidienne ajoutée.

## Sources et limites

Sources actives : pages françaises LifeStrategy exactes et fiches liées Vanguard, API publique GPX Vanguard ; https://globalxetfs.eu/funds/silv/ ; https://res.americancentury.com/docs/avantis-global-small-cap-value-ucits-etf-fact-sheet.pdf.

La recherche complémentaire a identifié les positions complètes Avantis, mais leurs colonnes n'établissent pas une répartition par pays économique. Le préfixe ISIN d'un titre ne remplace pas son pays économique. Une erreur HTTP sur un document supplémentaire ne prouve pas son absence. Les statuts « non publié » ci-dessus se limitent aux sources actives contrôlées.

## Suite de la roadmap

1. Qualifier une source complète pays/secteurs LifeStrategy, secteurs Silver et pays Avantis ; Silver est prêt à intégrer automatiquement son tableau au format contrôlé. Toute nouvelle structure ou tout nouveau périmètre exige une qualification initiale.
2. Analyses Caterpillar et Waste Management : historiques disponibles, analyses à terminer.
3. QYLD : qualification quotidienne active, données exactes encore partielles ou contradictoires selon le champ.
4. Parts récentes : collecte des premières années civiles complètes à leur publication en 2027/2028 ; suivi déjà automatisé.

Validation locale : 23 tests Python ciblés, tests des consommateurs LifeStrategy et des émetteurs prioritaires, inventaire des manques et lint. Les contrôles CI et le déploiement doivent être vérifiés sur la PR et le commit fusionné.
