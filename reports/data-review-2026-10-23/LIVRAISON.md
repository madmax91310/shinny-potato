# Collectes et données à revoir — 23 octobre 2026

Travail commencé sur `master` **5feee622**, puis intégration de **e3c7492d**, comprenant #892 et les collectes concurrentes, sans fusionner de PR ni publier le site. Les branches des PR #894 et #895 ne sont pas modifiées. Le portefeuille propriétaire IA est inchangé. Le suivi distingue une correction préparée, son contrôle GitHub isolé et son intégration/publication future.

## Périmètre et compteurs

[suivi-avant-apres.csv](suivi-avant-apres.csv) conserve **chaque ligne du périmètre initial**, y compris les doublons légitimes entre contrats différents. Les clés sont uniques dans chaque dimension. [bilan.json](bilan.json) réconcilie les comptes ; les captures initiales/finales sont dans `preuves/`. La génération est reproductible avec `python3 scripts/build_data_review_followup.py`, après le build.

| Dimension | Lignes conservées |
|---|---:|
| Certificats de couverture par champ | 4 274 |
| Raccordements initialement à traiter | 94 |
| Entrées initiales de Données à revoir | 780 |
| Comparaisons financières originales | 90 |
| Usages requis initialement bloqués ou non confirmés | 2 545 |
| Incidents actifs initiaux / échecs individuels initiaux | 13 / 8 |
| Épisodes historiques resolved / retired | 100 / 160 |
| Reliquat historique / modules / actions | 201 / 115 / 19 |
| Incidents actifs du dernier moniteur consulté | 15 |

Les 15 incidents du moniteur incluent deux réapparitions pendant l’intervention : DWS et Nasdaq. Les épisodes historiques restent datés ; leur résolution passée ne clôture pas une réapparition. Le moniteur de production est conservé sans manipulation. Ses 15 entrées ne sont pas 15 pannes distinctes : quatre incidents de champs doublonnent les échecs des compositions WisdomTree.

| Compteur | Avant | Après intégration et régénération |
|---|---:|---:|
| Réserves de revue | 25 | 24 |
| Contrôles historiques sans date | 4 | 4 |
| Contrôles bientôt dus / échéances futures | 747 / 4 | 747 / 4 |
| Champs de couverture courants | 4 050 | 4 052 |
| Raccordements à traiter | 94 | 95 |
| Erreurs individuelles de compositions visibles dans l’inventaire | 0 | 4 |
| Comparaisons financières / causes ouvertes | 90 / 79 | 90 / 79 |

**Le passage de 94 à 95 n’est pas une dégradation masquée** : deux distributions sont renouvelées ; trois compositions auparavant classées courantes exposent maintenant leur échec réel. La quatrième composition échouée était auparavant classée non qualifiée. Un problème d’identité ne masque plus un échec de collecte. Les dernières compositions valides restent datées et conservées. Aucun certificat initial ne disparaît.

## Corrections et chaînes effectivement raccordées

| Cas | Diagnostic et correction | Consommateurs et contrôle |
|---|---|---|
| TWD / DEXTAUS | FRED expire dans GitHub. Route publique officielle Federal Reserve H.10, série `RXI_N.B.TA`, qualifiée contre **6 966 observations communes sans divergence**. Validation des en-têtes, identité, unité et dates. **333 mois** avec les taux BCE du même jour ; pas de mélange entre deux fixings de fin de mois. | Collecteur mensuel → `monthly-fx.json` → conversions communes → classements, calculateur, Performance depuis et textes/images des séries compatibles. Provenance Fed+BCE transmise. Aucun nouvel actif TWD n’est inventé. Le change quotidien CBC des IA reste distinct. |
| SWDA IE00B4L5Y983-ETFP | Clôture EUR de Milan du **22/10** récupérée depuis GitHub. Identité, place, devise, calendrier et ajustements conservés. Le 23/10 n’est pas une séance terminée à l’heure du contrôle. | Série IA 94 → qualification → détails, catalogue et série publics. Test navigateur vérifiant la valeur et la date réellement accessibles. Aucune compétition ni transaction de démonstration ajoutée. |
| practical:gold | L’alerte suit le remplacement d’une URL générique par le DIC exact FR0013416716 daté **19/06/2026**. Lecture intégrale et conséquences dans [revue-or.md](revue-or.md). Approbation liée au contenu et à l’URL ; une modification ultérieure rouvre la revue. | Collecteur → registre partagé → deux fiches or → texte et PNG sur mobile/ordinateur. **11/11 sources** validées dans GitHub. La disponibilité contractuelle reste une preuve séparée du DIC. |
| Compositions existantes | Collecte GitHub de 181 fonds : 176 valides, quatre refus WisdomTree et une dépendance manquante dans la sonde HSBC. Reprise HSBC avec les dépendances du producteur : **1/1**, soit **177/181** valides. Import individuel avec dates et poids conservés. | Registre intégral → projections DCA → calcul des entreprises communes, limites de couverture et export réel. Un portefeuille avec identités inconnues conserve un recouvrement partiel et aucun pourcentage complet artificiel. |
| Distribution IE00B579F325 et IE00BD6FTQ80 | Renouvellement depuis la source justETF déjà qualifiée pour l’ISIN exact. La valeur API Invesco N/A n’est pas transformée en déclaration de distribution. | Registre de métadonnées → caractéristiques communes → catalogue et consommateurs existants. Deux raccordements manuels retirés sur preuve. |
| Interactive Brokers | Nouvelle panne découverte : ancienne route française redirigée vers un tarif américain sans table France. Route anglaise officielle unifiée ; sélection de la table France, colonnes dégressif/fixe SmartRouting/direct, unités et minima entiers contrôlés. Ancienne URL enregistrée ne court-circuite plus la nouvelle route. | Collecteur normal exécuté sur **macOS-15** : **8/8 courtiers**, profils qualifiés. Barème partagé → comparaison TR/IBKR → texte et PNG mobile/ordinateur. Les montants France observés restent 0,05/0,05/0,1 %, minima 1,25/3/4 EUR, sans inférence sur le PEA ou le change. |
| DWS réapparu dans le moniteur | Le radar du commit `93a8d00e` voyait des pays différents de son registre pour une même date. Les collectes suivantes de master ont renouvelé les photographies. Les **11 portefeuilles courants** sont recoupés strictement depuis GitHub. | Nouvelle preuve actuelle, avec réponses canoniques et empreintes, conservée. Aucune tolérance ajoutée ; la cause des anciennes révisions de pays à date identique n’est pas attribuée sans leurs documents complets. |

Pour chaque campagne, [network-executions.json](network-executions.json) fournit le run, l’artefact et son interprétation. Les sorties sont conservées localement dans la PR afin de rester consultables après expiration des artefacts. Certains runs ont été annulés **après** la réussite d’un job pour interrompre une sonde redondante : seule la réussite du job et ses validations individuelles sont revendiquées.

## Reliquat précis et comportement sécurisé

- **WisdomTree : IE00BJGWQN72, IE00BDVPNG13, IE0002Y8CX98, IE000W8WMSL2** : API, route publique et capture navigateur essayées depuis GitHub ; HTTP403. Les routes `.eu` et API exactes dérivées des pages produits sont consignées. Aucun contournement d’accès. Dernières données valides conservées, tentative échouée visible, aucune nouvelle admission au recouvrement complet.
- **Copper GB00B15KXQ89** : exécution isolée du véritable collecteur officiel, HTTP403. Les routes produit et API candidates sont documentées ; une route devinée retournant 404 n’est pas qualifiée. La preuve locale de NAV ne suffit pas à changer sa voie de production. Il manque une route officielle autorisée fonctionnelle depuis les runners et une qualification complète de la série.
- **PEA IE00B0M62S72** : déclarations contradictoires recapturées. **IE0003R87OG3** : aucune déclaration explicite de la part exacte dans les routes essayées. Les deux valeurs restent inconnues ; absence, tiret et référence introuvable ne deviennent jamais faux.
- **SSGA IE00B3T9LM79, 22/10** : le classeur actuel donne **1,146616 %** pour le top 10, contre **1,146701 %** dans l’ancienne photographie. Le classeur courant est archivé avec SHA256 `96933fb2eb2125e9bdda911982ded6b15b5d9b3441f27a2c544b24ff1ea9fce7`. Les anciennes captures n’ont pas d’empreinte/document complet ; la cause ne peut pas être attribuée rétroactivement. Conflit conservé, seuil inchangé.
- **79 divergences financières sur 50 parts** : les **53 calendriers officiels et 53 historiques de cotation** sont recollectés dans GitHub ; les 90 comparaisons originales, dont 10 corrections et une non-comparabilité déjà démontrées, sont préservées. Les pièces manquantes et les voies NAV distinctes de #892 sont intégrées, y compris les clôtures Euronext déjà recoupées. Il manque encore, selon le cas, les anciennes clôtures officielles, la devise historique, les opérations ou la convention/heure de NAV. Une réponse Yahoo réussie ne certifie pas ces facteurs. [reconciliation-financiere.csv](reconciliation-financiere.csv) individualise les 90 cas. Données à revoir expose désormais les 79 causes ouvertes et le téléchargement des 90 comparaisons ; une voie NAV opérationnelle n’efface pas l’ancienne divergence.
- **Nasdaq quotidien** : la fenêtre Yahoo `1d` perd la veille dès l’ouverture américaine. Correction vers les fenêtres quotidiennes `5d` sur les deux hôtes, même identité XNDX Total Return USD, séance achevée et concordance strictes. Le premier contrôle GitHub après correction rencontre HTTP429 malgré les reprises bornées : dernière observation valide conservée, pas de résolution réseau annoncée tant que le rejeu n’est pas qualifié.
- **Huit portefeuilles sans source intégrale qualifiée** : deux autres WisdomTree (IE00BZ56SW52, IE00BKLF1R75) en 403 ; quatre L&G (IE00BYPLS672, IE00BF0M2Z96, IE00BK5BCD43, IE00BK5BCH80) dont la route sert un explorateur sans état de part exact ; UBS IE00BD4TXV59 dispose de dix positions d’**indice**, BNP IE000QDFFK00 de dix positions du fonds dans sa fiche, sans portefeuille complet qualifié. Les six recherches WisdomTree/L&G sont rejouées dans GitHub ; un PCF éventuel demeure un panier de création, pas le portefeuille investi. Les sources partielles UBS/BNP courantes restent de leur périmètre, sans nouveau collecteur intégral prétendu.
- **Identités de positions** : 14 compositions restent non qualifiées pour le recouvrement complet ; lignes CVR, identifiants provisoires ou titres non résolus conservés. Aucune réaffectation d’ISIN supposée. Avantis : les 1 859 positions du document examiné ne portent pas de pays exploitable ; aucune allocation pays n’est inférée de leurs noms.
- **30 compositions économiques d’indices manquantes** : le portefeuille de substitution n’est pas utilisé à leur place. Les sources exactes et actions requises restent individualisées dans le suivi.
- **Autres raccordements sans preuve** : les 26 lignes `connector-needed` comprennent ces huit portefeuilles, QYLD dont la table courante concerne une autre part, la limite d’actif général de Placement-direct Vie absente de la documentation du contrat, dix pièces contractuelles d’offres d’acteurs incomplètes et six recoupements externes de courtiers sans renouvellement automatique qualifié. Les collectes acteurs/assurance/courtiers sont rejouées ; les pièces du véhicule/contrat exact restent demandées, sans transposer un autre contrat ni une offre commerciale générique.
- **Attentes et non-applicabilités** : 13 premières années civiles attendues, une publication suivante attendue, 18 publications/périmètres absents, 102 champs non applicables documentés, 43 supports hors contrôle des positions actions et trois archives conservent leur statut. Une échéance interne SCPI n’est pas une date de publication promise. Les 19 actions historiques sont réconciliées avec #892 : 12 corrigées, une déjà résolue, cinq partielles, une bloquée.
- **Usages non confirmés** : le suivi conserve les 2 545 contrats consommateurs initiaux bloqués/non confirmés, ainsi que leurs restrictions. Des caractéristiques composites anciennes, preuves manuelles ou usages incompatibles ne sont pas recertifiés en bloc parce qu’un fichier amont a changé. Les nouveaux compteurs de master sont séparés dans `bilan.json`. Cette intervention ne prétend pas qualifier toutes les données du catalogue ni toutes les branches de fournisseurs.

Les contrôles d’accès portent sur **79 URLs pour 94 raccordements initiaux**. Le tableau conserve les routes essayées, leur résultat et leur date ; HTTP200 n’est jamais un succès financier. Les recherches de découverte disposent en plus de leurs propres erreurs de portée/identité, désormais exposées dans l’inventaire.

## Fiabilité et vérification

Réutilisation des transports et écritures existants : délais et reprises bornés avec temporisation, formats et identités stricts, conservation de la dernière donnée valide, écriture atomique, refus des régressions de dates. Les ajouts ciblés concernent H.10/BCE, la revue pratique liée au document, IBKR et les empreintes SSGA. Les registres séparent date de donnée, contrôle réussi et dernière tentative ; les artefacts d’exécution séparent collecte et publication. Le refus individuel reste visible lorsqu’un workflow a pu produire d’autres données.

Le build intégré et les audits de couverture passent. La suite Python complète passe **939 tests**, avec configuration OCR française locale ; les deux erreurs de configuration initiales du second environnement OCR sont conservées dans les journaux précédents et ne sont pas annoncées comme des pannes de collecteurs. Les contrôles Node des changes, qualifications, calendriers NAV, DCA, courtiers, revue et IA passent. Les parcours réels vérifient les calculs DCA physiques et WisdomTree, les restrictions d’identités, les conversions, les détails IA publics et les onze voies NAV de #892. Les tests de reprise téléchargent huit PNG (or, IBKR, DCA) et le JSON des 90 comparaisons ; les autres campagnes contrôlent les PNG de conversion et les 44 exports des voies NAV. Des exports or et DCA ont été inspectés visuellement. Un premier rejeu DCA a échoué au démarrage du serveur local (`ERR_CONNECTION_REFUSED`) ; son rejeu isolé passe, sans modifier les calculs.

Les fichiers reconstruits par le build ne sont pas ajoutés artificiellement au diff. Les nouvelles projections publiques IA sont conservées car le build ne les produit pas. Aucun déploiement ni fusion n’est demandé ou effectué. La production doit encore recevoir la PR et exécuter ses producteurs ordinaires avant que son moniteur puisse clôturer les incidents réparés.
