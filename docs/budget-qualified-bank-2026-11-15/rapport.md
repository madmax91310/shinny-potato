# Banque de budgets qualifiés — 15 novembre 2026

## Point de départ et périmètre

Branche issue de `master` à `da10dcb`. Instructions `CLAUDE.md` et audit du 18 octobre relus ; aucun `AGENTS.md` présent. Banque active : **77 profils**, pas 70. Les 70 références et les sept ajouts antérieurs gardent leurs exports historiques, identifiants, données et textes. Comparaison profonde des 77 objets avant/après réussie ; contrôle PEL de Guillaume conservé (45 €/mois, 540 €/an). Aucun profil de 76 ans réintroduit.

PR concurrente pertinente : #1327 (pagination 4:5 des exports), lue avant intervention. Les modifications de la banque ne remplacent pas son moteur. La petite extension de l’image principale réutilise le compositeur existant, avec sa police financière de 40 px : ces nouvelles entrées exigent une seule page complète ; un dépassement produit une erreur explicite et ne bascule pas vers une image longue ou une vue des seuls totaux. Les participations adaptées gardent leur comportement existant.

Le parcours public initial a été ouvert dans Chromium : 77 profils, copie et aperçu accessibles. `build-info.json` : code `0449896461917b55fede6b209eba62e7cbedb144`, données `f0c4af3990af26b3fb2cebace032930c8cf25e15`, voie `fallback`, construction `2026-11-15T17:43:19Z`. Ce constat ne vaut pas preuve de publication de `master` plus récent.

## Inventaire et suivi manuel

`inventory-before.csv` contient tous les identifiants, pays, devises (EUR par défaut du moteur), ressources, configuration, logement, métier, période réelle, URL et empreinte de chaque profil initial. Les informations absentes ne sont pas déduites.

Le suivi « publié » n’est pas une donnée de la banque : il est local à chaque navigateur, dans le workspace version 4 et ses `publicationDates`. Les dates `publishedAt` des fiches datent les **sources**, pas les publications sur X. Sans sauvegarde personnelle, impossible de recenser les statuts réels de l’utilisateur : l’inventaire les note donc « device-local-not-readable », pas « non publié ». Aucune clé, migration ou date existante n’est réécrite. Les nouveaux identifiants ne sont jamais ajoutés automatiquement à `published`.

Catégories initiales : pays renseignés France 41, Suisse 13, Belgique 5 ; 18 pays non renseignés. 13 budgets CHF, les autres en EUR (explicite ou défaut historique). 32 couples, 15 personnes seules, 11 autres configurations, 19 non renseignées. Logement : 41 locataires, 16 propriétaires, 10 autres, 10 non renseignés. Ces catégories ne sont pas requalifiées silencieusement. La Suisse et les jeunes investisseurs sont déjà présents ; le lot privilégie les nouveaux enjeux de logement, de crédit, de travail et de retraite.

## Recherche et admission

**64 sujets candidats effectivement consultés via l’API publique Finary**, réponses de l’auteur distinguées de celles des autres membres. Les 14 sources retenues ont leurs numéros de messages, identifiants, dates et empreintes de contenu dans `provenance.sourceSnapshot`. `sourceFacts` conserve les éléments d’origine ; chaque ligne indique `source`, `source-envelope-allocation` ou `editorial-created`. Les versements proposés sont séparés des montants détenus.

**14 retenus et complétés, 50 non retenus**, dont deux réserves explicites. Sources : neuf de 2026, cinq de 2025. `candidates.json` et sa version CSV donnent un motif individuel pour chaque décision. Les 50 exclusions ne signifient pas que toute dépense manquante exclut une source : les dépenses sont complétées dans les 14 admissions. Les exclusions portent surtout sur les recettes inconnues ou mélangées, la chronologie, les doublons et la diversité.

Deux doublons inter-sujets écartés : Lyslelys (`36553`, déjà Apolline `40101`) et AlessGiu (`34052`, déjà Alexandre `34261`). Les comparaisons utilisent URL, auteur et situation financière, pas uniquement un prénom. `source-author-check.json` garde des empreintes d’auteurs, sans recopier leurs pseudonymes. Le grand fil de présentations est un agrégat : son auteur initial n’est pas une preuve d’identité de tous ses messages ; les métiers et faits déjà conservés ont aussi été comparés.

Le candidat retraité `39547`, écarté dans l’ancien audit pour dépenses absentes, est réexaminé parce que la demande actuelle autorise explicitement leur création. Il n’est pas présenté comme une nouvelle déclaration retrouvée. Il a 66 ans et n’est pas le profil de 76 ans supprimé.

Six profils manquent pour atteindre vingt. Pas de nouveau salaire fabriqué à partir d’une capacité d’épargne, d’un chiffre d’affaires ou d’un loyer brut. Pas de nouveau profil belge tiré des deux doublons ni d’un versement ETF sans salaire. Aucun nouveau parent seul ou indépendant n’est prétendument qualifié avec un revenu personnel non établi. Les sources à reprendre et leurs blocages précis restent dans le registre.

## Profils ajoutés

Tous les montants ci-dessous sont en EUR par mois. `Revenus − dépenses − versements = marge`. Les provisions ne sont pas assimilées à des factures effectivement payées chaque mois.

| Profil | Période source | Pays de la version | Revenus | Dépenses | Versements | Marge | Sujet |
|---|---|---|---:|---:|---:|---:|---|
| Gaspard | [2026-06-13](https://community.finary.com/t/37535) | France | 2500 | 1670 | 500 | 330 | Préparer l’ouverture d’un restaurant avec un leasing existant |
| Rémi | [2025-02-09](https://community.finary.com/t/22913) | France | 2750 | 2080 | 600 | 70 | Voyages provisionnés et placements avant mise en location de sa résidence |
| Gérald | [2025-11-20](https://community.finary.com/t/31536) | France | 5500 | 2150 | 2500 | 850 | Salaire et pension militaire, activité immobilière envisagée sans revenu anticipé |
| Manon | [2026-06-05](https://community.finary.com/t/37301) | Non renseigné | 1300 | 650 | 545 | 105 | Alternance, capital reçu et achat immobilier lointain |
| Alban | [2026-11-03](https://community.finary.com/t/40616) | Non renseigné | 1400 | 800 | 500 | 100 | Pension reçue et quatre enveloppes, voiture avant projet immobilier |
| Aude et Rémy | [2026-08-04](https://community.finary.com/t/38815) | France | 5100 | 3500 | 1000 | 600 | Construction, CDD et risque de baisse de salaire |
| Léna et Gaëtan | [2026-05-22](https://community.finary.com/t/36821) | France | 4400 | 2195 | 1900 | 305 | Petit loyer, épargne déjà constituée et choix de l’apport |
| Baptiste | [2026-05-08](https://community.finary.com/t/36268) | France | 2580 | 1930 | 400 | 250 | Projet de parking abandonné, apport disponible sans rendement supposé |
| Corentin | [2026-09-22](https://community.finary.com/t/39814) | France | 2300 | 1585 | 400 | 315 | Studio financé par un prêt étudiant encore à rembourser |
| Françoise | [2026-05-19](https://community.finary.com/t/36724) | France | 1800 | 1250 | 300 | 250 | Salaire personnel, espèces dans le PEA et préparation de la retraite |
| Étienne | [2026-09-06](https://community.finary.com/t/39547) | France | 3000 | 1790 | 400 | 810 | Pension personnelle, produit d’une vente à placer sans rente fictive |
| Mélodie et Yann | [2025-10-26](https://community.finary.com/t/30825) | France | 3600 | 3550 | 0 | 50 | Retour après congé parental, achat prévu et marge de 50 € sans épargne nouvelle |
| Florent | [2025-07-22](https://community.finary.com/t/28041) | Luxembourg | 3100 | 2320 | 500 | 280 | Voiture de fonction contre offre de salaire supérieure sans voiture |
| Esteban | [2025-06-14](https://community.finary.com/t/26933) | France | 2850 | 1738.33 | 1000 | 111.67 | Salaire avant impôt, achat de couple et provision fiscale annuelle |

## Compléments et limites financières

Les personnages et leurs dépenses préparées ne sont jamais décrits comme des témoignages reçus ou indépendamment vérifiés. Leur nature et la provenance restent dans la fiche/panneau de vérification, hors texte copié et PNG. Prénoms anonymisés, pas de citation inventée. Les âges absents restent absents ; les couples n’héritent pas d’un âge unique artificiel. Les périodes des sources servent au tri, la préparation du 15 novembre ne les rend pas actuelles.

Chaque admission documente les lignes ajoutées et les choix de transformation. Les données d’origine ne sont pas remplacées par la préparation : faits, date de source et références de messages restent séparés. Les inconnues sur les salaires nets ne deviennent jamais des affirmations « après impôt ». Aucun rendement, avantage fiscal, prestation ou nouvelle dette n’est créé.

- **Gaspard** : le loyer personnel est 400 €, moitié des 800 € du couple. Pas de revenu du conjoint inventé. Dépenses ajoutées à sa part, réserve de 8 000 € séparée du projet encore à chiffrer.
- **Rémi** : crédit existant, mensualité préparée 800 € faute de montant déclaré ; taux et durée originaux conservés en interne. Les 6 000 € annuels de voyages/loisirs deviennent 500 €/mois, sans les recompter dans l’épargne. Valeur crypto ambiguë non promue en patrimoine chiffré.
- **Gérald** : salaire et pension restent une ressource groupée de 5 500 €, ventilation inconnue. Dépenses et versements préparés, aucun revenu immobilier futur ni capital de départ inventé.
- **Manon** : aides non chiffrées exclues. Participation au foyer et dépenses personnelles créées ; les 4 000 € à répartir ne sont pas additionnés à un total patrimonial approximatif. PEL 45 € conservé ; versement de moyen terme encore prévu.
- **Alban** : ventilation de l’enveloppe source de 800 €, pas 800 € plus ses lignes. Assurance-vie 50 € **en plus** des 450 € envisagés, soit 500 € ; marge 100 €. Pension reçue distincte du salaire, valorisation du PEA non déduite de ses versements cumulés.
- **Aude et Rémy** : énergie/eau comprises dans les 200 € de charges préparées, pas ajoutées une seconde fois. Aucun deuxième enfant ni salaire futur majoré. Baisse de salaire de 400 € : marge 600 → 200 €. Crédit futur non compté avec le loyer actuel. Aménagement de 15–20 k€ non absorbé artificiellement dans les 330 k€.
- **Léna et Gaëtan** : épargne totale 92 k€, dont PEA 1,5 k€ ; livrets calculés 90,5 k€, pas 92 k€ plus les PEA. Versements pour logement et long terme créés séparément.
- **Baptiste** : loyer, vie courante et versement préparés, âge/famille inconnus. Les 5 000 € du parking abandonné ne deviennent ni recette ni réserve générale.
- **Corentin** : 550 € de prêt étudiant réel ; pas de deuxième crédit immobilier fabriqué. Les 50 k€ initiaux ne sont pas assimilés au capital restant dû. Aucun futur loyer dans les ressources.
- **Françoise** : budget personnel au sein d’un couple. 60 k€ sur PEA **incluent** 47 k€ en espèces, pas deux patrimoines indépendants. Provision fiscale ronde de 80 € créée, sans calcul de droit ou taux réel. Salaire non rebaptisé après impôt ; revenu du conjoint inconnu.
- **Étienne** : pension personnelle de 3 000 €, pas pension du couple. 300 k€ à placer issus d’une vente évoquée, aucun complément de retraite acquis ajouté aux revenus. Dépenses et 400 € mensuels créés.
- **Mélodie et Yann** : budget **prévu** après retour aux deux salaires, pas budget observé pendant congé parental. Garde et activités de deux jeunes enfants estimées à 580 €, sans aide inventée. Apport 230 k€ + sécurité 20 k€ + installation/travaux 20 k€ = 270 k€. Dépenses 3 550 €, marge 50 €, aucun versement d’épargne supplémentaire. Une première intention éditoriale de 150 € a été écartée pour ne pas produire un déficit artificiel. Aucun revenu ajouté.
- **Florent** : résidence au Luxembourg et loyer créés ; la source établit le travail à Esch et la voiture/carburant employeur, pas sa résidence. Aucune voiture à sa charge facturée en double. Offre annuelle de 60 k€ non convertie en net mensuel fictif. Âge et famille inconnus.
- **Esteban** : salaire de 2 850 € avant IR et impôt annuel source de 4 000 €, provision 333,33 €/mois. Arrondi de quatre centimes sur douze mois documenté ; pas deux impôts. Patrimoine personnel, aucune ressource du conjoint ou aide à l’achat ajoutée. Pas de prolongation implicite d’un droit au LEP.

Les 14 questions centrales (une seconde pour 12 profils) sont éditoriales, issues des éléments de situation. Aucune n’est attribuée comme question reçue d’un abonné. Pas de troisième conclusion générique. Les deux profils peu documentés sur la famille ne se voient pas inventer des enfants ou un conjoint pour varier la banque.

## Validation et livraison

Les résultats réellement exécutés, l’inventaire des PNG et la version publiée sont consignés dans `validation.md` après recette. Une compilation seule ne constitue pas une inspection visuelle ni une preuve de mise en ligne.
