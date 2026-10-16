# Suite des quatre priorités ETF — 16 octobre 2026

## Résultat du contrôle réel

La couverture ne progresse pas artificiellement : 209 instruments, 193 calendriers
émetteurs, 181 pays, 181 secteurs et 186 listes de positions. Les frais et encours
restent présents pour les 209 instruments. Les rendements calculés des cotations
exactes restent distincts des calendriers NAV émetteurs.

### 1. QYLD — part IE00BM8R0J59

La page officielle https://globalxetfs.eu/funds/qyld/ a été téléchargée à nouveau.
Les deux séries de poids contradictoires restent présentes dans les constituants
de référence, notamment NVDA 8,30/9,20 et AAPL 7,40/8,60. La section de performances
est toujours intitulée USD Accumulating. Le JSON embarqué fournit des rendements
glissants, avec une liste `discrete` vide : il ne débloque pas un calendrier annuel
de la part distribuante. Le tableau sectoriel de référence reste non réconcilié.

Le collecteur reconnaît désormais aussi le découpage sans section Options Contract
Detail. Le diagnostic des positions s'arrête avant le panier de substitution ou
les cotations : des poids de périmètres différents ne peuvent pas créer un faux
conflit. Les contradictions réellement présentes dans l'indice restent signalées.

La fiche courante liée par l'émetteur via FundAssist
https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1
renvoie HTTP 500 lors de ce contrôle. L'ancienne URL de fiche renvoie 404.
Aucune performance de la part américaine ou capitalisante n'est substituée.

### 2. LifeStrategy — quatre parts exactes

Les quatre collectes étaient bloquées par la date officielle `30 sept. 2026`.
Les dates françaises abrégées sont maintenant reconnues, sans élargir les limites
de fraîcheur ni accepter des dates futures ou impossibles. Les quatre collectes
réelles réussissent après correction ; leurs observations valides sont intégrées.

Les pages, fiches et données GPX qualifiées ne fournissent toujours pas de
ventilation géographique/sectorielle du fonds entier. Les fonds sous-jacents et
les allocations actions/obligations/liquidités sont conservés avec leurs dates.
Un calcul traversant tous les sous-jacents n'est pas qualifié dans ce lot : il
demanderait une identité et une composition complète, cohérente en date et en
périmètre, pour chaque fonds. La poche actions seule ne remplit pas ce contrat.

### 3. Avantis et Silver Miners

La fiche Avantis exacte a été récupérée avec le collecteur existant. Elle publie
cinq pays couvrant 88,72 % au 30 septembre, sans détail des 11,28 % restants.
Les pages détaillées et de positions du site Avantis ont renvoyé HTTP 403 lors de
ce contrôle. Les pays ne sont pas déduits des préfixes ISIN.

La page Silver Miners fournit les pays et positions, mais aucun tableau sectoriel
complet. Le contrôle existant est testé : une publication complète est intégrée,
une table tronquée, future ou ambiguë est refusée. La fiche FundAssist courante
https://expressapi.fundassist.com/v1/api//Files/ffa314b1-903a-ed11-a856-005056a103bb/1
renvoie HTTP 500 lors de ce contrôle. Aucun secteur n'est inventé à partir du nom.

### 4. Douze parts récentes

Le contrôle quotidien et les échéances existent déjà. La fusion dans le registre
actif vérifie maintenant aussi les dates de lancement qualifiées : elle refuse
les années partielles de lancement et les historiques de prédécesseurs. Des tests
parcourent les douze parts : acceptation de la première année complète après sa
clôture, rejet d'une publication prématurée, rejet de l'année partielle et
préservation des dernières observations valides lors d'un échec.

Neuf premières années pourront être publiées au plus tôt en 2027 et trois en 2028.
Ces dates restent des minima, pas des promesses de publication par les émetteurs.

## Limites de livraison

Les corrections de fiabilité sont livrables. Les données complètes des points 1,
2 et 3 restent bloquées par les preuves disponibles. Le point 4 est préparé et
testé ; aucune année future ne peut être ajoutée aujourd'hui.
