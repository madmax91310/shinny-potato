# Reprise mensuelle : conserver le périmètre réellement déclaré

Le cron42235436731 a sélectionné seulement `etc_natural_gasNav`, refusé403. Les contrôles d’identité ont réussi, mais l’enregistrement a été refusé après les changements concurrents JEPG/Budget. La protection est conservée. Le moniteur a réservé puis déclenché automatiquement42242620055 sur master, sans paramètres. Cette absence de `series` réactive par défaut les717sources de `monthly-automation.json`. La reprise en cours n’est ni annulée ni présentée comme ciblée.

Le correctif reprend uniquement la liste explicitement demandée/attendue du rapport mensuel du même run et de la même tentative. Le registre de périmètres déjà livré et son empreinte sont réutilisés ; les tableaux de succès/échecs ne servent jamais à reconstituer la sélection. Les paramètres sont gelés dans la réservation persistante avant l’appel GitHub. Le nouveau run recollecte et revalide sur master ; aucun ancien fichier produit n’est publié directement.

Le format compacté et le format développé existants sont acceptés. Une sélection explicitement vide de reprise failed-or-missing conserve ce mode borné, réévalué sur master ; une partition ne reprend que les éléments demandés, sans certifier les éléments différés. Un périmètre absent, vide sans justification, ambigu, corrompu ou étranger au run conserve le comportement ordinaire antérieur et sa limite documentaire ; aucun périmètre ancien n’est inventé. Les autres motifs de reprise et producteurs conservent leur sélection ordinaire. Les dates de réussite, budgets et temporisations ne changent pas.

La fixture est une extraction de métadonnées du moniteur `b030093f4c1fbe78135044e106e83f5a308388bd`, artefact13514506419 : aucun résultat financier n’y est fabriqué. La qualification `scopePlanVerified=false` d’origine reste fausse. Les tests exercent le cas réel NGAS, la réservation/POST, les deux formats, les versions/tentatives étrangères, l’ambiguïté, l’intégrité des empreintes, les identifiants invalides, la conservation du dernier succès et l’absence de fuite de paramètres entre deux incidents.

La preuve en production de cette nouvelle sélection nécessite une prochaine reprise d’enregistrement réellement éligible : aucune panne volontaire ni relance massive pour la fabriquer. Les exécutions ordinaires du moniteur peuvent démontrer le plan sur l’état existant sans qu’une nouvelle panne soit provoquée. Les preuves de collecte et les refus financiers restent indépendants.

## Clôture mensuelle WisdomTree — complément du 6 novembre

La collecte publiée du 2 novembre utilisait, pour NGAS, une photographie arrêtée au 29 octobre : octobre 4,24195266 USD. La collecte réelle 42242620055 du 6 novembre, enregistrée dans 5739c1c et publiée, contient octobre 4,21602288 USD et des observations du mois suivant. L’ancienne admission mensuelle était prématurée ; ce constat n’explique pas l’ancienne divergence annuelle.

L’adaptateur diffère désormais uniquement le dernier mois clos dont le flux n’a pas encore démontré la fin : observation au dernier jour calendaire ou au mois suivant requise. Il ne déduit aucun calendrier de jours fériés. Le vendredi précédant un week-end peut donc attendre l’observation suivante. La preuve existante `withheldMonthlyEnds` conserve date et motif, `monthlyEndExclusive` préserve les mois antérieurs et la sélection ordinaire reprend le dernier mois absent. Aucun niveau, seuil, revenu ou cours n’est fabriqué. Les neuf fenêtres historiques refusées restent distinctes.

Régressions : photographie NGAS reproduite avec les fichiers de source existants, conservation intégrale des mois antérieurs, incident du 29 octobre, vendredi avant week-end, reprise par observation du mois suivant, fin décembre et publication différée. L’exécution et la publication réelles du nouveau code restent à vérifier avant annonce.

## Enregistrement SCPI et publications ETF indépendantes

Le run ordinaire SCPI42280725727 du6novembre a collecté et validé ses observations, puis refusé leur enregistrement : entre-temps, c9e5798 avait enregistré des observations ETF et leurs projections DCA. Ce refus est distinct d’un changement des sources SCPI. L’acquisition SCPI ne lit ni ce registre ETF ni les vues DCA ; le contrôle d’enregistrement reconstruit et valide ensuite l’application complète sur l’arbre fusionné.

La qualification est limitée au producteur SCPI : registre exact exposure-etf-expansion-records.json, catalogue/vues DCA, trois pages d’exposition supplémentaires et32compartiments de positions connus. Les fichiers voisins, configurations, collecteurs, politiques, observations SCPI et autres producteurs restent protégés. La reproduction Git fait avancer master après une première validation, conserve les deux écritures, impose une deuxième validation et refuse la publication si celle-ci échoue. Aucun push forcé ni sortie ancienne publiée aveuglément. Cent cinq tests de rebase passent, dont les courses et refus ciblés ; collecte réelle GitHub/enregistrement/publication du correctif restent à vérifier après fusion.

La première CI de ce lot a révélé un test Russell dépendant du registre vivant : le renouvellement officiel au31octobre est futur par rapport à son horloge figée au10octobre. Le test utilise désormais la photographie réelle30septembre déjà présente au commit7cb5f93 ; aucune date ni validation de production changée.
