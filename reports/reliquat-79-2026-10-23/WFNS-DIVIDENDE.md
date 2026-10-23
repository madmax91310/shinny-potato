# WFNS — dividende omis et cours ajustés corrigés

Part exacte : IE00BJ5JP097, WFNS.AS, Amsterdam, USD. Le dividende officiel détaché le **15/06/2023, 0,1077 USD**, figure dans la réponse BlackRock capturée le 23/10/2026 à 04:39 UTC. Il manque dans les événements Yahoo ; le ratio cours ajusté/cours brut ne change pas à son détachement. Le dividende de décembre est, lui, déjà ajusté.

Le collecteur conserve les cours et captures bruts. Il rapproche le facteur d’ajustement avant/après l’ex-date : seulement si l’ajustement manque, il applique le facteur rétrospectif **0,9770401646545843**, selon la convention des cours ajustés déjà utilisée. Aucun flux de dividende supplémentaire n’est ajouté aux moteurs. Si Yahoo répare son historique, l’ajustement supplémentaire cesse automatiquement. Un facteur ambigu, une mauvaise devise/identité, une preuve modifiée ou un changement ultérieur des unités de parts fait refuser la mise à jour.

Rendement de marché ajusté 2023 : **14,6048 % → 17,2980 % USD**. Rendement NAV officiel : **17,41 %**. Le résidu d’environ **−0,112 point** reste visible, sans attribution non prouvée à une prime/décote et sans forcer l’égalité cours/NAV. La correction repose sur le dividende démontré, pas sur le passage sous un seuil d’alerte.

Les variations annuelles qui ne traversent pas l’ex-date restent inchangées. Les points d’anniversaire et la clôture actuelle gardent leur convention de cours bruts. Versement unique, DCA, Performance depuis et comparaisons/classements consomment la série corrigée ; les calendriers annuels NAV des autres outils gardent leur source indépendante. Aucun actif ajouté, aucun format éditorial ou visuel réécrit.

La preuve du dividende est un fait historique daté, réutilisé avec son empreinte et sa date d’origine. Une nouvelle collecte de cours ne renouvelle pas artificiellement la date de cette preuve. La reprise périodique des cours reste automatique. Une révision des unités historiques ou une opération sur titres ultérieure demande une nouvelle qualification, plutôt qu’un montant par part extrapolé.

**Collecte réelle GitHub** : [39966580293](https://github.com/madmax91310/shinny-potato/actions/runs/39966580293), par le vrai point d’entrée `refresh_monthly_history.py --only etf_financials --apply`, dans un runner sans publication. Le résultat consommé et la preuve générée sont conservés dans `github-qualification/`. Le premier essai de test isolé a rencontré un cas de bougie nulle dans son simulateur ; corrigé, puis trois tests ciblés et cette collecte réelle ont réussi.

Contrôles : dividende omis, réparation future du fournisseur sans double comptage, convention brute de l’anniversaire conservée, devise et identité exactes, empreintes, facteur ambigu, division ultérieure et changement d’unités historiques. Les audits des historiques, calendriers et raccordements ainsi que le build sont exécutés sur le lot. CI, fusion et version publique seront vérifiées avant annonce en ligne.
