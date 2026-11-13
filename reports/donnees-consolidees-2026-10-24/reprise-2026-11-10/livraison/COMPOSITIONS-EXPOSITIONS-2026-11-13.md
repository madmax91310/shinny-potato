# Compositions et expositions — bilan consolidé du 13 novembre 2026

Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881#issuecomment-6776720896), mêmes matrices, aucune extension de catalogue. État public vérifié **2026-11-13T18:19:14.309138+00:00**, CODE **d715820a698c92bde94480e5c47056863f21d6b0**, DATA **ff7aa255e53d9d29687896050b629d4e4ee23af7**. Les 111 entrées communes sont reliées à leurs octets publics ; cette liaison ne certifie pas indépendamment chaque champ financier. Les anciens rapports sont conservés dans l’historique de la branche de rapports (état du matin : e7da7bc0b5d162954e8dbd1605d1a2eeefb29f88).

#1251/#1254, les 73 fenêtres utilisables, Bitwise Paris et les correctifs antérieurs sont préservés. PR1255 et les autres travaux concurrents relus ; #1253 S&P reste draft fournisseur, #1222 Radar et #1061 encours laissées à leur propriétaire. Aucun ancien outil restauré, aucun Radar réactivé, aucune modification de maquette ou publication sur X.

## Corrections effectives

| PR | Correction et portée |
|---|---|
| [1256](https://github.com/madmax91310/shinny-potato/pull/1256) | Joindre les identités nécessaires au livre WisdomTree exact, sans faire échouer cinq livres sur un conflit hors de leur périmètre. Les conflits effectivement utilisés restent refusés. |
| [1257](https://github.com/madmax91310/shinny-potato/pull/1257) | Préserver les poids NAV Avantis avant classement ; convertir les secteurs SILV `%Equity` en poids NAV de la même photographie. Aucune normalisation à100%. |
| [1258](https://github.com/madmax91310/shinny-potato/pull/1258) | Continuité Weatherford documentée par annonce et réalisation1:1 ; ancienne identité jusqu’au12Nov, nouvelle dès13Nov. Consolidation de société commune, aucun ajustement d’historique. |
| [1259](https://github.com/madmax91310/shinny-potato/pull/1259) | Droits cash Akero/Esperion qualifiés sur actes SEC exécutés, conservés avec leurs valeurs/poids hors actions d’entreprises ; World Small Cap et Biotech. |
| [1260](https://github.com/madmax91310/shinny-potato/pull/1260) | Test mensuel Nasdaq entièrement isolé du réseau ; la vraie qualification d’opérations reste exercée avec une réponse originale hachée. Aucun contrôle de production supprimé. |
| [1261](https://github.com/madmax91310/shinny-potato/pull/1261) | Réutilisation du reçu INSEE indépendant lors d’un enregistrement ETF, après vérification des deux graphes de dépendances et revalidation financière obligatoire. Données actives/code/configurations toujours protégés. |
| [1262](https://github.com/madmax91310/shinny-potato/pull/1262) | Déclarer des fichiers de projection concrets au lieu de motifs glob littéraux ; propriété privée et contrôles financiers conservés. |
| [1263](https://github.com/madmax91310/shinny-potato/pull/1263) | Isoler le test Defence, préserver les données plus récentes et refuser les marqueurs/dates contradictoires des droits cash exactement connus. Aucun seuil, historique ou valeur de production modifié. |

Avantis World Small Cap Value IE0003R87OG3 : **99,44%NAV classés**,0,05% d’actions non classées et0,51%NAV non représenté ; ce dernier résidu ne prouve pas des liquidités. Les secteurs SILV IE000UL6CLP7 passent d’un pourcentage des actions à **99,96%NAV**, avec0,04% non-actions non redistribué. Valeurs collectées, enregistrées et consommées par les donuts, texte, aperçu et PNG : [source/enregistrement](preuve-nav-enregistree.json), [recettes publiques](preuve-nav-consommateurs-publics.json). Le contrôle de qualité compare désormais la qualité de classification à son périmètre, sans relever le seuil existant.

World Small Cap IE00BF4RFH31 et Biotech IE00BYXG2H39 : **recouvrement d’entreprises rétabli avec d’autres livres compatibles** après qualification juridique Akero/Esperion. Sur les captures natives du12Nov : Small Cap99,58645% d’actions +Akero0,0003% ; Biotech99,78841% d’actions +Akero0,00263% +Esperion0,0003%. Les CVR restent valorisés avec leurs poids, identifiants et classe source originaux dans le rapprochement NAV, hors actions. Aucun ISIN inventé, aucune action Novo/Essence attribuée, aucun maximum de paiement utilisé comme cours. La borne Esperion2030 est une limite de revue, pas une date de terminaison inventée. [Chaîne ordinaire et publique](preuve-droits-cash-production.json), [recouvrement/texte/PNG et ordre des actifs](preuve-consommateurs-compositions-suite.json).

## Usages et limites par famille

| Actifs / indice | Données et usages autorisés | Actualisation et pièce restante |
|---|---|---|
| Les6livres WisdomTree WDEF/WQTM/GGRA/WCLD/WTAI/VOLT | Classements complets de positions publiées et identités qualifiées ; pas un livre NAV certifié ni un indice exact | Conflits de périmètre et Weatherford corrigés ; collecte ordinaire puis cron13Nov observés. NAV/liquidités et poids économiques complets manquants ; API native403, classements accessibles. Rapports officiels obtenus dans GitHub mais photos trop anciennes pour certifier le livre actuel |
| Global X Robotics IE00BLCHJB90 | Livre12Nov renouvelé, positions/concentration/recouvrement compatibles | Nouvelle photographie native sans les deux FX incomplets du11Nov ; anciennes tentatives gardées. Aucune suppression de ligne par le parseur |
| Global X Uranium IE000NDWFGA5 | Dernier livre valide11Nov et ses usages partiels conservés | CSV12Nov :2contrats ZAR sans prix/valeur/poids NAV ; pas zéro. Deux positions Verdera sans identité exacte. Champs fournisseur et classes/ISIN nécessaires ; collecte échoue explicitement |
| Small Cap / Biotech | Livres qualifiés et recouvrements d’entreprises ; données communes DCA / Actifs et expositions | Qualification cash exacte renouvelée par le producteur ordinaire, source/stockage/publication/consommation vérifiés ; le prochain cron postqualification reste distinct du push |
| Defence IE000U9ODG19 | Secours physique pays/secteurs et livre actions qualifié ; outils compatibles utilisables | Primaires pays/secteurs98,74% toujours refusés. Le secours n’est pas une réparation de ces branches ni la composition exacte du benchmark |
| S&P Global/Euro Dividend Aristocrats natifs | Dernier relais qualifié13Nov07:42:53, photographie30Oct, consommable dans sa fenêtre48h | Primaires403 dans GitHub ; renouvellement du relais manuel. Accès natif autorisé ou relais automatisable exact nécessaire ; expiration15Nov07:42:53UTC sans nouvelle preuve. #1253 non fusionnée |
| Russell1000 | Secteurs et1022titres mensuels31Oct automatisés ;1023lignes de titres dans le livre officiel30juin candidat | Titres distincts des entreprises consolidées. Identités/relations des sociétés ou top10sociétés natif certifié manquants ; ne pas mélanger les deux dates. Accès fonctionne ; licence non vérifiée, pas une licence déduite d’un HTTP200 |
| VanEck Mining IE00BDFBTQ78 | Pays/secteurs et positions identifiées partiels | Americas Gold and Silver0,04%,Solaris0,04%,Arafura0,03% sans ISIN ; le même CUSIP est attribué à Solaris et Arafura dans le corps fournisseur. Classe/identité exactes nécessaires, aucune substitution par des actions homonymes |
| L&G AI/Cyber/Clean/Battery | Top10 publiés et ventilations existantes, selon leur périmètre | Contrôle actuel des exports déjà exclus : quatre nouvelles réponses natives confirment PCF et divergence possible avec le fonds ; pas un livre NAV ni un indice exact. Ne déverrouille pas le recouvrement. [Preuves par part](preuve-LG-livres-PCF-distincts.json) |
| QYLD | Ventilations qualifiées propres préservées | Table rendue contradictoire déjà documentée ; livre économique non ambigu de la stratégie couvert-call nécessaire, jamais panier de substitution |
| LifeStrategy20/40/60/80 | Transparisation des poches actions, photos parent/enfants compatibles30Sep ; utilisations partielles | Pas une couverture complète des fonds ; obligations/liquidités et prochain ensemble compatible encore nécessaires. Aucun top de fonds renormalisé |
| MSCI EM IMI | Substitut ETF explicitement identifié et couverture partielle | Pas une composition exacte de l’indice ; recouvrement complet refusé lorsque la couverture manque |
| CMOD/ICOM, ventilation BCOM | Dernière ventilation valide conservée ; historiques indépendants préservés | PDF officiel31Oct désormais`Autres=-0,11%`, hors garde existante. Extraction correcte, valeur non modifiée, seuil non relevé. Ventilation financière qualifiable requise |

Healthcare, Ageing, Invesco Equal Weight et EM Small Cap restent qualifiés. Les nouvelles photographies émetteur sont admises uniquement lorsqu’elles passent les règles existantes ; les nouvelles photographies incomplètes redeviennent partielles au lieu de conserver artificiellement une ancienne admission. Les différences avant/après sont [individualisées](composition-admission-changes.json). Les 13 recettes publiques couvrent sélecteurs, calcul, sociétés communes, invariance à l’ordre, texte, aperçu et téléchargement identique à l’aperçu à 1440/390 px ; ce n’est pas une preuve indépendante pour tout le catalogue.

## Régularité et périmètre

Le cron43455295963 a produit **200contrôles source réussis,4transparisations dérivées et1échec Uranium**. Les204résultats réussis ne sont pas204requêtes réseau et ne certifient pas la couverture NAV. La preuve de publication compare les fichiers et observations concernés, jamais le seuldataSha global. Les chronologies des passages sur push, des crons et des éventuelles attentes de validation sont dans [la preuve datée](preuve-cron-compositions-publication.json).

Les deux défauts d’enregistrement observés sur crons sont traités distinctement : reçu INSEE indépendant refusé par le writer ETF ; motifs glob pris à tort comme chemins de fichiers par le writer des expositions. La reprise ETF ayant déjà enregistré1a39f0b1 avant#1261 est conservée comme telle : elle ne prouve pas que le futur correctif a causé cette réussite. #1261 sécurise cette concurrence et son rejeu réel a gardé l’obligation de revalidation financière. #1262 conserve la propriété stricte et teste les sorties hors périmètre. Résultats ordinaires postfusion, et éventuelles branches non exercées, sont explicités dans la preuve de chaîne.

La matrice conserve **694 références**, dont411 actions directes et53 non applicables au recouvrement d’entreprises. Classement du moteur courant : **539compatibles avec recouvrement intégral, 102partielles, 53 non applicables**. Les actions directes ne sont pas des livres de fonds collectés ; ce classement n’est pas un taux d’automatisation.86 indices sont conservés dans la matrice séparée, avec sources natives/substituts, dates et capacités individuelles.

[694 références](compositions-expositions-2026-11-12.csv), [86 indices](compositions-indices-2026-11-12.csv), [qualification du moteur](composition-current-694.json), [indices réellement consommés](index-current-86.json). Les passages nominaux futurs ne sont jamais des réussites acquises ; l’absence de prochain cron ne bloque pas les autres corrections.

## Réconciliation et limites des preuves

Les **1218 identités initiales** restent toutes présentes, sans remplacement de leurs identifiants : 1186 qualifications initiales,25 traces de rapports/artefacts,5 incidents de collecte et2 contrôles. Cycle final : **{"résolu sur preuve": 2, "qualification": 1186, "actif": 5, "historique": 25}**. La présence dans le registre courant et celle dans l’export public sont renseignées séparément. Les nouveaux incidents apparus ensuite restent dans la même liste de causes, hors de ce dénominateur initial.

Les résultats individuels actuels, leur liste exacte de champs et leur périmètre déclaré sont associés aux qualifications anciennes lorsque leur identité correspond. Cela apporte une preuve actuelle, **jamais un périmètre tenté ou un succès rétroactif** pour un ancien rapport incomplet. Les25 traces historiques, dont les deux anciens périmètres inconnus, ne deviennent pas des données réparées. Les qualifications peuvent être financières ou documentaires : elles ne sont ni toutes des pannes, ni toutes de simples formalités.

Réconciliation exploitable : [1218 identités](reconciliation-incidents-2026-11-13.csv), [causes et nouveaux incidents](reconciliation-causes-source-2026-11-13.json), [dénominateurs](reconciliation-perimetres-2026-11-13.json), [moniteur actuel](preuve-moniteur-financier-courant.json), [parcours et export public](preuve-boite-publique-finale.json). Les encours et autres familles hors priorité restent tracés, sans réparation revendiquée.

Contrôles CI requis, commits fusionnés, événements des producteurs, enregistrements et publications : [preuves CI](preuves-CI-correctifs-fusionnes.json), [chaînes réellement observées](preuves-fusions-collectes-et-publication.json), [entrées publiques](preuve-publication-courante.json). Les recettes ne valent pas réparation d’une source. Les photos partielles et les causes fournisseurs persistent dans les diagnostics ; aucune baisse de seuil.

L’automatisation complète n’est pas annoncée : des livres économiques, poids, identités, accès natifs et qualifications financières nécessaires restent manquants. Ils demeurent visibles, avec dernières valeurs valides et refus ciblés. Les limites sont séparées des corrections livrées et des traces historiques.


## Chaînes ordinaires postcorrectives réellement enregistrées et publiées

| Run | Déclenchement réel | Enregistrement | Publication vérifiée UTC |
|---|---|---|---|
| 43467518507 | push | e744ac20 | 2026-11-13T17:48:16.648Z |
| 43475036962 | workflow_dispatch | 1f845e78 | 2026-11-13T18:05:38.012Z |
| 43475043183 | workflow_dispatch | 92ef010a | 2026-11-13T18:08:18.762Z |
| 43479483363 | push | ff7aa255 | 2026-11-13T18:18:56.839Z |

Les quatre acquisitions, validations, enregistrements et publications ont réussi. L’état global peut rester en échec pour une branche fournisseur individuelle conservée : Xetra pour le mensuel, erreurs primaires/qualifications pour les ETF, Uranium pour les livres. Les limites ne sont jamais clôturées par le seul succès du publisher.

La course ETF/INSEE réellement observée a été rejouée en isolation ; la branche conditionnelle de rebase des expositions a ses tests de propriété stricts. Les dernières chaînes ordinaires sont publiées, mais aucune course n’a été provoquée en production pour certifier ces branches conditionnelles après fusion. Les codes producteurs incluent #1263 ; les octets du client réutilisé restent identifiés par le CODE public, distinct du DATA.

Prochaines observations **nominales**, non réussites anticipées : 14NovUTC, LifeStrategy05:35, indices06:40, reprise mensuelle06:45, ETF07:10, Nasdaq07:40, expositions07:45, livres07:50 ; production mensuelle complète16Nov06:15. Les crons Nasdaq/compositions du13Nov déjà observés sont conservés comme preuves datées séparées. Le push après la qualification cash ne devient pas un cron.

## Consommation supplémentaire et changements de photographie

Coulisses des indices : World Small Cap retrouve son top10 via le **substitut ETF explicitement qualifié** IE00BF4RFH31. MODERNA0,74967%, top10entreprises2,55848% ; aucune renormalisation. Texte/aperçu/téléchargement identique au PNG à 1440 et 390 px : [preuve publique dédiée](preuve-Coulisses-WorldSmallCap-proxy-public.json). Ce livre de fonds ne devient pas la composition exacte de l’indice. Le moteur propose actuellement38 vues d’entreprises, dont10 natives et28 substituts qualifiés.

Huit photographies passent désormais le recouvrement et sept redeviennent partielles dans la comparaison avec le relevé du matin, soit un solde de+1, pas deux admissions artificiellement maintenues. Les sept limitations courantes sont individualisées dans [le delta](composition-admission-changes.json) : World99,49939%, NasdaqPEA/substitut publié100,0001%, EUROSTOXX50 99,40338%, Avantis99,49%, WorldexUSA98,77345821%, JEPG99,45826892%, EuropeMomentum99,45339%. Les règles de couverture/total existantes restent inchangées ; aucune redistribution des résidus. Un livre partiel peut toujours fournir ses ventilations et positions identifiées.

## Propagation du moniteur encore en file

Dernier moniteur public contrôlé :13Nov18:21:09UTC ; son état du producteur de livres précède la dernière collecte effectivement publiée. L’observateur43479256343 est en cours ;43479683156 et43481467099 sont en attente. Le dernier a été déclenché par la fin de la collecte13Nov18:19:10. La résolution financière est prouvée par les observations/commits/octets publics et recettes, mais la propagation de ce dernier état dans « Données à revoir » reste **à observer**. Aucun incident n’est masqué, aucune relance destinée au seul voyant vert : [preuve de file](preuve-propagation-moniteur-en-attente.json).
