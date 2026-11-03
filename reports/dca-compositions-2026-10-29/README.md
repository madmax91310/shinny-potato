# Compositions partagées — bilan du 29 octobre 2026

PR #1041, sans fusion ni déploiement. Base de comparaison : master `ee9d633a11dec1583f6c91bf6d5fab9284d2f9c0`. La branche a ensuite intégré master `ee3b3c5`, dont #1036/#1037 (iBonds) et #1040. #1036 est fusionnée depuis le 29 octobre à 11:51 UTC ; ses correctifs ne sont pas réinventés. #1031 conserve son lecteur physique Global X, non modifié ici. Aucun incident de supervision n'est clos par ce lot.

## Inventaire constaté et priorités

Les inventaires JSON avant/après couvrent **150 profils préparés, 84 supports employés et 672 références disponibles dans le sélecteur** (411 actions, 251 ETF, 10 ETC/ETP). Les occurrences ci-dessous comptent les profils préparés, pas les usages des utilisateurs. Aucun profil ni support n'est ajouté au catalogue.

| Support | ISIN | Profils | État constaté et action |
|---|---|---:|---|
| iShares Core World | IE00B4L5Y983 | 40 | Fichier intégral existant, collecte officielle réelle renouvelée au 28/10 ; 99,53334 % d'actions identifiées, sans renormalisation. |
| iShares ACWI | IE00B6R52259 | 33 | Fichier intégral renouvelé au 28/10 ; 99,6371 % identifiés. Une ligne DUMMY de 0,0001 % sans ISIN garde le recouvrement partiel. |
| BNP Easy Europe 600 | FR0011550193 | 22 | Priorité incomplète : indice partiel de 20,13 %, sans ISIN. Qualification « Synthétique » française réparée ; aucun panier de swap admis. Blocage détaillé ci-dessous. |
| iShares S&P 500 | IE00B5BMR087 | 19 | Fichier intégral renouvelé au 28/10, 99,86826 % d'actions identifiées. |
| Vanguard All-World | IE00BK5BQT80 | 18 | Composition intégrale existante du 30/09, 99,54911 % identifiés ; pas de nouvelle collecte revendiquée pour ce fonds. |
| Xtrackers émergents | IE00BTJRMP35 | 13 | Fichier intégral renouvelé au 27/10. 99,40037238 % d'actions ; poche non actions exclue, garde de 99,5 % inchangée, recouvrement partiel. |
| iShares Nasdaq-100 | IE00B53SZB19 | 9 | Fichier intégral renouvelé au 28/10, 99,96626 % d'actions identifiées. |

La liste complète distingue fichier intégral, identification partielle, fraîcheur, panne avec dernière observation conservée, raccord manquant et non-applicabilité. L'or, la crypto, les obligations et les actions en direct ne sont pas des compositions de fonds actions à compléter. Le changement de non-applicabilité des deux iBonds provient de #1036, pas d'une collecte nouvelle.

## Six compositions WisdomTree acquises et raccordées ; accès GitHub encore bloqué

Même producteur `collect_dca_complete_holdings.py`, même registre de sources générées, même workflow ordinaire `update-qualified-exposures.yml`. L'ancien HTML/BFF retourne HTTP 403 sur GitHub. Le nouveau flux Dataspan réussit localement mais retourne lui aussi HTTP 403 depuis le runner GitHub : l'automatisation est raccordée et exécutée, mais son accès distant n'est pas réparé. Le flux officiel anonyme **Dataspan rankings** fournit les portefeuilles, liés à la part exacte par la fiche officielle (ISIN, nom, devise, ticker, réplication physique). Seule la classification **Fund / ID 1** entre dans les détentions ; les autres classifications, dont indice, pays et secteur, sont exclues. Additionner toutes les classifications multiplierait les poids par quatre ou cinq.

| Support existant | ISIN | Avant | Après, observation du 23/10 contrôlée réellement le 29/10 |
|---|---|---|---|
| Cloud Computing | IE00BJGWQN72 | 22/10, identification 98,37128 %, échec de renouvellement | 64 lignes, 99,9999 % identifiés ; recouvrement intégral admissible. |
| Artificial Intelligence | IE00BDVPNG13 | 15/10, panne ; total 100,0002 % exclu du score intégral | 58 lignes, 99,9995 % identifiés ; score intégral admissible. |
| Europe Defence | IE0002Y8CX98 | 15/10, panne ; total 100,0001 % exclu du score intégral | 42 lignes, 100 % identifiés ; score intégral admissible. |
| Quantum Computing | IE000W8WMSL2 | 15/10, panne | 47 lignes, 100,0002 % identifiés ; renouvellement local acquis, score intégral toujours refusé pour excès de poids. |
| Battery Solutions | IE00BKLF1R75 | Principales positions sans identifiants exploitables ; absent des cibles générées | 111 lignes du fichier intégral, 92,7974 % identifiés ; 7,203 % non identifiés. Total publié 100,0004 % conservé, score partiel. |
| Global Quality Dividend Growth | IE00BZ56SW52 | Principales positions sans identifiants exploitables ; absent des cibles générées | 560 lignes du fichier intégral, 96,9954 % identifiés ; 3,0042 % non identifiés. Total 99,9996 %, score partiel. |

Source : `https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=<TICKER>+LN&isoCode=en-GB` ; preuve de part : `https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/UCITS/EU/EN-GB/<ISIN>`. Chaque observation conserve URL, hash, date des poids, heure réelle du contrôle, méthode, preuve de couverture, sources et dates du rapprochement d'identité. Les titres sans correspondance exacte SEDOL/FIGI restent sans ISIN ; aucun rapprochement sur la seule ressemblance du nom.

`local-core-collection.json` atteste 12/12 supports acquis via le CLI ordinaire, dont les principaux iShares, émergents et Europe DE0002635307. `local-rankings-collection.json` atteste les six parts acquises via le nouveau flux ordinaire (6/6), avec métadonnées détaillées. Les 24 corps de sources de régression sont archivés sous `scripts/fixtures/wisdomtree-complete` : six JSON BFF, six PDF, six JSON Dataspan et six tableaux Fund extraits du SSR. Le manifeste contient les hashes des corps effectivement archivés ; les tableaux SSR sont sérialisés en JSON et signalés comme tels. Les six jeux Dataspan correspondent exactement aux SEDOL/poids/dates SSR. Les poids du BFF exploratoire du 28/10 ne sont jamais mélangés aux classements du 23/10 ni publiés comme ceux-ci.

## Effet sur les calculs

`portfolio-effect.json` isole l'effet des données : avec le même moteur corrigé, un portefeuille 50 % Cloud / 50 % S&P 500 passe de 99,12004 % à 99,93408 % d'actions identifiées ; le recouvrement, auparavant indisponible, devient **2,57475 %** des poids des deux supports. Ce taux ne mesure pas une proportion du capital personnel.

Concentration et recouvrement utilisent désormais la même garde de complétude : fichier complet non approximatif, identifiants connus, poids dans les bornes existantes. Une liste incomplète n'est jamais ramenée à 100 %. Les groupes fonds/indices, dates incompatibles et instruments hors actions restent distincts. Les titres sont rapprochés par ISIN ; classes d'actions et ADR restent distincts dans les positions. Le regroupement d'entreprises utilise seulement le registre revu existant (tests Alphabet et TSMC ADR/ordinaire), jamais une similarité de nom. Les agrégats de concentration ne sont pas une somme des recouvrements par paire.

Les métadonnées de source survivent aux projections différées et sont consultables dans l'analyse de l'application. Les générateurs de tweets et d'images, le style, les profils et leurs allocations restent inchangés ; aucune matrice ni texte public supplémentaire.

## Blocages précis conservés

- **Les six parts WisdomTree** : le run ordinaire GitHub [40876841984](https://github.com/madmax91310/shinny-potato/actions/runs/40876841984), sur le code `9b07065`, confirme HTTP 403 sur chacun des six endpoints Dataspan rankings, puis sur les routes HTML/BFF de secours. Les PDF officiels passent ; le refus porte sur les données de portefeuille. Aucun contournement de protection ou succès de cron n’est revendiqué. Les dernières observations valides et leurs dates sont conservées, et les échecs restent signalés. La résolution de cet accès est nécessaire pour un renouvellement automatique effectif depuis GitHub.

- **FR0011550193** : fiche officielle BNP `https://api.bnpparibas-am.com/push/fundsheet/IP_FR-IND/FRE/FRA/FR0011550193` vérifiée : part EUR C, réplication synthétique, indice STOXX Europe 600 NR / SXXR. La page officielle STOXX `https://stoxx.com/index/sxxp/?components=true` expose 600 poids mais pas leurs ISIN ni une date exacte de composition ; sa mention de dernière revue périodique ne permet pas de dater chaque poids. Le CSV de sélection public a des noms/RIC mais les ISIN vides et aucun poids ; le téléchargement weighting depuis `https://www.stoxx.com/data-index-details?symbol=SXXP` est inactif. Pas de rapprochement approximatif ou de panier de substitution. Les deux références prix/NR ne sont pas déclarées interchangeables sans qualification.
- **FR0011869304 et FR0011871110** : références synthétiques déjà partielles (respectivement 45,216329 % et 46,784511 % identifiés). Aucun nouveau fichier intégral d'indice avec identités et contrat qualifiés n'est établi ; conservation des observations partielles, sans panier du fonds synthétique ni fausse complétude.
- **IE00B6R52259, IE00BF4RFH31** : lignes techniques sans ISIN (DUMMY/CVR). Aucun identifiant inventé. **IE00BTJRMP35** : poche hors actions réelle, pas panne à compenser par renormalisation.
- **IE00BKLF1R75 / IE00BZ56SW52** : identités encore non qualifiées pour les poids indiqués dans le tableau. **IE000W8WMSL2** : arrondi publié excédentaire ; seuil strict du score conservé.
- **IE00B441G979** : dernier fichier valide du 23/10 conservé ; observation récente à **100,762180 %** rejetée par le garde-fou collecteur existant de 100,5 % d'actions. L'ancien fichier dépasse aussi 100 % et reste exclu du score intégral. Le message d'échec précise désormais le poids total ; aucun seuil diminué ni erreur masquée.
- Les autres supports du sélecteur restent décrits individuellement dans l'inventaire ; ce lot ne prétend pas résoudre toutes les compositions partielles ou indisponibles. Aucun incident Global X n'est fermé.

## Vérifications exécutées

- `npm run test:dca` : profils/sélections/stockage, filtres, calculs, conservation des masses, neutralité, export, source et couverture. Test supplémentaire exécute réellement le générateur de cibles puis le plan du producteur : les six parts survivent à une régénération ordinaire.
- `python -m unittest discover -s scripts -p 'test_wisdomtree*py'` : **49 tests**, dont corps réels des six parts, hashes des 24 captures, identité de part, classification, sommes, cash BFF, FIGI provisoires et identités manquantes.
- `python -m unittest discover -s scripts -p 'test_dca*py'` : **20 tests**, dont exécution du vrai point d'entrée et écrivain dans un répertoire temporaire : succès et panne isolés, régression de date rejetée, dernière donnée valide et date d'origine conservées. Cas périmés, incompatibles, synthétiques et hors actions aussi couverts en JS.
- Tests Node de concentration indices et d'identités de référence passés. `npm run lint` passe avec avertissements préexistants ; l'import inutilisé introduit dans le test a été retiré.
- `npm run build` passe, y compris contrôle des budgets et manifeste des 41 fichiers publiés. Réexécuté après mise à jour de master.
- `playwright-dca-holdings-contracts.mjs` sur **site compilé** : cinq portefeuilles (indices usuels, Cloud, nouvelles compositions partielles, or/BTC/obligations, fonds/indice), chiffres analyse/Canvas cohérents, PNG téléchargé identique octet par octet à l'aperçu, vues 1440/390 px sans débordement, sans erreur navigateur. Réexécuté après rebase.
- `playwright-dca-analytics.mjs` : analyse, contributions, comparaisons, export et responsive. `test-dca-images.mjs` : **620 images**, parcours contribution, édition/texte indépendant, filtres, sauvegardes/reprise et mobile.
- Autre consommateur partagé : `playwright-index-concentration.mjs`, **34 compositions** contrôlées, aperçus/download identiques, bascule rapide, indisponibilité et mobile 390 px.
- Inspection visuelle réelle des PNG Cloud, Battery/Dividend et or/BTC/obligations, ainsi que de l'analyse mobile fonds/indice. Pas de défaut constaté ; captures représentatives jointes.

Les contrôles locaux ne prouvent ni publication en production ni exécution future du cron. Voir le reçu CI séparé pour l'exécution GitHub ordinaire sur l'événement PR et ses éventuels échecs conservés.
