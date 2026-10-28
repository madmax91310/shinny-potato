# Radar : qualification des compositions et traitement éditorial — 28 octobre 2026

Base initiale : master `d1b00c36`, puis recalage sur `d771f2d3` en conservant les nouvelles observations financières. Consignes `CLAUDE.md`, référence d’audit du 18 octobre,
contrat Radar et politique éditoriale du 26 octobre relus. PR ouvertes au contrôle final :
#1012 (historiques DWS) et #1013 (modèles de portefeuilles), sans fichier commun.
Leurs collecteurs, données, seuils et outils restent hors de ce lot. Aucun envoi de
notification utilisateur, aucune publication X, aucune fusion ni publication en production.

## Constat vérifié et cause

Le flux réel contenait un passage **0,52 % → 100 %** de « Cash and/or Derivatives »
pour IE00B1TXHL60, détecté le 27 octobre à 15:11:12 UTC. L’état mélangeait cette ligne
au 26 octobre avec « Financials : 99,1 % » au 23 octobre. Le contrôle existant des
révisions sur une même photographie ne protégeait pas contre une rupture de couverture
entre deux dates. Une somme de 100 % sur une seule ligne ne prouvait pas une allocation complète.

L’API BlackRock consultée réellement le 28 octobre renvoie toujours une seule catégorie,
« Cash and/or Derivatives : 100 % », datée du **26 octobre**. Les positions complètes
portent sur le **27 octobre**. Ce sont des preuves incompatibles pour confirmer une
réallocation au 26. La cause précise dans le système de l’émetteur n’est pas démontrée :
la valeur n’est pas déclarée fausse. La cause du faux niveau de confiance du Radar est
identifiée et corrigée : comparaison de scalaires sans qualification de leur photographie.

Preuves : [extrait officiel figé et historique](../scripts/fixtures/radar-composition-2026-10-28.json),
[requête réelle et rejeu local](reports/radar-reliability-2026-10-28/live-replay.json).
Le premier fichier contient l’extrait utile de l’API, son URL et l’empreinte du document
complet ; il n’est pas une liste d’articles à maintenir. Le second est une observation
ponctuelle en lecture seule, pas une exécution planifiée ou un changement de radar-data.

## Corrections

- Qualification par photographie : identité, part, fonds/indice, devise connue, unité,
  méthode, nomenclature, dates, couverture et catégories. Une rupture de convention
  établit une référence silencieuse ; elle ne devient pas un changement économique.
- Une variation de **40 points** ou plus exige une preuve complémentaire. Ce seuil
  demande une revue, il ne déclare pas une valeur fausse. Les poids négatifs et supérieurs
  à 100 % restent exacts avec leur méthode ; aucun écrêtage ou redimensionnement.
- Vérification automatique bornée de l’API officielle iShares : deux requêtes maximum
  par passage, priorité aux candidats jamais tentés, cache d’une heure pour un candidat
  inchangé, ETag/Last-Modified, timeout et plafond de réponse. La confirmation indépendante
  utilise seulement des positions physiques complètes de même date, identité et nombre
  de titres corroborés, catégories et arrondis compatibles. Un top dix ou une autre date
  ne confirme rien. Les autres méthodes restent explicitement en attente, sans contournement.
- `compositionReviews`, photographies et vérifications persistent dans l’état ordinaire.
  Les propositions restent hors de `current`/`anchors`. Une référence contaminée n’est
  restaurée que depuis un avant historique traçable avec sa vraie date de contrôle ;
  sinon elle est mise en quarantaine. Les événements, IDs, dates et accusés restent conservés.
  Les sujets en attente restent consultables, mais non exploitables/notifiables.
- Les variations d’une même photographie sont regroupées avec leurs preuves individuelles.
  Des parts différentes ne sont regroupées qu’avec une preuve explicite d’allocation
  commune indépendante de la part, un identifiant de fonds et un contenu identique.
  Un indice ou un nom commun ne suffisent pas. Les registres actuels sans cette preuve
  gardent leurs parts distinctes. Corrections et annonces distinctes restent séparées. Une ligne non qualifiée met en attente le dossier de cette même photographie, y compris dans le planificateur de notifications.
- Détection financière à **2 points inchangée**. Pour l’intérêt éditorial d’une composition,
  une variation ordinaire reste secondaire ; mise en avant possible à partir de 10 points
  ou lors du franchissement de la majorité/concentration de 50 %, avec qualification préalable.
  La pondération du score unique est conservée. Commentaires d’ouverture/clôture de séance
  et communications de gouvernance/résultats sans changement client restent secondaires.
  Fiscalité, prestations et surveillance Sénat/Assemblée restent exclues.
- Les libellés de secteurs/pays sont français ; les pourcentages s’affichent à deux décimales
  maximum, sans changer les valeurs sources. Les chiffres structurés ne sont plus suivis
  d’un long tableau INSEE recollé dans les faits de la carte ; la preuve intégrale reste accessible.
  L’angle salaire cite le salaire net mensuel EQTP et la période.
- Accueil, écran et notifications partagent la qualification. Résumé en version 4 : un ancien
  résumé non qualifié annonce une indisponibilité jusqu’au prochain producteur, jamais un faux zéro.
  Le moteur est chargé avec le flux, sans alourdir l’écran de chargement/panne ni relever les budgets.
- **Écarter ce sujet**, **Sujet exploité**, vues dédiées et annulation, indépendants de la lecture.
  Le badge et l’accueil excluent ces sujets, avec synchronisation inter-onglets. Clés existantes
  de lecture/favoris inchangées. Brouillon conservé après fermeture/traitement ; une sauvegarde
  impossible ou un état illisible est signalé et n’écrase pas les données existantes.
  Ces traitements restent locaux : ils ne synchronisent pas les notifications GitHub côté serveur.

## Avant/après sur le rejeu du flux observé

| Cas | Avant | Après |
|---|---|---|
| iShares Listed Private Equity, 0,52 → 100 % | Exploitable, score 76 | À suivre, preuve complémentaire incompatible ; référence 0,52 % du 23 octobre restaurée avec contrôle historique du 25 |
| Anciennes oscillations 100 ↔ environ 0,5 % | Certaines encore présentées comme changements | Historique/IDs conservés, qualification en attente, aucune alerte rétroactive |
| Amundi PEA Amérique latine, Mexique 30,153 → 36,456 % | Sélection prioritaire | Variation ordinaire secondaire ; valeurs exactes conservées, affichage 30,15 → 36,46 % |
| Bourse de Paris attendue en baisse à l’ouverture | Sélection, 71 points | Commentaire de séance secondaire |
| Nouvelle aide carburant | Sélection, 71 points | Prestation/aide hors périmètre, sans exclure les opérations commerciales de carburant |
| Nouvelles cotations Xetra du 28 octobre | Sujet exploitable | Conservé, cotation distincte du lancement et de l’accès courtier |
| Salaire médian INSEE | Faits structurés suivis d’un long extrait de tableau | Chiffres et comparaison lisibles ; tableau dans la preuve, EQTP conservé |

Le rejeu de 7 305 observations, deux passages, n’a produit **aucun nouveau signal**.
L’appel complémentaire réel a fait une requête HTTP 200 et conservé le motif précis
« ventilation 26 octobre / positions 27 octobre ». Durée totale requête + deux rejeux :
environ 4,3 secondes dans cet environnement. Pas de garantie de délai ou de mesure hebdomadaire.
La sélection de cet instantané passe de quatre sujets à la seule annonce Xetra ; ce résultat
ponctuel ne mesure pas la couverture de toutes les actualités et ne fige pas les compteurs futurs.

## Validation et limites

- `npm run test:radar` : suites existantes, nouveaux comportements de photographie,
  extrêmes légitimes/signés, méthode/unité/devise/périmètre, panne/reprise, correction,
  absence de doublon, migration, cache, budget équitable et traitements locaux.
- Les tests de livraison de notifications utilisent désormais un mouvement structurel de
  15 points ; un contre-exemple explicite vérifie qu’une dérive de 5 points ne contacte pas GitHub.
  Le contrat d’envoi/reprise/accusés reste testé par API simulée.
- `npm run build`, budgets de routes inchangés ; architecture et lint (avertissements
  préexistants hors périmètre). Tests des anciennes clés de lecture et du chargement différé.
- `npm run test:radar:browser` : trois recettes Chromium, ordinateur 1440 px et mobile
  390 px, accueil/badge/panne, filtres/historique, brouillons/copie, preuves INSEE/Amundi/Xetra,
  lecture, écarter/exploiter/annuler, rechargement, inter-onglets et échec de sauvegarde.
  Documents réels figés et API simulées ; ce n’est pas une découverte planifiée ni une réception mobile.

La qualification complémentaire automatique de ce lot vise l’accès BlackRock déjà utilisé,
avec positions physiques en actif net. Les autres sources/méthodes disposent du garde général
et restent en attente si la preuve manque. Les données financières partagées ne sont ni
corrigées manuellement ni remplacées : leurs outils conservent leurs règles propres.
La production, radar-data, les lectures de l’utilisateur et ses réglages de notification n’ont
pas été modifiés. La CI est à lire sur le dernier commit de la PR ; aucun déploiement de ce lot.

Captures de la recette locale finale (rejeu daté, pas la version de production) :

![Accueil mobile](images/radar-reliability-2026-10-28/home-mobile.png)

![Observation en attente sur mobile](images/radar-reliability-2026-10-28/pending-mobile.png)

![Sujet écarté distinct de la lecture](images/radar-reliability-2026-10-28/discarded-mobile.png)

## Contrôle de livraison : taille de l’état

La vérification avant fusion a mesuré **81 345 311 octets** pour l’état du rejeu sérialisé
avec les preuves recopiées dans les catégories, ancres et revues de migration. Le stockage
est désormais dédupliqué par empreinte SHA-256 : **49 722 357 octets**, 390 preuves distinctes,
avec restitution intégrale vérifiée sur le même état. Aucune observation, date, catégorie,
file ou preuve supprimée. Le flux destiné à l’écran reste inchangé ; seul le fichier
interne `state.json` utilise des références, résolues et contrôlées dès son chargement.
Une référence absente, une empreinte altérée ou un encodage inconnu bloque la publication
et conserve l’état précédent. Les anciens états sans encodage restent lisibles.

[Mesure reproductible du rejeu](reports/radar-reliability-2026-10-28/storage.json).
Tests : aller-retour complet, redémarrage ordinaire, historique et files, idempotence,
réduction du stockage, preuves manquantes/altérées et encodage inconnu.
La fusion et le déploiement ont été autorisés ensuite par l’utilisateur ; leur résultat
réel sera consigné dans la PR après les contrôles de livraison.
