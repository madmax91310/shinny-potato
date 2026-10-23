# Portefeuilles IA : enregistrement avec confirmation GitHub

Cette évolution conserve GitHub Pages, le dépôt comme livre durable, et GitHub Actions comme traitement de confiance. Elle ne nécessite ni abonnement, ni hébergement Node.js, ni application OAuth, ni secret ajouté au navigateur. **La confirmation est effectuée sur GitHub, puis le suivi revient dans l’application. Ce n’est pas une authentification intégrée à GitHub Pages.**

## Sur téléphone

1. Dans Configuration et catalogue, charger le catalogue, choisir les règles, la référence exacte et les participants/modèles. Préparer la création.
2. Ouvrir **Confirmer sur GitHub**, se connecter au compte propriétaire `madmax91310` si nécessaire, vérifier la demande et appuyer sur **Create**. Aucun fichier à joindre, commande ou commit à effectuer.
3. Revenir à l’application et **Vérifier l’enregistrement**. « Reçue » ou « En traitement » ne signifie pas « Enregistrée ». Un refus conserve le brouillon et explique sa cause dans la demande GitHub.
4. Préparer les dossiers individuels, les transmettre soi-même aux IA, puis saisir les allocations ou coller leurs réponses JSON. Vérifier l’aperçu ; confirmer chaque demande comme ci-dessus.
5. Lorsque toutes les décisions initiales sont enregistrées et les contrôles satisfaits, préparer puis confirmer **le lancement explicite**. La référence et les participants partagent leur première clôture future éligible.
6. Chaque semaine : dossier individuel → échange manuel → réponse → aperçu → confirmation GitHub. Les prix, changes, exécutions et valorisations restent automatisés.

Sur un autre appareil, **Actualiser le livre distant** retrouve les éléments effectivement enregistrés, même si la publication Pages est encore en cours. Les brouillons restent propres à l’appareil ; une restauration ou suppression explicite est proposée au retour. Leur suppression n’efface jamais le livre distant.

## Autorisation et traitement

Le workflow `ai-owner-requests.yml` ne s’exécute que pour une demande dont **l’auteur et le compte déclencheur ont l’identifiant numérique du propriétaire du dépôt**. Le script de confiance vérifie à nouveau ces identifiants, le dépôt, le titre/UUID et l’unicité du contenu. Un visiteur peut lire les données publiques, mais ne peut pas modifier le livre.

La demande transporte la sélection exacte, sous forme d’un masque d’identifiants et d’une empreinte du catalogue complet ; aucun sous-ensemble arbitraire n’est substitué. Le serveur de confiance refuse une empreinte différente. Le texte original facultatif doit être abrégé ou retiré si sa taille empêche l’ouverture du formulaire GitHub (URL maximale retenue : 8 000 caractères). Les règles et actifs ne sont jamais retirés automatiquement pour réduire la taille.

Le script appelle **`scripts/ai-portfolios.mjs import`**, qui rattrape réellement les seuls cours/changes nécessaires pour les décisions et le lancement, puis applique `register`, `validateDecision`, `planDecision` et `refresh`. Le navigateur n’autorise aucune opération sur la seule base d’une qualification ancienne. Une prévisualisation ancienne reste indicative et peut être refusée lors du rattrapage.

Les exécutions et dates financières restent celles du moteur. **L’échéance concerne l’enregistrement validé**, pas l’ouverture d’un formulaire ni sa mise en file. Le temps de file GitHub Actions n’est pas garanti : confirmer suffisamment avant l’échéance. Les bornes communes, le fuseau et la règle de réponse manquante restent visibles dans l’application ; aucune règle existante n’est migrée implicitement.

## Concurrence et reprise

- `expectedRevision` empêche d’écraser une modification faite sur un autre appareil.
- UUID + empreinte de la demande dans l’audit : un double clic/rejeu ne crée aucune seconde décision ; un contenu différent sous le même UUID est refusé.
- Le traitement partage le verrou `active-market-data-production` des collecteurs. Après un conflit de push, il repart du livre courant et **recalcule** ; il ne rebase pas des positions calculées sur un livre périmé. Trois tentatives, puis refus explicite.
- Les collecteurs existants ne forcent pas les conflits de livre et préservent les dernières données valides. Les allocations ne sont pas remplacées par une ancienne copie du navigateur.
- Après interruption, fermer puis rouvrir la demande GitHub depuis son lien permet de relancer le workflow. Fermer une demande GitHub n’annule pas une décision : utiliser l’annulation tracée dans l’application. Si le commit avait déjà réussi, l’audit est retrouvé avant tout nouvel import. Une révision devenue périmée nécessite un nouvel aperçu et une nouvelle demande.
- Une décision peut être durable avant sa publication Pages et avant son exécution. L’application lit le livre courant à la demande ; le workflow réutilise la publication validée existante.

## Collecte inchangée

Actualisations programmées à **05:20 et 09:20 UTC**, délais GitHub Actions possibles. Collecte mutualisée des actifs détenus, de la référence et des décisions en attente ; fenêtre incrémentale avec recouvrement, revue complète périodique et contrôles de révisions existants conservés. Aucun téléchargement quotidien de tout le catalogue. Les actifs vendus gardent leurs séries. Les six formats d’images, conventions synthétiques et calculs financiers existants sont réutilisés.

## Limites à vérifier lors de la livraison

La recette isolée simule la connexion/confirmation GitHub et les réponses du fournisseur ; elle ne constitue pas une preuve d’authentification réelle en production. Aucun scénario de recette ne doit écrire dans le livre réel. Un essai d’authentification du propriétaire et du formulaire publié peut être fait sans soumettre de compétition. La création d’une compétition réelle reste une action ultérieure explicite de l’utilisateur.

Les demandes et réponses originales sont **publiques** dans ce dépôt public. L’application le signale avant confirmation. Il ne faut pas y mettre de secrets. Aucun appel automatique aux IA, ordre réel ou publication sur X.

## Recette du traitement réellement hébergé

Un environnement de recette peut être préparé par les développeurs dans une branche `ai-rehearsal/<identifiant>`, avec le marqueur `.ai-portfolio-rehearsal.json`. Le paramètre `?ai-rehearsal=<branche>` charge uniquement ses données, affiche une bannière RECETTE ISOLÉE et sépare ses brouillons locaux. Les actifs et historiques restent ceux réellement collectés ; les règles et noms de recette sont explicitement fictifs. Aucun portefeuille de recette n’est créé sur master.

Le même traitement GitHub est utilisé. Il refuse les branches hors de cet espace, l’absence de marqueur et toute différence de code avec son instantané de confiance. Les commits de recette n’alimentent jamais la sortie déclenchant le déploiement. La collecte quotidienne de production ne lit que son livre sur master. Le script `prepare-ai-owner-rehearsal.mjs` est un outil de test protégé par le nom de branche, pas une étape du parcours utilisateur.

Un commit peut être confirmé par le journal GitHub avant d’être disponible sur son CDN. L’interface affiche alors « enregistrement durable confirmé, tableau en cours de disponibilité », garde le tableau précédent et permet une nouvelle vérification. Elle ne recrée pas la demande.
