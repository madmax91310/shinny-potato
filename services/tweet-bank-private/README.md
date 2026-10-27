# Mes tweets synchronisés

Espace privé Sites relié depuis `/banque-tweets`. L'archive publique et ses brouillons locaux restent distincts. Les nouveaux tweets sont stockés côté serveur dans D1 ; connexion au même compte ChatGPT sur chaque appareil. Aucun token dans le client, aucun secret GitHub requis.

- `worker/index.js` : UI et API, autorisation sur chaque requête, propriétaire issu de l'identité Sites, contrôles d'origine et versions optimistes.
- `drizzle/` : migration initiale du stockage ; ne jamais modifier une migration déjà appliquée.
- `node tests/api.mjs` : contrat serveur sur SQLite (Node 22+).
- `npm run build` : sortie Worker ESM pour Sites.
- `npm run dev -- --port 4173` : prévisualisation locale uniquement, données en mémoire et identité de test. Ce serveur n'est jamais inclus dans l'artefact publié.

Les URLs privées et l'identité du projet sont publiques ; seules les sessions authentifiées autorisées accèdent aux textes. Ne pas publier ce Site en accès public. Les exports JSON sont téléchargés par le propriétaire.

Le déploiement GitHub Pages publie le lien ; le serveur privé se déploie séparément via Sites, avec la source synchronisée et la migration D1. Copier les changements de ce dossier dans le dépôt source Sites du projet indiqué par `.openai/hosting.json`, valider, puis utiliser le workflow Sites de sauvegarde/publication. Ne pas supposer qu'un push GitHub met le serveur privé à jour.

## Recherche commune et archives

La vue synchronisée regroupe les archives canoniques et les textes personnels, avec recherche par mots, thèmes, origine, catégorie, format, favoris, publication et tri. Les cartes sont compactes ; le texte intégral reste dans Lire la suite. Les favoris et dates sont des métadonnées privées séparées, versionnées par tweet : une modification de texte ne les écrase pas. Le contrôle de validité des archives reste indépendant des 45 jours de repos.

`src/lib/tweet-discovery.js` est la source des règles de recherche. `node scripts/build-tweet-bank-catalog.mjs --snapshot` régénère sa projection Worker et le catalogue de secours depuis TWEETS et reviewPolicy, sans réécrire les textes. Le build principal actualise `public/data/tweet-bank-catalog.json`. Le Worker lit ce catalogue publié et affiche explicitement la date du secours si la lecture échoue. Les anciens brouillons locaux restent dans la vue d’origine ; ils ne sont pas automatiquement transférés au domaine privé.

Le build Worker assemble ses modules en un seul artefact sans dépendance. Toute nouvelle modification du générateur/catalogue requiert le test `node scripts/test-tweet-discovery.mjs` et les tests serveur. Le contenu des archives n'est jamais supprimé par les actions personnelles.
