# Bilan consolidé — automatisation, fiabilité et Données à revoir

État vérifié le 24 octobre 2026 après les PR **#920 et #921**, fusionnées sur master. Les corrections déjà publiées, notamment #884/#887/#889 et #912/#913/#914/#917, sont conservées. Les PR indépendantes #903 (guide éditorial) et #919 (logos) n’ont pas été modifiées ni fusionnées dans ce chantier.

Les corrections des collecteurs sont exécutées depuis le code `2f37f75e19c91813d8df37de63da0b6574cc7801`. Le site sert le code applicatif `6124113127807037b1ab765a177ce87788268471` et les données `2bc3a6d199de2ec1ab260bb73985237e97aec06c`. Le reçu public, les artefacts et les vérifications se trouvent dans `preuves/suite-metadonnees/`. Les scripts de collecte ne sont pas assimilés à une nouvelle version du JavaScript affiché.

## Corrections livrées

| Correction | Nature | Résultat démontré |
|---|---|---|
| Hydratation et persistance des 21 séries IA certifiées | Données, lot précédent préservé | Les fragments conservent les vrais points et preuves ; aucune date inventée. |
| Attribution des incidents IA, dates conservées, validation indépendante | Supervision, lot précédent préservé | Les erreurs quotidiennes concernent les Portefeuilles IA ; les calculs et recettes isolés restent en place. |
| Contrôle des métadonnées limité aux vrais champs et instruments du collecteur | Supervision, #920 | **13 mauvaises attributions retirées** avec leur date et cause initiales. Les alertes globales sur les données restent indépendantes. Les identifiants techniques inconnus restent visibles. |
| Lecture du cache distincte d’une consultation réussie | Collecte et supervision, #920 | Le contrôle de fraîcheur n’émet plus de succès source à partir des seules valeurs présentes. Les succès proviennent du collecteur réel. |
| Reprise ciblée, refus des ciblages vides/inconnus | Automatisation, #920 | Une requête invalide échoue avant collecte et écriture. Le test sur branche ne publie pas ; la reprise de production collecte, valide, enregistre et publie. |
| Départ de master actuel après acquisition du verrou | Automatisation, #921 | Une erreur introduite dans la première version du ciblage figeait le SHA du lancement. Le second enregistrement a refusé les conflits, sans publication conflictuelle. La reprise corrigée **40085504061** enregistre et publie sans conflit. |
| Conservation des épisodes découverts après l’audit initial | Suivi consolidé | Un incident absent d’une nouvelle capture ne disparaît plus du bilan. Les retraits d’attribution ne deviennent pas des données réparées ; les origines ne sont pas comptées deux fois. Tests dédiés et génération réelle du suivi exécutés. |

Le producteur GitHub a effectivement renouvelé les six caractéristiques de FR0007054358. Healthcare est renouvelé pour les champs observables et la cotation Paris ; l’ancienne preuve Londres reste au **16/10**. Les deux incidents propres aux métadonnées restent visibles : conflit PEA IE00B0M62S72 et cotation Healthcare Londres non renouvelée. Les réponses officielles complètes et réduites ne renouvellent actuellement que Paris ; aucune radiation ni fermeture de Londres n’en est déduite.

Le run de production **40085504061** termine volontairement en échec global de collecte : `collection=failure`, `validation=success`, `recording=success`, `publication=success`. Son refus de fraîcheur n’est pas maquillé en succès. La reprise manuelle utilise le workflow habituel et les runners GitHub ; le prochain déclenchement cron n’est pas présenté comme déjà observé.

## Bilan chiffré et dénominateurs

- **8 600 provenances héritées conservées**, réconciliées sans perte ; **8 343 enregistrements** du suivi, dont deux nouveaux enregistrements de corrections dans cette reprise. Il s’agit de contrats, capacités, usages, actions et incidents, pas de 8 343 actifs ou pannes indépendantes.
- Reliquat actif : **983 → 969 enregistrements** ; vérifications en attente : **118 → 117**. Les 36 éléments non revérifiés et les limites des 81 modules initiaux restent explicites.
- Moniteur de production : **44 → 30 signaux actifs**. La différence correspond à 13 retraits d’attribution et au contrôle technique du producteur enfin rejoué. Ce ne sont pas 14 données financières réparées.
- Les **19 actions** restent : **11 corrigées, 6 partiellement corrigées, 1 bloquée, 1 déjà résolue**. Ces statuts cumulatifs ne certifient pas toutes les données du catalogue.
- Le suivi sépare désormais **221 retours documentés** et **173 retraits documentés**. L’ancien compteur de 380 épisodes mélangeait ces catégories ; sa variation ne mesure pas de nouvelles réparations financières.

## Les 79 écarts financiers

Les **79 cas sur 50 parts restent ouverts** : 77 causes anciennes et deux résidus de corrections. Les 90 comparaisons originales sur 53 parts et les 175 périodes non comparables sont préservées. Les 72 preuves quotidiennes officielles et sept absences de preuve ne sont pas renommées « 79 écarts expliqués ».

Les **50 véritables fichiers d’historiques servis** ont été relus et comparés aux données attendues, pour les **79 cas**. Les **27 fenêtres NAV indépendantes sur 17 parts** restent admissibles ; les **52 fenêtres de cotation contestées** restent refusées. Les autres périodes qualifiées restent disponibles. Aucune cotation contestée n’est automatiquement réadmise.

Une recherche distincte auprès de la place officielle Euronext a couvert les **13 cas XPAR sur neuf parts**. L’identité, la place et la devise sont contrôlées dans la page publique ; le graphique MAX est lu avec le code de la page, sans réponse simulée ni déchiffrement personnalisé.

- Neuf comparaisons recoupent les bornes de cours bruts Yahoo à leur précision : LQQ 2021/2023/2024, CL2 2021/2024, ESE 2021, PUST 2021, PSP5 2021 et PTPXH 2025. Cela recoupe les cours ; cela n’explique pas la différence avec la NAV.
- Quatre comparaisons présentent encore une différence de cours : ABTC 2024 et 2025, PALAT 2025 et HSBC 50E 2024. Les valeurs, volumes, devises et différences sont individualisés dans `preuves/suite-metadonnees/euronext-13-cas.csv` et intégrés à la vue des 79 cas.
- HSBC : borne finale Euronext **51,04 EUR** contre **51,41 EUR** dans Yahoo. Le fournisseur annonce aussi **1,2623 EUR** les 01/08 et 08/08/2024. C’est une piste de doublon à vérifier dans le journal officiel des distributions HSBC, pas une autorisation de supprimer un dividende. Le rendement de prix et le rendement ajusté restent distincts.
- PALAT : borne initiale **17,565 EUR** contre **17,635 EUR**. Il faut qualifier clôture de valorisation/dernier échange puis les instants NAV. ABTC conserve aussi ses différences de dates NAV, change et split ; aucun rendement USD n’est directement soustrait d’un rendement EUR.

Ces captures constituent une nouvelle preuve de recherche **locale**, pas une nouvelle collecte planifiée qualifiée. Aucune nouvelle source n’est raccordée aux calculs sur cette seule base. Aucun seuil, dividende, convention de change, période ou identité n’est modifié pour supprimer les alertes.

## Vérifications et publication

**1 002 tests Python** passent sur le lot applicatif ; les **10 tests du suivi consolidé** passent après son complément. Les tests ciblés couvrent notamment le ciblage invalide, la conservation des vrais incidents, les identifiants inconnus, l’absence de faux succès de cache, la conservation des dates et la distinction retrait/réparation.

Le contrôle complet **40084758449** réussit ses **15 jobs**, comprenant build, calculs, contrôles Python, exposition, tests navigateur et exports. Le correctif ultérieur de checkout ne modifie aucun code applicatif ou seuil financier ; son build et son véritable producteur sont exécutés dans **40085504061**. La seconde validation complète redondante **40085501782** est annulée ; elle n’est comptée ni comme réussite ni comme panne réparée.

Après publication, quatre PNG des deux fiches concernées sont téléchargés sur le véritable site, sur mobile et ordinateur : **identiques octet pour octet aux références avant publication**. Les textes, la sélection, la devise et les fiches sont vérifiés. Le tableau public affiche exactement les deux incidents métadonnées attendus ; les diagnostics copiés conservent la date Londres au 16/10. Aucun écrit de production ni interception de réponse ne participe à ces parcours.

L’artefact de publication vérifie aussi 571 fichiers publics ; les 50 historiques et les parcours ci-dessus font l’objet de contrôles directs supplémentaires. Aucun portefeuille ni transaction de recette n’est ajouté au registre de production.

## Blocages restants

1. **79 causes/résidus financiers** : pièces manquantes propres à chaque ligne, y compris les nouveaux rapprochements Euronext. La NAV distincte ne répare pas l’ancienne cotation. Aerospace et Mining conservent leurs voies NAV qualifiées ; les anciennes séries ne sont pas déclarées réparées.
2. **Copper et quatre compositions intégrales WisdomTree** : route officielle autorisée exploitable depuis GitHub encore nécessaire ; pas de répétition des mêmes essais 403 ni de recouvrement intégral inventé.
3. **Deux PEA** : conflit IE00B0M62S72 et inconnu IE0003R87OG3, sans nouvelle preuve primaire explicite. Une nouvelle API française BlackRock répond 503 et la route produit testée 404 ; ces échecs ne renouvellent aucune preuve.
4. **FR0007054358** : continuité juridique entre 2001 et 2018 non démontrée ; usages annuels NAV 2020–2025 existants préservés.
5. **Clôtures IA requises du 23/10** : World SWDA.MI et CSPX.L restent au dernier point valide du 22/10. La nouvelle réponse quotidienne de cinq jours contient une date du 23/10 mais des clôtures et ajustés nuls. Des prix horaires ou le dernier prix indicatif ne sont pas substitués à une clôture ajustée qualifiée.
6. **Métadonnées Healthcare Londres**, compositions partielles, chiffres vivants et politiques encore non qualifiés : détails dans le suivi. Les archives, la rédaction et les verrous éditoriaux sont préservés ; le fichier réservé à #903 n’est pas modifié.
7. **Modules et conditions d’accès** : les branches et fournisseurs non vérifiés restent nommés. L’accès au navigateur Euronext ne démontre ni une licence de réutilisation ni une voie automatisée GitHub ; ces points ne sont pas prétendus résolus.

DWS reste expliqué. Les reprises mensuelles HTTP429, les 333 mois TWD, les accès officiels Bourse Direct/IBKR déjà prouvés et le traitement SCPI déjà livré sont conservés. Une échéance SCPI non annoncée ne devient pas une panne.

## Livrables

`suivi-consolide.csv` est le suivi unique ; `statut-19-actions.csv`, `reconciliation-79-ecarts.csv` et `restant-a-verifier.csv` en sont les vues. `bilan.json` donne les dénominateurs et limites. Les sources héritées restent immuables ; les nouvelles preuves et reçus sont séparés dans `preuves/suite-metadonnees/`. Cet état réduit le reliquat ; il ne déclare ni toutes les sources réparées ni le catalogue indépendamment certifié.
