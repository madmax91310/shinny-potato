# Automatisation et fiabilité — 20 octobre 2026

Cette livraison traite les incidents de données, la publication et les 64 compositions physiques absentes identifiées dans l’inventaire. Un collecteur configuré ne suffit pas à prouver que ses données sont à jour : le rapport public conserve séparément configuration, dernière tentative, dernière réussite et date de l’observation.

## Incidents et publication

- Un conflit de qualification produit un incident par champ, avec toutes les preuves et raisons contradictoires. Une qualification PEA contradictoire reste indéterminée.
- Une observation antérieure ne remplace pas une observation plus récente. Une collecte échouée conserve les valeurs et dates de la dernière réussite ; la date d’un audit ne devient pas celle d’une collecte réussie.
- Les publications de production sont sérialisées. Au démarrage, une validation peut intégrer les commits de données suivants ; elle ne franchit pas un changement de code. Un instantané déjà inclus dans les identités publiques de code **et** de données est ignoré.
- Les 47 commandes de contrôle navigateur sont conservées. Leur répartition utilise les durées mesurées ; chaque commande possède une limite et termine son groupe de processus en cas de blocage. Les durées réelles sont conservées en artefact.
- Après déploiement, le contrôle attend les identifiants attendus de code et de données, compare le manifeste à l’artefact validé et vérifie les octets des fichiers publics de données référencés. Le manifeste est produit après l’inventaire.

## Compositions raccordées

| Famille | Parts du catalogue | Qualification |
| --- | ---: | --- |
| Amundi | 16 | API de composition intégrale, identité de part, devise, réplication physique, nombre de lignes, dates et poids. |
| Vanguard actions | 11 | API GPX, toutes les pages, identité exacte sur chaque page, détection des curseurs répétés et des changements de photographie. |
| Invesco | 3 | Fiche officielle de la part physique et API de portefeuille intégral ; poids arrondis conservés. |
| Global X | 4 | Lien « Full Holdings » découvert sur la page de la part, CSV complet, dates et poids contrôlés. |
| Avantis | 1 | Identité de part dans la fiche officielle et tableau intégral AVWS ; aucune exécution du JavaScript téléchargé. |
| VanEck | 10 | Page UCITS, identifiant interne du fonds, widget « All Holdings », nombre et dates des positions. Les tickers américains ne sont pas interchangeables avec ceux des UCITS. |
| LifeStrategy | 4 | Poche actions calculée à travers les fonds effectivement détenus, aux mêmes dates d’observation. Trois portefeuilles Vanguard supplémentaires servent uniquement de dépendances. |

Les poids restent ceux de l’actif net du fonds. Les liquidités, dérivés et autres positions exclues ne sont pas réaffectés aux actions. Les poids des LifeStrategy ne sont pas remontés à 100 % ; les obligations restent exclues de cette analyse des actions. La somme de leurs positions peut différer légèrement de l’allocation actions publiée, car les poids des fonds sous-jacents sont eux-mêmes arrondis.

Une photographie intégrale ne garantit pas une identification intégrale : VanEck Defense comporte une ligne sans ISIN et Global Mining en comporte quatre dans les fichiers observés le 20 octobre. Ces cinq lignes restent présentes avec une identité inconnue. Le calcul de recouvrement complet est refusé dès qu’une ligne n’est pas identifiée. Aucun ISIN n’est construit à partir d’un nom.

Les positions Vanguard portant le même ISIN mais des SEDOL de cotation distincts sont additionnées par ISIN. Une position répétée à l’identique est refusée. Les portefeuilles de référence, paniers de substitution et dix premières positions ne deviennent pas des portefeuilles physiques intégraux.

## Raccordements restant à qualifier

Les quinze parts suivantes restent dans l’inventaire des compositions physiques à raccorder :

| Famille | ISIN | Travail restant |
| --- | --- | --- |
| WisdomTree | IE0002Y8CX98, IE000W8WMSL2, IE00BDVPNG13, IE00BJGWQN72, IE00BKLF1R75, IE00BZ56SW52 | Qualifier un téléchargement intégral accessible et daté. Les pages testées répondent 403 ; une fiche de dix premières positions ne suffit pas. |
| L&G | IE00BYPLS672, IE00BF0M2Z96, IE00BK5BCD43, IE00BK5BCH80 | Qualifier le flux intégral actuel. Les liens de détail testés renvoient au centre général ; l’API de métadonnées ne constitue pas une liste intégrale de titres. |
| Global X Uranium | IE000NDWFGA5 | Qualifier les lignes Verdera dépourvues d’identifiant et les contrats de change dont le poids n’est pas renseigné dans le CSV. Leur nature ne peut pas être déduite du seul nom. |
| JPMorgan | IE0003UVYC20 | Qualifier le téléchargement intégral et séparer actions, liquidités et instruments de la stratégie de revenu. |
| BNP Paribas | IE000QDFFK00 | Qualifier la source intégrale actuelle de la part Nasdaq 100. |
| HSBC | IE00B4K6B022 | Qualifier un téléchargement intégral daté et rattaché à la part exacte. |
| UBS | IE00BD4TXV59 | Qualifier un téléchargement intégral daté et rattaché à la part exacte. |

La qualification n’est pas équivalente à une indisponibilité définitive : ces lignes décrivent ce qui reste à prouver et à intégrer. Les compositions synthétiques et les produits hors du périmètre actions restent suivis dans leurs catégories propres.

## Limite de fraîcheur encore présente

Pour WisdomTree Cloud Computing (IE00BJGWQN72), le téléchargement PDF de secours fonctionne, mais la photographie reçue est datée du **31 août 2026**, antérieure aux valeurs conservées d’octobre ; elle ne permet pas non plus de renouveler tous les champs, notamment l’encours. Les quatre champs en retard restent signalés jusqu’à l’obtention d’une observation officielle plus récente. Ni le PDF ancien ni une nouvelle tentative ne doivent renouveler artificiellement leur date de réussite.

## Vérification reproductible

Les tests portent sur les identités, devises et réplications, la pagination incomplète, les doublons, les dates discordantes, les nombres non finis, les poids arrondis, les positions non identifiées et la conservation du poids réel des LifeStrategy. La qualification en direct précède la construction de l’application et le contrôle DCA sur mobile et ordinateur. Les observations validées sont enregistrées avant la fusion ; le workflow quotidien `update-qualified-exposures.yml` reprend leur renouvellement.

La [qualification des 52 observations](https://github.com/madmax91310/shinny-potato/actions/runs/39413985017) a réussi : 49 parts du catalogue et trois dépendances, puis tests de calcul, construction et navigateur. Les 75 tests de métadonnées, huit tests de structure des workflows et treize tests des nouveaux parseurs et calculs ont également réussi dans cette qualification.

Les rapports de référence après publication restent :

- `/data/data-automation-summary.json`
- `/data/data-automation-inventory.json`
- `/data/data-connections-backlog.csv`
- `/build-info.json`

L’artefact `verified-publication` du déploiement contient la preuve des identités et fichiers effectivement vérifiés en ligne.
