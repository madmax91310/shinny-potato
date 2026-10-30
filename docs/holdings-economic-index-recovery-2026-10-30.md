# Références économiques d’indices publiées par Invesco

Reprise après #1073/#1075/#1079, base master968f2f9aa. Les trois acquis sont conservés. Le nouveau lot n’ajoute aucun actif ni profil et utilise `collect_dca_complete_holdings.py`, le registre partagé et `update-qualified-exposures.yml` existants.

## Deux supports déjà utilisés, deux références précisément qualifiées

| Part analysée | Benchmark exact | Publication économique officielle utilisée | Photographie réellement lue | Lignes / somme native |
| --- | --- | --- | --- | --- |
| BNP Europe600 FR0011550193 | STOXX Europe600 NR EUR ; SXXR / .STOXXR | Table économique publique du fonds synthétique Invesco IE00B60SWW18 | 20 octobre2026 | 600 / 100,0016% |
| Amundi PEA Nasdaq FR0011871110 | NASDAQ100 Notional Net Total Return ; NNDX / .XNDXNNR | Table économique publique du fonds synthétique Invesco IE00BNRQM384 | 29 octobre2026 | 101 / 100,0001% |

Inventaire relu des 100 profils préparés : `europe`/FR0011550193 apparaît dans22 profils. Les actions individuelles et l’or/crypto sans composition de fonds ne sont pas des acquisitions manquantes. Le Nasdaq physique déjà utilisé par les profils conserve son propre livre : la référence nouvelle concerne la part PEA distincte disponible dans le sélecteur.

Ce sont des **références d’indice publiées par l’émetteur**, pas des détentions BNP/Amundi, ni les détentions d’un ETF physique servant de proxy, ni une composition obtenue directement chez STOXX/Nasdaq. Le contrat et `coverageProof.kind` distinguent cette méthode de la composition native JPX existante. Les sources excluent liquidités, frais, swaps et couverture de change du fonds analysé. Aucun panier détenu ou de substitution ne participe au calcul.

Les API `/holdings/index` sont celles effectivement appelées par les pages publiques :

- https://www.invesco.com/uk/en/financial-products/etfs/invesco-stoxx-europe-600-ucits-etf-acc.html
- https://www.invesco.com/uk/en/financial-products/etfs/invesco-nasdaq-100-swap-ucits-etf-acc.html

Le nom interne `index` ne suffit jamais. La qualification exige : part Invesco synthétique non couverte exacte ; benchmark, RIC, Bloomberg, devise ; widget économique identifié avec fournisseur et téléchargement public ; **panier détenu publié séparément** ; recensement complet600/101 du tableau public ; même date dans le tableau et le JSON ; ISIN distinct sur chaque ligne et clôture à la précision de publication. Le format différent du livre `/holdings/fund` est refusé. Les contrôles s’appuient sur les réponses normalement reçues par le navigateur : aucune clé, résolution de challenge ou attestation de statut investisseur.

Le recensement de page et les poids API sont deux vues de **la même publication**, pas deux sources financières indépendantes. Le benchmark du support analysé est vérifié séparément sur son document actuel : PDF BNP authentifié par le lecteur commun, copie Analizy déclarée avec découverte datée ; reporting Amundi de la part exacte. La photographie30septembre du document de part est conservée et ne date pas les poids d’octobre ; sa fraîcheur suit la politique ETF existante. Aucun document périmé ou contradictoire n’est remplacé silencieusement.

Le STOXX est retardé par l’émetteur, dont la page signale des restrictions de délai/profondeur imposées par le fournisseur d’indice : sa date reste20octobre, jamais30octobre. Le contrat n’étend pas un droit à des données non publiées. Il ne contourne pas les accès directs STOXX/Nasdaq.

## Admission et conservation

Les poids restent exactement100,0016% et100,0001%. Les seuils existants sont inchangés : les références sont exploitables comme positions identifiées, mais **le taux de recouvrement intégral reste refusé** pour ces photographies supérieures à100%. Ni normalisation ni arrondi correcteur, ni fermeture d’un incident de recouvrement sur la seule présence du fichier. Les limites demeurent dans l’analyse ; aucun texte ou squelette de tweet/PNG ne change.

Toute erreur d’accès, contradiction du benchmark, date régressive, liste tronquée, doublon ou poids invalide échoue pour ce seul support. Le writer commun garde la dernière observation avec son horloge d’origine. Les captures et documents vont dans l’artefact ordinaire ; les empreintes/dates/méthodes passent dans la projection différée consommée par l’analyse.

Le bilan179/183 précédent reste comparable sur son périmètre initial. Les deux supports existants nouvellement collectés constituent deux tâches supplémentaires ; ils ne sont pas présentés comme la résolution des quatre anciens refus. Les preuves GitHub et de publication sont ajoutées à la PR après exécution, sans les anticiper.

## Autres pistes revérifiées

- Global X Uranium : le CSV29octobre conserve SHA646eebe2df1649fe10d70aaa97830ace5d1b539efd896dd437ad14d9bcadd5fc ; contrat ZAR−69997,97 sans NET_ASSETS ni MARKET_VALUE. L’autre contrat ZAR est une ligne différente. Aucune valeur déduite du nombre de contrats.
- EPRA : les deux documents publics examinés sont un rapport de recherche « One Real Estate Universe » et le Monthly Market Review/Developers Benchmark. Ils ne livrent pas la composition complète pondérée et identifiée du FTSE EPRA Nareit Developed Europe exact ; le Developers Benchmark de26 sociétés n’est pas ce périmètre.
- STOXX : le lien officiel « Export PDF » de la page composants renvoie un PDF dont le texte est «429 Too Many Requests / nginx» ; il n’est pas une composition malgré HTTP200 et un en-tête PDF valide. Cette tentative n’est pas comptée comme acquisition financière.
- WisdomTree : l’annuaire public fonctionne avec les en-têtes ordinaires existants et donne les identités/URL exactes ; il ne fournit pas de composition et ne remplace pas les livres Battery/GGRA. Les liens actuels arrivent sur les mêmes pages et API déjà connues, pas sur un nouvel export officiel indépendant.
- PANX : l’accord écrit de réutilisation Solactive reste nécessaire ; aucune collecte financière n’est ajoutée sans droit fourni.
