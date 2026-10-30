# Automatisation complémentaire des références économiques — 30 octobre 2026

Suite de #1083 ; chaîne partagée `collect_dca_complete_holdings.py`, registre commun et workflow `update-qualified-exposures.yml`. Aucun ajout de support, profil, texte de tweet ou structure d’image. Les références économiques restent des références d’indice publiées par Invesco, jamais des détentions du support analysé.

## Collectes réelles locales et périmètres

| Support analysé | Indice publié par Invesco | Date source | Lignes publiées | Somme native | Portée |
| --- | --- | --- | ---: | ---: | --- |
| FR001400U5Q4 | MSCI World Total Return (Net) Index (IE00B60SX394) | 2026-09-15 | 1250 | 100.0002% | Exposition économique indicielle, hors actifs et liquidités du fonds |
| LU1681043599 | MSCI World Total Return (Net) Index (IE00B60SX394) | 2026-09-15 | 1250 | 100.0002% | Exposition économique indicielle, hors actifs et liquidités du fonds |
| IE0002XZSHO1 | MSCI World Total Return (Net) Index (IE00B60SX394) | 2026-09-15 | 1250 | 100.0002% | Exposition économique indicielle, hors actifs et liquidités du fonds |
| FR0013412038 | MSCI Europe Total Return (Net) Index (IE00B60SWY32) | 2026-09-15 | 387 | 99.9996% | Exposition économique indicielle, hors actifs et liquidités du fonds |
| LU1681045370 | MSCI Emerging Markets Total Return (Net) Index (IE00B3DWVS88) | 2026-09-15 | 1165 | 99.9996% | Exposition économique indicielle, hors actifs et liquidités du fonds |
| IE000QDFFK00 | NASDAQ - 100 Notional NTR Index (IE00BNRQM384) | 2026-10-29 | 101 | 100.0001% | Référence seulement : actifs du fonds physique non observés |
| IE00BD4TXV59 | MSCI World Total Return (Net) Index (IE00B60SX394) | 2026-09-15 | 1250 | 100.0002% | Référence seulement : actifs du fonds physique non observés |
| LU1681038672 | Russell 2000 Total Return Index (IE00B60SX402) | 2026-10-29 | 1964 | 99.9994% | Exposition économique indicielle, hors actifs et liquidités du fonds |

Les huit parts réutilisent quatre publications (World, Europe, émergents, Russell) et le Nasdaq déjà collecté par #1083. Une seule acquisition de chaque publication est effectuée par cycle, même avec plusieurs parts simultanées ; succès et erreurs de transport sont partagés dans ce cycle seulement. Le cycle suivant interroge de nouveau la source. Chaque part conserve sa propre vérification documentaire actuelle du benchmark.

Les clichés MSCI restent datés du **15 septembre**, conformément au délai du site ; ils ne sont pas présentés comme actualisés au 30 octobre. Le lecteur accepte le mois anglais réellement publié « Sept », sans modifier les poids ni les règles de fraîcheur. Les poids supérieurs à 100% restent partiels pour le recouvrement intégral selon le garde-fou existant. Les deux fonds physiques portent `approximation:true` et `referenceOnlyForSubject:true`, imposés aussi par le consommateur. Le résumé du catalogue conserve le statut partiel pour ces références physiques : une liste indicielle complète ne devient pas une composition complète du fonds.

### Devise de publication World

Les parts Amundi/iShares EUR non couvertes suivent le MSCI World net. Les poids du même indice publiés en USD sont utilisables uniquement après qualification de la règle de devise commune de la méthodologie officielle MSCI, mai 2026, section 1.7 :
https://www.msci.com/eqb/methodology/meth_docs/MSCI_Index_Calculation_Methodology_May2026.pdf

Le PDF est téléchargé et son empreinte vérifiée dans chaque cycle. Aucun cours, rendement ou poids n’est converti ; les variantes couvertes, ESG ou plafonnées restent exclues. Une modification du document impose une nouvelle qualification. Les dates de l’indice et du contrôle documentaire restent distinctes.

### Russell : poids actions, pas rendements interchangeables

La part Amundi suit RU20N30U (net 30%), le diffuseur publie RU20INTR (total return). Deux documents officiels qualifient exclusivement la même base de valeurs de marché flottantes des membres pour les variantes standard ; la fiscalité des dividendes intervient dans les séries de rendement séparées :

- https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ground-rules/russell-us-indexes-construction-and-methodology.pdf — v7.2, août 2026.
- https://www.lseg.com/content/dam/ftse-russell/en_us/documents/other/russell-index-calculation-methodology.pdf — v1.2, septembre 2026.

Le collecteur vérifie les deux empreintes et les règles précises. Le contrat distingue le benchmark du diffuseur de celui du support et certifie que les séries de rendement ne sont pas remplacées. Il n’utilise aucun rendement RU20INTR comme rendement RU20N30U. Toute preuve absente, changée ou d’un autre cycle est refusée.

Les fixtures compressées contiennent les vraies réponses, recensements, documents de part et enregistrements qualifiés. Les preuves de méthode conservées dans l’artefact sont leurs URL, versions, empreintes, règle et horloge réelle, sans dupliquer les PDF de méthode pour chaque part. Les captures financières et documents de part suivent l’archivage ordinaire.

## Bilan comparable et validation

Avant #1083 : 179 validations sur 183 tâches, dont quatre projections LifeStrategy ; quatre acquisitions en échec. Avec les deux références #1083 : 181/185 observé dans GitHub. Le présent lot enregistre huit tâches supplémentaires, dont deux références physiques approximatives : **189/193 est une attente à vérifier dans GitHub, pas une collecte déjà prouvée**. Ces nombres comptent des validations de tâches, pas des sources HTTP indépendantes, ni des détentions intégrales de fonds.

Collectes locales exécutées : cinq parts MSCI le 30 octobre à 14:48:16 UTC ; deux références physiques à 15:08:18 ; Russell à 15:29:44. Les réponses, dates, empreintes et reçus sont disponibles dans les fixtures et l’artefact ordinaire lors du passage GitHub. Les validations GitHub, publication et parcours publics seront rapportés dans la PR uniquement après exécution.

Tests ajoutés : documents de part exacts, variante ESG/net/devise contradictoire, acquisition unique concurrente, panne isolée et nouvelle tentative au cycle suivant, méthode modifiée/indisponible, preuve périmée, conservation des poids, interdiction de promouvoir une référence physique en détentions intégrales. Le navigateur couvre vingt portefeuilles, analyse/aperçu/PNG identiques et largeurs 1440/390 px. Les contrôles réellement exécutés sont détaillés dans la PR ; aucun seuil n’est abaissé.

## Inventaire résiduel, support par support

L’inventaire initial trouve 37 ETF actions du sélecteur sans livre intégral exploitable, hors or, crypto et instruments sans composition applicable. Dix reçoivent une référence après les deux lots ; les deux références physiques ne résolvent pas l’absence de leurs détentions. Les 27 autres restent ci-dessous. « Non obtenu » signifie qu’une composition complète qualifiée n’a pas été obtenue ; cela ne prouve pas son inexistence ni une obligation de licence.

| ISIN | Support | Blocage constaté / condition manquante |
| --- | --- | --- |
| LU2903252349 | Xtrackers Scalable MSCI AC World UCITS ETF 1C | Fonds hybride physique/swap : absence de composition économique AC World complète qualifiée. Panier détenu ou de substitution insuffisant. |
| FR0010342592 | Amundi Nasdaq-100 Daily (2x) Leveraged UCITS ETF Acc | Produit existant à levier quotidien : ne peut recevoir le livre actions 1x comme exposition intégrale. Contrat spécifique non disponible ; aucun produit ajouté. |
| FR0011440478 | Amundi PEA Emergent EMEA (MSCI Emerging EMEA) ESG Transition UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| FR0013412012 | Amundi PEA Asie Emergente (MSCI Emerging Asia) Screened UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| LU1834983550 | Amundi STOXX Europe 600 Basic Resources UCITS ETF | Indice sectoriel exact : composition intégrale officielle qualifiée non obtenue. Variantes Invesco Optimised et détentions d’un autre ETF physique exclues. |
| LU1834988518 | Amundi STOXX Europe 600 Technology UCITS ETF | Indice sectoriel exact : composition intégrale officielle qualifiée non obtenue. Variantes Invesco Optimised et détentions d’un autre ETF physique exclues. |
| IE00BK5BCD43 | L&G Artificial Intelligence UCITS ETF | L&G : catalogue officiel identifie la part, mais page normale renvoie Fund Centre générique sans activeShareClass. Découverte automatique existante échoue. Ancien CSV qualifié comme PCF/panier de création, non détentions. Aucun statut investisseur attesté ni accès contourné. |
| FR0007056841 | Amundi Dow Jones Industrial Average UCITS ETF Dist | Document émetteur annonce 30 membres mais ne publie que dix poids. Livre intégral officiel qualifié non obtenu ; aucune reconstruction par cours non qualifiés. |
| FR001400ZGO4 | Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF S - Acc | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| FR0011869304 | Amundi PEA Immobilier Europe UCITS ETF Acc | LSEG : export officiel EPRA EUR disponible, poids du 30 juin (document 19 août), sans ISIN et usage/distribution soumis à autorisation écrite. Non ingéré ; composition actuelle identifiée et droit nécessaires. |
| FR0011869320 | Amundi PEA Inde (MSCI India) UCITS ETF | MSCI India net : composition intégrale économique officielle qualifiée non obtenue. Détentions d’un ETF physique non admises comme indice. |
| FR0011871128 | Amundi PEA S&P 500 UCITS ETF | S&P 500 : tables publiques Invesco Acc/Dist de 503 lignes au 15 septembre, somme 103,03% et widget téléchargement désactivé. Non admises, ni renormalisées. Reporting Amundi FR0011871128 actuel et deux éditions datées : HTTP 404. |
| FR0013412020 | Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| FR001400S9V0 | Amundi PEA Luxe Monde UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| LU1834983634 | Amundi STOXX Europe 600 Basic Materials UCITS ETF | Indice sectoriel exact : composition intégrale officielle qualifiée non obtenue. Variantes Invesco Optimised et détentions d’un autre ETF physique exclues. |
| IE00BYPLS672 | L&G Cyber Security UCITS ETF | L&G : catalogue officiel identifie la part, mais page normale renvoie Fund Centre générique sans activeShareClass. Découverte automatique existante échoue. Ancien CSV qualifié comme PCF/panier de création, non détentions. Aucun statut investisseur attesté ni accès contourné. |
| IE000DQLYVB9 | iShares S&P 500 Swap PEA UCITS ETF | S&P 500 : tables publiques Invesco Acc/Dist de 503 lignes au 15 septembre, somme 103,03% et widget téléchargement désactivé. Non admises, ni renormalisées. Reporting Amundi FR0011871128 actuel et deux éditions datées : HTTP 404. |
| IE00BK5BCH80 | L&G Clean Energy UCITS ETF | L&G : catalogue officiel identifie la part, mais page normale renvoie Fund Centre générique sans activeShareClass. Découverte automatique existante échoue. Ancien CSV qualifié comme PCF/panier de création, non détentions. Aucun statut investisseur attesté ni accès contourné. |
| IE00BM8R0J59 | Global X Nasdaq 100 Covered Call UCITS ETF | Indice de stratégie buy-write CBOE ; exposition options incompatible avec un simple livre Nasdaq actions. Aucun contrat intégral qualifié. |
| FR0011550185 | BNP Paribas Easy S&P 500 UCITS ETF (Acc) | S&P 500 : tables publiques Invesco Acc/Dist de 503 lignes au 15 septembre, somme 103,03% et widget téléchargement désactivé. Non admises, ni renormalisées. Reporting Amundi FR0011871128 actuel et deux éditions datées : HTTP 404. |
| FR0013412269 | Amundi PEA US Tech Screened UCITS ETF - Acc | Solactive ISS ESG US Tech 100 DE000SL0J395 : ne suit pas Nasdaq. Conditions officielles de collecte/réutilisation requièrent accord écrit ; aucun flux intégral autorisé obtenu. |
| FR0014017NX3 | Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc) | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| FR0010755611 | Amundi MSCI USA Daily (2x) Leveraged UCITS ETF Acc | Produit existant à levier quotidien : ne peut recevoir le livre actions 1x comme exposition intégrale. Contrat spécifique non disponible ; aucun produit ajouté. |
| FR0011871078 | Amundi PEA Chine (MSCI China) Screened UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| FR0013412004 | Amundi PEA Amérique Latine (MSCI Emerging Latin America Selection) UCITS ETF | Benchmark exact spécifique (ESG, screened, sélection, thématique ou ACWI) : documents Amundi et répartitions/top 10 disponibles, aucune composition intégrale économique qualifiée obtenue. World/EM standard ne remplace pas cette variante. |
| LU1834986900 | Amundi STOXX Europe 600 Healthcare UCITS ETF | Indice sectoriel exact : composition intégrale officielle qualifiée non obtenue. Variantes Invesco Optimised et détentions d’un autre ETF physique exclues. |
| IE00BF0M2Z96 | L&G Battery Value-Chain UCITS ETF | L&G : catalogue officiel identifie la part, mais page normale renvoie Fund Centre générique sans activeShareClass. Découverte automatique existante échoue. Ancien CSV qualifié comme PCF/panier de création, non détentions. Aucun statut investisseur attesté ni accès contourné. |

### Quatre échecs historiques toujours distincts

| ISIN | Erreur / source réelle | Dernière observation valide | Analyse affectée |
| --- | --- | --- | --- |
| IE00BKLF1R75 | WisdomTree API fund-holdings/7369317 HTTP 403 depuis GitHub ; publication publique 23 octobre antérieure au livre conservé | 28 octobre, 111 positions | Pas de nouvelle actualisation Battery ; ancien livre daté seulement |
| IE00BZ56SW52 | WisdomTree API fund-holdings/1000422 HTTP 403 depuis GitHub ; même régression de date publique | 28 octobre, 439 positions | Pas de nouvelle actualisation Quality Dividend Growth |
| IE000NDWFGA5 | CSV officiel Global X URNU du 29 octobre : ligne ZAR négative sans NET_ASSETS/MARKET_VALUE, qualification NAV impossible | 28 octobre, 59 positions, 99,815% | Couverture Uranium conservée, nouvelle photographie refusée |
| IE00B441G979 | Livre World EUR Hedged du 29 octobre : actions 100,6414%, forwards -1,77325%, périmètre net/brut non compatible | 23 octobre, 1247 positions, 100,3553% | Nouveau livre et recouvrement intégral refusés |

Les échecs n’effacent pas la dernière observation valide et ne rajeunissent ni sa date de source ni son contrôle d’origine. Aucun incident n’est fermé sur le seul code. Les quatre refus restent visibles dans le contrôle financier ordinaire.
