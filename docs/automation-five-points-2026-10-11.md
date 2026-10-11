# Reprise des cinq points — 11 octobre 2026

Le périmètre est celui des données et offres actuellement utilisées. Une collecte réussie ne qualifie pas les champs que l’émetteur ne publie pas. Les collecteurs existants continuent à contrôler quotidiennement les sources ETF, assurance-vie et acteurs ; les valeurs absentes ne sont pas remplacées par celles d’un autre produit.

| Point | Travail effectué | Résultat |
|---|---|---|
| QYLD IE00BM8R0J59 | Nouvelle lecture de la page européenne et de ses données embarquées ; nouvelle tentative de téléchargement FundAssist. | Calendrier `discrete` vide, performance affichée USD Accumulating et compositions contradictoires ; FundAssist HTTP 500. Les quatre champs restent ouverts. Frais et encours continuent à être collectés. |
| Source iBonds | Remplacement de la page BlackRock bloquée par le DIC français officiel de la même part IE000SIZJ2B2, EUR Dist, daté du 9 octobre. | Collecte rétablie ; identité, date, objectif, échéance et absence de garantie contrôlés. Seules les clauses pédagogiques sont suivies : les scénarios et chiffres quotidiens ne déclenchent pas une fausse revue éditoriale. Les changements de clauses déclenchent toujours une revue. |
| Quatre conditions AV | Lecture des notices Lucya Cardif et Placement-direct Vie ; vérification des conditions déjà extraites et des sources liées. | Aucun plafond unique qualifiable pour les deux fonds Lucya ; ni plafond ni quote-part maximale actuelle pour Placement-direct Vie. Les clauses conditionnelles restent conservées. Euro+ est un autre contrat. |
| Conditions propres aux offres des acteurs | Contrôle réel réussi des neuf collecteurs et recherche de documents sur les pages actuellement utilisées. | Conditions publiques générales toujours automatisées. Les pièces spécifiques à la stratégie, au véhicule ou au projet restent requises pour qualifier leurs frais, échéances et sorties. Le document Foncière Europe trouvé est une publication ESG article 8, pas un DIC tarifaire. |
| Tableau de suivi | Ajout du workflow des fiches pratiques et lecture de son rapport ; lecture du rapport INSEE ; affichage de tous les workflows configurés même sans exécution observée. | Une source en erreur et une revue éditoriale requise remontent séparément par identifiant. Une donnée conservée ne vaut pas récupération. Un workflow sans preuve apparaît en état non documenté. |

## Preuves et sources

- QYLD : https://globalxetfs.eu/funds/qyld/ ; fiche redécouverte https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1 . Aucun portefeuille Nasdaq indépendant ou panier de substitution n’est assimilé à l’exposition du fonds.
- iBonds : https://www.ishares.com/gls-download/literature/kiid/eu-priips-ishares-ibonds-dec-2026-term-corp-ucits-etf-eur-dist-ie000sizj2b2-fr.pdf . Empreinte des clauses relues : `bc53807f17828d558feec46d492c60245229622b7f8cb23274d61351ab5a2a65`. La migration de source a été relue ; les neuf sources pratiques ont ensuite réussi une seconde collecte, sans changement ni revue ouverte.
- Lucya : https://lucya.com/app/uploads/2026/02/notice-lucya-cardif.pdf . SwissLife : https://static.placement-direct.fr/documents/dispositions-generales-du-contrat-placement-direct-vie.pdf . Les conditions déjà qualifiées et leurs preuves restent dans `automated-insurance.json`.
- Les neuf acteurs et leurs offres sont contrôlés par `collect_presentation_actors.py`. Les documents manquants restent détaillés offre par offre dans `automated-presentation-actors.json`, et visibles dans les réserves des outils : frais sous-jacents Fundora ; régie/assurance/sortie MyMarguerit ; dossier du GFV Bacchus ; DIC/statuts/bulletins France Valley ; FICI par projet Enerfip, Bricks, Hectarea et Matis ; DIC/règlement des parts AxClimat Anaxago.

## Validation

Tests Python du collecteur pratique et du statut des automatisations ; contrôle des 44 fiches pratiques ; audit des 383 fiches du catalogue ; build et lint. Collecte réelle des neuf sources pratiques : aucun échec ni changement après revue du DIC. Collecte réelle des neuf acteurs : neuf succès. Collecte réelle des six contrats AV : six succès, dont Lucya Cardif et Placement-direct Vie. Les tests vérifient le rejet d’une mauvaise identité, d’une section PDF absente ou d’une date future, la conservation après échec et le maintien d’une revue non résolue.

Les points QYLD, AV et documents propres aux offres ne sont pas déclarés terminés : leurs collecteurs fonctionnent, mais les champs concernés restent sans preuve officielle exploitable.
