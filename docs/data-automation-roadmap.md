# Mise à jour automatique des données actives

Depuis ce raccord, les données collectées et validées remplacent automatiquement les données actives de leur périmètre, puis sont déployées sur Pages. Aucune confirmation manuelle n'est nécessaire.

| Périmètre | Cadence | Mise à jour effective |
|---|---|---|
| Inflation INSEE | 1er et 16 du mois | Taux mensuels à partir de 2026 et révisions validées |
| Parts iShares, Amundi et State Street qualifiées (85 au 5 octobre 2026) | 3 et 16 du mois | Encours de la part dans leur devise publiée, frais, secteurs et géographies effectivement publiés, rendements calendaires NAV de la part |
| Bitcoin | 2, 4 et 8 du mois | Toute la série homogène Yahoo BTC-USD, janvier 2015 jusqu'au dernier mois achevé, recoupée avec les clôtures quotidiennes |

Les cinq ETF sont World, S&P 500, EM IMI, Japon IMI et World Small Cap. Les données communes alimentent leurs consommateurs : fiches, comparatifs et simulations concernés. Les indices conservent leurs propres compositions. Les principales positions restent datées séparément et sont collectées pour les fonds actions physiques qualifiés. Une géographie absente ne supprime ni ne rajeunit la valeur précédente. Une photographie plus ancienne ne remplace pas une plus récente.

Le Bitcoin conserve Yahoo : aucune concaténation avec Coinbase. Le pilote Coinbase reste un diagnostic indépendant. Les réponses invalides, années incomplètes, incohérences d'identité/devise, mois manquants et écarts entre clôtures mensuelles/quotidiennes bloquent l'application. Les réponses brutes Bitcoin sont conservées hors du bundle public ; les données actives et leur preuve sont commitées ensemble. Les collectes identiques ne créent pas de commit. Les passages suivants relancent le déploiement même sans nouvelle valeur, pour reprendre une publication interrompue. Les PR appliquent dans leur copie de validation, sans pousser ni déployer.

Les performances de nouvelles années sont archivées dans le registre automatisé. La fenêtre de simulation actuelle reste explicitement 2020–2025 : le remplacement corrige les valeurs de ces mêmes années, sans déplacer les périodes des exemples.

## Roadmap restante

1. Étendre ces connecteurs aux autres parts iShares réellement utilisées, puis Amundi, puis Vanguard/DWS/State Street selon le catalogue. Une connexion commune par émetteur, pas une collecte par outil.
2. Qualifier les téléchargements officiels des principales positions et les géographies manquantes, avec leurs dates réelles et périmètres fonds/indice distincts.
3. Adapter explicitement les consommateurs à la nouvelle année de performance achevée ; conserver les fenêtres des exemples historiques lorsque souhaité.
4. Afficher dans « Données à revoir » la dernière collecte réussie, la photographie disponible, le mode réel et les exceptions dédupliquées par source.
5. Étendre les séries historiques par source homogène, avec méthode, devise, dividendes et couverture contrôlés.

Le lot 5 initial concernant le renforcement des 13F reste exclu. Les mises à jour 13F existantes sont conservées.

Suivi : traiter les échecs/retards signalés par les workflows ; revue semestrielle des statuts PEA et caractéristiques sans preuve structurée ; revue annuelle des connecteurs. Le statut PEA ne se déduit pas du domicile ou de l'indice.

## Extension du 5 octobre 2026 : lots 1 et 2

Le workflow `collect-etf-pilot.yml` met maintenant à jour **85 parts du catalogue** : 41 iShares, 35 Amundi et 9 State Street. Les identifiants et liens officiels sont configurés dans `etf-pilot.json`, `amundi-etf.json` et `ssga-etf.json`. Aucune recherche, saisie, intervention d'IA ou clé API n'est nécessaire lors des passages GitHub (3 et 16 de chaque mois).

- iShares : API publique BlackRock publiée par les composants des pages officielles (accès structuré direct, sans dépendre de la page de consentement HTML) ; encours de la part, TER et rendements NAV calendaires publiés ; pour les fonds actions, principales positions via l'API officielle BlackRock. Quand la page ne publie pas la géographie, le pays de risque de toutes les positions fournit la répartition, avec liquidités/dérivés et sans renormalisation.
- Amundi : API officielle `ProductAPI/getProductsData` ; encours **de la part** issu de l'historique daté `shareAumInMCcy` (valeurs en unités monétaires, jamais multipliées par un million), TER et performances calendaires de la part. Les principaux titres, pays et secteurs sont appliqués seulement aux fonds physiques et avec les dates propres publiées. Les synthétiques conservent leurs expositions existantes : le panier de substitution n'est pas leur indice ; une date absente d'indice n'est pas remplacée par la date du fonds.
- State Street : JSON embarqué des pages officielles pour TER, encours et NAV net total return calendaires ; fichiers XLSX officiels avec ISIN et date pour les dix principales positions des fonds actions. Encours du fonds et encours de la part restent distingués. Les unités publiées sont utilisées, indépendamment du nom du champ « millions ».

Les frais, encours, performances et détails de comparaison alimentent le registre commun et ses consommateurs existants. Les rendements d'une nouvelle part incomplète ne remplacent pas les proxys de simulation. Une composition plus ancienne ne remplace pas une photographie plus récente ; une composition absente ne rajeunit ni n'efface la précédente. Les données brutes et rapports sont conservés en artefacts GitHub 35 jours.

Une collecte est validée et appliquée atomiquement par émetteur. Une source défaillante laisse ses valeurs actives intactes et ne bloque pas la publication des autres émetteurs validés ; le workflow termine néanmoins en échec visible via `report-failures`. Les audits et la compilation restent obligatoires avant commit et déploiement. Une collecte identique ne produit pas de commit ; le déploiement suivant peut reprendre une publication interrompue.

Limites explicites : le catalogue iShares sans page structurée qualifiée, Vanguard et DWS restent à qualifier. Les frais/encours des cinq parts initiales ne sont plus le périmètre complet. Les indices gardent leurs registres distincts. Les secteurs obligataires ne sont pas assimilés aux secteurs actions. Les années de simulation restent 2020–2025.
