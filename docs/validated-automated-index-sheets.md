# Fiches d’indices : validation complète de l’automatisation

Les cinq fiches déjà présentes S&P 500 Equal Weight, MSCI World ex USA, MSCI World Minimum Volatility (USD), MSCI World Sector Neutral Quality et MSCI World Enhanced Value exigent désormais les observations automatisées complètes, sans repli numérique vers une ancienne archive. Leurs textes et leur squelette sont conservés ; aucune fiche n’est dupliquée.

Le constructeur exige le comptage exact, les pays, les secteurs, les entreprises et leurs poids, une composition datée et les cinq dernières années civiles complètes de performances de l’indice, dividendes réinvestis. Les observations partielles et Price Return sont refusées. Les tests vérifient la propagation d’une future composition et d’une nouvelle année jusque dans le tweet.

Le workflow `refresh-automated-index-sheets.yml` collecte les cinq indices chaque jour à 06:40 UTC, sur demande et pour qualifier les PR. Il utilise le même environnement Linux que la collecte historique. Le chemin `refresh_index_sources.py --ids … --require-complete --apply` écrit le rapport puis vérifie toutes les observations avant d’appliquer quoi que ce soit. Une erreur préserve les données fiables avec leur date réelle et fait échouer le job. Les tests consommateurs et l’audit passent avant commit et déploiement ; les écritures sont sérialisées avec les autres collecteurs de marché.

Collecte locale du 12 octobre 2026 : cinq compositions de septembre et cinq séries de rendements réinvestis validées. Les performances Equal Weight proviennent de la ligne exacte de l’indice SPXEWTR publiée par Invesco ; sa publication trimestrielle reste datée du 30 juin 2026, dans la fenêtre de validité de 130 jours. Les performances MSCI sont datées du 30 septembre. Aucune date n’est artificiellement actualisée.

## Candidats exclus de cette livraison

Euro Dividend Aristocrats et la variante américaine High Yield Dividend Aristocrats ont été qualifiés localement, mais le workflow direct sur GitHub macOS a échoué : l’endpoint officiel S&P refuse la composition avec HTTP 403. La validation locale ne suffit donc pas à garantir leur collecte sans intervention. Aucune de ces deux fiches n’est activée et aucun nouveau collecteur américain n’est ajouté. Le collecteur Euro déjà présent dans le catalogue est conservé ; son existence ne constitue pas une certification complète de l’actualisation sans handoff. L’ajout devra attendre une source complète accessible au collecteur planifié.
