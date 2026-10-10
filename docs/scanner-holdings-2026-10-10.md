# Scanner ETF — données complètes et fraîcheur

## Résultat des étapes 1 et 2

Étape 1 implémentée : 32 ETF actions physiques iShares déjà présents au catalogue,
17 823 positions publiées dans les observations du 8 octobre 2026, contrôlées le
10 octobre. Chaque fichier contient toutes les lignes publiées, y compris les
positions à poids nul, liquidités, futures, marges et opérations de change.
Les poids originaux ne sont jamais rétablis artificiellement à 100 %.

La composition complète du **fonds** ne devient pas celle de son **indice** :
plusieurs fonds pratiquent l'échantillonnage. Cette distinction est portée par
`basis`, `scope`, `replicationMethod` et `method`.

Étape 2 partielle : les sources publiques actuelles des six ETF PEA suivis ne
fournissent pas encore une composition économique complète qualifiée. Le suivi
de couverture est automatisé, mais ces produits restent indisponibles pour un
calcul exhaustif des chevauchements.

## Collecte quotidienne

Le workflow existant `collect-etf-pilot.yml`, programmé chaque jour à 07:10 UTC,
récupère déjà les colonnes complètes `holdings.all` de l'API officielle iShares.
`refresh_scanner_holdings.py` réutilise ce rapport : aucun téléchargement
supplémentaire dans le chemin normal et aucune modification des données top dix
consommées par les outils existants.

Les instantanés sont écrits dans `public/data/scanner-holdings/<ISIN>.json`.
Le fichier `manifest.json` indique les produits disponibles, la couverture des
identifiants, la provenance, les erreurs et les dates. Les gros fichiers ne sont
importés dans aucun module JavaScript : le futur scanner les chargera à la demande.

Les changements de ces fichiers sont inclus dans le commit quotidien et le
déploiement existants. Une source échouée préserve le dernier fichier valide et
son dernier contrôle réussi ; les autres produits peuvent être actualisés.
Le rapport `scanner-observation.json` participe à la remontée des échecs de
l'automatisation, avec un identifiant distinct par ETF.

## Qualification et fraîcheur

- Identité exacte de la part et du produit, devise et réplication physique vérifiées.
- Toutes les colonnes doivent avoir la même longueur ; noms, poids et ISIN
  publiés sont contrôlés, sans inventer d'identifiant.
- La somme des poids doit concorder avec 100 %, dans une tolérance limitée à
  l'arrondi des pourcentages publiés. La couverture n'est pas déduite du top dix.
- Des lignes peuvent partager un ISIN, notamment sur plusieurs places ou lors
  d'opérations sur titres. Elles sont conservées pour une agrégation ultérieure.
- Des droits/CVR sans ISIN restent dans la composition. Leur nombre et leur poids
  sont affichés dans les métadonnées ; ils ne pourront pas être rapprochés entre
  fonds par simple ressemblance de nom. `complete` signifie toutes les lignes
  publiées, pas 100 % de titres rapprochables ni composition complète d'indice.
- Les retours à une date plus ancienne, les variations importantes de comptage
  et les contenus contradictoires pour la même date sont rejetés.
- `asOf` date la composition ; `checkedAt` date le dernier contrôle réussi ;
  `modifiedAt` date le changement des valeurs ; `lastAttemptAt` date la tentative.
- Politique quotidienne : composition de 7 jours maximum et contrôle réussi de
  2 jours maximum. Les limites sont dans `scripts/scanner-holdings.json`.
- Le workflow indépendant `scanner-holdings-health.yml`, à 09:30 UTC chaque
  jour, recalcule les âges et vérifie l'intégrité même si la collecte ne tourne
  plus. Ses échecs rejoignent le suivi des automatisations.

Le futur consommateur doit recalculer la fraîcheur à partir des dates et de la
politique au moment de la lecture. Il ne doit jamais se fier uniquement au booléen
`available` d'un manifeste qui pourrait avoir cessé d'être actualisé.

## Sources PEA examinées

| Produit | ISIN | Observation actuelle | Conclusion |
|---|---|---|---|
| Amundi PEA Monde | FR001400U5Q4 | API Amundi : `INDEX_TOP10`, pays, secteurs, date propre à l'indice | Dix lignes ne suffisent pas |
| Amundi PEA Global | FR0014017NX3 | Même API, indice MSCI ACWI exact | Dix lignes ne suffisent pas |
| Amundi PEA Emergent | FR0013412020 | API : MSCI EM ex-Egypt ESG Broad CTB Select Index | Ne pas substituer MSCI EM classique ou EM IMI |
| Amundi PEA Europe | FR0013412038 | API : MSCI Europe Net TR EUR Index | Dix lignes ne suffisent pas |
| iShares World Swap PEA | IE0002XZSHO1 | Collecteur existant : exposition d'indice du document officiel | Dix lignes ne suffisent pas ; panier du fonds exclu |
| BNP STOXX Europe 600 | FR0011550193 | Collecteur existant : principales lignes de l'indice | Source complète à qualifier ; photographie actuelle déjà ancienne |

Vérification primaire du 10 octobre : l'API Amundi `getProductsData` renvoie
exactement dix positions `INDEX_TOP10` pour les quatre produits testés en direct.
Le widget officiel `amundi-product-page.js` version `20.1.100` génère son export
Excel d'indice à partir des mêmes données de top dix ; le bouton d'export ne
fournit donc pas, sur ce chemin, une liste complète cachée.

La page publique de constituants MSCI annonce des données différées et une
consultation sur la page uniquement ; elle n'est pas une source quotidienne
qualifiée pour cette application. Aucune donnée de cette page n'est copiée.

Sources examinées :

- https://www.amundietf.fr/mapi/ProductAPI/getProductsData
- https://www.amundietf.fr/fr/professionnels/produits/equity/amundi-pea-monde-msci-world-ucits-etf/fr001400u5q4
- https://amundiprodcdn2.azureedge.net/widgets-assets/product-page/20.1.100/amundi-product-page.js
- https://www-cdn.msci.com/web/msci/index-tools/constituents

Une future source complète doit fournir l'indice exact, toutes ses positions,
des identifiants rapprochables, leurs poids et une date économique exploitable.
Un ETF physique suivant un indice voisin ne débloque pas artificiellement un
produit PEA. Aucun raccordement approximatif n'est créé dans ce lot.

## Vérification

```sh
python -m unittest discover -s scripts -p 'test_scanner_holdings.py'
python scripts/refresh_scanner_holdings.py --report /tmp/observation.json --output /tmp/scanner-observation.json
python scripts/refresh_scanner_holdings.py --audit
```

Les tests couvrent troncature, mauvaise identité, panier synthétique, poids
invalides, dates futures, fraîcheur indépendante, conflits à date égale,
retour en arrière, conservation après échec, positions sans identifiant,
plusieurs lignes de même ISIN et altération du fichier publié.
