# Coordination des données — 24 octobre 2026

Supervision / Données à revoir : branche `fix/data-review-product-20261024`, base master `2179e96e`.
Possède `scripts/publish_automation_status.py`, `scripts/automation_monitoring.py`, les contrats de rapports et tests associés, `scripts/build-monitoring-context.mjs`, `src/pages/data-review/`, le branchement du moniteur et le suivi de recette. Prend aussi en charge les branchements des tests de supervision dans `.github/workflows/deploy-pages.yml` ; aucun changement des seuils ou voies de déploiement. Aucun collecteur, calendrier financier ou seuil de fraîcheur source modifié.

Automatisation des données : conserve les collecteurs, raccordements, politiques de fraîcheur et reprises de production. Contrat partagé : `scripts/automation-report-contracts.json` ; identités de champs : `scripts/automation_contracts.py` et contrats métadonnées existants. Un rapport ciblé ne certifie que les identifiants effectivement tentés. Signaler toute évolution de format avant intégration.

PR ouvertes examinées : #903, contenu éditorial distinct ; aucun fichier de cette PR pris en charge. #920/#921/#922 et retrait de Portefeuilles IA intégrés à la base ; aucun composant exclusif IA réintroduit. Les anciens worktrees modifiés sont laissés intacts.

Limite du contrat historique observée : les rapports de plusieurs producteurs ne déclarent pas le périmètre tenté. La supervision expose une qualification de complétude distincte de la panne source. Évolution attendue côté producteurs : `attemptedIds` explicites (liste vide autorisée), résultats individuels pour chacun ; les valeurs en cache ne sont pas des succès source. Ne pas rendre obligatoires des champs non tentés. Les formats réellement utilisés sont figés par les fixtures de schéma et leurs empreintes.
