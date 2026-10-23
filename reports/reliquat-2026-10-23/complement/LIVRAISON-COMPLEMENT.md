# Complément : périmètre des encours DWS et enregistrement des observations

Base : master `d46f533`, contenant #887 (`a0e1ca2`), puis actualisation des courtiers `a0d2240`. Les ajouts IA de #888 sont conservés dans le rapprochement avec master ; ce complément ne les modifie pas.

## Champ financier DWS qualifié

Le champ courant **Total AUM of fund** publie explicitement son montant, sa devise et sa propre date. Il devient la source du collecteur, sans dépendance à l’export historique. Le panneau NAV, la devise de la part et la devise de l’encours sont séparés : les trois parts restent en USD ; les totaux publiés par l’émetteur dans cette vue sont en GBP, avec conversion Reuters 16 h indiquée par DWS. Les maquettes conservent leur présentation et affichent la devise financière correspondante.

Exécutions réelles du 23 octobre, données du 22 octobre :

| Part | Total du fonds explicitement publié |
|---|---|
| Industrials IE00BM67HV82 | 1,00 milliard GBP |
| Utilities IE00BM67HQ30 | 705,12 millions GBP |
| World 1D IE00BK1PV551 | 23,33 milliards GBP |

La colonne générique « Asset Under Management » de l’export ne permet pas d’identifier universellement fonds ou part. Pour World 1D, la nouvelle proposition de 6,299 milliards USD a déclenché la protection de variation contre 31,270 milliards USD conservés ; le panneau officiel total fonds montre 23,33 milliards GBP. Le double NAV publié (131,24 USD / 98,20 GBP) place ce total autour de 31,18 milliards USD, nettement distinct de 6,299 milliards. Ce calcul sert à qualifier l’incompatibilité des périmètres, pas à produire une donnée de conversion à publier ni à affirmer que la colonne représente une part.

L’export reste archivé avec un périmètre **non qualifié**. Le moteur refuse son application à un encours actif. Les seuils de variation et de performances sont inchangés. Le décalage observé Utilities (export au 21 octobre, panneau NAV au 22) est aussi conservé dans les captures ; l’encours courant ne reprend plus une date NAV par supposition.

Seuls les trois champs d’encours sont renouvelés après une récupération réelle. Les performances, caractéristiques et compositions déjà livrées restent inchangées. Les réponses brutes et les observations avant/après sont conservées séparément.

## Reprise après changement de master

Les huit SCPI et la répartition Iroko ont réussi dans `39917620412`, puis le commit a été refusé après l’actualisation d’assurance-vie `d46f533`. Même refus d’enregistrement du producteur quotidien `39917620235`. Les deux producteurs revalident maintenant l’arbre combiné pour une liste explicite de données financières indépendantes. Un changement de collecteur, de workflow, de dépendance, d’historique ou des observations propres impose toujours une nouvelle collecte. Tests financiers, build et invariance des observations précèdent toute publication.

Six courses Git réelles isolées couvrent la conservation des deux mises à jour et les refus de changement d’entrées ou de validation en échec. Les deux contrats complets ont réussi sur un worktree après une modification de mise en forme d’assurance-vie, sans changer de valeur financière ni publier.

## Validation et limites

La suite locale passe 922 tests Python. Les parcours et exports sont vérifiés avec les devises des nouvelles observations ; leurs journaux finaux, les qualifications GitHub et la publication effective sont ajoutés au dossier téléchargeable après contrôle. Les premiers journaux de qualification USD restent des étapes historiques, sans certification du périmètre de leur colonne générique.

Le bilan global reste **12 actions corrigées, 6 partielles, 1 bloquée**. Les 79 divergences financières, les accès aux positions/historiques complets WisdomTree et les deux conflits PEA restent ouverts. Ce complément ne certifie pas tout le catalogue.

Six téléchargements PNG ont été exécutés pour les trois fiches et leurs comparatifs, avec contrôle mobile. Les contrôles DWS, raccordements ETF, consommateurs mensuels, cohérence, catalogue et provenance passent sur les encours explicitement publiés.
