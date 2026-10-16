# 35 ETF supplémentaires pour Actifs & expositions

Le manifeste `scripts/exposure-etf-expansion.json` identifie les 35 parts validées par l'utilisateur. Les identités sont communes à l'application, les observations datées sont dans `src/data/exposure-etf-expansion-records.json` et le catalogue DCA est régénéré depuis ces observations.

Le workflow `update-exposure-expansion.yml` collecte quotidiennement à 07:45 UTC les sources officielles et publie les observations validées. Une collecte échouée conserve les valeurs précédentes et produit un échec visible. L'interface conserve son contrôle de fraîcheur : une ancienne observation n'est jamais redatée pour apparaître actuelle.

- Les 34 ETF actions doivent publier des ventilations pays et secteurs complètes avant admission. Les libellés « Other » publiés ne sont pas inventés ni redistribués.
- Le PEA Euro Court Terme est classé Monétaire ; aucun secteur du panier de substitution n'est utilisé.
- Les Amundi synthétiques utilisent leurs ventilations d'indice, avec identité d'indice verrouillée. Le Scalable utilise la composition MSCI ACWI officielle, pas les titres du panier hybride.
- L'iShares STOXX 600 utilise son API allemande, avec traduction explicite des libellés et conservation des poids/date/empreinte de la réponse originale.
- Les warrants des portefeuilles DWS gardent un secteur non attribué : aucune assimilation aux actions sous-jacentes.

Les performances, encours et positions disponibles sont conservés avec leur propre provenance. La présence d'un ETF dans cet outil ne certifie pas un historique mensuel complet ni des détentions intégrales pour l'analyse des entreprises communes. Le filtre PEA reste limité aux statuts documentés du registre commun.

Validation : collecte initiale des 35 parts, audit des identités, contrôles DCA, compilation et budgets de chargement, 35 rendus PNG en Chromium, saisie par ISIN sur ordinateur et mobile, bibliothèque de données. Les tests du collecteur rejettent les identités incorrectes, tables tronquées et positions signées non qualifiées.
