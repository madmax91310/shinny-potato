# Livraison consolidée — 10 novembre 2026

Code public vérifié : `d7c50e6ed9a36302ed788c1ce5e46d9fca7530a3` ; données `snapshot du commit d7c50e6ed9a36302ed788c1ce5e46d9fca7530a3 ; aucun dataSha distinct publié` ; build `2026-11-10T10:06:17Z`. [Déploiement et14contrôles du commit final](https://github.com/madmax91310/shinny-potato/actions/runs/42794804917).

Correctifs intégrés : #1214 échecs individuels source ETF ; #1215 test de rétention daté reproductible ; #1216 identité Apple/Dow et vrai test générateur ; #1218 enregistrement concurrent borné des expositions ; #1219 méthode Russell et preuve ancienne datée ; #1220 définition de validation/file de publication. Les travaux #1201/#1061 restent distincts et n’ont pas été modifiés.

- [Historiques et performances](HISTORIQUES-PERFORMANCES.md) ; [772routes mensuelles](performances-mensuelles.csv) ; [79fenêtres](fenetres-79-statuts.csv) ; [8pièces manquantes détaillées](huit-fenetres-pieces-manquantes.csv).
- [Compositions et expositions](COMPOSITIONS-EXPOSITIONS.md) ; [694supports](compositions-supports-expositions.csv) ; [283lignes de registre fonds](compositions-fonds-expositions.csv) ; [87usages/86indices](compositions-indices.csv).
- [Bilan par outil](bilan-par-outil.csv) ; [instruments/champs réellement contrôlés](preuves-producteurs-instruments-champs.csv) ; [réconciliation de tous les diagnostics initiaux](reconciliation-diagnostics-initiaux.csv) ; [empreintes des images de recette](empreintes-images-recette.csv).

## Résultat et limites

WTI et Wheat : contrôles source réels, validation, enregistrement et publication acquis ; données mensuelles inchangées jusqu’à octobre2026. Bitwise : série conservée sur fenêtres qualifiées, mais renouvellement pleine période toujours HTTP400. La nouvelle voie publique Xetra fournit des cours bruts récents, pas encore une histoire ajustée continue qualifiée. Les2rapports Amundi semestriels acquis au31décembre2025 réduisent la limite d’accès documentaire ; leurs cases monétaires vides ne deviennent pas des zéros.

71/79fenêtres litigieuses restent qualifiées et8refusées, plus palladium décembre2014 horsdecegroupe. Aucune ancienne divergence close par une simple nouvelle collecte ou une voie indépendante. Le top10, le livre complet, le fonds physique de substitution et l’indice exact restent distincts.

Les641supports applicables au recouvrement ont540admissions complètes,100partielles et1indisponible ;53autres supports ne sont pas applicables.10admissions et8retraits sont présentés séparément, sans normalisation ni seuil modifié. Ce dénominateur décrit des capacités du lecteur, pas un taux d’automatisation de tous les champs.

## Vérification réelle

Quatorze contrôles obligatoires et build du commit final réussis ;21portefeuilles publics,21compositions,8fiches/16exports et4recettes Bitwise vérifiés sur ce code. Les recettes WTI/Wheat/Brent précédentes, leurs valeurs inchangées et les reçus source sont conservés. Les PNG réellement produits possèdent leurs empreintes ; les sources brutes volumineuses et PDF complets ne sont pas redistribués.

Les preuves de publication comparent les empreintes des entrées financières, pas seulement build-info.dataSha. Les collectes push/workflow_dispatch demeurent distinctes des crons. Aucun nouveau cron fournisseur postcorrectif n’est encore observé dans les runs consultés ; la collecte13F planifiée déjà acquise est contrôlée séparément, avec dates de positions/trimestre inchangées et30fichiers publics vérifiés. Pas de collecte massive, ni Radar, ni composant exclusivement IA restauré.

## Réconciliation

Export public initial : 10706identifiants, dont683dans la vue initiale active (failure/connection/monitoring). Export final : 10676lignes, dont674dans cette vue. Tous les10706identifiants initiaux sont conservés dans le CSV, avec causes actuelles, états historiques et preuves séparés. Ces nombres comprennent archives et autres familles ; ils ne constituent pas autant de pannes des deux familles traitées. Une absence de l’export final n’est jamais, à elle seule, une réparation démontrée.

Les qualifications sans nouvelle preuve, les deux anciens périmètres inconnus et les vérifications de branches non exercées ne sont pas effacés. **Automatisation complète non revendiquée.**

## Ancien épisode encore affiché actif

L’ancien échec de publication des expositions qualifiées reste actif dans le moniteur : les parents commencés avec l’ancienne définition attendent leur fin de publication. Les données7f9/562 sont déjà servies dans le snapshotd7 et consommées par les outils. Cette preuve indépendante n’est pas présentée comme une conclusion globale réussie de ces anciens runs. Clôture par fin/reprise ordinaire à observer, sans recollecte massive pour remplir le compteur. Voir preuves/anciennes-publications-etat-apres-livraison.json.

Les283lignes du registre fonds ne signifient pas283fiches sélectionnables : le format actuel en propose279. Les trois Vanguard composition-only et FR0013412269 restent dans les autres registres, sans ajout forcé au gabarit. Le CSV fonds distingue cette présence ; aucune suppression d’actif.
