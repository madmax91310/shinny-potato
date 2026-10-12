# Bilans officiels et accès depuis GitHub Actions

## Sources comparées

| Source officielle | Historique et renouvellement | Fiabilité et limites | Compatibilité retenue |
|---|---|---|---|
| SEC Company Facts / Company Concept | Faits XBRL des dépôts disponibles ; profondeur variable selon l’entreprise et le concept ; comparatifs et dates de dépôt | JSON structuré, mais accès SEC refusé sur les runners observés. Les concepts standardisés peuvent omettre une ventilation nécessaire | Parseurs SEC existants ; sonde des deux API, sans activer un indicateur exclusivement dépendant d’un accès non qualifié |
| SEC `companyfacts.zip` | Même famille de faits, archive recompilée chaque nuit | Archive de toutes les entreprises, volumineuse ; téléchargement et identité à qualifier. Une signature ZIP ne prouve pas la validité des données | Même parseur possible après extraction ; uniquement test d’accès borné dans cette PR, aucune donnée activée depuis cette archive |
| SEC Financial Statement Data Sets | Archives trimestrielles depuis 2009 ; faits tels que déposés, identité/accession/date de dépôt | Chargement par accession, concept, unité et contexte requis ; rythme trimestriel insuffisant seul pour découvrir les publications intermédiaires récentes | Format tabulaire incompatible directement avec `companyfacts` ; test d’accès du dernier trimestre clos, pas de mise en production sans qualification |
| Communiqués consolidés sur les sites/CDN officiels | Dernier bilan et comparaison annuelle dans chaque publication ; archives déjà découvertes par les collecteurs (3–5 exercices de résultats) | Source directe, accessible selon l’émetteur ; HTML/PDF variables. Les bilans ne présentent pas toujours la dette courante, la trésorerie seule ou le total des passifs | Adaptateurs Apple, Microsoft, Nvidia, Alphabet et Amazon ; téléchargements et découverte réutilisés, rapprochement exact aux comptes existants |
| Rapports annuels européens / ESEF | Publications annuelles et comparatifs ; semestres selon l’émetteur | IFRS, intérêts minoritaires, taxonomies et dette à qualifier séparément. Aucun bilan américain extrapolé à un émetteur européen | Les collecteurs IFRS existants sont conservés ; aucun ROE/liquidité ajouté pour les autres entreprises dans cette PR |

Références SEC : [API et archives nocturnes](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [données trimestrielles et documentation](https://www.sec.gov/dera/data/financial-statement-data-sets.html). Aucun miroir tiers, proxy ou imitation de navigateur n’est ajouté.

## Périmètre qualifié

La sonde `scripts/probe_company_sources.py` écrit `company-source-probe.json` avec environnement, horodatage, statuts HTTP SEC et composantes réellement téléchargées/validées chez les cinq émetteurs. Le workflow de PR conserve cet artefact, puis exécute la collecte quotidienne complète et les tests navigateur. Une sonde SEC réussie reste explicitement **accessible mais non qualifiée**, tant qu’aucun fichier complet n’a été validé.

Le collecteur `company_balance.py` accepte uniquement les hôtes officiels des cinq adaptateurs existants et des tableaux consolidés en millions. Il identifie les deux dates exactes, l’ordre des colonnes et les unités, rapproche CA/résultat net du document avec les observations actuelles et réconcilie actifs = passifs + capitaux propres. Les sous-totaux courants et la trésorerie doivent être cohérents. Amazon exige toutes ses composantes non courantes, y compris les locations, avant la réconciliation ; aucune dette financière n’est déduite de ce total. Microsoft exige le titre et l’unité du `caption` HTML. Le PDF Apple comporte parfois un chiffre séparé après le signe dollar : cette seule forme est normalisée et la réconciliation reste obligatoire.

- **ROE annuel** : bénéfice net annuel / moyenne des capitaux propres d’ouverture et de clôture. Les deux bilans doivent venir du même document comparatif et correspondre exactement aux dates de l’exercice ; deux capitaux propres positifs sont requis. Une perte produit un ROE négatif. Ce ratio est sensible aux rachats.
- **Liquidité générale** : actifs courants / passifs courants du dernier bilan publié. Un passif courant nul ne donne pas un ratio infini.
- **Liquidité immédiate cash** : trésorerie et équivalents seuls / passifs courants. Une ligne combinant trésorerie et placements ne fournit pas ce ratio.
- **ROIC désactivé** : les communiqués ne qualifient pas uniformément la dette financière complète et le capital investi à deux dates, ni un NOPAT après impôt sur une base documentée. Le taux effectif d’impôt consolidé inclut les activités et résultats non opérationnels ; il n’est pas appliqué automatiquement au résultat opérationnel. Dette long terme seule, taux forfaitaire et NOPAT estimé ne sont pas substitués aux données manquantes.
- **Liquidité réduite désactivée** : actifs courants moins stocks n’est pas assimilé à un portefeuille de créances immédiatement disponibles ; charges constatées d’avance et autres actifs exigent une qualification supplémentaire.
- **BPA annualisé désactivé** : la comparabilité historique après divisions d’actions n’est pas qualifiée par cette extension.

## Dates, fraîcheur et échecs

`solidity` est indépendant des composantes de cash et est relu quotidiennement. Il conserve les deux bilans annuels dans leur document commun, le dernier bilan, les liens exacts et la date réelle d’observation. Les périodes et dates de dépôt déjà présentes dans les comptes/historiques restent intactes. Une date de clôture ou de téléchargement n’est jamais présentée comme la date de publication d’un communiqué ; les PDF qui ne donnent pas celle-ci restent sans date de publication inventée.

Une erreur préserve le bloc précédent et son horodatage ; un renouvellement échoué d’un bloc qualifié est signalé dans le rapport quotidien. Le bloc expire après 45 jours sans vérification ; le bilan récent après 200 jours. Les comptes annuels doivent rester publiables (550 jours maximum). Toute nouvelle période de résultats ou révision du CA/bénéfice retire le bloc jusqu’à sa requalification. Les données sont recalculées à l’affichage ; aucune appréciation automatique d’achat n’est ajoutée. Sources des deux documents et date de vérification visibles dans l’outil.

Les quinze autres entreprises restent sans nouveaux ratios de bilan tant que leurs propres adaptateurs ne sont pas qualifiés. La couverture attendue porte sur cinq des vingt entreprises (donc quinze sans cette extension) ; une composante absente ou périmée reste omise.

## Vérification

Tests Python : extraits officiels, ordre des dates, unité, bilan incomplet, totaux/subtotaux, nombres non finis, intitulés similaires, source étrangère et comptes divergents. Tests JavaScript : calcul ROE, pertes, capitaux propres négatifs, dénominateur nul, cash absent, dates futures/périmées, révision des comptes et nouveau trimestre. Les tests existants de comptes, cash, texte, export PNG et mobile sont conservés.
