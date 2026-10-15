# Valorisation — règles en vigueur au 15 octobre 2026

Ce document remplace les anciennes conventions de croissance constante, écarts
fixes de ±3 points et multiples universels 15/20/25. Ces conventions ne décrivent
pas le parcours actuel. Les fonctions historiques de `valuation.js` subsistent
pour leurs tests de référence ; l’interface appelle `priceTargets.js`.

## Promesse et périmètre

Trois scénarios de cours à 1, 3 et 5 ans, réglables, fondés sur les observations
qualifiées de chaque entreprise. Ce sont des scénarios conditionnels et non des
prédictions certaines ni des objectifs d’analystes. Aucune probabilité n’est
attachée aux noms Prudent, Central et Favorable.

Objectif = fondamental par action à l’échéance × multiple de sortie.
Potentiel = objectif / dernière clôture − 1.
Progression annualisée du cours = (objectif / clôture)^(1 / années) − 1.
Dividendes, frais et fiscalité sont exclus de cette progression.

## Deux méthodes distinctes

**Bénéfices** : BPA ajustés datés et PER prévisionnels de même définition.
Le BPA retenu est celui du premier exercice fiscal se terminant après l’échéance
calendaire. Les points sourcés sont distingués des extrapolations : après la
dernière estimation, la croissance converge en trois exercices vers la médiane
de croissance historique du chiffre d’affaires, bornée entre 0 et 10 %.
Une estimation ajustée n’est jamais appliquée au BPA comptable publié.

**FCF** : quatre exercices consécutifs positifs et comparables, composantes OCF
et investissements, nombres moyens dilués, source et contrôle des fractionnements
sur toute la fenêtre. Le chiffre d’affaires, la marge opérationnelle de trésorerie,
les investissements et les actions sont projetés séparément. Les rachats sont
bornés par le financement observé après dividendes. La rémunération en actions
n’est pas retirée une seconde fois lorsque la variation nette des actions est
utilisée. Le modèle ne projette pas explicitement acquisitions, locations et
financements futurs. Une série négative, des classes d’actions non qualifiées ou
un fractionnement non certifié bloquent cette méthode.

Les deux méthodes ne sont pas moyennées. Les banques, assurances et autres
activités incompatibles ne doivent pas être déclarées `operating-company` pour
forcer leur admission. Les pertes sont conservées dans les comptes et élargissent
les sensibilités ; elles ne sont pas remplacées par des bénéfices fictifs.

## Multiples et sensibilités

Au moins trois multiples historiques comparables. La médiane de l’entreprise
reste la référence. Les pairs ne contribuent que si au moins deux autres sociétés
d’un groupe explicitement qualifié sont exploitables ; poids 25 %, écart de leur
médiane borné à ±25 % de la référence historique. Les secteurs seuls ne suffisent
pas à qualifier un groupe. Aucun élargissement arbitraire des comparables.

La dispersion des variations logarithmiques du chiffre d’affaires et des
fondamentaux détermine les chocs. Plancher 4 % (12 % si pertes), plafond 40 % ;
historique court majoré de 25 %. Facteur = exp(±dispersion × racine de l’horizon).
Les multiples utilisent les quantiles historiques 20–80 %, avec bornes de
40–95 % et 105–200 % de la référence. Ce sont des conventions de sensibilité,
pas des intervalles statistiques de confiance. Elles ne couvrent pas nécessairement
un cycle économique complet. Une croissance personnalisée remplace la trajectoire
variable par un taux constant ; l’origine du réglage est affichée.

## Lecture inverse et DCF

La lecture inverse du prix de revente calcule la croissance constante nécessaire
pour obtenir un niveau ou une progression annualisée du cours, avec le multiple
final choisi. Elle reste distincte des objectifs directs et de leur tweet.

Le DCF actualise les flux distribués annuels et une revente finale. Il emploie
une convention à nombre d’actions constant à compter de la date du cours : la
variation des actions intégrée à la trajectoire automatique est neutralisée.
Ainsi la même trésorerie ne finance pas à la fois des rachats et une distribution
intégrale. Une croissance personnalisée est interprétée à actions constantes.
Cette valeur actuelle peut donc reposer sur un flux par action différent de celui
des objectifs. Ni dividende ajouté, ni trésorerie ajoutée, ni seconde déduction de
dette : modèle simplifié après intérêts, financement net par dette nul, pas FCFF.
La recherche inverse est bornée à −50/+50 % ; absence de solution = indisponible.

## Qualification et données de vigilance

`companyQualification` sépare présence, fraîcheur et utilisabilité des comptes,
cours, historiques, estimations et base par action. Les restrictions sont propres
à chaque méthode. `companyCompleteness` conserve le contrat historique strict
d’admission ; il ne signifie pas disponibilité des deux méthodes. Aucun seuil
n’est abaissé pour augmenter le nombre de dossiers dits complets.

Les données de dette, trésorerie, locations, acquisitions, rémunération en actions
et rachats portent une définition, une période et une source. Le complément annuel
standardisé est rapproché du chiffre d’affaires et du résultat retenus. Le bilan
est rapproché de son équation comptable ; les champs absents restent absents et
les erreurs conservent les dates des anciennes observations. La dette standardisée
peut inclure les locations : aucune addition automatique. Les comptes trimestriels
ou semestriels manquants sont signalés ; ils ne sont pas fabriqués à partir de l’annuel.

## Restitution et surveillance

Graphique : clôtures réelles hors dividendes et trajectoires hypothétiques.
Le multiple converge géométriquement ; les points terminaux rejoignent exactement
les objectifs. Écran, texte et PNG utilisent le même modèle. Les estimations
externes, extrapolations et réglages personnels sont explicités dans la publication.

Le workflow quotidien collecte, qualifie, conserve les observations valides et
signale les régressions. `company-method-and-field-qualification` contient la matrice
de tous les dossiers et les erreurs du complément financier. Les autres artefacts
conservent les erreurs des collectes de comptes et de valorisation. Les échecs ne
rafraîchissent pas les observations retenues ; les méthodes périmées sont retirées.
Les projections initiales restent archivées par `company-forecast-archive.sh`.

Réception : tests indépendants de sommes géométriques, objectifs, annualisation,
calculs inverses, DCF à actions constantes, devises, sources, dates fiscales,
chaque méthode et scénario pour tous les dossiers, puis tests Chromium mobile,
exports, copie, péremption et compilation avec budgets inchangés. Ces vérifications
internes ne constituent pas une certification financière externe.
