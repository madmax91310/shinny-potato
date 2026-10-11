# Comparatif courtiers — vérification du 11 octobre 2026

Les huit courtiers et les onze rubriques sont raccordés aux collecteurs officiels : 88 cellules couvertes, dont 70 confirmées, 7 sans objet et 11 encore partielles ou non établies. Ces nombres décrivent le registre de preuves ; les sous-conditions d'une rubrique peuvent rester inconnues. Les sources et réserves restent hors des tweets.

## Nouvelles preuves raccordées

- **IBKR / PEA-PME** : exclusion explicite, FAQ publiée [749793090](https://www.interactivebrokers.ie/lib/cstools/faq/#/content/749793090).
- **IBKR / PEA Jeune** : la FAQ d'ouverture [663047241](https://www.interactivebrokers.ie/lib/cstools/faq/#/content/663047241) exige l'indépendance fiscale. Cela exclut le majeur rattaché. Le plafond légal figurant dans l'avenant ne démontre pas la commercialisation de cette offre.
- **IBKR / DCA PEA** : rapprochement de deux conditions officielles. Le service récurrent nécessite la permission de fractions ([370325745](https://www.interactivebrokers.ie/lib/cstools/faq/#/content/370325745)) ; les fractions sont exclues du PEA ([663047475](https://www.interactivebrokers.ie/lib/cstools/faq/#/content/663047475)). Les deux clauses et leurs empreintes sont conservées ensemble. Elles ne décrivent pas explicitement la disponibilité ou l’exclusion d’un mode PEA en titres entiers. Le DCA PEA reste donc à vérifier ; aucune réponse négative n’est publiée sur cette seule base.
- **IBKR / devises** : la FAQ [663047458](https://www.interactivebrokers.ie/lib/cstools/faq/#/content/663047458) établit la conversion automatique pour les titres PEA dans une autre devise. Elle ne confirme pas le montant de la commission. Le barème général reste présenté séparément.
- **Espèces du PEA** : le [BOFiP, § 40](https://bofip.impots.gouv.fr/bofip/1556-PGP.html) exclut leur rémunération. Cette preuve complète la ligne IBKR ; le tableau distingue désormais la non-rémunération PEA des offres hors PEA.
- **Trade Republic / devises** : la [page officielle 319](https://support.traderepublic.com/fr-fr/319?web_view=true) précise la conversion des revenus en euros et les marges selon la devise. Aucun pourcentage uniforme propre au PEA n'est inventé.
- **Crédit Agricole Île-de-France** : ajout de la convention CTO courante à l'examen du cash et du change boursier. Le PDF est résolu depuis l'[inventaire contractuel régional](https://www.credit-agricole.fr/ca-paris/particulier/informations/relation-banque-client/gestion-epargne.html), afin de suivre les changements de lien.

Les FAQ IBKR sont lues par l'interface publique réellement utilisée par le site. Seules les réponses publiées sont extraites, sans réponse générée, session connectée ou recherche approximative. L'identifiant de chaque article est vérifié.

## Preuves encore manquantes

| Courtier | Portée à confirmer |
|---|---|
| Trade Republic | Offre ou exclusion du PEA-PME ; frais de garde explicitement PEA ; montant du change propre au PEA ; frais de transfert PEA. Les tarifs CTO ne suffisent pas. |
| IBKR | Application exacte au PEA du barème général de conversion ; disponibilité ou exclusion explicite d’un DCA PEA en titres entiers. Le mécanisme de conversion automatique est établi. |
| Fortuneo | Offre ou exclusion explicite des achats récurrents automatiques PEA ; rémunération des espèces CTO. Les ordres conditionnels ne prouvent pas un DCA. |
| BoursoBank | Rémunération ou non-rémunération des espèces CTO. |
| Crédit Agricole Île-de-France | Rémunération des espèces CTO ; commission applicable aux conversions boursières. Le change bancaire général est exclu. |
| Bourse Direct | Clause relative à la rémunération des espèces CTO. |

Le silence d'une convention ne devient pas une réponse négative. Les champs incertains restent qualifiés et les contrôles automatiques continuent à examiner les sources officielles raccordées.

## Collecte et validation

La collecte locale a revalidé sept barèmes et cinquante champs de services. La collecte GitHub a ensuite revalidé les huit barèmes et les cinquante-six champs de services sans erreur. Les PDF et certaines pages Bourse Direct ont retourné HTTP 502 : les dernières valeurs qualifiées ont été conservées, avec leurs dates antérieures et l'erreur de collecte. Les réponses des cinq nouvelles FAQ IBKR ont aussi été relues séparément en direct.

Validation : 46 tests Python des barèmes, preuves, changements de clauses et reprise après panne ; audit des 88 cellules et des 56 duels ; tests des consommateurs, du catalogue et build de production. La CI complète assure les contrôles de l'application et du navigateur avant publication.
