# Automatisation : livraison du 20 octobre 2026

L’audit initial recense 111 raccordements nécessitant une action. Une source accessible ne certifie ni son contenu financier ni sa date de photographie.

## Raccordements réalisés

- Dix portefeuilles DWS : qualification exacte des fonds monétaires Deutsche Managed Dollar Fund Z (IE00BYQNZ507) et Euro Fund Z (IE00BZ3FDF20), par leurs DIC officiels du 16 février 2026. Les poids restent ceux de l’actif net ; ces fonds ne deviennent pas des actions. Le libellé historique erroné « Equities » est traité par l’identité du fonds, pas par une inférence sur son nom.
- HSBC IE00B4K6B022 : inventaire XLS officiel, identité et réplication physique confirmées par la fiche émetteur. Les comptes, espèces et contrats restent exclus des actions avec leur poids original.
- JPMorgan IE0003UVYC20 : flux officiel dailyHoldingsAll, 234 actions/REIT cotées au 19 octobre, huit options et espèces exclues. Le périmètre est celui des titres actions détenus directement, pas une réplication intégrale du risque économique des options.
- Reprise automatique : conservation des réservations de budget en cas de décalage d’horloge ; une nouvelle tentative du même run est reconnue avant d’autoriser une autre relance. Collecte et validation sont refaites sur la branche courante après concurrence.
- Contrôle quotidien d’accès aux sources non qualifiées : disponibilité et changement de contenu séparés des dates financières, visibles dans « Données à revoir ». Un succès HTTP ne résout aucun incident de qualification.

## Disposition du solde de l’audit

Chaque entrée reste exportable dans l’inventaire JSON et le CSV des raccordements ; le contrôle d’accès conserve son préalable, sa dernière tentative et sa dernière disponibilité.

- 32 compositions d’indices économiques derrière des ETF synthétiques : il faut les positions de l’indice exact ; un panier de substitution ne convient pas.
- 13 compositions physiques restantes : WisdomTree (6), L&G (4), UBS (1), BNP/ex-AXA (1), Global X URNU (1). Les nouvelles recherches officielles ont rencontré des refus HTTP, des pages sans portefeuille intégral ou des lignes non identifiées. Aucun poids inconnu n’est complété artificiellement. URNU contient notamment des positions Verdera sans identifiant et des contrats de change sans poids publié.
- WisdomTree Cloud : quatre champs en retard ; les documents accessibles sont plus anciens que les observations conservées. Les refus 403 ne doivent pas renouveler leur date de contrôle financier.
- PEA : cinq parts restent à qualifier, dont une contradiction entre sources. Absence de déclaration explicite ≠ inéligibilité.
- QYLD : conflits de poids et de périmètre ; les anciennes performances glissantes non qualifiées restent archivées. Le flux d’une part capitalisante ne remplace pas celui de la part distribuante.
- Offres privées : Bricks, Enerfip, Hectarea et Matis nécessitent un projet exact et son document contractuel. Pour Anaxago, Bacchus, France Valley, Fundora et My Marguerit, il reste à qualifier les frais de l’offre exacte et, selon le produit, les documents des sous-jacents. Une page générale de plateforme ne fournit pas ces paramètres.
- Autres champs : plafonds d’allocation assurance-vie, date de photographie Iroko Zen, pays Avantis, secteurs SILV, répartition du fonds entier LifeStrategy, années civiles Global X/Avantis, identité de part et distribution de certains instruments. Ces lacunes exigent une publication du bon périmètre, une date explicite ou une identité documentée. Les performances glissantes ou cours de marché ne remplacent pas une performance annuelle de valeur liquidative.
- Six corroborations externes de courtiers conservent leur revue distincte des données officielles automatisées.

Les 43 périmètres hors actions et 13 premières années civiles en attente ne sont pas des collectes en panne. Le nombre final d’actions se lit dans l’inventaire effectivement publié ; il peut évoluer avec les sources et leurs échéances.

## Recette réelle

Run [39444045059](https://github.com/madmax91310/shinny-potato/actions/runs/39444045059) : 174/174 collectes de compositions réussies, aucune erreur ; 24 tests Python ciblés, tests DCA et inventaire, build et quatre recettes Chromium sur mobile et ordinateur réussis. Le solde passe de 111 à 99 actions ; 34 URL sont contrôlées pour ces 99 raccordements, sans en changer la qualification financière.
