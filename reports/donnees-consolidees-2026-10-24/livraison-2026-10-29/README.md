# Suivi consolidé de l’automatisation

État courant : [LIVRAISON.md](LIVRAISON.md). Les versions datées de ce document conservent les preuves antérieures. Le bilan ne revendique pas une automatisation complète.

Fichiers séparés du même suivi :

- [Résultat par outil](bilan-par-outil.csv), [rapport](RAPPORT.md), [bilan JSON](bilan.json).
- [79 cas financiers](reconciliation-79-ecarts.csv) :70fenêtres mensuelles qualifiées,9refusées ;77anciennes divergences et2résidus distincts.
- [661origines réconciliées](perimetre-initial-complet.csv.gz), [19actions](statut-19-actions.csv).
- [Matrice données×usages](matrice-donnees-usages.csv.gz), [dénominateurs](matrice-bilan.json), [chaînes](chaines-donnees.csv.gz), [contrôles](collectes-controles.csv.gz).
- [Suivi unique](suivi-consolide.csv.gz), [causes](causes-consolidees.csv.gz), [reliquat](restant-a-verifier.csv.gz), [réconciliation des identités](reconciliation-finale-identites.json).

Les CSV compressés sont indépendants, UTF-8, séparateur point-virgule. Les fichiers de preuves gardent leurs dates et périmètres. Une qualification documentaire manquante ne signifie pas une panne ; une date de code/données ne garantit pas que chaque registre a été publié. Les reçus de publication et parcours publics restent distincts des tests locaux et contrôles source.

Les colonnes d’origine des anciens CSV sont conservées comme photographie historique. Les colonnes `statut_final_29oct`, `statut_29oct` et `presence_publique_active_29oct` portent la réconciliation courante, datée par les reçus UTC du30octobre ; leur suffixe stable préserve la compatibilité. Une ancienne mention « toujours visible » ne décrit donc pas à elle seule la boîte active.
