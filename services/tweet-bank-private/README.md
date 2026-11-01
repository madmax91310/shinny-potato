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

## Limites des requêtes (audit technique du 1 novembre 2026)

Les écritures authentifiées et de même origine lisent au maximum 100 000 octets
pour un tweet, 4 000 pour une préférence et pendant 10 secondes. La limite est
appliquée pendant la lecture, même sans Content-Length ; une entrée refusée
annule le flux et ne touche pas D1. Avant correction, un flux de dix blocs de
65 536 octets était intégralement consommé avant le 413. Les tests API couvrent
les flux sans fin, les octets UTF-8, le JSON incomplet et la lecture bloquée.

La confiance dans `oai-authenticated-user-id` suppose le passage par le dispatch
Sites authentifié ; ne pas exposer directement le Worker. La politique du Site
existant a été relue (accès personnalisé, propriétaire seul, aucun visiteur
externe). Aucun accès, compte ou secret n'a été modifié pendant l'audit.

## Reprise des lectures et sauvegardes

Le client borne les requêtes à 15 secondes. Une interruption conserve le texte
édité et rend la sauvegarde réessayable ; avant de répéter une écriture dont la
réponse a été perdue, vérifier par actualisation si elle a été enregistrée.
Les trois réponses de synchronisation sont validées avant de remplacer ensemble
la photographie affichée/exportable. Une préférence de schéma invalide ne peut
plus vider silencieusement la liste des tweets reçue en parallèle.

`node tests/browser.mjs` lance uniquement la prévisualisation locale avec SQLite
en mémoire et une identité de test. Chromium vérifie à 390/1440 px : texte spécial
littéral, sauvegarde bloquée, conservation/reprise du brouillon, synchronisation
invalide et JSON téléchargé avec les dernières lignes valides. Le workflow privé
installe Playwright depuis le lock racine et exécute cette recette.

## Sauvegarde manuelle et restauration

Une écriture atomique ou un export n'est pas une sauvegarde automatique.
« Exporter mes données » conserve l'export v2 de la dernière photographie affichée,
utile même après une actualisation échouée. « Créer une sauvegarde » télécharge un
JSON v3 lu dans une transaction serveur cohérente : textes personnels, favoris,
dates de publication, identifiants et versions, y compris les préférences des
anciennes versions supprimées. Les archives publiques ne sont pas recopiées.
Aucune sauvegarde automatique n'est configurée ou vérifiée par ce dépôt.

Procédure :

1. Cliquer sur « Créer une sauvegarde », vérifier le téléchargement du JSON et
   conserver le fichier dans un emplacement privé. Un refus réseau ou de taille
   n'est pas annoncé comme un téléchargement réussi.
2. Depuis le **même compte**, choisir « Restaurer une sauvegarde », sélectionner
   le fichier et confirmer l'ajout des éléments absents. Les exports v2 existants
   sont reconnus ; les versions inconnues et les données incomplètes sont refusées.
3. Vérifier le message puis actualiser : les textes, favoris et dates doivent être
   retrouvés. Une interruption peut perdre la réponse après enregistrement :
   actualiser avant de réessayer. Une répétition du même fichier est idempotente.

La restauration n'efface aucune ligne et n'écrase aucun contenu différent déjà
présent. Un conflit, même sur une préférence après insertion d'un texte, annule
toute la transaction. Conserver les deux fichiers pour comparer les versions en
cas de conflit. Le propriétaire authentifié borne toutes les écritures ; un
fichier d'un autre compte ou mêlant des propriétaires est refusé.

La limite est de 1 Mio UTF-8 et 10 000 lignes cumulées, avec lecture bornée à 10 s.
Un instantané trop volumineux pour être restauré est refusé dès sa création ;
l'export v2 complet reste disponible. Aucun schéma D1 n'est modifié.

Recette isolée reproductible : Node 24+, `npm test`, `npm run build`, puis depuis
la racine `npm ci` et `npx playwright install --with-deps chromium firefox webkit`,
enfin `node services/tweet-bank-private/tests/browser.mjs`. SQLite reste en mémoire
avec une identité synthétique. Les tests interrompent réellement une transaction,
rejouent les formats v2/v3, les conflits, la corruption, le mélange de comptes et
la perte de réponse après commit. La recette JSON/restauration/presse-papiers
refusé tourne sur Chromium 390/1440 et Firefox/WebKit 390 ; les anciens scénarios
longs de délai restent uniquement sur Chromium.
