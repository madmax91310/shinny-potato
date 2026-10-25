# Données communes — bilan consolidé actualisé

Capture du 2026-10-25T11:01:14.344510+00:00 : code `cee7add210c57dcb8c28d7b199ab2e5a6f131802`, données `1b3b0d92d1ed11910d910ef02796f9ac187696a4`. Le suivi reste celui du 24 octobre, prolongé des corrections et preuves du 25 ; aucun audit concurrent ni catalogue IA n’est créé. Les constats antérieurs gardent leurs preuves datées. **L’automatisation complète reste non démontrée.**

## Réparations et usages rétablis

[#939](https://github.com/madmax91310/shinny-potato/pull/939) qualifie trois voies Amundi et corrige la conservation erronée d’un ancien niveau quotidien lorsque les mois sont inchangés. [#943](https://github.com/madmax91310/shinny-potato/pull/943) qualifie cinq voies iShares, distingue rendement réinvesti et prix hors distributions, et répare le débordement du libellé Communication dans le classement annuel étroit. Les ajustements sont fournis par l’émetteur, recalés sur une NAV par part à la même date et recoupés avec les calendriers et distributions officiels ; aucune NAV n’est présentée comme cours de bourse.

| Part exacte | Instrument existant | Fenêtres annuelles rétablies parmi les 79 | Devise de calcul |
| --- | --- | --- | --- |
| FR0011871110 | Amundi PEA Nasdaq-100 | 2021 | EUR |
| FR0011871128 | Amundi PEA S&P 500 | 2021 | EUR |
| FR0013416716 | Amundi Physical Gold ETC | 2025 | EUR, NAV native USD |
| IE00B1XNHC34 | iShares Global Clean Energy | 2020 | EUR, NAV native USD |
| IE00B2QWCY14 | iShares S&P SmallCap 600 | 2023, 2024, 2025 | EUR, NAV native USD |
| IE00B4556L06 | iShares Physical Palladium | 2025 | USD |
| IE00BJ5JP097 | iShares World Financials | 2023 | USD |
| IE00BJ5JP436 | iShares World Communication Services | 2024 | USD |

Des voies NAV annuelles existaient déjà pour certaines parts ; elles restent distinctes et ne sont pas recomptées comme nouveaux actifs. Pour ces fenêtres du parcours mensuel : calculateur (versement unique et DCA), Performance depuis, comparaison et classement annuel disposent de la voie mensuelle qualifiée. Les sélecteurs, calculs, textes, images et téléchargements concernés ont été exercés. Le classement conserve les couleurs fixes, ex æquo et années complètes. Les règles des portefeuilles et leurs voies NAV annuelles antérieures sont conservées ; aucun nouvel actif ni rôle automatique n’est admis dans ce lot.

Pour Il y a X ans, les quatre parts distribuantes utilisent leurs NAV historiques publiées hors distributions et un niveau courant de même convention ; le rendement réinvesti reste réservé aux calculs de performance. Les trois parts Amundi et le Palladium sans revenu utilisent les voies qualifiées correspondantes. Cela ne certifie aucune date quotidienne arbitraire : le produit utilise ses observations mensuelles et bornes réellement disponibles.

Sur les **79 fenêtres**, le bilan passe de **52 refusées / 27 qualifiées** à **42 refusées / 37 qualifiées**, sur **25 parts** disposant d’au moins une de ces fenêtres qualifiées, contre 17 avant cette reprise. Les 79 causes originales sur 50 parts restent ouvertes. Les 90 comparaisons et 175 périodes non comparables antérieures restent conservées, sans seuil modifié. Les pièces et consommations courantes sont séparées dans [les 79 lignes](reconciliation-79-ecarts.csv).

**Refus supplémentaire hors des 79 : Palladium, décembre 2014.** Les composants NAV et rendement officiels ne se rapprochent pas en unités. Seules les fenêtres qui utilisent ce mois sont refusées, notamment les années nécessitant cette borne. Les mois indépendamment qualifiés, dont 2025, restent disponibles. Un contrôle source réussi ne supprime pas cette qualification manquante. Une récupération ultérieure prouvée peut lever la restriction : le producteur enregistre aussi les ensembles de restrictions explicitement vides.

## HSBC : explication, idempotence et limite

Les rapports fiscaux de la part IE00B4K6B022 publient 0,2214 EUR au 01/02/2024 et 1,2623 EUR au 08/08/2024 sans libeller explicitement le détachement. Deux sauts du fournisseur reproduisent chacun 1,2623 EUR, aux 01/08 et 08/08. Les avis publics Euronext comprennent un effet au 01/08 et deux avis au 08/08 ; l’annulation ou le remplacement du premier n’est pas démontré.

| Recherche contrefactuelle, jamais appliquée | Rendement 2024 | Résidu face au NAV arrondi 11,6 % | Deuxième application |
| --- | --- | --- | --- |
| Retrait du facteur du 01/08 | 11,721920317 % | +0,121920317 point | Aucun changement |
| Retrait du facteur du 08/08 | 11,599027126 % | −0,000972874 point | Aucun changement |

L’égalité approchée avec le NAV ne décide pas quel facteur est erroné. La série officielle du portail HSBC comporte 4 269 observations dans un contexte XPAR/EUR, mais est libellée « Price », sans qualification suffisante NAV/rendement ; elle n’est pas raccordée comme substitut. Restent à prouver : détachement exact, relation entre avis, nature de Price et bornes de valorisation. [Calcul et hypothèses](preuves/autonomie-commune/hsbc-ajustement-2024.json), [avis publics](preuves/autonomie-commune/hsbc-notices-qualification-20261025.json), [série du portail](preuves/autonomie-commune/hsbc-portail-qualification-20261025.json).

## Matrice, pannes et preuves mutualisées

Le dénominateur courant est **31,718 contrats champ/série × outil**, **23 outils financiers**, **3,544 profils/identifiants** et **671 ISIN**. Les profils, alias et couples outil ne sont pas des actifs uniques. La [matrice](matrice-donnees-usages.csv) et le [bilan](matrice-bilan.json) distinguent les valeurs présentes des preuves fines jointes au producteur, au blob publié et au consommateur.

| Nature du diagnostic dans cette capture | Contrats |
| --- | ---: |
| non applicable | 3,725 |
| preuve documentaire ou qualification incomplète | 27,946 |
| raccordement manquant | 39 |
| défaut réel de donnée ou de collecte | 8 |

Cette classification ne certifie pas que tous les contrats documentaires fonctionnent : une qualification non démontrée reste ouverte. En particulier, un B ne devient ni panne certaine ni réussite automatique. Les fenêtres contestées et leurs causes financières restent suivies séparément, sans bloquer toutes les périodes d’une part.

Les défauts de collecte ciblés dans cette vue concernent les compositions intégrales WisdomTree : quatre sources refusées et plusieurs consommateurs pour une même panne, pas une panne par champ. Les [contrôles mutualisés](collectes-controles.csv) regroupent workflow, exécution, rapport et liste exacte d’identifiants observés ; une portée de champs absente reste inconnue. Les succès d’un producteur entier et les consultations de cache ne prouvent pas tous ses champs.

## Exécutions, publication et limites

Les preuves GitHub et parcours réellement publics sont dans [les exécutions](preuves/reprise-20261025/github-validations.json) et [les consommateurs](preuves/reprise-20261025/consommateurs-publics.json). Elles distinguent tests isolés, collecte réelle dans GitHub, lancement manuel/push, passage planifié et adoption effective des valeurs. Les nouvelles données des producteurs ordinaires doivent être rapprochées des empreintes publiques ; une étape verte seule ne vaut pas publication.

La dernière liste des événements planifiés observables est conservée dans les preuves. Aucun premier cron post-correctif absent de cette liste n’est revendiqué. Les passages ordinaires lancés manuellement ou par push restent nommés comme tels. L’ancien échec mensuel après changement concurrent des entrées est conservé : le garde impose une nouvelle collecte, sans autoriser un écrasement périmé. Les dates de contrôle et de donnée ne sont pas confondues.

Le run mensuel 40178244234 a effectivement contrôlé 665 séries ; huit disposent d’un périmètre de champs explicitement déclaré dans ce rapport, les autres périmètres de champs restent inconnus. Son acquisition et sa validation ont réussi, mais l’enregistrement a échoué après #945 : ces sorties ne sont pas déclarées publiées. Le correctif #946 traite les quatre lecteurs Radar indépendants et maintient reconstruction et revalidation ; La reprise complète 40181551320 a réussi auparavant : collecte réelle, build, enregistrement 0f44f94 et publication. Elle prouve la reprise, sans prétendre exercer une collision post-#946. Le correctif #946 est fusionné au commit 52f59a8 ; ses 30 scénarios Git et sa CI sont verts, mais une nouvelle collision réelle Radar n’a pas été provoquée en production.

Le contrôle Healthcare a réellement vérifié les caractéristiques et la cotation Paris/EUR ; l’ancienne preuve London/USD reste datée, puisque la réponse officielle actuelle ne l’expose plus. Le run global partiel n’est pas qualifié de réussite générale. Le collecteur ETF peut également conserver son incident sectoriel CSPX lorsque seule la voie de repli déjà qualifiée fonctionne ; aucun seuil n’est relâché.

Les limites restantes comprennent : 42 fenêtres de ces 79 encore refusées ; sept preuves quotidiennes non qualifiées ; Copper et quatre compositions complètes WisdomTree sans voie autorisée démontrée dans GitHub ; deux états PEA inconnus/conflits ; continuité FR0007054358 non prouvée. Une échéance SCPI non annoncée reste une attente documentaire normale. Les composants économiques incomplets, les chiffres vivants et modules non vérifiés gardent leur motif dans le reliquat ; cette livraison ne les certifie pas.

## Suivi et non-régressions

Les 8 600 origines restent réconciliées. Les 19 actions demeurent : **10 corrigées, 5 partielles, 1 bloquée, 1 déjà résolue et 2 périmètres supprimés**. Le passage antérieur 12→11 venait de P2-04 rouvert pour stockage/validation IA ; après #923, P2-04 et P1-01 sont retirées comme périmètre supprimé, sans être renommées données réparées. Les nouveaux usages NAV ne ferment pas globalement P0-02.

Les 25 workflows communs planifiés sont préservés ; le registre de supervision contient 24 entrées (23 planifiées et Pages). Deux planifiés sont hors de ce registre : publication du moniteur et sonde Bitcoin ; avec la publication validée non planifiée, la table décrit 27 workflows, et non 27 fournisseurs. Les références de modules et vérifications non démontrées sont conservées dans le suivi.

Les corrections #936/#937/#938 sont intégrées, avec les changements concurrents #940/#941/#942/#944/#945 ; #946 est fusionné et #947 est laissé à son propriétaire Radar. Les registres communs ne changent que pour les huit instruments qualifiés ; les autres actifs et règles de portefeuille restent préservés. Aucun élément exclusivement Portefeuilles IA n’est restauré. Les 82 téléchargements PNG des outils financiers en production sont documentés dans preuves/reprise-20261025/consommateurs-publics.json ; les 84 images incluent deux captures supplémentaires. Les tests couvrent absence de changement, observation hors ordre, fenêtres invalides/valides, devises et conventions, double dividende, restrictions partielles, reprise et rendu/export. Les builds gardent les budgets et 4 274 certificats de champs. Les scénarios synthétiques sont séparés des collectes fournisseur.

[Livraison](LIVRAISON.md) · [Matrice](matrice-donnees-usages.csv) · [Chaînes](chaines-donnees.csv) · [Contrôles mutualisés](collectes-controles.csv) · [Suivi unique](suivi-consolide.csv) · [19 actions](statut-19-actions.csv) · [79 divergences](reconciliation-79-ecarts.csv) · [Reliquat](restant-a-verifier.csv).
