# Générateur, duels et DCA — lot 6 (18 octobre 2026)

Chiffres recomptés sur le dépôt avant intervention : 16 parts non actions, documentées sur six années
civiles complètes, restaient « manuel seulement » dans le Générateur (l’audit en annonçait 30 : le
recomptage ne retient que celles dont les six années 2020-2025 sont toutes publiées) ; les lignes
« or », « Bitcoin », « argent » et « Ethereum » des profils DCA n’avaient pas d’ISIN alors que les
ETC et ETP exacts sont collectés ; trois clés mortes (Orange, Engie, Veolia) ; l’exemple « World vs
6 actions » du composeur de duels vivait dans le composant.

## Générateur

- **Trois parts entrent dans les groupes d’options automatiques**, chacune dans le groupe dont elle suit
  l’exposition, jamais ailleurs :
  - `EUROSTOXX50_OPTIONS` : iShares Core EURO STOXX 50 Dist (IE0008471009) ;
  - `ASIA_OPTIONS` : Amundi PEA Japon TOPIX couvert en euros (FR0013411998) et iShares Core MSCI
    Pacific ex-Japan (IE00B52MJY50).
  Les deux parts issues des historiques mensuels qualifiés perdent le statut « manuel seulement »
  via `AUTOMATIC_RECIPE_ISINS` (`automated-portfolio-funds.js`) ; le test de routage l’exige part par
  part. Deux promotions envisagées ont été retirées avant fusion : BNP Paribas Easy STOXX Europe 600
  (FR0011550193) et Amundi PEA Inde (FR0011869320), dont le calendrier NAV du Comparateur d’indices et
  la série de marché du Générateur divergent de 0,5 à 1,5 point sur 2023-2025 ; l’audit de cohérence
  des performances n’accepte cet écart que pour une part restée manuelle, où la note de méthode le
  signale. Elles restent manuelles. Résultat : stress test de régression et mode combo sur les combos
  touchés (Thématique Équilibré, Pro-Européen) passés.
- **Treize parts restent manuelles, par choix documenté** : World Islamic (indice filtré, pas un
  substitut du World) ; les six ETC mono-matière WisdomTree (pétrole Brent et WTI, gaz, café, cacao,
  blé : un contrat à terme unique ne remplace pas un panier diversifié dans la poche « matières
  premières ») ; les trois régions émergentes PEA (Asie émergente, Amérique latine, EMEA : une région
  seule ne tient pas le rôle « émergents » d’une recette) ; VanEck Global Mining (producteurs, distinct
  des matières premières physiques ; aucun groupe « producteurs mondiaux » n’existe) ; BNP Paribas Easy
  STOXX Europe 600 et Amundi PEA Inde (écart NAV / marché non toléré hors du mode manuel, voir ci-dessus).
- **Fenêtre courte** : la note de méthode signale désormais toute fenêtre de moins de six années
  communes (« Fenêtre courte : 3 années communes (2023–2025) ; la pire année observée n’est pas
  comparable… »), dans l’outil comme dans le texte. Le mode automatique conserve l’exigence de six
  années ; la fenêtre courte en génération automatique (éligibilité à trois ans, bornes de pire année
  propres, même fenêtre pour toutes les lignes, conservation lors des remplacements) reste le lot
  distinct prévu par `docs/generator-expansion-2026-10-16.md` : elle touche `engine.js`, les bornes
  de risque et le stress test, et n’a pas été entreprise ici.

## Duels

L’exemple du composeur manuel (`MANUAL_EXAMPLE`) vit dans `portfolio-duels/data.js` ; l’audit des
duels vérifie que ses identifiants existent dans le catalogue et que chaque côté totalise 100 %.

## Portefeuille & DCA

- `gold`, `silver`, `btc` et `eth` référencent des parts exactes : iShares Physical Gold
  (IE00B4ND3602), iShares Physical Silver (IE00B4NCWG09), CoinShares Physical Bitcoin (GB00BLD4ZL17),
  CoinShares Ethereum Staking (GB00BLD4ZM24), les mêmes ETC/ETP que le Générateur, avec leur
  classification hors actions (« Or », « Argent », « Bitcoin », « Ethereum »). Une référence sans
  pays, secteurs ni poche actions est servie en ligne par le greffon de données différées : aucun
  téléchargement supplémentaire, ce que `test-selected-records.mjs` vérifie.
- Les clés mortes `orange`, `engie`, `veolia` sont retirées.

## Limites

- Les groupes d’options traduisent une équivalence d’exposition jugée à la main (indice suivi) ; une
  part couverte en devise (TOPIX hedged) a un profil de risque différent de la part non couverte, ce
  que le stress test borne mais ne commente pas dans le texte généré.
- La fenêtre courte automatique n’est pas livrée (voir ci-dessus).
