# Radar : variantes de réplication iShares

## Cause démontrée dans le code

Le collecteur général `collect_etf_pilot.parse_share` enregistrait `fundMethodologyTypeCode` seul. Le collecteur `collect_qualified_exposures.collect_one` reconstruisait `productStructure + ' (' + fundMethodologyTypeCode + ')'`. Le regroupement daté des deux registres dans `collectObservations` pouvait donc alterner entre leurs représentations. `meaningful` comparait les chaînes brutes et considérait toute différence comme un changement important. Les URL API diffèrent aussi par les composants demandés ; cela ne prouve pas que BlackRock a modifié la méthode financière. La différence de construction locale suffit à expliquer les variantes constatées.

L’état radar-data 645584c9 contient 364 événements, dont **24** allers-retours équivalents (les 19 visibles dans la description de #880 ne sont donc pas tout le périmètre). `replay.json` conserve leurs IDs, valeurs et provenance. La migration les garde dans l’historique avec status `wording-only`, sans les publier ni les renotifier.

## Équivalences et limites

| Avant / après | Traitement |
|---|---|
| Code iShares Replicated / Physical (Replicated) / Physical (Full replication) | physique intégrale, libellés équivalents |
| Code iShares Optimised ou Optimized / Physical (Optimised) / Physical (Optimised sampling) | physique optimisée, libellés équivalents |
| Code iShares Sampled / Physical (Sampled) | physique échantillonnée, libellés équivalents, distincte d’Optimised |
| Code iShares Swap / Synthetic (Swap) | swap synthétique, sans assimiler les variantes funded/unfunded |
| Intégrale / optimisée | méthodes distinctes ; changement conservé |
| Physique / synthétique | structures distinctes ; changement conservé |
| Physical sans précision / intégrale ou optimisée | non équivalentes ; précision non déduite |
| Métal physique / ETF physique intégral | non équivalentes |
| Méthodes inconnues ou variantes de swap non listées | non fusionnées ; restent à examiner |

Les codes courts ne sont interprétés qu’avec un domaine BlackRock ou iShares exact ou sous-domaine, jamais un domaine ressemblant. Le normaliseur ne réécrit pas les preuves sources.

Sources officielles :
- https://www.ishares.com/gls-download/literature/fact-sheet/iuvd-ishares-edge-msci-usa-value-factor-ucits-etf-fund-fact-sheet-en-gb.pdf : Methodology Replicated et Product Structure Physical sont deux champs distincts.
- https://www.ishares.com/gls-download/literature/fact-sheet/sesw-ishares-msci-world-sri-ucits-etf-fund-fact-sheet-en-gb.pdf : même séparation.
- https://www.vanguard.co.uk/professional/vanguard-365/investment-knowledge/etf-knowledge/etf-basics : distinction physique intégrale, sampling/optimisation et synthétique.

## Correctif

Les deux producteurs partagent l’extraction des deux valeurs API originales dans `replicationMethodRaw` et conservent chacun leur convention de libellé existante. La normalisation est centralisée dans le Radar : réécrire le libellé du producteur général aurait créé des signaux supplémentaires non financiers sur les obligations, swaps et métaux. La structure `productStructure` est suivie séparément de la méthode : sa première qualification est silencieuse et une modification ultérieure reste signalée même si le code de méthode ne change pas. Le moteur compare des alias normalisés, actualise silencieusement l’ancre équivalente, conserve les vrais changements et associe leur comparaison normalisée aux preuves originales. Les anciens événements équivalents conservent toutes leurs preuves et leurs IDs, avec une qualification technique séparée.

Les notifications ont une protection indépendante, applicable même avant migration. Le flux exclut les événements wording-only. Le publisher transmet l’historique complet pour corriger les anciens commentaires bot, même quand ces événements ont été exclus de la sélection éditoriale ready. La correction archive le texte original, conserve les marqueurs de reçus et est idempotente. Les commentaires humains restent intacts.

## Compatibilité #898

Au contrôle, #898 est ouverte, prête à revue (plus en brouillon), head fdc8bf4c. Elle modifie le repli sectoriel plus bas dans parse_share, sans modifier la construction des caractéristiques. Le correctif ne reprend aucune de ses autres modifications. Un essai d’intégration est requis avant fusion du correctif.

## Recette

La suite Radar contient les régressions bidirectionnelles, la migration sans perte, les reprises, les domaines trompeurs, les méthodes génériques et inconnues, les vrais changements, la correction de commentaires bot malgré une sélection ready vide et l’idempotence. Les tests Python vérifient la représentation commune et la conservation exacte des deux champs API. Les résultats de CI et de déploiement sont à lire sur la PR associée ; un test local n’est pas une preuve de publication.
