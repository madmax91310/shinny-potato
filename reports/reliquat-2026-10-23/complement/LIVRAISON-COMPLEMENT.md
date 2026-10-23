# Complément : dates DWS et enregistrement des observations

Base : master `d46f533`, contenant la PR #887 fusionnée en `a0e1ca2`.

## Défauts démontrés

- DWS, Utilities `IE00BM67HQ30` : réponse officielle du 23 octobre, classeur USD avec encours de **930 235 746,38 USD au 21 octobre**, page NAV déjà datée du 22 octobre et affichée en GBP. Le collecteur imposait une égalité entre les deux dates et refusait ainsi une observation d’encours datée et identifiée. La date, la devise et le montant de l’encours viennent maintenant du classeur ; la date du contexte NAV est conservée séparément. Identité, portée fonds, unicité du contexte, formule, dates futures et devise du classeur restent contrôlées. La publication a ensuite rattrapé son décalage : la collecte réelle suivante donne **942 365 086,90 USD au 22 octobre**. L’encours Industrials `IE00BM67HV82` donne **1 337 200 639,67 USD au 22 octobre**. Seuls les deux champs d’encours sont renouvelés, après une collecte réussie ; les autres preuves restent inchangées.
- SCPI, workflow master `39917620412` : les huit SCPI et la répartition Iroko ont été collectées avec succès. L’enregistrement a refusé une base déplacée par le commit d’assurance-vie `d46f533`. Même situation pour les observations quotidiennes `39917620235`. Les workflows disposent maintenant d’une revalidation sur l’arbre combiné pour une liste explicite de fichiers indépendants. Un changement de collecteur, de workflow, de dépendance, d’historique ou des propres observations impose toujours une nouvelle collecte. Les contrôles financiers, le build et l’invariance des observations rejouées précèdent toute publication.

## Vérification

Six scénarios Git réels isolés : mises à jour assurance-vie/SCPI indépendantes conservées ; changement du collecteur, de l’historique et des observations propres refusés ; échec de revalidation sans publication. Régressions DWS sur les réponses officielles archivées et sur les contextes manquants/ambigus.

La suite locale passe 918 tests Python, dont les huit nouvelles régressions ; le build passe. La collecte locale réelle des deux DWS réussit avec les réponses brutes archivées.

Le statut global reste **12 actions corrigées, 6 partielles, 1 bloquée**. Ce complément ne résout pas les 79 divergences financières, les accès aux positions/historiques WisdomTree ni les deux conflits PEA. Les reprises planifiées et la version réellement publiée restent à vérifier avant d’être annoncées réussies.
