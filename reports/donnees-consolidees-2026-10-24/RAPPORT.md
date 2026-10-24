# Bilan consolidé — automatisation, fiabilité et Données à revoir

Publié et vérifié le 24 octobre 2026 : code `6124113127807037b1ab765a177ce87788268471`, données `4d63d0a306b192458b13bca21e56553d60dbfcac`. #912 et #917 sont fusionnées ; #913/#914 et les modifications légitimes du registre propriétaire sont préservées. Le bilan ci-dessous distingue les corrections de données, les contrôles, la supervision et les sources encore bloquées.

## Un seul suivi, avec ses preuves d’origine

Le rapprochement commence sur master 7724bdc5, puis intègre la demande réelle 3f729f9b et #913 (4981a9a0). #884, #887, #889 et les lots #892/#895/#898/#899/#900/#905/#906/#907/#908 sont préservés. #903 reste réservée au guide éditorial ; aucun de ses fichiers n’est modifié. #913 conserve ses changements d’interface et ses tests : notre fichier de workflow commun contient les deux séries de modifications. La coordination est consignée dans RECONCILIATION.md et dans le commentaire de #913.

Les 8 600 lignes héritées sont toutes associées à une provenance dans suivi-consolide.csv. Les clés rapprochent comparaisons, capacités, usages, modules et épisodes d’incident. Les actions parentes et leurs cas détaillés ne constituent pas des causes indépendantes à additionner. Un contrat non retrouvé reste explicite ; son absence n’est pas une résolution.

380 cycles de supervision déjà résolus sont réconciliés avec leurs preuves, sans les présenter comme 380 données nouvellement réparées. Les 27 dates officielles obtenues dans le lot précédent sont réintégrées avec leur portée exacte : pour FR0007054358, la continuité juridique reste ouverte. Sept corrections déjà publiées par #908 ne sont plus laissées « publication attendue ». Les cinq tableaux source sont identiques aux blobs de l’archive bee953863927a04c5140af6dba53fb51d7bf1141 ; leurs empreintes et chemins sont conservés.

## Corrections effectives de ce lot

| Correction | Données ou supervision | Preuve et limite |
|---|---|---|
| 21 séries IA certifiées écrasées par des fragments antérieurs | Données : hydratation et persistance | Reproduction hors réseau sur les vraies données ; ancienne implémentation en échec, nouvelle en réussite. Fragments réparés depuis les versions authentiquement certifiées déjà présentes, sans nouvelle date de preuve inventée. Les 21 versions publiques avant correction étaient effectivement anciennes. |
| Incidents IA attribués aux outils ETF indépendants | Supervision | Le producteur transmet la route essayée, la période conservée, la tentative et la dernière réussite réelle. Le tableau cible Portefeuilles IA ; un succès inconnu reste inconnu, y compris dans le diagnostic copié. |
| Validation technique masquée par une panne fournisseur | Supervision et contrôle du producteur | Signal indépendant, deux contrôles exécutés dans des étapes distinctes ; l’audit des identités s’exécute aussi après échec du premier. Le libellé n’affirme aucune publication non démontrée. |

La réparation rétablit les usages IA existants des séries concernées ; elle n’ajoute aucun actif au catalogue. Le sélecteur et le moteur, les valorisations EUR, achats fractionnés et liquidations sont exercés sur les historiques réels certifiés. Les scénarios de compétition, confirmation, exécution et exports utilisent des livres isolés. Aucun modèle, allocation ou transaction de recette n’est écrit en production. Les formats de tweets et PNG sont conservés.

## Fiabilité financière : le reliquat reste explicite

Les 90 comparaisons originales concernent 53 parts. Les 79 suivis encore ouverts concernent 50 parts : 77 causes initiales non entièrement expliquées et deux corrections avec résidu (WFNS 2023 et Amundi 2020). Dix corrections antérieures et une comparaison non pertinente restent conservées. Les 175 périodes non comparables ne sont pas requalifiées par ce lot.

Contrôle des consommateurs après rapprochement : 27 des 79 fenêtres utilisent une NAV indépendante qualifiée, sur 17 parts ; 52 fenêtres de cotation contestées restent refusées. Aucune de ces 52 fenêtres n’est admise au calcul. Les cotations brutes peuvent rester stockées et les autres périodes indépendamment qualifiées restent disponibles. Parmi ces anciennes cotations, 50 cas sur 31 parts restent non réparés ; les deux corrections partielles conservent leur résidu et leur refus ciblé.

Une NAV fiable ne démontre pas la cause de l’erreur de l’ancienne cotation. Aucune nouvelle égalité cours/NAV, conversion, tolérance ou substitution de part n’est introduite. Le tableau principal conserve chaque écart et sa pièce manquante spécifique.

## Vérifications

993 tests Python locaux passent sur l’ensemble assemblé avec #913 ; build et 4 274 certificats de couverture publiable passent. Les nouveaux scénarios Python sont raccordés aux contrôles GitHub. Le producteur IA 40073857748 passe moteur, audit d’identités, build, recettes desktop/mobile, propriétaires à trois/quatre participants et reprise du catalogue. Les confirmations de recette sont simulées ; elles ne sont pas présentées comme des clics propriétaires réels.

18 221 instruments actions distincts, 18 468 instruments sélectionnables et 19 239 cotations sont testés contre le moteur aux dates effectivement qualifiées, sur 31 places et 15 devises. L’audit technique retrouve 21 185 cotations utilisables à leur date, zéro exception. Cela ne prouve pas une actualisation de tout l’univers au 23/10. Les non-détenus ne sont pas soumis à une collecte quotidienne massive.

Exemple explicite de workflow vert sans nouvelle donnée : dans le rapport de collecte de cette PR, la BCE réussit, mais CSPX conserve le 22/10 ; le 23/10 reste absent. Dernière réussite conservée 23/10 à 10:39:50 UTC, tentative échouée 24/10 à 07:23:28 UTC. Le signal fournisseur reste distinct des contrôles techniques réussis. Le reçu final ci-dessous identifie les preuves GitHub et les contrôles publics.

## Exécution ordinaire dans GitHub

Le producteur 40075676773 exécute réellement son point d’entrée, avec `assets=IE00B4L5Y983-ETFP,IE00B5BMR087-XLON-CSPX-USD`, `qualification_mode=none`, `qualify_all=false`. Collecte, moteur comptable, audit des identités, build, validation et enregistrement 9380eff sont exécutés dans GitHub. Le déclenchement est manuel dans le workflow ordinaire ; aucun prochain cron n’est prétendu observé. Le livre réel est conservé, sans transaction de recette.

La BCE réussit. World et CSPX restent sans clôture ajustée du 23/10 ; leurs derniers points valides sont au 22/10. Tentative réelle : 24/10 07:51:24 UTC. Dernières réussites conservées : World 23/10 13:13:32 UTC et CSPX 23/10 10:39:50 UTC. Ces dates ne sont pas renouvelées par la panne. Les requêtes exactes et observations initiales se trouvent dans preuves/github-production-initiale/. Aucune nouvelle cotation quotidienne n’est annoncée pour ces deux échecs.

La recette de reprise a ensuite révélé une assertion périmée : elle exigeait une collecte World réussie malgré la conservation correcte du dernier historique validé. #917 corrige uniquement cette recette : réussite ou échec restent distincts, avec vérification des dates, de la preuve d’origine, de l’erreur explicite et de l’égalité des points réellement servis. Le build et la recette complète desktop/mobile avec 15 PNG passent localement sur les données réelles. Aucun cours ni statut source n’est modifié.

Le run 40075676773 a été annulé après ces phases pour relancer la publication avec ce contrôle corrigé ; seule sa phase de collecte/validation/enregistrement réussie est revendiquée. Le contrôle complet final est 40076276725, dont le checkout sélectionne 612411 malgré son ancien en-tête de déclenchement. Les données sont réputées publiées uniquement après vérification de leurs octets et de la version effectivement servie.

La validation complète porte sur l’instantané le plus récent, intégrant aussi #914. La première validation de master a été annulée comme redondante avant publication ; cette annulation n’est pas comptée comme une panne de source réparée.

## Blocages restants et portée

- Accès externes : Copper et les quatre positions complètes WisdomTree restent refusés depuis GitHub. Les essais identiques 403 ne sont pas relancés. Une route officielle autorisée, une réponse exploitable dans le producteur réel et les identités économiques nécessaires restent requises.
- Documents/identités : deux PEA restent conflit/inconnu ; continuité Amundi 2001–2018 non démontrée ; sept cas sans preuve quotidienne officielle qualifiée ; identités et compositions encore incomplètes restent détaillées dans le suivi. Une date SCPI non annoncée n’est pas transformée en panne.
- Fiabilité historique : les 79 suivis et leurs recherches antérieures sont conservés individuellement. Une collecte identique n’est pas appelée résolution. Les voies sûres et fenêtres refusées restent distinctes.
- Automatisation et raccordements : les capacités et contrats réellement utilisés déterminent les exigences. Les cases non applicables ne sont pas des données manquantes. Les compositions partielles n’ouvrent pas le recouvrement complet ; les parts inconnues ne deviennent pas PEA.
- Textes et fraîcheur : les archives et verrous de revue restent conservés. Une source relue ne renouvelle pas automatiquement la revue de la rédaction. Les politiques et chiffres vivants encore incomplets restent suivis ; aucun texte ou avertissement technique généralisé n’est ajouté aux images.
- Vérification : les 81 modules du reliquat initial restent identifiés avec leurs limites de branches/fournisseurs. Une recette locale, une collecte sur une part et une validation GitHub du producteur ne certifient pas indépendamment toutes les données du catalogue. Les fichiers déclaratifs et auxiliaires restent séparés des points d’entrée réseau.

DWS est expliqué et les 36 anciens signaux ont été clos par le mécanisme ordinaire ; aucune nouvelle correction de ses seuils n’est faite ici. Les treize reprises mensuelles HTTP429 et les 333 mois TWD déjà publiés sont préservés. Les accès Bourse Direct et la référence officielle cash IBKR déjà rétablis dans GitHub ne sont pas déclarés de nouveau en panne sur la seule base d’un accès local différent.

## Fichiers livrés

Le CSV principal est le suivi unique. bilan.json précise ses dénominateurs et ses limites ; corrections.json distingue les défauts des données et ceux du tableau. Les sources historiques sont immuables, les rapprochements documentés et les preuves séparées. Les conditions d’accès/réutilisation documentées et leurs points non vérifiés restent conservés ; un accès HTTP réussi n’est pas une preuve de licence.

Le reçu définitif ci-dessous et les preuves individuelles donnent les commits fusionnés, les exécutions ordinaires, la version réellement servie et les contrôles de ses octets.


## Reçu définitif et bilan des limites

- PR #912 : stockage des 21 séries et remontée des incidents ; fusion a083f3ba. PR #917 : recette du dernier historique valide après une panne ; fusion 61241131. La validation complète **40076276725**, déclenchée depuis un ancien en-tête, sélectionne bien **61241131** : treize catégories obligatoires réussies et publication réussie. Les captures de version et de jobs sont conservées.
- Exécution ordinaire finale **40079425823**, véritable point d’entrée GitHub, déclenchement manuel ciblé : validation, enregistrement et publication réussis. Le run finit rouge uniquement dans `report-failures`, car les deux clôtures requises restent absentes. BCE réussie ; World et CSPX restent au 22, avec tentative du 24/10 08:49:04 UTC et leurs dernières réussites réelles du 23/10 inchangées. Aucun prochain cron n’est prétendu observé.
- Données publiques : **21/21** fragments conformes à leurs certificats d’origine, contre **0/21** avant correction ; identités, empreintes de réponse et dates authentiques conservées. Le nouveau rattrapage ne les écrase pas. Contrôles publics réels sur ordinateur/mobile, sans interception de réponse et sans écriture : dates du 22, absence du 23, source essayée, bon outil IA, diagnostics copiés et recherche UBS conformes.
- Le moniteur observe **44 signaux**, contre 43 à la première capture. La panne technique IA ancienne est close. Un ancien échec du producteur de métadonnées, jusque-là masqué par ses erreurs de champs, est désormais visible ; cette hausse n’est pas une nouvelle série financière erronée publiée. Son journal révèle une assertion interdisant toute cotation quand une NAV annuelle existe. La correction de contrôle vérifie maintenant les contrats NAV réellement consommés dans Générateur et Duels, leurs rendements en EUR, et la convention/provenance de la cotation indépendante conservée. **461 choix manuels** passent ; une cotation ne peut pas se faire passer pour la NAV. Ce contrôle corrigé est vérifié localement ; le producteur et ses champs bloqués restent à revalider normalement, sans réessayer à l’identique les 403. Aucun cours, seuil, série ni raccordement existant n’est modifié par ce dernier correctif de test.
- Le livre réel observé contient **un brouillon**, révision 2, **zéro décision**. Aucun portefeuille lancé n’est prétendu valorisé par ce contrôle de suivi. Les simulations, achats/liquidations et exports testés restent isolés.

Le suivi conserve **8 600 origines** dans **8 341 enregistrements dédoublonnés**. Ces identifiants regroupent capacités, contrats d’usage, incidents et actions parentes : ils ne représentent pas autant d’actifs ou de pannes indépendantes. **983** enregistrements restent actifs à leur niveau, **118** conservent une vérification explicitement incomplète, dont le reliquat initial de **81 modules**. Les **36** autres entrées non revérifiées gardent leur provenance ; aucune absence n’est appelée résolution.

Les **19 actions** sont maintenant : **11 corrigées, 6 partiellement corrigées, 1 bloquée et 1 déjà résolue**. P2-04 reste partielle malgré le socle réparé, car la clôture de référence nécessaire au 23/10 n’est pas rétablie. Les cinq autres actions partielles restent P0-01, P0-02, P1-04, P2-06 et P3-02 ; P2-03 reste bloquée sur preuve PEA.

Les **79 cas financiers** restent ouverts : 77 causes anciennes et deux résidus. Les 27 fenêtres NAV et 52 fenêtres de cotation refusées sont préservées ; aucune ancienne fenêtre contestée n’est admise. La correction d’un tableau, la sécurité d’un usage et la réparation d’une ancienne série sont des résultats distincts.

Le CSV principal et les vues sont arrêtés sur cette preuve de production. Le reçu documentaire fusionné après ces vérifications n’ajoute pas une nouvelle version de l’application ; le code et les données servis restent identifiés ci-dessus.
