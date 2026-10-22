# Plan de correction — audit du 22 octobre 2026

Aucune de ces modifications n’a été appliquée. Les erreurs démontrées et les alertes à investiguer sont distinguées.

## P0-01 — Les historiques répétés restent admis hors classements

**Outils :** Calculateur ; Performance depuis ; vérifier les rendements dérivés des portefeuilles.

**Actifs :** IE00B579F325, IE00BDFBTQ78, IE000U9ODG19, GB00B15KXQ89.

**Fichiers :** src/data/market-history.js, src/pages/investment-calculator/lib.js, src/pages/tweet-midi/data/performanceHistory.js, src/pages/performance-rankings/data.js, scripts/refresh_monthly_history.py.

**Solution :** Mutualiser la qualification des historiques, au niveau de la fenêtre réellement utilisée. Recollecter la cotation exacte ou conserver le blocage. Ne pas recopier les niveaux ni substituer un indice.

**Contrôle de réussite :** Tous les moteurs rejettent la fenêtre non qualifiée ; Aerospace 2025 est recoupé sur clôtures ajustées exactes et NAV, dans le texte et le PNG. Aucun contrôle désactivé.

**Preuve :** preuves/historiques-repetes.json ; preuves/exclusions-moteurs.json ; preuves/recoupement-nav-cours-change.json

## P0-02 — 90 écarts annuels >2 points sur 53 parts à investiguer ; le seuil seul ne prouve pas une erreur

**Outils :** Performance depuis ; Calculateur ; classements et portefeuilles selon route.

**Actifs :** CH0454664001, DE000A0H08P6, DE000A27Z304, FR0007054358, FR0010342592, FR0010755611, FR0011550185, FR0011871110, FR0011871128, FR0013411998, FR0013412004, FR0013416716, GB00B15KXQ89, GB00B15KXV33, IE000M7V94E1, IE000RDRMSD1, IE000U9ODG19, IE000YU9K6K2, IE00B1XNHC34, IE00B2QWCY14, IE00B42NKQ00, IE00B43HR379, IE00B4556L06, IE00B4JNQZ49, IE00B4K6B022, IE00B579F325, IE00B5W4TY14, IE00BD1F4L37, IE00BDFBTQ78, IE00BDVPNG13, IE00BJ5JP097, IE00BJ5JP436, IE00BJGWQN72, IE00BK5BCD43, IE00BK5BCH80, IE00BLNMYC90, IE00BQN1K562, IE00BQQP9F84, IE00BQT3WG13, IE00BSPLC298, IE00BSPLC413, IE00BYTRR863, IE00BYWQWR46, IE00BYXG2H39, JE00B2QXZK10, JE00B78CGV99, JE00BN7KB334, JE00BN7KB557, JE00BN7KB664, LU1737652823, LU1875395870, LU2089238385, LU2196470426.

**Fichiers :** src/data/automated-etf-monthly.json, src/data/non-bond-monthly-records.json, src/data/automated-etf.json, src/data/monthly-fx.json, scripts/collect_ranking_sources.py, scripts/refresh_monthly_history.py.

**Solution :** Pour chaque anomalie, contrôler dates de séance, part, cotation, devise, révisions et revenus. Expliquer les différences NAV/cours réelles ; corriger seulement sur preuve. Ajouter une alerte commune de recoupement indépendante du fournisseur.

**Contrôle de réussite :** Les 90 périodes ont une cause documentée ou une correction sourcée ; liste des 175 périodes non comparables conservée. Le jeu de contrôle n’exige pas une égalité artificielle NAV/cours.

**Preuve :** anomalies-performances.csv ; performances-non-comparables.csv

## P0-03 — SOXX : capital simulé sur cours hors dividendes et identité sans ISIN qualifié

**Outils :** Calculateur ; Performance depuis.

**Actifs :** soxx.

**Fichiers :** src/data/market-history.js, scripts/monthly-automation.json, src/pages/investment-calculator/lib.js.

**Solution :** Qualifier la part/cotation et une série ajustée réelle avant de calculer un investissement avec revenus réinvestis. Performance depuis possède déjà une convention prix explicite ; préserver cette distinction.

**Contrôle de réussite :** Recouper un intervalle comportant dividende et split ; rendements prix et total distincts ; convention du calcul cohérente dans tous les rendus.

**Preuve :** preuves/exclusions-moteurs.json ; src/pages/tweet-midi/data/marketHistory.js:181

## P1-01 — La seconde commande du contrôle IA ne tourne pas en CI

**Outils :** Portefeuilles IA.

**Actifs :** 21 186 cotations techniques.

**Fichiers :** .github/workflows/update-ai-portfolios.yml.

**Solution :** Utiliser un bloc run: | et deux commandes séparées.

**Contrôle de réussite :** Journal CI montrant réellement les deux processus ; erreur volontaire du second audit fait échouer le job. Les 21 186 séries passent déjà cet audit en local.

**Preuve :** preuves/workflow-ai-commande.json ; preuves/audit-ai-runtime.mjs.log

## P1-02 — Extraction INSEE des salaires en échec réel

**Outils :** France en 100 ménages ; autres consommateurs de ces repères.

**Actifs :** salary-top10, salary-median.

**Fichiers :** scripts/collect_economic_data.py, src/data/automated-economic.json, src/data/household-statistics.js.

**Solution :** Adapter la sélection de la ligne à la publication découverte, sans sélectionner arbitrairement une ligne différente. Conserver les dernières valeurs avec leurs dates.

**Contrôle de réussite :** Collecte réelle des deux séries, population et année vérifiées ; une modification de structure est rejetée ; valeurs consommées dans les fiches.

**Preuve :** preuves/economique-menages.log ; preuves/collecte-menages.json

## P1-03 — Accès Bourse Direct et condition fiscale IBKR en échec réel

**Outils :** Comparatif courtiers.

**Actifs :** bd, ibkr:cash.

**Fichiers :** scripts/collect_broker_tariffs.py, scripts/broker_document_sources.py, scripts/broker_profile_sources.json, src/data/broker-tariffs.js.

**Solution :** Rétablir une voie publique officielle documentée pour les PDF/conditions concernées ; garder les dernières observations sans renouveler artificiellement leurs preuves.

**Contrôle de réussite :** Collecte des huit courtiers et de leurs conditions requises ; 0 échec de transport caché ; âge et date source restitués correctement.

**Preuve :** preuves/collecte-courtiers.log ; preuves/collecte-courtiers.json

## P1-04 — Source VanEck de la sonde en déconnexion ; 4 connecteurs de positions bloqués en 403

**Outils :** ETF ; expositions ; recouvrement.

**Actifs :** IE00BDFBTQ78, IE0002Y8CX98, IE000W8WMSL2, IE00BDVPNG13, IE00BJGWQN72.

**Fichiers :** scripts/issuer-access-routes.json, scripts/collect_vaneck_etf.py, scripts/collect_dca_complete_holdings.py, src/data/dca-holdings-status.json.

**Solution :** Utiliser une route autorisée de l’émetteur ou un export public de même part et même périmètre. Traiter séparément métadonnées/top10 et portefeuille complet.

**Contrôle de réussite :** Parser et identité exacts passent en réseau ; preuve datée du portefeuille complet avant admission au recouvrement ; tout refus reste visible.

**Preuve :** preuves/sonde-etf-vaneck.json ; preuves/inventaire-natif.json:backlog

## P1-05 — Référence pédagogique or Amundi inaccessible en HTTP 503

**Outils :** Fiches pratiques.

**Actifs :** practical:gold.

**Fichiers :** scripts/practical-sheet-sources.json, scripts/collect_practical_sheets.py.

**Solution :** Rétablir un document public Amundi portant sur la structure et les risques de l’ETC. Ce défaut ne prouve pas une panne des cours de l’or Banque mondiale.

**Contrôle de réussite :** Document réel, marqueurs ETC/Gold et empreinte ; les autres dix sources continuent en cas de panne.

**Preuve :** preuves/documents-pratiques.log ; preuves/collecte-pratiques.json

## P1-06 — Radar : 26 réserves publiées, dont 11 divergences DWS de photographie

**Outils :** Radar ; ETF/expositions DWS.

**Actifs :** IE00BLNMYC90, IE0006WW1TQ4, IE000L6ZMMC4, IE00BGV5VN51, IE00BM67HK77, IE00BM67HS53, IE00BTJRMP35, LU1875395870, LU2196470426, IE00BM67HV82, IE00BM67HQ30, JE00B1VS3770, GB00BJYDH287, IE00BYPLS672, IE0002XZSHO1, IE0002XZSHO1, IE0002XZSHO1, IE000DQLYVB9, IE000DQLYVB9, IE000DQLYVB9, GB00B15KXQ89, IE0002Y8CX98, IE000W8WMSL2, IE00BZ56SW52, IE00B3T9LM79, DE000A27Z304.

**Fichiers :** scripts/update-editorial-radar.mjs, scripts/verify_dws_compositions.py, scripts/lib/dws-reconciliation.mjs, src/data/automated-etf.json.

**Solution :** Recollecter et publier une photographie cohérente avant comparaison indépendante. Empêcher qu’un registre prioritaire plus ancien remplace une preuve récente. Ne pas accepter les différences de date comme concordance.

**Contrôle de réussite :** Photographies actives et contrôlées concordantes ; 11 réserves DWS résolues sur preuve ; observations plus anciennes tracées ; panne simulée conserve les signaux.

**Preuve :** preuves/radar-publie.json ; preuves/sonde-etf-dws-resultat.json

## P1-07 — Succès de consultation 13F non persistés indépendamment du contenu

**Outils :** Présentation investisseur ; Données à revoir.

**Actifs :** 28 profils ; 27 inchangés ; 21 signalés hors délai par le contrat actuel.

**Fichiers :** scripts/update-investor-13f.py, scripts/lib/external-consumer-assets.mjs, public/data/investors/review-metadata.json.

**Solution :** Séparer le dernier contrôle réussi du flux, la date de collecte des positions et la période réglementaire. Enregistrer une preuve de consultation inchangée sans rajeunir le trimestre.

**Contrôle de réussite :** Un poll inchangé produit une preuve vérifiable de réussite ; une panne ne la renouvelle pas ; Q2 reste Q2 ; plus de faux blocage causé uniquement par l’absence de changement.

**Preuve :** preuves/13f-github.log ; preuves/inventaire-natif.json:consumerUsage.externalAssets

## P2-01 — Obligations génériques et consommateurs déclarés surcomptent les besoins réels

**Outils :** Données à revoir ; ETF ; DCA ; Impact des frais.

**Actifs :** IE00BFMXYX26, IE00BK5BQZ41, IE00BKX55R35, 238 actifs attribués à Impact des frais.

**Fichiers :** scripts/report-asset-fields.mjs, scripts/lib/asset-automation.mjs, scripts/lib/consumer-usage.mjs, src/data/vanguard-equity-underliers.json.

**Solution :** Qualifier les obligations par capacité/outils et lire les données réellement consommées. Les trois Vanguard sont composition-only ; le simulateur de frais utilise des hypothèses.

**Contrôle de réussite :** Aucun frais/cours/PEA inutile exigé ; pays/secteurs des trois fonds retrouvés dans leur registre ; les données nécessaires manquantes restent signalées.

**Preuve :** matrice.csv ; preuves/catalogues-outils.json ; preuves/inventaire-natif.json

## P2-02 — Complétude des positions : top10, paniers et transparisation à distinguer

**Outils :** Actifs et exposition ; recouvrement.

**Actifs :** IE0002Y8CX98, IE000W8WMSL2, IE00BDVPNG13, IE00BJGWQN72, FR0007056841, FR0010342592, FR0010755611, FR0011440478, FR0011550185, FR0011550193, FR0011869304, FR0011869320, FR0011871078, FR0011871110, FR0011871128, FR0013412004, FR0013412012, FR0013412020, FR0013412038, FR001400S9V0, FR001400U5Q4, FR001400ZGO4, FR0014017NX3, IE0002XZSHO1, IE000DQLYVB9, IE000QDFFK00, IE00BD4TXV59, IE00BF0M2Z96, IE00BK5BCD43, IE00BK5BCH80, IE00BKLF1R75, IE00BM8R0J59, IE00BYPLS672, IE00BZ56SW52, LU1681038672, LU1681043599, LU1681045370, LU1834983550, LU1834983634, LU1834986900, LU1834988518, LU2903252349.

**Fichiers :** scripts/build-dca-exposures.mjs, src/pages/dca-profiles/verification.js, src/data/index-company-identities.json.

**Solution :** Raccorder les compositions économiques exactes et les identités entreprise. Respecter poids inconnus et dates ; ne pas normaliser le top10.

**Contrôle de réussite :** Chaque paire admise possède une couverture et des dates compatibles ; top10/partiel interdit au pourcentage complet ; ordre de paire invariant et consolidation vérifiée.

**Preuve :** raccordements.csv ; preuves/test-exposure-complete.mjs.log ; preuves/test-exposure-scope.mjs.log

## P2-03 — Statut PEA contradictoire ou non publié

**Outils :** ETF ; comparatifs ; règles PEA.

**Actifs :** IE00B0M62S72, IE0003R87OG3.

**Fichiers :** scripts/collect_instrument_metadata.py, scripts/metadata-qualification-holds.json, src/data/instrument-pea.js.

**Solution :** Maintenir inconnu ou conflit jusqu’à preuve explicite liée à la part ; ne pas inférer depuis le nom.

**Contrôle de réussite :** Sources explicites concordantes ou décision de qualification documentée ; les règles PEA refusent l’inconnu, sans le convertir en false.

**Preuve :** preuves/collecte-metadonnees.json ; preuves/inventaire-natif.json:pea

## P2-04 — Capacité quotidienne IA, admission et sélection ne sont pas le même univers

**Outils :** Portefeuilles IA.

**Actifs :** 21 186 cotations / 20 400 identités techniques ; 20 200 instruments sans blocage de sélection ; 18 468 par défaut.

**Fichiers :** scripts/qualify_ai_portfolios.py, scripts/ai-portfolio-universe.mjs, src/pages/ai-portfolios/data.js, scripts/ai-series-store.mjs.

**Solution :** Conserver les quatre dénominateurs et contrôler à la demande chaque nouvelle décision ; renouveler les 35 preuves legacy sans evidenceId. Ne pas imposer un téléchargement quotidien de tous les non-détenus.

**Contrôle de réussite :** Catalogue complet réconcilié, aucune double cotation de même instrument dans une compétition ; rattrapage, liquidités, opérations et dates cohérents dans l’export IA.

**Preuve :** preuves/audit-ai-runtime.mjs.log ; reconciliation.csv ; preuves/sonde-ai-quotidien.json

## P2-05 — Alertes génériques de fraîcheur sur bulletin SCPI attendu

**Outils :** Présentations SCPI ; Données à revoir.

**Actifs :** remake-live.

**Fichiers :** scripts/collect_scpi.py, src/data/freshness-policy.json, scripts/report-asset-fields.mjs.

**Solution :** Distinguer attente du prochain bulletin, contrôle de l’accès et dernière donnée financière validée. Échéance observée : 14 novembre 2026.

**Contrôle de réussite :** Avant l’échéance : attente explicite et données datées ; après : incident si bulletin non reçu. Ne pas rajeunir les valeurs retenues.

**Preuve :** preuves/collecte-scpi.json ; preuves/scpi-produits.log

## P2-06 — Chiffres des textes réutilisables non tous alimentés par registres

**Outils :** Banque de tweets ; Faits marquants.

**Actifs :** 90 textes ; 62 fiches.

**Fichiers :** src/pages/tweet-bank/data.js, src/pages/tweet-bank/validity.js, src/pages/market-facts/data.js, src/data/history-statistics.js.

**Solution :** Séparer archives historiques, rédaction et chiffres vivants ; résoudre les derniers depuis registres communs. Conserver le verrou de vérification avant copie des brouillons.

**Contrôle de réussite :** Chaque texte possède un contrat de champs ; archives datées non renouvelées fictivement ; changement de TER/année testé dans le texte dérivé.

**Preuve :** preuves/catalogues-outils.json ; matrice.csv

## P3-01 — Représentation incomplète des fichiers dynamiques dans le graphe statique

**Outils :** Inventaire ; DCA ; IA.

**Actifs :** 41 sorties programmées sans consommateur statique.

**Fichiers :** scripts/data-automation-inventory.mjs, scripts/lib/external-consumer-assets.mjs, scripts/project-light-registries.mjs, src/pages/dca-profiles/holdings-loader.js.

**Solution :** Déclarer projections de build, modules virtuels et fetch publics. Un fichier chargé dynamiquement ne doit pas être déclaré mort à partir de ses seuls imports.

**Contrôle de réussite :** Tous les producteurs reliés à leurs vrais consommateurs ou explicitement archivés ; contrôles par empreinte du fichier servi.

**Preuve :** registres.csv ; preuves/verification-publication.json

## P3-02 — Calendriers et fréquences à conserver par nature de donnée

**Outils :** Tous outils.

**Actifs :** Toutes catégories.

**Fichiers :** src/data/freshness-policy.json, src/data/automation-workflows.json, .github/workflows/update-*.yml.

**Solution :** Cours IA détenus quotidiens par séances ; non-détenus à la demande ; mensuels après clôture avec reprise ; compositions à la publication effective ; caractéristiques sur amendement et surveillance ; 13F selon trimestre.

**Contrôle de réussite :** Simulation jour férié, changement de mois/année, bulletin tardif, panne et reprise ; date de donnée distincte de la consultation.

**Preuve :** chaines.csv ; workflows.csv ; src/data/freshness-policy.json

## P3-03 — Droits d’accès/réutilisation inégalement documentés

**Outils :** Outils utilisant sources externes.

**Actifs :** Or Banque mondiale ; Nasdaq/FRED ; indices/émetteurs ; portraits.

**Fichiers :** docs/gold-monthly-automation.md, docs/image-footer-policy.md, scripts/issuer-access-routes.json.

**Solution :** Centraliser les conditions déjà documentées par source et conserver les limites non vérifiées. Ne pas déduire une autorisation de redistribution d’un HTTP 200.

**Contrôle de réussite :** Fiche source portant accès, licence connue, attribution requise et statut de revue ; aucun changement de maquette requis dans cet audit.

**Preuve :** docs/gold-monthly-automation.md ; docs/image-footer-policy.md
