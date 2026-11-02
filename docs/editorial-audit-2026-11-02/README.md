# Audit éditorial — 2 novembre 2026

Départ : master `414bd67a1afa1ae9cc003e5e98a3f0c0f6b92d2d`. Références lues : `CLAUDE.md`, audit du 18 octobre, calendrier validé du 1er novembre, squelette courtiers, revue Hey Grok, publication budget du 30 octobre, audit Générateur du 29 octobre et tests du modèle public validé. Les consignes de cette demande priment. PR ouvertes relues : #1140 (budgets), #1141 (situations de maintenance), #1061 (encours), #1042 (guide) ; #1142 apparue pendant le travail (preuves de réparations). Leurs données et textes restent hors du lot.

## Périmètre et méthode

[Inventaire](inventory.md) : **1 419 textes complets**, dont **518 changent**, dans 16 familles. Il s’agit de tous les catalogues statiques et d’un échantillon des moteurs combinatoires, complété par leurs tests existants. Les deux archives `before.json.gz` et `after.json.gz` conservent intégralement ces textes et le calendrier ; [exemples complets avant/après](examples.md) pour chacune des huit familles modifiées. Les exemples synthétiques sont identifiés, jamais proposés comme données réelles.

Le calendrier raccorde Performance depuis, Coulisses, Générateur, Classements, DCA/Budget, Calculateur, Courtiers/Hey Grok, Guide de banque, Fiches ETF/Comparatif, Questions du dimanche, Investisseurs et la rotation Fiches pratiques/Faits/Anniversaire. Récaps, tweets personnels et bilan restent hors application. Ni Dilemme ni Analyse d’entreprise ne sont réintroduits au calendrier.

Lecture des textes entiers : accroche, informations de produit, résultat, méthode et fin. Les contrôles couvrent gain/perte/stabilité, une/trois années de classement, deux/six lignes, noms longs, données partielles, cours final saisi, deux prix personnalisés, DCA et versement unique, USD/EUR, niveaux Bitcoin à un/cinq/dix ans, performances simples/comparées. Les suites existantes élargissent la couverture : 6 404 fenêtres annuelles, catalogues d’indices et d’ETF, allocations manuelles et profils.

## Changements et motifs

| Famille | Défaut précis | Correction |
|---|---|---|
| Comparatif ETF | Douze accroches reprenaient « Quel ETF choisir pour investir dans… ». | Accroches fondées sur la différence réellement examinée : marchés couverts, indice, filtre, enveloppe ou couverture du yen. Aucun changement d’exposition ni de chiffre. |
| Classements | « Parmi ces actions, lequel… », puis pronom masculin ; convention absente du texte copié ; très petite variation arrondie à zéro. | « laquelle », question finale accordée et convention existante reprise depuis `coverage.basis`. Une variation non nulle inférieure à 0,01 % devient « hausse/baisse de moins de 0,01 % ». Période, devise, classements, ex æquo et annualisation restent identiques. Le formatage de l’image reste hors de cette PR. |
| DCA | Espaces d’unité absentes ; « il/elle » déduit d’un emoji, fragile pour les professions et personnes neutres. | « 3 200 € », « 500 € », et « Chaque mois, les versements sont répartis ainsi ». Profil, salaire, DCA, portefeuille, flux, question finale et mention financière restent dans le même ordre. |
| Coulisses des indices | Questions qui présupposent un poids américain/financier élevé ; annonce d’entreprises malgré des positions absentes ; photographie non datée dans le texte copié. | Questions sans concentration présupposée, transition adaptée aux lignes disponibles, date de composition conservée dans la copie. Les dates et conventions des performances restent distinctes. |
| Calculateur | Transition longue répétant l’accroche ; flèche haussière devant un capital en perte ; prix saisis racontés comme un parcours historique ; fréquence et bornes peu explicites. | Transition directe, icône selon le signe, scénario saisi explicitement qualifié ; nombre et dates inclusives des versements en fin de mois. Notes de méthode existantes reprises ; réinvestissement précisé pour les séries ajustées. Aucune baisse supposée par la question DCA. |
| Fiches ETF | « Encours : Part : … », frais comme « 0,48% ». | « Encours de la part : … » ou « du fonds », espace avant %. Montant, devise, date et portée identiques. `buildFactRows`, utilisé par l’image, reste intact. |
| Générateur | Pourcentages collés dans les lignes copiées. | Espace avant %. Toutes les accroches chiffrées, trois variantes, thèses et question finale explicitement validées restent inchangées. |
| Investisseurs | Avec six positions et trois premières concentrées : « Les 1 autres entreprises… ». | Singulier dans cette branche précise. Aucun mouvement déduit d’un poids, aucune déclaration assimilée au patrimoine personnel. |

## Formats conservés après examen

- **Le budget de…** : structure, réserves sur ressources/dépenses, périodes, CHF/EUR, objectifs, sources et profils inchangés. Aucun fichier du chantier #1140 modifié.
- **Performance depuis** : détail annuel, cumul, devises et conventions, simple/comparatif ; aucune conclusion ajoutée.
- **Il y a X ans** : prix/niveaux datés, doublement classé avant arrondi, comparaison sous conditions ; Bitcoin reste en dollars.
- **Courtiers** : 28 paires, rubriques, offres conditionnelles, plafonds, preuves partielles et transparence XTB conservés. Le moteur court actuel prime sur les anciennes descriptions documentaires.
- **Hey Grok**, ses quatre modèles paramétrés, **Guide** et **Questions du dimanche** : angles et mécanismes distincts ; textes de banque, brouillons, favoris et historique intacts. Le « je » des archives personnelles n’est ni inventé ni réécrit.
- **Fiches pratiques** : exposition, comparaisons et simulations sous hypothèses conservées ; pas de conclusion uniforme ajoutée.
- **Faits marquants** : récits longs et repères mensuels gardent leurs formes différentes, leurs sources et « Pas un conseil financier ».
- **Fiches ETF** et **Générateur** : structures validées conservées, seules les corrections listées ci-dessus s’appliquent. Le raccourci « Pas un conseil. » demandé au Générateur le 29 octobre est conservé ; les mentions complètes déjà demandées ailleurs sont préservées. Aucune mention ajoutée sur une image.

## Préservation et limites

Aucun calcul, valeur financière, collecteur, source, profil ni moteur d’image modifié. Les fichiers régénérés par le build sont exclus du commit. Aucun schéma/identifiant/clé de stockage changé. Le DCA restaure le brouillon enregistré ; le budget distingue déjà texte généré et texte édité ; les brouillons Coulisses restent prioritaires par sélection/devise/convention. Aucune migration ne remplace le contenu de l’utilisateur. Copier et télécharger ne deviennent pas des publications déclarées.

**Signalements financiers séparés :** aucune nouvelle incohérence chiffrée démontrée pendant cet audit. Les sources en panne, historiques refusés et observations partielles du suivi existant ne sont ni réparés ni requalifiés par cette PR. Les notes de méthode ajoutées rendent les chiffres lisibles, sans les recertifier. Les publications longues dépassent souvent 280 caractères ; aucune précision nécessaire n’est sacrifiée pour les y faire tenir et aucun fil n’est inventé.

## Vérification

- Build complet, budgets de bundles et concordance des 42 fichiers publics : réussis localement, seuils inchangés.
- Tests ciblés : nouveau contrôle des textes conditionnels (intégré au prébuild), profils DCA, classements, éditorial Générateur, 279 présentations, fiches d’indices, 6 404 fenêtres historiques, audit des contenus publiables, portabilité budget et stockage DCA réussis.
- Recette Chromium 1440/390 : 20 contrôles réussis, dont 18 copies exactes (sept familles, DCA du calculateur et prix final saisi en perte) et deux restaurations de brouillon DCA. Aucune erreur JavaScript ni débordement horizontal. Preuves : `browser-local.json`. Les statuts GitHub et public restent à vérifier et ne sont pas déduits du build local.

Rejeu : `node scripts/test-editorial-20261102.mjs` ; `node scripts/audit-editorial-20261102.mjs /tmp/editorial.json` ; après `npm run build` et démarrage de `vite preview` sur 4173, `node scripts/playwright-editorial-audit.mjs`.
