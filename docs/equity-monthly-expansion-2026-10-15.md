# 50 actions supplémentaires — historiques automatisés

Les actions ne deviennent accessibles qu’après collecte validée. Source : Yahoo Finance, même titre et devise, contrôle du type EQUITY, du fuseau et des clôtures quotidiennes contre les bougies mensuelles. Ce recoupement est interne au même fournisseur, pas une certification indépendante.

- Consommateurs : Et si tu avais investi (ponctuel et DCA), Performance depuis (années complètes, prix ajustés), Il y a X ans (prix bruts, hors dividendes, cours récent daté).
- Historique mensuel : workflow update-market-monthly, jours 2/4/8/16 ; reprise quotidienne des échecs. Un échec conserve le dernier historique validé. Aucun mois en cours ni interpolation dans la source.
- Cours récents : refresh_anniversary_levels et workflow update-publication-observations ; seuls les titres disposant déjà d’un historique mensuel validé entrent dans cette collecte.
- Dividendes/divisions : prix quotidiens ajustés pour les rendements, prix bruts séparés pour les anniversaires. Pas de conversion de devises ; Samsung et SK hynix restent en KRW.
- Sept titres français commencent en janvier 2016 : décembre 2015 présente une contradiction entre les deux granularités et est exclu. Palantir et Ferrari commencent après leur admission en cotation.
- Transport navigateur : encodage compact des séries strictement mensuelles, reconstruction exacte vérifiée, aucun arrondi supplémentaire. Budgets initiaux (300 ko) et par fichier (500 ko) inchangés ; budgets des pages de recherche et de suivi adaptés aux 50 nouvelles métadonnées.
- Tests : bootstrap strict, rejet des identités incorrectes, préservation en cas d’échec, propagation du mois suivant, calculs pour les 50 titres, sélecteurs des trois outils, publications USD/EUR/KRW, rendu mobile.

| Action | Symbole | Devise | Premier mois |
|---|---|---|---|
| Walmart | WMT | USD | 2015-01 |
| Oracle | ORCL | USD | 2015-01 |
| Salesforce | CRM | USD | 2015-01 |
| AMD | AMD | USD | 2015-01 |
| Qualcomm | QCOM | USD | 2015-01 |
| Texas Instruments | TXN | USD | 2015-01 |
| Applied Materials | AMAT | USD | 2015-01 |
| Lam Research | LRCX | USD | 2015-01 |
| Micron Technology | MU | USD | 2015-01 |
| IBM | IBM | USD | 2015-01 |
| ServiceNow | NOW | USD | 2015-01 |
| Intuit | INTU | USD | 2015-01 |
| Palantir | PLTR | USD | 2020-10 |
| Goldman Sachs | GS | USD | 2015-01 |
| Bank of America | BAC | USD | 2015-01 |
| Morgan Stanley | MS | USD | 2015-01 |
| BlackRock | BLK | USD | 2015-01 |
| American Express | AXP | USD | 2015-01 |
| Charles Schwab | SCHW | USD | 2015-01 |
| Chevron | CVX | USD | 2015-01 |
| ConocoPhillips | COP | USD | 2015-01 |
| AbbVie | ABBV | USD | 2015-01 |
| Merck & Co. | MRK | USD | 2015-01 |
| Eli Lilly | LLY | USD | 2015-01 |
| Abbott Laboratories | ABT | USD | 2015-01 |
| Thermo Fisher Scientific | TMO | USD | 2015-01 |
| GE Aerospace | GE | USD | 2015-01 |
| Honeywell | HON | USD | 2015-01 |
| Siemens | SIE.DE | EUR | 2015-01 |
| Allianz | ALV.DE | EUR | 2015-01 |
| Munich Re | MUV2.DE | EUR | 2015-01 |
| Deutsche Telekom | DTE.DE | EUR | 2015-01 |
| Deutsche Börse | DB1.DE | EUR | 2015-01 |
| Airbus | AIR.PA | EUR | 2016-01 |
| Safran | SAF.PA | EUR | 2016-01 |
| Dassault Systèmes | DSY.PA | EUR | 2016-01 |
| EssilorLuxottica | EL.PA | EUR | 2016-01 |
| AXA | CS.PA | EUR | 2016-01 |
| BNP Paribas | BNP.PA | EUR | 2016-01 |
| Banco Santander | SAN.MC | EUR | 2015-01 |
| Iberdrola | IBE.MC | EUR | 2015-01 |
| Inditex | ITX.MC | EUR | 2015-01 |
| Ferrari | RACE.MI | EUR | 2016-02 |
| Infineon | IFX.DE | EUR | 2015-01 |
| Adidas | ADS.DE | EUR | 2015-01 |
| BMW | BMW.DE | EUR | 2015-01 |
| Bayer | BAYN.DE | EUR | 2015-01 |
| Danone | BN.PA | EUR | 2016-01 |
| Samsung Electronics | 005930.KS | KRW | 2015-01 |
| SK hynix | 000660.KS | KRW | 2015-01 |
