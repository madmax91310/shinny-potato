# Analyse d’entreprise

Route `/analyse-entreprise`, 20 entreprises : Apple, Microsoft, Nvidia, Alphabet, Amazon, LVMH, Air Liquide, Schneider Electric, TotalEnergies, Visa, Costco, AMD, Meta, Mastercard, Adobe, Salesforce, ServiceNow, Intuit, Coca-Cola et PepsiCo.

## Collecte quotidienne sans configuration

`update-company-analysis.yml` collecte chaque jour à 06:35 UTC (08:35 en France en été, 07:35 en hiver), remplace les blocs valides, vérifie le texte et le build, enregistre les données puis appelle le déploiement Pages. Les PR exécutent également une collecte réelle dans un espace temporaire, sans écrire dans la branche ni déployer la production.

Les comptes SEC `companyfacts` sont utilisés lorsqu’ils sont accessibles. Un refus SEC (notamment HTTP 403 depuis GitHub) déclenche le secours par les publications officielles : PDF Apple Newsroom, tableaux Microsoft Investor Relations, NVIDIA Newsroom, PDF Alphabet sur son CDN officiel et tableaux Amazon Investor Relations. Les emplacements des rapports sont calculés à partir des calendriers fiscaux, avec des variantes connues de publication. Aucun contournement d’accès, connexion, clé ou imitation de navigateur.

Le parseur accepte les tableaux consolidés GAAP ou IFRS, avec unité, dates et ordre des colonnes contrôlés. Il distingue les trois mois des cumuls de six/neuf mois. Les colonnes récentes et comparatives sont inversées chez certains émetteurs : elles sont identifiées par leurs années. Les tableaux sectoriels, résumés et rapprochements non-GAAP ne deviennent pas des comptes. Une structure inconnue échoue ; elle ne remplace pas une observation validée. Les dates de début SEC sont conservées pour la même période ; une publication qui indique seulement la date de fin est présentée comme « clos le », sans inventer le début.

## Données et calculs

- CA, résultat net, BPA dilué, variations annuelles et marge opérationnelle : dernier exercice et dernière période publiée. LVMH, Air Liquide et Schneider publient des semestres, explicitement nommés. Le résultat net IFRS est la part du groupe. Costco utilise des périodes de 12 ou 16 semaines (17 semaines certaines années), sans les appeler trois mois. Son CA inclut les cotisations des membres.
- FCF annuel : flux d’exploitation moins achats d’immobilisations. NVIDIA inclut aussi les achats d’actifs incorporels. Amazon utilise les achats bruts, sans déduire les ventes et incitations : cela diffère du FCF ajusté annoncé par Amazon. Les paiements de locations ne sont pas retranchés.
- PER sur 12 mois : dernière clôture / somme de **quatre BPA trimestriels publiés**. Aucun BPA trimestriel n’est obtenu par soustraction d’un BPA annuel et d’un BPA cumulé. L’arrondi à deux décimales dans les publications peut expliquer de légers écarts avec un fournisseur. Les quatre documents sont liés dans l’application. Une division d’actions intervenue pendant les quatre trimestres bloque ce calcul tant que la base par action n’est pas recertifiée.
- P/FCF du dernier exercice : clôture × actions en circulation publiées / FCF annuel positif. Capitalisation indicative, avec date du nombre d’actions explicite. Alphabet et Visa sont exclus du calcul avec un seul cours, en raison de ses différentes classes d’actions.
- Dette nette : dette financière publiée, hors contrats de location, moins cash et équivalents. Les placements ne sont pas déduits. Si une composante de dette n’est pas séparée dans la publication, aucune dette n’est inventée à partir du seul montant à long terme. La trésorerie peut néanmoins être collectée seule.
- Dividendes annuels déclarés, lorsqu’ils figurent dans les comptes SEC : montant par action / clôture ; distribution = dividende par action / BPA dilué positif du même exercice. Ce rendement historique ne promet pas le prochain dividende. Ces champs ne sont pas recertifiés par le seul accès à un communiqué.
- PER prévisionnel et PEG sans clé : collecte des tableaux publics Finviz, avec contrôle du symbole, des définitions et de la cohérence des ratios affichés. Les champs « EPS next Y » existent deux fois : le parseur accepte seulement le BPA estimé, identifié par sa définition, et ne le confond pas avec sa croissance. Le PER prévisionnel = dernière clôture Yahoo / BPA estimé du prochain exercice fiscal selon Finviz. Le PEG = ce PER / croissance annuelle du BPA estimée sur cinq ans, exprimée en points de pourcentage (10 % donne un diviseur de 10). Les ratios Finviz originaux et leur prix sont conservés pour audit, mais ne sont pas repris comme des ratios à la clôture : leur prix peut être intrajournalier. Définitions : https://finviz.com/help/screener. L’année exacte du prochain exercice et la base comptable des estimations ne sont pas précisées par le fournisseur ; aucune année ni base GAAP/non-GAAP n’est inventée. Le PEG est omis si la croissance estimée est absente ou non positive ; les deux ratios sont omis si le BPA estimé est absent ou non positif.
- Historique : cinq exercices annuels consolidés GAAP (trois au minimum), CA, résultat net et marge nette recalculée. SEC : périodes annuelles de 330–400 jours, CA et résultat net exactement alignés, comparatifs retraités des derniers dépôts prioritaires. Secours : communiqués annuels officiels, avec comparatifs des documents récents prioritaires. Chaque ligne a sa date de fin réelle et son lien source ; une perte reste négative. Aucun trimestre ou cumul intermédiaire ne devient un exercice. Le dernier exercice doit correspondre aux comptes actuels et les exercices être consécutifs. Le tableau affiche le détail ; le texte compare les premiers et derniers exercices sans transformer la variation totale en croissance annuelle.
- Alpha Vantage reste facultatif pour une configuration existante. Sans configuration, toutes les nouvelles collectes fonctionnent. Les estimations Finviz récentes ont priorité dans la publication.

EV/EBITDA n’est pas calculé faute de définition uniforme documentée de l’EBITDA et de la valeur d’entreprise dans les sources initiales.

## Fraîcheur, texte et erreurs

Chaque bloc conserve son document, sa période et sa date d’observation. Une erreur ne rafraîchit pas artificiellement la date d’un bloc conservé. Les comptes annuels expirent après 550 jours ou 45 jours sans vérification. Les BPA sur 12 mois, bilans et actions en circulation doivent correspondre au dernier résultat et être vérifiés depuis moins de 45 jours ; les bilans et le dernier trimestre expirent après 200 jours. Les cours de plus de dix jours et les estimations relevées il y a plus de sept jours sont omis. Une nouvelle publication de résultats ou une division d’actions postérieure au relevé bloque les estimations conservées. L’historique SEC est vérifié chaque jour avec les comptes ; le secours par les publications annuelles est revérifié après trente jours ou dès qu’un nouvel exercice apparaît. Il est omis après quarante-cinq jours sans vérification, ou s’il ne correspond plus aux comptes actuels.

Le cours provient de Yahoo chart, intervalle quotidien sur deux ans avec événements de division d’actions. La séance du jour local est toujours exclue. Les ratios calculés sont recalculés à l’affichage depuis les chiffres bruts et la clôture retenue, sans résultat figé.

Les phrases suivent les chiffres bruts : hausse/baisse, perte réduite/accrue, retour au bénéfice ou à l’équilibre. Aucun taux de croissance ordinaire n’est calculé depuis une base négative. Un ratio ne déclenche pas une conclusion automatique « bon marché », « sous-évaluée » ou une prévision de hausse. Activité et points à surveiller restent éditoriaux.

Les données sont dans `src/data/company-analysis.json`, les profils dans `company-profiles.json`, et leur provenance est accessible dans la bibliothèque de données. L’image adapte l’espacement au nombre de métriques disponibles.

## Vérification

Tests Python sur les comptes SEC et les extraits des publications officielles des cinq entreprises ; ordre des colonnes, années, BPA, FCF, nombres négatifs, absence de dette courante, rejet des tableaux incomplets/non-GAAP. Tests JavaScript de changement de cours, pertes, divisions d’actions, fraîcheur, P/FCF et texte. Tests navigateur : cinq entreprises, copie, image, PNG, mobile et recherche. La collecte réelle GitHub doit être verte avant fusion.

## Extension européenne et autres secteurs

Les six nouveaux émetteurs utilisent leurs publications consolidées officielles (LVMH Financial Documents, Air Liquide Financial Reports, Schneider Financial Statements, TotalEnergies Accounts, Visa Earnings Release et Costco Investor Relations). Les comparatifs des publications les plus récentes remplacent les versions antérieures dans l’historique. Trois à cinq exercices consécutifs sont exigés. Les archives sont relues au moins tous les 30 jours, en conservant la date réelle de vérification entre les collectes.

LVMH, Air Liquide et Schneider utilisent les cours Euronext en euros ; aucun PER prévisionnel ou PEG n’est affiché sans source d’estimations vérifiée pour ces cotations. LVMH et Schneider peuvent afficher un PER de l’exercice publié, clairement daté, lorsque le BPA dilué est disponible. Ce ratio est distinct du PER sur douze mois. Air Liquide ne publie qu’un BPA de base dans le tableau annuel utilisé : aucun BPA dilué annuel n’est inventé. Les opérations sur titres postérieures à l’exercice bloquent ce PER annuel.

TotalEnergies utilise l’action ordinaire NYSE en dollars et les comptes en dollars, sans conversion monétaire. Ses quatre BPA trimestriels IFRS permettent un PER sur douze mois. Les estimations publiques sont collectées pour TotalEnergies, Visa et Costco. Le BPA de Visa est celui de la classe A, correspondant au titre V, et non celui des autres classes. Les images utilisent les mêmes données et dates que les textes ; leurs illustrations sont des actifs statiques, leurs chiffres sont générés par le code.

Air Liquide dispose d’une découverte complémentaire via ses archives officielles d’information réglementée et de documents. Si les pages de résultats sont indisponibles, les PDF officiels précédemment vérifiés sont téléchargés et analysés à nouveau. Les chiffres ne sont jamais recertifiés par simple lecture du cache, et les dates de vérification des anciens historiques restent inchangées.

Lorsque le site d’Air Liquide refuse l’accès depuis GitHub Actions, les communiqués de l’émetteur distribués par Euronext sont découverts dans la liste publique de l’entreprise, puis leurs pièces jointes sont analysées avec les mêmes contrôles IFRS. Les périodes « H1 » sont des semestres. Le communiqué semestriel ne présentant qu’un BPA de base, aucun BPA dilué n’est déduit de ce chiffre.


## Publications conversationnelles

Les onze entreprises disposent d’une accroche et d’une question liées à leur activité. Le texte raconte le modèle économique, intègre les résultats annuels dans des phrases, explique la rentabilité et termine par une question métier. Il n’applique aucun jugement automatique « cher » ou « bon marché » à un PER. Le tableau historique, les derniers résultats et les estimations détaillées restent dans l’outil ; ils ne sont plus empilés dans la publication.

Le PER de la publication utilise uniquement le calcul reproductible depuis les comptes et le cours daté. Le PER du dernier exercice IFRS reste explicitement distinct du PER sur douze mois. Les prévisions Finviz restent dans les métriques et les sources ; le PEG est nommé comme le PER prévisionnel divisé par la croissance estimée sur cinq ans. Les ratios Alpha Vantage dont la méthode prévisionnelle est inconnue ne sont pas repris dans les métriques.

Le contexte Apple est documenté dans `annualContext` du profil : services, matériel, iPhone et charge fiscale exceptionnelle de 2024. Les parts, croissances et comparaison ajustée sont recalculées. Le contexte correspond exactement à l’exercice et aux valeurs de comparaison du PDF officiel ; toute nouvelle période ou révision des valeurs le retire. Une future revue peut fournir un nouveau contexte sourcé ; la collecte de comptes ne recertifie pas automatiquement ces éléments éditoriaux. Sans contexte valide, le moteur revient aux résultats bruts sans inventer de cause. Les accroches et questions ne contiennent aucun chiffre figé.

## Horloge des tests après collecte

Les scénarios synthétiques conservent une date fixe. Les contrôles du catalogue réel évaluent chaque entreprise à sa date d’observation des comptes, afin qu’une collecte ultérieure au 7 octobre 2026 ne soit pas rejetée comme future par le test. Les protections applicatives contre les observations futures et périmées restent vérifiées séparément et inchangées.

## Extension AMD

AMD est collecté par le même workflow quotidien, sans clé. Son archive officielle `financial-information/financial-results` est relue à chaque collecte pour découvrir les nouveaux communiqués et les dernières publications annuelles. Le parseur ne retient que le tableau consolidé GAAP de résultats, identifié par son titre et son unité. Il distingue les trois colonnes trimestrielles (récent, trimestre précédent, comparaison annuelle) des colonnes cumulées ; les cumuls de six ou neuf mois ne deviennent jamais des exercices annuels. Les lignes de BPA dilué sont séparées des lignes de nombres d’actions. Les quatre BPA trimestriels sont directement publiés, sans soustraction d’exercices et cumuls. Trois à cinq exercices consécutifs proviennent des publications et de leurs comparatifs récents ; les comptes SEC restent prioritaires lorsque leur période et les valeurs correspondent. La dernière clôture et les estimations sont récupérées par les mêmes sources que les autres actions américaines. Aucun chiffre de résultat, cours ou ratio n’est saisi manuellement.

## Cash et indicateurs de décision

La section « Cash, solidité et valorisation » calcule depuis les observations brutes :
FCF annuel, variation annuelle en montant et en pourcentage lorsque la base le permet,
marge de FCF, rendement du FCF rapporté à la capitalisation indicative, conversion
FCF/bénéfice net positif, dette nette, couverture des intérêts, variation du nombre
moyen d’actions **diluées**, et dividendes effectivement payés rapportés au FCF positif.
Le nombre moyen d’actions diluées inclut les instruments dilutifs et ne représente
ni le nombre d’actions en circulation à une date précise, ni les seuls rachats.
Deux moyennes doivent provenir du même dépôt/document comparatif ; Alphabet, Meta
et Visa restent exclus du calcul automatique de variation des actions et du rendement
FCF avec un seul cours, compte tenu des classes d’actions.

`scripts/company_decision.py` collecte les composantes SEC standardisées avec
identité, devise, périodes annuelles exactes, CA et résultat net réconciliés avec les
comptes déjà validés. Les concepts de taxonomie alternatifs sont sélectionnés par
priorité, jamais amalgamés lorsque leurs périmètres diffèrent. Les communiqués
consolidés officiels servent de secours, avec contrôle du titre du tableau, de
l’unité et de toutes les années comparatives. Les lignes de flux intermédiaires,
les indicateurs avant variation du BFR, les investissements financiers et les
réconciliations non-GAAP ne deviennent pas des flux annuels standardisés.

Les archives de FCF contiennent les composantes, la définition et le lien réel de
chaque document. Les actifs incorporels sont inclus lorsqu’ils figurent dans les
achats consolidés retenus ; les ventes d’actifs, acquisitions d’entreprises et
paiements de locations ne sont pas ajoutés/déduits. Pour LVMH, le tableau retenu
publie des investissements opérationnels nets : seul le flux d’exploitation est
collecté ; aucun FCF standardisé n’est obtenu en assimilant ces investissements
nets à des achats bruts. Les charges d’intérêts ne sont pas remplacées par les
charges financières nettes. Les dividendes des minoritaires sont séparés lorsque
le tableau le permet. Les dividendes exceptionnels restent inclus.

Le workflow quotidien conserve le bloc `decision` et les observations de dette
nette. Les archives complètes sont revérifiées après 30 jours, dès un changement
de période publiée ou une révision des revenus/résultats. Un cache conserve sa
date d’observation originale ; il ne redevient jamais une collecte fraîche. Les
composantes expirent après 45 jours sans vérification et ne servent plus si les
comptes actuels ne correspondent pas. Un échec de renouvellement d’un bloc déjà
qualifié est signalé dans le rapport du workflow et conserve les valeurs précédentes.
Les composantes non publiées ou non qualifiées restent absentes. L’évolution de
la dette nette est calculée seulement entre deux bilans effectivement observés,
à définition identique ; les photographies se constituent à chaque publication.

L’image conserve les trois chiffres de résultats et le PER, et affiche le FCF
annuel en cinquième donnée lorsqu’il est disponible. Le détail des indicateurs et
l’historique du cash restent dans l’application ; le squelette du texte de la
publication est conservé. Les phrases de lecture sont factuelles : aucun jugement
automatique « acheter », « bon marché » ou « sous-évaluée ».

Vérifications : tests Python des composantes SEC et des extraits officiels de six
émetteurs, tests JS (FCF négatif, bénéfice nul, variation de cours, divisions
d’actions, fraîcheur, dilution comparable et dette), et tests Chromium de tous
les choix d’entreprises, des cartes, tableaux, export PNG, copie et mobile.

Couverture vérifiée le 12 octobre 2026 : 20 blocs de composantes annuelles, dont
19 FCF et marges/conversions/variations annuelles de FCF ; 7 rendements de FCF,
6 dettes nettes, 4 couvertures d’intérêts, 12 variations comparables d’actions
diluées et 14 ratios dividendes/FCF. LVMH affiche seulement le flux d’exploitation.
AMD dispose de deux exercices de cash vérifiés : les investissements des activités
abandonnées sont ajoutés aux investissements des activités poursuivies pour
rester dans le périmètre du flux d’exploitation consolidé. Le FCF issu du seul
concept SEC d’achats de PPE est retiré pour AMD, car son périmètre était incomplet.
Ces comptages décrivent cette collecte ; l’affichage reste conditionné à la
fraîcheur et aux composantes disponibles lors des publications suivantes.
