# Mise à jour automatique des données actives

Depuis ce raccord, les données collectées et validées remplacent automatiquement les données actives de leur périmètre, puis sont déployées sur Pages. Aucune confirmation manuelle n'est nécessaire.

| Périmètre | Cadence | Mise à jour effective |
|---|---|---|
| Inflation INSEE | 1er et 16 du mois | Taux mensuels à partir de 2026 et révisions validées |
| Cinq parts iShares | 3 et 16 du mois | Encours de la part dans leur devise publiée, frais, secteurs et géographies effectivement publiés, rendements calendaires NAV de la part |
| Bitcoin | 2, 4 et 8 du mois | Toute la série homogène Yahoo BTC-USD, janvier 2015 jusqu'au dernier mois achevé, recoupée avec les clôtures quotidiennes |

Les cinq ETF sont World, S&P 500, EM IMI, Japon IMI et World Small Cap. Les données communes alimentent leurs consommateurs : fiches, comparatifs et simulations concernés. Les indices conservent leurs propres compositions. Les principales positions restent datées séparément : elles ne sont pas collectées par ce connecteur. Une géographie absente ne supprime ni ne rajeunit la valeur précédente. Une photographie plus ancienne ne remplace pas une plus récente.

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
