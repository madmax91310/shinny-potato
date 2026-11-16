# LifeStrategy : réutiliser les photographies exactes, sans refaire un contrôle source

Le cron 43880581588 renouvelle les sources, mais refuse les quatre calculs :
parents au 30 septembre, sous-jacents désormais au 31 octobre. Le dépôt conserve
les huit livres exacts du 30 septembre dans le commit fusionné
41311ee98d707f38b876517a1ea64c4b260b7fc8. Leur contrôle fournisseur date du
14 novembre. La part North America réellement détenue est IE00BK5BQW10,
produit 9680 ; aucune substitution par IE00BKX55R35, produit 9523.

La reprise initiale lit uniquement ce snapshot immuable, dont les octets sont
vérifiés par SHA256. Elle conserve les ISIN, positions, poids, dates de contrôle
et empreintes fournisseur d'origine. Ce n'est ni un contact fournisseur ni une
nouvelle actualisation financière. Le producteur déclare la restauration de ses
dépendances séparément et ses résultats dérivés restent en phase validation,
sourceAttempted=false. Les livres courants d'octobre restent inchangés.

Pour les mois suivants, les huit livres précédents sont conservés automatiquement
lorsque le producteur reçoit une nouvelle date : au plus quatre photographies
mensuelles dans l'horizon existant de 93 jours, dans un attribut réservé au
producteur. Le projecteur ne les envoie pas aux outils. Une consommation reste
soumise aux contrôles existants : identité exacte, même date que le parent,
publication de moins de 93 jours et contrôle source de moins de 35 jours. Aucune
date renouvelée par la lecture du cache ; une date absente ou périmée reste refusée.
La reprise figée de septembre sert uniquement à récupérer les preuves antérieures
à ce mécanisme ; les changements d'année futurs utilisent la conservation courante.

Recalcul sur les données réelles conservées et les parents précis actuels :

| Fonds | Poids des actions identifiées dans le fonds | Titres distincts |
|---|---:|---:|
| 20 % IE00BMVB5K07 | 20,266324409933 % | 4 235 |
| 40 % IE00BMVB5M21 | 39,909759510398 % | 4 235 |
| 60 % IE00BMVB5P51 | 59,773788365533 % | 4 237 |
| 80 % IE00BMVB5R75 | 79,699191899022 % | 4 310 |

Il s'agit de transparisation des poches actions, jamais du fonds complet. Les
obligations, liquidités et positions non actions conservent leurs poids hors
entreprises. Aucun recouvrement intégral, aucune renormalisation ni confusion
entre titres et entreprises consolidées.

Recettes : les quatre refus avant correction, les quatre dérivations compatibles,
les poids exacts, les dates d'origine, l'idempotence, la sélection ciblée, le mois
suivant, les bornes de fraîcheur, les livres partiels, le hash de récupération,
la panne de récupération et l'isolation d'un parent invalide. Le producteur
ordinaire est exercé en checkout isolé ; acquisition fournisseur, restauration,
dérivation, enregistrement et publication restent des preuves distinctes.

La preuve GitHub et la publication réelle restent à obtenir après la recette
locale. Les mêmes données ne constituent pas une nouvelle collecte fournisseur.
