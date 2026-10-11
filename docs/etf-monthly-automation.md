# Dix parts ETF : collecte mensuelle automatique

Les dix historiques ci-dessous sont collectés par `update-market-monthly.yml` : les 2, 4, 8 et 16 du mois, avec reprise quotidienne des échecs. Seuls les mois terminés sont intégrés. Les données validées sont dans `src/data/automated-etf-monthly.json`, les preuves dans `scripts/source-snapshots/monthly-automated.json`. Le registre consommable est `ETF_MONTHLY_HISTORIES` dans `src/data/etf-monthly-history.js`.

La collecte est raccordée, mais les dix ETF ne sont pas encore ajoutés aux sélecteurs des outils. Les formats et les séries existantes restent inchangés. Le JSON distinct évite de charger les nouveaux historiques dans les outils avant leur raccordement.

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

## Connexions proposées

1. « Et si tu avais investi » : dix ETF, versement unique et mensuel, comparaisons dans la même devise.
2. « Performance depuis » : dix ETF, périodes mensuelles ou annuelles dérivées de ces points, disponibilité limitée à chaque historique.
3. Générateur et Duel : vérifier les lignes ETF déjà présentes ; utiliser les calendriers annuels officiels existants. Les historiques mensuels seraient utiles uniquement à une simulation mensuelle ou une période libre.
4. « Il y a X ans » : nécessite une convention explicite. Un cours ajusté convient à une performance revenus réinvestis, mais pas à un ancien prix d’achat nominal. Pour conserver le squelette centré sur les prix, raccorder aussi les clôtures brutes historiques et la dernière séance quotidienne de la même cotation.
5. Présentation et Comparatif ETF : frais, composition et encours déjà raccordés ; ces nouvelles séries permettraient surtout des performances sur périodes communes et glissantes, en distinguant devise NAV et devise de cotation.
