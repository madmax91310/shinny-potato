# Reprise ciblée — Nikkei 225, 26 octobre 2026

Lot en validation, non encore annoncé publié. Master `9e59c99` et #984 intégrés ; #985 documentaire examiné sans recouvrement. #968, #976, #977 et #981 préservés.

- Donnée réparée par une voie indépendante : `LU2196470426`, nouvelle série `etfLU2196470426Nav`, NAV capitalisée native JPY convertie en EUR par les changes mensuels BCE existants. Lancement exact le 27/10/2020 ; 72 mois complets disponibles d’octobre 2020 à septembre 2026. Dernière NAV le 23/10/2026, change quotidien du même jour pour l’anniversaire.
- Preuve fournisseur réelle dans GitHub : [run 40364575719](https://github.com/madmax91310/shinny-potato/actions/runs/40364575719), lancement manuel ciblé sur un seul identifiant, artefact `12669867066`. Les cinq rendements annuels quotidiens recoupent la précision publiée. En 2025 : 28,242014835 % natif contre 28,24 % publié ; la devise du tableau est explicitement JPY. Aucun dividende ajouté à la part capitalisante.
- Enregistrement initial : valeurs, dates et empreintes du rapport GitHub reprises sans retouche dans les registres communs. Le producteur mensuel ordinaire possède la nouvelle série et ses reprises ; son prochain passage planifié n’est pas encore observé pour cette voie.
- Usages vérifiés localement : Calculateur / Et si tu avais investi (versement unique et DCA), Performance depuis, comparaison Qui a vraiment gagné et Il y a X ans. Le calendrier annuel était déjà disponible dans le classement annuel ; ce n’est pas un ajout. Le calendrier JPY est désormais utilisable par Performance depuis via sa conversion existante, sans admission nouvelle dans les portefeuilles.
- Sur les **79 fenêtres suivies**, les moteurs réels passent de **42 à 43 fenêtres mensuelles qualifiées**, et de **78 à 79 pour Performance depuis**. **36 fenêtres sans voie mensuelle qualifiée restent ouvertes**. Les 77 anciennes causes inexpliquées et deux résidus ne sont pas clôturés. La cotation XNKY.DE 2025 reste refusée ; ses autres périodes valides restent conservées.
- Tests : 1 168 tests Python avant la dernière régression de contrat, puis six tests ciblés DWS ; calculs/FX/qualifications et build avec 4 274 certificats réussis. Douze PNG téléchargés localement : quatre calendriers EUR/USD ordinateur/mobile, huit parcours NAV ordinateur/mobile. CI et consommation publique doivent encore être vérifiées avant clôture de ce lot.

Preuves séparées : [collecte GitHub](preuves/reprise-20261026/nikkei-github-40364575719/nav.json), [provenance](preuves/reprise-20261026/nikkei-github-qualification.json), [79 usages avant](preuves/reprise-20261026/usages-79-moteurs-avant-nikkei.json), [79 usages après](preuves/reprise-20261026/usages-79-moteurs-apres-nikkei.json). Les captures et bilans antérieurs sont conservés ci-dessous comme états datés.

---

# Livraison consolidée — reprise du 26 octobre 2026

Les PR [#969](https://github.com/madmax91310/shinny-potato/pull/969), [#976](https://github.com/madmax91310/shinny-potato/pull/976) et [#977](https://github.com/madmax91310/shinny-potato/pull/977) sont fusionnées. #976 est publié et vérifié ; #977 est fusionné en `6952918e` et sa publication est encore en contrôle à cette capture. Les PR concurrentes #979/#980 sont ouvertes et leurs fichiers ne sont pas modifiés.

| Outil / chaîne | Résultat démontré | Limite conservée |
| --- | --- | --- |
| Présentation d’ETF / Actifs et exposition — ACWI IE00B6R52259 | Pays/secteurs reconstruits sur toutes les positions classifiées du fonds physique, sans renormalisation ; collecteur GitHub ordinaire 40316075629 ; quatre PNG publics ordinateur/mobile | Tables primaires nulles explicitement en erreur ; identité de 0,0001 % non qualifiée, recouvrement complet non admis |
| Il y a X ans — FR0007054358Nav | Historique de prix hors distributions corrigé ; rendement réinvesti préservé ; six/sept ans vérifiés et douze PNG publics avec calculateur, DCA et Performance depuis | N’est pas un cours de bourse ; les cotations originales et réserves antérieures demeurent |
| Calculateur / Duels — HEAL IE00BYZK4776 | Identité London/USD exacte renouvelée par la nouvelle référence officielle LSE ; Paris/EUR préservé ; quatre PNG publics ; dernier contrôle de cotation retiré des raccordements en retard | Les autres capacités et preuves par usage ne sont pas certifiées par cette seule identité |
| Métadonnées partagées | Conservation des cotations par MIC/ticker/devise et de leurs propres dates lors d’une réponse partielle ; collecteur, projection et relecture d’archives corrigés | Cas partiel naturel non observé dans la recette GitHub ; scénarios défaillants vérifiés en isolation ; publication #977 encore à confirmer |
| Or / historiques mensuels | Reprises ordinaires 40292128783 et 40316075107 : collecte, enregistrement et publication réussis ; refus antérieurs sur entrées incompatibles conservés | Lancement manuel/push ne prouve pas un premier cron post-correction |
| Historiques des 79 cas suivis | Cinq fenêtres annuelles mensuelles supplémentaires qualifiées dans #969 ; 42/79 disposent désormais d’une voie utilisable, 37/79 restent refusées | 77 causes anciennes encore ouvertes et deux résidus ; une voie NAV ne démontre pas la cause d’une cotation divergente |

**Réconciliation du périmètre :** 121 diagnostics initiaux conservés individuellement dans [la matrice de qualification](preuves/reprise-20261026/qualification-perimetre-initial.csv). Au relevé public après #976 : **120/121 encore présents**, 25 contrôles en retard contre 26 initialement ; la preuve HEAL a été renouvelée. Les 120 comprennent 70 raccordements/identités manquants, 29 pannes ou contrôles non renouvelés, 17 qualifications documentaires et quatre conflits. Ce sont les catégories des diagnostics initiaux, pas une certification nouvelle de toutes les chaînes. Les milliers de contrats consommateurs ne sont pas comptés comme autant de pannes. Le parcours public Données à revoir et ses exports ont été exercés sur ordinateur/mobile, sans simulation du moniteur.

**Blocages :** les quatre compositions complètes WisdomTree restent HTTP 403 dans GitHub (dernière exécution ordinaire 40316075190). Defence a 42 identités qualifiées indépendamment, sans que cela rétablisse la collecte fournisseur ; Cloud localement publié n’est pas davantage une réussite GitHub. Copper, conflits PEA et fenêtres financières non qualifiées restent ouverts. La page QYLD rendue dans un véritable navigateur confirme 20 lignes et sept poids contradictoires pour un même top 10 daté, avec une performance intitulée USD Accumulating pour la part distribuante demandée : aucune table n’est sélectionnée arbitrairement.

**Tests :** #976 : 1 157 tests Python, build et contrôles CI réussis ; #977 : 91 tests métadonnées, dont conservation partielle, panne, ordre des dates et les trois points d’entrée réels, build et contrôles CI réussis. Vingt PNG ont été téléchargés depuis la production pour les trois usages réparés ; les captures et preuves sont dans le dossier de reprise. Aucun seuil, maquette, donnée réelle de recette ou composant exclusivement Portefeuilles IA ajouté. #968 reste acquis ; les deux anciens périmètres inconnus sont historiques. Le chemin imbriqué #966 ne devient pas une preuve fournisseur.

[Rapport détaillé](RAPPORT.md) · [Matrice initiale réconciliée](preuves/reprise-20261026/qualification-perimetre-initial.csv) · [79 cas](reconciliation-79-ecarts.csv) · [19 actions](statut-19-actions.csv) · [Reliquat](restant-a-verifier.csv). Le bilan des 19 actions reste **10 corrigées, cinq partielles, une bloquée, une déjà résolue et deux périmètres supprimés**. L’automatisation complète n’est pas annoncée.

Les captures historiques ci-dessous restent conservées ; leurs compteurs ne remplacent pas le relevé actuel.

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
