# Livraison en cours — 26 octobre 2026

La PR [#976](https://github.com/madmax91310/shinny-potato/pull/976) est fusionnée en `d221df0b` ; publication encore à vérifier à cette étape. Tous ses contrôles généraux sont réussis. Les quatre compositions WisdomTree restent refusées dans GitHub, y compris la nouvelle route Defence ; les tests locaux ne les transforment pas en automatismes rétablis.

- ACWI : répartition géographique/sectorielle réparée sur positions classifiées, vérifiée dans le collecteur GitHub et les exports desktop/mobile. Les deux tables primaires restent en erreur ; recouvrement complet non qualifié.
- Euro Stoxx 50 II NAV : prix historiques hors distributions corrigés pour Il y a X ans, performances réinvesties préservées ; tests et PNG à six/sept ans.
- HEAL : preuve exacte London/USD renouvelée localement et dans GitHub ; cours et conventions conservés, calculateur/Duels et quatre PNG vérifiés.
- Or et mensuel : reprises ordinaires enregistrées/publiées vérifiées dans le moniteur ; protection contre les conflits master conservée.
- Suivi dépendant : conservation de chaque cotation lors d’un résultat partiel, sans renouveler artificiellement les dates. 90 tests métadonnées, dont recette isolée du véritable producteur ; aucune panne volontaire en production.

Les 121 diagnostics initiaux restent identifiés individuellement dans [la qualification](preuves/reprise-20261026/qualification-perimetre-initial.csv). Les 79 cas financiers gardent leurs preuves : 42 fenêtres ont une voie mensuelle utilisable, 37 restent refusées ; 77 causes ouvertes et deux résidus ne sont pas clôturés par les voies alternatives. Les 19 actions ne sont pas recomptées artificiellement.

Le bilan du 25 octobre ci-dessous reste une capture historique.

---

# Livraison consolidée — 25 octobre 2026

PR de correction : [#939](https://github.com/madmax91310/shinny-potato/pull/939), [#943](https://github.com/madmax91310/shinny-potato/pull/943) et [#946](https://github.com/madmax91310/shinny-potato/pull/946). #936/#937/#938 et les changements concurrents #940/#941/#942/#944/#945 sont conservés ; #947 est un chantier Radar distinct sans recouvrement des rapports. Version observée : code `cee7add210c57dcb8c28d7b199ab2e5a6f131802`, données `1b3b0d92d1ed11910d910ef02796f9ac187696a4`, capture 2026-10-25T11:01:14.344510+00:00. La suppression #923 reste effective.

**Résultat : dix fenêtres rétablies sur huit parts existantes.** Sur les 79 fenêtres annuelles suivies : 52 refusées / 27 qualifiées avant cette reprise, 42 refusées / 37 qualifiées après. Les **79 causes des anciennes divergences restent ouvertes sur 50 parts** ; une voie NAV indépendante ne répare ni n’explique la cotation originale.

- Calculateur / Et si tu avais investi, Performance depuis et les deux formats de Qui a vraiment gagné : voies mensuelles/annuelles NAV réinvesties qualifiées pour les fenêtres indiquées dans le rapport.
- Il y a X ans : niveaux courants NAV automatisés et canal historique de prix distinct pour les quatre parts distribuantes. Aucun dividende ajouté au rendement déjà réinvesti.
- Défaillance réparée : un historique mensuel inchangé ne conserve plus une ancienne observation quotidienne au détriment de la nouvelle NAV validée. Les dates régressives restent refusées, même après recalage des niveaux.
- Le refus supplémentaire de décembre 2014 sur Palladium, hors des 79 cas initiaux, reste explicite ; les autres périodes qualifiées sont conservées.
- HSBC : deux hypothèses idempotentes, deux résidus séparés ; aucune correction de prix appliquée sans preuve du détachement/remplacement de l’avis.

La matrice recense **31,718 contrats sur 23 outils, 3,544 identifiants/profils et 671 ISIN**. Ses B sont des contrats de preuve/qualification, pas autant de pannes. Les contrôles mutualisés précisent les instruments et champs réellement vérifiés. Les blocages externes, preuves quotidiennes manquantes et premiers crons post-correctif non observés restent ouverts : **l’automatisation complète n’est pas démontrée**.

[Rapport et réserves](RAPPORT.md) · [Matrice unique](matrice-donnees-usages.csv) · [Contrôles mutualisés](collectes-controles.csv) · [79 cas](reconciliation-79-ecarts.csv) · [19 actions](statut-19-actions.csv) · [Reliquat](restant-a-verifier.csv).
