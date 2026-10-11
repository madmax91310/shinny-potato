# Dix parts ETF : collecte mensuelle automatique

Les dix historiques ci-dessous sont collectés par `update-market-monthly.yml` : les 2, 4, 8 et 16 du mois, avec reprise quotidienne des échecs. Seuls les mois terminés sont intégrés. Les données validées sont dans `src/data/automated-etf-monthly.json`, les preuves dans `scripts/source-snapshots/monthly-automated.json`. Le registre consommable est `ETF_MONTHLY_HISTORIES` dans `src/data/etf-monthly-history.js`.

Les dix ETF sont raccordés aux sélecteurs de « Et si tu avais investi », « Performance depuis » et « Il y a X ans », en simple et comparatif. Les formats et squelettes existants sont conservés. Les raccourcis depuis les fiches ETF pointent vers la part exacte, sans substitution par un indice. Le JSON distinct garde les nouvelles séries dans un module partagé séparé.

| ID | Part ISIN | Cotation exacte | Devise | Premier mois | Dernier mois validé |
|---|---|---|---|---|---|
| etfImie | IE00B3YLTY66 | IMIE.PA | EUR | 2011-11 | 2026-09 |
| etfVwce | IE00BK5BQT80 | VWCE.DE | EUR | 2019-08 | 2026-09 |
| etfEqualWeight | IE00BLNMYC90 | XDEW.MI | EUR | 2014-07 | 2026-09 |
| etfMinVol | IE00B8FHGS14 | MVOL.L | USD | 2012-12 | 2026-09 |
| etfWqdv | IE00BYYHSQ67 | WQDV.L | USD | 2017-07 | 2026-09 |
| etfTdiv | NL0011683594 | TDIV.AS | EUR | 2016-06 | 2026-09 |
| etfEpra | LU1437018838 | EPRA.PA | EUR | 2016-12 | 2026-09 |
| etfCmod | IE00BD6FTQ80 | CMOD.MI | EUR | 2017-02 | 2026-09 |
| etfSemi | IE000I8KRLL9 | SEMI.AS | USD | 2021-09 | 2026-09 |
| etfLock | IE00BG0J4C88 | LOCK.L | USD | 2018-10 | 2026-09 |

Les débuts correspondent à la couverture mensuelle retenue pour la cotation, pas nécessairement à la création du fonds. Les points utilisent les clôtures quotidiennes ajustées des distributions et divisions : frais du fonds inclus, distributions réinvesties, hors courtage et fiscalité de l’investisseur. La devise est celle de la cotation exacte ; aucune conversion arbitraire en euros. Aucun historique d’indice n’est utilisé pour prolonger une part récente.

## Contrôles et limites

L’identité ISIN/ticker/place/devise est liée aux preuves de cotation conservées. Yahoo fournit les cours : chaque dernière séance quotidienne est recoupée avec la bougie mensuelle. Une source qui change de devise, de convention ou d’identité échoue ; l’historique validé est conservé. Les séries nouvelles sans observation sont également reprises par le contrôle quotidien.

Quatre bougies anciennes sont discordantes : IMIE.PA en décembre 2012 ; XDEW.MI en décembre 2014, 2019 et 2020. Pour ces seuls mois explicitement enregistrés, une seconde requête quotidienne limitée à la dernière semaine du mois doit confirmer exactement la date, la clôture brute et la clôture ajustée de la requête longue. La bougie rejetée reste visible dans la preuve. Tout autre écart mensuel reste bloquant. Ce recoupement vérifie deux requêtes du même fournisseur ; il ne constitue pas une confirmation par un fournisseur indépendant.

## Raccordements réalisés

1. « Et si tu avais investi » : dix ETF, versement unique et mensuel, comparaisons et exports. Les capitaux restent dans la devise exacte de chaque cotation. La période peut commencer au premier mois disponible, sans extrapolation. Le repère Livret A est omis lorsque les taux ne couvrent pas toute cette période (IMIE et XDEW avant 2015), sans bloquer la simulation de l’ETF.
2. « Performance depuis » : rendements annuels calculés à partir des clôtures mensuelles ajustées ; seules les années civiles complètes disposant de leur clôture précédente sont proposées. Le détail annuel et son squelette restent inchangés. La première année proposée est 2012 pour IMIE et 2022 pour SEMI.
3. « Il y a X ans » : clôtures historiques `close`, sans réinvestissement des distributions, dans `anniversaryPoints`. Les prix Yahoo restent ajustés des divisions d’actions. La dernière clôture quotidienne de la même cotation est collectée par `update-publication-observations.yml` chaque jour à 07:40 UTC. Identité ISIN/ticker/place/devise conservée et contrôlée ; une observation âgée de plus de sept jours n’est plus utilisée automatiquement.
4. Formats visuels : illustrations existantes liées à l’exposition ; identité typographique par ticker pour les anniversaires. Aucun logo d’émetteur inventé et aucun changement de squelette.
5. Présentation ETF : les raccourcis Performance et Simulation sont générés automatiquement pour les dix ISIN exacts. Générateur, Duel et Comparatif conservent leurs calendriers annuels officiels et leurs devises propres.

## Validation

La collecte initiale des dix historiques et des dix observations quotidiennes a réussi le 11 octobre 2026 ; dernière séance quotidienne : 9 octobre. Les tests couvrent capital versé unique/DCA, distributions réinvesties séparées des anciens prix, plages disponibles, années civiles complètes, cotations exactes et propagation d’un mois futur jusqu’aux outils et à la provenance. Les workflows mensuel et déploiement exécutent `test-etf-tool-connections.mjs`. Les contrôles navigateur des trois exports vérifient les résultats, les devises et l’absence de chevauchement de texte.
