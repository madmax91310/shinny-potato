# INSEE et publications DWS — suite de #583

## INSEE : diagnostic et rétablissement

Le 14 octobre, l’API GitHub du workflow `update-inflation.yml` ne présente que
des validations `pull_request` depuis son installation le 5 octobre. Aucun
passage de production n’a encore eu lieu. Le calendrier `15 7 1,16 * *` explique
ce décalage : la première échéance après installation est le 16 octobre.
Le statut « non observé » est donc exact, et ne prouve pas une panne INSEE.

Le workflow démarre désormais aussi sur les modifications du collecteur et de
sa configuration fusionnées sur master. Ce passage de production établit une
preuve d’exécution avant le prochain rendez-vous planifié. Le calendrier reste
inchangé. Les modifications des seuls fichiers de données ne redéclenchent pas
la collecte. Les tests de PR ne deviennent jamais des succès de production.

Le rapport de collecte contient la série exacte 011814631, la date de contrôle,
les variations mensuelles et leur qualité définitive/provisoire. Le suivi
existant enregistre le succès même si aucune valeur n’a changé ; aucune date
fictive et aucun succès manuel ne sont inscrits dans automation-status.
Une absence de modification ne doit pas provoquer un déploiement supplémentaire.

Le contrôle réel de la PR #587 a révélé une indisponibilité du service BDM :
expiration de connexion TLS / lecture, également reproduite localement. Les
cinq autres séries BDM du workflow publications ont expiré pendant le même
passage. Il s’agit d’un échec d’accès à la source, pas d’une valeur rejetée.
Le site officiel conserve cette URL SDMX dans sa documentation actuelle ;
aucun remplacement de série ni repli sur une capture ancienne n’est effectué.

Le collecteur écrit désormais aussi un rapport d’échec horodaté avec la série,
l’URL et l’erreur exacte. Le workflow conserve cet artifact même en cas d’échec
et reste rouge. Le suivi peut ainsi remplacer « non observé » par un échec
explicite relié au passage de production. Un prochain succès réel de la même
série lèvera automatiquement cet incident. La disponibilité de la source et
la réussite de la collecte restent à confirmer après fusion.

## Publications effectivement concernées

| Format | Résultat de la revue |
|---|---|
| Comparatif ETF | Six thèmes : IA/robotique, santé, ressources naturelles, Materials classique/Advanced, industrie/infrastructures et S&P 500 Equal Weight. Texte et image utilisent les mêmes agrégats courants. |
| Présentation ETF | Cinq fiches disponibles : IA, Materials, Industrials, Utilities, Equal Weight. Elles n’affichent pas les poids pays/secteurs contradictoires. La santé mondiale concernée figure uniquement dans les comparatifs. |
| Générateur et duels | Les calculs portent sur les allocations entre actifs et leurs performances ; ils ne réutilisent pas les poids pays/secteurs DWS disputés. |
| Impact des frais | Les frais et paramètres de simulation n’utilisent pas ces compositions géographiques ou sectorielles. |
| Radar | Les mouvements dépendant d’un instantané contradictoire restent exclus des signaux publiables. Les 34 contradictions non résolues restent suivies. |

Le diagnostic précédent conserve les six réponses DWS et le recalcul des
32 champs initiaux dans `scripts/fixtures/radar-review-583/`. Les agrégats
affichés correspondent à la réponse officielle collectée, pas à l’ancienne
valeur conservée dans l’historique du radar. Ce dernier sert à ne pas interpréter
une révision de classification comme un mouvement économique.

## Correction des publications

Les images des comparatifs mentionnaient déjà la date des compositions ; les
tweets ne la précisaient pas. Le texte indique désormais la date propre à chaque
bloc pays/secteurs. La répartition géographique des portefeuilles physiques DWS
est identifiée comme « classification DWS », dans le texte et dans la légende
de l’image. Cela ne présente pas le pays d’enregistrement comme une exposition
au chiffre d’affaires des entreprises.

Aucun poids, rendement, frais, actif sélectionné ou structure de tweet n’est
modifié. La précision repose sur les métadonnées du champ, pas sur une liste
d’ISIN maintenue à la main. Les autres fournisseurs ne reçoivent pas cette
qualification.

## Validation

- Tests INSEE de parsing et de qualité des observations.
- Régression du suivi : une PR ne lève pas « non observé » ; une vraie collecte
  sans changement enregistre un succès sans inventer une publication Pages.
- Vérification des six comparatifs contre les agrégats et dates de leurs champs.
- Tests navigateur des images : présence de la légende DWS datée, absence de
  chevauchement et de texte coupé ; exports des six comparatifs conservés dans
  les artifacts GitHub pour inspection.
- Tests existants des présentations, textes de portefeuilles, impact des frais
  et conventions de publication ; compilation et contrôles CI avant fusion.
