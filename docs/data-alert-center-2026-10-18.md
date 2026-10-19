# Centre d’alertes des données automatisées

## Comportement

Le panneau de surveillance arrive en premier dans « Données à revoir ». Les filtres ne montrent que les catégories présentes (et le filtre sélectionné). Chaque incident donne une action, son identifiant lorsqu’il est connu, la période conservée et la date de contrôle disponible. « Copier le diagnostic » produit un texte avec cause, dates, outils, sources et exécution ; si le presse-papiers est bloqué, une zone sélectionnable permet la copie manuelle.

Le workflow existant `automation-status.yml` réutilise `build-monitoring-context.mjs`. Celui-ci ajoute les contrôles des historiques à partir des observations déjà enregistrées : séries mensuelles marché/ETF/non obligataires, or Banque mondiale, Bitcoin, performances annuelles des fonds et des indices. Le contrôle détecte les périodes intérieures absentes ou les bornes documentées disparues, les valeurs inutilisables et les périodes anciennes selon `freshness-policy.json`. Il n’invente pas de profondeur avant le début documenté, de première année civile avant le lancement, de rendement de l’année en cours, ni de date de publication promise par un émetteur. Une série absente sans plage documentée reste une limite de couverture, pas un faux incident de collecte. Les séries annuelles d’indice ne sont pas assimilées aux séries des fonds.

Les incidents restent dans la branche de statut et l’issue de fiabilité existantes, indépendamment du déploiement Pages. Un même incident ne renotifie pas à chaque exécution. Une aggravation correspond à une sévérité accrue, de nouveaux outils affectés ou de nouvelles périodes manquantes/invalides. Les rétablissements partiels des données sont notifiés même si d’autres incidents restent ouverts. Les contrôles consultatifs gardent leur période calme ; les reçus rendent les réessais de notification idempotents. Sans bilan historique, les anciens incidents historiques restent actifs : aucune résolution n’est déduite d’une absence de rapport.

Un message GitHub ne garantit pas une notification mobile : l’utilisateur doit suivre l’issue et avoir les notifications GitHub activées. Aucune donnée de marché ni date de source n’est modifiée par ce changement. Une collecte réussie ne prouve pas la publication ; la preuve de bout en bout reste le chantier complémentaire #798.

## Vérifications locales

- `node scripts/test-monitoring-context.mjs` : calendrier, périodes manquantes, bornes documentées disparues, historique court, première année complète, rendements nuls/négatifs, seuils du registre et diagnostic.
- `python -m unittest discover -s scripts -p 'test_automation*.py'` : 45 tests réussis, dont dédoublonnage, aggravation, rétablissement partiel, réessai après réponse perdue et conservation des incidents sans rapport.
- `node scripts/test-automation-overview.mjs` : phases, collecteurs configurés et retards.
- `npm run build` : compilation et budgets réussis.
- `scripts/test-automation-failures-ui.mjs` dans Chromium : erreurs, publication bloquée, filtres, recherche par identifiant, périodes conservées, copie réussie et refusée, retour à la normale, suivi indisponible/périmé, absence de débordement sur mobile et bureau. Captures inspectées.
- Aucun trou détecté dans les plages historiques actuellement enregistrées au moment du contrôle. Ce constat ne certifie pas l’absence d’autres incidents de collecte.

Ces vérifications ne constituent pas une preuve de déploiement. La CI et l’identité de la version publiée doivent être vérifiées séparément après fusion autorisée.
