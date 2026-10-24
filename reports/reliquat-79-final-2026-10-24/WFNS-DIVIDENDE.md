# WFNS — dividende omis et cours ajustés corrigés

État actualisé après #898 et #907 : le cash manquant est réparé et présent dans les données publiques, mais le résidu de 2023 reste inexpliqué et cette fenêtre de cotation reste refusée. Performance depuis et les classements peuvent utiliser explicitement le calendrier NAV annuel distinct. Les paragraphes suivants conservent les preuves et résultats du lot initial ; PUBLICATION.md décrit la version courante et les exports finaux.


Part exacte : IE00BJ5JP097, WFNS.AS, Amsterdam, USD. Le dividende officiel détaché le **15/06/2023, 0,1077 USD**, figure dans la réponse BlackRock capturée le 23/10/2026 à 04:39 UTC. Il manque dans les événements Yahoo ; le ratio cours ajusté/cours brut ne change pas à son détachement. Le dividende de décembre est, lui, déjà ajusté.

Le collecteur conserve les cours et captures bruts. Il rapproche le facteur d’ajustement avant/après l’ex-date : seulement si l’ajustement manque, il applique le facteur rétrospectif **0,9770401646545843**, selon la convention des cours ajustés déjà utilisée. Aucun flux de dividende supplémentaire n’est ajouté aux moteurs. Si Yahoo répare son historique, l’ajustement supplémentaire cesse automatiquement. Un facteur ambigu, une mauvaise devise/identité, une preuve modifiée ou un changement ultérieur des unités de parts fait refuser la mise à jour.

Rendement de marché ajusté 2023 : **14,6048 % → 17,2980 % USD**. Rendement NAV officiel : **17,41 %**. Le résidu d’environ **−0,112 point** reste visible, sans attribution non prouvée à une prime/décote et sans forcer l’égalité cours/NAV. La correction repose sur le dividende démontré, pas sur le passage sous un seuil d’alerte.

Les variations annuelles qui ne traversent pas l’ex-date restent inchangées. Les points d’anniversaire et la clôture actuelle gardent leur convention de cours bruts. Versement unique, DCA, Performance depuis et comparaisons/classements consomment la série corrigée ; les calendriers annuels NAV des autres outils gardent leur source indépendante. Aucun actif ajouté, aucun format éditorial ou visuel réécrit.

La preuve du dividende est un fait historique daté, réutilisé avec son empreinte et sa date d’origine. Une nouvelle collecte de cours ne renouvelle pas artificiellement la date de cette preuve. La reprise périodique des cours reste automatique. Une révision des unités historiques ou une opération sur titres ultérieure demande une nouvelle qualification, plutôt qu’un montant par part extrapolé.

**Collecte réelle GitHub** : [39966580293](https://github.com/madmax91310/shinny-potato/actions/runs/39966580293), par le vrai point d’entrée `refresh_monthly_history.py --only etf_financials --apply`, dans un runner sans publication. Le résultat consommé et la preuve générée sont conservés dans `github-qualification/`. Le premier essai de test isolé a rencontré un cas de bougie nulle dans son simulateur ; corrigé, puis trois tests ciblés et cette collecte réelle ont réussi.

Contrôles : dividende omis, réparation future du fournisseur sans double comptage, convention brute de l’anniversaire conservée, devise et identité exactes, empreintes, facteur ambigu, division ultérieure et changement d’unités historiques. Les audits des historiques, calendriers et raccordements ainsi que le build sont exécutés sur le lot. CI, fusion et version publique seront vérifiées avant annonce en ligne.

Recherche complémentaire du résidu : la fiche officielle de cotation de l’émetteur confirme Euronext Amsterdam, WFNS.AS, USD et première cotation le 20/05/2021. L’interface historique Euronext annonce un accès aux deux dernières années, à partir du 23/10/2024 ; les bornes 2022–2023 et les détachements 2023 sont hors de cette fenêtre publique. Il manque l’archive officielle correspondante et la convention précise de réinvestissement de la série BlackRock pour une attribution complète du résidu. Cette limite ne remet pas en cause la preuve indépendante du dividende omis. Les réponses et paramètres d’accès sont conservés dans preuves/wfns-bornes-euronext/.

## Décomposition financière complémentaire

Sur les 21 cas BlackRock disposant des réponses nécessaires, 16 détachements officiels sont rapprochés : sept ajustements déjà présents en devise identique, huit cashs convertis dont le facteur correspond au montant fournisseur (taux de paiement non certifié indépendamment), et **une omission démontrée : WFNS juin 2023**. Aucun autre dividende n’est corrigé par analogie. Voir controle-distributions-21-cas.csv.

Pour WFNS, le modèle reproduit aussi les facteurs de la série NAV officielle aux deux détachements. Sur la capture originale, l’écart de −2,80701387 points se décompose en **−2,69314557 points** d’ajustement de juin omis, **−0,10959784 point** lié aux niveaux de cours/NAV aux bornes, **−0,00427106 point** lié aux prix précédents utilisés comme bases d’ajustement, et environ **0,00000060 point** de résidu numérique du modèle officiel. La recomposition arithmétique ferme à 10⁻¹⁰ point. La collecte GitHub publiée conserve ses propres flottants, sans réécriture des captures pour égaliser les valeurs.

Cette décomposition ne certifie pas les anciennes clôtures Euronext et n’attribue pas leur différence économique à une prime/décote ou un horaire non prouvé. Le défaut technique est réparé ; la limite documentaire résiduelle reste séparée. Voir preuves/wfns-reconciliation-complete-composants.json.

## Lecture du bilan consolidé

RECOMPOSITION-ECARTS.md distingue l’ancien écart face au calendrier publié arrondi (−2,80519382points), l’écart face à la NAV quotidienne (−2,80701387points depuis la capture brute) et le résidu après réparation (−0,11385975point). La différence entre le rendement du registre initial et celui recalculé depuis la capture est conservée séparément ; ces bases ne sont pas confondues.
