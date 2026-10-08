# Présentations de SCPI

Route `/presentation-scpi` : Iroko Zen et Remake Live. La publication est un texte long, modifiable avant copie, avec hook, principaux pays/secteurs, accès, distributions, frais, lecture de l’exposition et CTA. Les répartitions complètes et les documents sont consultables dans les réglages.

## Source unique

`src/data/automated-scpi.json` contient les observations ; `src/data/scpi.js` les partage entre l’outil et la bibliothèque de données. La date de collecte reste distincte des dates publiées. Les graphiques Iroko non datés sont explicitement signalés comme tels, sans reprendre la date d’un autre indicateur.

- Iroko : graphiques et API publics de l’émetteur (identifiant public de lecture découvert depuis son script officiel), page produit pour le ticket d’entrée, note d’information pour les frais et la jouissance.
- Remake : JSON officiel des graphiques et calendriers, bulletin courant découvert depuis la page produit pour les conditions et leur date.
- Les trois distributions annuelles terminées sont distinctes des objectifs, TRI et performances globales. Les taux sont bruts de fiscalité étrangère ; les commissions sur les loyers ne sont pas des frais sur le capital.

## Actualisation

`.github/workflows/update-scpi.yml` s’exécute tous les jours à 07:20 UTC et peut être lancé manuellement. Il contrôle les parseurs, collecte les sources, vérifie les consommateurs, construit puis déploie les observations validées. Aucun secret ni paramétrage utilisateur n’est nécessaire.

Une allocation invalide, une période incomplète, une source inaccessible ou un changement de conditions non reconnu conserve toute la fiche précédente. L’autre fiche peut être actualisée. L’observation en échec est jointe au workflow et sa conclusion reste en échec ; `Publish automation failures` l’affiche dans « Données à revoir ». Le prochain succès retire l’alerte. Les parseurs ne réparent pas seuls un changement de structure.

Commandes :

```sh
python -m unittest discover -s scripts -p test_scpi.py
python scripts/collect_scpi.py --apply --output scpi-observation.json
node scripts/test-scpi.mjs
npm run build
node scripts/test-scpi-ui.mjs
```

Pour ajouter une SCPI, qualifier ses sources et son adaptateur avant d’ajouter une fiche. CORUM, assurance-vie et placements forestiers ne font pas partie de ce premier lot.
