# Validation du lot qualifié

Préparation : 14 profils, ajoutés aux 77 existants. 64 sujets consultés, 50 non retenus, motifs individuels dans `candidates.json`.

Déjà exécuté localement :

- Comparaison profonde des 77 objets existants avec la photographie de départ : identiques.
- `npm run test:budget` : calculs en centimes, pourcentages, sources séparées des créations, filtre EUR/CHF, deux doublons inter-sujets exclus, brouillons, statuts, migrations, conflits et stockage corrompu.
- `npm run build` avec les seuils existants : réussi.
- Chromium réel et polices chargées : les 14 budgets mensuels complets tiennent sur une page 1080 × 1350, police financière 40 px. Aucun secours automatique long.
- Première recette navigateur à 1440 : 21 profils (les sept antérieurs et les 14 nouveaux), 82 PNG réellement téléchargés et rapprochés octet par octet des aperçus ; champs, calculs, absence de troncature/chevauchement, copie, provenance, personnalisation et conservation d’un ancien publié daté contrôlés.

La recette finale du build intégré, les inspections visuelles, les contrôles GitHub et la publication ne sont pas encore déclarés terminés. Leurs résultats et versions publiques seront ajoutés après exécution. La PR PNG concurrente #1327 est prise en compte avant la validation finale.
