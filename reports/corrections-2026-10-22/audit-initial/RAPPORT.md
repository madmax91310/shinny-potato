# Audit de l’automatisation des données — 22 octobre 2026

## Conclusion et portée

**L’application est largement alimentée automatiquement, mais son autonomie financière complète n’est pas démontrée.** Des contrôles de qualité diffèrent entre outils ; des collectes échouent partiellement ; le suivi de fraîcheur produit aussi des faux blocages. Les défauts prioritaires concernent la qualification commune des performances, pas l’ajout de texte dans les publications.

Cet audit livre **un inventaire réconcilié et une vérification réelle partielle**. Il ne se présente pas comme une recertification exhaustive de toutes les sources et de toutes les cotations. Les éléments non rejoués ou non recertifiés restent nommés dans les CSV. Aucun changement fonctionnel, commit applicatif, push, fusion, déploiement, déclenchement de workflow ou notification externe n’a été effectué.

Instantané initial : `aa735e8898ce2e75576fda00919126058cb97b31`, `master` récupéré au démarrage dans une worktree isolée. Instantané final des matrices : **`9a4ffd2fb7c3bb643c265718117b066f57d69530`**, mise à jour de données publiée indépendamment pendant l’audit. Les inventaires et recoupements ont été régénérés sur ce dernier instantané. Les 90 alertes portent sur les mêmes couples part × année avant et après cette publication. Les collectes locales n’utilisent pas `--apply` ; les générateurs de build ont produit des fichiers de contrôle dans cette worktree. Leurs modifications applicatives sont retirées à la clôture. Les rapports et scripts d’audit sont les seuls livrables conservés.

### Résultats principaux

| Priorité | Résultat démontré | Conséquence |
|---|---|---|
| P0 | Quatre historiques contiennent au moins trois mois consécutifs au même prix. L’exclusion des classements n’est pas appliquée de manière commune au calculateur et à Performance depuis. | Des périodes non qualifiées restent calculables dans d’autres outils. |
| P0 | Aerospace, part **IE000U9ODG19** : rendement des clôtures mensuelles de **0 % en 2025**, contre **54,55 %** dans le calendrier NAV officiel de la même part et devise. | Contradiction financière à résoudre avant de réutiliser cet historique. La cotation Paris EUR qualifiée ailleurs ne répare pas automatiquement la série USD utilisée ici. |
| P0, investigation | **90 écarts supérieurs à 2 points**, sur **53 parts**, parmi **1 602 couples part × année**, après conversion des devises aux deux bornes. | À expliquer par cotation, calendrier, change, ajustements, revenu ou défaut de série. Le seuil d’alerte ne prouve pas que les 90 résultats soient faux. |
| P1 | Le YAML du workflow IA produit une seule commande : `node scripts/test-ai-equity-coverage.mjs node scripts/audit-ai-runtime.mjs`. | Le second audit n’est pas exécuté par cette étape CI. Il a été exécuté séparément et réussi pendant cet audit. |
| P1 | Échecs réels : salaires INSEE, Bourse Direct et certaines conditions IBKR, document pédagogique or Amundi, une voie VanEck. | Les dernières observations peuvent rester utilisées ; une exécution partiellement verte ne certifie pas leur renouvellement. |
| P1 | Radar publié avec **26 réserves sur 22 entités**, dont **11 divergences de photographie DWS** et **13 observations plus anciennes ignorées**. | Les signaux sont partiels. Une photographie du 20 octobre ne concorde pas avec un contrôle indépendant du 21 octobre. |
| P1/P2 | 13F : le run du jour confirme **27 portefeuilles inchangés et 1 modifié**, sans échec de collecte ; **21 profils** dépassent pourtant le délai de contrôle dans le contrat de l’inventaire. | Dernier succès de consultation, collecte des positions et période du trimestre sont insuffisamment séparés. |
| P2 | Le suivi générique attribue des obligations inutiles à trois Vanguard utilisés uniquement en composition, et des données de marché à Impact des frais. | Une partie des rapports « données manquantes » est un défaut de qualification des usages. Il ne faut pas remplir ces champs artificiellement. |

Les quatre séries avec répétitions sont : Invesco Physical Gold ETC **IE00B579F325**, VanEck S&P Global Mining **IE00BDFBTQ78**, iShares Global Aerospace & Defence **IE000U9ODG19**, WisdomTree Copper **GB00B15KXQ89**. Les répétitions historiques ne prouvent pas que toutes leurs autres périodes soient fausses : la qualification doit porter sur la fenêtre réellement utilisée.

SOXX est un cas distinct : le registre conserve des cours hors dividendes et aucune preuve ISIN dans cette série. Performance depuis possède une convention « prix » explicite ; la simulation d’un capital doit être rapprochée de cette convention. Ne pas prétendre qu’une série de prix représente un rendement total.

Preuves : `preuves/historiques-repetes.json`, `preuves/exclusions-moteurs.json`, `preuves/recoupement-nav-cours-change.json`, `preuves/workflow-ai-commande.json`, `preuves/radar-publie.json`, `preuves/13f-github.log`.

## 1. Inventaire et dénominateurs

Ces populations se recouvrent ; **elles ne doivent pas être additionnées comme des actifs uniques**.

| Population | Nombre | Sens |
|---|---:|---|
| Outils du registre | 26 | Dont Dilemme masqué ; outils de revue et de recherche compris. |
| Lignes de matrice | 214 711 | Champs, obligations, admissions et contrôles, avec niveau de preuve. |
| Couples outil × identifiant distincts | 69 994 | Distincts du nombre d’actifs uniques ; zéro cellule de clé identique dupliquée. |
| Fiches du catalogue commun | 1 527 | Instruments, historiques, indices, produits, références et rédaction. |
| Instruments identifiés par ISIN dans ce catalogue | 650 | Incluent actions et supports ; une série historique constitue une autre fiche du même instrument. |
| Obligations externes ajoutées à l’audit | 49 | 28 profils investisseurs, paramètres réglementaires et séries de change ; absents de `assets` dans l’inventaire natif. |
| Champs du catalogue | 4 499 | Distincts des obligations de couverture et de leurs utilisations par plusieurs outils. |
| Champs de certification du catalogue | 6 683 | Obligations de champs rapprochées par l’inventaire existant, avant qualification par outil. |
| Candidats de cotation IA | 63 771 | 62 013 identifiants d’instruments d’inventaire ; comprend les exclusions. |
| Catalogue actions IA détaillé | 62 888 lignes | Toutes retrouvées parmi les candidats IA, zéro ligne perdue. |
| Cotations IA qualifiées techniquement | 21 186 | 20 400 identifiants d’instruments ; aucune équivalence automatique avec un nombre d’entreprises mondiales. |
| Instruments IA qualifiés sans blocage de sélection | 20 200 | Compte du qualificateur ; différent de la configuration produit par défaut. |
| Instruments IA dans la configuration par défaut | 18 468 | Une cotation retenue par identifiant d’instrument, référence comprise. |
| Export de cotations IA sélectionnables | 19 240 | 18 468 instruments ; zéro identifiant absent des candidats. |
| ISIN distincts dans tous les inventaires réunis | 37 245 | Inclut les candidats exclus/bloqués ; ce n’est pas le nombre de supports actuellement utilisables. |
| Workflows présents dans le dépôt | 42 | Collectes, supervision, publication et validations. |
| Workflows recensés par GitHub | 64 | Inclut des workflows historiques retirés du dépôt ; ne pas les compter comme collectes actives. |
| Workflows reconnus par le suivi de l’application | 23 | Inclut répétition et onboarding ; ne signifie pas 23 fournisseurs. |
| Modules de collecte, orchestration ou transport | 115 | Définition explicite dans `collecteurs.csv`, distincte du nombre de sources ou de produits. |
| Fichiers de registre/configuration/observation inventoriés | 1 353 | Inclut données publiques, archives, fichiers IA et projections. |
| Entrées de configuration source extraites | 1 816 | Hors observations et certificats IA ; une configuration n’est pas une collecte réussie. |

Familles du catalogue : **650 instruments, 703 séries, 56 indices, 7 assurances-vie dont une archivée, 8 SCPI, 11 acteurs/offres, 8 courtiers, 29 statistiques de ménages, 44 entrées de lexique et 11 références**. Les catégories financières comprennent actions, ETF actions/obligataires/monétaires/multi-actifs, produits immobiliers cotés, ETC/matières premières, ETN/ETP crypto, crypto au comptant et indices non détenables. Les produits non cotés n’ont pas de clôture boursière quotidienne obligatoire.

Le comparateur d’indices interne n’a pas de route publique. Les redirections assurance-vie/SCPI et `/tweet-midi` sont des compatibilités, pas des outils financiers supplémentaires. Analyse d’entreprise n’a pas été réintroduite.

### Sélecteurs et sous-usages effectivement inventoriés

| Outil ou famille | Entrées de code observées | Évaluation |
|---|---:|---|
| Présentation d’ETF | 258 fiches | Adaptateurs communs ; ne pas confondre avec les 261 supports du rapport générique. |
| Coulisses des indices | 55 fiches | Indice exact et variantes ; 56 indices documentés au catalogue ne donnent pas 56 fiches publiables. |
| Performance depuis | 737 entrées avant qualification des années | Mensuel et calendriers annuels officiels séparés ; admissions réelles dans `raccordements.csv`. |
| Il y a X ans | 667 entrées admissibles au registre dédié | Niveau de prix/indice ; aucune synthèse mensuelle d’un calendrier annuel. |
| Et si tu avais investi | 696 entrées | Dates et devise bornées par actif ; problèmes de qualification des séries signalés ci-dessus. |
| Qui a vraiment gagné | 693 entrées mensuelles ; 285 entrées annuelles ; 144 catégories | Recouvrements et alias possibles entre banques ; les deux formats sont audités séparément dans les 8 820 décisions de raccordement. |
| Portefeuille & DCA | 651 références ; 100 profils | Profils éditoriaux séparés des observations ; pays, secteurs et recouvrement ont des capacités distinctes. |
| Générateur | 624 entrées ; 7 profils | Manuel et automatique distincts ; les rôles/limites/PEA restent requis. |
| Duels | 623 entrées | Catalogue technique plus large que les cœurs et les constructions proposées. |
| Présentations | 6 AV actives + 1 archive ; 8 SCPI ; 11 acteurs | Conditions et rendements annuels, pas cours quotidiens ni projets individuels. |
| Présentation investisseur | 28 profils | Photographies 13F indépendantes du catalogue commun. |
| Comparatif courtiers | 8 | Barèmes automatisés et recoupements manuels distincts. |
| France en 100 ménages | 29 indicateurs | Enquêtes et périodes propres à chaque publication. |
| Faits marquants | 62 fiches | Archives, rédaction et histoires dérivées ; chiffres de chaque texte non tous recertifiés auprès des sources. |
| Banque de tweets | 90 textes | Textes figés, brouillons et verrou de revue ; aucune promesse de régénération de tous les chiffres. |
| Comparatif ETF | Groupes/partenaires dérivés des registres | Aucun compte d’actifs ajouté à partir des seuls imports. |
| Pouvoir d’achat | 5 séries observées et repères économiques | Collecte réelle des 5 séries réussie ; dates/indices de prix distincts des hypothèses. |
| Fiches pratiques | Documents officiels + règles + supports | 10 documents collectés, 1 source or en échec pendant la sonde. |
| Fiche lexique | 44 entrées | Rédaction + paramètres officiels lorsqu’ils sont utilisés. |
| Simulateur de patrimoine | Règles réglementaires et hypothèses | Hypothèses de rendement non assimilées à des cours manquants. |
| Impact des frais | Hypothèses saisies | Aucun actif coté obligatoire ; obligations natives génériques non pertinentes. |
| Dilemme | Format masqué, éditorial | Collecte financière non applicable aux hypothèses. |
| Radar | Flux comparatif indépendant | Branche `radar-data`, pas uniquement les fichiers Pages. |
| Données à revoir / Bibliothèque | Rapports et registres | La présence ou le statut dans un rapport ne prouve pas le fonctionnement d’un outil. |
| Portefeuilles IA | Univers autonome ci-dessus | Quotidien pour positions et référence ; rattrapage à la demande pour autres actifs. |

## 2. Ce qui fonctionne et ce qui reste partiel

### Preuves positives obtenues

- **885 tests Python réussis**, après installation des dépendances et de la langue/configuration OCR manquantes dans cet environnement. Les deux premiers essais échouaient sur l’environnement, pas sur une panne de données de production. Les journaux restent conservés.
- **22 contrôles Node ciblés réussis**, puis les deux contrôles de devise réellement présents dans le dépôt ; audit des identités, cotations, historiques, conventions, ETF, portefeuilles, compositions, annualisation et IA. Une ancienne commande de sonde nommant un fichier inexistant est explicitement signalée ; elle n’est pas comptée comme contrôle réussi.
- **Build réussi**, y compris contrôle des 4 253 certificats de champs publiables et des budgets de routes. Cela prouve la cohérence des projections avec leurs registres, pas leur exactitude indépendante auprès du fournisseur.
- **26 routes publiques ouvertes dans Chromium**, sans erreur JavaScript ni requête échouée observée pendant ce parcours. Ce contrôle vérifie l’ouverture des écrans, pas toutes les sélections possibles.
- **39 vrais téléchargements PNG** : sélections, calculs, textes et rendus contrôlés sur les raccordements historiques, classements, portefeuilles et variantes ciblés. Les années complètes, le classement annuel et ses exports sont inclus ; cela ne signifie pas que les PNG de tous les actifs ont été testés.
- **52 dossiers d’exécution ciblés**, dont une exécution Radar locale et 51 dossiers impliquant des accès réseau ; 34 modules ont une sonde directe tracée. Les résultats comprennent succès, champs non publiés et échecs partiels : ils ne sont pas tous des succès.
- Réseau réel : métadonnées et caractéristiques de plusieurs familles d’émetteurs, indices MSCI/FTSE/Nikkei/STOXX/S&P/Nasdaq/TOPIX, LifeStrategy, change BCE annuel/quotidien, prix mensuels, INSEE, produits AV/SCPI/acteurs et flux 13F. Périmètres et identifiants précis : `executions-reelles.csv`.
- Deux collectes de positions complètes ont réussi sur **IE00B4L5Y983** et **IE00BFMXYX26**, sans appliquer les observations à l’application.

### Ce qui reste manuel ou figé

Les identités, règles d’admission, rôles de portefeuille, allocations illustratives, profils DCA et rédaction comportent légitimement une configuration manuelle. Ils ne sont pas des cours manquants.

En revanche, les chiffres vivants inclus dans des textes archivés, certains recoupements de conditions de courtage et certaines caractéristiques/offres non publiées ne sont pas intégralement actualisés automatiquement. Les 90 textes et 62 fiches sont individualisés dans la matrice. Leur rédaction n’a pas été recertifiée phrase par phrase auprès de toutes les sources externes.

Le JSON natif recense **126 obligations appelant une action** : 30 compositions d’indices économiques exacts à raccorder, 26 connecteurs/compléments, 19 états manuels, 19 non qualifiés, 18 champs non publiés, 5 contrôles hors délai, 4 erreurs de collecte, 3 séries manquantes et 2 conflits de source. **Ce nombre n’est pas un nombre d’actifs en panne.** Il inclut des obligations génériques inutiles à certains outils ; elles sont requalifiées comme telles dans la matrice.

### Ce que les mécanismes de secours font réellement

Les collecteurs isolent généralement les sources et conservent la dernière valeur validée. Les fichiers de statut et étapes `report-failures` permettent de signaler une panne même lorsque les autres observations sont publiées. `continue-on-error` n’est donc pas en soi une erreur ignorée : il faut suivre la suite du workflow et le diagnostic par champ.

Les transports communs utilisent des délais et reprises bornés ; le transport Yahoo peut changer d’hôte du même fournisseur, ce qui n’est pas une source financière indépendante. Les voies d’émetteurs sont centralisées dans `issuer-access-routes.json`. La disponibilité d’une autre URL ne suffit pas à autoriser un changement de part, devise ou convention.

Un succès sans nouvelle valeur peut être normal : 27 portefeuilles 13F inchangés en sont une preuve réelle. Il doit néanmoins laisser un dernier succès de consultation distinct du trimestre et de la date de collecte des poids.

Il n’a pas été démontré qu’un fichier financier précis soit définitivement généré sans jamais être utilisé. **41 sorties programmées n’ont pas de consommateur dans le graphe statique** : plusieurs sont des entrées de projection ou des shards chargés dynamiquement. Elles sont conservées dans `registres.csv`, avec limite de vérification, sans les déclarer mortes à tort.

## 3. Couvertures par donnée et fraîcheur

Les **37 245 ISIN distincts** ont également été soumis au contrôle de format et de clé Luhn : aucun échec. Ce contrôle arithmétique ne certifie pas l’identité économique ou la bonne cotation.

### Lecture correcte des chiffres natifs

Sur **4 253 lignes de couverture**, l’état enregistré est : 4 021 « current », 19 « unqualified », 84 « missing », 20 « manual », 69 « not-applicable », 13 « waiting-first-year », 18 « not-published », 1 conflit de source, 5 « check-overdue », 3 archives. **« Current » signifie présence et contrôle récent selon le contrat du rapport ; pas récupération réseau indépendante vérifiée pour chacune de ces lignes.**

| Champ | Contrôles natifs courants / lignes du champ | Limite |
|---|---:|---|
| Performance annuelle des supports | 238 / 261 | 13 attendent leur première année complète ; plusieurs calendriers non publiés et alternatives mensuelles distinctes. |
| Historique mensuel | 688 / 691 | Trois manquants concernent les Vanguard composition-only ; ne pas les traiter automatiquement comme obligation de leur outil d’exposition. |
| Pays | 229 / 261 | Hors périmètre actions, source partielle et registre d’exposition alternatif à distinguer. |
| Secteurs | 229 / 261 | Une classification obligataire ou un métal n’est pas un secteur d’entreprise manquant. |
| Positions intégrales | 176 / 261 | Ni couverture de tous les recouvrements, ni preuve de composition exacte de l’indice. |
| Rendements d’indices | 56 / 56 | État de registre ; ne prouve pas l’identité de toutes les variantes par simple nom. |
| Composition d’indices présente | 52 / 52 | Dénominateur limité aux enregistrements qui portent ce bloc ; n’inclut pas les indices sans bloc. |
| Statut PEA avec preuve | 256 / 258 | Deux cas non qualifiés ; inconnu n’est pas false. Conflit Euro Dividend reproduit en réseau. |

Les 14 familles de champs ETF sont détaillées avec leurs propres dénominateurs dans `couverture-par-type.csv` : frais, encours, performance, mensuels, pays, secteurs, top positions, positions complètes, distribution, domicile, réplication, cotations, PEA et couverture de change. Identité et conventions sont conservées par fiche et par série dans la matrice et les inventaires.

Un contrôle complémentaire du lancement des parts a examiné **115 historiques avec une date de création exploitable**, sans début avant le mois de lancement. **143 historiques de supports restent non vérifiés par ce contrôle particulier**, faute de date de création exploitable dans les caractéristiques observées. Les 438 autres séries, dont actions/indices, ne relèvent pas de ce contrôle de lancement de part ETF/ETC. Voir `preuves/lancement-historiques.json` ; cela ne prouve pas toute la provenance pré-lancement de chaque instrument.

### Cadences adaptées

| Donnée / usage | Cadence pertinente | Qualification attendue |
|---|---|---|
| Positions IA détenues et benchmark | Quotidienne après séances achevées ; marchés ouverts 24/7 séparés | Séance, fuseau, clôture et change attendus, avec délai de disponibilité. |
| Actifs IA non détenus | À la demande avant décision ; découverte/requalification programmée distincte | La capacité de récupération ne signifie pas téléchargement quotidien. |
| Séries mensuelles et performances annuelles dérivées | Après clôture mensuelle, plusieurs passages de reprise ; annuel après année complète | Pas de décembre courant inventé, pas d’année incomplète classée comme complète. |
| Compositions/expositions | Selon publication de l’émetteur | DWS peut publier quotidiennement ; d’autres sources mensuellement. Contrôler `asOf`, pas seulement `checkedAt`. |
| TER, caractéristiques, domicile, réplication, PEA | Surveillance périodique et changements de documentation | Certaines caractéristiques changent par prospectus ; pas de récupération quotidienne imposée à tout champ. |
| 13F | Recherche périodique des nouvelles déclarations et amendements | Trimestre, délai réglementaire et périmètre déclarable ; pas portefeuille temps réel. |
| SCPI et fonds euros | Bulletins trimestriels / rendements annuels et changements de conditions | Attente de publication distinguée d’une panne. Remake : échéance observée 14 novembre 2026. |
| INSEE | Selon publication mensuelle, annuelle ou enquête | Une enquête ancienne peut être la dernière publication valide ; ne pas la qualifier de cours périmé. |
| Frais contractuels / courtage | Surveillance des documents et dates d’effet | Les hypothèses des simulateurs restent des hypothèses. |

Sur les **6 683 champs de certification du catalogue**, le rapport natif classe 4 713 « connected », 491 « scheduled-evidence », 193 « qualification-needed », 276 « blocked », 665 références, 220 archives/rédaction/hypothèses exclues, 125 non requis. Les 4 713 champs reliés restent une preuve de registres et de contrat : ce n’est pas un décompte de récupérations réseau recertifiées par cet audit. Les 49 profils externes et le catalogue IA ont leurs propres dénominateurs.

## 4. Portefeuilles IA

Le catalogue IA est **extérieur au catalogue commun**. Son omission du précédent suivi général crée un angle mort de mesure, même si la page IA expose son propre suivi.

La relecture locale `audit-ai-runtime.mjs` a hydraté les séries retenues et contrôlé les **21 186 cotations qualifiées** : provenance, identité de cotation, devise/unité, ancrage synthétique, points positifs, cohérence de la base, séances et change. Résultat : aucune exception ni demande de rattrapage à l’arrêté enregistré du **21 octobre 2026**. **35 preuves legacy n’ont pas d’evidenceId** ; le contrôle utilise leurs autres preuves et cela reste un chantier de qualification.

Une récupération réelle complète a été forcée sur **six cotations**, action, ETF actions, ETF obligataire, ETC, Bitcoin et action taïwanaise, sans réutilisation de série ni modification de production. Les six récupérations ont réussi, avec clôtures jusqu’au 21 octobre ; la BCE quotidienne et la source CBC taïwanaise ont également été récupérées. Les **21 180 autres cotations qualifiées ne sont pas recertifiées individuellement en réseau pendant cet audit**. Elles ont le niveau « séries retenues contrôlées localement », pas « collecte du jour vérifiée indépendamment ».

Les règles actuelles recherchent les actifs détenus, la référence et les décisions en attente ; les autres actifs peuvent être rattrapés à la demande. La collecte incrémentale contrôle le recouvrement ; une révision d’ajustement déclenche une récupération depuis l’ancrage. Les dividendes et splits sont intégrés via la base ajustée synthétique, sans crédit séparé du même dividende. **Il ne s’agit pas d’un relevé de titres réels** : les unités synthétiques et les liquidités non rémunérées sont explicites.

Le livre de production est **vide : zéro compétition, zéro position et zéro transaction**. Il n’existe donc aucune preuve de valorisation quotidienne d’un portefeuille effectivement lancé à observer. Les tests comptables et de décisions vérifient des scénarios ; ils ne doivent pas être annoncés comme un historique réel de gestion.

Le code prépare des états comprenant positions, liquidités, transactions, frais, performances, règles, dates et décisions, notamment les briefings hebdomadaires. Les décisions sont saisies/importées manuellement et l’interface indique « Aucune connexion aux IA ». L’export d’un état à transmettre à une IA n’est pas une décision automatiquement prise par l’IA.

Le contrôle CI manquant est **P1-01**. La séparation entre capacités techniques, instruments admis, périmètre de sélection et cotation choisie est **P2-04**.

## 5. Identité financière, conversions et compositions

Les contrôles et sondes ciblés ont vérifié les garde-fous suivants dans les familles exécutées : part/cotation et devise, cours ajusté ou prix, NAV annuelle officielle, indice et variante nette/brute, séances closes, calendrier commun, taux de change aux deux bornes et années civiles complètes. Les calendriers annuels ne sont pas transformés en points mensuels.

Les **1 602 recoupements** utilisent la fonction de change existante et la qualification des années complètes. **175 périodes supplémentaires** restent non comparables faute de bornes mensuelles ou de change exact ; aucune donnée n’a été synthétisée pour les ajouter. Pour les 90 alertes, une divergence de marché entre prix et NAV peut être réelle ; seules les causes démontrées autorisent une correction. L’anomalie Aerospace est prioritaire.

La source de rendements Russell peut être une fiche intitulée « Equal Weight » : le collecteur sélectionne explicitement la **ligne comparative Russell 2000**, et un test protège contre une substitution par Russell 3000. La simple présence de « Equal Weight » dans l’URL/le titre ne suffit donc pas à conclure à une confusion d’indice. Cette voie a été rejouée en réseau.

Pour les compositions, l’outil distingue pays/secteurs, positions détaillées et recouvrement. Le recouvrement complet exige les positions identifiées, la complétude et des photographies compatibles ; il agrège les entreprises communes au moyen des identités documentées. Les tests de périmètre et de composition partielle ont réussi. Un top10, un panier de substitution ou une poche actions de fonds multi-actifs ne devient pas une exposition complète renormalisée.

Les trois parts **IE00BFMXYX26, IE00BK5BQZ41, IE00BKX55R35** disposent déjà de pays/secteurs dans `vanguard-equity-underliers.json` et de raccordements DCA. Les diagnostics génériques qui les cherchent seulement dans `AUTOMATED_ETF` manquent ce chemin. Leur absence de fiche ETF complète ne justifie pas d’exiger des frais, PEA et mensuels inutilisés par cette capacité.

## 6. Publication et consommation réellement observées

Au **dernier relevé**, une publication indépendante de cet audit est arrivée en ligne :

- Code publié : **aa735e8898ce2e75576fda00919126058cb97b31**.
- Données publiées : **9a4ffd2fb7c3bb643c265718117b066f57d69530**.
- Voie : `validated-data`, construction **2026-10-22T18:07:29.433Z**.
- Le workflow de publication observé a réussi : `39823145985`. Il avait démarré avant le début de cet audit. Aucun déploiement n’a été déclenché par cette mission.

Le manifeste final contient **877 fichiers**, dont **867** empreintes correspondent directement aux blobs du commit de données ; **10 projections ont été régénérées au build**. Cet écart n’est pas, à lui seul, une corruption ou une perte de mise à jour. Six réponses réellement téléchargées concordent avec leur empreinte finale : synthèse d’automatisation, couverture des champs, couverture commune des marchés, revue investisseurs, état d’accueil IA et audit de séries IA.

Les endpoints IA `overview.json` et `runtime-audit.json` répondent désormais **200**, avec le code `aa735e8` et les 21 186 séries qualifiées à l’arrêté du 21 octobre. Ils répondaient 404 lors du premier relevé, sur le code plus ancien `793b818…` : ces 404 ne sont donc pas retenus comme panne actuelle.

Les preuves initiales sont également conservées : code `793b818e37250a6c1ae1844223dacdf73d15ff97`, données `eaf201784424a8988db8a6b4a84bbba1ba871acb`, build à 17:28:32 UTC ; 616 fichiers au manifeste et quatre réponses contrôlées. Les 26 ouvertures de routes et 39 PNG de la première phase portent leurs propres dates. Une ouverture supplémentaire de la page IA a vérifié son fonctionnement après la publication finale.

La mise à jour a changé les points de **53 séries du fichier ETF et 357 séries du fichier mensuel général**. Les inventaires, admissions et 1 602 recoupements ont été recalculés après récupération de ce commit ; les nombres de sélecteurs et les 90 alertes restent identiques. Les contrôles mensuels, de cohérence des performances, de change et de classements ont été réexécutés. Les 885 tests de fixtures et le build complet avaient été exécutés sur l’instantané initial ; ils ne sont pas présentés comme une nouvelle exécution intégrale sur le commit final.

Preuves : `verification-publication-fin.json`, `build-info-public-fin.json`, `comparaison-historiques-publication-finale.json`, journaux `*-validation-finale.log` dans `preuves/`.

Le Radar est un autre chemin : le client lit la branche **`radar-data/feed.json`** directement, indépendamment du snapshot Pages. Le flux effectivement téléchargé porte `sourceRevision=aa735e8…`, 7 229 observations et les 26 réserves. Une nouvelle version de ce flux peut être visible sans nouveau build de la SPA.

Les derniers statuts GitHub, succès précédents, déclenchements réels et crons sont fournis pour tous les workflows accessibles. Une annulation de CI ou une publication en attente n’est pas automatiquement une panne de collecte. Pour quatre workflows rouges, la récupération `--log-failed` n’a pas fourni de contenu exploitable ; leur cause précise n’est pas déduite de leur couleur. Le téléchargement de l’artefact Radar a reçu un refus HTTP 403 ; le flux public et les journaux du job ont fourni des preuves alternatives autorisées.

## 7. Limites et reliquat explicite

- **115 modules inventoriés, 34 sondés directement, 81 sans sonde réseau directe individualisée.** Certains des 81 sont des auxiliaires réellement utilisés par les orchestrateurs rejoués, mais cela ne certifie pas toutes leurs branches. `chaines.csv` nomme chaque module, dépendances, workflow, stockage, preuve et reliquat.
- Les **21 180 cotations IA non rejouées individuellement en réseau** restent vérifiées dans les séries retenues et certificats. Une nouvelle collecte intégrale de dizaines de milliers de cotations n’a pas été imposée au fournisseur ; les requêtes sont mutualisées et bornées. La politique quotidienne des non-détenus n’exige d’ailleurs pas cette collecte.
- Les **143 historiques de supports sans date de création exploitable** et **175 périodes non comparables** sont listés. Ils ne sont ni supprimés ni réputés valides par défaut.
- Les **90 textes et 62 fiches** sont inventoriés ; toutes leurs affirmations financières externes ne sont pas recertifiées phrase par phrase.
- Les parcours navigateur sont ouverts pour les 26 routes, mais toutes leurs combinaisons de sélection, variantes, dates, profils et exports ne sont pas rejouées. Les 39 PNG vérifiés ont leur liste propre.
- Les **1 353 fichiers** sont inventoriés ; une empreinte ou un schéma ne constitue pas une revue de chaque valeur financière historique. Les fichiers dont seule la présence a été vérifiée portent ce niveau de preuve.
- Les conditions d’accès et de réutilisation sont reprises lorsqu’elles sont déjà documentées : notamment or Banque mondiale, Nasdaq/FRED et crédits photographiques. L’accès public des autres sources ne constitue pas une licence de redistribution recertifiée par cet audit.

**Il reste donc un reliquat de vérification. Le rapport ne certifie pas « toutes les données automatisées et fiables ».** Il permet de traiter les défauts démontrés, d’éliminer les obligations inutiles et de poursuivre les recertifications sur des inventaires complets, sans inventer de couverture.

## 8. Livrables et utilisation

| Fichier | Usage |
|---|---|
| `matrice.csv` | Matrice outil × identifiant × donnée, colonnes demandées et métadonnées supplémentaires. Les lignes d’obligations déclarées sont distinctes des admissions réellement calculées et des anomalies. |
| `actifs.csv` / `reconciliation.csv` | Tous les profils du catalogue, obligations externes et candidats IA ; vérification des catalogues d’actions et des exports de sélection, sans disparition d’identifiant. |
| `outils.csv` | Les 26 outils, leur périmètre et les exclusions de collecte justifiées. |
| `chaines.csv` / `collecteurs.csv` | Les 115 modules, accès, dépendances, déclenchements, stockage, reprises, contrôles, preuves et non-vérifiés. |
| `configurations-sources.csv` | Les 1 816 déclarations de source extraites, sans les considérer comme observations. |
| `workflows.csv` | Tous les workflows du dépôt avec crons, dernière exécution, dernier succès global et liens de preuve. |
| `registres.csv` | Les 1 353 fichiers, empreintes, producteurs et consommateurs connus ; limites des imports dynamiques explicites. |
| `couverture-champs.csv` / `couverture-par-type.csv` | Détail des états de champs et dénominateurs du rapport natif ; pas un taux global d’autonomie. |
| `raccordements.csv` | 8 820 décisions sur 735 identités financières pour 12 capacités : sélecteur, moteur, routes, blocage. Statuts d’ancienne mission non utilisés pour annoncer de nouveaux ajouts. |
| `executions-reelles.csv` | Les 52 dossiers d’exécution et leurs résultats partiels/échecs, pas seulement un statut vert. |
| `anomalies-performances.csv` | Les 90 écarts à investiguer sur 53 parts. |
| `performances-non-comparables.csv` | Les 175 périodes qui n’ont pas été artificiellement complétées. |
| `PLAN-CORRECTIONS.md` / `plan-corrections.csv` | 19 actions P0–P3 : outils, actifs, fichiers, solution et contrôle de réussite. |
| `bilan.json` | Comptes et dénominateurs exploitables par script. |
| `preuves/` | Snapshots, journaux, réponses collectées et résultats des contrôles. |

La colonne « dernière réussite » reste vide si aucune réussite au niveau du champ n’est démontrable. « contrôle source » conserve séparément la date de contrôle ; un succès global du workflow n’est pas recopié comme succès individuel. Une source ou une observation inconnue reste vide, jamais inventée.

Les CSV sont en UTF-8 avec BOM et séparateur point-virgule. `matrice.csv` est volumineux ; filtrer par outil, statut ou identifiant. Les nombres finaux de lignes et de couples distincts sont recalculés dans `bilan.json` à la validation des livrables. `restant-a-verifier.csv` individualise le reliquat et `workflows-historiques.csv` conserve les workflows GitHub absents du dépôt courant.
