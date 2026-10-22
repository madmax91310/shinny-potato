# Portefeuilles IA

Outil `/portefeuilles-ia`. Les échanges avec les IA et les décisions sont exclusivement manuels. Aucun SDK IA, appel à un modèle, secret, courtier, ordre réel, publication X ou génération d’image par IA.

## Audit de l’existant (21 octobre 2026)

Instructions lues : `CLAUDE.md` et sa référence `docs/claude/audit-application-2026-10-18.md`. L’application est une SPA React/Vite publiée sur GitHub Pages, sans backend d’écriture authentifié.

| Brique | Constat / réutilisation |
| --- | --- |
| Identités | `instruments.js`, `instrument-listings.js`, `equity-history-links.json` : identité ISIN, part et cotation exacte ; projection dédiée `ai-portfolio-universe.mjs`. Aucun changement de sélection dans les anciens outils. |
| Accès sources | `market_transport.chart_response`, `data_automation.get_json`, `issuer_documents.download`, écriture JSON atomique. Les deux hôtes officiels Yahoo servent la même requête, sans substitution d’instrument. |
| Séries | `refresh_monthly_history.yahoo_chart` valide identité, type, devise, granularité et fuseau. Le collecteur mensuel utilise des bougies quotidiennes, puis ne conserve que les dernières séances mensuelles : ces points ne suffisent pas pour le suivi quotidien. Les collecteurs ETF lancés chaque jour peuvent collecter des calendriers annuels : cadence du job ≠ fréquence des observations. |
| Change | `collect_annual_fx.py` connaît le document BCE quotidien mais n’en conserve que décembre par année ; `monthly-fx.json` et `calendar-fx.js` couvrent d’autres conventions. Nouvelle conservation quotidienne du même document officiel, sans modifier les anciens résultats. |
| Calculs | Les simulateurs et classements n’archivent pas les décisions ni leurs exécutions futures ; moteur comptable isolé, partagé entre CLI et prévisualisation. |
| Exports | Réutilisation du téléchargement PNG commun ; modèles Canvas codés reprenant les couleurs papier/vert/doré d’Épargnant Libre. Aucun appel externe pour texte ou image. |
| Publication | `commit-validated-data.sh`, registre des producteurs validés, supervision existante et publication avec code validé. Chemins de données propres à ce nouvel outil. |

Les résultats de collecte conservent séparément `attemptedAt`, `retrievedAt`, dates de séances, SHA-256 et calendrier avec fermetures UTC. Le bilan affiche son arrêté réel, indépendant de la date de génération.

## Sources quotidiennes validées en réseau

L’état courant et exhaustif est généré dans [qualification.md](../data/ai-portfolios/qualification.md), [qualification.csv](../data/ai-portfolios/qualification.csv) et [qualification.json](../data/ai-portfolios/qualification.json), puis publié avec l’application. Le rapport remplace la petite liste initiale et ses constats ponctuels du 21 octobre. Les résultats peuvent changer à chaque vraie collecte ; un ancien succès ne garantit pas qu’une nouvelle clôture soit disponible.

Chaque cotation est contrôlée individuellement : preuve d’identité, place, type, devise, fuseau, granularité quotidienne, calendrier et complétude des séances, revenus ajustés et changes historiques nécessaires. Les dates d’observation et de collecte sont distinctes. L’admission exige au moins 20 clôtures achevées et aucune séance attendue manquante depuis l’ancrage réel. Une source en panne conserve ses anciennes observations sans présenter le bilan comme actuel.

Yahoo fournit les clôtures quotidiennes ; les deux serveurs officiels et les cotations alternatives documentées sont essayés sans substitution d’instrument. La BCE fournit les changes de référence quotidiens, distincts des changes de clôture. Les limites et les tentatives sont visibles pour chaque candidat. Une collecte globale périmée (36 heures selon le registre commun des workflows) bloque les nouvelles décisions ; une cotation non actualisée doit également être rattrapée avant utilisation.

## Comptabilité et dates

- Rendement total ajusté, unités synthétiques fractionnaires, **jamais présentées comme des actions négociables**. À la première séance d’ancrage : 100 unités monétaires de cotation par unité synthétique. Ensuite : `prix synthétique(t) = 100 × adjusted(t) / adjusted(ancrage)`.
- Le ratio à ancrage fixe annule les réajustements multiplicatifs historiques courants de Yahoo après dividende ou division. Pas de revenu ni de quantité d’actions ajoutés séparément. Les cours bruts sont conservés comme preuve, sans servir à simuler l’achat d’une véritable action.
- Chaque exécution archive la quantité synthétique, le prix synthétique en devise de cotation, le prix converti, les vrais cours bruts, les changes et dates utilisés, frais et mouvements. Unités et exécutions passées restent figées lors d’une correction source. Les nouvelles valorisations de ces unités sont comparées aux anciennes et leurs effets archivés.
- Liquidités dans la devise commune, non rémunérées, aucune marge, aucun apport après lancement. Frais configurables en points de base du montant de chaque achat et vente, déduits des liquidités ; une cible est calculée sur la valeur après frais par résolution de l’équation de financement.
- Résultat d’une ligne : valeur restante − achats cumulés + ventes cumulées. Contribution : ce résultat / capital initial, en points ; les lignes entièrement cédées restent comptées. Somme des résultats de lignes − frais = gain total. Ce n’est pas le rendement d’un lot ni un rendement annualisé.
- Aucun rééquilibrage automatique. La limite de poids s’applique aux achats ; une dérive par le marché est signalée et peut être conservée. Un portefeuille totalement liquide est autorisé ; sinon minimum et maximum de lignes s’appliquent.
- Enregistrement CLI horodaté par le serveur, jamais par une date proposée par le navigateur. Pour les nouvelles compétitions, exécution à la première séance commune des **positions et actifs concernés par la décision** (politique versionnée `affected-markets-v2`). Les anciennes compétitions conservent leur politique commune à tout leur univers. La séance est, strictement après le jour UTC d’enregistrement et au plus tôt à la date de lancement. Les allocations initiales et le World partagent la date fixée au lancement. Leur date antérieure était provisoire ; le passage à la date définitive est audité.
- Une décision mensuelle signifie un enregistrement par mois UTC, conservation comprise. La date originale de décision reste archivée et n’autorise pas un cours passé. Le modèle déclaré doit être renseigné avant lancement.
- Les calendriers `exchange-calendars==4.13.2` sont adaptés à toutes les places documentées prises en charge, avec leurs jours fériés, clôtures anticipées, fuseaux et bornes de certification explicites. Les cryptos utilisent des journées UTC continues. Au moins deux heures après la fermeture sont nécessaires pour retenir une nouvelle bougie.
- Le suivi publie par prudence l’arrêté de la veille UTC. Les bilans hebdomadaires comparent vendredi à vendredi, disponibles le samedi après fermeture de tous les marchés. Première semaine partielle comparée au capital initial. Le mois est comparé à la fin du mois précédent ou au capital initial si le lancement est plus récent.
- Un marché fermé conserve sa dernière vraie clôture. Le change est le taux de référence BCE de l’arrêté ou du dernier jour TARGET attendu, même si le marché de l’actif est fermé. Aucune séance ni variation n’est inventée. Une clôture de séance attendue ou un change attendu absent bloque la valorisation ; une opération attend la date initialement prévue, sans basculer sur un cours ultérieur plus favorable.
- La référence reçoit le même capital à la même clôture initiale, dans le même modèle synthétique et avec la même convention de frais.

## Enregistrement durable

Fichiers de référence :

- `data/ai-portfolios/book.json` : compétitions, configurations, règles versionnées, décisions, exécutions et audit.
- `data/ai-portfolios/market.json` : observations quotidiennes, changes, calendriers, provenances et corrections de sources.
- `data/ai-portfolios/state.json` : arrêtés quotidiens et hebdomadaires, historique des révisions de valorisation.
- `public/data/ai-portfolios/snapshot.json` : projection complète chargée à la demande dans l’interface, également exportable pour sauvegarde.

Le navigateur n’est pas un serveur GitHub. **Préparer une demande n’enregistre rien dans le dépôt.** Aucun jeton n’est demandé ou conservé dans le frontend. Les brouillons restent dans la mémoire de l’écran ; télécharger la demande avant de quitter. Les modifications éditoriales n’affectent jamais les fichiers financiers.

1. Créer la configuration en Gestion, préparer et télécharger la demande JSON.
2. Dans une copie à jour du dépôt, avec Node 24, importer :

   ```sh
   node scripts/ai-portfolios.mjs import /chemin/demande-portefeuilles-ia.json
   ```

3. Examiner les modifications de `data/ai-portfolios/` et `public/data/ai-portfolios/`, les committer et les pousser sur la branche publiée (ou fusionner la PR correspondante). Recharger le dépôt dans l’interface et vérifier sa révision.
4. Enregistrer de la même façon une décision initiale pour chaque participant, puis la demande de lancement. Aucune allocation n’est fournie par défaut. Les instructions à copier préparent les échanges que l’utilisateur mène lui-même.

L’import exige la révision exacte du dossier et un identifiant unique. Une demande périmée ou rejouée est refusée sans modifier les fichiers. Le CLI ne prend jamais une quantité, un statut exécuté ou une date d’enregistrement fournis par le navigateur pour argent comptant. Un dossier sauvegardé peut être restauré en rétablissant ses fichiers JSON dans une branche Git et en revoyant le diff : il ne remplace pas silencieusement le livre via le navigateur.

Après lancement : capital, devise, date, identité des participants, référence et politique d’exécution figés. L’univers peut être étendu avec un motif, sans retirer de cotation référencée dans l’historique. Minimum, maximum, poids, fréquence, frais et familles autorisées peuvent évoluer avec un motif ; chaque décision conserve les règles lors de son enregistrement. Une décision non exécutée peut être annulée avec motif. Une exécution se corrige par un mouvement compensateur futur justifié, jamais par effacement. La configuration pré-lancement se modifie après annulation des décisions préparées si nécessaire.

Les réponses originales facultatives sont **publiques** si importées dans ce dépôt public ; l’interface le précise. Elles peuvent être omises.

## Automatisation et reprise

`update-ai-portfolios.yml`, 05:20 et 09:20 UTC chaque jour, reprise manuelle possible :

1. Tests comptables et de parseurs.
2. Collecte exacte des instruments nécessaires et changes BCE ; une panne conserve les données précédentes de sa source et n’efface pas les autres succès.
3. Exécution unique des opérations enregistrées lorsque leur clôture déterminée est disponible.
4. Calcul des valorisations quotidiennes et bilans des vendredis achevés.
5. Build, commit isolé des chemins propres à l’outil, publication par le mécanisme existant de données validées.
6. Artefact d’observations, job d’échec distinct et supervision existante si une source nécessaire échoue.

Le calendrier est prolongé à chaque collecte ; le téléchargement complet depuis l’ancrage permet le rattrapage et la détection des corrections. Pas de collecte par participant, ni de requête pour chaque portefeuille. La reprise réutilise les identifiants et statuts des décisions et n’exécute pas deux fois une opération. Le modèle ajusté ne crédite aucun revenu distinct à doubler.

Installation locale pour une nouvelle collecte :

```sh
npm ci
python3 -m pip install -r scripts/ai-portfolios-requirements.txt
python3 scripts/collect_ai_portfolios.py
node scripts/ai-portfolios.mjs refresh
```

Aucun secret financier ni service additionnel nécessaire. Les permissions GitHub Actions `contents: write` et Pages sont nécessaires à la publication, déjà utilisées par les autres collecteurs. Les horaires GitHub sont indicatifs et une panne Yahoo/BCE ou un workflow bloqué peut retarder les résultats : l’interface conserve les raisons et dates réelles.

## Recette

- `npm run test:ai-portfolios` : allocation, dérive, conversion historique, achats/ventes/cibles, conservation, frais, référence, calendrier, semaine partielle, absence d’effet rétroactif, reprise, corrections et persistance avec aller-retour du CLI dans un dossier temporaire.
- Parseurs : dividendes et divisions via normalisation à ancrage, refus de données incohérentes, contrôle des jours fériés, trous quotidiens, change périmé et conservation des dernières données lors d’une panne.
- `npm run test:ai-portfolios:browser` : vraie navigation Chromium, état avant lancement, configuration, demande JSON réellement importée par CLI dans un dossier isolé, classement, conservation, retouche éditoriale sans effet financier, blocage des exports incomplets, PNG classement/focus/courbes et vues mobile 390 px / ordinateur 1440 px.
- Les données de démonstration des tests sont exclusivement injectées dans le navigateur et les répertoires temporaires. Le livre livré contient zéro compétition et zéro décision.
- Build, lint et contrôles des identités/cotations, contrats de supervision et producteur de publication exécutés. Les mises en page PNG sont inspectées visuellement ; leur taille est également vérifiée dans le navigateur.

## Univers exhaustif (extension du 22 octobre 2026)

La sélection de six cotations candidates a été supprimée. `scripts/ai-portfolio-universe.mjs` projette **toutes** les identités du registre commun, toutes les cotations documentées, les liens ISIN/symbole des actions, les actions internationales et les séries sans ISIN du catalogue commun. Les alias historiques liés à un ISIN sont dédupliqués. Les indices, SCPI, assurances-vie et séries non détenables restent inventoriés avec leur exclusion ; aucune part de fonds n’est créée pour un indice. Une identité sans cotation reste bloquée et ne disparaît pas de l’inventaire.

Le rapport généré de référence est [qualification.md](../data/ai-portfolios/qualification.md), accompagné de [toutes les lignes CSV](../data/ai-portfolios/qualification.csv) et du [registre JSON complet](../data/ai-portfolios/qualification.json). Ses compteurs sont calculés à partir des mêmes lignes et vérifiés par une assertion. `technicalCandidates` inclut les identités techniquement possibles mais bloquées ; `testedCandidates` ne compte que les cotations avec une tentative réseau. Le nombre d’instruments admis compte chaque ISIN une seule fois, quelle que soit la quantité de cotations alternatives. Les classifications de famille dérivées des noms servent à la recherche, pas à certifier une exposition géographique ou une stratégie absente des sources.

### Qualification et reprise

```bash
# Découverte de tout le registre, puis traitement de TOUS les candidats restants.
python scripts/qualify_ai_portfolios.py --mode remaining --workers 4 --batch-size 100
# Réessayer tous les échecs retentables ; aucun plafond de couverture.
python scripts/qualify_ai_portfolios.py --mode retry
# Requalification périodique : succès après 7 jours, échecs après 1 jour.
python scripts/qualify_ai_portfolios.py --mode due
# Recontrôle complet (ne pas employer pour l’actualisation quotidienne ordinaire).
python scripts/qualify_ai_portfolios.py --mode all
node scripts/ai-portfolios.mjs refresh
```

`batch-size` est la fréquence de sauvegarde, jamais une limite de candidats. Chaque passage parcourt la file entière avec une concurrence bornée (4 par défaut, 6 maximum), une temporisation par accès, un cache de réponses et des points de sauvegarde. Un arrêt conserve les lots achevés ; `remaining` reprend les candidats sans tentative, `retry` reprend les échecs. Les réponses positives et négatives expirent après une heure. `--recheck-cached` permet de contrôler les réponses déjà récupérées après une correction vérifiée du calendrier ; leurs dates de récupération restent inchangées. Une tentative issue d’une réponse en cache conserve son URL réelle ; ce cache reste local et n’est pas présenté comme une nouvelle observation de marché. Les corrections de séries conservées et leurs effets comptables restent auditées.

Pour chaque cotation, les symboles explicitement documentés et l’adaptateur du ticker exact vers sa place sont essayés. Les deux serveurs officiels Yahoo sont contrôlés en cas d’échec. Toutes les cotations alternatives du même ISIN sont évaluées indépendamment. Cela couvre notamment les cotations Amsterdam, Londres, Milan et Xetra de l’ISIN Nasdaq-100 IE00B53SZB19 ; l’ancien 404 Amsterdam ne condamne plus l’instrument entier. Les URLs et résultats des tentatives sont archivés. Un changement de symbole de fournisseur n’autorise jamais un autre ISIN, une autre part ou une autre place. Une cotation utilisée dans une compétition lancée conserve son identité et son symbole qualifié ; aucune substitution automatique de cotation.

Les libellés de places des preuves émetteur sont résolus exactement : NYSE Euronext Paris/Bruxelles et Nasdaq OMX Stockholm/Helsinki restent des places européennes. Toutes les cotations primaires documentées des actions sont inventoriées, même lorsqu’une cotation alternative figure déjà dans les historiques (par exemple Unilever Londres et Amsterdam). Le suffixe du symbole, la place et les métadonnées retournées sont contrôlés séparément.

La source quotidienne raccordée est Yahoo, clôtures ajustées pour les instruments cotés et clôtures brutes pour BTC/USD et ETH/USD au comptant. Les calendriers sont ceux d’`exchange-calendars`, avec contrôle du fuseau et de la place retournée. Les cours en pence sont normalisés explicitement en GBP avec facteur 0,01, conservé avec la devise source ; les unités synthétiques restent base 100 en GBP. Les changes utilisent toutes les devises quotidiennes effectivement disponibles dans le flux BCE, avec la dernière observation TARGET antérieure et une marge avant le début du calendrier pour les week-ends. Une devise ou un calendrier absent bloque l’admission. Le seuil demeure **20 clôtures achevées et aucune séance attendue manquante à partir de l’ancrage réel**. Un support récent ne reçoit aucun historique antérieur à sa première observation.

Les sources officielles existantes qui ne fournissent que des performances annuelles, des points mensuels, des moyennes ou des NAV sans ajustement de revenus compatible ne remplacent pas une clôture ajustée de cotation. Une NAV et un cours coté ne sont pas silencieusement interchangeables. Si les voies quotidiennes disponibles restent incomplètes, le résultat demeure un échec retentable avec son motif, même si une série mensuelle fonctionne dans un autre outil. Le rapport peut donc montrer de nombreux trous sur une date récente ; ils ne sont jamais remplis artificiellement pour augmenter la couverture.

### Catalogue, règles et rattrapage

Le catalogue global, l’univers autorisé d’une compétition, les lignes détenues et les actifs d’une décision sont distincts. L’interface propose une recherche nom/ticker/ISIN/place, un filtre de famille et d’état, 25 instruments par page et les cotations alternatives détaillées. La pagination ne réduit pas l’univers. Les dates de qualification, début de couverture et motifs restent visibles. Le sélecteur des décisions recherche parmi tout l’univers autorisé ; les 20 premiers résultats sont affichés avec les lignes déjà renseignées, sans plafonner les actifs trouvables.

Par défaut, les nouvelles compétitions autorisent les actions qualifiées cotées en **Europe, Asie et USA**, les ETF UCITS, les cryptos au comptant et les ETC/ETN/ETP qualifiés, sans levier ni vente à découvert, avec les mêmes contraintes de lignes et de poids. Les familles peuvent être désactivées avant lancement. `admissionPolicy: instrument-types-v2` distingue le statut UCITS des ETF et l'admission explicite des produits cotés : un ETC sur l'or ne devient pas un ETF UCITS. `stockRegions` concerne les places de cotation des actions, pas le domicile supposé de leur émetteur ; les anciens livres sans ces règles conservent leur comportement archivé. Les produits à levier/inverses restent interdits. Pour les obligations à échéance courte, le mot « short » ne constitue pas à lui seul un levier.

La qualification peut devenir ancienne pour les instruments non détenus. Avant d’enregistrer une décision, rattraper les cotations nécessaires :

```bash
python scripts/collect_ai_portfolios.py --assets ISIN-MIC,IDENTIFIANT-EXACT
# Ou toutes les lignes de la demande exportée :
python scripts/collect_ai_portfolios.py --request demande.json
node scripts/ai-portfolios.mjs refresh
# Puis importer la décision, vérifier et versionner le dossier comme précédemment.
node scripts/ai-portfolios.mjs import demande.json
```

Une source ancienne n’autorise pas une exécution sans rattrapage. Les métadonnées `qualified` ne remplacent jamais le contrôle du cours attendu à la date de valorisation. Les prompts utilisent les vrais identifiants autorisés et rappellent les règles. Au-delà de 30 instruments autorisés, ils demandent de joindre l’export structuré `univers-admissible.json`, qui contient les identités, cotations et états de couverture : il n’est pas nécessaire de coller tout le registre dans chaque échange.

### Exécution et automatisation

Les nouvelles compétitions enregistrent explicitement `executionPolicy: affected-markets-v2`. La clôture future est commune aux positions détenues et aux actifs concernés par la décision ; un marché simplement présent au catalogue ou autorisé dans la compétition ne peut pas retarder les mouvements. Les allocations initiales et la référence conservent une date commune, calculée uniquement sur les actifs initiaux nécessaires. Les compétitions sans cette version gardent la règle historique commune à leur univers ; leurs dates et règles archivées ne sont pas modifiées.

BTC et ETH ont des séances quotidiennes UTC sept jours sur sept, datées du jour observé et terminées à 00:00 UTC le lendemain, avec le même délai de consolidation de deux heures. Le bilan du vendredi inclut cette séance jusqu’au samedi 00:00 UTC ; il n’est complet qu’après disponibilité de toutes ses clôtures. La règle de dernière clôture connue s’applique uniquement aux marchés réellement fermés. Aucun calendrier artificiel n’est créé pour une séance boursière manquante.

Le workflow existant actualise quotidiennement les positions détenues, références et opérations enregistrées en attente, avec reprise à 09:20 UTC. Les instruments entièrement vendus conservent leurs séries historiques sans requête quotidienne inutile. Les compétitions anciennes gardent leur périmètre historique de collecte. La qualification périodique complète tourne le dimanche à 03:35 UTC ; la relance manuelle `qualify_all` recontrôle tous les candidats. Les nouvelles entrées sont découvertes automatiquement à chaque projection du registre et lors de la qualification. Les rapports complets sont versionnés et accessibles dans l’application, en CSV/JSON, et dans les artéfacts d’automatisation. Aucune décision d’IA, aucun appel à une IA et aucune publication X ne sont automatisés.

Après lancement, une extension de l’univers ou un changement de familles autorisées passe par une demande `configure` avec motif obligatoire et historique avant/après. Les cotations déjà référencées par la référence ou une décision archivée ne peuvent pas être retirées ni remplacées. Les anciennes décisions conservent leur copie des règles ; aucune règle nouvelle ne recalcule rétroactivement une opération. L’identité de la référence et la politique d’exécution restent figées.

Les calendriers pré-calculés de certaines places asiatiques s’arrêtent au 31 décembre 2026 dans la version installée. Leur historique 2026 est utilisable lorsqu’il passe tous les contrôles. `calendarValidity` conserve cette borne par marché : une valorisation au-delà est refusée, et une nouvelle opération ne peut pas être planifiée sur une séance non certifiée. Une mise à jour du calendrier sera nécessaire avant cette échéance. Les observations boursières hors séances certifiées sont également refusées.

Le type du produit et la taxonomie du fournisseur sont deux champs distincts. Les certificats ETC/ETN/ETP identifiés dans le registre restent des certificats ; Yahoo les classe souvent `EQUITY`. `instrumentType` conserve leur nature et `yahooInstrumentType` contrôle le type attendu dans la réponse (en priorité celui du raccordement commun documenté). Cette correspondance ne transforme pas un certificat en action et n’autorise pas un véritable ETF UCITS à passer un contrôle de type incohérent. L’admission par défaut UCITS exclut les certificats ; leur autorisation éventuelle reste un choix explicite des règles.

## Périmètre international des actions (22 octobre 2026)

Le périmètre n'est plus le seul registre initial. `discover_ai_equities.py` conserve les fichiers officiels Nasdaq Trader (Nasdaq et autres places américaines, dont NYSE/NYSE American), Euronext, ASX, JPX, HKEX, KRX/KOSDAQ, TWSE, Xetra, SIX et Nasdaq Nordic Main Market/First North. Chaque fichier porte sa provenance, empreinte et date réelle lorsqu'elle est publiée. La date de récupération ne devient pas une date de composition. Londres fournit à cette adresse un fichier **2020**, signalé historique ; ses nouvelles cotations ne sont pas admises sur cette seule preuve. Les sources TSX/TSXV bloquées par HTTP 403 et les compositions d'indices inaccessibles gardent un dénominateur inconnu. Le rapport ne prétend pas couvrir toutes les actions de ces marchés.

Les lignes ETF, certificats, droits, warrants, fonds et actions ne sont pas confondues. La SEC apporte les CIK par ticker/place ; les quatre derniers trimestres N-CEN publiés permettent de reconnaître les véhicules d'investissement enregistrés par leur CIK. Une absence dans N-CEN ne prouve pas un statut d'entreprise opérationnelle ; la SEC signale elle-même l'absence actuelle du schéma 3.1. Les ISIN ne sont jamais calculés depuis un CUSIP ni inventés. Des cotations sans ISIN sont possibles sur la preuve du code officiel de titre et de sa place. Les classes distinctes ne sont pas fusionnées parce que leurs libellés sont identiques.

Pour l'Australie, le répertoire ASX courant est rapproché du registre officiel d'attribution des ISIN du 2 octobre 2026 par code et nom légal. Ce second fichier distingue actions ordinaires, CDI, parts et titres agrafés. Une attribution d'ISIN seule ne prouve pas une cotation : les lignes sans correspondance au répertoire courant gardent un blocage explicite, sans devise ni place inventées. L'enrichissement d'un ISIN conserve les identifiants de cotation et les unités des séries existantes ; sa preuve est auditée.

`identity-map.json` sépare les identités de classe, d'émetteur et de cotation. Le CIK identifie un émetteur, pas une classe. Les codes de titre officiels maintiennent les identifiants internes lors des mises à jour ; une identité d'émetteur insuffisante ou un changement de nom ambigu nécessite une revue explicite. Les corrections de collision de classes dans ce chantier sont archivées dans `identity-corrections.json`, avec preuve que les cotations n'étaient référencées dans aucune compétition. Les identifiants de cotation et leurs séries sont conservés. Une cotation secondaire dont le lien avec les classes primaires sans ISIN reste indéterminé peut avoir des prix qualifiés sans être sélectionnable : le catalogue affiche cette limite, pour ne pas permettre une double sélection de la même action sous deux identités supposées distinctes.

La qualification vérifie les observations jusqu'à **l'arrêté commun de la veille UTC**, avec le délai de consolidation existant après fermeture ; elle n'exige pas en plus un cours d'aujourd'hui pour un arrêté d'hier. Les observations futures à cet arrêté ne permettent aucune admission anticipée. La fermeture KRX du **17 juillet 2026** est corrigée séparément de la bibliothèque de calendriers, avec preuves officielles et empreinte du calendrier de la Banque de Corée ; aucun point n'est fabriqué. Les corrections ne changent aucun calendrier des autres outils. Les nouveaux marchés First North conservent leur segment MIC et leur place opératrice.

Les barres en cours et postérieures à l'arrêté sont écartées avant le contrôle des doublons : deux observations variables de la séance ASX du jour ne rendent pas invalide un arrêté de la veille. Deux prix contradictoires pour une séance conservée restent refusés. Un cours nul sur la dernière séance peut être un retard du fournisseur ; une réponse ultérieure complète est revalidée avec la même identité et le même ancrage, sans interpolation.

Les 1 071 échecs initiaux sont ventilés par cause dans `equity-coverage.json`. Les anomalies de classement du fournisseur sont examinées séparément dans `provider-type-reviews.json` : il faut le même ISIN dans un document émetteur récupéré, un nom de produit suffisamment précis et la même cotation/devise. Une correspondance de ticker vers une entreprise différente reste refusée. Cette revue ne qualifie pas automatiquement les cours et ne transforme pas un ETC en ETF.

### Change TWD et suivi

L'API publique de la banque centrale de Taïwan (`FTDOpenData_Day`) fournit les clôtures quotidiennes interbancaires en **TWD par USD**. La conversion est `TWD/EUR = CBC TWD/USD × BCE USD/EUR`. Les deux fixings ont des horaires différents ; leurs dates sont conservées dans `derivedFixingOrigins` et dans les exécutions. Ce n'est pas un fixing simultané ni un taux négociable. Un jour de fermeture conserve le dernier fixing officiel admissible ; un fixing manquant sur une séance attendue n'est pas reporté artificiellement. Les observations BCE et CBC, leurs empreintes et dates restent accessibles. Le suivi quotidien ne sollicite CBC que pour les actifs TWD nécessaires ; les fixings historiques déjà qualifiés restent disponibles. Les corrections de taux sont auditées et les valorisations reprojetées.

Les séries sont réparties dans `data/ai-portfolios/series/` et publiées dans le même sous-répertoire public. Le catalogue ne charge pas tous les historiques au démarrage. Une sélection ou décision charge les blocs nécessaires ; le CLI hydrate les mêmes séries avant l'import et l'exécution. La qualification et le rattrapage réseau demeurent obligatoires avant une utilisation devenue ancienne. Aucun navigateur ne sauvegarde directement une décision sur GitHub.

### Commandes et reprise exhaustive

```bash
python scripts/collect_ai_security_classifications.py
python scripts/discover_ai_equities.py --refresh
python scripts/qualify_ai_portfolios.py --mode remaining --workers 4 --batch-size 100
python scripts/qualify_ai_portfolios.py --mode retry
python scripts/report_ai_equities.py
node scripts/ai-portfolios.mjs refresh
```

Les fichiers `qualification-checkpoints/` rendent les résultats déjà achevés récupérables sans répéter les appels. Ils sont absorbés dans le registre canonique après une sauvegarde complète. `--time-budget 1800` arrête proprement la soumission de nouveaux travaux, puis sauvegarde ; cela ne limite jamais le périmètre et les candidats restants restent « non traités ». `--ids` ou `--ids-file liste.json` (tableau JSON d'identifiants) servent à une reprise diagnostique explicite ; leur valeur par défaut ne limite aucun candidat. Le cache de réponses est daté. Une relance garde les ancrages et ne crée aucune opération.

L'automatisation distingue la découverte hebdomadaire, la qualification/reprise à 00:10 UTC avec sauvegarde, et l'actualisation quotidienne des positions/références/opérations à 05:20 et 09:20 UTC. Aucun nouvel instrument n'est publié dans les autres outils. Les nouvelles entrées des fichiers officiels sont découvertes automatiquement, sans liste d'actions populaire ni plafond de capitalisation.

Les exports `equity-catalogue.{csv,json}` couvrent le périmètre, `selectable-equities.{csv,json}` donnent les actions sélectionnables et `equity-coverage.{md,json}` ventilent les comptes par marché/source. Les comptes CIK vérifiés, groupements de libellés non résolus, classes et cotations sont distincts. Une liste de principaux poids n'est jamais appelée composition complète. Le contrôle Nasdaq-100 couvre 101 titres ; FTSE 100 dispose d'un export complet de 100 constituants daté de juin 2026. Les limites restantes des autres indices sont explicites.

Le périmètre principal est présenté simplement par **Europe, Asie, USA**. Les autres marchés déjà inventoriés restent auditables, sans étendre les actions autorisées par défaut. Les exports `selectable-assets.{csv,json}` réunissent les actions du périmètre, les ETF UCITS et les cryptos/produits cotés qualifiés. Les matières premières suivent le produit exact (ETC/ETP), sa devise et sa convention de rendement ; une cotation de produit financier ne devient pas un cours physique. Les indices de matières premières restent des références, jamais des positions fabriquées.
