# Le budget de… — extension à dix profils, 30 octobre 2026

## Périmètre

Ajout des sept profils retenus par l’utilisateur aux trois profils existants, dont
les identifiants et budgets sont conservés. Aucune identité inventée ; pseudonymes
et descriptions publiques uniquement. Dates des témoignages conservées ; contrôle
du 30/10/2026, sans prétendre actualiser la situation personnelle des témoins.

Les montants restent autodéclarés, sans accès aux relevés bancaires. Un budget
peut être prévu ou comporter des enveloppes groupées ; celles-ci ne sont pas
ventilées artificiellement. Les soldes calculés ne deviennent pas de l’épargne
réalisée. Les limites sont exposées dans le contexte et la preuve du profil.

## Rapprochements retenus

| Profil et source primaire | Ressources | Dépenses | Versements au budget | Solde après versements | Qualification |
|---|---:|---:|---:|---:|---|
| [Ingénieur aéronautique, 28 ans, 30/11/2025](https://community.finary.com/t/optimisation-des-charges-fixes-50-30-20/32236) | 3 050 | 2 642 | 408 | 0 | Net avant impôt ; 260 € d’impôt dans les dépenses. Cadeaux, voyages et activités mensualisés. « Charges » conservé sans inventer son détail. |
| [Alternant en génie civil, 22 ans, 15/05/2025](https://community.finary.com/t/conseil-strategie-patrimoine-alternant-de-22-ans/26062) | 1 500 | 500 | 1 000 | 0 | Chez les parents ; 400 € regroupent transports et abonnements. Retraits sur livret certains mois : le versement PEA n’est pas intégralement une épargne nouvelle. |
| [Fonctionnaire, 30 ans, 21/05/2025, réponse 63](https://community.finary.com/t/votre-capacite-depargne/26044/63) | 2 155 | 1 532,01 | 0 | 622,99 | Capacité calculée avant vacances, payées depuis le livret. Le DCA envisagé de 500 € n’est pas ajouté comme versement réalisé. |
| [Alternant, 19 ans, 27/09/2025](https://community.finary.com/t/alternant-19-conseil-strat-dinvestissement/30020) | 1 221 | 1 020,99 | 150 | 50,01 | Salaire 770 + APL 301 + bonus 150. Régularité du bonus inconnue. Solde conservé sans le compter une deuxième fois dans l’épargne. |
| [Couple de 35 ans, 15/10/2025](https://www.reddit.com/r/VosSous/comments/1o78v4m/) | 5 050 | 4 439 | 0 | 611 | 21 lignes ; loyers de leurs mères à l’étranger inclus. 130 € de téléphone en dix fois, dépense temporaire. Dépenses annuelles non entièrement précisées : 611 € est le reste du tableau, pas de l’épargne certifiée. |
| [Salarié tech, 26 ans, 06/02/2026](https://www.reddit.com/r/VosSous/comments/1qxm6ev/26_ans_cdi_grand_m%C3%A9nage_dans_les_banques_et/) | 1 900 | 1 070 | 600 | 230 | Montants approximatifs ; 400 € aux parents + 70 € d’abonnements + 600 € d’enveloppe quotidienne. Reste sur compte courant susceptible d’être dépensé. Frais de compte de 2,20 € non ajoutés à nouveau sans preuve de non-inclusion. |
| [Alternant, 20 ans, 03/09/2025](https://www.reddit.com/r/VosSous/comments/1n71114/) | 900 | 400 | 500 | 0 | Budget prévu ; parents assurent logement et alimentation dans les réponses. 200 € de charges groupées + 200 € pour profiter ; 250 € Livret A + 110 € PEA + 100 € Bricks + 40 € crypto. |

Les articles incomplets, tableaux images non lisibles et témoignages dont le
revenu du conjoint manque restent exclus. Ce catalogue n’est pas un recensement
exhaustif de tous les budgets de 2025 et 2026.

## Vérification et publication

Le modèle existant est conservé : calcul en centimes partagé entre texte,
aperçu et PNG. Les données ne modifient ni le calendrier, ni le format DCA, ni
les clés de stockage et brouillons existants. Les sept rapprochements sont
couverts par les tests du modèle ; la recette navigateur existante parcourt
automatiquement tous les profils à 1440, 390 et 320 pixels et compare les octets
du PNG téléchargé avec ceux de l’aperçu.

Les vérifications locales portent sur les modules de données et calculs ; le
build intégral et les parcours navigateur sont exécutés dans le portail CI.
Les résultats réels, le commit fusionné et la publication sont consignés dans la PR.
