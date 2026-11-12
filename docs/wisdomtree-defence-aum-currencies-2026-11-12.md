# Encours Defence : monnaies publiées et conservation

## Incident historique et limites de preuve

Exécution : https://github.com/madmax91310/shinny-potato/actions/runs/43131067150

Le 12 novembre, `refresh` et `deploy / publish` réussissent ; `report-failures`
échoue pour exposer les exceptions individuelles. Le journal annonce 126/126
parts validées, mais ce compteur ne signifie pas que chaque champ est renouvelé.
L'erreur `aum` de IE0002Y8CX98 porte sur une comparaison à date identique.

L'artefact `active-etf-observation` (13905527834), fichier
`additional-observation.json`, contient `retainedPrimary: false` et l'encours
conservé suivant, identique dans son intégralité avant et après l'exécution :

| Élément | Valeur |
|---|---|
| Montant / devise / périmètre | 4 334 789 120 EUR / fonds |
| Observation | 2026-11-10 |
| Dernier contrôle et modification | 2026-11-11 / 2026-11-11 |
| Cotation native contrôlée | 3474438 |
| SHA256 de l'annuaire alors qualifié | d770d894b85a08798227b209f1cccebbbbadce38eaec9851c1e6814e2e1be992 |

Comparaison effectuée entre `src/data/automated-etf.json` aux commits
`1fb2ee48ee0b27575b258553a9facc2f63211df6` (départ) et
`9a1074370931e8274a408d7aea0df3edafcbf795` (résultat), et le record de l'artefact.
Le contrôle du 12 novembre des caractéristiques n'est pas attribué à l'encours.

**Preuves manquantes pour chiffrer la paire nocturne rejetée :** cet artefact et
le journal ne conservent ni les deux observations candidates ni les deux réponses
brutes. Le SHA256 de la page retenue est
`e28312dc1215b1fd238008d2330ba5d75e72f2a73373546ae7666d87b6ec8398`.
Le montant conservé n'est pas le montant candidat primaire rejeté. Les réponses
actuelles ci-dessous ne reconstituent pas ces octets historiques. On ne peut donc
pas affirmer les deux montants exacts ni l'origine exclusive du conflit nocturne.

## Reproduction officielle actuelle, le 12 novembre

Page : https://www.wisdomtree.com/ie/products/equities/wisdomtree-europe-defence-ucits-etf---eur-acc

Annuaire : https://dataspanapi.wisdomtree.com/fundlist/data/?divisionId=2&wtRegion=GB&isoCode=en-GB&isLeveraged=-1&isFP=0

| Source / champ | Montant | Devise | Date propre | Périmètre |
|---|---:|---|---|---|
| Page irlandaise, Total AUM of fund | 4 892 739 482 | USD, libellé US$ | 2026-11-11, table Net Asset Value | fonds |
| Annuaire, AUM, wtListingID 3474438 | 4 384 384 000 | EUR, fundCurrency = baseCCY = listingCCY | 2026-11-11, AUM_DateTime | fonds |

La page confirme ISIN IE0002Y8CX98 et Base Currency EUR, mais ce dernier libellé
ne change pas l'unité **US$** du montant affiché. Les deux montants n'ont donc
pas la même unité et ne constituent pas une contradiction numérique démontrée.
L'annuaire publie aussi deux cotations GBP et USD exclues du choix natif.
Sa date NAV_Date est le 10 novembre : elle ne date pas AUM.

À titre de diagnostic seulement, la ligne native porte AUMusd
4 892 739 482,200647, cohérent avec le montant USD arrondi de la page. Cela
conforte l'interprétation d'une présentation en USD ; aucun taux de change n'est
calculé et ce champ n'entre jamais dans la qualification de l'encours.
Net_Assets 4 384 378 880 n'est pas utilisé non plus.

Les extraits exacts des trois tables d'identité/frais/NAV et les trois lignes
de l'annuaire sont dans
`scripts/fixtures/wisdomtree-complete/defence-aum-currencies-20261112.json`.
Ils sont des extraits, pas les réponses complètes. Empreintes des réponses :

- HTML : `4d956f168bab106d3edf38171fec0dde17f39eefeeccea9d49b50e3dbe22657c`.
- JSON : `013546d76f7ff418e106bc440e27420f7c0399ca5aee2dc29fff64685da4cb0e`.

## Défaut démontré et correction proposée

Le contrat de #1080 exige l'identité exacte et la devise native de l'annuaire :
https://github.com/madmax91310/shinny-potato/pull/1080

L'ancien rapprochement considère toute différence de `currency` comme un
conflit, même si les deux unités sont explicitement publiées et le périmètre
identique. Le rejeu des extraits actuels reproduit ce défaut sans réseau.

La correction choisit l'observation native entièrement qualifiée lorsque sa date
égale celle d'un encours primaire du même fonds présenté dans une autre devise.
Elle ne convertit pas le primaire et ne déclare pas les montants réconciliés.
Elle conserve dans `sourceAttempts.comparison` les deux candidats et leurs
provenances. Une différence de périmètre, une devise primaire absente/invalide,
ou des montants différents de même devise à même date restent en quarantaine.
Les candidats d'un véritable conflit sont désormais conservés dans le rapport
avant suppression du champ courant. Aucune réponse ancienne n'est rejouée en
production ; aucune donnée active n'est modifiée par cette PR.

## Garanties de conservation et tests

En cas de véritable conflit, `augment_aum` retire `aum` du résultat courant.
`merge_collection` ignore les champs absents et conserve l'encours stocké avec
son montant, son observation, sa provenance, checkedAt et modifiedAt. L'erreur
individuelle reste dans le rapport. Une observation d'annuaire plus ancienne ne
remplace toujours pas un primaire plus récent. Une acquisition ou qualification
native en échec conserve le primaire indépendamment acquis selon le contrat
existant, sans certifier l'annuaire.

Sept tests ajoutés à la suite déjà exécutée par le workflow couvrent les extraits
réels, les champs et cotations exclus, le conflit véritable et sa fusion sans
renouvellement, les périmètres et devises invalides, l'ordre temporel, l'échec du
natif et la provenance/date propres de la fusion réussie. Les tests antérieurs
de doublons natifs, identité, panne et transport restent en place.

Pas de fusion, de collecte avec application ni de déploiement dans ce chantier.
