# Reprise d’écriture après un push concurrent

Incident réel : le producteur mensuel40019944385 termine sa collecte et ses contrôles, mais son premier push est refusé après une avancée de master. La validation a régénéré des fichiers suivis dans le checkout temporaire. La tentative suivante échoue sur « cannot rebase: You have unstaged changes ». Aucune nouvelle observation de ce passage n’a été publiée ; les données déjà en ligne restent conservées. Les éventuels échecs fournisseur sont distincts de cette erreur d’enregistrement.

Le correctif restaure uniquement la révision commitée du checkout temporaire avant une nouvelle tentative, puis refait le fetch, le rebase et les contrôles financiers. Il ne réinitialise ni les fichiers ni l’index du collecteur appelant. Le rebase continue de refuser les conflits sur les données ; aucun push forcé ni résolution automatique n’est ajouté. La référence des données collectées reste identique pour chaque revalidation.

Trois nouveaux scénarios utilisent le vrai script et de vrais dépôts Git isolés : rejet après régénération de rapports, conflit sur la même observation et échec de la seconde validation. Ils échouent avant correction. Après correction : huit tests d’écriture réussis, six garde-fous de rebase et quatre contrôles de reçus réussis. Les fichiers, l’index et le HEAD de l’appelant sont conservés.

Ces scénarios ne poussent aucune donnée fictive en production et ne sont pas présentés comme des tests fournisseur. La validation GitHub et la publication seront consignées séparément. Les collectes financières réelles restent celles des rapports du reliquat ; ce correctif porte sur leur enregistrement, sans modifier les données, les conventions, les maquettes ou les PNG.

Preuves séparées : avant.log, apres.log, gardes-rebase.log, recus.log et echec-production.log.
