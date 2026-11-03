# Global X Uranium : diagnostic du 29 octobre 2026

Base examinée : `117dbd7691ac4629cee437a9a03555f0c58fb24f`.

## Cause établie et limite de preuve

La route `globalx-complete` de `collect_dca_complete_holdings.py` appelle
`collect_physical_holdings.collect_globalx`, puis `globalx_csv`.
La conversion fautive est `float(row['NET_ASSETS'])` : poids en pourcentage de
l'actif net, et non prix, nombre de titres ou valeur de marché.

Le dernier échec conservé pour IE000NDWFGA5 date du 28 octobre à
15:08:14 UTC. Il est confirmé dans le job refresh 122881704870 du run
https://github.com/madmax91310/shinny-potato/actions/runs/40707000954.
Le statut conserve la composition du 26 octobre (59 lignes), qualifiée le
27 octobre à 14:45:21 UTC. L'issue #881 affichait encore cet échec le 29 octobre.
Les deux anomalies « Composition complète » et « Positions intégrales » ne
constituent pas deux preuves indépendantes de panne de source.

Le CSV rejeté n'est pas dans l'artefact qualified-exposures-observation de ce
run. Le collecteur Global X n'appelait pas `source_proof` ; on ne peut donc pas
identifier honnêtement le nom de la position historique, ni décider si la cellule
était légitimement vide. L'erreur prouve une chaîne vide dans NET_ASSETS.
La PR #1023 modifie les blocs HTML des caractéristiques financières, pas ce lecteur CSV.

## Vérification réelle

Page : https://globalxetfs.eu/funds/urnu/ ; ISIN IE000NDWFGA5,
USD Accumulating, réplication physique et lien intégral vérifiés par
`globalx_page`. CSV : https://globalxetfs.eu/api/funds/urnu/topholdingscsv.

La réponse récupérée le 29 octobre, datée du 28 octobre, est conservée sans
modification dans `scripts/fixtures/physical-holdings/globalx-urnu-20261028.csv`.
SHA256 : `9afbd6b80e5548b69680f54ed67c0b7c3f562786da0ad3cf594e503d397214cf`.

Elle passe déjà le lecteur de la base examinée : 59 lignes actions, poids total
99,815 %, deux positions Verdera non identifiées de 0,002 % chacune conservées.
Les soldes de trésorerie négatifs restent dans le contrôle du total NAV.
L'en-tête correspond exactement au schéma attendu. La seule ligne sans poids est
le pied de page juridique explicite, déjà exclu avant conversion.
Aucun changement du schéma fournisseur n'est constaté sur cette réponse.

La commande réelle, sans écriture des données applicatives, a réussi :

```sh
python scripts/collect_dca_complete_holdings.py --only IE000NDWFGA5 --output /tmp/uranium-live-collection.json
```

Résultat : `Complete holdings: 1/1; identified securities: 0; errors: {}`.
Le compteur identified securities est celui des classifications supplémentaires,
pas le nombre de titres du portefeuille.

## Modification

- Refus explicite de NET_ASSETS absent/vide, avec numéro d'enregistrement CSV,
  nom, ISIN et date. Une valeur non numérique/non finie garde aussi ce contexte.
- Aucun poids manquant transformé en zéro ; aucune ligne de position ignorée.
- Capture brute avant analyse, y compris en cas d'échec. Le workflow active
  PHYSICAL_SOURCE_PROOF_DIR et publie ce dossier dans son artefact existant,
  même si la collecte échoue.
- Seuils, dates, schéma, identités, doublons et qualification inchangés.
  Pas de réécriture manuelle d'un statut de production.

## Validation et état de livraison

17 tests physiques (dont 6 nouveaux), 5 tests des sections Global X,
2 tests de reprise et 4 tests LifeStrategy réussis : 28 tests.
La régression de reprise exécute le writer avec --apply dans un répertoire
temporaire : échec avec poids vide, observation précédente et date de succès
conservées ; reprise avec le CSV réel, autre fonds inchangé.
`git diff --check` réussi.

Le patch améliore le diagnostic et sa preuve ; il ne prétend pas réparer une
position manquante qui serait encore présente dans une autre réponse.
Le renouvellement ciblé est actuellement possible sans relâcher le lecteur.
La résolution de l'alerte publique doit être vérifiée après le prochain passage
du producteur et la publication de ses observations qualifiées.
