# Historiques et performances — livraison du 8 novembre 2026

État relevé le 8 novembre 2026. Code public `2c23b244f9538a5bf1f43b4783f1e1b92d8bba12` ; données `fe9acdda6eef146527e78f7b3fb7d70414888579` ; build `2026-11-08T16:33:23.063Z`. Les fichiers publiés sont rapprochés par empreinte Git du manifeste, y compris les projections régénérées de façon déterministe. Une projection correspondante prouve sa publication, pas une collecte fournisseur.

Départ : master `899b4a25`, après #1204 ; anciens rapports conservés dans leur archive du 7 novembre. PR concurrentes #1201 et #1061 préservées. Suivi unique #881. Aucun catalogue ajouté, Radar arrêté préservé, aucun composant exclusivement Portefeuilles IA ou Analyse d’entreprise rétabli. Les archives, hypothèses et données non applicables ne sont pas des pannes.

L’export initial contient **10 602 identités**, toutes conservées dans `reconciliation-diagnostics-initiaux.csv`, y compris hors périmètre. L’export final contient **10600 lignes** ; une disparition n’est jamais assimilée à une résolution. La boîte active, les qualifications, attentes et traces historiques sont distinguées dans les colonnes correspondantes ; les autres diagnostics actifs portant la même clé et étape sont reliés séparément sans transformer une ancienne archive en nouvelle panne. Les deux exports complets accompagnent les rapports en gzip. Les autres familles restent hors intervention. Les ratios de valorisation cours/actif net comptable et les rendements actuariels indicatifs ne sont pas des clôtures/NAV ni des performances réalisées : leurs traces restent dans la réconciliation hors périmètre, sans être déclarées réparées.

La matrice commune inventorie **7512 couples champ × usage sur 1132 identifiants**, dont 5024 historiques et 2488 compositions. Ce sont des contrats déclarés comprenant archives et hypothèses, pas autant de pannes ni de preuves fournisseur. Les états connected, scheduled-evidence ou qualification-needed sont conservés sans certification artificielle. Les preuves mutualisées énumèrent les champs et instruments réellement contrôlés.

## Résultat effectif

Le périmètre constant des anciennes anomalies reste **71 fenêtres qualifiées / 79, 8 refusées**. Les 70 fenêtres antérieurement qualifiées sont conservées ; la voie HSBC 2024 livrée avant cette intervention reste qualifiée. **Aucune nouvelle résolution de ces 79 divergences n’est revendiquée.** Les anciennes 77 divergences et deux résidus sont conservés séparément ; une voie NAV indépendante ne démontre pas la cause d’une ancienne cotation.

Deux voies supplémentaires sont publiées et consommées hors de ce groupe : préfixes 2020 des NAV des ETC Brent JE00B78CGV99 et WTI GB00B15KXV33. La PR #1209 sélectionne ces préfixes dans le producteur ordinaire puis enregistre configuration et données uniquement pour chaque résultat effectivement validé. Année complète corroborée par le calendrier officiel, même part/devise/convention, tous les nouveaux mois et égalité exacte des anciennes valeurs requis. L’audit strict des registres est inchangé. L’exécution suivante ne recumule aucun ajustement.

**État de publication de ces extensions : etc_brent_crude_oilNav, etc_wti_crude_oilNav.** Consulter le reçu `preuves/oil-ordinary-production-summary.json` s’il est présent : un résultat de PR en lecture seule ne suffit pas. Brent 2020 calculé −32,2746325343 % contre −32,27 % officiel ; WTI −51,9120244895 % contre −51,91 %. Ce sont des unités de performance NAV réinvesties USD, pas des prix négociables ni une substitution silencieuse aux cours.

## Résultat par outil

| Outil | Résultat et limites |
|---|---|
| Performance depuis | Voies mensuelles/annuelles qualifiées conservées. Les deux extensions pétrolières 2020 sont enregistrées, publiées et contrôlées par les PNG publics ; reçu individuel joint. Les calendriers annuels préexistants ne sont pas de nouveaux usages mensuels. |
| Et si tu avais investi / calculateur | Qualification des fenêtres et refus des prix non qualifiés conservés. Brent/WTI : versement unique et DCA contrôlés publiquement sur ordinateur et mobile, anciennes valeurs inchangées et aucune saisie de prix sur les unités de performance. |
| Qui a vraiment gagné — comparaison | Moteur et conversion USD/EUR testés sur les bornes historiques 2019-12/2020-12 ; profondeur réelle et périodes communes requises. Présence dans le moteur et catégories sont listées par route dans le CSV. |
| Qui a vraiment gagné — classement annuel | Années complètes, couleurs et ex æquo préservés. Calendrier officiel indépendant ≠ historique mensuel. Aucun nouveau calendrier annuel n’est compté comme réparation. |
| DCA, Générateur, Duels | Moteurs partagés préservés ; aucune promotion automatique d’un ETC en rôle/allocation non qualifiés. DCA de calculateur et admissibilité au générateur restent deux capacités différentes. |
| Il y a X ans | Aucune admission de ces unités de performance comme cours/NAV brute ; exclusions anniversaire conservées. |
| Autres consommateurs | Tous les champs/usages déclarés sont conservés dans la matrice. Une présence dans un registre sans preuve individuelle reste qualification, pas automatisation démontrée. |

## Huit fenêtres encore refusées et pièce manquante

| Part / année | Usage mensuel restant et preuve manquante |
|---|---|
| DE000A0H08P6 / 2019 | Reconstruction NAV + cash et bornes homogènes encore non corroborées : résidu −0,0095831184 point (38,2409679375 % contre 38,2505510559 %). Pièce exacte : distributions d’avril/juillet et bornes de fin d’année compatibles. Aucun seuil abaissé. |
| DE000A27Z304 / 2021, 2023, 2024 | Cotation BTCE.DE EUR déjà utilisée sur ses fenêtres qualifiées ; calendrier NAV USD de valorisation 16 h CET distinct de l’EUR de clôture. Preuve quotidienne exacte des anciennes bornes/cotation/unité et changements historiques manquante. Une série Euronext limitée à deux ans ne répare pas 2021/2023. |
| FR0010755611 / 2021, 2024 | NAV quotidiennes et courbe ajustée acquises ; couverture intégrale des distributions et opérations/réinvestissement encore non démontrée pour ces années. Ne pas déduire une absence de distribution d’un document incomplet. |
| FR0013411998 / 2025 | Preuve complète des flux/opérations sur toute l’année manquante ; rapport clos juin 2025 insuffisant pour décembre 2025, voie juin 2026 essayée indisponible. |
| FR0013412004 / 2025 | Même type de pièce manquante sur la part exacte ; aucun emprunt de distribution à une autre part. |

Les dates et motifs de refus de chaque fenêtre, routes indépendantes et leurs conventions figurent dans `fenetres-79-statuts.csv` et `intervalles-mensuels-refuses-et-voies-independantes.csv`. Les refus concernent les fenêtres touchées, pas toutes les périodes de l’actif. Les classements annuels peuvent rester disponibles par leur propre calendrier qualifié.

Linxea Vie : le collecteur courant refuse une plage de rendement conditionnelle non reconnue ; les dernières valeurs 2025 restent datées et conservées. Les pièces actuelles consultées ne suffisent pas à renouveler la totalité du contrat (Eurossima/Netissima et conditions). Le rapport annuel 2026 non encore attendu n’est pas une panne de publication ; le défaut de lecture courant reste distinct, sans taux fabriqué ni date renouvelée.

Contrôle documentaire réel API Amundi du8novembre à15:21, limité aux trois identités FR0013411998, FR0013412004 et FR0010755611 : la devise de part est EUR, mais DISTRIBUTION_POLICY reste explicitement « Capitalisation and/or distribution » malgré le nom Acc. La mention Acc ne remplace donc pas la preuve de convention historique ; aucune réussite de collecte de cours ni absence de distribution déduite. Preuve amundi-current-income-policy-probe.json.

Hors de ces 79 : palladium IE00B4556L06 décembre 2014 demeure en investigation. Rapport brut/indice réinvesti 424,525216 contre facteur voisin 417,7156549, soit écart 1,63019055 %. Deux intervalles adjacents restent refusés ; périodes indépendamment qualifiées conservées. Il manque la preuve officielle de facteur/unité/opération à cette date.

Le lecteur recalcule 645 paires de mois refusées sur 28 routes : plusieurs ont une autre voie exacte qualifiée. **177 paires sans autre voie qualifiée**, pas autant d’outils entièrement indisponibles. Les intervalles antérieurs au lancement/prédécesseur non qualifié restent refusés légitimement, notamment BNKE/LU1829219390 et WELP/IE00BYTRR863. Les frontières initiales Coffee/NGAS/Wheat ne sont pas reculées sans continuité exacte.

## Collecte, reprise, preuve et planification

- Le producteur commun garde les séances, bornes mensuelles, contrôles quotidiens/mensuels et changes historiques. Les politiques et périodes propres à chaque route figurent dans `performances-mensuelles.csv` (772 routes, sans prétendre autant de sondes réseau neuves).
- Producteur expositions42490327433, cron réellement observé : plan36parts établi avant collecte, 36observations validées à15:15:39, dont35calendriers annuels. Tous les champs reçus correspondent exactement au registre canonique dans41999c17 ; publication à lire dans exposure-expansion-scheduled-production-summary.json. Ce contrôle ne rétablit pas35historiques mensuels et ne clôture aucune ancienne divergence.
- Or Banque mondiale : cron42489190863 réellement observé, source vérifiée inchangée le8novembre, publication du classeur3novembre, observation octobre2026. Enregistrement f2a1b6d4 et empreinte publique vérifiés ; moyenne mensuelle USD/once, jamais présentée ici comme clôture de fin de mois. Preuve gold-scheduled-production-summary.json.
- NGAS : cours ajustés NGAS.L contrôlés le 8 novembre et dernière clôture octobre 2026 publiés ; la voie NAV indépendante reste datée du 7 novembre. Le mois courant non clos n’est pas manquant. La qualification de continuité avant décembre 2021 reste distincte.
- Nouvelle voie WisdomTree : HTTP puis navigation publique des mêmes API, liée au PDF exact fraîchement validé ; ancienne page produit conservée en secours après 403 uniquement. Pas de résolution de challenge/authentification ni cache présenté comme source. Les réponses invalides restent des échecs, l’ancien registre et ses dates restent conservés.
- Preuves GitHub en lecture seule : 42474335792 a validé les deux préfixes par HTTP ; 42475085378/42475753455 ont validé Brent via l’API mais WTI a reçu 403. Cette intermittence n’est ni masquée ni transformée en autonomie démontrée. L’éventuel reçu du passage ordinaire donne le résultat réellement enregistré.
- Contrôle réel GitHub en lecture seule 42475753565 : Copper, Coffee, Cocoa et NGAS validés ; Wheat encore refusé 403. Ces contrôles actuels ne remplacent ni un enregistrement ni le cron fournisseur. La collecte NAV Copper est donc distincte des compositions intégrales encore bloquées.
- Reprise commune bornée des échecs/mois manquants à 06:45 UTC ; passages mensuels à 06:15 les 2/4/8/16, disponibilité effective de GitHub distincte de l’heure théorique. Derniers runs schedule observés consignés dans `preuves/scheduled-runs-observed.json`. Aucun cron postcorrectif n’est affirmé sur la seule base d’un push ou lancement manuel.
- Les pannes individuelles, données partielles, absence de rapport et enregistrement/publication restent séparés par les contrats #968. Aucun nouvel ajustement HSBC appliqué ; les corrections déjà livrées et leurs résidus documentés restent séparés.

## Échecs plus récents : ne pas confondre usage publié et acquisition autonome

Le passage **planifié 42486930861**, résultat source du **8 novembre à 13:56:16 UTC**, a sélectionné avant collecte exactement trois routes : BTCE.DE, WTI NAV et Wheat NAV. Les trois ont échoué. Les valeurs précédentes et leurs dates doivent être conservées ; le succès ordinaire des deux préfixes à12:17 ne certifie pas ce cron. La chaîne reste partielle pour ces acquisitions.

- **BTCE.DE / DE000A27Z304** : la requête historique retourne400 avec « Data doesn’t exist for startDate… ». Deux requêtes différentes range=1mo et range=max retournent200, mais uniquement le6novembre ; la seconde annonce même une granularité5minutes malgré interval=1mo. La première date du fournisseur devient6novembre2026 alors que la page officielle confirme la part DE000A27Z304, Xetra EUR et création8juin2020. C’est une troncature du flux fournisseur, pas une preuve de lancement récent. Aucun collage de séries, retraitement d’ajustement ou prolongement rétroactif n’est appliqué. Pièce manquante : historique exact antérieur et recouvrement quotidien qualifié avec les archives, ou voie indépendante autorisée avec distributions/opérations et convention démontrées. Octobre existant reste utilisable ; le renouvellement du contrôle historique est en panne.
- **WTI GB00B15KXV33 / Wheat JE00BN7KB664** : refus403 des voies HTTP/navigation/page dans GitHub. Nouvelle recherche limitée aux deux chemins officiels avec/sans slash : les quatre réponses tabulaires locales sont200 et les identités exactes concordent, mais ces réponses locales ne démontrent pas une voie nouvelle durable dans GitHub. Aucun transport alternatif non prouvé n’est livré. Reprise bornée existante conservée ; un nouveau passage fournisseur réussi, son enregistrement et sa publication restent requis. WTI2020 publié n’est pas retiré pour cet échec d’accès ultérieur.

Preuves séparées : monthly-scheduled-20261108.json, bitwise-current-http-diagnosis.json, bitwise-new-query-strategies.json et new-official-route-probes.json. Les données fournisseur intégrales privées ne sont pas redistribuées. Le moniteur public a effectivement ingéré ces trois échecs : collection=failure, validation/recording/publication=success, dernier succès source maintenu à12:17:20 ; source publiée3934008e. La preuve final-monitor-selected-workflows.json.gz vérifie aussi le décodage et son empreinte, sans assimiler l’enregistrement vert à une réussite fournisseur.

## Consommation publique démontrée

Brent et WTI : seize PNG réels validés sur1440et390px, téléchargement identique à l’aperçu ; versement unique et DCA depuis décembre2019 avec capital final vérifié indépendamment, Performance depuis2020, comparaison2020 et classement annuel2020–2025. Signes négatifs et précision du gabarit conservés ; couleurs fixes des deux supports relevées sur les deux tailles. Tests numériques USD/EUR complètent la recette navigateur USD. Aucun nouvel accès anniversaire ni rôle d’allocation automatique ajouté.

## Tests et limites

29 tests du producteur mensuel, 21 du lecteur de performance WisdomTree, scénarios de navigateur transport isolés, calculs USD/EUR/versement/DCA/Performance depuis/comparaison, pannes, nouvelles dates, mauvais ISIN, années non corroborées, suffixe modifié/manquant, duplication/ordre, ciblage et idempotence. Les reçus exact-head et la recette publique sont joints. Le build CI porte sur le head livré ; les collectes en lecture seule ne valent pas enregistrement. Aucun historique de production fabriqué à partir d’une fixture.

Il reste des qualifications documentaires, routes manuelles et sources externes : voir chaque ligne de la matrice et les causes consolidées. **Ce rapport n’est pas une certification fournisseur indépendante de toutes les données du catalogue et ne conclut pas à une automatisation complète.**
