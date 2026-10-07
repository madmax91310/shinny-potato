# Fiabilité des collectes QYLD, WisdomTree et iShares

## Comportement de la collecte récurrente

Les requêtes HTML, JSON et PDF restent bornées à trois tentatives pour les erreurs temporaires 429/500/502/503/504 et les pannes réseau. Le délai `Retry-After` publié par l’émetteur est pris en compte (secondes ou date HTTP), avec un plafond de 30 secondes par attente. Les 403 et 404 ne sont pas répétés sur la même URL ; ils peuvent sélectionner une source officielle de secours qualifiée.

Une réponse de transport au mauvais format est distinguée d’une erreur de validation du contenu. Un ISIN, une devise, une date ou un schéma incorrect ne déclenche pas une recherche sur une autre part et n’est jamais accepté par le secours. Les téléchargements gardent les limites de taille et les contrôles de fraîcheur existants. Aucun cache local n’est re-daté.

| Collecteur | Accès principal | Secours / comportement |
|---|---|---|
| QYLD IE00BM8R0J59 | https://globalxetfs.eu/funds/qyld/ | Route canonique https://globalxetfs.eu/funds/qyld, uniquement après panne de transport. Même infrastructure, donc aucune indépendance garantie. Frais et encours lus dans l’unique bloc Key Information daté ; navigation exclue. |
| Six WisdomTree | Pages exactes publiques wisdomtree.com/gb/products | Fiche courante dataspanapi.wisdomtree.com, déjà qualifiée par ISIN/devise/date. Le secours couvre désormais aussi une réponse au mauvais type de contenu. La fiche peut préserver frais, calendriers et allocations publiées ; elle ne publie pas l’encours, qui reste à sa date antérieure. |
| iShares structurés | API publique BlackRock product-data | Page publique iShares UK du même productId, avec cookies et en-têtes de page publique ; les mêmes composants et les mêmes contrôles sont utilisés. Les positions sont relues via l’API officielle déclarée par leur composant HTML. Si cette API échoue, les autres champs restent valides et les positions antérieures sont conservées. |
| WPEA / SPEA | Page iShares CH exacte | Page BlackRock FR puis fiche mensuelle FR existantes, désormais sélectionnables aussi après réponse de transport au mauvais format. Les contrôles du benchmark et de l’exposition exacte restent actifs. |

Les récupérations par secours figurent dans le JSON d’observation (`sourceAttempts`), les logs et le résumé Actions. Un secours réussi n’est pas signalé comme un échec. Un champ ou instrument toujours en échec provoque un code de sortie non nul **après** application des autres observations valides.

Le lot iShares isole maintenant les erreurs par instrument, les erreurs du complément de positions et les rejets à la fusion. Les enregistrements acceptés sont publiés dans une seule écriture atomique ; l’instrument rejeté reste inchangé. Le workflow existant conserve son signal d’échec de collecte et peut publier les autres observations après les audits. Calendrier inchangé : les 3 et 16 du mois.

## Qualification réelle du 7 octobre 2026

Les neuf collectes ciblées ont été relues avec les changements : QYLD, WPEA, SPEA, WisdomTree Physical Gold, Physical Bitcoin, Copper, Europe Defence, Quantum Computing et Global Quality Dividend Growth. Toutes ont réussi sans erreur de complément.

Une panne forcée de l’API structurée iShares Core MSCI World IE00B4L5Y983 a été testée avec une **page publique réellement téléchargée** : ISIN, USD, capitalisation, encours au 06/10/2026, calendriers 2016–2025 et dix positions validés. Les calendriers ont conservé les rendements NAV de la part, pas ceux du benchmark.

Neuf tests de régression couvrent temporisation, tentatives bornées, réponses au mauvais format, secours exact, identité et fraîcheur, refus d’un JSON corrompu, isolation d’un instrument et d’un champ, et conservation lors d’un rejet à la fusion. La suite Python complète compte 199 tests réussis, dont les neuf tests de fiabilité. Compilation et audits provenance / complétude ETF réussis. Les tests de fiabilité sont raccordés aux workflows de collecte et de déploiement.

## Limites restantes

QYLD conserve seulement frais et encours automatiques. La page affiche les performances de la part USD Accumulating ; elles ne qualifient pas le calendrier de la part USD Distributing IE00BM8R0J59. Les groupes de constituants de référence et le panier de substitution ne sont pas convertis en exposition du fonds.

L’ancienne fiche https://globalxetfs.eu/content/files/QYLD_UCITS-factsheet.pdf renvoie 404. Le lien Factsheet publié dans la page vers https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1 a renvoyé 500 après les tentatives bornées. Le Product Profile actuellement publié ne constitue pas une fiche de données mensuelles qualifiée. Aucun de ces documents n’est activé comme secours fiable ou comme calendrier de la part.

Les accès HTML/API/PDF d’un même émetteur peuvent échouer ensemble. La conservation des dernières données et le signal d’échec restent donc nécessaires. Cette passe augmente la robustesse de la collecte ; elle n’augmente pas les couvertures de champs (139 pays, 140 secteurs, 140 compositions sur 155 instruments).
