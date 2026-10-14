# Expositions, historiques et validation — 14 octobre 2026

## 1. Expositions

- Invesco Nasdaq-100 Equal Weight, IE000L2SA8K5 : tableaux complets de la fiche officielle au 31 août 2026 intégrés (7 lignes géographiques, 10 sectorielles). Pays : total 100 % ; secteurs : 100,1 % après arrondis publiés. Le collecteur contrôle identité, réplication physique, en-têtes, date de chaque tableau et complétude. Les positions de l'indice restent distinctes et conservent leur propre date.
- Source : https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE000L2SA8K5_factsheet_en.pdf ; SHA-256 `53e54b34157c2a786892dcb017e643dddcd8cd06e700052c2c6272ad4d69ddd4`.
- LifeStrategy 20/40/60/80 : contrôle GPX des quatre ISIN exacts (codes 9490, 9492, 9494, 9496), `marketAllocation` vide et classification actions absente. La brochure publie des secteurs « equity only » ; elle ne permet pas une allocation du fonds entier. Les fonds sous-jacents, l'allocation actions/obligations et les historiques existants restent conservés.
- Sources LifeStrategy : `scripts/lifestrategy-sources.json`, requête publique `scripts/collect_vanguard_etf.py`, https://www.nl.vanguard/content/dam/intl/europe/documents/en/lifestrategy-etf-eu-en-pro1.pdf. La brochure examinée porte un copyright 2024 : aucun poids ancien transplanté dans une observation courante.
- Inventaire : 197 instruments ; pays et secteurs complets passent chacun de 168 à 169. Les absences LifeStrategy, les secteurs Silver et les pays Avantis sont désormais expliqués précisément.

## 2. Historiques officiels

Les sources examinées n'apportent pas de nouveau calendrier annuel complet pour Silver, COPX ou Avantis. Leurs observations de septembre et leurs rendements glissants restent distincts des années civiles.

La collecte quotidienne sait désormais convertir leur YTD NAV officiel en année civile si et seulement si l'observation est au 31 décembre, l'année est clôturée et la part existait dès le 1er janvier. Une incohérence avec le rendement sur un an bloque cette capture. Chaque année garde URL, date et empreinte du document, même après les observations mensuelles suivantes. Aucune extrapolation et aucune reconstitution depuis le cours de marché.

Les 12 parts récentes déjà suivies restent en attente de leur première année complète : 9 à partir de janvier 2027, 3 à partir de janvier 2028, selon publication effective de l'émetteur.

## 3. Chargement et CI

- Les 39 commandes navigateur restent exécutées une fois chacune. Répartition déterministe par durée mesurée sur le run `38536157151` ; nouvelle commande : estimation de secours 15 secondes.
- Estimations avec ce même relevé : groupe le plus lent 394,9 → 222,8 secondes, soit environ 44 % de moins pour la phase d'exécution navigateur. Ce calcul n'est pas une promesse sur le temps total de CI ; installation, build et variabilité réseau restent présents.
- Les quatre groupes téléchargent les trois fichiers de données générés par le build validé. Suppression de quatre régénérations `prebuild` ; même commit, mêmes données, mêmes contrôles et mêmes conditions de déploiement.

## Suite

1. Intégrer une allocation LifeStrategy complète lorsque Vanguard publiera un périmètre exploitable ; ne pas mélanger poche actions et fonds entier.
2. Laisser les collecteurs intégrer les publications annuelles admissibles ; vérifier les premières captures lors des clôtures 2026/2027.
3. Observer les durées réelles après déploiement et actualiser les estimations si les tests évoluent.

La roadmap des 32 contradictions/INSEE reste dans son chantier distinct.
