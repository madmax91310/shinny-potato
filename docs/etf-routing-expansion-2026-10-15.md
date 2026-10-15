# Raccordements et diversité — 15 octobre 2026

## Livré

- Inventaire de tous les ETF publiés (174 ISIN au moment de la livraison), avec les destinations réelles par part. Les quatre lots de suivi précédents restent distincts. Une observation absente n'est jamais assimilée à zéro et une collecte ne prouve pas à elle seule un historique complet.
- 70 constructions supplémentaires, 347 au total : petites entreprises américaines value, émergents value, moyennes entreprises mondiales équipondérées, World couvert en euros, agro-industrie, bois, services publics, télécommunications, alimentation, médias et distribution européens. Les profils et plafonds de concentration sont conservés ; pas d'ajout de pays isolé ni de monoproduit.
- Trois nouveaux fonds qualifiés auprès des émetteurs et repris par les collectes existantes : State Street SPDR MSCI USA Small Cap Value Weighted UCITS ETF (IE00BSPLC413), iShares Edge MSCI EM Value Factor UCITS ETF (IE00BG0SKF03), iShares € Ultrashort Bond UCITS ETF (IE00BCRY6557).
- Fiches, trois comparatifs, trois duels de deux lignes, choix manuels DCA et générateur automatique raccordés. Les 100 scénarios DCA et leurs montants restent conservés. Les séries annuelles officielles sont utilisées sur leurs périodes communes ; aucune nouvelle série mensuelle n'est extrapolée.
- Le texte du générateur explique quand un secteur renforce une exposition déjà présente dans le socle mondial, sans ajouter de rubrique ni modifier les images.

## Qualification des cinq pistes

| Piste | Décision et preuve |
| --- | --- |
| USA Small Cap Value | Intégrée. Identité, cotations, composition et calendrier de la part contrôlés automatiquement sur https://www.ssga.com/uk/en_gb/institutional/etfs/state-street-spdr-msci-usa-small-cap-value-weighted-ucits-etf-zprv-gy. |
| Émergents Value | Intégrée. API officielle iShares produit 297452. Les sous-industries publiées (Steel, Copper, etc.) sont conservées avec leurs noms, sans conversion arbitraire en grands secteurs. Leur comparaison sectorielle reste non qualifiée par le moteur commun : le test empêche une assimilation implicite. |
| Obligations euro ultracourtes | Intégrée. API officielle iShares produit 258114 ; obligations investment grade, part EUR distribuante. Le risque de crédit et l'absence de garantie de capital sont explicites. |
| World Equal Weight | Étudiée, non intégrée. VanEck NL0010408704 suit Solactive World Equal Weight Screened, et non un MSCI World simplement équipondéré. La fiche officielle du 30 septembre 2026 fournit les calendriers, pays et principales positions, mais pas une table sectorielle complète. Identité des cotations et contrat de collecte complet restent à qualifier avant une fiche exploitable. Source : https://www.vaneck.com/hu/en/library/fact-sheets/tswe-fact-sheet.pdf ; page https://www.vaneck.com/uk/en/investments/world-etf/. |
| Infrastructures numériques | Étudiée, non intégrée. Global X VPN (IE00BMH5Y327), https://globalxetfs.eu/funds/vpn/. Le collecteur Global X physique actuel est qualifié pour COPX seulement et refuse explicitement cette autre part. Un nom de thème commun ne permet pas de réutiliser silencieusement le contrat COPX ; qualification spécifique et historique encore nécessaires. |

## Vérification

- 11 323 combinaisons exhaustives et 2 790 générations déterministes ; 9 300 simulations sans violation.
- 372 tirages verrouillés et 371 remplacements ; 53 duels préparés et 500 générations contrôlés.
- Tests éditoriaux, DCA, catalogue, cotations et 13 tests Python des collecteurs.
- Nouveau contrôle des raccordements de toutes les fiches, des nouveaux supports et de la conservation des sous-industries ; exécuté en CI.
- Parcours Chromium mobile/ordinateur étendu aux trois nouvelles fiches, comparatifs et duels. Le Chromium local échoue sur une restriction socket ; la CI doit valider ces parcours avant fusion.

## Limites explicites

Deux pistes restent en qualification, sans faux statut « intégré ». Les nouveaux historiques mensuels et les répartitions sectorielles incompatibles ne sont pas inventés. Le chantier séparé de refonte de l'image et d'exposition complète reste indépendant.
