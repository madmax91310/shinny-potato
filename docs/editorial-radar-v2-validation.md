# Validation du Radar éditorial — 24 octobre 2026

## Périmètre livré en PR

Les constats sur les salaires, les deux seules sources ETF, le plafond de huit PDF sur sept jours, le rejet multi-ISIN, le classement par famille et les cinq cartes sans accès direct aux autres sujets ont été confirmés dans `master` initial `216dd2bf`.

La branche ajoute la découverte déterministe de publications officielles, les files persistantes, les preuves et dates distinctes, le regroupement, le classement explicable et la migration des notifications. Les connecteurs réellement exploités sont détaillés dans [la matrice](editorial-radar.md#découverte-réellement-vérifiée) et [le relevé réel JSON](../reports/radar-publications-2026-10-24/sources.json).

Le nouveau `master` `5606834b` (#924) est repris avant livraison : l’adaptateur synchrone du Radar et la correction de date propre aux prix sont conservés. La PR #925 « Données à revoir » a été examinée ; aucun de ses fichiers n’est modifié par cette évolution, hors dépendances communes lues. Aucun retour de Portefeuilles IA, aucun audit général relancé, aucun seuil financier abaissé, aucun collecteur financier partagé modifié.

Le budget JavaScript de cette route passe de 684 à 700 ko de code rendu pour les critères détaillés, types de faits, preuves et produits groupés. C’est un budget de taille de code, distinct des validations financières ; les budgets des autres routes et les seuils financiers restent inchangés. Les projections produites par le build ne sont pas committées.

## Avant / après sur les cas demandés

| Cas | Avant confirmé | Résultat |
| --- | --- | --- |
| INSEE salaires 2025 | Libellé technique de tableau, unité vide, signal secondaire et exclu des notifications prêtes | « Salaire médian du privé : 2 238 € nets par mois en 2025 ». EQTP, net avant impôt, population et exclusions explicites ; médiane et D9 regroupés par publication. Période 2025, publication 22/10/2026 et collecte distinctes. Comparaison avec 2024 conservée, sans affirmer une hausse de pouvoir d’achat à partir des montants nominaux. |
| Amundi trois ETF | Source non découverte par la veille externe ; titre indirect non reconnu ; PDF et ISIN unique attendus | Découverte par sitemap officiel ; date du site **14/10/2026**, distincte du « Paris, le 13 octobre » du communiqué. Corps HTML confirmant trois nouvelles solutions. Trois noms extraits séparément ; cotation Xetra/Euronext Paris annoncée le 20 octobre. Frais, ISIN, PEA et disponibilité chez un courtier restent inconnus dans cet extrait. Annonce groupée exploitable sans compléter artificiellement une fiche ETF. |

Les montants de cette table sont ceux du cas historique demandé, pas des constantes imposées aux données vivantes. Les tests d’intégration lisent les valeurs attendues dans les registres actuels.

## Contrôles locaux

- `npm run test:radar` : tests existants et nouveaux cas de publications, scores, diversité, types, INSEE/Amundi, HTML/PDF, plusieurs produits/parts, inconnues, hors catalogue, dates, panne/reprise, migration et conservation du flux.
- `npm run build` : générateurs, Vite, budgets des routes et cohérence des certificats publiés.
- `npm run test:radar:browser` : Chromium réel en 1440×1000 et 390×844. Sélection, autres sujets, ordre, recherche, filtres, regroupement, détails, sources et dates, lecture persistante, copie, historique, erreurs, données conservées et absence de débordement. Notifications réseau interceptées : aucun envoi utilisateur.
- `python3 -m unittest discover -s scripts -p test_dws_reconciliation.py` : huit tests des rapprochements financiers.
- `node scripts/test-economic-consumers.mjs` et `node scripts/audit-household-statistics.mjs` : conventions et consommateurs économiques/France en 100 préservés.
- `npm run lint` : pas d’erreur bloquante ; avertissements préexistants du dépôt distingués des fichiers ajoutés.

Le navigateur utilise des fixtures réseau sur la **vraie application construite**, pas le site de production. Les accès réels aux sources sont vérifiés séparément par `check-radar-sources.mjs`. Cela ne vérifie ni une publication sur `radar-data` ni une réception mobile.

## Échantillon réel et mesure

Le contrôle borné du 24 octobre a effectué trois passages sans envoi, sur les sources publiques : 33 extractions réussies, les deux références demandées découvertes et extraites. Les compteurs exacts, dates, URLs, hashes, files et délais sont dans le relevé JSON. Ces nombres décrivent cet échantillon ; ils ne deviennent pas des assertions sur les prochains relevés.

L’échantillon connu de ratés rejoué est INSEE + Amundi : deux références retrouvées sur deux. Il ne permet pas d’estimer le taux global de publications manquées. Les faux positifs, doublons, variations secondaires et compositions importantes sont couverts par des cas de référence, sans prétendre fournir une précision statistique sur tout le Web. Les annonces anciennes DWS ou les dividendes Global X ne sont pas présentés comme de nouveaux lancements.

Les délais de reprise initiale publication → découverte mesurent un rattrapage d’archive, pas une latence normale du futur service. Les métriques sont conservées par document, avec publication, découverte et disponibilité séparées ; les prochains passages réels permettront de mesurer la latence courante après activation.

## Notifications et planification testées

Cron horaire en journée, garde `Europe/Paris` et changement d’heure testés ; voie légère sans relance DWS. Alertes majeures plafonnées à deux groupes par passage, trois par jour ; récap à partir de 19 h, cinq groupes et un récap par date locale. Même score et même condition de fiabilité que l’écran. Déduplication par événement et publication, récupération des reçus du bot après crash, absence de notification rétroactive lors de la migration.

La simulation couvre un échec **après création de l’issue mais avant commentaire**, puis la reprise ; l’affichage dans la description ne suffit plus à acquitter un envoi. L’état en erreur/pending est persistant. Le canal reste GitHub, sans compte ou secret supplémentaire. Le détail et les réglages mobiles nécessaires sont dans [le fonctionnement](editorial-radar.md#planification-notifications-et-reprise).

## Limites restantes

- DARES : page de vérification de sécurité, y compris en HTTP 200 ; pas de contournement ni de flux inventé.
- Endettement Banque de France : découverte des documents effective, extraction numérique bloquée par la représentation graphique ; aucune lecture approximative ni reprise d’un chiffre d’un autre périmètre.
- iShares, State Street/SPDR, Invesco, VanEck, UBS et JPMorgan : portails testés, mais archives de publications UCITS/extractions non qualifiées. Ils sont affichés **non raccordés**, avec contrôle d’accès quotidien. Cela n’est pas une couverture achevée.
- Profondeur bornée à la fenêtre officielle RSS ou à la page/modèle rendu pour INSEE, DREES, DWS, WisdomTree, BDF et canaux existants ; aucune pagination non testée n’est déclarée. Le sitemap Amundi fournit une archive plus profonde.
- Champs inconnus dans les annonces conservés comme tels ; aucune disponibilité commerciale déduite d’une place de cotation.
- Le flux conserve les secondaires récents ; leur archive intégrale reste dans l’état Git, sans pagination distante intégrée à l’écran.

## Statut de livraison

Implémenté et testé localement ; contrôle réel des sources effectué ; PR sur `master`. La CI sera à lire sur le commit de la PR, séparément des résultats locaux. Ce relevé décrit la validation initiale avant autorisation de livraison. La demande suivante autorise fusion et déploiement ; leurs preuves seront consignées séparément. Aucun envoi réel de notification et aucune publication X pendant les tests. La réception sur téléphone reste non vérifiée.

Preuves visuelles de la recette locale : [INSEE sur ordinateur](../reports/radar-publications-2026-10-24/preuves/insee-desktop.png), [Amundi sur mobile](../reports/radar-publications-2026-10-24/preuves/amundi-mobile.png). Les valeurs du scénario historique restent isolées des registres vivants ; la comparaison salaire rejouée est 2 190 → 2 238 euros pour la médiane et 4 334 → 4 441 euros pour le D9.

Extension : voir [les sources et conventions immobilières](editorial-radar-extensions.md), les tests `test-radar-extensions.mjs` et la vérification réelle `verify-radar-production.mjs`.
