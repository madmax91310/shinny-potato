# Application Épargnant Libre — audit et référence de travail pour Claude

Date de référence : 18 octobre 2026, heure de Paris. Destinataire : Claude, pour comprendre l’application, poursuivre les travaux et préserver les décisions produit.

Ce document décrit les 26 entrées du registre, leurs sous-outils et les moteurs conservés. Il distingue le fonctionnement constaté dans le code, les attentes de l’utilisateur et les limites à contrôler. Il complète `CLAUDE.md` et ne remplace ni le code actuel ni une nouvelle instruction de l’utilisateur.

## 1. Périmètre et niveau de preuve

### Base examinée

- Dépôt : https://github.com/madmax91310/shinny-potato ; branche par défaut `master`.
- Instantané lu : `b248801239679885200173e7db3570b5c622378d`.
- Application : https://madmax91310.github.io/shinny-potato/.
- Lecture des routes, registre, calendrier, pages, moteurs, registres de données et workflows ; lecture de l’audit structurel du 17 octobre et vérification des évolutions qui le rendent partiellement obsolète.
- Trois audits lancés sur cet instantané : `audit-asset-tool-routing.mjs`, `audit-broker-evidence.mjs`, `audit-calculator-series.mjs`. Les deux premiers terminent sans erreur ; le résultat final du troisième est consigné dans l’annexe de validation.
- Aucun changement fonctionnel, aucune fusion, aucun déploiement et aucun envoi à Claude réalisés dans le cadre de cette transmission.

### Ce que cet audit permet d’affirmer

Il décrit le contrat fonctionnel et les dépendances des outils. Les nombres issus d’un audit ont leur périmètre propre : 244 fiches ETF ne signifient pas 244 historiques mensuels, et un actif présent dans le catalogue n’est pas automatiquement publiable partout. Les données de marché n’ont pas toutes été recertifiées auprès des émetteurs pendant cette lecture. Les parcours et les images n’ont pas tous été rejoués dans un navigateur. La présence du code sur `master` ne prouve pas son déploiement effectif : contrôler `build-info.json` et le run Pages avant de dire « en ligne ».

### État concurrent à prendre en compte

Au relevé, deux PR ouvertes recoupent une grande partie des extensions :

| PR | Objet annoncé | Conséquence pour Claude |
|---|---|---|
| [#761](https://github.com/madmax91310/shinny-potato/pull/761) | Lots 4 à 7 : actifs manquants, comparatifs et classements dérivés, Générateur/duels/DCA, outils éditoriaux | Lire le diff et son statut avant d’ajouter des raccordements ou de restructurer ces registres. |
| [#762](https://github.com/madmax91310/shinny-potato/pull/762) | 110 actions internationales et 14 ETF iShares automatisés | Comparer les ISIN, cotations, séries et destinations pour éviter les doublons. |

Leur contenu n’est pas réputé fusionné. Les anciennes PR Scanner ne sont pas une autorisation de réintroduire cet outil. Les auteurs, branches et statuts évoluent : refaire le relevé au début du travail.

## 2. À quoi sert l’application

L’application est un atelier éditorial pour le compte X **Épargnant Libre**. Elle transforme des données financières sourcées en textes et visuels pédagogiques, réutilisables souvent. Elle sert aussi à comprendre un portefeuille d’abonné, comparer des constructions et repérer des changements de données utiles à un futur post.

La valeur attendue repose sur cinq points : données fiables et actualisées automatiquement, raccordement des mêmes actifs entre les outils, choix manuels simples, textes humains, images lisibles dans le fil X sur mobile. Ajouter des actifs ou des fonctionnalités n’a d’intérêt que si leur usage est réel et leur alimentation durable.

Ne pas transformer chaque outil en outil de performance : les fiches pratiques, expositions, présentations et statistiques ont leur propre rôle. Les formats doivent permettre de renouveler les sujets sans raconter toujours la même chose.

### Public et voix

Le compte s’adresse à des épargnants ordinaires. Expliquer avec des mots accessibles, sans supposer que le lecteur connaît TER, spread, réplication ou rééquilibrage. Le ton peut être personnel et utiliser « je » quand il exprime réellement le point de vue de l’auteur ; une fiche factuelle n’a pas à inventer une expérience personnelle.

Le pseudonyme public est Épargnant Libre. Ne jamais introduire dans les exports le nom civil, l’adresse personnelle ou des informations privées déduites d’autres conversations. Un profil DCA préparé est un scénario éditorial, pas un témoignage reçu.

## 3. Architecture et circulation des données

### Application

- SPA React 19, Vite 8, React Router 7, Tailwind 4 ; versions exactes dans `package-lock.json`.
- `src/tools.js` : registre des 26 entrées ; 25 visibles dans les groupes, Dilemme masqué.
- `src/App.jsx` : correspondance des routes avec les composants ; imports différés par outil et par format.
- `src/pages/Home.jsx` : accueil, outils, raccourcis et calendrier.
- `src/design-system/` : navigation, sélecteurs, espace texte/image, téléchargement, copie, messages et composants partagés.
- `src/pages/<outil>/` : données ou façades de données, fonctions pures, UI et rendus.
- `src/data/` : registres communs et observations collectées.
- `src/lib/` : conventions, change, préférences, simulations et utilitaires partagés.
- `scripts/` et `.github/workflows/` : collecte, qualification, projections, audits, tests et publication.
- `public/data/` et modules virtuels Vite : fichiers chargés à la demande, notamment dossiers entreprises et déclarations investisseurs.

Le découpage `data.js` / `lib.js` / `App.jsx` est une règle de maintenance ; certaines pages existantes s’en écartent. Ne pas ajouter de donnée financière en dur dans un composant pour contourner un registre.

### Registres à connaître

| Besoin | Point d’entrée à lire | Règle |
|---|---|---|
| Identité, nom et variantes d’un support | `src/data/instruments.js` | ISIN exact ; ne pas créer un deuxième produit pour un simple alias. |
| Frais du support | `src/data/etf-ter.js` | Part, taux, source et date ; frais d’enveloppe séparés. |
| Caractéristiques | `instrument-facts.js` | Benchmark exact, distribution, réplication, domicile ; chaque preuve garde sa date. |
| Éligibilité PEA | `instrument-pea.js` et accès communs | `null` = non documenté ; jamais converti en `false`. |
| Cotations | `instrument-listings.js` | Ticker, MIC, place et devise sourcés ; préférence commune de cotation. |
| Performance des fonds et indices | séries automatiques, `index-returns.js`, historiques dédiés | Fonds par ISIN et indices séparés. |
| Change | `monthly-fx.json`, `annual-fx.json`, accès `calendar-fx.js` | Devise, fréquence et dates compatibles. |
| Conventions de performance | `src/lib/performance-conventions.js` | Composer les libellés communs ; éviter des notes contradictoires par page. |
| Expositions et positions | `portfolio-exposure-data.js`, observations et projections DCA | Pays, secteurs, titres et allocation multi-actifs ne sont pas la même donnée. |
| Économie et réglementation | `economic-data.js`, `regulatory-data.js`, fichiers automatisés | Paramètres observés séparés des hypothèses. |
| PEL | `pel-rates.js` | Taux de génération d’ouverture, pas le taux courant du Livret A. |
| Catalogue de recherche | `catalog.js`, `catalog-browser.js` | Dérivé des registres, pas une deuxième base éditée à la main. |
| Raccordements | `docs/asset-tool-routing.json` et scripts associés | Un statut par actif et par destination, avec raison d’exclusion. |
| Calendrier | `editorial-calendar.js` | Source qui prime sur les anciennes mentions du README. |

### Chaîne attendue

1. La source produit une observation liée à l’identité exacte du produit.
2. Le collecteur vérifie les unités, dates, périmètres, valeurs et anomalies.
3. Les observations validées sont conservées ; une panne n’efface pas la dernière donnée valide.
4. Les adaptateurs et scripts dérivent les fichiers utilisés par les outils.
5. Chaque outil qualifie ses propres conditions d’usage : profondeur historique, devise, ventilation, fraîcheur, preuve.
6. Le texte et l’image utilisent le même résultat calculé.
7. Le commit validé est construit et déployé ; les incidents restent visibles.

Ne jamais éditer à la main une projection générée : corriger sa source, son collecteur ou son adaptateur, puis la régénérer. Les registres communs ne doivent pas importer les pages.

## 4. Règles impératives sur les données

### Identité et portée

- Distinguer indice, fonds, part de fonds, cotation, ETC, ETP et action. Un ETC or n’est pas un ETF actions ; une action minière n’est pas de l’or physique.
- Acc/Dist, EUR/USD, couvert/non couvert et variantes de benchmark ne sont pas interchangeables.
- Une cotation EUR ne supprime pas le risque de change des actifs sous-jacents.
- Un ETF synthétique expose au benchmark ; son panier de substitution ne décrit pas nécessairement son exposition économique.
- Le pays d’enregistrement n’est pas automatiquement le pays de risque. Le domicile irlandais d’un ETF ne signifie pas que son portefeuille est investi en Irlande.
- Ne pas fusionner ADR, actions locales et classes d’actions par le nom sans qualification dédiée.
- Un top 10 ne constitue pas un portefeuille complet. Une liste de fonds sous-jacents n’est pas une liste des entreprises détenues en transparence.

### Dates et fraîcheur

`asOf` date la photographie, `checkedAt` le contrôle de la source, une date de publication date le document, et une date de génération date le rendu. Ne jamais les remplacer les unes par les autres. Une collecte exécutée aujourd’hui peut très bien conserver un document de septembre. Un échec ne doit pas rajeunir la donnée conservée.

Les règles de fraîcheur sont propres aux champs et aux outils. Le moteur DCA applique notamment 93 jours d’âge maximal et 45 jours d’écart entre observations compatibles. Ce ne sont pas des seuils à copier partout sans justification. Une donnée « en retard » demande un contrôle ; cela ne prouve pas qu’elle soit fausse.

### Performances

- Pour les indices, utiliser une série de rendement avec dividendes réinvestis quand l’outil promet une performance totale ; préciser Net Return / Gross Return, devise et méthode dans les données et l’interface.
- Ne pas attribuer à un ETF la performance de son indice avant le lancement du fonds. Un proxy explicitement autorisé doit rester identifié comme tel dans tous les rendus concernés.
- Le rendement total sur plusieurs années se compose par multiplication. Le rendement annualisé est géométrique : `(valeur finale / valeur initiale)^(1 / durée) - 1` ; ce n’est pas la moyenne des années.
- Les cours ajustés et les calendriers NAV officiels répondent à des conventions distinctes. Les comparer selon la politique explicite de l’outil, jamais en masquant la différence de source ou de fréquence.
- Année civile complète : borne de décembre de l’année précédente à décembre de l’année concernée. Ne pas afficher 2026 comme une année complète avant sa clôture.
- Les périodes de comparaison doivent être communes à tous les participants. Une date manquante ne devient ni zéro ni une valeur recopiée.
- Convertir un rendement avec les taux de change des deux bornes ; ne pas convertir un pourcentage au seul cours actuel.
- Les pertes, divisions, regroupements, distributions et changements de part doivent être traités dans la série qualifiée, pas corrigés visuellement.
- DCA : ne pas présenter `(capital final - versements) / versements` comme un rendement annualisé. Les flux ont des dates différentes.

### Ventilations et chevauchement

Les poids d’exposition restent rapportés au portefeuille total. Si 70 % sont identifiés, ne pas étirer ces 70 % à 100 %. Séparer les catégories « autres », « non ventilé » et « hors classification ». Métaux et cryptos ne reçoivent pas artificiellement des pays et secteurs d’actions. Une poche obligataire peut avoir ses propres ventilations ; ne pas l’assimiler aux secteurs des actions sans méthode documentée.

Pour deux fonds, le recouvrement complet est la somme des plus petits poids des titres communs, identifiés précisément. Il exige deux compositions suffisamment complètes et compatibles. Les seuls titres communs observés ne suffisent pas à produire un pourcentage intégral. Pour le poids cumulé d’un titre dans un portefeuille, additionner ses contributions directes et indirectes une seule fois, sans sommer des recouvrements par paires.

### Automatisation et extension d’actifs

L’objectif utilisateur est une actualisation automatique de toutes les données exploitées : ISIN, cotations, frais, encours, performances, pays, secteurs et positions quand ces champs ont un sens. Une rédaction manuelle peut rester éditoriale ; un chiffre vivant ne doit pas être entretenu par une correction manuelle ponctuelle.

Pour chaque ajout : identité → source et collecte → validation → preuve et fraîcheur → registre → qualification par outil → sélecteur et exports → surveillance. Un actif peut être accepté dans les expositions sans historique assez long pour le Générateur, ou dans Performance depuis sans prix brut admissible pour Il y a X ans. Conserver cette granularité. Ne pas supprimer un actif utilisé pour faire disparaître un manque ; rechercher et corriger le raccordement.

## 5. Règles éditoriales et visuelles communes

### Textes

- Accroche humaine qui donne une raison de lire ; pas le nom administratif de la série au début de chaque tweet.
- Phrases reliées, rythme naturel, virgules quand elles relient réellement les idées. Éviter les phrases hachées comme les longues suites de virgules.
- Ne pas imposer des constructions en trois temps, des slogans ni une conclusion interchangeable à tous les formats.
- Emojis utiles pour rythmer et repérer les résultats, sans saturer le texte.
- Ne pas inventer l’émotion, les propos ou l’expérience d’un abonné, d’un investisseur ou de l’auteur.
- Garder les questions finales pertinentes ; ne pas conclure tous les contenus par une injonction d’achat.
- Disclaimer court demandé : « Pas un conseil financier ». Certaines sorties actuelles restent plus longues : c’est un écart éditorial à traiter consciemment, sans supprimer une précision factuelle nécessaire à la compréhension.
- Pas de « informations indisponibles » ou « à confirmer » qui encombrent un tweet final : résoudre la donnée, limiter la phrase à la portée démontrée ou omettre le point non établi. Les réserves et preuves restent visibles dans l’application. Ne pas masquer une condition essentielle pour obtenir un texte plus vendeur.
- Les sources peuvent être séparées du visuel selon le format ; elles restent conservées et consultables. Retirer une source d’une image n’autorise jamais à la supprimer du registre.

### Images

Lisibles sur téléphone, noms d’actifs suffisamment visibles, espace bien occupé, pas de texte qui déborde et pas de microtypographie pour tout faire tenir. Les rendus doivent s’adapter au nombre de lignes, d’actifs et d’années. Texte et PNG partagent les calculs ; la modification d’un paramètre invalide un ancien aperçu asynchrone.

Respecter les visuels stylisés déjà validés. Pour Qui a vraiment gagné : tableau annuel dans l’image, synthèse annualisée dans le tweet, pas d’étoile décorative ni titre redondant « indice/action ». Pour les expositions, respecter la demande de retirer les bandeaux « 100 % ventilés » et les lignes de pied décoratives ; conserver les preuves utiles dans l’interface et ne pas maquiller une couverture incomplète.

### Interface

Recherche par nom, ISIN, ticker et catégories via les sélecteurs communs ; garder une sélection manuelle exploitable en plus de l’aléatoire. Erreurs, chargements et possibilités de réessayer doivent être explicites. Aucun ancien résultat ne doit sembler appartenir à un nouveau choix. Ne pas écraser silencieusement un brouillon ni le stockage local corrompu. Les paramètres de liens partagés et redirections font partie du contrat.

## 6. Calendrier effectivement raccordé

Le code `src/data/editorial-calendar.js` fait foi à cet instantané. « Matin » signifie **après le récap**. Le récap quotidien reste distinct des outils ; ne pas le réimplémenter sous prétexte qu’il n’a pas de route.

| Jour | Matin après le récap | Soir |
|---|---|---|
| Lundi | Qui a vraiment gagné ? | Comparatif ETF / indices |
| Mardi | Et si tu avais investi ? | Le DCA de… / allocation d’un abonné |
| Mercredi | France en 100 / Pouvoir d’achat en alternance | Comparatif courtiers |
| Jeudi | Qui a vraiment gagné ? | Présentation ETF / Coulisses des indices en alternance |
| Vendredi | Et si tu avais investi ? | Duel / Générateur avec portefeuille expliqué en alternance |
| Samedi | Bilan hebdomadaire, mention de calendrier sans outil dédié | Performance depuis / Présentations AV-SCPI en alternance |
| Dimanche | Qui a vraiment gagné facultatif ; alternatives Fiches pratiques, Faits marquants ou Il y a X ans | Portefeuille d’investisseur |

L’analyse d’entreprise reste disponible mais hors calendrier. Ne pas la réintroduire comme présentation programmée. Dilemme est masqué ; Vrai/Faux et Scanner ne sont pas des formats à réactiver. Les anciennes mentions « midi », « mercredi soir » ou « vendredi midi » dans certaines descriptions ne doivent pas remplacer ce calendrier.

## 7. Audit détaillé des 26 outils

Chaque fiche ci-dessous constitue un contrat de maintenance. « À contrôler » désigne une limite ou une recette d’acceptation, pas une panne démontrée par le présent audit.

### 7.1 Qui a vraiment gagné ?

**Route et fichiers.** `/classements-performances` ; `src/pages/performance-rankings/` : `App.jsx`, `data.js`, `engine.js`, `series.js`, `selection.js`, `suggestions.js`, `image.js`, éditeurs et favoris.

**Contenu constaté.** Catégories préparées, sélection manuelle, choix d’un ETF de référence face à cinq actions, comparaison d’actifs ou de portefeuilles. Modes une année, plusieurs années, période ; historiques mensuels et calendriers annuels officiels en univers séparés. Devise originale, EUR ou USD, favoris, régularité sur fenêtres glissantes et export texte/PNG. Les portefeuilles peuvent être sans rééquilibrage, rééquilibrés annuellement ou mensuellement.

**Calculs et limites.** De 2 à 6 participants distincts, au maximum 10 années dans le mode annuel. Série mensuelle continue, valeurs positives, monnaie commune, périodes réellement partagées. Ne mélange pas les calendriers annuels et séries mensuelles dans une même sélection ; refuse les conventions d’indice net/brut incompatibles. Les moyennes mensuelles, indices de prix et séries de futures exclues par la politique ne doivent pas être réintroduits par simple présence au catalogue. Fenêtres de régularité 12/36/60/120 mois ; pas de régularité mensuelle inventée à partir d’un calendrier annuel. Les égalités utilisent les valeurs non arrondies.

**Attendus éditoriaux.** « Parmi ces actions/ETF…, lequel a le mieux performé entre … ? 👇 », classement avec médailles et annualisé sur la période quand pertinent, puis « Le détail année par année dans l’image 👇 » et question d’exposition. Les performances détaillées annuelles sont dans un tableau visuel. Ne pas remettre dans le tweet la ligne générale de conventions supprimée par l’utilisateur ; celles-ci restent dans les données et l’interface.

**À respecter et vérifier.** Tester 2 à 6 actifs et 2 à 7 années, noms longs, pertes, égalités et périodes partielles. Le PNG transpose la grille selon sa densité, largeur 1200 ; ne pas l’allonger indéfiniment. Ne pas assimiler « meilleure année » à « meilleur investissement futur ». L’utilisateur a demandé actions et ETF actions pour les extensions de ce format : les obligations déjà présentes dans le code ne constituent pas une autorisation de nouvelles extensions obligataires. La catégorie luxe ne doit pas réintroduire Ferrari ; ne pas classer L’Oréal comme luxe sans qualification. Le hook du mode « cinq actions face à un ETF » doit être adapté si le nombre réel de lignes change.

### 7.2 Portefeuille & DCA : Actifs & expositions et Le DCA de…

**Route et fichiers.** `/le-dca-de` ; `src/pages/dca-profiles/`. Deux onglets : `SimpleExposure.jsx` par défaut et `DcaApp.jsx` chargé à la première visite ; moteurs `engine.js`, `exposure.js`, `analytics.js`, `verification.js`, projections et chargement des positions.

**Actifs & expositions.** Composition manuelle par actif et poids détenu, recherche dans le catalogue, ajout depuis un lien ISIN, choix des donuts pays/secteurs/les deux et nombre de catégories dominantes. Génération puis téléchargement d’une image d’exposition. Brouillon conservé localement. Ce mode n’a pas à afficher identité, âge, métier, revenu ou DCA.

**Le DCA de…** Banque de 100 profils éditoriaux, filtres budget/nombre de lignes/type/non utilisés, tirage, composition ou participation, duplication et sauvegardes locales nommées. Texte modifiable et image. Poids détenus et montants mensuels distincts. Analyse de l’allocation actuelle, des flux ou de l’allocation après versements ; concentration top 5/top 10, titres directs et indirects, recouvrement par paire, recherche de titres, comparaison de deux allocations et détail des sources.

**Bornes constatées.** Le moteur accepte aujourd’hui **1 à 50 positions**, total des poids à 100 % avec tolérance explicite, actifs distincts et valeurs valides. La documentation historique évoquant 8 positions est dépassée. Cela ne prouve pas que le PNG 50 lignes soit lisible : contrôler le rendu dense et prévoir une présentation adaptée plutôt que rétrécir toute la typographie. Le DCA éditorial préparé reste volontairement beaucoup plus court, généralement 2 à 4 lignes. Une participation exige l’approbation de publication prévue par l’outil ; une modification la révoque.

**Données et calculs.** Expositions sourcées, ISIN confirmé, dates compatibles : 93 jours maximum, 45 jours de dispersion. Le rendu agrège une synthèse publiée avec traçabilité ; les taxonomies ne deviennent pas équivalentes par un simple renommage. Le recouvrement exact exige les portefeuilles complets qualifiés ; les tops partiels montrent seulement les titres communs observés. L’or et les cryptos restent hors classification actions. Les multi-actifs conservent une ventilation actions/obligations séparée quand disponible.

**À respecter et vérifier.** Aucun capital déduit des seuls flux. La projection après versements nécessite un capital saisi et travaille à cours constants, sans rendement, frais ni fiscalité : ce n’est pas une prévision. Aucun score de qualité, d’adéquation ou conseil d’arbitrage implicite. Les profils préparés ne sont pas des témoignages. Une vraie contribution garde son texte et ses choix explicites. Vérifier doublons ISIN, allocation 0/100, métaux, crypto, fonds synthétique, portefeuille mixte, données périmées, erreur réseau, sauvegarde/restauration et visuel deux donuts. Le nom produit à conserver dans l’interface est **Actifs & expositions**, même si d’anciens échanges disent « recouvrement ».

### 7.3 Fiches pratiques

**Route et fichiers.** `/fiches-pratiques` ; `src/pages/practical-sheets/`, sujets dans `src/data/practical-sheet-topics.js` ; fonctions `buildSheet`, `buildTweet`, sélection de fonds et rendu `drawSheet`.

**Contenu constaté.** Questions pédagogiques sur enveloppes, ETF, indices, démarches, choix de supports et frais. Certaines fiches sélectionnent des ISIN précis ou un contrat d’assurance-vie ; d’autres proposent un scénario chiffré : capital, durée, rendement supposé, frais A/B, coût de changement et délai. Texte éditable, image et sources. Le lien `?fiche=` sélectionne un sujet.

**Attendus.** Une fiche répond à une question concrète, expose les différences qui aident à choisir, sans devenir une publicité ni une longue présentation d’ETF. Pour World PEA : part exacte, TER, encours, prix de part et tracking difference seulement si ces champs sont réellement qualifiés. World PEA et émergents PEA doivent rester dans le périmètre demandé ; ne pas inventer un ETF pour compléter le tableau.

**Limites.** Les sujets et explications restent éditoriaux, les valeurs vivantes viennent des registres. Les scénarios sont des hypothèses ; changer pour quelques points de frais dépend aussi des coûts de transaction et du temps. Une comparaison doit annoncer sa base ; ne pas confondre tracking difference réalisée et TER contractuel. Le code bloque copie et image si la fiche est marquée `blocked` ou si le rendu échoue : conserver la protection, mais vérifier si la cause impose vraiment un blocage complet ou une publication limitée.

**À vérifier.** Sujet sans données, statut PEA inconnu, contrat précis, calcul de changement, coût nul/élevé, période de délai et image sans ligne de source conformément au visuel validé. L’incident SEC 403 sur une référence pédagogique 13F ne doit pas amener à inventer le contenu ni couper sans examen les fiches sans rapport.

### 7.4 Radar éditorial

**Route et fichiers.** `/radar-editorial` ; `src/pages/editorial-radar/` : client, présentation et reformulation des signaux ; collecteur et notifications dans `scripts/`.

**Contenu constaté.** Flux de changements sourcés : ancienne/nouvelle valeur, période, périmètre, raison, angle de post, source, lien vers l’outil et brouillon modifiable. Filtres famille, sujet pouvoir d’achat, lus/non lus et recherche. Marquage lu local ; rafraîchissement client toutes les cinq minutes. La collecte programmée du radar est distincte de ce rafraîchissement d’écran.

**Attendus.** Remonter les changements exploitables, pas chaque bruit technique. Les premières observations sont des initialisations, pas des hausses. Une différence de classification, de devise, de base fonds/indice ou de date ne devient pas une évolution économique. Une variation des « autres » peut provenir de la couverture et doit être qualifiée.

**Limites et respect.** Une idée de tweet n’est pas automatiquement une information validée pour publication. L’utilisateur a retiré la surveillance des textes Sénat/Assemblée du radar pouvoir d’achat et veut distinguer une adoption de loi d’une proposition : ne pas restaurer une source exclue via une collecte plus large. Le statut officiel, la date et l’étape doivent être conservés. Les titres et résumés reformulés doivent respecter le texte source, disponible séparément.

**À vérifier.** Déduplication, retour de source plus ancienne, comparabilité des périodes, précision des unités, read state après rechargement, source en panne et rapprochement correct vers l’outil. Les notifications ne doivent pas ouvrir indéfiniment une nouvelle issue pour le même état ; l’automatisation de surveillance doit rester distincte de l’historique éditorial.

### 7.5 Simulateur de patrimoine

**Route et fichiers.** `/simulateur-patrimoine` ; `src/pages/wealth-simulator/`, `src/lib/simulation-rates.js`, taux économiques, réglementation et générations de PEL.

**Contenu constaté.** Un patrimoine ou comparaison A/B, plusieurs poches par enveloppe, capital initial, versements, frais, fiscalité simplifiée, hypothèses prudent/central/favorable, inflation et horizon. Changements programmés : nouveaux versements, pause, retrait. Répartition actuelle/future, graphes, texte X, image et import/export JSON.

**État actualisé.** Le Livret A utilise l’observation économique ; le LDDS son paramètre réglementaire avec repli explicite ; le PEL une génération d’ouverture. Le plafond PEA est branché au registre réglementaire. Ces points ont évolué depuis l’audit du 17 octobre : ne pas redemander les mêmes corrections sans relire le code.

**Calculs et limites.** Projection hypothétique, taux annuel effectif converti au mois, frais proportionnels et versements de fin de mois. Ordre annoncé des événements : rendement puis retraits puis versements ; le dernier changement de versement prime en cas de doublon. Les rendements de marché ne sont pas des prévisions. Les plafonds portent sur les versements selon l’enveloppe, pas automatiquement sur la valeur capitalisée. Les champs base fiscale/capacité restante sont utiles pour ne pas inférer l’historique d’un portefeuille réel.

**À respecter et vérifier.** Fiscalité simplifiée, pas simulateur déclaratif complet ni calcul de crédit immobilier. Le taux réglementé courant projeté constant reste une hypothèse future. Contrôler plusieurs poches du même type, PEL ancien, plafond atteint, versements interrompus, retrait supérieur au capital, frais déjà inclus dans un taux net, négatif/inflation et import incompatible. Pas de double prélèvement de frais quand l’utilisateur saisit un rendement net.

### 7.6 Présentations : assurance-vie, SCPI et acteurs

**Route et fichiers.** `/presentations`, paramètre `famille` ; `src/pages/presentations/`, `insurance-presentation/`, `scpi-presentation/`, `presentation-shared/` ; registres `insurance.js`, `scpi.js`, `presentation-actors.js`. Les anciennes routes AV et SCPI redirigent ici.

**Assurance-vie.** Distributeur et assureur, minima de versements, supports, frais du contrat et des opérations, fonds euros, rendements publiés, garantie réelle, conditions d’accès et contraintes d’unités de compte. Texte modifiable par fiche et visuel personnalisé. Distinguer rendement net de frais de gestion, avant prélèvements sociaux/fiscaux, bonus commercial et rendement normal. Une garantie après frais peut être inférieure à 100 %. Un fonds euros n’est pas automatiquement accessible à 100 % sans condition.

**SCPI.** Pays, secteurs et éventuellement régions, date du patrimoine, prix de part et historique, minimum, jouissance, rythme des revenus, distribution annuelle, frais et liquidité. Le taux de distribution n’est pas la performance totale : prix de part, frais et fiscalité ont des effets distincts. Le TOF n’est pas une mesure des surfaces occupées. Prix de souscription et valeur de revente ne sont pas interchangeables. Un changement de nombre de parts doit être traité comme une opération sur titres, pas un effondrement de prix.

**Acteurs du non coté ou des actifs réels.** Familles, acteur, offre précise, véhicule détenu, mécanisme, accès/revenus/sortie, frais/durée, statut de souscription et risques. Plusieurs offres d’un acteur peuvent avoir des conditions différentes. Collecte des conditions publiques distincte de l’explication éditoriale générale ; date de contrôle éditoriale séparée. Une collecte du site ne prouve pas que la souscription soit ouverte.

**Attendus et limites.** Répondre « ce que tu détiens réellement, comment cela fonctionne et ce que cela coûte ». Ne pas élargir la garantie, inventer la fiscalité d’un véhicule ni annoncer un rendement futur. Les rendements annuels restent ceux du dernier exercice publié ; une nouvelle année civile ne crée pas de nouveau résultat. Une source indisponible conserve l’ancienne preuve sans rajeunissement. L’incident « Wrong contract identity » Linxea Avenir 2 exige de vérifier le contrat exact, pas de réutiliser les conditions d’un voisin.

**À vérifier.** Offres closes/échues, contrat archivé, conditions d’accès et bonus, distributions, patrimoine SCPI partiel, dates des frais, longs libellés et trois familles d’images. Les anciennes formules « à confirmer » encore présentes dans certains exports AV sont un écart aux attentes éditoriales : qualifier ou réduire la portée avant de retirer la phrase.

### 7.7 Analyse d’entreprise

**Route et fichiers.** `/analyse-entreprise` ; `src/pages/company-analysis/` et dossiers chargés via `virtual:company-dossiers`. Principaux modules : `lib.js`, qualification, complétude, `valuation.js`, `priceTargets.js`, calibration, preuve des objectifs, explication, publication et historique des prévisions.

**Contenu constaté.** Sélection d’entreprise, dossier chargé à la demande, activité, comptes, indicateurs de rentabilité/cash/solidité, historique et valorisation disponible. Le produit actuel va au-delà d’une présentation : objectifs de cours à **1, 3 ou 5 ans**, méthodes bénéfices/BPA ajusté ou flux de trésorerie par action, scénarios, paramètres modifiables, sensibilité et graphique distinguant historique et hypothèses. Texte et visuels dédiés.

**Attendus.** Garder une lecture accessible des données et des facteurs qui expliquent le résultat. Cette page reste hors calendrier. L’existence d’une série de cours européenne dans un autre outil ne suffit pas à créer un dossier comptable et de valorisation : il faut comptes, devise, périmètres et bases par action compatibles.

**Limites majeures.** Un objectif issu du modèle n’est ni un consensus analystes ni une prévision garantie. Le tracé intermédiaire hypothétique n’est pas une trajectoire observée. Le potentiel de cours annoncé est hors dividendes quand le modèle le précise. Ne pas mélanger BPA historique, BPA ajusté prévisionnel, FCF total et FCF/action. La politique FCF après intérêts exclut notamment un double ajout de trésorerie ou une deuxième déduction de dette ; respecter les hypothèses du modèle au lieu d’additionner des méthodes incompatibles.

**À respecter et vérifier.** Les deux méthodes peuvent avoir des degrés de complétude distincts : ne pas publier le calcul d’une méthode seulement parce que l’autre est valide. Garder les dates des comptes, estimations et cours, le nombre d’actions et la devise. Tester pertes/BPA négatif, cash-flow atypique, banques/assurances, données insuffisantes, source expirée et changement rapide de dossier. Les archives de prévisions doivent conserver les hypothèses d’origine ; une correction du présent ne doit pas réécrire rétrospectivement une prévision publiée.

### 7.8 Portefeuille d’investisseur

**Route et fichiers.** `/portefeuilles-investisseurs` ; `src/pages/investor-portfolio/`, roster et biographies dans `src/data/`, données dans `public/data/investors/`, collecteur `scripts/update-investor-13f.py`.

**Contenu constaté.** Roster d’investisseurs déclarants, introduction biographique sourcée et modifiable, dernière photographie 13F, principales positions/poids, éventuels mouvements trimestriels, texte et PNG avec portrait. Chargement individuel avec revalidation ; composant d’historique d’archives.

**Données et limites.** Les sources d’accès FolioFact et Tracefour sont des intermédiaires de déclarations SEC. Le trimestre déclaré n’est pas aujourd’hui ; contrôle quotidien et photographie trimestrielle sont distincts. Un 13F ne montre pas tout le patrimoine, toutes les positions mondiales, le cash ou toutes les couvertures. Ne jamais titrer comme s’il s’agissait du portefeuille personnel complet ou d’achats réalisés le jour du relevé.

**Mouvements.** Utiliser les nombres d’actions ou les mouvements explicitement publiés, pas une variation de poids pour déduire un achat/une vente. Regrouper des classes pour l’affichage n’autorise pas à perdre les identités utiles à la comparaison. Quatre mouvements au plus dans le texte actuel ; omettre l’encart sans comparaison exploitable.

**À respecter et vérifier.** Ne pas forcer un nombre de profils ancien dans les tests ; dériver le roster actuel. Vérifier absence de positions, trimestre plus ancien rejeté, correction du même trimestre, passage au suivant et archivage. Le composant History peut exister sans archives disponibles : contrôler les fichiers avant d’annoncer un historique fonctionnel. Les portraits conservent sources et crédits. Une panne ne remplace pas un portefeuille par un tableau vide.

### 7.9 La France en 100 ménages

**Route et fichiers.** `/france-100-menages` ; `src/pages/france-100-menages/`, `household-statistics.js`, économie et rédaction dédiées.

**Contenu constaté.** 29 sujets au catalogue observé, statistiques INSEE sur patrimoine, endettement, salaires et niveaux de vie, texte éditable et plusieurs compositions PNG. Sélection de sujet/style conservée dans l’URL. Types de visuel : taux, seuils, parts et comparaisons.

**Attendus.** Rendre une statistique compréhensible sur une base 100, avec chiffre exact et portée accessible. Le « 100 » est un dispositif de représentation : il ne change pas l’unité statistique de la source. Quand il s’agit de salariés ou de personnes, le texte et l’image doivent le dire ; ne pas écrire « ménages » par automatisme.

**Limites.** Médiane/moyenne, patrimoine brut/net, salaire EQTP avant impôt et niveau de vie par unité de consommation sont distincts. Une statistique par âge porte sur la définition exacte du référent de la source. Un seuil du décile n’est ni la richesse moyenne du décile ni sa part de patrimoine. Une enquête patrimoniale n’est pas une photographie quotidienne.

**À respecter et vérifier.** Le registre contient des valeurs éditoriales de base avec surcouche automatisée : inspecter le repli en cas d’absence de collecte, sa date et sa visibilité. Ne pas laisser un chiffre manuel prendre silencieusement l’apparence d’un chiffre actualisé. Contrôler 100 pictogrammes, arrondis, périmètre France/Mayotte, provisoire/définitif, seuils euros, longs titres et tous les designs encore accessibles par anciens liens.

### 7.10 Données à revoir

**Route et fichiers.** `/donnees-a-revoir` ; `src/pages/data-review/`, calendrier de revue, groupes, priorités, couverture par champ et incidents ; manifeste des workflows et statut publié.

**Contenu constaté.** Réserves, échéances de contrôle, offres arrivant à terme, rappels par temporalité, filtres outil/type, regroupements par source, état des collectes et publications, incidents de monitoring. Liens vers les données et leurs consommateurs.

**Attendus.** Servir de tableau de maintenance actionnable : cause, champ, support, source, dernière réussite, date de donnée, phase en échec et outils affectés. Un retard de collecte, une contradiction et un déploiement bloqué n’ont pas la même résolution. Préserver cette distinction.

**Limites.** La page observe l’état des systèmes qui l’alimentent : elle n’atteste pas à elle seule que toutes les valeurs du site sont exactes. Une revue planifiée n’est pas un certificat d’obsolescence. Une réussite du collecteur n’est pas une réussite de publication.

**À respecter et vérifier.** Ne pas supprimer les alertes ou assouplir la validation pour faire passer le compteur à zéro. Les tests doivent porter sur la structure et les règles, pas sur « il existe exactement N incidents aujourd’hui ». Le compteur de l’issue #583 est mouvant ; ne pas le figer dans le code ou une promesse. Donner des liens d’action, des dates Europe/Paris et un état explicite si le statut ne charge pas. Les rappels hebdomadaires ne doivent pas dupliquer sans cesse une même échéance.

### 7.11 Bibliothèque de données

**Route et fichiers.** `/bibliotheque-donnees` ; `src/pages/data-search/`, `catalog.js`, index léger `catalog-browser.js`, recherche et dossiers JSON complets dérivés. Outil de développement ETF accessible dans la page.

**Contenu constaté.** Recherche par ISIN, ticker, nom, indice ou famille, sélection d’un résultat, valeurs et provenance, historiques, outils consommateurs, liens de maintenance et export JSON. Les dossiers sont chargés à la demande via URLs versionnées par empreinte de contenu.

**Attendus.** Point de vérité pour savoir ce que l’application connaît réellement d’un actif et dans quels outils elle l’exploite. Une recherche globale doit retrouver les alias sans créer de faux produits. L’export ne doit pas appauvrir les preuves historiques.

**Limites.** L’entrée d’un catalogue n’implique pas la présence de tous les champs ni l’éligibilité à tous les outils. Les effectifs « instruments », « fiches » et « séries » décrivent des ensembles différents. Une couverture « sans objet » n’est pas un manque. Ne pas faire une deuxième base à partir des JSON exportés.

**À respecter et vérifier.** `null` reste inconnu, dates absentes restent absentes, source de rendement et source de cotation peuvent différer. Tester erreur de chargement puis réessai, sélection rapide A/B, import d’un actif récent, recherche ISIN exacte et nom avec accents, liens consommateurs et données cohérentes entre index léger/dossier après nouvelle version du site. Contrôler les collisions de ticker selon la place.

### 7.12 Et si tu avais investi ?

**Route et fichiers.** `/calculateur-investissement` ; `src/pages/investment-calculator/`, `calculator-history.js`, `math.js`, `lib.js`, comparaison vidéo, mode crise et paramètres historiques communs.

**Contenu constaté.** Actif, montant, mois/année de départ, versement unique ou DCA, derniers points disponibles, cours final saisi facultativement, actif personnalisé, comparaison Livret A et inflation lorsque la devise et la couverture le permettent. Texte, image simple/comparative et export vidéo. Mode crise compare des scénarios historiques autour d’un choc.

**Calculs.** Versement unique : unités achetées au point initial ; DCA : achat mensuel d’unités, valorisation et versements cumulés. L’application a une fonction d’interpolation pour certaines séries clairsemées ; ce n’est pas une nouvelle observation de marché. Les restrictions de DCA et d’affichage sur les séries clairsemées doivent être conservées. Un prix saisi ne remplace que le point final, pas tous les mois intermédiaires. La vidéo et le PNG doivent reprendre exactement la même dérogation.

**Comparaisons et limites.** Livret A et inflation ne doivent pas être juxtaposés comme capitaux EUR face à un capital USD. Le code limite ces comparaisons aux résultats EUR/personnalisés éligibles ; ne pas ajouter une conversion arbitraire. Le Livret A historique applique ses changements de taux, une convention de versement et capitalisation, sans plafond dans ce calcul : ce n’est pas le simulateur détaillé d’un livret réel avec tous ses mouvements. L’inflation représente un panier de dépenses, pas un placement. La convention d’achat de fin de mois et le nombre de versements doivent être explicites.

**À respecter et vérifier.** DCA et versement unique n’ont pas les mêmes sommes investies. Un gain rapporté aux versements n’est pas un TRI. Le mode personnalisé ne produit pas un vrai historique intermédiaire. Tester premier mois disponible, IPO récente, source annuelle, dernière observation en retard, devise GBp versus GBP, prix ajusté, chiffre manuel, crise, vidéo et données chargées à la demande. Les benchmarks disparaissent ou se limitent si leur couverture manque ; pas de valeur inventée pour compléter la courbe.

### 7.13 Générateur de portefeuilles

**Route et fichiers.** `/generateur-portefeuilles` ; `src/pages/portfolio-generator/`, actifs communs et chargement différé. Moteur, recettes, profils/thèses, contrôles de construction, performance, éditorial, modèles et canvas.

**Contenu constaté.** Génération par profil et niveau de risque, historique/anti-répétition, verrouillage ou remplacement de lignes, composition manuelle, explication du rôle des actifs, répartition, performances et image. Mode portefeuilles modèles : All Weather (trois adaptations), Permanent Portfolio, Golden Butterfly et 60/40, 40/60, 80/20, avec explication de la stratégie et adaptations en euros.

**Qualification.** Un actif connu peut être autorisé en manuel sans être candidat à l’automatique. Un historique complet ne prouve pas l’existence d’une recette éditoriale cohérente. La sélection manuelle conserve ses avertissements non bloquants ; les bornes de construction automatique restent contrôlées par risque. Ne pas transformer les étiquettes prudent/dynamique en promesse de perte maximale.

**Performance.** Poids fixes rétablis chaque année, rendement pondéré annuel puis capitalisation ; conversion des rendements USD avec les taux BCE de fin d’année. Le moteur recherche une fenêtre commune, accepte certains historiques récents à partir de trois années et traite les trous internes plus strictement ; relire `performance.js` avant de prétendre à une fenêtre uniforme de six ans. Fonds euros/SCPI ou historiques reconstitués portent une réserve explicite et ne deviennent pas des rendements d’un support exact.

**Attendus et limites.** Expliquer pourquoi les poches coexistent, les concentrations, chevauchements possibles et risques de taux/crypto/levier. L’All Weather proposé est une adaptation pédagogique, pas la réplication exacte du portefeuille d’un fonds ni une protection contre tous les scénarios. L’ETF monétaire n’est pas un livret garanti ; les obligations longues peuvent fortement baisser. Pour le mode « si je recommençais », respecter l’exclusion utilisateur des ETF obligataires USD ; ne pas généraliser cette préférence à tous les modèles sans instruction.

**À vérifier.** Total 100 %, doublons économiques, changement de lignes verrouillées, recette sans candidat, historique court, devise inconnue, modèles, alternatives et lien depuis un ISIN. Toute modification d’un poids crypto/levier dans un `riskCombo` exige le stress test prévu, notamment mode `combo`. Garder les poids à risque testés ; ne pas les ajuster à l’intuition.

### 7.14 Duel de portefeuilles

**Route et fichiers.** `/duels-portefeuilles` ; `src/pages/portfolio-duels/`, catalogue, générateur, allocation manuelle, calculs et image.

**Contenu constaté.** Duels préparés, génération et comparaison manuelle de deux allocations A/B. Un ETF seul contre cinq ou six actions doit rester possible. Chaque côté accepte 1 à 6 actifs distincts, poids entiers positifs, total 100 %. Répartition à parts égales, paramètres conservés et liens d’actif/duel.

**Calculs.** Capital initial de référence 10 000 €, sans versement supplémentaire dans le moteur de duel actuel. Dernière fenêtre commune de 3 à 6 années civiles consécutives, rendements en EUR, repondération annuelle. Rendement annuel pondéré, capital composé, différence finale et pire année. Ne pas appeler « drawdown » la pire année civile.

**Attendus.** Comparer les constructions, pas seulement couronner un vainqueur : ce que change Europe, émergents, small caps, or, secteur ou actions directes autour d’un socle. Les limites de diversification et le poids réel d’une conviction doivent être compréhensibles. Ne pas forcer les sélections manuelles à contenir un socle unique ni enfermer tous les duels dans World.

**Limites et respect.** TER des fonds et courtage/fiscalité ne se traitent pas comme des frais identiques ; les rendements NAV/ajustés ont déjà leur convention. Les proxies restent déclarés. L’or, le monétaire ou les obligations ne reçoivent pas un historique absent. Les univers manuels peuvent être plus larges que les recettes générées, mais les mêmes exigences de données s’appliquent.

**À vérifier.** 1 ETF contre 6 actions, mix Europe/US/Asie, petits historiques, fonds récents, poids vide, doublons, conversion, gains/pertes, égalité et comparaison des expositions. Si aucune fenêtre commune valide n’existe, afficher une cause et désactiver l’export incohérent ; ne pas raccourcir silencieusement une seule partie du duel.

### 7.15 Présentation d’ETF

**Route et fichiers.** `/fiches-etf` ; `src/pages/etf-sheets/`, accès aux enregistrements, rédaction, performances annuelles, alternatives de supports et rendu canvas.

**Contenu constaté.** 244 fiches au relevé, recherche/sélection, catégories, description de l’exposition, intérêt/limites, part et caractéristiques, frais/encours, historique annuel qualifié, texte, images stylisées et liens vers les autres usages de l’actif. Préférence de fiche et lien d’ISIN.

**Attendus.** Dire ce que l’acheteur détient, pourquoi cette exposition peut intéresser et son principal risque. Ce format doit exploiter les nouveaux actifs raccordés : une extension vers le Générateur ne doit pas oublier Présentation d’ETF quand ses données sont disponibles. Le statut PEA est documenté par part, pas par famille de nom.

**Limites.** Encours de part versus de fonds, devise et date de l’encours doivent rester identifiés. Prix de part faible ne signifie pas ETF moins cher en valorisation ni meilleure performance. Frais bas ne prouvent pas une tracking difference meilleure. Un changement d’ISIN ou fusion de part ne doit pas produire un historique artificiel. Thématique et secteur sont des périmètres différents. Les ETC/ETP peuvent être présentés dans la bibliothèque historique mais doivent porter leur vraie nature.

**À respecter et vérifier.** Secteurs sans données n’ont pas à être inventés, un fonds jeune ne reçoit pas six années d’indice présentées comme les siennes, un ETF synthétique ne présente pas son panier de substitution comme les titres économiques visés. Contrôler toutes les catégories, y compris matières premières et multi-actifs, noms longs, image/texte cohérents, statut inconnu, téléchargement/partage mobile et alternatives portant sur le même benchmark exact. Les chiffres de fiche doivent venir des registres communs, pas de copies éditoriales anciennes.

### 7.16 Comparatif courtiers

**Route et fichiers.** `/comparatif-courtiers` ; `src/pages/broker-comparator/`, tarifs communs `src/data/broker-tariffs.js` et observations automatisées. Modules séparés de preuves, portée de publication, texte court, verdicts, cartes et image duel.

**Contenu constaté.** 8 courtiers : Trade Republic, BoursoBank, Fortuneo, Interactive Brokers, XTB, Crédit Agricole Île-de-France, Bourse Direct et Saxo. Duels préparés ou sélection manuelle 2 à 3 courtiers. Tableau/carte et preuves ; tweet duel uniquement pour deux courtiers. Rubriques : courtage, offres, change, DCA, garde, enveloppes, IFU, espèces, transfert, limites et verdict.

**État des preuves contrôlé.** Audit local : 88 cellules, 69 confirmées, 6 corroborées, 7 sans objet, 6 partielles ; 159 références officielles et 32 externes comptabilisées par le script. Ce comptage ne constitue pas une nouvelle lecture indépendante de tous les tarifs le 18 octobre. Les corroborations externes du dossier du 13 octobre ont une échéance propre, différente de la collecte quotidienne officielle.

**Six limites à préserver.** Trade Republic : portée et tarif du change PEA ; frais sortants/remboursement d’entrée PEA. IBKR : application du tarif de change général au PEA. CA Île-de-France : change boursier/PEA, cash CTO, frais entrants/remboursement. `PARTIAL_PUBLICATION_SCOPE` précise ce qui peut être publié et ce qui est exclu. L’absence de confirmation n’est jamais une réponse négative.

**Règles.** Distinguer PEA/CTO, ordres ponctuels/DCA, fonds du plan/ETF directement détenu, places boursières, formule tarifaire et caisse régionale. Ne pas convertir une marge en points de cours en pourcentage fixe. La gratuité à l’achat d’une sélection n’est pas la gratuité de toute opération. Ne pas généraliser l’offre France aux comptes non migrés, ni le taux d’intérêts CTO aux espèces PEA. Les promos ont des dates et conditions ; leur expiration ne supprime pas le service permanent.

**Attendus et à vérifier.** Textes resserrés mais suffisamment précis pour ne pas induire en erreur. « Pas d’information » ne doit pas remplacer une recherche ; « gratuit » ne doit pas remplacer une portée limitée. Les verdicts sont éditoriaux, pas un classement absolu. Le texte XTB contient une transparence d’affiliation : conserver le fait exact et ne pas inventer les modalités d’un partenariat. `tariffDates` utilise désormais les observations, pas la date du jour ; son maximum ne prouve pas que toutes les rubriques ont été contrôlées à cette même date. Vérifier l’affichage des dates par courtier/champ. Le rendu de trois courtiers et l’absence éventuelle d’un PNG dédié restent à contrôler ; ne pas annoncer que la fonction d’export duel couvre automatiquement trois colonnes.

### 7.17 Fiche lexique

**Route et fichiers.** `/fiche-lexique` ; façade `tweet-midi/formats/lexique/`, moteur `engines/lexique.js`, sources lexique-financier et registre partagé.

**Contenu constaté.** 44 notions au catalogue observé, choix du sujet/tirage, texte prêt à copier et rendu du format. Données réglementaires injectées quand prévues ; prose largement éditoriale.

**Attendus.** Définir simplement une notion puis son effet concret sur l’épargnant, sans multiplier le jargon ou proposer un conseil. Ce n’est pas un dictionnaire encyclopédique ni une présentation commerciale de support.

**Limites.** Les notions stables et chiffres réglementaires ne vieillissent pas au même rythme. Un seuil de PEA ou un abattement ne doit pas rester figé dans le corps d’un texte si le registre change. Une simplification ne doit pas rendre faux le champ de la règle : plafond de versement versus capital, fiscalité à la sortie versus chaque année, frais versus performance.

**À vérifier.** Chaque terme, réinitialisation du brouillon, mode aléatoire sans répétition abusive, ancien lien `/tweet-midi`, source et date d’un chiffre injecté. Le dossier `lexique-financier` conserve des données/fonctions importées : l’absence de route propre ne suffit pas à dire que tout ce dossier est mort. Supprimer seulement ce dont l’absence d’importeur a été vérifiée.

### 7.18 Comparatif ETF

**Route et fichiers.** `/comparatif-etf` ; façade `tweet-midi/formats/comparatif/`, moteur et `data/comparatifEtf.js`, thèmes et fonctions `src/pages/etf-tweets/lib/`, registres communs.

**Contenu constaté.** Comparaisons thématiques préparées et variantes disponibles via le moteur : frais, statut PEA, performances et détails d’exposition (pays, secteurs, positions selon le produit), texte et image. L’audit de raccordement compte 133 références dans ce périmètre ; cela ne signifie pas que toutes les 244 fiches disposent d’un comparatif prêt.

**Attendus.** Comparer deux choix pertinents : même benchmark pour comparer des supports, ou expositions distinctes en expliquant cette différence. Les comparatifs World/ACWI/IMI, World/facteurs, émergents, small/large ou géographies répondent à des questions différentes ; ne pas les réduire au moins cher ou au gagnant récent. Le calendrier affiche « ETF / indices », mais le moteur autonome d’indices n’a pas de route publique : vérifier la capacité réellement exposée avant de promettre une sélection libre d’indices.

**Limites.** Comparer des périodes communes, même devise et conventions compatibles ; pas de substitution de l’indice à une part récente. La politique de composition n’affiche pas les secteurs d’un ETC ni les mêmes détails pour un fonds purement sectoriel. Le type thématique ne se déduit pas d’un seul mot du nom. La réplication vient d’une preuve par produit, jamais du statut PEA.

**À respecter et vérifier.** Si PEA-only demandé, tous les supports publiés doivent être affirmativement qualifiés. Préciser PEA/CTO quand la comparaison traverse les enveloppes. Ne pas générer deux thèmes identiques avec des alias. Raccorder un nouveau support au bon usage plutôt que créer tous les couples possibles. Contrôler 2/3 supports lorsque le sujet en prévoit, pays/secteurs de dates différentes, fonds sans position, matières premières, frais à jour, périodes absentes et PNG sans débordement.

### 7.19 Il y a X ans

**Route et fichiers.** `/il-y-a-x-ans` ; façade anniversaire, `anniversaryHistory.js`, `anniversary-levels.js`, moteur et rédaction/rendu dédiés.

**Contenu constaté.** Prix/niveau historique comparé au dernier niveau automatique daté ; choix d’actif, recul et mode simple ou comparatif à deux actifs. Saisie du niveau actuel facultative, identifiée comme manuelle. Texte et image stylisés.

**Attendus.** Raconter un écart de prix entre deux observations réelles. Le nombre d’années doit correspondre à des dates réellement couvertes ; la dernière donnée disponible n’est pas automatiquement « le prix aujourd’hui ».

**Limites.** Ce format exige un prix/niveau historiquement interprétable : un cours ajusté pour dividendes et divisions n’est pas le prix affiché en Bourse à l’époque. La présence d’une série dans le calculateur ne donne donc pas automatiquement le droit de l’utiliser ici. Pour une action ayant subi une division, documenter la convention de prix et le nombre de titres ; sinon le récit peut être faux. Les indices en points et actifs en monnaie ne se racontent pas de la même façon.

**À respecter et vérifier.** Ne pas réintroduire silencieusement des entreprises exclues pour absence de prix brut. Pas d’interpolation inventant une cotation précise. En comparatif, les deux bornes, unités et conventions doivent être compréhensibles. Vérifier date du dernier relevé, saisie manuelle vide/erronée, acteur introduit récemment, cours ancien et chargement différé ; ne pas confondre `isReady` technique et admissibilité financière. Une mise à jour automatique est recherchée avant de demander une saisie manuelle à l’utilisateur.

### 7.20 Performance depuis

**Route et fichiers.** `/performance-depuis` ; façade performance, `performanceHistory.js`, moteur, `performanceCurrency.js`, `performanceFormat.js` et image/art dédiés.

**Contenu constaté.** Performances annuelles d’un actif sur la fenêtre choisie, mode simple ou comparatif à deux actifs, devise native/EUR/USD selon disponibilité. Série officielle dans la devise cible quand le registre documente l’indice exact, sinon conversion qualifiée aux taux des bornes. Texte et PNG stylisés.

**Attendus.** Afficher les années avec signes et emojis, conserver la période exacte et les conventions. Le visuel stylisé validé s’applique au format, sans réintroduire les lignes de source retirées de l’image. Les sources et notes de méthode restent consultables.

**Limites.** World Gross EUR officiel, World Gross USD converti BCE et performance d’un ETF World EUR ne sont pas la même série. La priorité à une série officielle est restreinte aux indices exacts enregistrés, pas généralisable à un fonds. Le change doit couvrir début et fin de chaque année ; sinon la devise cible n’est pas offerte ou la période doit être explicitement limitée. Les variations arrondies presque nulles gardent leur signe selon la fonction de formatage.

**À respecter et vérifier.** Pas d’année civile incomplète présentée comme complète ; pas de moyenne arithmétique des rendements si un résumé annualisé est ajouté. Tester toutes les devises proposées, comparaison à deux, changement d’actif depuis un lien, fonds récent, rendement inférieur à 0,01 %, registre officiel versus conversion BCE et absence de taux. Les valeurs obtenues doivent rester raccordées aux séries communes et cohérentes avec les outils utilisant la même convention.

### 7.21 Pouvoir d’achat

**Route et fichiers.** `/pouvoir-achat` ; façade `tweet-midi/formats/pouvoir/`, sources `purchasing-power`, données économiques/INSEE et moteur partagé.

**Contenu constaté.** Montant, année, mode, poste de dépenses et progression hypothétique ; calcul de l’érosion ou du montant nécessaire pour préserver le pouvoir d’achat selon la base disponible, texte et image. Utilise des niveaux INSEE et paramètres publics ; ne se confond pas avec le flux d’actualités du radar.

**Attendus.** Expliquer ce que le même montant permet d’acheter ou quel montant compense une hausse des prix. Rendre la base de comparaison lisible sans faire passer le panier de consommation d’une moyenne nationale pour le budget exact d’une famille.

**Limites.** Indice général des prix, poste particulier et IRL n’ont pas le même champ. Une hausse d’indice se calcule par rapport de niveaux ; les variations ne s’additionnent pas simplement. Une moyenne annuelle et une dernière observation mensuelle doivent être identifiées, même lorsqu’une base commune permet leur comparaison. La progression saisie est une hypothèse, pas une statistique collectée.

**À respecter et vérifier.** Ne pas qualifier le résultat de rendement d’un placement ; distinguer perte de pouvoir d’achat d’un montant inchangé et inflation subie par un flux. Tester dates non disponibles, montant nul/invalide, base de poste, déflation, dernière période et changement de méthode. Aucun remplacement d’un indice manquant par zéro. Le titre et le texte doivent reprendre le poste réellement sélectionné.

### 7.22 Dilemme — conservé mais masqué

**Route et fichiers.** `/dilemme`, `hidden: true` dans le registre ; façade et moteur dédiés, banque éditoriale de situations.

**Contenu constaté.** Deux choix de placement destinés à ouvrir une discussion. Le format reste routé et peut subsister dans l’ancienne entrée mixte Tweet Midi ; il n’est pas affiché dans les groupes de l’accueil.

**Attendu produit.** Format retiré par décision utilisateur. Ne pas le remettre au calendrier, en navigation ou dans les suggestions automatiques du parcours courant sous prétexte qu’il a encore des données et des tests.

**Limites et respect.** Une conservation de compatibilité n’est pas une validation éditoriale actuelle. Si suppression technique envisagée, rechercher auparavant tous les imports et anciens liens ; si maintien, préserver son statut masqué. Ne pas ajouter de scénarios, chiffres financiers ou obligations de maintenance à ce format sans usage décidé. Vérifier que les nettoyages ne réactivent pas le format via un mode « tous formats » historique.

### 7.23 Calculateur d’impact des frais

**Route et fichiers.** `/impact-frais` ; `src/pages/fee-impact/`, frais ETF communs, `envelope-fees.js`, `simulation-rates.js` et rendu dédié.

**Contenu constaté.** Versement mensuel, durée, rendement brut supposé, deux niveaux de frais, tirage de scénarios, choix des frais d’un ETF et ajout des frais d’une enveloppe d’assurance-vie collectée. Capital final, écart, somme versée, courbes, texte et image.

**État actualisé.** Les frais d’enveloppe sont maintenant proposés et pris en compte. L’audit du 17 octobre les signalait non raccordés : ne pas reprendre cette conclusion sans vérifier la version.

**Calculs.** Même rendement brut et mêmes flux pour isoler les frais. Rendement annuel après frais proportionnels puis taux mensuel effectif ; versements en fin de mois. Le moteur additionne actuellement frais de support et d’enveloppe avant ce calcul : conserver/expliciter cette convention de simulation, sans prétendre reproduire chaque calendrier de prélèvement réel d’un contrat. L’écart de capital comprend les frais et les gains non produits par le capital prélevé.

**Limites et respect.** Pas une comparaison de performances réelles des fonds choisis. Pas de promesse de rendement constant. Ne pas présenter l’écart total comme le seul montant des commissions facturées. Fiscalité et inflation sont exclues du calcul courant. Si des rendements NAV réels sont utilisés ailleurs, ne pas en retrancher une seconde fois le TER.

**À vérifier.** Frais égaux, ordre A/B inversé, rendement inférieur aux frais, petit versement, horizon court, écart inférieur à 1 €, fonds/enveloppe sélectionnés et date de leurs preuves. Texte, graphique et export doivent reprendre les frais effectifs complets des deux scénarios.

### 7.24 Faits marquants des marchés

**Route et fichiers.** `/faits-marquants-marches` ; `src/pages/market-facts/`, données, fonctions de sélection et rédaction. Certaines statistiques proviennent des historiques communs.

**Contenu constaté.** Faits historiques préparés et faits calculés : baisses, récupérations, séquences ou versements autour des crises. Choix par famille/sujet, source, texte à copier et anti-répétition. La page lue ne propose pas de chaîne PNG comparable à celle des fiches ETF ; ne pas annoncer cet export comme acquis.

**Attendus éditoriaux.** Raconter une histoire : situation de départ, événement, vécu de l’investisseur et leçon concrète, avec transitions naturelles et quelques emojis. C’est la consigne issue de l’exemple Nasdaq : une innovation peut transformer le monde tandis qu’un achat trop cher subit une longue baisse. Éviter les phrases coupées et les conclusions artificielles. La phrase finale de méthode retirée dans cet exemple ne doit pas être réinjectée automatiquement dans le tweet ; les conventions restent dans l’interface et les preuves.

**Limites.** Baisse maximale, baisse d’une année, temps de retour au sommet nominal et récupération d’un investissement avec dividendes ou inflation sont distincts. Une clôture mensuelle ne permet pas d’annoncer précisément le creux quotidien. Un sommet nominal d’indice de prix ne prouve pas que tous les investisseurs ont récupéré le même jour.

**À vérifier.** Bornes quotidiennes/mensuelles, source primaire, absence de causalité inventée, chiffres de crise, distinction historique reconstruit/observé et cohérence avec le calculateur. Le nombre de statistiques calculées en amont n’est pas le nombre de récits visibles : exposer un fait exige aussi un angle éditorial qualifié.

### 7.25 Banque de tweets à recycler

**Route et fichiers.** `/banque-tweets` ; `src/pages/tweet-bank/`, `data.js`, `lib.js`, `validity.js`.

**Contenu constaté.** Banque de textes archivés, images associées, catégories/formats/mois, recherche, sélection des meilleurs et tri. Date de dernière publication, repos de 45 jours, brouillons locaux, date de référence et confirmation de vérification pour les contenus qui l’exigent.

**Attendus.** Retrouver vite un bon post réutilisable sans republier une vieille offre, un TER faux ou un chiffre de patrimoine daté comme s’il était actuel. La réutilisation ne se résume pas à attendre 45 jours.

**Limites.** Disponibilité éditoriale après cooldown et validité du contenu sont deux contrôles indépendants. « Consulté », « copié » et « publié » ne sont pas synonymes. La politique de validité est encore en partie éditoriale ; elle ne garantit pas l’actualisation automatique de tous les nombres présents dans un texte libre. Les dates et brouillons sont locaux au navigateur ; ne pas annoncer une synchronisation de compte ou un archivage serveur.

**À respecter et vérifier.** Une modification du texte ou de sa date de référence doit invalider une vérification devenue sans objet. Ne pas renouveler `checkedAt` seulement parce que l’utilisateur ouvre la page. Une offre expirée ne redevient pas publiable après cooldown. Tester stockage bloqué/corrompu, rechargement, dates futures, remise à zéro, copier sans presse-papiers et image d’archive. Ne pas remplacer les statistiques personnelles d’un ancien bilan par des nombres inventés pour le rendre actuel.

### 7.26 Dans les coulisses des indices

**Route et fichiers.** `/tweets-factsheets` ; `src/pages/factsheet-tweets/`, registres d’indices, compositions `index-facts.js`, fiches automatisées et archives.

**Contenu constaté.** Choix d’indice/fiche, composition géographique et sectorielle, principales entreprises, caractéristiques et comptages, texte éditable, image PNG. Le titre produit est « Dans les coulisses des indices » ; les noms de dossiers hérités ne définissent pas un autre outil.

**Attendus.** Montrer ce qu’un indice contient réellement et ses concentrations. Les poids permettent de comprendre le marché visé ; ce n’est pas une fiche tarifaire de fonds. Les fiches doivent pouvoir accueillir de nouveaux indices dès que composition et preuve sont qualifiées.

**Limites.** Nombre nominal d’un indice et nombre réel de titres ne sont pas identiques. Pays développés/émergents, grandes/moyennes/petites capitalisations et règles de sélection doivent être celles du benchmark exact. Un indice et un ETF le répliquant ont des portefeuilles et dates potentiellement différents. Ne pas réutiliser une composition de fonds comme composition officielle de l’indice sans l’annoncer.

**À respecter et vérifier.** Photos datées conservées, archive sans date identifiée comme archive, pas écrasée par une nouvelle date. Taxonomies et périmètres comparables avant agrégation. Contrôler nouveaux indices, date absente, principales lignes, pays « autres », secteurs, dividendes dans les éventuelles performances et typographie. Le test ne doit pas imposer un effectif historique tel que 40 fiches. Un indice enregistré en amont mais absent de la sélection n’est pas encore une fiche utilisable : le raccordement comprend le texte, les champs et l’export.

## 8. Moteurs internes et fonctions à ne pas confondre avec un outil public

- **Comparateur d’indices** : `src/pages/index-comparator/` conserve moteur/rendu et des tests ; aucune route publique actuelle. Ne pas annoncer son ouverture ni le compter comme un 27e outil. Une réutilisation interne est possible sans réintroduire son ancien écran.
- **Tweet Midi** : `/tweet-midi` est une route de compatibilité regroupant les anciens formats ; les six formats ont maintenant leurs entrées différées. Ne pas faire charger toutes les données des six formats lors de l’ouverture du lexique.
- **Présentations AV/SCPI** : anciennes routes redirigées vers le conteneur Présentations ; tester les anciens liens.
- **Accueil et navigation** : leur visibilité est une règle produit. Le simple fait qu’une page soit routée ne justifie pas sa présence au calendrier.
- **Récap et bilan personnel** : mentions éditoriales/calendaires ne prouvent pas un écran dédié. Ne pas inventer de modules absents.
- **Scanner et Vrai/Faux** : pas à restaurer à partir de vieux dossiers/PR sans nouvelle instruction.

## 9. État constaté et écarts à traiter consciemment

### Couverture issue de l’audit de raccordement du présent instantané

| Mesure | Résultat |
|---|---:|
| Instruments du périmètre d’audit | 519 |
| Fiches ETF | 244 |
| Références Comparatif | 133 |
| Références Duels | 440 |
| Candidats Générateur automatique | 138 |
| Références DCA | 519 |
| Ventilations qualifiées « fullExposure » du rapport | 474 |
| Références « outsideExposure » | 41 |
| Historiques « automaticHistories » du rapport | 175 |
| Candidats historiques | 11 |
| Références inutilisées selon cet audit | 0 |

Ces métriques ont des définitions de script. `fullExposure` ne certifie pas un recouvrement intégral par titres pour 474 fonds ; `outsideExposure` ne signifie pas donnée à inventer. Les 519 instruments de ce périmètre ne sont pas directement comparables aux 518 d’une ancienne génération de `app-inventory.md`. Utiliser un même instantané et un même périmètre pour mesurer une progression.

### Différences déjà visibles par rapport à l’audit du 17 octobre

1. PEL par génération, LDDS et plafond PEA sont raccordés au simulateur dans le code lu.
2. Les frais d’enveloppe sont proposés dans Impact des frais.
3. Le comparatif courtiers prend les dates des observations via `tariffDates`, au lieu d’imprimer arbitrairement la date du jour. La représentation d’une date maximale reste à interpréter correctement.
4. `MAX_POSITIONS` vaut 50 dans le moteur DCA, alors que des documents parlent encore de 8.
5. Plusieurs workflows montrent maintenant `report-failures` et `concurrency`. Ne pas reprendre l’ancienne liste des cinq manquants comme un constat du 18 octobre ; refaire l’inventaire workflow par workflow.
6. Les nombres d’actifs, de profils et de sujets ont évolué ; `CLAUDE.md` et README conservent des comptes historiques. Remplacer les comptes fragiles par des dérivations ou références à l’inventaire courant.

### Incidents de production observés dans l’issue de suivi

L’[issue #583](https://github.com/madmax91310/shinny-potato/issues/583), révision 87 mise à jour le 17 octobre à 21:14 UTC au relevé, affichait 25 points : collecte Remake Live sans bulletin courant, référence SEC en 403, métadonnées conservées faute de nouvelle observation, variation suspecte d’encours DWS, contradiction d’encours Bitwise, publications bloquées et réserves d’identité de contrat/portée de clause CA Île-de-France.

Il s’agit d’un état du moniteur, pas d’un diagnostic refait de chacun des 25 cas. Un incident ancien peut être résolu dans une branche ou attendre un nouveau cycle. Claude doit le relier au run, au commit et à la version publiée avant d’affirmer que le problème persiste ou est corrigé.

### Écarts structurels qui restent des points d’attention

- Registre des outils, résumés, groupes, ordre et raccourcis encore répartis entre plusieurs listes : éviter les divergences lors d’un renommage.
- Des sélecteurs ou catégories n’exposent pas tous les actifs déjà qualifiés ; vérifier l’usage avant de conclure à une absence de donnée.
- Les scripts de build régénèrent plusieurs fichiers ; limiter les écritures d’horodatages qui créent du bruit sans changement économique.
- Les hooks de brouillon, compteurs de longueur, copie et exports sont partiellement réimplémentés ; utiliser les primitives communes sans effacer les spécificités éditoriales.
- Les calculs de paires de Tweet Midi peuvent créer de grands ensembles au chargement ; optimiser le tirage sans changer l’univers admissible et l’anti-répétition.
- Le support de 50 positions et des noms longs doit être éprouvé dans les images, pas seulement accepté par la validation des poids.
- Les textes de présentation comportent encore des formulations de réserve que l’utilisateur ne souhaite pas dans les tweets finaux. Réduire leur portée correctement ou qualifier la donnée avant publication.

## 10. Fiabilité des automatisations et publication

### Contrat d’un collecteur

Chaque source doit avoir une identité, un champ et une portée contrôlés, une cadence, des dates distinctes, un mécanisme de dernier état valide et une remontée d’échec. Une réponse HTTP 200 ne prouve ni l’identité du contrat ni la présence de la bonne table. Une hausse d’encours brutale peut être une confusion part/fonds ou devise : ne pas élargir le seuil pour accepter automatiquement la valeur.

Les changements suspects et contradictions de même période sont mis en réserve avec les valeurs proposées et les sources. Une contradiction n’est pas tranchée par la majorité de sites qui reprennent la même erreur. Les sources primaires documentées priment ; les corroborations externes restent identifiées avec échéance.

### Collecte, commit et déploiement

Les workflows de collecte passent par `commit-validated-data.sh`, puis le portail `deploy-pages.yml`. La classification de portée compare avec le commit en ligne. Pour un changement de données uniquement dont le code a déjà été validé, les contrôles éditoriaux sans rapport peuvent être consultatifs ; build, validations nécessaires et smoke de données restent bloquants. Un changement de code ou une classification incertaine garde le portail complet.

Ne pas faire disparaître un vrai échec en le déplaçant dans un job consultatif. Inversement, ne pas bloquer la publication d’un nouveau taux officiel parce qu’un test exige une valeur figée d’encours ou un compteur exact d’incidents. Les assertions doivent dériver leurs valeurs attendues du registre et tester les invariants.

### Conditions pour annoncer « automatisé »

Prouver au moins un passage complet : observation fraîche ou explicitement inchangée → validation → commit exact → build → publication → lecture cohérente dans le consommateur. Puis vérifier la reprise après erreur de source. Un cron ajouté, un fichier `automated-*.json` ou un test unitaire vert ne suffisent pas.

## 11. Recette commune avant toute livraison fonctionnelle

1. Lire `CLAUDE.md`, le registre, les fichiers de l’outil et les PR concurrentes ; identifier le commit de départ.
2. Distinguer nouvelle demande produit, réparation de donnée et raccordement déjà en cours. Ne pas dupliquer une autre branche.
3. Corriger la source ou l’adaptateur approprié, avec preuve, dates et limites.
4. Qualifier chaque outil consommateur ; un raccordement peut être accepté ici et refusé ailleurs pour une raison légitime.
5. Exécuter les audits ciblés pertinents, puis le build exigé pour une modification de logique/donnée.
6. Tester dans un navigateur réel le parcours modifié, mobile compris ; si donnée partagée, tester tous les consommateurs affectés.
7. Générer réellement les images concernées : petit/grand nombre de lignes, nom long, valeurs négatives, période courte/longue, absence de données et chargement en erreur.
8. Vérifier texte/aperçu/fichier téléchargé identiques sur les calculs ; brouillon et stockage préservés ; aucun ancien aperçu après changement de sélection.
9. Documenter les limites restantes, la portée des tests et les exclusions par actif/champ.
10. Si fusion et déploiement sont explicitement demandés, les mener jusqu’au statut vérifiable et donner les références. Sinon ne pas déduire une autorisation de production de cette simple transmission documentaire. Les instructions de l’utilisateur dans la session priment sur une consigne locale contradictoire.

### Contrôles disponibles à choisir selon le changement

| Périmètre | Points d’entrée existants |
|---|---|
| Identités et preuves | `audit:instrument-catalog`, `audit:instrument-listings`, `audit:data-catalog`, `audit:data-provenance` |
| Frais, fiches et performance | `audit:etf-consistency`, `audit:etf-annual-performance`, `audit:performance-consistency`, `audit:publishable-content` |
| Raccordements | `audit:asset-routing`, tests de liens/outils et `playwright-full-auto-routing.mjs` |
| Expositions et DCA | `test:dca`, `test-simple-exposure.mjs`, `test-dca-analytics.mjs`, tests classification et images |
| Classements | `test:rankings`, `playwright-performance-rankings.mjs`, tests devises |
| Générateur et modèles | `stress-test:portfolios`, `audit:portfolio-provenance`, tests All Weather/modèles et navigateur |
| Duels | `audit:portfolio-duels`, tests de catalogues, allocations et raccordements |
| Calculateur et formats | `audit:calculator-series`, `verify:tweet-midi`, tests monthly consumers, format loading, devises et anniversaires |
| Courtiers | `audit:broker-evidence`, `test-broker-automation.mjs`, tests Python du collecteur |
| Patrimoine | `test:wealth`, `test:wealth:browser`, tests de consommateurs réglementaires |
| Entreprises | tests qualification, méthodes, valorisation, objectifs, dossiers et archives de prévisions |
| Investisseurs | `audit:investor-profiles`, tests Python du rafraîchissement, image et archivage |
| Statistiques INSEE | `audit:household-statistics`, tests des bases et rendus |
| Radar | `test:radar`, `test:radar:browser` |
| Maintenance | `audit:data-review`, tests calendriers, automatisations et incidents |
| Chargement/UI | `test-format-loading.mjs`, tests budgets de routes, sélection commune et actions de publication |

Ne pas lancer aveuglément toutes les suites pour une correction de prose ; ne pas considérer un unique test de présence de chaîne comme une validation financière. Les scripts peuvent exiger une version Node récente et Chromium : utiliser les prérequis du projet.

## 12. Consigne finale à Claude

Tu dois traiter cette application comme un ensemble raccordé, avec des outils éditoriaux distincts et une base de données commune. Préserve les formats et visuels validés, les choix manuels et les conventions. Cherche une donnée manquante et sa collecte avant de contourner la limite ou de retirer l’actif. L’objectif est une application utilisable directement, alimentée sans maintenance manuelle des chiffres, avec des limites explicites quand une source ne permet pas une fonction.

Avant chaque chantier, requalifie l’état courant : certaines parties décrites ici peuvent déjà avoir changé. Pour chaque livraison, indique précisément : fonction traitée, données et sources raccordées, consommateurs concernés, tests réellement exécutés, statut de fusion, statut du déploiement et limites restantes. N’utilise pas « complet », « tout automatisé » ou « déployé » si tu n’as vérifié qu’une partie de cette chaîne.

Ne présente pas un nombre d’actifs comme une preuve de qualité. Ce qui compte est que l’actif soit identifié correctement, actualisé, admissible pour le calcul demandé et représenté fidèlement dans le texte comme dans le visuel.


## 13. Inventaire des menus et contenus dérivé des modules

Ces listes sont extraites des exports JavaScript du même commit. Elles décrivent le stock éditorial et les choix préparés, pas une certification des chiffres internes. Les actifs individuels et leurs motifs par outil restent détaillés dans `docs/asset-tool-routing.json`.

### 13.1 Classements

52 catégories de base, 24 sélections de cinq actions face à un ETF et 2 calendriers annuels, soit 78 entrées préparées. Ces effectifs sont distincts du nombre d’actifs.

| Identifiant | Libellé | Participants préparés |
|---|---|---|
| swiss-finance | Banques et assurances suisses | 3 |
| europe-health-expanded | Santé européenne | 5 |
| europe-banks-expanded | Banques européennes | 4 |
| europe-groups-expanded | Grands groupes européens | 5 |
| uk-stocks | Grandes actions britanniques | 5 |
| europe-defense-expanded | Aéronautique et défense européennes | 6 |
| china-platforms | Plateformes et technologie chinoises | 5 |
| ev-batteries | Automobile et batteries | 4 |
| japan-technology | Industrie et technologie japonaises | 5 |
| japan-groups | Grands groupes japonais | 6 |
| india-stocks | Grandes actions indiennes | 5 |
| asia-banks | Banques asiatiques | 3 |
| cyber-stocks | Actions de la cybersécurité | 3 |
| chip-equipment-design | Équipements et conception de puces | 6 |
| network-infrastructure | Réseaux et infrastructures informatiques | 4 |
| us-platforms | Grandes plateformes américaines | 6 |
| market-operators | Bourses et données financières | 6 |
| us-pharma | Pharmacie américaine | 6 |
| world-acwi-net | World et ACWI · vingt ans · indices nets | 2 |
| world-acwi-imi | World, ACWI et ACWI IMI · indices nets | 3 |
| regions-indices | Grandes régions · indices nets | 5 |
| global-indices | World, ACWI, All-World · indices bruts | 3 |
| multi-asset | Actions, or, obligations et Bitcoin | 4 |
| world | Marchés mondiaux | 4 |
| europe | Marchés européens | 3 |
| factors | Facteurs mondiaux | 4 |
| europe-sectors | Secteurs européens | 6 |
| world-sectors | Secteurs mondiaux | 5 |
| themes | Thématiques | 5 |
| themes-eur | IA, cyber et jeux vidéo | 3 |
| dividends | Stratégies dividendes | 5 |
| bonds | Obligations | 6 |
| small-value | Small Cap Value | 2 |
| lifestrategy | Portefeuilles LifeStrategy | 4 |
| us-stocks | Actions technologiques américaines | 6 |
| us-semiconductors | Puces américaines | 6 |
| us-software | Logiciels américains | 6 |
| payments-finance | Paiements et finance | 6 |
| health-stocks | Grandes actions de la santé | 6 |
| europe-industry | Industrie européenne | 6 |
| us-consumer | Consommation américaine | 6 |
| luxury-stocks | Luxe · Hermès et LVMH | 2 |
| aerospace-defense | Aéronautique et défense | 5 |
| everyday-brands | Marques du quotidien | 6 |
| ai-infrastructure | Infrastructure de l’IA | 6 |
| europe-finance | Finance européenne | 5 |
| us-equity-etfs | ETF américains · classiques et équipondérés | 4 |
| technology-etfs | ETF tech · États-Unis, monde et semi-conducteurs | 3 |
| small-cap-regions | ETF petites capitalisations · États-Unis et Europe | 2 |
| fr-stocks | Grandes actions françaises | 6 |
| crypto | Cryptomonnaies | 2 |
| commodities | Matières premières via ETC | 6 |
| europe-health-expanded-benchmark | Santé européenne · face à un ETF MSCI World | 6 |
| europe-groups-expanded-benchmark | Grands groupes européens · face à un ETF MSCI World | 6 |
| uk-stocks-benchmark | Grandes actions britanniques · face à un ETF MSCI World | 6 |
| europe-defense-expanded-benchmark | Aéronautique et défense européennes · face à un ETF MSCI World | 6 |
| china-platforms-benchmark | Plateformes et technologie chinoises · face à un ETF MSCI World | 6 |
| japan-technology-benchmark | Industrie et technologie japonaises · face à un ETF MSCI World | 6 |
| japan-groups-benchmark | Grands groupes japonais · face à un ETF MSCI World | 6 |
| india-stocks-benchmark | Grandes actions indiennes · face à un ETF MSCI World | 6 |
| chip-equipment-design-benchmark | Équipements et conception de puces · face à un ETF MSCI World | 6 |
| us-platforms-benchmark | Grandes plateformes américaines · face à un ETF MSCI World | 6 |
| market-operators-benchmark | Bourses et données financières · face à un ETF MSCI World | 6 |
| us-pharma-benchmark | Pharmacie américaine · face à un ETF MSCI World | 6 |
| us-stocks-benchmark | Actions technologiques américaines · face à un ETF S&P 500 | 6 |
| us-semiconductors-benchmark | Puces américaines · face à un ETF S&P 500 | 6 |
| us-software-benchmark | Logiciels américains · face à un ETF S&P 500 | 6 |
| payments-finance-benchmark | Paiements et finance · face à un ETF S&P 500 | 6 |
| us-consumer-benchmark | Consommation américaine · face à un ETF S&P 500 | 6 |
| everyday-brands-benchmark | Marques du quotidien · face à un ETF S&P 500 | 6 |
| health-stocks-benchmark | Grandes actions de la santé · face à un ETF MSCI World | 6 |
| europe-industry-benchmark | Industrie européenne · face à un ETF MSCI World | 6 |
| fr-stocks-benchmark | Grandes actions françaises · face à un ETF MSCI World | 6 |
| aerospace-defense-benchmark | Aéronautique et défense · face à un ETF MSCI World | 6 |
| ai-infrastructure-benchmark | Infrastructure de l’IA · face à un ETF MSCI World | 6 |
| europe-finance-benchmark | Finance européenne · face à un ETF MSCI World | 6 |
| annual-world | World, ACWI, All-World · années officielles | 3 |
| annual-pea | ETF PEA · calendriers NAV | 6 |

### 13.2 Les 64 fiches pratiques

| Identifiant | Famille | Question ou sujet |
|---|---|---|
| nasdaq-equal-selection | Indices et portefeuille | Nasdaq-100 : classique ou équipondéré |
| small-value-global-selection | Indices et portefeuille | Petites capitalisations : marché ou value active |
| ibonds-2028-2029-selection | Indices et portefeuille | Obligations à échéance : 2028 ou 2029 |
| copper-metal-miners-selection | Indices et portefeuille | Cuivre : contrats à terme ou mines |
| cloud-robotics-batteries-selection | Indices et portefeuille | Cloud, robotique ou batteries |
| property-world-europe-selection | Indices et portefeuille | Immobilier coté : monde ou Europe |
| defence-nuclear-quantum-selection | Indices et portefeuille | Défense, nucléaire ou quantique |
| etf-pe | Comprendre un résultat | Le PER d’un ETF, comment le lire ? |
| etf-volatility | Comprendre un résultat | Volatilité : ce que mesure le chiffre |
| sector-theme | Indices et portefeuille | Secteur ou thème : quelle différence ? |
| em-small | Indices et portefeuille | Les petites entreprises des émergents |
| bond-falls | Comprendre un résultat | Pourquoi un ETF obligataire baisse-t-il ? |
| bond-duration | Fonctionnement | Duration ou maturité ? |
| av-fee-layers | Enveloppes | Les frais qui se cumulent en assurance-vie |
| etf-aum-scope | Avant d’agir | Encours du fonds ou de la part ? |
| etf-spread | Avant d’agir | Le spread à l’achat d’un ETF |
| 13f-reading | Comprendre un résultat | Ce qu’une déclaration 13F ne dit pas |
| water-timber-agriculture | Indices et portefeuille | Eau, bois ou agribusiness |
| platinum-palladium | Indices et portefeuille | Platine ou palladium physique |
| copper-platinum-palladium | Indices et portefeuille | Cuivre, platine ou palladium |
| pea-cto | Enveloppes | PEA ou CTO ? |
| av-cto | Enveloppes | Assurance-vie ou CTO ? |
| av-per | Enveloppes | Assurance-vie ou PER ? |
| gold-av-cto | Enveloppes | Or : assurance-vie ou CTO ? |
| world-pea | ETF sur PEA | Les ETF World sur PEA |
| europe-pea | ETF sur PEA | Les ETF Europe sur PEA |
| sp500-pea | ETF sur PEA | Les ETF S&P 500 sur PEA |
| em-pea | ETF sur PEA | Les ETF émergents sur PEA |
| world-acwi | Indices et portefeuille | World, ACWI ou All-World ? |
| europe-indices | Indices et portefeuille | MSCI Europe, STOXX 600 ou Euro STOXX 50 ? |
| world-sp500 | Indices et portefeuille | World ou S&P 500 ? |
| world-em | Indices et portefeuille | World seul ou World + émergents ? |
| europe-zone | Indices et portefeuille | Europe ou zone euro ? |
| sp500-nasdaq | Indices et portefeuille | S&P 500 ou Nasdaq-100 ? |
| equal-weight | Indices et portefeuille | Classique ou équipondéré ? |
| index-adds | Indices et portefeuille | Que rajouter à un World ? |
| diversification | Indices et portefeuille | Cinq ETF : vraiment diversifié ? |
| portfolio-case | Indices et portefeuille | Comprendre un portefeuille d’ETF |
| cap-dist | Fonctionnement | Capitalisant ou distribuant ? |
| phys-synth | Fonctionnement | Physique ou synthétique ? |
| hedge | Fonctionnement | Couvert contre le change ou non ? |
| dividend-options | Fonctionnement | Dividendes ou vente d’options ? |
| price-part | Fonctionnement | Une part à 5 € ou à 500 € ? |
| gold-physical | Fonctionnement | Or physique ou ETC or ? |
| bonds-term | Fonctionnement | ETF obligataire à échéance ou classique ? |
| livret-euro | Enveloppes | Livret ou fonds euros ? |
| euro-monetary | Enveloppes | Fonds euros ou ETF monétaire ? |
| pea-provider | Enveloppes | PEA bancaire ou chez un courtier ? |
| multiple-av | Enveloppes | Une ou plusieurs assurances-vie ? |
| before-etf | Avant d’agir | Avant d’acheter son premier ETF |
| transfer-pea | Avant d’agir | Avant de transférer son PEA |
| broker-fees | Avant d’agir | Les frais à vérifier chez un courtier |
| choose-broker | Avant d’agir | Choisir son courtier pour 100 € par mois |
| ifu | Avant d’agir | Comment lire son IFU ? |
| merger | Avant d’agir | Mon ETF fusionne ou change d’indice |
| same-world | Avant d’agir | Deux ETF World : lequel choisir ? |
| change-etf | Avant d’agir | Changer pour un ETF moins cher ? |
| where-savings | Enveloppes | Où garder une épargne à utiliser bientôt ? |
| fees-euros | Comprendre un résultat | Ce que les frais coûtent en euros |
| delay-invest | Comprendre un résultat | Que change un versement retardé ? |
| under-index | Comprendre un résultat | Mon ETF monte moins que son indice |
| dividend-gain | Comprendre un résultat | Gros dividende, gros gain ? |
| personal-performance | Comprendre un résultat | Mon rendement n’est pas celui de l’ETF |
| tracking | Comprendre un résultat | Même indice, performances différentes |

### 13.3 Les 28 profils investisseurs

| Identifiant | Profil |
|---|---|
| morfit | Mason Morfit |
| dorsey | Pat Dorsey |
| vinall | Robert Vinall |
| marks | Howard Marks |
| watsa | Prem Watsa |
| gavin-baker | Gavin Baker |
| einhorn | David Einhorn |
| halvorsen | Andreas Halvorsen |
| gerstner | Brad Gerstner |
| gayner | Tom Gayner |
| tepper | David Tepper |
| ackman | Bill Ackman |
| berkshire | Berkshire Hathaway |
| cathie-wood | Cathie Wood |
| thiel | Peter Thiel |
| druckenmiller | Stanley Druckenmiller |
| loeb | Daniel Loeb |
| aschenbrenner | Leopold Aschenbrenner |
| li-lu | Li Lu |
| gates-trust | Gates Foundation Trust |
| klarman | Seth Klarman |
| terry-smith | Terry Smith |
| pabrai | Mohnish Pabrai |
| hohn | Christopher Hohn |
| baker-bros | Baker Bros. Advisors |
| icahn | Carl Icahn |
| laffont | Philippe Laffont |
| renaissance | Renaissance Technologies |

### 13.4 Présentations

Le module courant expose 6 contrats AV actifs et 1 archivé, 8 SCPI et 11 acteurs. Le catalogue peut donc compter 7 assurances sans que les 7 soient proposées comme actives.

| Type | Identifiant | Nom | Offres lorsque définies |
|---|---|---|---|
| AV active | linxea-spirit-2 | Linxea Spirit 2 |  |
| AV active | linxea-zen | Linxea Zen |  |
| AV active | linxea-vie | Linxea Vie |  |
| AV active | lucya-cardif | Lucya Cardif |  |
| AV active | placement-direct-vie | Placement-direct Vie |  |
| AV active | linxea-avenir-2-plus | Linxea Avenir 2+ |  |
| AV archivée | linxea-avenir-2 | Linxea Avenir 2 |  |
| SCPI | iroko-zen | Iroko Zen |  |
| SCPI | remake-live | Remake Live |  |
| SCPI | corum-origin | CORUM Origin |  |
| SCPI | corum-xl | CORUM XL |  |
| SCPI | corum-eurion | CORUM Eurion |  |
| SCPI | transitions-europe | Transitions Europe |  |
| SCPI | activimmo | ActivImmo |  |
| SCPI | epargne-pierre | Épargne Pierre |  |
| Acteur private-equity | fundora | Fundora | Fundora — Classique ; Fundora — Horizon |
| Acteur private-equity | anaxago | Anaxago | AxClimat I — part E ; AxClimat I — part B |
| Acteur bovins | mymarguerit | MyMarguerit | Cheptel MyMarguerit |
| Acteur vignobles | bacchus | Bacchus Conseil | GFV Cave de Tain — Crozes-Hermitage |
| Acteur forets | france-valley | France Valley | GFI France Valley Patrimoine ; GFI France Valley Forêts ; France Valley Foncière Europe |
| Acteur energie | enerfip | Enerfip | Projets Enerfip — convention investisseur |
| Acteur terres | hectarea | Hectarea | Obligations foncières Hectarea |
| Acteur immobilier | bricks | Bricks | Obligations immobilières Bricks |
| Acteur art | matis | Matis | Matis — société projet par œuvre |
| Acteur private-equity | tudigo | Tudigo | Tudigo — investissement en actions |
| Acteur energie | lendosphere | Lendosphere | Lendosphere — financement en dette |

### 13.5 Les 44 entrées du lexique

| Identifiant | Catégorie | Terme | Variante |
|---|---|---|---|
| pea | Enveloppes fiscales | le PEA | A / enveloppe |
| cto | Enveloppes fiscales | le CTO | A / enveloppe |
| assurance-vie | Enveloppes fiscales | l'assurance-vie | A / enveloppe |
| per | Enveloppes fiscales | le PER | A / enveloppe |
| livret-a | Enveloppes fiscales | le Livret A | A / enveloppe |
| ldds | Enveloppes fiscales | le LDDS | A / enveloppe |
| pee-perco | Enveloppes fiscales | le PEE / PERCO | A / enveloppe |
| etf | Produits & marchés | les ETF | A / produit |
| action | Produits & marchés | une action | A / produit |
| obligation | Produits & marchés | une obligation | A / produit |
| fcp | Produits & marchés | un fonds commun de placement | A / produit |
| scpi | Produits & marchés | la SCPI | A / produit |
| opci | Produits & marchés | l'OPCI | A / produit |
| trackers | Produits & marchés | les trackers | A / produit |
| dca | Mécanismes & stratégies | le DCA (versement programmé) | A / produit |
| effet-levier | Mécanismes & stratégies | l'effet de levier | A / produit |
| diversification | Mécanismes & stratégies | la diversification | A / produit |
| reequilibrage | Mécanismes & stratégies | le rééquilibrage de portefeuille | A / produit |
| dca-vs-lumpsum | Mécanismes & stratégies | DCA vs lump sum | A / produit |
| vente-a-decouvert | Mécanismes & stratégies | la vente à découvert | A / produit |
| dividende | Mécanismes & stratégies | le dividende | A / produit |
| reinvestissement-dividendes | Mécanismes & stratégies | le réinvestissement des dividendes | A / produit |
| blockchain | Crypto | la blockchain | A / produit |
| stablecoin | Crypto | le stablecoin | A / produit |
| cold-hot-wallet | Crypto | le cold wallet / hot wallet | A / produit |
| rendement-locatif | Immobilier | le rendement locatif | A / produit |
| effet-levier-immo | Immobilier | l'effet de levier immobilier | A / produit |
| lmnp | Immobilier | le LMNP | A / produit |
| drawdown | Indicateurs & notions | le Drawdown | B |
| volatilite | Indicateurs & notions | la Volatilité | B |
| ratio-sharpe | Indicateurs & notions | le Ratio de Sharpe | B |
| ter | Indicateurs & notions | le TER (frais de gestion) | B |
| capitalisation-boursiere | Indicateurs & notions | la Capitalisation boursière | B |
| indice-boursier | Indicateurs & notions | un indice boursier | B |
| rendement-vs-performance | Indicateurs & notions | Rendement vs performance | B |
| inflation | Indicateurs & notions | l'Inflation | B |
| taux-interet | Indicateurs & notions | le Taux d'intérêt | B |
| taux-sans-risque | Indicateurs & notions | le Taux sans risque | B |
| flat-tax | Fiscalité française | la Flat tax | B |
| abattement-pea | Fiscalité française | l'exonération du PEA après 5 ans | B |
| prelevements-sociaux | Fiscalité française | les Prélèvements sociaux | B |
| plus-value-imposable | Fiscalité française | la Plus-value imposable | B |
| plus-value-immobiliere | Fiscalité française | la Plus-value immobilière | B |
| halving | Crypto | le Halving | B |

### 13.6 Les 20 faits exposés dans le module

Ce total est celui du tableau `FACTS` exporté, distinct des statistiques calculées mais non exposées en amont.

| Identifiant | Famille | Catégorie | Marchés |
|---|---|---|---|
| records-1987-pire-seance | chocs | Records de séance | Dow Jones, S&P 500 |
| newton-south-sea-1720 | histoires | Newton et la bulle de 1720 | South Sea Company |
| corrections-27-bear-markets | chocs | Fréquence des corrections | S&P 500 |
| corrections-48-depuis-guerre | chocs | Fréquence des corrections | S&P 500 |
| records-1933-meilleure-seance-dow | chocs | Records de séance | Dow Jones |
| records-2001-nasdaq | chocs | Records de séance | Nasdaq |
| crash-1929 | chocs | Crash historique | Dow Jones |
| crash-2000-2002 | chocs | Crash historique | Nasdaq, S&P 500 |
| crash-2008 | chocs | Crash historique | S&P 500 |
| crash-2020 | chocs | Crash historique | S&P 500 |
| series-9-annees-positives | continuite | Séries d'années consécutives | S&P 500 |
| series-annees-20-pourcent | continuite | Séries d'années consécutives | S&P 500 |
| cac40-record-21-ans | cac40 | Repère historique | CAC 40 |
| cac40-pire-seance-2020 | cac40 | Repère historique | CAC 40 |
| monthly-drawdown-nvidia | actions-historiques | Nvidia : supporter la baisse | Nvidia |
| monthly-drawdown-meta | actions-historiques | Meta : garder ou vendre ? | Meta |
| monthly-drawdown-paypal | actions-historiques | PayPal : attendre son prix d’achat | PayPal |
| monthly-drawdown-euroMoney | obligations-historiques | Monétaire : une érosion qui dure | Monétaire euro (Xtrackers €STR) |
| monthly-drawdown-globalBondEur | obligations-historiques | Obligations : la couverture ne protège pas de tout | Obligations mondiales couvertes EUR (iShares) |
| monthly-drawdown-euroInflationBond | obligations-historiques | Obligations indexées : une protection à comprendre | Obligations euro indexées inflation (iShares) |

### 13.7 Profils DCA et banque de tweets

Le module DCA expose 100 scénarios préparés ; la banque contient 89 textes, avec un repos de 45 jours. La validité financière doit être contrôlée séparément pour chaque texte. Les catégories de banque sont : Storytelling ; Simulation & chiffres ; Guide ETF ; Fiches pratiques ; Bilan patrimoine ; Engagement & débat ; Actu & humour ; Pédagogie.


## 14. Inventaire des workflows et cadences

Lecture des fichiers YAML du commit audité. Les crons GitHub sont en UTC ; leur heure locale Europe/Paris dépend de la saison. Une cadence déclarée ne prouve pas le succès des derniers runs. Les noms sont ceux des fichiers et ne garantissent pas que les effectifs annoncés dans un titre de workflow soient toujours à jour.

| Workflow | Nom déclaré | Cron UTC | Bilan report-failures présent | Concurrency déclarée |
|---|---|---|---|---|
| `automation-status.yml` | Publish automation failures | 23 * * * * | non | oui |
| `collect-etf-pilot.yml` | Update active ETF issuer data | 10 7 * * * | oui | oui |
| `deploy-pages.yml` | Deploy to GitHub Pages | pas de cron | non | oui |
| `probe-bitcoin-monthly.yml` | Free Bitcoin monthly data pilot | 40 6 2 * * | non | oui |
| `refresh-automated-index-sheets.yml` | Refresh fully automated index sheets | 40 6 * * * | oui | oui |
| `review-freshness.yml` | Revue hebdomadaire des données | 0 8 * * 1 | non | non |
| `update-bitcoin-monthly.yml` | Update active Bitcoin Yahoo data | 40 6 2,4,8 * * | oui | oui |
| `update-company-analysis.yml` | Update company analysis | 35 6 * * * | oui | oui |
| `update-economic-data.yml` | Update official economic data | 20 8 * * * | oui | oui |
| `update-editorial-radar.yml` | Update editorial radar | 15 2,6,10,14,18,22 * * * | oui | oui |
| `update-exposure-expansion.yml` | Refresh 35 portfolio exposure ETFs | 45 7 * * * | oui | oui |
| `update-gold-monthly.yml` | Update World Bank monthly gold data | 15 7 3-10 * * | non | oui |
| `update-inflation.yml` | Update INSEE monthly inflation | 15 7 * * * | non | oui |
| `update-instrument-metadata.yml` | Update exact instrument metadata | 20 9 * * * | oui | oui |
| `update-insurance.yml` | Update insurance presentations | 25 7 * * * | oui | oui |
| `update-investor-13f.yml` | Update investor 13F portfolios | 25 12 * * * | oui | oui |
| `update-lifestrategy.yml` | Update Vanguard LifeStrategy data | 35 5 * * * | oui | oui |
| `update-market-monthly.yml` | Update active monthly market histories | 15 6 2,4,8,16 * * ; 45 6 * * * | oui | oui |
| `update-non-bond-expansion.yml` | Update non-bond expansion | 15 7 * * * | oui | oui |
| `update-practical-sheets.yml` | Update practical sheet references | 15 9 * * * | oui | oui |
| `update-presentation-actors.yml` | Update actor presentations | 30 7 * * * | oui | oui |
| `update-publication-observations.yml` | Update publication observations | 40 7 * * * | oui | oui |
| `update-qualified-exposures.yml` | Update qualified exposure ETF data | 50 7 * * * | oui | oui |
| `update-regulatory-data.yml` | Update official regulatory data | 45 8 * * * | oui | oui |
| `update-scpi.yml` | Update SCPI presentations | 20 7 * * * | oui | oui |
| `validate-asset-automation.yml` | Validate asset field automation | pas de cron | non | non |
| `validate-dws-aum.yml` | Validate dated DWS AUM recovery | pas de cron | non | non |
| `validate-global-equities.yml` | Validate global equity connections | pas de cron | non | non |
| `validate-issuer-recovery.yml` | Validate issuer holdings recovery | pas de cron | non | non |
| `validate-non-bond-expansion.yml` | Validate non-bond expansion | pas de cron | non | non |
| `validate-performance-rankings.yml` | Validate performance rankings | pas de cron | non | oui |
| `validate-roadmap-34.yml` | Validate asset roadmap 3 and 4 | pas de cron | non | non |
| `validate-russell-composition.yml` | Validate Russell 1000 printed composition | pas de cron | non | non |
| `validate-sp-public-data.yml` | Validate S&P public composition data | pas de cron | non | non |
| `validate-tool-expansion-round3.yml` | Validate automated tool expansion | pas de cron | non | oui |
| `validate-tool-expansion-round4.yml` | Validate automated expansion round 4 | pas de cron | non | non |

L’absence de `report-failures` n’est pas, isolément, une panne : certains workflows ne collectent pas de données ou utilisent un autre mécanisme. Examiner les étapes, les sorties de validation et la remontée réelle dans le moniteur avant de corriger.

## 15. Validation du présent audit

- `node scripts/audit-asset-tool-routing.mjs` : code de sortie 0, tableau des raccordements sans erreurs.
- `node scripts/audit-broker-evidence.mjs` : code de sortie 0 ; les six cellules partielles restent explicitement limitées.
- `node scripts/audit-calculator-series.mjs` : code de sortie 0 ; le contrôle termine par 490 historiques automatisés actifs avec preuves, conventions et consommateurs partagés validés, puis 141 clôtures Bitcoin contrôlées. Ce nombre porte sur l’audit des séries et n’est pas la métrique `automaticHistories` du rapport de raccordement.
- Import direct des modules de catégories, fiches pratiques, roster, AV, SCPI, acteurs, lexique, faits, DCA et banque : réussi ; les menus de l’annexe proviennent de ces exports.
- Lecture et contrôle des 26 sections documentaires, du calendrier courant et des références techniques.
- Aucun build ni parcours navigateur global exécuté pour cette livraison documentaire. Les sources financières externes n’ont pas été toutes relues ; aucun certificat de conformité juridique ou de validité de toutes les valeurs n’est fourni par ces audits de code.
- Répertoire git resté sans modification fonctionnelle à la fin de la lecture. Ce document n’a pas été poussé dans le dépôt et n’a pas été envoyé à un tiers.
