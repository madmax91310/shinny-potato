# Portefeuilles publics

Route : `/portefeuilles-publics`, groupe « Construire un portefeuille ». Stockage local versionné `el-public-portfolios-v1`, indépendant des outils Budget/DCA/tweets. Les publications et notes personnelles ne sont jamais envoyées à GitHub. Aucune synchronisation des fiches entre appareils.

## Réserve initiale et provenance

Trente portefeuilles partagés par leurs auteurs ont été recherchés le 16 novembre 2026 dans les publications publiques Getquin. Le choix couvre des approches ETF, actions, revenus et cœur-satellite ; il ne dépend pas des meilleurs rendements. Les noms restent des pseudonymes publics. Aucun âge, métier, revenu ou montant n’est ajouté.

`src/pages/public-portfolios/catalogue.json` conserve, pour chaque profil, le lien partagé, la publication personnelle justificative, la stratégie reformulée et l’objectif seulement lorsqu’il est explicite. « Réel déclaré par son auteur » décrit une déclaration, jamais un audit des transactions. Les performances mensuelle et depuis janvier ne sont pas préremplies ; leur vérification reste obligatoire avant préparation.

La première ouverture ajoute les profils manquants et enregistre une révision de catalogue. La migration de vingt à trente ajoute uniquement les dix nouvelles entrées ; les anciennes suppressions ne réapparaissent pas. Les fiches existantes, leur nature, leurs textes et leurs publications sont conservés ; les variantes linguistiques d’un même lien Getquin ne créent pas de doublon. Une fiche supprimée ne réapparaît pas au rechargement.

## Acquisition réellement disponible

- **Getquin : récupération partielle à confirmer**, pour les trente liens partagés du catalogue. Le collecteur lit uniquement leur page HTML publique, sans compte, cookie de connexion, API privée ou contournement. Le `robots.txt` consulté le 16 novembre 2026 n’exclut pas les pages `/en/dashboard/`. Le schéma de rendu `__NEXT_DATA__` fournit les ratios d’allocation `positions_by_ratio[].breakdown.ratio` ; ils sont conservés sans renormalisation. Identité, page disponible, absence de démonstration, noms, devise explicite et poids sont contrôlés. Aucun rendement n’est déduit des positions. Les champs techniques `returns.*` initialisés à zéro sont ignorés. Un total masqué/normalisé à 100 n’est jamais repris comme montant.
- **eToro : saisie manuelle.** La documentation `https://builders.etoro.com/reference` décrit une API nécessitant des identifiants ; aucun accès correspondant n’a été fourni. Aucune clé n’est embarquée dans la SPA.
- **Mon Petit Portfolio : saisie manuelle.** Les pages publiques sont consultables, mais leur lecture inter-origines n’est pas autorisée à cette SPA. Le taux « Annual return since … » est annualisé et ne devient ni rendement mensuel ni rendement depuis janvier. Aucun connecteur MPP n’est déclaré opérationnel.
- Les nouveaux liens saisis librement restent manuels tant qu’ils ne font pas partie du catalogue de collecte. Modifier l’URL d’une fiche la déconnecte de son ancien collecteur.

Les dates effectives, périodes de rendement, dividendes, frais et méthode de performance non établis restent vides/non précisés. Chaque observation collectée est donc à vérifier. L’utilisateur peut la corriger dans un nouveau relevé. Les noms/poids restent consultables avec la source et la date de collecte.

## Collecte et bouton d’actualisation

`.github/workflows/refresh-public-portfolios.yml` lance une collecte chaque samedi à 07:10 UTC (08:10 en France en hiver, 09:10 en été), selon la disponibilité de GitHub Actions, et permet un lancement manuel depuis GitHub. Une modification fusionnée du catalogue ou du collecteur déclenche également une lecture. Les trente lectures sont bornées et séquentielles. Une redirection hors d’un lien public Getquin autorisé est refusée. Une connexion ou un CAPTCHA provoque un échec visible, jamais un contournement.

`scripts/refresh-public-portfolio-feed.mjs` lit le flux précédent, lance le collecteur Python et publie exclusivement `public/data/public-portfolios-feed.json` sur la branche **`public-portfolio-data`**. Il vérifie le SHA du fichier avant écriture et utilise le bail atomique de l’API Contents. Il ne modifie ni `master`, ni les fichiers financiers, ni leurs collecteurs, protections ou voies de publication. Les succès indépendants sont conservés même si une autre source échoue ; le workflow signale les erreurs après publication de leur état.

À chaque ouverture de l’outil, le dernier flux public est chargé automatiquement. Le bouton **« Actualiser tous les portefeuilles »** recharge ce dernier flux public depuis `raw.githubusercontent.com` et ajoute les observations nouvelles à la réserve locale. Il ne lance pas directement les sites sources ; l’interface l’explique et fournit le lien de relance GitHub. Le flux initial inclus dans l’application provient d’une lecture réelle des trente pages. Les chargements suivants ne remplacent jamais les relevés précédents, leur vérification manuelle, les brouillons ou l’historique publié. Une observation inchangée ne crée pas de doublon. Un flux ancien, invalide ou une panne de transport ne supprime aucune donnée. Les échecs par source affichent leur date et la date du dernier succès de lecture, distincte de la vérification des performances.

La surveillance commune déclare ce collecteur et sa seule route dans `src/data/automation-workflows.json`. Le moniteur écoute ses fins de lancement. Son contrat spécifique contrôle la branche, le chemin du flux, la validation et le bail d’écriture ; les contrôles des producteurs financiers qui écrivent sur `master` restent conservés.

## Préparer un format résultats

Chaque carte propose « Préparer texte et images ». Ce bouton ouvre directement la préparation avec un aperçu du texte et des images, même quand les rendements manquent. Les aperçus portent une mention de brouillon ; les rendements absents, non vérifiés ou de période ambiguë ne deviennent pas des chiffres publiables. Aucun téléchargement ni copie finale n’est proposé pour cet aperçu.

« Compléter les performances » crée une copie indépendante du relevé avec son allocation et sa provenance. Les dates du dernier mois civil terminé et du début d’année sont proposées seulement lorsqu’elles manquent ; elles restent à confirmer. Les valeurs et libellés originaux ne sont jamais inventés, et aucune case de vérification n’est cochée automatiquement. Le formulaire expose les deux périodes requises, conserve l’année facultative et l’allocation modifiable dans des sections dédiées.

« Enregistrer et préparer le post » devient disponible après les contrôles : il conserve le nouveau relevé et prépare le texte final éditable et les PNG. Une simple sauvegarde incomplète reste possible. Le format résultats garde ses exigences de vérification et de non-applicabilité explicite ; aucune variante sans performance ne les contourne. Les visuels définitifs conservent le rendu v1 pour régénérer les épisodes antérieurs.

## Conservation éditoriale

Un relevé corrigé ajoute une version. Une publication conserve texte final, date, numéro, URL facultative, profil sans historique récursif, relevé et version du rendu. Les images de l’historique utilisent cette photographie, jamais le dernier relevé. Le rendu v1 doit être conservé si le style évolue.

## Vérifications

- `node scripts/test-public-portfolios.mjs` : persistance, conflits, périodes, pertes/zéros/absences, allocations, nature, benchmark, historique et tests d’actualisation.
- `node scripts/test-public-portfolio-refresh.mjs` : catalogue sourcé, migration/doublons/suppression, flux invalide/ancien, conservation des corrections et publications, publication isolée avec bail.
- `python3 -m unittest discover -s scripts -p test_public_portfolio_collector.py` : fixtures synthétiques séparées ; ratios sans renormalisation, total masqué, faux zéros, devise, démonstrations, schéma changé, pannes, conservation du dernier succès et restriction des URLs.
- `node scripts/playwright-public-portfolios.mjs` : trente profils initiaux, actualisations répétées, panne par source et transport sans perte, sauvegarde incomplète/rechargement, copie réelle, PNG/ZIP, historique, mobile et routes DCA/Budget/tweets. `BASE_URL` exerce la version publique et son vrai flux avant les simulations de panne dans le navigateur éphémère.

Aucune donnée fictive n’est ajoutée à la réserve de production. La lecture publique d’une allocation et la réussite d’une collecte ne certifient pas son rendement.
