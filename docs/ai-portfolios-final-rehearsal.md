# Portefeuilles IA — préparation du lancement

Cette évolution réutilise #882/#883 : mêmes demandes JSON, import CLI, fenêtres
hebdomadaires, comptabilité synthétique, données qualifiées et chargement différé.
Le raccordement des 29 actifs aux autres outils est hors périmètre. Le livre réel
reste à la révision 0, sans compétition ni décision.

## Depuis un téléphone

- **Vue d’ensemble** : valeurs, liquidités, classement, performances, référence,
  courbes et prochaine échéance commune.
- **Portefeuille** : positions, performance des investissements, contributions
  nettes, résultats réalisés/latents, lignes cédées et décisions archivées.
- **Décisions** : dossier daté à transmettre soi-même, réponse JSON, erreurs,
  aperçu et préparation manuelle. Un JSON illisible ou une conservation ne
  déclenche pas le catalogue complet.
- **Images** : six formats, période et participants, titres/textes temporaires,
  prévisualisation et téléchargement de chaque page. Aucun appel aux IA.

Configuration/catalogue restent dans un accès secondaire. Les diagnostics sont
regroupés dans **État des données**. Ni les certificats ni les historiques de prix
ne sont téléchargés à l’ouverture. Les images sont un module différé ; leur
rendu utilise les valorisations publiées. Les canvases déjà chargés restent
exportables si les anciens fichiers JS disparaissent après un déploiement.
Un module non encore chargé devenu inaccessible propose de recharger la page,
en exportant d’abord le brouillon ; aucun rechargement automatique ne l’efface.

## Référence et données réelles

Les nouvelles configurations utilisent EUR et **iShares Core S&P 500 UCITS ETF**,
ISIN **IE00B5BMR087**, cotation **CSPX Londres, USD**, symbole **CSPX.L**.
Ce fonds capitalisant suit le S&P 500 sans couverture de change ; les unités
synthétiques ajustées sont converties avec les changes historiques BCE. Ce sont
les performances de cet ETF, pas celles de l’indice exact. Une compétition déjà
créée conserve son identifiant de référence, sa devise et ses opérations.

La vérification réseau du 23 octobre à 04:59 UTC a contrôlé **72 clôtures réelles
jusqu’au 21 octobre**, ancrées au 13 juillet. Le fournisseur retourne un prix nul
pour le 22 octobre, également sur son second serveur et d’autres cotations
exactes examinées. Ce n’est ni une fermeture officielle ni une clôture exploitable.
La BCE est disponible au 22. Le motif est affiché et une nouvelle opération reste
bloquée tant que le rattrapage ne réussit pas. Aucune série n’est interpolée.
Preuve datée : `data/ai-portfolios/final-network-validation.json`.

`node scripts/verify-ai-final-network.mjs` rejoue cette vérification en racine
strictement temporaire : code de sortie 0 si prêt actuellement, 2 si seul
l’historique daté est vérifié et la dernière séance reste manquante. Le rapport
sépare explicitement ces deux résultats ; il ne fabrique aucune preuve de succès.

La collecte quotidienne reste mutualisée aux positions détenues, références et
opérations en attente. Fenêtre incrémentale avec 14 jours de recouvrement,
contrôle d’au moins trois observations communes, revue complète après sept jours.
Une révision du brut/ajusté déclenche une relecture cohérente depuis l’ancrage.
Une fenêtre fournisseur incomplète peut être reprise une fois par une fenêtre
`range` du même instrument/source/convention ; tous les contrôles restent
appliqués. Un trou réel ou une identité différente échouent et conservent la
série valide. Les reprises de fenêtre sont journalisées dans la provenance.
Aucun téléchargement quotidien du catalogue entier n’a été ajouté.

## Calculs et périodes

Les liquidités et frais sont ceux du journal existant. Les exécutions archivées
ne sont pas réécrites. Des champs de lecture reconstruisent le coût moyen pondéré
en devise commune, frais d’achat inclus. Une vente réalise ses recettes nettes de
frais moins la fraction de coût cédée ; le latent est la valeur restante moins le
coût restant. Le résultat net de ligne est la somme du réalisé et du latent.

- Performance de l’investissement = résultat net / achats cumulés frais inclus.
  C’est un rendement sur capital cumulé, pas la variation du cours, un rendement
  pondéré dans le temps ou un rendement annualisé. Des capitaux réinvestis sont
  comptés dans les nouveaux achats.
- Contribution nette = résultat net / capital initial, en points.
- Performance du portefeuille = (valeur totale / capital initial − 1) × 100,
  positions ouvertes + liquidités, tous résultats réalisés et frais compris.
  Les contributions nettes, lignes cédées incluses, se réconcilient avec elle.

Exemple indépendant : achat de 10 unités à 100 et 10 à 120, frais de 1 % ; vente
partielle de 5 à 140. Coût acheté 2 222, réalisé 137,50, latent à 150 : 583,50,
résultat net 721 et performance de l’investissement 721/2222. Après liquidation
à 150 avec frais, résultat réalisé 698,50, latent nul. Les frais ne sont pas
soustraits une deuxième fois. Les cours ajustés intègrent dividendes/divisions
une seule fois ; aucune unité synthétique n’est présentée comme une action.

Les périodes d’images sont sept jours, un mois calendaire, trois mois calendaires
et depuis le lancement. Une durée antérieure au lancement est désactivée. Le
mois « en cours » du tableau est distinct du mois glissant des images, dont les
bornes sont affichées. Une période ordinaire compare les clôtures de début et de
fin ; les mouvements sont sélectionnés par exécution dans **]début, fin]**. Pour
le lancement, le capital initial avant frais est la base et les exécutions du
premier jour sont incluses. Le point de financement à zéro n’est pas une cotation ;
une courbe exige au moins deux arrêtés réels. Les valeurs finales affichées et les
courbes utilisent exactement les mêmes bases.

Un bilan individuel vérifie uniquement son participant et la référence présentée.
Un comparatif vérifie tous les participants sélectionnés et cette référence, sur
chaque date requise. Aucun segment ne franchit une valorisation manquante.
Les mouvements archivés, qui n’affichent aucune performance de référence, restent
consultables sans cours actuel ; une conversion historique EUR nécessaire doit
néanmoins être disponible. Propositions non exécutées et mouvements exécutés
sont séparés. Les lignes nombreuses sont paginées, jamais tronquées.

## Enregistrer via Codex

1. Dans Décisions, importer la réponse, vérifier l’aperçu puis préparer la demande.
2. Télécharger **demande-portefeuilles-ia.json**. Copier **les instructions pour
   Codex** et joindre ce fichier dans une nouvelle demande Codex sur ce dépôt.
3. Codex part de master à jour et lance :
   `node scripts/ai-portfolios.mjs import /chemin/demande-portefeuilles-ia.json`.
   Le CLI contrôle la révision, rattrape cours/changes puis valide les règles.
   En cas d’échec, ne pas contourner le contrôle ni modifier le JSON pour forcer.
4. Vérifier le diff et l’audit, commit des seuls dossiers `data/ai-portfolios/`
   et `public/data/ai-portfolios/`, PR, contrôles, fusion/publication, puis vérifier
   `build-info.json` et `requestId` dans le livre servi.
5. Recharger l’outil : retrouver la révision, l’identifiant, l’état enregistré,
   en attente ou exécuté. Le téléchargement précédent n’était pas une sauvegarde.

L’import est idempotent et refuse les demandes périmées. Aucun backend, service
payant ou jeton GitHub frontend n’a été ajouté. La compétition réelle n’est pas
lancée par cette livraison. Les modèles/règles définitifs restent à renseigner.

## Recette reproductible isolée

`node scripts/rehearse-ai-week.mjs` produit uniquement un répertoire temporaire.
Il crée trois participants puis quatre, des données explicitement déterministes,
les allocations initiales et le cycle hebdomadaire du 12 au 19 octobre, puis les
arrêtés jusqu’au 23. L’historique antérieur sert aux tests un/trois mois. Achats,
conservation, renforcement, vente partielle/totale, cible, frais, liquidités,
réponse absente, exécution future, dossier et imports sont couverts. Les 412 puis 515
valorisations journalières (référence comprise) sont comparées à un calcul de
cash/unités/changes indépendant. Les cinq puis six allocations cibles sont
également résolues indépendamment par bissection, frais compris. La recette committe son livre dans un dépôt Git temporaire, exécute
le vrai `refresh --root`, recharge et vérifie l’absence de doublon et que le livre
réel est identique octet pour octet. Aucun résultat déterministe n’est décrit
comme une collecte réseau. Le writer `register` est partagé avec le vrai import
CLI ; l’épreuve réseau actuelle vérifie séparément son blocage de fraîcheur.

`node scripts/playwright-ai-portfolios.mjs` teste navigation, catalogue exhaustif,
import valide/invalide, aperçu, demande exportée, enregistrement isolé/rechargement,
les six PNG téléchargés sur ordinateur et mobile, vingt lignes/noms longs,
zéro mouvement, sélection d’un à quatre participants, périodes, indisponibilité
individuelle/référence et téléchargement depuis un onglet conservé après retrait
des anciens assets. Les exemples PNG restent en `/tmp`, et en artefact CI
**ai-portfolio-isolated-rehearsal**, jamais dans le livre réel.

`python3 -m unittest discover -s scripts -p test_ai_portfolios.py` contrôle aussi
la mutualisation, les ventes totales, l’incrémental, les révisions, la revue
périodique, les pannes et les vraies séances attendues. Le workflow IA lance
obligatoirement ces tests, les tests hebdomadaires, la recette complète et le
navigateur. `check-ai-tracking.mjs` signale une valorisation active incomplète ;
le workflow conserve/publie les autres observations puis signale l’échec au lieu
de présenter un suivi incomplet comme entièrement réussi.

Les mesures réseau avant/après sont prises sur le site réel avec
`node scripts/measure-ai-mobile.mjs URL /tmp/mesure.json`, Chromium 390×844,
cache froid. Elles séparent ouverture et consultation volontaire du catalogue,
identifient le SHA servi et utilisent le livre réellement publié, toujours vide.
Les octets d’un serveur local non compressé ne sont pas comparés à ceux de Pages.

Mesure initiale réellement servie (`80bc745`, 23/10 à 04:46 UTC) :
175 517 octets / 18 requêtes à l’ouverture, puis 1 594 776 octets / 3 requêtes
pour consulter le catalogue (12 283 606 octets JSON décompressés). La mesure
après livraison est publiée dans le compte rendu de PR, avec son SHA servi.

L’audit exhaustif distingue désormais le contrôle de l’historique certifié
(`technicalCoverage`) de la disponibilité opérationnelle (`coverage`). Une
collecte récente en échec n’invalide pas l’historique conservé mais continue de
bloquer toute nouvelle décision ; aucun appel d’admission ne contourne ce test.
