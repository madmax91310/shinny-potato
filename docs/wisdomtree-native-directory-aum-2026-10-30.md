# Encours WisdomTree : annuaire public, devise native et preuve par part

Suite du chantier consolidé, dépendante de #1077 (pays) sans refaire ses corrections. Aucun catalogue, actif, moteur ou workflow Portefeuilles IA rétabli.

## Nouvelle voie officielle

Le lien Products de la page publique Cloud mène à `https://www.wisdomtree.com/gb/products`. Son navigateur appelle effectivement :

`https://dataspanapi.wisdomtree.com/fundlist/data/?divisionId=2&wtRegion=GB&isoCode=en-GB&isLeveraged=-1&isFP=0`

Réponse réelle acquise le 30 octobre : 490 lignes de cotation, SHA256 `678c59f4438eca1b14476496d0a916c715114bff303c19f69e522b6bac22f8d2`. Cela ne certifie pas 490 instruments. Le périmètre attendu reste les quinze produits WisdomTree déjà déclarés dans les trois configurations existantes : sept collectés par le producteur ETF principal, deux par les expositions, six par les sources non obligataires. La réponse native compressée est conservée comme fixture.

## Contrat financier

Seul `AUM` est lu, avec sa date propre `AUM_DateTime`, sur une cotation où **fundCurrency = baseCCY = listingCCY = devise de la part attendue**. Les cotations non natives ne sont ni moyennées ni reconverties. `AUMusd`, `Net_Assets`, `NAV_Date`, cours et NAV ne fournissent aucune valeur de secours.

Cette restriction est nécessaire sur la vraie réponse Cloud : la cotation USD publie AUM 400 637 024 USD ; la ligne GBP porte le même AUM mais un AUMusd différent, supérieur à 533 millions. Une conversion automatique de cette dernière ferait changer le périmètre financier. Le collecteur choisit explicitement la cotation native et garde les identifiants effectivement contrôlés. Il ne corrige aucune valeur de la source.

Chaque part doit confirmer ISIN, nom exact du document, devise native, division européenne, structure UCITS/ETP, levier unitaire et lien du factsheet exact déjà validé dans cette tentative. Les doublons natifs doivent être strictement concordants. L'identité documentaire reste datée séparément ; sa consultation ne date jamais l'encours. Les bornes de fraîcheur existantes sont conservées. Aucun encours n'est calculé à partir de NAV × nombre de parts.

Le champ s'inscrit dans le registre commun existant, avec `scope: fund`, le montant dans la devise native et la provenance de l'annuaire, conformément au champ AUM du produit affiché par l'émetteur et à la carte primaire Total AUM of fund. Pas de fiche parallèle, de nouvelle conversion ou de qualification d'une composition/position.

## Acquisition, erreurs et reprise

Une seule réponse actuelle est partagée entre les travailleurs d'une même exécution de producteur, y compris si elle échoue. Aucun cache sur disque n'est utilisé comme contrôle source. Une absence de part, de cotation native, de montant, de date ou une contradiction produit une erreur individuelle `aum` dans les contrats existants ; les autres parts et champs restent conservés. La liste attendue précède la lecture des résultats.

Une observation plus ancienne ne remplace pas une observation plus récente ; une contradiction à date identique est mise en quarantaine. L'échec de l'annuaire ne renouvelle pas sa réussite et ne supprime pas un encours primaire indépendamment validé. Les branches en échec restent enregistrées ; un succès composite n'est pas une preuve de réparation de la page primaire. Le producteur ordinaire existant assure la prochaine tentative bornée à sa fréquence habituelle ; aucun nouveau cron ni campagne de collecte quotidienne de tout le catalogue.

## Vérifications

Treize tests dédiés : quinze identités réelles, devises non natives exclues, champs de secours interdits, date propre/future/périmée, doublons contradictoires, champ individuel manquant, panne/format modifié, partage concurrent d'une acquisition, succès sans changement, observation hors ordre, identité absente et passage ordinaire ETF avec PDF réellement parsé. Les tests de sources, renouvellement et non-obligataires restent en place. Les erreurs pays déjà présentes ne sont plus écrasées par une erreur PDF ultérieure.

Le transport local réel de l'adaptateur a réussi le 30 octobre à 11:42 UTC, mais ne prouve ni GitHub, ni enregistrement, ni publication. Ces étapes restent à vérifier. Les conditions de réutilisation de cet accès public restent explicitement non vérifiées dans le registre commun.
