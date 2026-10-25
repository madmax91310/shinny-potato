# Hey @Grok — relecture du complément Sujet × Mécanique

Revue du 25 octobre 2026. Cette banque prépare uniquement des questions : ni réponse de Grok, ni appel à une IA, ni publication automatique. Les textes copiés ne comprennent jamais les métadonnées de classement.

## Choix éditoriaux

Les 160 identifiants de la première livraison sont conservés. Les questions utiles sont reclassées ; les questions trop scolaires ou dont le choix paraissait évident sont remaniées sous le même identifiant. Exemples : `banques-19` remplace la métaphore pour enfant par un conseil d’épargne à réexaminer ; `banques-09` oppose deux formes de tranquillité financière défendables ; `bourse-17` demande les contre-arguments à une opinion assumée. Un brouillon enregistré par l’utilisateur reste prioritaire, même si le texte proposé par la banque a changé.

Les 120 nouvelles questions sont rédigées individuellement. Les mécanismes encore peu présents ont reçu des angles propres : cadeaux entre amis et seuil de réciprocité, réunions tardives au tribunal, coût du trajet, vaisselle d’un premier logement, après-vente, service bancaire et confort quotidien. Aucun texte n’est assemblé à l’exécution à partir d’un produit cartésien. Les sujets ont entre 30 et 39 questions ; les mécaniques ont des effectifs différents. La même question ne figure pas plusieurs fois sous plusieurs étiquettes.

Une mécanique principale décrit la consigne réelle du texte. Les « retours du futur » se placent explicitement dans une année future et regardent 2026 avec recul ; ils se distinguent des alternatives imaginées dans « Le grand remplacement ». Les seuils sont demandés comme des choix personnels, sans seuil universel prétendument mesuré. Les procès demandent une défense avant le verdict. Les duels et allocations à budget identique proposent des avantages et des renoncements dans les deux camps.

## Relecture des proximités

Après contrôle des doublons exacts, les paires les plus proches lexicalement ont été relues. Les ressemblances liées aux consignes courtes ne suffisent pas à condamner un angle distinct. Les comparaisons abonnements/téléphone, équipements de maison/confort immobilier et économie personnelle/jugement social ont des enjeux et des réponses possibles différents. La consigne de `budget-02` a été réécrite pour éviter la répétition « critique les deux autres » ; l’alternative aux émissions boursières a été reformulée pour se distinguer du remplacement d’une carte premium.

La relecture a aussi porté sur les prémisses : aucun classement de marque n’est présenté comme un fait, aucun comportement malhonnête n’est attribué à une entreprise, aucun chiffre de marché n’est allégué. Les montants de « Même budget, deux vies » sont des budgets de scénario ; les horizons futurs restent conditionnels. Les thèmes impôts, prestations sociales et aides au logement restent exclus.

## Sélection « Ça va débattre »

47 questions choisies manuellement après lecture, sur les 8 sujets et 19 mécaniques. Le champ `debate` est édité explicitement dans les données, sans note, seuil de popularité ni classement automatique. Le libellé ne promet aucune viralité.

La sélection privilégie des renoncements compréhensibles immédiatement : louer plutôt qu’acheter (`immobilier-01`), temps contre salaire (`travail-01`), mariage contre confort (`budget-05`), désaccord entre amis (`societe-21`), et marques choisies sur la durée (`marques-02`). Les nouveaux choix couvrent notamment contre-arguments, procès, seuils personnels, allocation d’un budget, intérêts des parties et remplacement futur. Les contraintes ne donnent pas d’avance un vainqueur évident.

## Conservation et vérification

La clé `el-hey-grok-v1` et la forme `{ favorites, used, drafts }` restent inchangées. Aucune migration destructive n’est nécessaire. Les tests chargent un enregistrement v1, vérifient les 160 anciens identifiants, son absence de réécriture au chargement et la conservation d’un brouillon rattaché à une question remaniée.

Le contrôle avant build impose au moins 240 textes, 20 questions par sujet, 10 par mécanique, trois sujets par mécanique, 65 % tout public, ainsi que les minima de la sélection éditoriale. Chaque texte passe par `twitter-text` et doit rester valide et sous 280 caractères pondérés. Les tests vérifient aussi les intersections des deux axes, des indicateurs et des usages locaux, y compris les sélections vides. Cette validation automatique complète la relecture ; elle ne mesure pas l’intérêt d’un texte.
