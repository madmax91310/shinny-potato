# Extension des fiches d’indices entièrement automatisées

## Périmètre

Les cinq fiches existantes S&P 500 Equal Weight, MSCI World ex USA, MSCI World Minimum Volatility (USD), MSCI World Sector Neutral Quality et MSCI World Enhanced Value lisent désormais le constructeur strict des observations automatisées, sans repli numérique vers leur archive. Leur texte éditorial et leur squelette restent conservés. Deux fiches sont ajoutées : S&P Euro High Yield Dividend Aristocrats et S&P High Yield Dividend Aristocrats (univers américain du S&P Composite 1500, distinct du S&P 500 Dividend Aristocrats).

Chaque fiche exige le comptage exact, les pays, les secteurs, les principales entreprises et leurs poids, une composition datée et les cinq dernières années civiles complètes de performances de l’indice, dividendes réinvestis. Les observations Price Return et incomplètes sont refusées. Les ETF ne remplacent pas les indices : la source Amundi fournit les colonnes d’exposition de l’indice ; Invesco et State Street fournissent explicitement la ligne de performance du benchmark.

## Actualisation sans intervention

`refresh-automated-index-sheets.yml` collecte les sept indices chaque jour à 06:40 UTC et sur demande. Une PR modifiant le raccordement déclenche une qualification réelle sur macOS 15. Ce runner permet de vérifier le téléchargement public S&P séparément des restrictions rencontrées sur Linux. Le chemin strict désactive le repli vers `sp-public-feed.json` : aucun fichier à renouveler manuellement ne valide cette collecte.

Le script `refresh_index_sources.py --ids … --require-complete --apply` écrit le rapport d’observations avant la validation. Si un des sept indices échoue, aucun enregistrement de cette collecte n’est appliqué. Les anciennes données fiables restent publiées avec leur date réelle ; le job échoue explicitement. Une collecte complète passe les tests des consommateurs et l’audit des faits avant commit et déploiement. Les écritures sont sérialisées avec les autres actualisations de marché.

La variante américaine est collectée uniquement par ce workflow dédié afin de ne pas créer une nouvelle dépendance au handoff S&P sur le runner Linux historique. Les cinq autres indices et Euro conservent aussi leur collecte historique.

## Qualification du 12 octobre 2026

Les sept collectes directes ont réussi localement. Toutes les compositions portent la date du 30 septembre 2026. Les publications de performances MSCI et State Street sont également au 30 septembre ; la publication trimestrielle Invesco Equal Weight reste au 30 juin 2026, dans sa fenêtre de validité de 130 jours. Aucun changement de date artificiel.

Les tests vérifient la propagation d’une future composition et d’une nouvelle année jusque dans le tweet, l’absence de doublon, les identités exactes des indices, le rejet d’une source partielle et l’impossibilité de remplacer une collecte directe par le handoff. Les exports conservent le rendu et les illustrations approuvés.
