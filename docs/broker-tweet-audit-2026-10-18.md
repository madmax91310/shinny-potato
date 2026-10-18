# Comparatifs courtiers : données du tweet et automatisation — 18 octobre 2026

## Périmètre réellement publié

Les 28 duels utilisent `buildBrokerTweet` et `brokerShortCopy` : courtage PEA, offres actives, change, achats programmés, garde, enveloppes (PEA/PEA-PME/Jeune), IFU, espèces, transferts entrants/sortants, points faibles et verdict. Les points faibles et verdicts sont éditoriaux ; leurs chiffres et disponibilités doivent venir des observations. Les intérêts hors PEA ne sont jamais attribués au PEA.

L'inventaire de référence porte sur 88 cellules : **69 confirmées officiellement, 6 corroborées manuellement, 6 partielles et 7 sans objet** (BoursoMarkets chez les autres courtiers). Le raccordement d'un collecteur ne signifie pas que sa source apporte une réponse complète.

## Vérification et corrections

| Constat | Source officielle vérifiée | Correction et entretien |
| --- | --- | --- |
| L'offre Amundi Fortuneo manque dans le tweet | [Campagne Bourse](https://www.fortuneo.fr/bourse) et [liste des ETF](https://www.fortuneo.fr/bourse/freetrade-amundi/etf) | Collecte du bandeau daté : 0 € de courtage sur chaque achat de la sélection, entre 500 et 100 000 €, PEA/CTO, du 01/09 au 31/12/2026. Date et bornes extraites ; retrait automatique du tweet après expiration. Les restrictions de l'offre Saxo ne sont pas appliquées à Fortuneo. Aucun nombre d'ETF figé. |
| L'interface conserve un ancien minimum BoursoBank de 200 € pour les ETF | [Brochure, page 23](https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf#page=23) | Le minimum publié est 100 € pour les ETF Paris/Amsterdam dans les quatre colonnes de comptes/offres. Extraction quotidienne indépendante du barème principal, preuve de page, reprise dans le tweet et suppression des chiffres manuels obsolètes. Une divergence entre colonnes suspend la qualification. |
| Le barème général BoursoBank renvoie à la première occurrence « Actions Euronext », celle de BoursoFirst | [Brochure, page 20](https://www.boursobank.com/content/brochure_tarifaire/boursorama_bt.pdf#page=20) | Le repérage utilise le titre exact du tableau Découverte. Les montants étaient corrects ; la page de preuve devient correcte. Le tweet précise « actions Euronext ». |
| La preuve de change CA Île-de-France échoue depuis le changement de convention | [Inventaire régional](https://www.credit-agricole.fr/ca-paris/particulier/informations/relation-banque-client/gestion-epargne.html), [convention actuelle, page 28](https://www.credit-agricole.fr/content/dam/assetsca/cr882/npc/documents/fip-et-cgl/66289.1789655190953.CGL_CTO_PDF.pdf#page=28) | Nouvelle convention de 45 pages, section 6.2, à une colonne ; l'ancienne en comptait 22, sur trois colonnes. Extraction adaptée aux deux versions. La nouvelle clause confirme le taux pratiqué au moment de l'opération et des frais éventuels sur CTO. Aucun pourcentage ni tarif PEA n'en est déduit. |
| Le tweet « liquidités » dépend du recoupement externe du CTO alors que la question concerne le PEA | Clauses PEA déjà collectées pour chaque courtier | La mention « sur PEA » est désormais explicite aussi pour BoursoBank, Fortuneo et Bourse Direct. Elle utilise leur preuve officielle PEA, y compris après expiration du recoupement CTO. |

## Résultat des collectes réelles

Le collecteur existant a été exécuté sur les sources publiques, sans substituer des fixtures aux téléchargements. Les compléments ont été retéléchargés puis qualifiés avec les nouveaux parseurs.

- **7 barèmes revalidés le 18 octobre** : BoursoBank, Fortuneo, XTB, Saxo, CA Île-de-France, IBKR, Trade Republic. Aucun changement des montants principaux observé.
- **50 observations de services revalidées**, y compris la clause de change CA remise en service.
- Offre Fortuneo et minimum BoursoBank ajoutés avec URL, empreinte, extrait, date de consultation et page PDF lorsque applicable.
- **Bourse Direct : téléchargements 502** depuis le collecteur, y compris les URL de secours ; dernière observation qualifiée conservée et non redatée. La lecture du PDF officiel par le service de recherche confirme les paliers Euronext, le change +0,08 %, la conservation étrangère 0,036 %/an et les frais de transfert déjà enregistrés. Cela ne remplace pas une collecte automatique réussie des services.

## Réponses qui restent incomplètes

| Courtier / champ | Ce qui peut être publié | Ce qui n'est pas établi officiellement dans les sources trouvées |
| --- | --- | --- |
| Trade Republic — change | Conversion des revenus en euros, marge selon la devise | Barème spécifique au PEA |
| Trade Republic — transfert | Entrée possible, refus des titres non cotés | Frais PEA de sortie, frais entrants et remboursement éventuel |
| IBKR — change | Conversion automatique sur PEA ; barème général présenté séparément | Application au PEA des 0,03 % du compte général |
| CA Île-de-France — change | Nouvelle clause CTO avec taux de la caisse et frais éventuels | Pourcentage et portée PEA |
| CA Île-de-France — espèces | PEA non rémunéré | Rémunération du compte espèces du CTO |
| CA Île-de-France — transfert | Entrée possible, ancienneté fiscale conservée, frais sortants documentés | Frais entrants et remboursement éventuel |

La recherche complémentaire n'a pas trouvé de nouvelle clause officielle suffisante pour les six réponses encore recoupées manuellement : garde PEA et absence de PEA-PME Trade Republic ; absence d'achats automatiques PEA Fortuneo ; espèces CTO BoursoBank/Fortuneo/Bourse Direct. Ces recoupements ne sont pas recertifiés quotidiennement ; ils expirent le 13 novembre 2026. L'absence d'une mention dans une brochure n'est pas convertie en réponse négative.

## Audit quotidien ajouté

`scripts/audit-broker-tweet-data.mjs` produit un JSON après chaque collecte réglementaire. Il inclut les **88 cellules**, le mode de preuve (collecte officielle ou revue manuelle), les dates indépendantes, les observations de plus de sept jours, les promotions actives/expirées, les erreurs de collecte, les copies de chaque courtier et les **28 tweets complets**.

Le rapport est conservé dans l'artefact `regulatory-observations` sous `broker-tweet-observation.json`. Une observation sans preuve ou date échoue ; une réponse partielle reste identifiée comme telle. Les échecs réseau conservent la dernière observation et restent visibles dans le bilan de collecte. Aucun déploiement ni fusion n'est requis pour relire ce rapport sur une PR.

## Validation

- 54 tests Python courtiers : versions réelle/ancienne du contrat CA, page physique, clause modifiée ou de mauvais périmètre, dates de campagne, seuils changeants, colonnes ETF divergentes, maintien sur panne.
- Audits du registre des preuves, du catalogue et des consommateurs des tweets ; 88 cellules et 28 paires ; expiration des offres et des revues ; distinction PEA/CTO.
- Compilation et budgets de chargement réussis.
- Contrôle Chromium ciblé tenté : exécutable absent et téléchargement Playwright invalide dans cet environnement. Le parcours navigateur reste à exécuter en CI.

Les changements sont isolés dans la branche `audit/broker-tweets-20261018`. Ils ne modifient ni les collecteurs d'actifs ni les outils travaillés dans les PR #761/#762.
