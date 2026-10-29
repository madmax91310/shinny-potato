# Photographie JPM indépendante — 29 octobre 2026

Le producteur ordinaire40971293330 a refusé IE0003UVYC20 à l’étape de qualification des positions. La réponse publique réelle acquise ensuite contient246lignes, toutes datées29octobre, comme `dailyHoldingsAll.effectiveDate` et le top ; `fundValuationDate` reste28octobre. Ce dernier champ date un indicateur global que le calcul des positions n’utilise pas.

Le rapprochement porte sur les valeurs de la photographie complète, pas sur cet indicateur indépendant : somme100%, valeur1696228767,33USD, résidu maximal entre poids publiés et ratios des valeurs8,88e-16point. Les positions, options, droits et liquidités conservent leur séparation et leurs poids. Aucune NAV ou valeur du cartouche28octobre n’entre dans ce calcul29octobre.

La qualification utilise donc les dates propres de la liste complète, de chaque ligne et du top, avec les mêmes contrôles d’identité, devise, type de titre, intégralité, poids, montants et dates futures/périmées. La date brute du cartouche reste dans `snapshotDates`, explicitement inutilisée, distincte de `asOf` des positions. Aucun nombre financier, date source, seuil ou image n’est modifié.

La réponse source entière est conservée sans perte et avec SHA256248c16af9b086154904d16aeadbd7bb5a6685148ccda0f93837226c8f693c032. Sept tests HSBC/JPM passent : photographie réelle, idempotence sans mutation, dates de ligne et du top contradictoires, poids ou montants incohérents et date future restent refusés. La collecte GitHub du nouveau code, l’enregistrement, la publication et les consommateurs restent à vérifier séparément.

Ce lot ne modifie ni le lecteur GlobalX de #1031, ni les API/identités WisdomTree de #1059, ni les contrats #968/#1060. Une collecte partielle continue à conserver les dernières valeurs valides des autres sources et leurs dates.
