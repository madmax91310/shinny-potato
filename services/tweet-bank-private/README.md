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

## Classement et versions

`curateTweet` et `groupTweetVariants` dans le module commun de découverte appliquent les reclassements et les familles explicitement revus lors de l'audit du 29 octobre 2026. Les guides portent des titres courts. Les textes, identifiants, dates de revue et lignes D1 ne sont ni réécrits ni supprimés. Les DCA de mois différents et les cas pédagogiques distincts restent séparés.

Une carte peut réunir plusieurs versions ; le sélecteur conserve l'accès à chaque original et à ses actions. Recherche et origine retrouvent toutes les versions. Le filtre favoris retrouve le groupe si une version est favorite ; le repos utilise la publication la plus récente du groupe, y compris lorsqu'elle concerne une autre origine. Les modifications, suppressions et préférences visent toujours l'identifiant de la version sélectionnée. Les exports conservent tous les originaux et toutes les préférences.

`node scripts/test-tweet-bank-curation.mjs` (à la racine) vérifie ces invariants sans recopier de contenu privé dans le dépôt. Aucune date de contrôle financier n'est renouvelée par un simple reclassement.
