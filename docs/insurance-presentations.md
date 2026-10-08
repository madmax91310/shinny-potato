# Présentations d’assurance-vie

Route `/presentation-assurance-vie` : Linxea Spirit 2 (Spirica) et Linxea Avenir 2 (Suravenir). Sélection d’un contrat, texte long modifiable, copie et rétablissement ; consultation des rendements et conditions des fonds euros dans les réglages. Les mêmes observations alimentent la bibliothèque de données.

## Données et sources

`src/data/automated-insurance.json` : pages officielles Linxea du contrat et de chacun des fonds euros. Collecte des frais de versement, arbitrage en ligne, gestion des unités de compte et transactions ETF ; minimums des versements initial, libre et programmé ; nombre et catégories de supports annoncés ; rendements annuels publiés, garantie nette de gestion, plafond de versement et conditions d’accès aux fonds euros.

Les rendements annuels sont nets de gestion, avant prélèvements sociaux et fiscaux ; les bonus commerciaux sont exclus. Trois années sont affichées si disponibles, seulement l’historique réellement publié pour Euro Objectif Climat. La garantie annuelle ne vaut pas une garantie de 100 % du capital. Les frais des supports s’ajoutent à ceux du contrat ; les frais des fonds euros ne doivent pas être retranchés une seconde fois du rendement net publié.

La date de vérification des pages n’est pas présentée comme une date d’effet des tarifs. Gestion libre uniquement ; les mandats, options et conditions spécifiques de supports ne sont pas couverts intégralement.

## Actualisation

`.github/workflows/update-insurance.yml` : tous les jours à 07:25 UTC, déclenchement manuel et contrôles sur les pull requests. Collecte publique sans clé personnelle, validations, construction et déploiement. Une source inaccessible, un tarif ambigu, un historique incomplet ou des conditions incohérentes conservent toute la dernière fiche validée du contrat concerné ; les autres contrats peuvent être actualisés. Le rapport d’observation détaille l’échec, qui est également suivi dans « Données à revoir ».

```sh
python -m unittest discover -s scripts -p test_insurance.py
python scripts/collect_insurance.py --apply --output insurance-observation.json
node scripts/test-insurance.mjs
npm run audit:data-catalog
npm run build
node scripts/test-insurance-ui.mjs
```

Les sources supplémentaires doivent être qualifiées avant d’étendre les produits. Aucun envoi automatique sur X et aucun export image dans ce lot.
