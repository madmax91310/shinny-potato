# Sources de secours — vérifications du 8 octobre 2026

## S&P Dividend Aristocrats

Le service JSON public appelé par `index-detail.js` est :
`/spdji/en/util/redesign/index-data/get-performance-data-for-datawidget-redesign.dot`.
La page transmet `indexId` ; le script commun ajoute `language_id=1` à toutes les requêtes.
Sans ce dernier paramètre, le service peut répondre 400. Les indices exacts sont
92388578 (Global Quality Income) et 5475610 (Euro High Yield).

Les deux réponses réelles fournissent la composition effective du 30 septembre 2026,
90 et 40 titres respectivement. Pays et secteurs totalisent 100 % ; les dix poids
individuels concordent avec le poids cumulé publié (17,62 % et 37,14 %).
Le lecteur contrôle identité exacte, devise, dates d'effet de chaque ligne, comptage,
classification GICS et totaux. Les rendements NET restent issus de leur source distincte.
Le JSON devient la source primaire de composition ; aucune lecture OCR n'est nécessaire.
Une réponse ambiguë ou inaccessible conserve le dernier relevé selon le collecteur existant.
Le workflow dédié teste les téléchargements réels sur GitHub Ubuntu 26.04 et macOS 15.
Verdict du run 37828387974 : les tests du lecteur passent sur les deux systèmes,
mais le téléchargement reste en HTTP 403 sur les deux runners, même avec les
headers de navigateur et le Referer officiel. Changer simplement de système ne
résout donc pas le problème. Le lecteur ne constitue pas à lui seul une correction
opérationnelle du 403 ; aucune photographie active n'a été publiée par cette PR.

Deux chemins opérationnels restent possibles : importer ponctuellement une réponse
publique téléchargée dans un environnement autorisé, avec les mêmes contrôles et
une date de photographie explicite ; ou exécuter la collecte sur un environnement
dont l'accès S&P est confirmé, puis faire valider ses observations par la CI GitHub.
Pour une automatisation durable, obtenir un accès API documenté auprès de S&P
permettrait de ne pas dépendre de cet endpoint public et de ses restrictions.

## QYLD IE00BM8R0J59

La page actuelle `https://globalxetfs.eu/funds/qyld` expose ses documents dans les
messages JSON React (`self.__next_f.push`). Le type `Factsheet` donne notamment
`https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1`.
Ce lien doit être redécouvert depuis la page, puis le PDF contrôlé par identité,
date, devise et périmètre. Le lien historique `/content/files/QYLD_UCITS-factsheet.pdf`
répond 404. Le nouveau lien FundAssist répond 500 lors des essais, avec et sans
le double slash et avec des en-têtes PDF usuels : ce n'est pas encore une source qualifiée.

Le CSV `/api/funds/qyld/topholdingscsv` ne fournit actuellement aucune position,
seulement une phrase légale. Les performances structurées de la page contiennent
des périodes glissantes, un YTD et une liste `discrete` vide ; elles ne constituent pas
un calendrier annuel de la part distribuante. Les deux top dix visibles divergent.
Les secteurs affichés restent incohérents ; le panier de substitution est exclu.

Solutions possibles à qualifier : fiche officielle redécouverte et rétablie ; document
PRIIPs de performances passées de l'ISIN exact ; ou historique complet de VL USD avec
distributions officielles permettant de reconstruire un total return réinvesti.
Le rendement de la part capitalisante ou de l'indice ne remplace pas celui de cette part.

## Russell 1000

La fiche `US1000USD` du 30 septembre 2026 fournit 1 022 titres et les noms du top dix,
mais aucun poids individuel. Les onze poids sectoriels sont imprimés dans un graphique
raster avec légende colorée ; l'extraction texte ne conserve pas ces poids.
La fiche `D41430` concerne Equal Weight : sa composition ne peut pas être utilisée.
La fiche officielle de qualification 871(m), datée janvier 2026 avec données du
30 décembre 2025, ne fournit que le poids de la première valeur et des agrégats.

Pistes : une table numérique explicitement intitulée Russell 1000 Benchmark chez
un émetteur, ou une extraction du graphique associant chaque étiquette à sa couleur
avec contrôle à deux résolutions. Une lecture OCR des seuls nombres ne suffit pas.
Une composition d'ETF peut être proposée comme proxy clairement identifié, mais ne
doit jamais être stockée comme une composition exacte de l'indice.
La pondération des dix premières valeurs reste à trouver dans une publication numérique.

La fiche Vanguard `https://fund-docs.vanguard.com/F3348.pdf` téléchargée le 8 octobre
est datée du 30 juin 2026. Le comptage comporte une colonne Russell 1000 Index,
mais les secteurs et dix premières positions décrivent le fonds VONE : ce PDF
ne résout pas les poids exacts actuels de l'indice. La page Vanguard Advisors
propose des colonnes Fund/Benchmark à vérifier sur sa source numérique ; elle
reste une piste, pas une source qualifiée par cette PR.
