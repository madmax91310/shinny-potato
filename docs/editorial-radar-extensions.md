# Extension ETF et immobilier — qualification du 24 octobre 2026

L’extension fait partie de la PR #926, encore ouverte au moment de cette demande. Elle conserve le premier lot, ses seuils financiers et les collecteurs partagés.

## Sources effectivement raccordées

| Source | Découverte / preuve d’extraction réelle | Portée et limites |
| --- | --- | --- |
| BNP Paribas AM | API publique de la salle de presse, deux pages de douze publications ; annonce du 24/06/2026 extraite avec quatre noms distincts | Groupe exploitable même sans ISIN/TER lisible ; aucun coût issu d’une image attribué aux quatre fonds. Une cotation n’est pas une création. |
| Xtrackers | Table datée de la salle de presse ETF ; modèle officiel du communiqué du 04/08/2026 et tableau des parts | ISIN et TER associés par ligne ; pas de transfert de frais entre parts. La date du modèle/liste prime sur la date technique différente du JSON-LD. Le serveur exige la barre oblique finale : sans elle HTTP 500, avec elle HTTP 200. Le transport conserve cette route officielle, indépendamment de la clé de déduplication. |
| HANetf | Communiqués officiels rendus ; deux ETF Trading Central extraits du communiqué du 13/10/2026 | Corps d’article isolé des menus et actualités liées. Les produits hors catalogue sont découverts. Plusieurs partenaires UCITS couverts par cette plateforme. |
| Deutsche Börse / Xetra | Liste officielle des communiqués ; cotations du 21 et du 20/10/2026 réellement extraites | Canal primaire complémentaire pour tous les émetteurs ; chaque événement reste une cotation tant qu’une création n’est pas prouvée. Pas de disponibilité courtier déduite. Les noms et ISIN d’un émetteur inconnu sont lisibles dans une table qualifiée sans registre applicatif préalable. |
| INSEE / Notaires-INSEE | RSS nationaux et conjoncture existants, filtrage étendu aux loyers et au logement | Prix anciens à qualité constante, indices, périodes et périmètres officiels. Aucun passage d’une médiane à un indice. |
| Notaires du Grand Paris | Page des communications immobilières ; publications du 01/10/2026 et du 08/09/2026 réellement extraites | Volumes, prix et conjoncture en Île-de-France ; mois/plages de mois/trimestres distincts de la publication. Aucune généralisation nationale à partir de Paris. |
| Banque de France | Liste et contenu Webstat des crédits aux particuliers | Nouveaux crédits à l’habitat dans la publication officielle. Les taux et les méthodes ne sont pas mélangés avec CSA. |
| Crédit Logement / CSA | Analyses mensuelles officielles, tableaux des taux et durées ; septembre et août 2026 vérifiés | Complément, distinct de BDF. La métadonnée éditoriale peut correspondre à la fin du mois statistique ; date de diffusion non certifiée, donc « à suivre ». Type de taux/assurance inconnus si non prouvés dans l’extrait ; aucune comparaison automatique avec un TAEG. |
| Observatoires locaux des loyers / ANIL | Publications locales datées ; Gironde 2025 publiée le 16/10/2026 retrouvée | Le document renvoie à un tableau de bord externe : publication visible « à suivre », aucun loyer, échantillon ou évolution locale inventé. Les autres zones restent dans la file. |
| DVF / DGFiP | API data.gouv.fr officielle, licence ouverte v2 contrôlée, ressources semestrielles et révisions détectées | Surveillance automatisée des livraisons. Le `last_modified` est une date technique, pas une publication statistique. Aucun téléchargement massif horaire ni prix local non qualifié : « à suivre ». |

Amundi, Vanguard, Global X et WisdomTree sont conservés. Le contrôle d’accès reste actif pour les autres émetteurs. Le relevé détaillé est dans `reports/radar-publications-2026-10-24/extensions-sources.json` ; ses compteurs décrivent un échantillon borné.

## Accès encore non qualifiés ou bloqués

- iShares/BlackRock : page corporate lisible, mais liste UCITS européenne non qualifiée ; route média individuelle essayée en HTTP 404. Xetra peut signaler ses nouvelles cotations sans constituer une salle de presse iShares complète.
- State Street/SPDR : page publique d’analyses accessible, liste de communiqués UCITS datés non retrouvée dans le rendu testé.
- Invesco : media hub public et PDF de communiqué Nasdaq identifié ; liste d’actualités rendue avec un contexte d’audience/gating, archive européenne automatique non qualifiée. Aucun PDF trouvé par recherche n’est ajouté manuellement au flux.
- VanEck : routes publiques françaises/UK variables (refus/redirections/404 selon route). L’archive américaine, accessible, ne remplace pas une archive UCITS européenne.
- UBS : article ETF réel accessible et extraction de date possible, mais listes locales et globales/API publique testées renvoient un sous-ensemble ancien sans ces actualités ETF. Pas de faux raccordement ; surveillance d’accès maintenue.
- JPMorgan : pages de presse US disponibles, routes GB testées en 404 ; ne pas remplacer des annonces UCITS par les ETF US.
- Notaires de France : portail national refusé HTTP 403 lors de la qualification ; aucune dépendance bloquante pour INSEE et Grand Paris.
- DARES et endettement BDF : limites du premier lot conservées et visibles.

Ces manques n’empêchent pas la livraison des connecteurs effectivement qualifiés. Les sources sont primaires ; l’extension ne dépend pas de revues de presse pour la découverte courante.

## Conventions et scénarios immobiliers

Les cartes conservent séparément : transaction/annonce, ancien/neuf, appartements/maisons, indice/médiane/m², zone, période statistique/publication/collecte, caractère provisoire/révisé, taux nominal/TAEG, nouveaux crédits/encours et assurance. Les conventions mixtes ou absentes restent inconnues. Une médiane descriptive peut évoluer avec les biens vendus ; elle n’est jamais une hausse à qualité constante.

La comparaison automatique exige des méthodes, fréquences, zones, biens et définitions documentés et compatibles. Une convention inconnue bloque la comparaison ; des séries BDF et CSA ne sont pas raccordées artificiellement.

Le contrôle DVF exclut échanges, usages mixtes, ventes comprenant plusieurs biens, surfaces absentes ou hors 9–500 m², prix absents ou valeurs au m² hors 100–30 000 €. Il déduplique les mutations et exige au moins **30 ventes comparables par trimestre** pour une simple médiane descriptive : borne minimale de prudence, pas une garantie de représentativité ou de précision. Des analyses locales supplémentaires nécessiteraient un traitement qualifié des fichiers et des diagnostics de couverture. Aucun prix ou mouvement mensuel local n’est actuellement publié par le Radar.

Un scénario facultatif est disponible dans les conventions immobilières. Tous les paramètres sont explicites : mensualité, durée, taux nominal hypothétique fixe, assurance sur capital initial, apport et frais déduits du budget. Aucun taux de marché n’est prérempli sans preuve. L’assurance ou les frais à zéro signifient exclus. Le résultat est un scénario pédagogique, pas une capacité accordée par une banque. Il ne génère pas un sujet ou une notification.

## Automatisation et migration

Les nouveaux connecteurs réutilisent la file durable, les requêtes conditionnelles, les bornes de coût, les reprises et le classement communs. Le curseur de sources est persistant : avec plus de sources que le budget documentaire d’un passage, une source ne peut pas être affamée par la position de sa configuration.

Le premier inventaire de chaque nouvelle source est marqué `backfill`. Le déploiement de la nouvelle politique marque aussi le premier rattrapage silencieux. Les faits et leurs vraies dates sont visibles, mais ces archives ne deviennent pas des alertes rétroactives. Les nouveaux documents admissibles des passages suivants peuvent notifier normalement. Les annonces de parts, cotations et enregistrements pour distribution en France ont des types distincts du lancement et du simple raccordement applicatif. Aucun faible encours ne disqualifie un nouvel ETF.

Les tests supplémentaires couvrent publications réelles, frais par part, noms hors catalogue, champs inconnus, révisions, valeur inchangée, conventions incompatibles, DVF insuffisant/atypique/doublonné, panne/reprise, hypothèses de simulation et silence du rattrapage. La recette Chromium exerce le scénario immobilier sur ordinateur et mobile.

Le contrôle CI de dates de « Données à revoir » a repris le correctif isolé de la PR parallèle #927 : la frontière historique mensuelle/annuelle utilise une fixture stable, tandis que les assertions sur les vrais portefeuilles 13F sont conservées. Aucun seuil de production n’est abaissé.
