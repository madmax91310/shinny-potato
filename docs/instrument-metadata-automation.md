# Renouvellement automatique des métadonnées par ISIN

Les six familles contrôlées sont la distribution, le domicile, la réplication,
l’éligibilité PEA, la couverture de change et les cotations. Le collecteur quotidien
lit les sources puis enregistre chaque champ réellement observé avec sa valeur,
son URL effective, sa date de contrôle et l’empreinte SHA-256 du document.

## Sources et qualification

- Les API et documents émetteurs restent prioritaires. Les pages justETF françaises
  complètent les caractéristiques et leurs badges PEA explicites. Le parseur lie
  uniquement les lignes de caractéristiques et le badge propre à l’ISIN d’en-tête ;
  les promotions, fonds similaires et autres parts restent hors de ce périmètre.
- Les références publiques Fortuneo et Bourse Direct complètent le statut PEA lorsque
  leur tableau l’indique explicitement et que l’identité de la réponse correspond.
  PEA, PEA-PME et SRD sont trois statuts distincts. Le registre
  `scripts/instrument-metadata-supplemental-sources.json` contient des adresses à
  interroger, jamais des valeurs fiscales recopiées depuis un moteur de recherche.
- Une URL candidate, une réponse accessible, un tiret, une dénomination de fonds ou
  une devise ne prouvent aucun statut. Les réponses absentes ou ambiguës restent
  en attente. Un désaccord explicite sur PEA ou la couverture de change empêche
  leur renouvellement et reste dans le diagnostic.
- Les cotations exigent toujours un document émetteur ou une place de marché.
  Une fiche justETF ou un courtier ne remplace pas cette preuve. Le nouveau
  parseur Bitwise contrôle l’ISIN, la devise, la place et les codes dans chaque
  ligne, sans emprunter les données d’une autre ligne.

## Exécution et contrôle

`build-automation-targets.mjs` reconstruit les sources, puis
`collect_instrument_metadata.py --apply --output <rapport>` renouvelle les seuls
champs observés. Les dernières preuves valides sont conservées pendant une panne.
Les délais d’alerte viennent de `src/data/freshness-policy.json` ; aucune date de
succès n’est créée pour une tentative infructueuse. Bourse Direct possède une
attente bornée à huit secondes et une tentative par URL, car ce serveur peut
laisser les connexions sans réponse.

La CI des PR observe les réponses publiques sans modifier les registres de
production. `probe_instrument_metadata.py` archive les réponses par ISIN, leur
provenance et les champs extraits. Elle construit ensuite l’application avec cet
instantané qualifié et vérifie les règles communes, les Fiches ETF, le Comparatif
ETF et l’écran de couverture dans Chromium, sur mobile et ordinateur. Les
documents bruts sont répartis en quatre archives et conservés quatorze jours.
Les extraits de régression versionnés possèdent leur provenance et leur empreinte.

## Consommation des valeurs

La politique de distribution distingue capitalisation, distribution et politique
mixte ; les libellés publiés par DWS et Amundi sont normalisés sans tronquer la
politique mixte. Une nouvelle preuve de couverture de change remplace aussi
l’ancienne description dans les outils. Un booléen de couverture ne permet pas
d’inventer une devise de couverture.

La couverture actuelle et les lacunes par champ restent dans le rapport généré
`public/data/asset-field-coverage.json` et l’écran « Données à revoir ». Un champ
qui n’a pas de déclaration vérifiable reste inconnu et continue d’être contrôlé.
