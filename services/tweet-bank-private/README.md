# Mes tweets synchronisés

Espace privé Sites relié depuis `/banque-tweets`. L'archive publique et ses brouillons locaux restent distincts. Les nouveaux tweets sont stockés côté serveur dans D1 ; connexion au même compte ChatGPT sur chaque appareil. Aucun token dans le client, aucun secret GitHub requis.

- `worker/index.js` : UI et API, autorisation sur chaque requête, propriétaire issu de l'identité Sites, contrôles d'origine et versions optimistes.
- `drizzle/` : migration initiale du stockage ; ne jamais modifier une migration déjà appliquée.
- `node tests/api.mjs` : contrat serveur sur SQLite (Node 22+).
- `npm run build` : sortie Worker ESM pour Sites.
- `npm run dev -- --port 4173` : prévisualisation locale uniquement, données en mémoire et identité de test. Ce serveur n'est jamais inclus dans l'artefact publié.

Les URLs privées et l'identité du projet sont publiques ; seules les sessions authentifiées autorisées accèdent aux textes. Ne pas publier ce Site en accès public. Les exports JSON sont téléchargés par le propriétaire.

Le déploiement GitHub Pages publie le lien ; le serveur privé se déploie séparément via Sites, avec la source synchronisée et la migration D1. Copier les changements de ce dossier dans le dépôt source Sites du projet indiqué par `.openai/hosting.json`, valider, puis utiliser le workflow Sites de sauvegarde/publication. Ne pas supposer qu'un push GitHub met le serveur privé à jour.
