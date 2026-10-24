# Publication vérifiée — reliquat des 79 divergences

Vérification publique : **2026-10-23T16:28:08.529470+00:00**. Site : https://madmax91310.github.io/shinny-potato/.

- Code réellement servi : `aa8bcff061a1af1774a81f9e4bfaef331455ac2f`.
- Données réellement servies : `aa8bcff061a1af1774a81f9e4bfaef331455ac2f`.
- PR #892 : fusion `6b715bf556bfe454e03f7dc78ca4989a919bdfdb`.
- PR #895 : fusion `d61805e804024eed540450cc475cfb31a6634080`.
- La fusion concurrente #897 est préservée dans master. La PR #898 reste indépendante et n’est ni fusionnée ni déployée par cette mission.

Les cinq fichiers sources primaires des historiques, NAV et métadonnées correspondent au manifeste public. La projection des Duels est rapprochée de l’artefact généré par GitHub lorsque sa version reconstruite diffère du fichier suivi dans Git. Les onze parts utilisent les voies NAV qualifiées. Le fichier mensuel servi contient bien la preuve d’ajustement WFNS : **2023 = 17.29795252 % USD**. Les sélecteurs, calculs, textes, images et téléchargements ciblés sont vérifiés sur le site servi : **52 PNG téléchargés**, plus les captures mobiles.

Les preuves sont séparées : `preuves/publication-final.json`, `preuves/manifest-final.json`, `preuves/projections-github-aa8/`, `preuves/exports-public-*` et `preuves/deploiement-final-github.json`.

## Incidents intermédiaires et interprétation

Le premier déploiement après #892 a refusé un identifiant de position arrivé après validation. Une seconde validation complète (39976092821), pourtant verte sur tous ses tests, a ensuite refusé cinq fichiers modifiés pendant son exécution par les collectes de compositions et métadonnées. Le nouvel instantané aa8bcff est validé par 39967658103, sans ignorer ces nouveaux identifiants. Le nouvel instantané l’a validé : aucun contrôle désactivé. Les publications de code ancêtres remplacées sont distinguées des échecs de données ; une annulation normale ayant lancé la voie de secours a nécessité l’arrêt forcé de cette seule publication redondante, avec sa preuve conservée.

Une publication de secours affichait ensuite un dataSha incluant #895 tout en conservant encore l’ancien fichier mensuel : douze nouvelles clés de preuve étaient inconnues de l’ancien code. Le journal et le manifeste ont permis de détecter cette rétention. Cette étiquette de version n’a pas été utilisée pour annoncer WFNS en ligne. La présente vérification porte sur les fichiers réellement servis après la validation finale.

Le producteur mensuel normal 39967714433 a qualifié **665/665 observations** dans GitHub. La collecte quotidienne de production 39963925009 a produit **664/665 clôtures**, dont les dix nouvelles voies NAV principales, puis commité d73202b. Son observation XNDX reste refusée en séance ; la dernière clôture valide conserve sa date. Son cron 07:40 UTC n’a pas été observé après cette livraison : ces exécutions manuelles/PR ne sont pas présentées comme un passage cron ultérieur. Les deux 404 Amundi de composition et les blocages WisdomTree sont conservés dans les rapports. La disponibilité de tout le catalogue n’est pas certifiée par ce lot.

Une première sonde publique attendait une connexion native Node sans proxy ; le lanceur de vérification a été corrigé, puis les parcours publics ont réussi. Ce problème d’environnement de test n’est pas une panne de l’application.
