# Uranium : actualiser le sous-ensemble vérifié sans certifier le livre complet

La réponse officielle du13novembre comporte70positions : une ligne de contrat
ZAR sans poids NAV ni valeur, une autre avec zéro explicitement publié, deux
classes Verdera sans identité publiée et59lignes actions. Le notional du contrat
ne permet pas d'en calculer la valeur. Le livre intégral reste refusé.

Le producteur ordinaire peut conserver et renouveler les poids NAV publiés des
actions, avec leur date et leurs identités telles que publiées. Les70positions
brutes, la ligne non valorisée et le zéro explicite sont conservés séparément.
Aucune renormalisation. La projection reste complète=false ; le recouvrement
intégral reste indisponible. Une précédente composition intégrale identifiée
n'est pas remplacée par ce sous-ensemble.

La réussite partielle possède sa propre date. La réussite du livre complet n'est
pas renouvelée et son résultat natif reste en erreur. Une panne ultérieure ne
renouvelle aucune réussite. Une future réponse intégralement valorisée doit
réconcilier chaque poids publié avec la valeur monétaire et le dénominateur du
livre entier avant qualification ; les seuils existants restent inchangés.

Le contrôle PR en lecture seule exerce --only IE000NDWFGA5 dans le producteur
ordinaire et conserve son erreur complète lorsqu'il ne qualifie que le sous-
ensemble. Ce contrôle n'écrit pas en production et ne remplace ni la publication
postfusion ni l'observation d'un passage planifié.

Tests : fixture source réelle, poids manquants actions/liquidités toujours
refusés, contrats FX inconnus non assimilés à zéro, dates et schéma, conservation
sur panne, qualification monétaire future, conservation des autres instruments,
projection et recouvrement refusé, consolidation et invariance à l'ordre.
