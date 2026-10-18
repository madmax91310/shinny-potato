# Lots 4–5–6 : raccordements, métadonnées et suivi

Branche séparée de master c1d38cd. Les conversions et moteurs de rendement des lots 1–3 ne sont pas modifiés.

## Raccordements vérifiés

L’historique exact LU3180074463 (Amundi European Strategic Autonomy, INDEP, Paris, EUR) a été téléchargé et qualifié par le collecteur existant. Les deux candidats ont été validés ; une seule série rejoint le registre automatique. Début réel : décembre 2025. Les prix anniversaires restent distincts des clôtures ajustées. Aucun allongement artificiel ni assouplissement des fenêtres minimales.

Le rapport recense désormais 225 historiques ETF/ETC automatiques, aucun candidat en attente de collecte, 27 instruments sans cotation documentée et 28 historiques trop courts. Les 27 cotations manquantes ne sont pas résolues par cette PR : les candidats existants doivent encore être confirmés dans les documents acceptés. Les autres devises restent dans le chantier des moteurs 1–3.

## Données descriptives

Le rapport des champs lit désormais les registres dédiés aux cotations et au statut PEA. Une valeur PEA fausse documentée est présente ; un statut inconnu reste absent. Les dates et sources viennent de la preuve du champ, sans reprendre la date de contrôle du TER. La fraîcheur d’une liste de cotations utilise sa preuve la plus ancienne.

Recollecte ciblée : observations renouvelées pour IE00BK5BQT80 et FR0011550193 ; IE00B3RBWM25 reste sans observation qualifiée lors de cette tentative. Aucune nouvelle couverture de change ni position intégrale n’est inventée. Le rapport de raccordement prend désormais en compte les 18 sources de positions générées, en plus des sources explicites. Cela décrit la configuration automatique, sans certifier un recouvrement intégral exploitable.

## Suivi

Chaque champ instrument du rapport public porte un diagnostic indépendant de la présence d’une donnée conservée, ainsi que les outils concernés. Les diagnostics séparent observation réussie, collecte incomplète, champ non observé, non-applicabilité documentée, attente et absence de configuration. Un champ non observé ne devient pas automatiquement « non publié ».

Les blocages historiques portent le champ, les outils concernés et la dernière tentative connue. Qualification en attente et qualification échouée sont distinctes. Les résumés restent calculés à partir des lignes détaillées.

## Validation et intégration

Compilation et budgets validés ; lint sans erreur (avertissements préexistants). Audits historiques et raccordements, tests des rapports et diagnostics, 7 tests de qualification et 18 tests métadonnées réussis.

Après intégration des lots 1–3, rebaser cette branche, régénérer les fichiers dérivés avec npm run build, puis relancer les audits. La concordance finale entre branches et le déploiement restent à effectuer. Cette PR ne clôture pas les lacunes externes documentées.
