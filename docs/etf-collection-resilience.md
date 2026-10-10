# Isolation et variations suspectes des collectes ETF

Les erreurs sont isolées par part exacte. Amundi conserve une requête groupée :
un produit absent, dupliqué ou invalide n'empêche plus le traitement des autres
produits. Une erreur de transport de cette requête reste commune à toutes les
parts et produit une erreur explicite pour chacune. State Street traite chaque
requête et chaque lecture séparément. iShares et les extensions gardent leur
isolation existante et utilisent le même contrôle de variations.

L'application des parts saines reste atomique. Une part rejetée conserve toute
sa fiche antérieure, avec ses dates ; elle ne reçoit pas une date de contrôle
artificielle. Les erreurs figurent dans le rapport conservé en artifact,
la synthèse GitHub et le suivi existant des échecs. La tâche signale l'échec
après l'application des autres parts validées.

## Seuils de mise à l'écart

| Observation comparable | Déclenchement |
|---|---|
| Année historique déjà publiée, même devise et méthode | Correction absolue d'au moins 1 point de pourcentage |
| Encours, même devise et même périmètre fonds/part | Multiplication par au moins 2 ou division par au moins 2 en 45 jours ou moins |
| Pays ou secteurs, même base et classification | Au moins 25 points de réallocation, mesurée par la demi-somme des écarts absolus |
| Positions identifiées communes | Au moins 15 points de variation du poids d'une position |

Les nouveaux calendriers annuels et les premières observations n'ont pas de
valeur antérieure à comparer. Les différences d'arrondi inférieures au seuil
ne déclenchent pas le contrôle. Les données plus anciennes ne remplacent pas
les données actives et n'activent pas les contrôles d'encours/composition.
Les pays et secteurs ne sont comparés que si les libellés ou identifiants
communs couvrent au moins 90 % de chaque tableau : une traduction ou une
migration de nomenclature ne permet pas une comparaison fiable. Le top dix
reste une liste partielle ; aucun taux de rotation complet n'est déduit.

Une anomalie est un motif de vérification, pas une preuve d'erreur : un afflux
de capitaux, une fusion ou un rééquilibrage peut être réel. La nouvelle
observation rejetée à la fusion est conservée dans `proposedObservation` du
rapport pour examiner sa source. Le contrôle ne l'accepte pas automatiquement
après plusieurs tentatives identiques. Après vérification de la part, de la
source et de la convention, une correction explicite du registre actif peut
établir la nouvelle référence. Aucun seuil ne permet de contourner les
contrôles d'identité, de devise ou de méthode existants.

Ces contrôles ne garantissent pas la détection de toutes les erreurs : un
changement inférieur au seuil ou une composition non comparable reste soumis
aux validations structurelles existantes. Ils n'ajoutent aucun module au code
chargé par le navigateur.
