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

`replay_metadata_evidence.py` peut requalifier ces réponses archivées avec le
parseur courant, sans réseau : il vérifie leur empreinte, leur identité et conserve
la date de chaque téléchargement réussi. Rejouer une réponse ancienne ne la
transforme jamais en un nouveau contrôle. Cela permet d’enregistrer les preuves
collectées pendant ce chantier même lorsqu’une source refuse les appels suivants.
Les requêtes sont sérialisées par hôte ; un refus 403 ou 429 suspend cet hôte pendant
cinq minutes dans le processus, sans retenter chaque ISIN. Les nouvelles révisions
Trois échecs de transport consécutifs suspendent également l’hôte ; un document
absent isolé ne bloque pas les autres parts. Les nouvelles révisions
d’une PR annulent ses observations devenues obsolètes.

Les contradictions connues sont dans `scripts/metadata-qualification-holds.json`,
avec les deux déclarations observées et leurs preuves. Le champ n’est pas renouvelé
tant que les deux sources n’ont pas été relues avec des valeurs concordantes. Une
source indisponible ne résout pas une contradiction ; le diagnostic de qualification
reste visible. Le cas initial concerne le PEA de `IE00B0M62S72` (justETF/Fortuneo).

L’enregistrement initial de ce chantier reprend 711 réponses publiques archivées
et vérifiées avec le parseur courant. Il complète les quatre caractéristiques de
base pour les 258 supports, conserve 250 ensembles de cotations qualifiées et
116 statuts PEA documentés. Les refus constatés à la dernière tentative restent
dans le diagnostic ; ces observations archivées ne sont pas redatées. Les deux
déclarations contradictoires du statut PEA cité ci-dessus restent séparées.

## Consommation des valeurs

La politique de distribution distingue capitalisation, distribution et politique
mixte ; les libellés publiés par DWS et Amundi sont normalisés sans tronquer la
politique mixte. Une nouvelle preuve de couverture de change remplace aussi
l’ancienne description dans les outils. Un booléen de couverture ne permet pas
d’inventer une devise de couverture.

La couverture actuelle et les lacunes par champ restent dans le rapport généré
`public/data/asset-field-coverage.json` et l’écran « Données à revoir ». Un champ
qui n’a pas de déclaration vérifiable reste inconnu et continue d’être contrôlé.
