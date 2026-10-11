# Comparatif courtiers — format court et contrôle du 11 octobre 2026

## Format appliqué

56 comparatifs (28 duels, dans les deux sens) : accroche avec 🆚, rubriques courtes, une ligne par courtier lorsque l’information est établie, points faibles concrets et verdict simple. Les sources et les réserves restent dans le registre de l’application. Une réponse inconnue n’est jamais convertie en ❌ ; sa ligne ou son sous-critère n’est pas publié.

Les montants sont lus dans `automated-broker-tariffs.json`, les services dans ses profils, les offres selon leurs dates d’activation et d’expiration. Les conditions qui changent l’offre sont conservées. Les tarifs de change et les intérêts génériques IBKR sont explicitement présentés comme concernant le compte général, sans les attribuer au PEA.

Saxo : tarifs Euronext Classic 0,08 %, minimum 2 €, plafond 0,5 % en ligne ; titres cotés sans droits de garde ; IFU ; promotion sur 70 actions pour les nouveaux PEA ouverts ou transférés éligibles jusqu’au 31/12/2026 ; liquidités du PEA exclues, offre hors PEA réservée aux clients VIP ; verdict sur le courtage à partir de 2 € et l’accès au PEA-PME.

La collecte quotidienne vérifie désormais aussi le fonctionnement du PEPS : achats mensuels d’ETF et fonds sans courtage, ventes payantes et change éventuel. Le tarif d’achat est extrait, sans montant figé dans le générateur. Deux preuves officielles complémentaires :

- https://www.home.saxo/fr-fr/products/autoinvest
- https://www.help.saxo/hc/fr-fr/articles/7392487859357-Le-Plan-Epargne-Programm%C3%A9-de-Saxo

## État des raccordements

8 courtiers × 11 colonnes : 88 cellules avec collecteur ou produit sans objet. Dans le registre : 68 cellules confirmées, 7 partielles, 6 non établies, 7 sans objet. Une cellule peut contenir plusieurs périmètres distincts ; ce décompte ne doit pas être confondu avec les 12 périmètres surveillés ci-dessous.

Revue réelle des sources du 11 octobre : sept barèmes revalidés et 49 observations de profils revalidées. Aucune modification de montant ou de disponibilité par rapport aux dernières observations. Le complément PEPS Saxo a été téléchargé et qualifié séparément après cette revue. Les documents Bourse Direct ont renvoyé HTTP 502 malgré les URL officielles de secours ; leurs dernières observations validées du 10 octobre restent conservées.

## Informations restant à établir

La découverte automatique et les recherches complémentaires n’ont pas fourni de nouvelle preuve officielle suffisante sur ces périmètres. Les exclusions concernant le PEA sont déjà établies pour les espèces BoursoBank, Fortuneo, CA IDF et Bourse Direct ; c’est leur éventuelle rémunération sur CTO qui reste inconnue.

| Courtier | Périmètre restant à établir |
| --- | --- |
| Trade Republic | Disponibilité du PEA-PME |
| Trade Republic | Frais de garde propres au PEA |
| Trade Republic | Commission de change propre au PEA |
| Interactive Brokers | Disponibilité du PEA-PME |
| Interactive Brokers | Disponibilité du PEA Jeune |
| Interactive Brokers | Disponibilité des achats récurrents sur PEA |
| Fortuneo | Disponibilité des achats récurrents sur PEA |
| Fortuneo | Rémunération des espèces sur CTO |
| BoursoBank | Rémunération des espèces sur CTO |
| Crédit Agricole Île-de-France | Rémunération des espèces sur CTO |
| Crédit Agricole Île-de-France | Tarif de change des opérations boursières |
| Bourse Direct | Rémunération des espèces sur CTO ; dernière observation conservée en raison de HTTP 502 |

Autres limites conservées dans le registre : les frais de transfert PEA Trade Republic sont distincts de la gratuité du transfert CTO ; le barème de change et la rémunération génériques IBKR ne prouvent pas leur applicabilité au PEA. Aucun remboursement de transfert non documenté n’est inventé.

Le suivi quotidien des périmètres inconnus est déjà raccordé à `update-regulatory-data.yml`, à 08:45 UTC. La couverture technique est complète, la couverture des preuves ne l’est pas encore.

## Vérification de la modification

- Audit des 56 publications : rubriques, verdicts, absence de sources et de réserves dans le tweet, maintien des conditions Saxo et de la transparence XTB.
- 40 tests des collecteurs : preuves et périmètres, changement du tarif d’achat PEPS, vente payante, maintien des dernières données lors d’une panne.
- Audit des consommateurs : tarifs actualisés, changement de disponibilité et expiration des offres propagés aux publications courtes.
- Audit de couverture, audit du contenu publiable et compilation de production réussis.
- Assertions navigateur existantes adaptées. Exécution locale impossible : Chromium absent ; validation navigateur en CI à effectuer avant fusion.

Publication en attente : l’envoi de la branche GitHub a été rejeté par la vérification automatique d’autorisation. Aucun déploiement de cette modification n’est confirmé.
