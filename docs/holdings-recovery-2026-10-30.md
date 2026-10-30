# Reprise des compositions — 30 octobre 2026

Base relue : master `1b331a3d` ; #1059, #1060 et le correctif JPMorgan #1062 conservés. #1031 a été examinée, rejouée sur cette base puis intégrée (`178460602`) : diagnostic Global X et capture brute dans l’artefact ordinaire, sans déclaration de réparation financière. #1061 concerne les encours iShares PEA ; aucun de ses fichiers n’est modifié. Le périmètre du producteur ordinaire est toujours 183 acquisitions, dont quatre validations dérivées LifeStrategy distinctes des contacts source.

## Les cinq échecs du bilan précédent

État du registre après la collecte ordinaire du 30 octobre à 00:56 UTC : **179/183 validations, quatre refus**. Ce bilan ne signifie pas 179 contacts source frais : les dérivations sont distinguées par les contrats existants.

| Fonds / ISIN | État et cause | Dernière observation admise ; contrôle source | Effet dans les analyses |
|---|---|---|---|
| WisdomTree Battery Solutions — IE00BKLF1R75 | Accès API précis et fiches en403 depuis GitHub ; classement public de secours plus ancien refusé | 28/10 ; 29/10 22:59:40 UTC ; 111 positions | Expositions et recouvrement utilisent la dernière observation selon les règles de fraîcheur, sans prétendre à une actualisation réussie |
| WisdomTree Global Quality Dividend Growth — IE00BZ56SW52 | Même panne d’accès, même refus de régression | 28/10 ; 29/10 22:59:40 UTC ; 439 positions | Même règle ; liquidités explicitement séparées, sans renormalisation |
| Global X Uranium — IE000NDWFGA5 | Source lisible mais champ financier absent : CURRENCY CONTRACT - ZAR sans NET_ASSETS ni MARKET_VALUE dans le CSV29/10 | 28/10 ; 29/10 22:32:10 UTC ; 59 positions | Ancienne composition conservée ; poids du dérivé non inventé, ligne non supprimée pour qualifier artificiellement le livre |
| JPM Global Equity Premium Income Active — IE0003UVYC20 | **Rétabli par #1062 déjà sur master** : date propre du livre et de ses lignes distincte du cartouche de valorisation | 29/10 ; 30/10 00:56:12 UTC ; 236 positions | Nouvelles actions consommées ; options/droits/liquidités séparés, pas de mélange des dates |
| iShares MSCI World EUR Hedged — IE00B441G979 | Acquisition accessible, périmètre brut/net non admis : actions100,76218%, NAV net100,00001%, contrats à terme−1,89321% | 23/10 ; 27/10 14:45:21 UTC ; 1247 positions | Diagnostic du livre28/10 conservé séparément ; seuil actions100,5% inchangé, ancienne observation non redatée |

Sources exactes :

- Battery : https://www.wisdomtree.com/api/fund-holdings/7369317
- GGRA : https://www.wisdomtree.com/api/fund-holdings/1000422
- Global X : https://globalxetfs.eu/funds/urnu/ → https://globalxetfs.eu/api/funds/urnu/topholdingscsv
- JPM : https://am.jpmorgan.com/FundsMarketingHandler/product-data?cusip=IE0003UVYC20&country=sg&role=per&language=en&userLoggedIn=false
- World Hedged : produit BlackRock251891, API partagée `keyFundFacts,holdings.all`, ISIN exact contrôlé ; URL et SHA conservés dans `lastRejectedObservation`.

Le CSV Global X réellement acquis possède l’empreinte `646eebe2df1649fe10d70aaa97830ace5d1b539efd896dd437ad14d9bcadd5fc`. Le nombre de contrats ou d’actions ne permet pas de déduire le poids manquant. La copie brute reste dans l’artefact de diagnostic ; aucun remplacement numérique n’est committé.

## Recherche de voies officielles

**WisdomTree.** Le téléchargement « View all holdings » observé dans le client officiel appelle exactement les API ci-dessus ; le bouton ne fournit pas une seconde source indépendante. Les fiches et la route irlandaise ainsi que le navigateur public ont déjà été testés depuis trois environnements GitHub dans #1059 : refus403, pas de résolution de challenge. Les nouvelles requêtes locales sans en-têtes client sont également refusées ; le producteur partagé avec ses en-têtes ordinaires réussit néanmoins les deux livres28/10 localement à07:26 UTC, avec exactement les empreintes de #1059. Ce succès local ne prouve pas un rétablissement GitHub. Le classement Dataspan officiel, déjà qualifié par le même producteur, reste un secours soumis au contrôle de date ; un livre23/10 ne remplace pas un livre28/10.

La documentation officielle https://docs.wisdomtreeconnect.com/dataspan/auth décrit une clé serveur `x-wt-dataspan-key` et la possibilité d’autoriser les clients soumis aux limites. Elle ne prouve pas que ces deux livres UCITS soient couverts par ce service : demander confirmation de couverture et droit d’utilisation à l’émetteur avant tout raccordement. Aucune clé récupérée dans un client, aucun relais public, changement d’origine ou contournement du refus403.

**Indices des synthétiques.** Les contrats de compositions natives admis restent ceux du TOPIX (`FR0013411980`, `FR0013411998`) : poids JPX natifs, identités de même date et preuve du benchmark exact, base `index`. Les livres d’ETF physiques du même indice ne deviennent pas des compositions natives. Les autres données déjà qualifiées restent utilisables uniquement dans leur périmètre (pays/secteurs/principales positions), sans élargissement à l’intégralité.

| Part synthétique existante | Source officielle examinée | Blocage restant |
|---|---|---|
| BNP Easy Europe600 — FR0011550193 | https://stoxx.com/index/sxxr/?components=true ; API et KID BNP examinés dans #1059 | Nouvelle réponse200 du30/10 : table avec en-têtes Company/Supersector/Country/Weight, **zéro ligne**. Fiche publique limitée au top10 ; téléchargements de composition historiques404. Panier comptable BNP non économique et exclu. Accès pondéré intégral à obtenir |
| Amundi PEA Nasdaq100 — FR0011871110 | https://indexes.nasdaq.com/Index/Weighting/XNDXNNR | Nouvelle réponse200 : identité exacte NASDAQ-100 Notional Net Total Return, avertissement « Log in for Full Access », aucune ligne pondérée publique. Le téléchargement Amundi de substitution reste exclu. Accès autorisé et droits sur le fichier complet nécessaires |
| Amundi PEA Immobilier Europe — FR0011869304 | https://www.epra.com/research/monthly-reports ; LSEG/FTSE EPRA Nareit | Le PDF public examiné dans #1059 est le Developers Benchmark, pas le FTSE EPRA Nareit Developed Europe exact. Aucun recollage de périmètres ou renormalisation de poids mondiaux |
| Amundi PANX — FR0013412269 | https://www.solactive.com/index/DE000SL0J395/ ; fiche Amundi exacte | Benchmark Solactive ISS ESG US Tech100, pas Nasdaq100. Tableau techniquement visible mais restrictions explicites d’extraction automatisée/réutilisation sans accord écrit ; aucune ingestion de ses poids |

## Complément technique de cette reprise

Le producteur partagé conserve maintenant une preuve structurée des champs financiers manquants : fond concerné, position, champ, date du fichier, URL, empreinte et véritable heure du refus. Le refus d’un secours plus ancien conserve également sa propre observation et les tentatives d’accès qui y ont conduit. Ces diagnostics ne sont jamais des données financières admises et n’entrent pas dans les calculs. Une panne ultérieure ne renouvelle pas leur horloge, ni celle du dernier livre valide. Un succès d’un autre support reste enregistrable.

Aucun nouveau collecteur, workflow, actif, profil, seuil, texte public ou squelette PNG. La capture de #1031 et ces diagnostics passent par `update-qualified-exposures.yml` et ses contrats existants.

## Vérification

Régressions locales : 18 tests physiques, conservation du writer (transport/champ absent/date régressive/périmètre brut), cinq rapprochements NAV, neuf tests des classements publics WisdomTree et sept HSBC/JPM. Les poids manquants, dates contradictoires, doublons, livres partiels et seuils restent refusés. Build et suite DCA exécutés avec succès, lint sans erreur (avertissements préexistants). Recette locale de 14 portefeuilles sur ordinateur/mobile : analyse, canvas et PNG réellement téléchargé identiques. Les résultats de collecte GitHub et parcours publics sont consignés dans la PR avec leurs exécutions réelles ; ce document ne les anticipe pas.
