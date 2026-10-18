# Outils éditoriaux — lot 7 (18 octobre 2026)

Chiffres recomptés sur le dépôt avant intervention : 11 indices complets dans `automated-indices.json`
sans fiche « Coulisses des indices » (l’audit en annonçait 12 ; le recomptage applique la règle de
complétude de `buildAutomatedIndexSheets`, cinq années communes incluses) ; 49 baisses mesurées dans
le registre des statistiques, 6 exposées dans « Faits marquants » ; une fiche pratique bloquée dès
qu’une source portait un drapeau de revue ; validité des guides de la Banque de tweets fixée par des
dates écrites à la main.

## Coulisses des indices

- `derivedSheetDefinitions` : tout enregistrement complet du collecteur quotidien qui n’a ni définition
  éditoriale ni fiche d’archive reçoit une fiche titrée par le nom canonique de l’indice. Onze fiches
  entrent ainsi : FTSE China 50, FTSE EM, MSCI China, MSCI China A, MSCI EM Asia Screened, MSCI
  Emerging EMEA ESG Transition, MSCI EM Latin America, MSCI Latin America Selection 20/35, MSCI Japan
  IMI, MSCI World High Dividend Yield Advanced Select, S&P Euro High Yield Dividend Aristocrats.
  51 sujets au lieu de 40.
- L’accroche d’une fiche sans intro écrite nomme l’indice et annonce sa composition ; les règles de
  texte (transition, sauvegarde, pays, secteurs, principales lignes, rendements de l’indice) sont
  celles des fiches existantes.
- Les fiches d’archive actualisées par les données automatiques conservent titre, intro, lecture et
  conclusion approuvés.
- `verify-factsheet-tweets.mjs` n’exige plus « 40 » : il exige une fiche pour chaque indice complet du
  registre, et au moins les quarante sujets historiques.

## Faits marquants

- `storyAngle` : toute baisse mesurée sur une série à revenus réinvestis reçoit un angle (catégorie,
  accroche, chute) ; les six angles écrits à la main gardent leur texte et leur place en tête. Le
  gabarit distingue actions, obligations et indices, et ne parle de remontée que si le niveau a été
  retrouvé (la chute change sinon). 48 récits exposés (6 écrits, 42 gabarits).
- Le CAC 40 reste exclu : indice de prix, dividendes non réinvestis, sa baisse n’est pas comparable.
- Pas d’export PNG : l’outil n’a pas de rendu image et aucun gabarit de carte texte n’existe dans le
  système de design ; à traiter avec les primitives de publication partagées (lot 10).

## Fiches pratiques

- Un drapeau de revue (« source modifiée, explication à vérifier ») devient un avertissement affiché
  et n’empêche plus la copie ni l’image ; seule une preuve manquante (URL ou date de contrôle absente)
  bloque. Le test vérifie les deux cas.
- La source SEC (13F FAQ) en erreur depuis le 14/10 conserve sa dernière observation et affiche
  « dernier contrôle en échec » : avertissement, pas blocage.

## Banque de tweets

- `evidenceCheckedAt` : pour les guides produits, la date de contrôle la plus ancienne parmi les ISIN
  cités (caractéristiques et encours du registre) borne la validité ; la date de relecture manuelle ne
  suffit plus. Cinq guides sont ainsi bornés par le registre ; les ISIN sans enregistrement n’entrent
  pas dans le calcul. Libellé : « Relu le … · données contrôlées le … ».
- `test-tweet-bank-validity.mjs` (portail) : date la plus ancienne retenue, prêt le jour du contrôle,
  périmé au-delà de la fenêtre.

## Vérifié sans changement

- Anniversaires : `anniversaryRecords.isReady` du source est le repli hors Vite ; le greffon
  `project-selected-data` remplace ce module en développement comme en production par un chargeur
  réel, testé dans `test-selected-records.mjs`. Pas de « isReady factice » publié.
- Lexique : les chiffres réglementaires viennent déjà de `regulatory-data.js` (`n('lddsRate')`…) ;
  la moyenne AMF de 0,33 % est une statistique datée et sourcée, pas un paramètre réglementaire.
- Présentations : aucun parsing de `fees.notes` par chaîne n’existe dans le code courant ; rien à
  corriger sur ce point.

## Limites

- Les textes dérivés (fiches et récits) sont des gabarits honnêtes mais moins incarnés que les textes
  écrits ; ils portent `derived: true` pour être repérés et réécrits à la main si besoin.
