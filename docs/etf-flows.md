# Où va l’argent des ETF ?

La route `/flux-etf` affiche la dernière édition automatique validée, ses dates et un bouton **Copier le post**. **Générer sur GitHub** ouvre le workflow pour un lancement avec le compte GitHub. La saisie manuelle, l’import qualifié et les archives restent accessibles sous le récapitulatif.

## Collecte et publication automatiques

GitHub Actions démarre le lundi à 6 h, heure de Paris. Des passages de rattrapage sont prévus à 10 h 23, 15 h 23 et 20 h 23 du lundi au mercredi, puis à 10 h 23 le jeudi et le vendredi. Une édition validée est conservée telle quelle et les passages suivants vérifient son empreinte dans le manifeste public. Si la collecte échoue, le registre conserve la dernière période validée. Si `master` a avancé pendant l’acquisition, l’enregistrement rejoue les contrôles lorsque les entrées et lecteurs du producteur restent identiques. Toute modification de ce périmètre impose une nouvelle collecte. Une tentative peut reprendre la publication d’un commit déjà enregistré. Le calendrier, les données, les contrôles et le rendu sont traités par du code déterministe, sans LLM ni service OpenAI.

Le workflow compare les séances attendues au [calendrier NYSE](https://www.nyse.com/trade/hours-calendars). Les jours fériés sont retirés et les séances écourtées sont conservées. L’édition ETFIQ datée doit couvrir toutes les séances, de la première à la dernière, au-delà d’un simple contrôle du vendredi. Chaque JSON quotidien daté doit porter la bonne fenêtre, et le détail des lignes doit se réconcilier avec son total publié. Un fonds doit avoir un relevé quotidien exploitable à chaque séance avec la VL de la clôture précédente. Les absences, suspensions par ETFIQ, relevés groupés et dates de VL périmées sont écartés. Lorsqu’un fonds figure dans le classement hebdomadaire, ses bornes et sa somme USD doivent aussi coïncider. Les flux utilisent le champ net USD publié, sans retraitement des allers-retours signalés par ETFIQ. [Méthode des flux ETFIQ](https://etfiq.com/methodology/flows)

| Bloc | Périmètre |
| --- | --- |
| Pays et zones | Fonds actions cotés aux États-Unis, classés par exposition principale par ETFIQ, avec une ligne par fonds. « États-Unis » additionne les segments de la famille `us-stocks`. Les styles et tailles des ensembles Monde et Actions internationales sont regroupés par zone. La catégorie résiduelle « pays unique ou région étroite » est écartée faute de zone nommée. Les fonds sectoriels, les stratégies spécialisées et les catégories non actions sont hors de ce bloc. |
| Secteurs | Segments de la seule famille `sector-stocks`. Immobilier américain et mondial restent deux catégories ETFIQ. Les thèmes spécialisés et les stratégies à effet de levier n’entrent pas dans le classement sectoriel. |
| Fonds | Univers de cotation américain d’ETFIQ, qui inclut les produits cotés sur les matières premières tels que GLD. Le code classe tous les fonds ayant des relevés complets dans cet univers. Les fonds sans relevé admissible à chaque séance sont absents du classement. |

Les agrégats proviennent de la somme des seuls fonds cotés avec des relevés complets dans ces catégories, en USD. Ils mesurent le flux des fonds affectés à une catégorie, avec un classement dans ce périmètre précis. Ils ne mesurent ni les achats de titres sous-jacents ni l’ensemble du marché mondial. La jointure utilise uniquement les affectations calculées par ETFIQ dans `categories.json` et conserve la date de cette photographie. Cette classification est mise à jour par ETFIQ, donc une reconstitution ancienne requiert une photographie conservée à l’époque. La collecte rejette une classification datée avant la fin de période ou de plus d’une semaine après celle-ci. Le registre conserve les sources, leurs empreintes SHA-256 et les comptes de couverture. [Classification ETFIQ](https://etfiq.com/methodology/categories) · [Licence ETFIQ](https://etfiq.com/license/)

## Agrégats examinés et accès fournisseur

- ETFIQ `flows/aggregates.json` présente une fenêtre 1W du 16 au 20 novembre 2026 et les segments sectoriels. Le 20 novembre, « Technology » agrège 18 fonds dont 16 marqués complets par ETFIQ. Ce total mêle des périodes et n’est pas repris. La série géographique `country` de `flows/index.json` est mensuelle sur base N-PORT. La méthode ci-dessus reconstitue les deux blocs depuis les séances datées et la classification commune. ETFIQ permet la republication de ses propres calculs et classifications avec attribution et lien. Les positions et mesures brutes d’émetteurs ne sont pas republiées. [Agrégats](https://etfiq.com/data/flows/aggregates.json) · [Série pays](https://etfiq.com/data/flows/index.json) · [Licence](https://etfiq.com/license/)
- ORTEX offre les agrégats multi-marchés pour `group=geography` et `group=sector`, `region=ALL`, avec `from_date` et `to_date`, au point d’accès `GET /api/v11/enterprise/bulk/etf/flows/`. Le 403 obtenu avec la clé d’essai exclut cette voie pour la recette. Pour élargir à cet univers, il faut un droit **Enterprise ETF Fund Data / ETF flows** couvrant ces groupes et dates, ainsi qu’une autorisation de republier les agrégats en public. Une clé autorisée serait stockée dans les secrets GitHub. Aucun accès payant n’est nécessaire pour le périmètre ETFIQ. [Endpoint ORTEX](https://docs.ortex.com/v1.1-enterprise/reference/enterprise_etf_flows_retrieve)
- Trackinsight et ETF Express restent des références pour le parcours manuel. La revue du 12 novembre n’a établi aucun droit de réutilisation automatique pour Trackinsight. Les conditions d’ETF Express interdisent la redistribution et ses articles examinés ne documentent pas assez le périmètre de cotation ou de domiciliation. [Conditions ETF Express](https://etfexpress.com/disclaimer/)

## Recette du 16 au 20 novembre 2026

Le [lancement GitHub Actions](https://github.com/madmax91310/shinny-potato/actions/runs/45143976633) a téléchargé l’édition et les cinq relevés, incluant le vendredi 20. Il rapporte 1 440 fonds vérifiés sur 5 131 dans l’univers de référence et 1 508 tickers écartés pour relevés quotidiens incomplets parmi les candidats vus. IVV et SGOV sont exclus car le relevé quotidien du jeudi manque malgré leur classement hebdomadaire complet. SOXL et XLE sont exclus car leur couverture s’arrête avant le vendredi.

| Bloc | Résultat |
| --- | --- |
| Pays et zones | 426 fonds, 5 entrées et 5 sorties. États-Unis premiers des entrées à +2,80 Md$. |
| Secteurs | 71 fonds. Quatre secteurs en entrée et cinq sorties affichées. |
| Fonds | 5 entrées et 5 sorties. TCAF (+2,49 Md$) et SOXX (−3,73 Md$) arrivent en tête. |

Le workflow enregistre uniquement un nouveau lundi validé via `commit-validated-data.sh`, puis utilise `publish-validated-data.yml` et le portail Pages existant. La recette sur branche ne publie rien. Pour la rejouer, lancer **Run workflow** avec le champ `week` égal à `2026-11-16` ou utiliser localement :

```sh
node scripts/update-etf-flows.mjs --preview /tmp/etf-flows.json 2026-11-16
node scripts/test-etf-flows-weekly.mjs
npm run test:etf-flows:browser
```

## Saisie simple

Le formulaire manuel présente les deux liens sources puis un formulaire : dates exactes, URL consultée, périmètre décrit par la source, devise et jusqu’à dix lignes « nom / montant / millions ou milliards ». La virgule, le point et les signes +, - ou − sont acceptés ; les milliers séparés, pourcentages et montants ambigus sont refusés. Une relecture active la copie du tweet et le PNG. Chaque modification annule la relecture.

Aucun JSON ni formulaire de licence n’est demandé dans ce parcours. Les chiffres sont **relevés manuellement**, comme indiqué dans le texte et le visuel, et ne deviennent jamais des observations qualifiées. Aucun statut `validated`, preuve de licence, date de contrôle ou droit de réutilisation n’est fabriqué. La saisie ne doit contenir que les flux nets d’une même période, devise et d’un même périmètre.

Le brouillon possède son propre stockage `el-etf-flows-manual-v1`. Il conserve les dates et valeurs au rechargement, sans conserver la case de relecture. Un brouillon illisible ou modifié dans un autre onglet n’est pas écrasé ; la saisie reste utilisable en session.

## Anciennes observations qualifiées

Le panneau fermé « Anciennes observations qualifiées » ouvre séparément l’ancien atelier, chargé à la demande. Ses observations, import par collage, compatibilité JSON et contrôles de provenance, période, réutilisation et fraîcheur sont préservés. Rien n’est déplacé depuis le brouillon simple vers le stockage qualifié.

Les menus natifs de cet ancien atelier ne sont jamais montés sur l’écran principal. Le test global `noDropdown/flux-etf`, qui avait empêché le déploiement de #1252, reste appliqué sans exception. Le test navigateur couvre les deux parcours à 1280, 390 et 320 pixels : saisie simple, copie exacte, PNG, rechargement, nouvelle relecture, puis ancien import qualifié.

## Import qualifié et contrôles

L’interface fournit un modèle JSON et un guide des champs. Les dates de début/fin, preuve de bornes, publication/récupération/validation UTC, devise, univers, types de produits, fournisseur, éditeur, URL, emplacement, droits, catégories originales, montant brut signé, valeur normalisée et preuve par ligne sont obligatoires. La validation humaine de la provenance et de la licence reste nécessaire : un validateur ne prouve pas qu’une autorisation déclarée existe.

- `raw` : `+5,23 MdEUR`, `−81,9 MEUR`, `+100 EUR`, etc. Signe obligatoire, unité explicite, virgule ou point décimal, aucun séparateur de milliers ambigu. `amount` est exprimé en devise entière et doit correspondre au brut. Pas de conversion implicite.
- `basis` : `europe-domiciled` ou `europe-listed`, accompagné de la définition exacte et d’un libellé court. `productTypes` conserve ETF, ETC, ETP. Un univers mixte affiche ses types dans le tweet et l’image.
- `periodKind` : `explicit-range` ou `rolling-1w`. `complete: true` atteste une période complète selon la source (avec preuve). Une 1W doit avoir des bornes sourcées ; aucun renommage en lundi-vendredi. La période ne dépasse pas sept jours et doit être terminée.
- Les dates, devises et univers appartiennent à l’observation complète ; des valeurs de ligne qui tentent de les remplacer sont rejetées. Une seule observation par période et périmètre ; corrections via revue dans une PR, jamais écrasées par l’import.
- Les rubriques et lignes sont facultatives, mais une sélection non vide est nécessaire. Tous les tableaux sont des **sélections** ; aucun rang, somme de catégories ou prétendu top exhaustif.
- Pour une période calendaire présentée comme actuelle, la fin doit atteindre la dernière semaine lundi-vendredi terminée, sans redéfinir les bornes de la source. Une fenêtre glissante `1W` garde son propre jour de fin et n’est pas soumise à ce repère du vendredi. Toutes les périodes respectent aussi le seuil `dataDays` de `etf.weeklyFlows` dans le registre commun de fraîcheur. L’interface réévalue le temps toutes les 30 secondes et au moment des actions. Une semaine ancienne nécessite le mode Archives, conservé dans le titre PNG et le texte. Le contrôle de configuration ne renouvelle jamais `validatedAt`.
- Le texte autorise la modification des phrases, mais garde les faits sélectionnés, la période et le périmètre. Les nouveaux chiffres, changements de signe/unité, classements et certaines interprétations non démontrées bloquent la copie. Une relecture humaine reste obligatoire. Le compteur `twitter-text` applique 280 caractères par défaut ; le mode long exige un compte X compatible, explicitement choisi.
- Texte et image dérivent de la même sélection. Le PNG a une échelle symétrique propre à chaque rubrique, zéro au centre, signes explicites, devise, période et signature. Dix lignes maximum. Les sources restent dans l’interface.

L’import navigateur conserve les observations sur cet appareil via le stockage validé commun. Un refus de stockage, une corruption ou un conflit d’onglets laisse l’existant intact et signale le maintien en session. Garde le JSON d’origine. Il ne modifie ni GitHub ni le site partagé.

Pour une intégration partagée sur une branche :

```sh
node scripts/update-etf-flows.mjs --import /chemin/observation.json
node scripts/test-etf-flows.mjs
```

Le script ajoute atomiquement une observation validée au registre, conserve les anciennes et refuse les doublons. La PR suit le portail de publication existant ; aucun contournement du déploiement ou de ses contrôles n’est introduit.

## Vérifications

`npm run test:etf-flows` contrôle extraction des signes/unités, dates impossibles, futur, métrique, incohérences, chevauchement de périodes locales, doublons, droits/périmètre, conservation et archives. `npm run test:etf-flows:browser` contrôle le parcours à 1280, 390 et 320 px, l’import réel refusé, les semaines archivées, le texte, la copie et le téléchargement PNG. Le cas positif est un **contrat simulé de test** autour des chiffres historiques, jamais une qualification de l’article ni une donnée livrée à l’application. Le test navigateur est ajouté aux contrôles CI existants.

