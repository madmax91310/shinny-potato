# Simulateur de patrimoine par enveloppe

Route : `/simulateur-patrimoine`, dans « Comparer et simuler ».

La saisie porte sur les enveloppes (Livret A, LDDS, assurance-vie, PEA, CTO, PEL, autre placement), sans ETF, ISIN ou compositions. Chaque poche contient le capital actuel, un versement mensuel et trois rendements hypothétiques personnalisables. Une enveloppe peut être séparée en plusieurs poches ; l'onglet de répartition les regroupe par enveloppe.

Les rendements Livret A / LDDS sont préremplis depuis `currentSavingsObservation` du registre économique existant. Les plafonds des livrets viennent du registre réglementaire commun. Ils ne sont pas recopiés. Les autres rendements sont saisis par l'utilisateur ; les taux de l'exemple sont uniquement pédagogiques. L'inflation par défaut (2 %) est une hypothèse et n'est pas une statistique courante.

## Calculs

- Taux mensuel équivalent : `(1 + taux_annuel_net)^(1/12) - 1`.
- Rendement déclaré net : aucun frais supplémentaire. Rendement déclaré brut : facteur annuel net `(1 + rendement_brut) × (1 - frais_annuels)`.
- Rendement mensuel, puis retrait éventuel, puis versement en fin de mois. Les revenus restent investis.
- La hausse annuelle du versement prend effet aux mois 13, 25, etc. Un changement programmé remplace le versement au mois indiqué. La dernière modification saisie prime en cas de doublon au même mois.
- Une pause suspend les versements pendant toute la plage, bornes incluses. Un retrait ne peut dépasser le capital disponible ; le manque est enregistré et signalé.
- Les versements refusés par les plafonds de livrets sont affectés à des espèces non rémunérées. Ils restent inclus dans le patrimoine et les versements cumulés. Les plafonds sont partagés entre les poches du même livret ; les intérêts peuvent dépasser le plafond.
- Gains/pertes = capital restant + retraits cumulés − capital initial − versements cumulés.
- Pouvoir d'achat = capital nominal / `(1 + inflation)^années`.
- La taxe de sortie facultative s'applique uniquement aux gains positifs restants. Les retraits réduisent la base au prorata. C'est une hypothèse simplifiée de liquidation finale, sans abattements, ancienneté, impôt sur les retraits ou taxation annuelle. La base initiale est supposée égale au capital actuel. Les totaux principaux et les visuels restent avant fiscalité.
- Les conditions et plafonds PEA/PEL ne sont pas modélisés et sont signalés dans les résultats.

## Publications et données personnelles

Le mode comparaison garde deux patrimoines indépendants, avec un même horizon, une même inflation et un même scénario. Leurs budgets et rendements peuvent différer ; les hypothèses sont affichées dans le texte. Le graphique et le PNG affichent uniquement les trois trajectoires du patrimoine actif (A ou B), avec des couleurs et des tracés distincts. Le PNG est un graphique de 1600 × 1000 pixels, sans titre, bilan, hypothèses ou mentions autour du graphique ; seuls les graduations et les trois libellés de légende restent. Le texte et les totaux utilisent le scénario sélectionné.

Le brouillon de tweet est modifiable. Les exports PNG, CSV annuel et JSON sont locaux. Aucun envoi vers X n'est effectué. La sauvegarde locale se fait sur action explicite, avec chargement et effacement. L'import JSON valide les champs, les plages numériques, les identifiants et les événements avant de remplacer la saisie. Le fichier JSON inclut les deux patrimoines.

## Vérification

- `npm run test:wealth` : calculs financiers, flux, frais, plafonds, scénarios, fiscalité simplifiée, répartition et validation des imports.
- `npm run build` : compilation et budget des routes chargées à la demande.
- `npm run test:wealth:browser` (Chromium installé) : saisie, comparaison, publication modifiable, PNG/CSV/JSON, sauvegarde, import rejeté et mobile. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet d'utiliser un navigateur fourni par l'environnement.

Les deux suites du simulateur sont raccordées à la validation GitHub Pages.
