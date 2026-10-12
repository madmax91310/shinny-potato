# Entreprises, historiques ETF et portefeuilles — 12 octobre 2026

Cette livraison traite uniquement les points 1, 2 et 3 approuvés. Aucun nouveau pays, outil ou squelette de publication. Une source renouvelable et une collecte réelle sont nécessaires avant activation. Les compositions et rendements d'indices ne remplacent jamais ceux d'une part ETF.

## Analyse entreprise

Onze sociétés sont activées : Mastercard, Broadcom, Texas Instruments, Adobe, Salesforce, ServiceNow, Intuit, Coca-Cola, PepsiCo, McDonald's et Intuitive Surgical.

Leurs archives officielles découvrent les futures publications à chaque collecte : liens HTML/PDF, documents intégrés au tableau Mastercard, flux financier officiel Q4 pour Salesforce/ServiceNow. Les unités, la société, la date, les comparatifs et les colonnes trimestrielles/annuelles sont contrôlés. Les tableaux de pourcentages, réconciliations non-GAAP et cumuls de six/neuf mois ne deviennent pas des comptes annuels. Trois ou quatre années GAAP et quatre BPA trimestriels effectivement publiés sont raccordés. Aucun Q4 n'est obtenu par soustraction.

PepsiCo conserve ses périodes fiscales en semaines : les dates publiées et les semaines annoncées concordent ; le quatrième trimestre de seize semaines n'est pas présenté comme trois mois. ServiceNow conserve les BPA publiés originaux et leur réexpression après division : ratio et date d'effet déclarés dans les notes de l'émetteur, confirmés par l'événement du fournisseur de cours. Un événement de cours seul ne suffit jamais à autoriser un PER.

Les cours sont les dernières séances terminées, dans la devise de cotation exacte. Les estimations Finviz et leur méthode existante restent distinctes des résultats GAAP publiés. Les cours, comptes, historique annuel et estimations suivent le workflow quotidien `update-company-analysis.yml` (06:35 UTC), avec audit et publication des changements.

S&P Global n'est pas activé : l'événement du fournisseur de cours du 1er juillet 2026 intervient après le dernier trimestre retenu. Le raccordement actuel ne permet pas de certifier une base comparable pour son PER historique. Aucun recalage arbitraire des BPA, des comptes ou des cours.

## Historiques des parts exactes

Tous les actifs ci-dessous vont dans **Performance depuis**, **Et si tu avais investi** et **Il y a X ans**, ainsi que dans les liens depuis leur fiche existante. Le dernier cours anniversaire est collecté automatiquement ; les simulations utilisent les cours ajustés des revenus, les anniversaires les cours bruts.

| Exposition | ISIN | Cotation historique | Début réel retenu |
|---|---|---|---|
| World Momentum | IE00BP3QZ825 | IWMO, Londres, USD | janvier 2015 |
| World Quality | IE00BP3QZ601 | IWQU, Londres, USD | janvier 2015 |
| World Value | IE00BP3QZB59 | IWVL, Londres, USD | janvier 2015 |
| World Small Cap | IE00BF4RFH31 | WSML, Londres, USD | avril 2018 |
| Infrastructures mondiales | IE00B1FZS467 | IDIN, Londres, USD | janvier 2015 |
| Santé mondiale | IE00BJ5JNZ06 | WHCS, Amsterdam, USD | novembre 2019 |
| Financières mondiales | IE00BJ5JP097 | WFNS, Amsterdam, USD | mai 2021 |
| Mines d'or | IE00BQQP9F84 | GDX, Milan, EUR | mai 2017 |
| Robotique | IE00BYZK4552 | RBOT, Londres, USD | octobre 2016 |
| Énergies propres | IE00B1XNHC34 | IQQH, Xetra, EUR | janvier 2015 |

Les clôtures quotidiennes de fin de mois et bougies mensuelles sont recoupées. Pour Momentum/Quality/Value, août 2015 présente une anomalie de bougie mensuelle : une requête quotidienne de fin de mois indépendante concorde avec la série quotidienne complète, avec la même tolérance. La bougie rejetée et la preuve indépendante sont conservées. Aucun mois n'est inventé, ni interpolé.

Neuf parts iShares réutilisent aussi le collecteur officiel structuré quotidien déjà présent : caractéristiques numériques, NAV, composition et cotations. Leur enregistrement « historique seulement » ne crée pas de fiche en double. Leurs preuves actuelles de cotation remplacent les anciennes lignes retirées du registre. VanEck Gold Miners conserve son collecteur officiel existant et sa cotation documentée.

Les performances mensuelles sont celles des cours de Bourse ajustés ; les performances calendaires des comparatifs sont les rendements NAV publiés par l'émetteur. Même part et revenus réinvestis, mais bases de valorisation distinctes : aucun taux n'est remplacé pour forcer une égalité artificielle.

Fréquence : collecte mensuelle les 2/4/8/16, reprise quotidienne des échecs ; derniers cours chaque jour. Les erreurs conservent les dernières observations validées et leur véritable date.

## Comparatifs et portefeuilles

Trois nouveaux comparatifs ETF/ETC :

- Or physique / mines d'or.
- World / private equity coté.
- Énergie / énergies propres.

Immobilier/infrastructures et World/petites capitalisations restent dans leurs comparatifs existants ; aucun doublon n'est ajouté.

Deux nouveaux Duels : World seul / World + 20 % d'infrastructures ; World seul / World + 10 % de private equity coté. Le duel World seul / World + 20 % de petites capitalisations existe déjà et reste disponible sans doublon.

Quatre recettes Généraliste Dynamique/Offensif : World 80 % + Quality 20 %, World 80 % + petites capitalisations 20 %, World 80 % + infrastructures 20 %, World 90 % + private equity coté 10 %. Les pondérations variables restent contrôlées par les bornes de risque existantes. Aucun levier ajouté. Les calendriers NAV et preuves de la part sont importés du registre partagé ; aucune copie de rendement dans les recettes. Les Duels gardent les conversions BCE déjà automatisées et la dernière période annuelle complète commune.

## Validation

Collectes réelles des comptes, historiques, cours et estimations ; contrôles des parts/cotations et preuves quotidiennes/mensuelles ; tests GAAP, périodes fiscales et divisions d'actions ; audits des comparatifs et Duels ; régression de 9 300 portefeuilles sans violation ; build et budget de 500 kB. Les contrôles Chromium et exports passent dans les workflows GitHub existants avant fusion.
