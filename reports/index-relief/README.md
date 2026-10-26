# Coulisses des indices — relief pastel

Refonte visuelle démarrée sur `master` de0c85fb, puis rebasée sur 943b3ede après fusion de #969, le 26 octobre 2026. La référence finale est **l’image jointe**, conformément à la précision de l’utilisateur : fond ivoire, titre brun, badge pêche et trois panneaux horizontaux pêche, lavande et turquoise. Les exports sont de vrais canevas alimentés par les fiches, sans texte ni chiffres incorporés à un fond.

Le moteur partagé reprend les proportions, les matières en relief, les grands pourcentages sous les libellés, les drapeaux et pictogrammes, le panneau clair de performances et la signature centrée. Les marques officielles gardent leurs couleurs, proportions et transparence ; leurs supports seuls reçoivent une ombre. Les historiques longs ajoutent des rangées ; les noms longs ajoutent des lignes et de la hauteur. Un nombre cible conserve « sociétés visées » ; aucune cible ne remplace un comptage observé et aucune observation absente ne devient un zéro.

Les deux onglets gardent leurs sources distinctes. Aucune modification des poids, collecteurs, arrondis du donut, performances, devises ou conventions de dividendes. Les dates, sources et méthodes restent dans l’interface, les publications et les registres ; elles ne sont plus composées dans l’image. Les styles de Performance depuis et Il y a X ans restent inchangés.

## Aperçus réels

| Indice | Image principale avant / après | Top 10 avant / après |
|---|---|---|
| Nasdaq-100 | [Avant](previews/nasdaq-pea-main-before.png) · [Après](previews/nasdaq-pea-main-after.png) | [Avant](previews/nasdaq-pea-top10-before.png) · [Après](previews/nasdaq-pea-top10-after.png) |
| S&P 500 | [Avant](previews/sp500-pea-main-before.png) · [Après](previews/sp500-pea-main-after.png) | [Avant](previews/sp500-pea-top10-before.png) · [Après](previews/sp500-pea-top10-after.png) |
| CAC 40 | [Avant](previews/cac40-main-before.png) · [Après](previews/cac40-main-after.png) | [Avant](previews/cac40-top10-before.png) · [Après](previews/cac40-top10-after.png) |
| MSCI World | [Avant](previews/world-main-before.png) · [Après](previews/world-main-after.png) | [Avant](previews/world-top10-before.png) · [Après](previews/world-top10-after.png) |

Le CAC 40 ne possède pas de série de performance dans cette fiche : aucune année n’est créée. La devise originale du Nasdaq-100 est USD ; la variante EUR utilise la conversion déjà prise en charge par l’outil, pas les rendements dessinés dans la maquette.

## Logos : couverture vérifiée, partielle

Le [recensement complet](logo-coverage.json) couvre les quatre premières lignes réellement sélectionnables de chaque fiche et les dix entreprises de chaque composition qualifiée : **55 fiches, 34 Top 10, 560 apparitions, 203 entreprises distinctes**.

| Statut | Entreprises |
|---|---:|
| Logos officiels déjà présents, réutilisés | 48 |
| Logos officiels ajoutés | 22 |
| Initiales conservées | 133 |

Le [CSV](logo-coverage.csv) distingue chaque entreprise et ses ISIN lorsqu’ils sont publiés dans les compositions. Les [provenances des ajouts](../../public/asset-art/index-logos/sources.json) contiennent l’URL officielle, la date et le SHA-256 ; les réutilisations renvoient au registre officiel existant. Les classes Alphabet A/C et Samsung ordinaire/préférentielle partagent leur marque sans fusionner leurs poids dans la fiche principale ; le Top 10 conserve son agrégation financière préexistante. Les autres marques du groupe Samsung, Siemens Energy et Siemens restent distinctes.

Le raccordement principal est une table d’alias explicitement revus **par indice**. Le Top 10 résout ses **ISIN** ; un nom ou ticker approximatif, un ISIN inconnu ou un mélange d’entreprises ne reçoit pas de logo. Les preuves de chaque alias sont conservées dans les apparitions du recensement. Une nouvelle identité non revue conserve ses initiales ; elle ne déclenche aucune recherche floue. Le bilan est daté : il ne promet pas une couverture future après changement de composition.

Les 70 fichiers ont été décodés dans Chromium et inspectés sur une planche de contrôle. Les marques blanches (Amazon, Airbus, AMD, ICICI, Santander, GE, Hon Hai) ont un insert bleu. Les rasters restent dans leurs dimensions natives. Les tentatives sur [40 sites officiels supplémentaires](logo-source-attempts.json) documentent les refus d’accès et les candidats trouvés ; des premiers essais ont également été faits sur Amazon, Micron, TSMC, Tencent, Airbus et Schneider. Le fichier Micron reçu était une page « Request Rejected », donc rejeté. Alphabet, Broadcom et Micron utilisent encore leurs initiales. Une source candidate n’équivaut jamais à un logo validé.

Un fichier absent, corrompu ou bloqué produit une pastille d’initiales ; un délai de cinq secondes borne l’attente. Le cache invalide est supprimé et un nouveau rendu (notamment après changement d’indice) réessaie. L’aperçu, son agrandissement et le téléchargement principal partagent exactement le même canevas par sélection, y compris si une marque a utilisé ses initiales. Aucun service de marques distant n’est contacté à l’exécution.

Pour compléter le registre : vérifier la source officielle, ajouter le fichier/provenance et les alias explicites, puis lancer `node scripts/build-index-logo-registry.mjs`. Le contrôle `--check` reproduit la couverture archivée, vérifie les empreintes et le raccordement, sans exiger qu’une future composition possède tous ses logos.

## Vérifications

- Compilation de production et budgets des routes ; lint sans erreur (avertissements préexistants).
- `verify:factsheet-tweets`, `test:index-concentration`, cohérence des devises entre outils.
- `test-index-ribbon.mjs` : toutes les fiches, poids et comptages inchangés, noms complets, aucun débordement ni chevauchement, historiques 1/3/6/7/10 années, données absentes, noms longs, téléphone 390 px et ordinateur 1280 px, téléchargement réel.
- `test-index-relief-logos.mjs`, intégré au précédent : toutes les variantes de dividendes et devises de chaque indice (175 rendus) ; aucun chevauchement entre logos et texte ; négatifs rouges ; observation absente sans faux zéro ; décodage de tous les logos ; fichiers absents, corrompus, retardés et expirés ; reprise après échec.
- `playwright-index-relief.mjs` : application compilée, ordinateur et iPhone 13 émulé, changements rapides avec un logo retardé, contrôles de la sélection réellement dessinée, devise EUR, six téléchargements principaux/Top 10 et égalité binaire avec les aperçus. `INDEX_PUBLIC_BASE` permet de répéter exactement ce parcours sur Pages.
- `playwright-index-concentration.mjs` : toutes les compositions qualifiées, géométrie et poids du donut, longs noms et petites parts ; neuf parcours avec égalité binaire aperçu/PNG ; changement rapide d’indice, indisponibilité, brouillons conservés et téléphone.

Les diagnostics complets sont produits sous `test-artifacts/index-ribbon`, `test-artifacts/index-relief` et `test-artifacts/index-concentration`. Les exports représentatifs ont été inspectés visuellement et comparés à la pièce jointe. Les logos officiels remplacent les marques illustrées de la référence ; les données de chaque indice et devise restent celles de l’outil.

Les 50 drapeaux vectoriels locaux proviennent de flag-icons (licence MIT conservée dans `public/asset-art/index-flags/LICENSE`), avec URL et empreinte dans leur `sources.json`. Les pictogrammes de secteurs sont des tracés de canevas en relief ; ils ne représentent aucune marque.
