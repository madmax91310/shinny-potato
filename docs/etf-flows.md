# Où va l’argent des ETF ?

Route : `/flux-etf`. Aucun créneau du calendrier éditorial n’est ajouté ou modifié.

## Décision de collecte, examen du 12 novembre 2026

- Trackinsight : accueil et robots.txt accessibles sans connexion. L’HTML reçu est une coque d’application ; les pages `/services/data-services` et `/en/terms-of-use` n’ont pas livré de conditions ni de contrat de données exploitable dans l’HTML. Aucun contrat d’API publique gratuite autorisant la réutilisation n’a été établi. Ne pas exploiter ses endpoints internes par supposition. Une API de service doit être qualifiée et autorisée avant tout raccordement.
- ETF Express : article historique du [19 octobre](https://etfexpress.com/2026/10/19/european-etf-market-wrap-flows-performance-and-leaders-week-42-2026/) accessible HTTP 200. Il donne explicitement le 12 au 16 octobre, des flux et des performances dans des sections distinctes, et des produits matières premières/crypto sous le terme ETP. Les éléments de flux ne viennent jamais de variations d’encours.
- La recherche publique WordPress `/wp-json/wp/v2/posts?search=European%20ETF%20market%20wrap&per_page=3` a retourné le [récap du 9 novembre](https://etfexpress.com/2026/11/09/european-etf-market-wrap-flows-performance-and-leaders-week-45-2026/), période explicitement annoncée du 2 au 6 novembre. L’API WordPress restitue des articles : ce n’est pas une licence ni une API Trackinsight. Cette recherche n’établit pas une couverture exhaustive de toutes les publications.
- Les [conditions ETF Express](https://etfexpress.com/disclaimer/) interdisent explicitement reproduction, redistribution et dérivés ; aucun droit de réutilisation n’a été obtenu. Après lecture de ces conditions, aucun collecteur périodique d’articles ni stockage intégral n’a été ajouté. robots.txt n’est pas une autorisation de réutilisation.
- Les deux articles ne définissent pas le critère d’appartenance à l’Europe (domiciliation ou cotation) ni les règles de déduplication des cotations. « European ETF activity » ne suffit pas. Une exposition Europe n’est pas un univers de fonds européens. ETF Express attribue ses chiffres à Trackinsight : aucune confirmation indépendante.
- Les dates UTC de publication sont celles du champ explicite `date_gmt` de l’API WordPress, avec URL de métadonnées conservée. La date de récupération correspond à la fin de capture de la réponse. Aucun fuseau n’est déduit du seul champ local `date`. L’interface conserve l’article repéré séparément des observations validées.

**Conclusion : aucune période n’est collectée et validée pour publication.** Le registre de production est vide. Une interface fonctionnelle de saisie structurée remplace la collecte automatique des chiffres, conformément au repli demandé. L’exemple réel daté dans `scripts/fixtures/etf-flows/2026-10-12.json` est minimal, non qualifié, non importé par l’application et systématiquement refusé par le validateur ; ce n’est pas une donnée actuelle.

## Fonctionnement disponible

Le workflow `update-etf-flows.yml` contrôle le registre chaque lundi à 09:35 UTC et sur lancement manuel. Son rapport dit `mode: blocked`, `newEditionAvailable: false`, zéro requête fournisseur et zéro tentative. Un job vert signifie que les contrôles ont fonctionné, **pas qu’une collecte a réussi**. Le rapport est conservé 35 jours ; la raison figure aussi dans l’application. Le contrôle est enregistré dans la surveillance commune comme `validationOnly`, sans publication ni phase de collecte : un contrôle réussi y reste distinct d’une collecte réussie. Aucune date d’observation n’est modifiée par ce contrôle.

Il n’y a pas de relance réseau tant que l’accès et le périmètre ne sont pas qualifiés. Pour activer une future collecte, il faudra obtenir l’autorisation, documenter l’univers exact, ajouter un adaptateur et ses fixtures réelles, puis tester la sélection de dernière période complète, les changements de structure, les corrections et les retards. Prévoir alors trois passages hebdomadaires maximum (lundi, mardi, mercredi) et un timeout réseau ; ne pas appeler ce comportement opérationnel avant son implémentation. Le présent workflow ne prétend pas découvrir de nouvelles éditions.

## Saisie et contrôles

L’interface fournit un modèle JSON et un guide des champs. Les dates de début/fin, preuve de bornes, publication/récupération/validation UTC, devise, univers, types de produits, fournisseur, éditeur, URL, emplacement, droits, catégories originales, montant brut signé, valeur normalisée et preuve par ligne sont obligatoires. La validation humaine de la provenance et de la licence reste nécessaire : un validateur ne prouve pas qu’une autorisation déclarée existe.

- `raw` : `+5,23 MdEUR`, `−81,9 MEUR`, `+100 EUR`, etc. Signe obligatoire, unité explicite, virgule ou point décimal, aucun séparateur de milliers ambigu. `amount` est exprimé en devise entière et doit correspondre au brut. Pas de conversion implicite.
- `basis` : `europe-domiciled` ou `europe-listed`, accompagné de la définition exacte et d’un libellé court. `productTypes` conserve ETF, ETC, ETP. Un univers mixte affiche ses types dans le tweet et l’image.
- `periodKind` : `explicit-range` ou `rolling-1w`. `complete: true` atteste une période complète selon la source (avec preuve). Une 1W doit avoir des bornes sourcées ; aucun renommage en lundi-vendredi. La période ne dépasse pas sept jours et doit être terminée.
- Les dates, devises et univers appartiennent à l’observation complète ; des valeurs de ligne qui tentent de les remplacer sont rejetées. Une seule observation par période et périmètre ; corrections via revue dans une PR, jamais écrasées par l’import.
- Les rubriques et lignes sont facultatives, mais une sélection non vide est nécessaire. Tous les tableaux sont des **sélections** ; aucun rang, somme de catégories ou prétendu top exhaustif.
- Pour une édition actuelle, la fin doit atteindre la dernière semaine lundi-vendredi terminée, sans redéfinir les bornes de la source, et respecter `etf.weeklyFlows` du registre commun de fraîcheur. L’interface réévalue le temps toutes les 30 secondes et au moment des actions. Une semaine ancienne nécessite le mode Archives, conservé dans le titre PNG et le texte. Le contrôle de configuration ne renouvelle jamais `validatedAt`.
- Le texte autorise la modification des phrases, mais garde les faits sélectionnés, la période et le périmètre. Les nouveaux chiffres, changements de signe/unité, classements et certaines interprétations non démontrées bloquent la copie. Une relecture humaine reste obligatoire. Le compteur `twitter-text` applique 280 caractères par défaut ; le mode long exige un compte X compatible, explicitement choisi.
- Texte et image dérivent de la même sélection. Le PNG a une échelle symétrique propre à chaque rubrique, zéro au centre, signes explicites, devise, période et signature. Dix lignes maximum. Les sources restent dans l’interface.

L’import navigateur conserve les observations sur cet appareil via le stockage validé commun. Un refus de stockage, une corruption ou un conflit d’onglets laisse l’existant intact et signale le maintien en session. Garde le JSON d’origine. Il ne modifie ni GitHub ni le site partagé.

Pour une intégration partagée sur une branche :

```sh
node scripts/update-etf-flows.mjs --import /chemin/observation.json
node scripts/test-etf-flows.mjs
```

Le script ajoute atomiquement une observation validée au registre, conserve les anciennes et refuse les doublons. La PR suit le portail de publication existant ; aucun contournement du déploiement ou de ses contrôles n’est introduit. Le workflow bloqué ne committe rien et n’envoie aucun message à un tiers.

## Vérifications

`npm run test:etf-flows` contrôle extraction des signes/unités, dates impossibles, futur, métrique, incohérences, chevauchement de périodes locales, doublons, droits/périmètre, conservation et archives. `npm run test:etf-flows:browser` contrôle le parcours à 1280, 390 et 320 px, l’import réel refusé, les semaines archivées, le texte, la copie et le téléchargement PNG. Le cas positif est un **contrat simulé de test** autour des chiffres historiques, jamais une qualification de l’article ni une donnée livrée à l’application. Le test navigateur est ajouté aux contrôles CI existants.
