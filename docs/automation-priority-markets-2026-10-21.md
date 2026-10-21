# Performances et compositions — 21 octobre 2026

## Périmètre et résultats

Cette livraison traite les cinq priorités demandées. Elle ne certifie pas une automatisation intégrale des sources encore privées, contradictoires ou non publiées. Les états ci-dessous distinguent observation disponible, renouvellement réel et raccordement aux outils.

| Priorité | Livraison | Limite maintenue |
|---|---|---|
| 1. Performances | Les séries mensuelles qualifiées alimentent aussi les calendriers de cotation des fiches lorsque le calendrier NAV officiel manque. Identité de cotation, cours ajustés, preuve de réponse et années complètes exigés. La conversion EUR/USD actualise les valeurs et les années structurées ensemble. | 688 historiques mensuels suivis à jour au bilan initial ; leurs sources restent surveillées. Aucun indice ni proxy substitué au rendement de la part. |
| 2. Pays et secteurs | Quatre collectes réelles iShares réussies : World Industrials, World Staples, World Energy, MSCI EMU. Nouvelle vue dédiée, dates par champ, et ventilation de la poche actions disponible pour Avantis (pays) et Silver Miners (secteurs). | Les ventilations de la poche actions restent distinctes de celles du fonds entier. Quatre LifeStrategy ne publient pas de ventilation qualifiée du fonds entier ; QYLD conserve ses conflits. |
| 3. Positions complètes | Uranium raccordé au CSV officiel complet : 59 lignes, dont deux positions séparées sans ISIN représentant ensemble 0,004 %. Cloud Computing passe à l’API officielle : 65 actions au 19 octobre, hors liquidités explicites. | Cloud contient une identité non qualifiée (nCino, environ 1,454 %). Aucun ISIN recopié depuis un nom. Les recouvrements affichent leur couverture partielle. Onze compositions physiques restent à raccorder. |
| 4. Calendriers manquants | Sept parts disposent de calendriers annuels calculés depuis leurs cotations qualifiées : Robotics, Uranium, Cybersecurity, Silver Miners, Copper Miners, Avantis Small Cap Value et QYLD. Texte, aperçu et image distinguent les cours ajustés du calendrier NAV. | Sept calendriers officiels restent non publiés/non qualifiés. Les treize premières années civiles attendues restent en attente, sans année de lancement artificiellement complétée. |
| 5. Indices exacts | Collectes réelles de MSCI World et Nasdaq PEA : deux compositions publiées et deux calendriers, sans erreur. Suivi des performances et répartitions d’indices dans la vue prioritaire. Contrôles d’accès renouvelés pour les trente raccordements de compositions intégrales en attente. | Une fiche pays/secteurs/top dix n’est pas une liste intégrale. Les trente compositions d’indices économiques restent à obtenir et qualifier. Aucun poids d’ETF utilisé comme poids de son indice. |

La qualification locale fait passer le backlog ciblé de 102 à 100 : un connecteur physique supplémentaire et l’incident de renouvellement Cloud sont levés localement. La confirmation GitHub et les compteurs réellement publiés priment sur ce relevé. Les quinze contrôles en retard concernent d’autres métadonnées WisdomTree ; ils ne sont pas effacés par ce chantier.

## Preuves et renouvellement WisdomTree

La page publique pouvait répondre 403 depuis GitHub. Le nouveau lecteur utilise le même point d’accès public que le composant émetteur : `https://www.wisdomtree.com/api/fund-holdings/3104137`. Le fonds, la classe, le ticker, la devise et la réplication sont reliés à la fiche officielle exacte `IE00BJGWQN72`. La fiche du 31 août prouve l’identité statique ; elle ne date jamais les poids du 19 octobre.

Les poids de l’API conservent leur photographie et leur dénominateur NAV. Le total, les contrôles publiés, les doublons FIGI, les dates et les types sont vérifiés. Les liquidités explicites sont séparées. Les positions non identifiées restent présentes avec leur poids.

OpenFIGI reçoit des requêtes ISIN indépendantes, puis si nécessaire des requêtes sur les FIGI de cotation exacts. Un rapprochement exige un FIGI identique, ou une requête du FIGI exact confirmant simultanément le même FIGI composite et la même classe d’actions. Le nom ne propose qu’un candidat. Requêtes, réponses complètes, empreintes et dates sont conservées dans l’observation brute. Les preuves sont réutilisées pendant leur durée de validité ; un nouvel identifiant ou une expiration déclenche leur renouvellement. Une erreur de source conserve la dernière composition validée et son incident.

Le collecteur existant `update-qualified-exposures.yml` renouvelle ces compositions quotidiennement ; aucun nouveau service secret ni abonnement n’est requis.

## Consommation et suivi

Dans **Données à revoir → Inventaire de toutes les données → Performances et compositions**, les filtres séparent calendriers officiels, séries mensuelles, pays, secteurs, positions complètes, performances d’indices et répartitions d’indices. Les alternatives calculées ne ferment pas artificiellement les lacunes des publications officielles. Les dates, sources et poids inconnus restent consultables.

Les sept calendriers de cotation alimentent les Fiches ETF. Les séries mensuelles et leurs conventions restent communes aux performances, simulations et duels. Les nouvelles positions alimentent les fichiers DCA générés, sans renormalisation ni modification manuelle des projections.

## Validation et preuve de publication

Tests des identités et conventions, années incomplètes, conversions structurées EUR/USD, calendriers NAV prioritaires, ambiguïtés/expiration des preuves, sommes/doublons de positions et conservation des inconnues. Audits catalogue, performances, indices, routage et moteur DCA. Recette Chromium mobile et ordinateur : sept fiches, suivi prioritaire et recouvrement Cloud. La publication n’est établie qu’après réussite du portail de production et contrôle HTTP du manifeste et de `build-info.json` publics.
