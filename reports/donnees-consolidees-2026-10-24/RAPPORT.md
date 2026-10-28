# Reprise ciblée — Nikkei 225, 26 octobre 2026

Lot en validation, non encore annoncé publié. Master `9e59c99` et #984 intégrés ; #985 documentaire examiné sans recouvrement. #968, #976, #977 et #981 préservés.

- Donnée réparée par une voie indépendante : `LU2196470426`, nouvelle série `etfLU2196470426Nav`, NAV capitalisée native JPY convertie en EUR par les changes mensuels BCE existants. Lancement exact le 27/10/2020 ; 72 mois complets disponibles d’octobre 2020 à septembre 2026. Dernière NAV le 23/10/2026, change quotidien du même jour pour l’anniversaire.
- Preuve fournisseur réelle dans GitHub : [run 40364575719](https://github.com/madmax91310/shinny-potato/actions/runs/40364575719), lancement manuel ciblé sur un seul identifiant, artefact `12669867066`. Les cinq rendements annuels quotidiens recoupent la précision publiée. En 2025 : 28,242014835 % natif contre 28,24 % publié ; la devise du tableau est explicitement JPY. Aucun dividende ajouté à la part capitalisante.
- Enregistrement initial : valeurs, dates et empreintes du rapport GitHub reprises sans retouche dans les registres communs. Le producteur mensuel ordinaire possède la nouvelle série et ses reprises ; son prochain passage planifié n’est pas encore observé pour cette voie.
- Usages vérifiés localement : Calculateur / Et si tu avais investi (versement unique et DCA), Performance depuis, comparaison Qui a vraiment gagné et Il y a X ans. Le calendrier annuel était déjà disponible dans le classement annuel ; ce n’est pas un ajout. Le calendrier JPY est désormais utilisable par Performance depuis via sa conversion existante, sans admission nouvelle dans les portefeuilles.
- Sur les **79 fenêtres suivies**, les moteurs réels passent de **42 à 43 fenêtres mensuelles qualifiées**, et de **78 à 79 pour Performance depuis**. **36 fenêtres sans voie mensuelle qualifiée restent ouvertes**. Les 77 anciennes causes inexpliquées et deux résidus ne sont pas clôturés. La cotation XNKY.DE 2025 reste refusée ; ses autres périodes valides restent conservées.
- Tests : 1 168 tests Python avant la dernière régression de contrat, puis six tests ciblés DWS ; calculs/FX/qualifications et build avec 4 274 certificats réussis. Douze PNG téléchargés localement : quatre calendriers EUR/USD ordinateur/mobile, huit parcours NAV ordinateur/mobile. CI et consommation publique doivent encore être vérifiées avant clôture de ce lot.

Preuves séparées : [collecte GitHub](preuves/reprise-20261026/nikkei-github-40364575719/nav.json), [provenance](preuves/reprise-20261026/nikkei-github-qualification.json), [79 usages avant](preuves/reprise-20261026/usages-79-moteurs-avant-nikkei.json), [79 usages après](preuves/reprise-20261026/usages-79-moteurs-apres-nikkei.json). Les captures et bilans antérieurs sont conservés ci-dessous comme états datés.

---

# Données communes — bilan consolidé actualisé

Capture complémentaire du 26/10 : #976 est réellement servi (code `21671ca1`, puis publication de données distincte), avec vingt exports PNG publics réussis. La relève mensuelle `40316075107` est réussie jusqu’à publication, commit de données `ab5041ff`, niveau Euro NAV `69,3532 EUR` au 22/10, convention `fund-nav-price` ; aucune date n’est avancée au 23/10 pour imiter les positions ACWI. La relève ETF `40316075629` confirme le secours ACWI du 23/10 ; la relève complète `40316075190` confirme les quatre refus fournisseurs WisdomTree. Voir [le bilan courant](LIVRAISON.md) pour distinguer ces preuves des captures historiques ci-dessous. La publication de #977 n’est pas encore affirmée à cette étape.

## Raccord de preuve après réparation — complément ciblé

La cotation HEAL est contrôlée au 26/10 et le diagnostic n’est plus produit par l’inventaire courant. Pourtant le moniteur public du 26/10 à 13:04 conserve `field:gap:instrument:IE00BYZK4776:listings` avec `resolution-unproven`. Reproduction sur les véritables état public et contexte courant : le générateur émet `instrument:IE00BYZK4776:listings`, tandis que le réducteur recherche `gap:instrument:IE00BYZK4776:listings`. Le complément partage la même preuve datée sous ces deux identités exactes, sans inventer une nouvelle réussite ni modifier le réducteur/l’interface. Une lacune encore émise reste active ; preuve absente, ancienne, future, échec fournisseur ou réussite d’un autre instrument ne la clôture pas. Les qualifications `gap:usage:` et les groupes `proof:` restent indépendants.

La reproduction avant/après est conservée ; le après est une vérification isolée du vrai réducteur sur l’état public, pas encore une preuve de publication du moniteur. Les 16 tests du réducteur et la recette du générateur contrôlent ce raccord. Aucun autre incident HEAL, CSPX, ACWI, PEA ou WisdomTree n’est déclaré réparé par cet alias.

## Suite opérationnelle #976 — publication vérifiée ; #977 en cours de publication

La PR #969 est fusionnée (`acf80edd`) et sa publication a été vérifiée : déploiement 40294769898, code `acf80edd`, données `4a9a6967`, puis `01dd984b`. Les trois choix NAV ont été exercés en production : calculateur, DCA, Performance depuis et anniversaire à un an, avec douze téléchargements PNG. La recette à un an ne certifiait pas les niveaux de prix plus anciens : le correctif ci-dessous traite cette limite explicitement.

Le relevé initial actuel conserve **121 raccordements**, dont **26 contrôles en retard**, **4 erreurs de collecte**, **26 connector-needed** ; **77 divergences ouvertes et deux résidus** restent distincts. Les 121 identifiants, champs, outils, raisons et dates sont conservés dans `preuves/reprise-20261026/perimetre-public-initial-121.csv`. Les contrats consommateurs non confirmés ne sont pas assimilés à des pannes. Les recoupements documentaires de courtiers restent distincts des données servant aux calculs.

Réparation locale supplémentaire : **WisdomTree Europe Defence, IE0002Y8CX98**. Les 42 identités ont une preuve indépendante par FIGI commun entre la requête SEDOL et celle de l’ISIN exact. Les 35 nouvelles consultations complètent sept preuves existantes ; aucune identité n’est déduite d’un nom. SES est un certificat de dépôt sur actions, confirmé par l’émetteur/Euronext : son ISIN reste celui du certificat, sans équivalence de cours avec l’action sous-jacente. La qualification de ces identités utilise le contrat statique existant ; les dates des portefeuilles et le contrôle de contemporanéité des anciens rapprochements entre portefeuilles restent inchangés. Aucun seuil financier augmenté.

Le producteur ordinaire local a recollecté, qualifié et enregistré les 42 positions du 15/10, poids publiés **100,0001 %**, sans renormalisation. Les références des preuves sont mutualisées dans le registre d’identités ; elles ne sont pas recopiées intégralement par portefeuille. La projection, le recouvrement détaillé, le nombre d’entreprises et les PNG ont été vérifiés sur mobile et ordinateur ; toute réserve d’arrondi du recouvrement reste visible. Les routes régionales bornées du même produit ne doivent pas faire disparaître une cible du prochain passage. La CI contrôle les preuves manquantes, périmées, erronées, une mauvaise cible, le type certificat, le renouvellement ordinaire et la conservation des dates en cas de panne. Une erreur réseau du renouvellement n’est plus absorbée : le contrôle échoue explicitement, les autres collecteurs continuent et les dernières preuves valides sont conservées. La nouvelle route a été exercée dans GitHub : run PR 40308989556, HTTP 403 également. L’identité est qualifiée et les positions locales consommables, mais l’automatisation fournisseur reste bloquée ; aucune réussite GitHub n’est revendiquée.

Résultats opérationnels supplémentaires et limites actuelles :

- **Or** : reprise ordinaire GitHub `40292128783` réussie, collecte et publication ; reçu pour `src/data/worldbank-gold-monthly.json`, commit de données `de0c85fb`, empreinte `8fdb367be6b79e1980d536086395eebcf664e806`. L’ancien échec était une publication, pas une absence de collecte.
- **Mensuel** : `40289981830` a revalidé après changement de master, puis refusé les conflits sur les séries dont la voie venait d’être modifiée. Protection préservée ; aucune sortie de l’ancien code publiée aveuglément. La relève automatique par push `40294770129` est réussie : collecte, enregistrement `95a5bc3` et publication. Son rapport contrôle réellement les trois nouvelles voies NAV et leur périmètre financier ; ce passage par push ne constitue pas un cron observé.
- **Encours/expositions en retard** : dix instruments ciblés ont des contrôles locaux réels réussis, regroupés dans deux rapports. Les compositions complètes ne sont pas certifiées par ces contrôles d’encours, pays, secteurs ou top 10. Les producteurs ordinaires ETF `40293100758` et expositions `40293709109` ont enregistré et publié leurs valeurs valides. Le premier reste en échec partiel : depuis GitHub, les HTML WisdomTree refusent l’accès et les PDF de secours ne renouvellent pas les encours absents ; les anciennes dates sont conservées.
- **Compositions WisdomTree** : Cloud est acquis localement dans #969 ; Defence est réparé localement dans cette suite ; AI/Quantum restent bloqués. La reprise GitHub `40294849344` a publié les résultats valides mais conserve quatre échecs fournisseur, Cloud compris : toutes ses routes ordinaires répondent 403. Son succès de publication ne certifie donc pas ces quatre collectes.
- **CSPX** : table sectorielle primaire réellement à zéro au 23/10 ; agrégation indépendante du portefeuille physique complet qualifiée à 99,9999 %, sans mise à l’échelle. Incident primaire conservé.
- **ACWI IE00B6R52259** : pays/secteurs primaires réellement à zéro au 23/10. Réparation exécutée par le collecteur ordinaire local : allocations géographiques et sectorielles issues de toutes les positions classifiées, photographie du 23/10, poids 99,99994 %, sans renormalisation. Le nombre officiel de 1 662 positions actions et les identités de cotations sont contrôlés ; les deux doubles cotations sont conservées. La ligne `SINOPAC FIN HOLDINGS CO LTD DUMMY` de 0,0001 % sans ISIN reste signalée : les donuts sont admissibles, le recouvrement intégral ne l’est pas. Les deux tables primaires restent en erreur, avec secours qualifié séparé.
- **QYLD** : page officielle relue ; la table de performance reste intitulée USD Accumulating tandis que la part demandée est distribuante. Les cours, calendriers déjà qualifiés et archives sont préservés ; aucun rendement glissant recertifié pour la mauvaise part.

Les incidents Radar restent sous responsabilité distincte ; seule la correction Revolut déjà fusionnée dans #969 est suivie ici. #968 reste acquis, les deux anciens périmètres inconnus sont historiques et #966 reste CI uniquement. Les 121 identifiants initiaux restent dans `qualification-perimetre-initial.csv` : 70 raccordements/identités manquants, 29 pannes ou contrôles de champs non renouvelés, 18 preuves documentaires incomplètes (dont HEAL désormais renouvelé dans GitHub) et quatre conflits. Cette qualification par fichiers et rapports ne prétend pas à une nouvelle exécution fournisseur de chaque source. Les premières années incomplètes, attentes et non-applicables sont hors de ces 121 actions.

### Renouvellement exact de la cotation Healthcare

La nouvelle API publique du London Stock Exchange (`nrdp/v1?tidm=HEAL`), découverte dans la page officielle actuelle, confirme IE00BYZK4776 / HEAL / XLON / USD / unité 1. La réponse complète est conservée. Le collecteur ordinaire a réellement renouvelé la preuve London/USD le 26/10, distinctement de Paris/EUR ; aucune observation de cours n’est importée de cette API de référence. Le raccord est ajouté au registre commun des sources, avec refus des mauvaises parts, devises, places, unités et réponses vides. Les calculateurs et Duels conservent leur série HEAL.L. La collecte GitHub de PR 40310143492 confirme la même identité et la même empreinte de réponse. #976 est fusionnée en `d221df0b` ; la publication et l’ingestion du producteur ordinaire en production restent à vérifier.

### Conservation des preuves lors des collectes partielles

Un défaut de stockage est reproduit par le véritable point d’entrée, en isolation : une observation Paris seule remplaçait le champ global et effaçait la preuve London précédemment renouvelée. Le suivi dépendant de #976 fusionne maintenant les lignes par MIC/ticker/devise et refuse les régressions de leurs dates. Une ligne conservée garde sa source, son empreinte et sa date ; elle ne devient jamais un nouveau contrôle réussi. Les erreurs source restent dans les diagnostics et un échec total ne produit aucun résultat réussi. Les 90 tests métadonnées passent ; aucun incident fournisseur n’est clôturé par ce correctif de stockage.

### Correctif financier et preuves de cette suite

**Euro Stoxx 50 II, FR0007054358, voie NAV uniquement :** les performances restent calculées dividendes réinvestis. Pour « Il y a X ans », les anciens niveaux avaient conservé les facteurs de réinvestissement des cinq distributions de 2018–2020. Le producteur retire maintenant uniquement ces facteurs, après rapprochement du montant, de la devise et du saut NAV ajustée/NAV brute à chaque date. Les ajustements d’unité sont conservés : appliquer directement la NAV brute à LQQ aurait ignoré son split de facteur 200. Au 25/10/2019, prix hors distributions 35,1802 EUR contre niveau réinvesti 34,2240779 EUR. Les distributions attendues sont déclarées avant lecture ; une omission ou un montant incohérent refuse cette sortie, sans modifier la performance. Les annonces futures ne sont pas appliquées prématurément. Recette navigateur locale à six et sept ans, texte et PNG, en plus des calculs existants.

**Defence :** une route officielle historique `wisdomtree.eu/en-ie/etfs/thematic/wdef---…` a réellement fourni la part et ses 42 positions localement. Elle est ajoutée pour ce seul produit ; le run PR 40308989556 a démontré un HTTP 403 sur cette nouvelle route également. Cette piste nouvelle est désormais testée, mais ne rétablit pas l’accès GitHub. Les identités indépendantes sont renouvelées avant leur échéance existante, par requêtes bornées. Une panne réseau conserve les dates et retourne un échec explicite, tout en permettant aux autres sources de continuer.

**Validation locale :** 1 157 tests Python réussis, tests de consommateurs NAV et routes exactes réussis, build intégré à master `93affb1` et budgets réussis. Navigateurs desktop/mobile : Defence et recouvrement prudent, ACWI fiche/expositions et quatre PNG ; Euro Stoxx NAV : six PNG incluant anniversaires six/sept ans. Les preuves locales ne remplacent pas la recette GitHub/publication encore attendue pour ce lot.

Contrôle complémentaire mutualisé des quatre autres parts Amundi : les séries ajustée/brute ont été rapprochées dans les captures existantes (2 950, 2 950, 1 722 et 2 115 bornes quotidiennes). Pour LQQ, le 09/07/2026 montre un rapport d’unités ×200 ; l’API de dividendes publie aussi « 200 USD », qui ne constitue pas un dividende EUR qualifié et n’est jamais appliqué comme tel. Les trois autres réponses de dividendes sont nulles, sans les transformer seules en preuve d’absence historique de revenus. Les écarts numériques et captures sont conservés dans `amundi-other-anniversary-adjustments.json` et la requête mutualisée associée. Aucun seuil ni historique n’est modifié par cette investigation.

Concurrence : #970/#971/#972/#973/#975 intégrées depuis master ; #974 fusionnée avant #976, moteurs partagés et préférences intégrés depuis master et revalidés. Aucun mécanisme Radar ni supervision n’est réécrit. Les 19 actions et 79 causes originales ne sont pas clôturées par ces réparations ponctuelles.

## Préparation de #969 — capture historique du 26 octobre

Base master `4ea33c9`, aucune PR concurrente ouverte lors du rapprochement. #968 est acquis ; ses contrats, les deux anciens périmètres inconnus et la réserve CI de #966 restent inchangés.

- **Données :** trois parts existantes passent sur une voie NAV officielle indépendante, distinctement affichée « VL » : LQQ FR0010342592 depuis mai 2018, EURO STOXX 50 II FR0007054358 depuis octobre 2018, Prime Japan LU2089238385 depuis février 2020. Conversion JPY/EUR ajoutée au niveau quotidien de Prime Japan avec le fixing BCE non futur, délai maximal inchangé ; conversion mensuelle commune conservée. Prime Japan conserve toute sa profondeur avec la NAV. Pour LQQ et EURO STOXX 50 II, les anciennes cotations restent actives à côté des choix explicites « VL », avec leurs périodes qualifiées et leurs refus inchangés ; aucune série NAV/cours n’est concaténée. Les copies originales sont archivées, pas déclarées réparées. La continuité juridique avant les dates de lancement déclarées reste non démontrée ; aucun historique NAV n’est étendu avant ces dates ; l’ancienne correction des douze distributions reste testée sur sa configuration archivée.
- **Usages :** cinq fenêtres supplémentaires admises : LQQ 2021/2023/2024, EURO STOXX 50 II 2020, Prime Japan 2025. **42 cas sur 79 disposent d’au moins une voie mensuelle qualifiée, 37 restent refusés**, contre 37/42 avant ce lot. Sur les identifiants historiques seuls, 38 cas sont admis et 41 restent refusés : quatre usages sont rétablis par les deux choix NAV explicites, sans supprimer leur refus sur la cotation. Calculateur ponctuel et DCA, Performance depuis, comparaison/classement annuel et Il y a X ans utilisent la voie qualifiée dans sa profondeur disponible. Aucun nouveau rôle automatique de portefeuille. Les causes des anciennes divergences restent conservées individuellement.
- **Composition :** Cloud IE00BJGWQN72 est recollecté par le producteur ordinaire local (photographie du 22/10), validé sans renormalisation, enregistré et projeté vers Actifs et exposition/DCA, y compris recouvrement et export PNG. Aucun portefeuille partiel n’est transformé en portefeuille complet.
- **Radar :** voie officielle mondiale Revolut remise en service avec filtre français strict ; première page uniquement, couverture partielle explicite. La publication française retrouvée conserve sa date du 10 août et ne produit pas de fausse nouveauté. Les contrats de résultats et l’interface sont inchangés.

### Dix identités précédemment en échec

| Résultat | État requalifié le 26/10 | Preuve / limite |
| --- | --- | --- |
| radar-source:dares | panne active | Run ordinaire 40274508210 : page anti-robot malgré HTTP 200. Aucun contournement. |
| radar-source:drees | panne active | Même run : fetch failed ; dernier contrôle source du 25/10 conservé. |
| radar-source:wisdomtree | panne active | Même run : salle de presse HTTP 403 ; accès produit distinct. |
| radar-source:revolut-news | correction locale qualifiée, publication à vérifier | Capture réelle de l’index mondial et de l’article France ; tests de filtrage, dates et absence de faux signal. |
| IE00B0M62S72:pea:qualification | conflit documentaire actif | Nouvelle collecte ciblée : déclarations contradictoires, aucun statut PEA choisi. |
| IE00BYZK4776:listings | voie actuelle Paris opérationnelle ; ancienne preuve Londres incomplète | Collecte ciblée réussie XPAR/HEAL/EUR. Ne prouve pas le renouvellement de XLON/USD. |
| dca-holdings:IE00BJGWQN72 | collecte locale rétablie, publication à vérifier | wisdomtree-cloud.json : 1/1 succès ; positions au 22/10. |
| dca-holdings:IE0002Y8CX98 | qualification toujours bloquée | Page publique accessible ; positions au 15/10 et référentiels d’identité au 23/10, écart incompatible. |
| dca-holdings:IE000W8WMSL2 | qualification toujours bloquée | Même erreur actuelle de dates après retour d’accès, pas une réparation des positions. |
| dca-holdings:IE00BDVPNG13 | qualification toujours bloquée | Même limite ; aucun seuil augmenté, anciennes données datées conservées. |

La page publique suédoise WisdomTree a été examinée pour Defence : HTTP 200, positions toujours au 15/10 et date des caractéristiques non qualifiable. Cette piste n’est donc pas ajoutée aux routes de production. Cloud a réussi via la voie officielle du producteur ; les trois autres restent refusés. Les politiques mixtes « Capitalisation and/or distribution » des trois autres candidats Amundi investigués ne sont pas assimilées à une capitalisation certaine. Copper, HSBC, autres preuves quotidiennes et conflits non réparés restent dans le suivi antérieur.

### Contrôles locaux

Build et contrôles de budgets/couverture réussis. Les trois parts passent les tests communs des 26 voies NAV, les tests prix/revenus, les fenêtres et conversions ; recettes navigateur ordinateur/mobile, 24 PNG des parcours calculateur/Performance/Il y a X ans. Classements : calcul, sélection, texte et PNG sur ordinateur/mobile. Cloud : recouvrement détaillé, périmètre, projections et PNG sur ordinateur/mobile. Suite Python globale : 1 137 tests, huit erreurs initiales ; cinq étaient dues au test d’ancienne cotation pointant sur la nouvelle configuration NAV (corrigé en conservant l’archive), trois à l’absence locale du modèle OCR français (installé pour la recette, aucun changement applicatif). Les 32 tests concernés ont ensuite réussi, dont les nouvelles captures exactes et le refus pré-lancement. Les limites de sources restent des résultats explicites, pas des tests assouplis.

Preuves de ce lot : [dossier reprise-20261026](preuves/reprise-20261026/), [79 fenêtres](preuves/reprise-20261026/fenetres-79.json), [collecte NAV](preuves/reprise-20261026/nav.json), [composition Cloud](preuves/reprise-20261026/wisdomtree-cloud.json), [métadonnées ciblées](preuves/reprise-20261026/metadata-applied.json.gz). La production et les exécutions GitHub seront ajoutées après vérification ; aucun succès planifié n’est déduit d’une collecte locale.


## État antérieur conservé

Capture du 2026-10-25T11:01:14.344510+00:00 : code `cee7add210c57dcb8c28d7b199ab2e5a6f131802`, données `1b3b0d92d1ed11910d910ef02796f9ac187696a4`. Le suivi reste celui du 24 octobre, prolongé des corrections et preuves du 25 ; aucun audit concurrent ni catalogue IA n’est créé. Les constats antérieurs gardent leurs preuves datées. **L’automatisation complète reste non démontrée.**

## Réparations et usages rétablis

[#939](https://github.com/madmax91310/shinny-potato/pull/939) qualifie trois voies Amundi et corrige la conservation erronée d’un ancien niveau quotidien lorsque les mois sont inchangés. [#943](https://github.com/madmax91310/shinny-potato/pull/943) qualifie cinq voies iShares, distingue rendement réinvesti et prix hors distributions, et répare le débordement du libellé Communication dans le classement annuel étroit. Les ajustements sont fournis par l’émetteur, recalés sur une NAV par part à la même date et recoupés avec les calendriers et distributions officiels ; aucune NAV n’est présentée comme cours de bourse.

| Part exacte | Instrument existant | Fenêtres annuelles rétablies parmi les 79 | Devise de calcul |
| --- | --- | --- | --- |
| FR0011871110 | Amundi PEA Nasdaq-100 | 2021 | EUR |
| FR0011871128 | Amundi PEA S&P 500 | 2021 | EUR |
| FR0013416716 | Amundi Physical Gold ETC | 2025 | EUR, NAV native USD |
| IE00B1XNHC34 | iShares Global Clean Energy | 2020 | EUR, NAV native USD |
| IE00B2QWCY14 | iShares S&P SmallCap 600 | 2023, 2024, 2025 | EUR, NAV native USD |
| IE00B4556L06 | iShares Physical Palladium | 2025 | USD |
| IE00BJ5JP097 | iShares World Financials | 2023 | USD |
| IE00BJ5JP436 | iShares World Communication Services | 2024 | USD |

Des voies NAV annuelles existaient déjà pour certaines parts ; elles restent distinctes et ne sont pas recomptées comme nouveaux actifs. Pour ces fenêtres du parcours mensuel : calculateur (versement unique et DCA), Performance depuis, comparaison et classement annuel disposent de la voie mensuelle qualifiée. Les sélecteurs, calculs, textes, images et téléchargements concernés ont été exercés. Le classement conserve les couleurs fixes, ex æquo et années complètes. Les règles des portefeuilles et leurs voies NAV annuelles antérieures sont conservées ; aucun nouvel actif ni rôle automatique n’est admis dans ce lot.

Pour Il y a X ans, les quatre parts distribuantes utilisent leurs NAV historiques publiées hors distributions et un niveau courant de même convention ; le rendement réinvesti reste réservé aux calculs de performance. Les trois parts Amundi et le Palladium sans revenu utilisent les voies qualifiées correspondantes. Cela ne certifie aucune date quotidienne arbitraire : le produit utilise ses observations mensuelles et bornes réellement disponibles.

Sur les **79 fenêtres**, le bilan passe de **52 refusées / 27 qualifiées** à **42 refusées / 37 qualifiées**, sur **25 parts** disposant d’au moins une de ces fenêtres qualifiées, contre 17 avant cette reprise. Les 79 causes originales sur 50 parts restent ouvertes. Les 90 comparaisons et 175 périodes non comparables antérieures restent conservées, sans seuil modifié. Les pièces et consommations courantes sont séparées dans [les 79 lignes](reconciliation-79-ecarts.csv).

**Refus supplémentaire hors des 79 : Palladium, décembre 2014.** Les composants NAV et rendement officiels ne se rapprochent pas en unités. Seules les fenêtres qui utilisent ce mois sont refusées, notamment les années nécessitant cette borne. Les mois indépendamment qualifiés, dont 2025, restent disponibles. Un contrôle source réussi ne supprime pas cette qualification manquante. Une récupération ultérieure prouvée peut lever la restriction : le producteur enregistre aussi les ensembles de restrictions explicitement vides.

## HSBC : explication, idempotence et limite

Les rapports fiscaux de la part IE00B4K6B022 publient 0,2214 EUR au 01/02/2024 et 1,2623 EUR au 08/08/2024 sans libeller explicitement le détachement. Deux sauts du fournisseur reproduisent chacun 1,2623 EUR, aux 01/08 et 08/08. Les avis publics Euronext comprennent un effet au 01/08 et deux avis au 08/08 ; l’annulation ou le remplacement du premier n’est pas démontré.

| Recherche contrefactuelle, jamais appliquée | Rendement 2024 | Résidu face au NAV arrondi 11,6 % | Deuxième application |
| --- | --- | --- | --- |
| Retrait du facteur du 01/08 | 11,721920317 % | +0,121920317 point | Aucun changement |
| Retrait du facteur du 08/08 | 11,599027126 % | −0,000972874 point | Aucun changement |

L’égalité approchée avec le NAV ne décide pas quel facteur est erroné. La série officielle du portail HSBC comporte 4 269 observations dans un contexte XPAR/EUR, mais est libellée « Price », sans qualification suffisante NAV/rendement ; elle n’est pas raccordée comme substitut. Restent à prouver : détachement exact, relation entre avis, nature de Price et bornes de valorisation. [Calcul et hypothèses](preuves/autonomie-commune/hsbc-ajustement-2024.json), [avis publics](preuves/autonomie-commune/hsbc-notices-qualification-20261025.json), [série du portail](preuves/autonomie-commune/hsbc-portail-qualification-20261025.json).

## Matrice, pannes et preuves mutualisées

Le dénominateur courant est **31,718 contrats champ/série × outil**, **23 outils financiers**, **3,544 profils/identifiants** et **671 ISIN**. Les profils, alias et couples outil ne sont pas des actifs uniques. La [matrice](matrice-donnees-usages.csv) et le [bilan](matrice-bilan.json) distinguent les valeurs présentes des preuves fines jointes au producteur, au blob publié et au consommateur.

| Nature du diagnostic dans cette capture | Contrats |
| --- | ---: |
| non applicable | 3,725 |
| preuve documentaire ou qualification incomplète | 27,946 |
| raccordement manquant | 39 |
| défaut réel de donnée ou de collecte | 8 |

Cette classification ne certifie pas que tous les contrats documentaires fonctionnent : une qualification non démontrée reste ouverte. En particulier, un B ne devient ni panne certaine ni réussite automatique. Les fenêtres contestées et leurs causes financières restent suivies séparément, sans bloquer toutes les périodes d’une part.

Les défauts de collecte ciblés dans cette vue concernent les compositions intégrales WisdomTree : quatre sources refusées et plusieurs consommateurs pour une même panne, pas une panne par champ. Les [contrôles mutualisés](collectes-controles.csv) regroupent workflow, exécution, rapport et liste exacte d’identifiants observés ; une portée de champs absente reste inconnue. Les succès d’un producteur entier et les consultations de cache ne prouvent pas tous ses champs.

## Exécutions, publication et limites

Les preuves GitHub et parcours réellement publics sont dans [les exécutions](preuves/reprise-20261025/github-validations.json) et [les consommateurs](preuves/reprise-20261025/consommateurs-publics.json). Elles distinguent tests isolés, collecte réelle dans GitHub, lancement manuel/push, passage planifié et adoption effective des valeurs. Les nouvelles données des producteurs ordinaires doivent être rapprochées des empreintes publiques ; une étape verte seule ne vaut pas publication.

La dernière liste des événements planifiés observables est conservée dans les preuves. Aucun premier cron post-correctif absent de cette liste n’est revendiqué. Les passages ordinaires lancés manuellement ou par push restent nommés comme tels. L’ancien échec mensuel après changement concurrent des entrées est conservé : le garde impose une nouvelle collecte, sans autoriser un écrasement périmé. Les dates de contrôle et de donnée ne sont pas confondues.

Le run mensuel 40178244234 a effectivement contrôlé 665 séries ; huit disposent d’un périmètre de champs explicitement déclaré dans ce rapport, les autres périmètres de champs restent inconnus. Son acquisition et sa validation ont réussi, mais l’enregistrement a échoué après #945 : ces sorties ne sont pas déclarées publiées. Le correctif #946 traite les quatre lecteurs Radar indépendants et maintient reconstruction et revalidation ; La reprise complète 40181551320 a réussi auparavant : collecte réelle, build, enregistrement 0f44f94 et publication. Elle prouve la reprise, sans prétendre exercer une collision post-#946. Le correctif #946 est fusionné au commit 52f59a8 ; ses 30 scénarios Git et sa CI sont verts, mais une nouvelle collision réelle Radar n’a pas été provoquée en production.

Le contrôle Healthcare a réellement vérifié les caractéristiques et la cotation Paris/EUR ; l’ancienne preuve London/USD reste datée, puisque la réponse officielle actuelle ne l’expose plus. Le run global partiel n’est pas qualifié de réussite générale. Le collecteur ETF peut également conserver son incident sectoriel CSPX lorsque seule la voie de repli déjà qualifiée fonctionne ; aucun seuil n’est relâché.

Les limites restantes comprennent : 42 fenêtres de ces 79 encore refusées ; sept preuves quotidiennes non qualifiées ; Copper et quatre compositions complètes WisdomTree sans voie autorisée démontrée dans GitHub ; deux états PEA inconnus/conflits ; continuité FR0007054358 non prouvée. Une échéance SCPI non annoncée reste une attente documentaire normale. Les composants économiques incomplets, les chiffres vivants et modules non vérifiés gardent leur motif dans le reliquat ; cette livraison ne les certifie pas.

## Suivi et non-régressions

Les 8 600 origines restent réconciliées. Les 19 actions demeurent : **10 corrigées, 5 partielles, 1 bloquée, 1 déjà résolue et 2 périmètres supprimés**. Le passage antérieur 12→11 venait de P2-04 rouvert pour stockage/validation IA ; après #923, P2-04 et P1-01 sont retirées comme périmètre supprimé, sans être renommées données réparées. Les nouveaux usages NAV ne ferment pas globalement P0-02.

Les 25 workflows communs planifiés sont préservés ; le registre de supervision contient 24 entrées (23 planifiées et Pages). Deux planifiés sont hors de ce registre : publication du moniteur et sonde Bitcoin ; avec la publication validée non planifiée, la table décrit 27 workflows, et non 27 fournisseurs. Les références de modules et vérifications non démontrées sont conservées dans le suivi.

Les corrections #936/#937/#938 sont intégrées, avec les changements concurrents #940/#941/#942/#944/#945 ; #946 est fusionné et #947 est laissé à son propriétaire Radar. Les registres communs ne changent que pour les huit instruments qualifiés ; les autres actifs et règles de portefeuille restent préservés. Aucun élément exclusivement Portefeuilles IA n’est restauré. Les 82 téléchargements PNG des outils financiers en production sont documentés dans preuves/reprise-20261025/consommateurs-publics.json ; les 84 images incluent deux captures supplémentaires. Les tests couvrent absence de changement, observation hors ordre, fenêtres invalides/valides, devises et conventions, double dividende, restrictions partielles, reprise et rendu/export. Les builds gardent les budgets et 4 274 certificats de champs. Les scénarios synthétiques sont séparés des collectes fournisseur.

[Livraison](LIVRAISON.md) · [Matrice](matrice-donnees-usages.csv) · [Chaînes](chaines-donnees.csv) · [Contrôles mutualisés](collectes-controles.csv) · [Suivi unique](suivi-consolide.csv) · [19 actions](statut-19-actions.csv) · [79 divergences](reconciliation-79-ecarts.csv) · [Reliquat](restant-a-verifier.csv).


## Complément BNP — 28 octobre, qualification locale à publier

Nouvelle voie officielle pour la part existante FR0011550185 EUR C capitalisante. Le portail mondial public indique le profil particulier `IP_FR-IND/FRE/FRA` ; aucune déclaration de statut professionnel ni authentification utilisée. Son API fournit une identité de part14258, les dernières NAV datées, les performances de **la part en EUR** (pas l’indice ni la devise de base d’une autre part), et les NAV quotidiennes/mensuelles `PRICE_NAV`. Les82 fins de mois décembre2019–septembre2026 concordent exactement entre granularités. Les six calendriers2020–2025 sont recoupés sur leurs dates de bornes effectives. 2021 :31/12/2020 14,6142997741699 EUR →31/12/2021 20,1973991394043 EUR, +38,2029892058%, calendrier détaillé +38,20299%, calendrier documentaire conservé +38,20%. Aucune conversion EUR/USD ni distribution ajoutée.

La série indépendante `etfFR0011550185Nav` peut rétablir le calculateur versement unique/DCA et la comparaison mensuelle sur2021 ; les calendriers annuels déjà disponibles ne constituent pas un nouvel usage. La cotation ESE.PA et sa divergence restent inchangées : ses bornes14,4756002426/20,3239002228 EUR (facteurs Yahoo1/1) ne sont pas validées par cette NAV. La cause de leurs écarts n’est pas démontrée.

Historique avant décembre2019 non fourni : rupture d’unité observée2018 sans ajustement spéculatif, calendrier2019 commençant au28/12/2018 alors que la NAV mensuelle est au31/12. La date de lancement exacte2013-09-16 est conservée comme identité et ne devient pas artificiellement la date de début des82 observations. Aucun cours anniversaire, rôle automatique ou autre part BNP ajouté. Le graphe NAV est masqué dans la présentation émetteur ; cela est consigné, sans le transformer en autorisation juridique : conditions de réutilisation encore non qualifiées dans le registre commun.

Preuves : `preuves/reprise-28oct/bnp/collecte-locale.json.gz`, fixtures brutes `scripts/fixtures/bnp-nav/`, `source-receipt.json` pour la découverte publique. Treize tests du lecteur (dont source modifiée, clôture mensuelle omise, contradiction entre granularités, faux prix indicatif, doublon et panne/reprise), tests consommateurs natifs et USD, calculateur/DCA et anciennes restrictions. Collecte réelle locale réussie ; **GitHub, enregistrement ordinaire, publication et recette publique restent à démontrer**. La reprise40765216139 est préservée ; pas de fusion concurrente pendant son enregistrement.
