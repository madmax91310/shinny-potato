# Reprise SCPI : refus structuré et contrat immuable

La revue de #1349 a identifié deux écarts : une panne source pouvait coexister
avec un refus d'entrées périmées et autoriser une recollecte ; la liste des
fichiers protégés omettait des validateurs et leurs dépendances.

Le garde commun conserve son comportement par défaut. Sur demande explicite
de l'enregistreur SCPI, seul son refus d'entrées périmées produit un reçu JSON
avec code de sortie 75, nonce propre à l'appel, famille, base, amont et chemins
refusés. Le texte des logs n'autorise aucune reprise. Un reçu absent, invalide,
d'une autre tentative, famille ou base est refusé.

Un rapport comportant une erreur source, financière, de provenance, une anomalie
de contrat ou une erreur hors périmètre interdit la recollecte même si le garde
a réellement refusé les entrées. La publication partielle ordinaire reste
possible via l'enregistreur existant : les anciennes observations et dates
sont conservées pour les sources en échec, qui restent explicitement signalées.
Une recollecte partielle peut être enregistrée mais ne déclenche pas une autre
recollecte si elle rencontre ensuite une nouvelle course.

La protection du contrat est volontairement conservatrice : tout changement
dans scripts/ (y compris fixtures et nouveaux helpers), .github/, les modules
JavaScript src/, src/lib/, src/design-system/, la politique de fraîcheur,
package.json, package-lock.json ou vite.config.js exige un workflow ordinaire
sur le nouveau master. Cela peut aussi bloquer une modification indépendante
d'un test Budget : un refus est préférable à la réutilisation d'un ancien
environnement sous un contrat changé. Les modifications indépendantes de prose,
de données JSON et d'interface non protégées sont recollectées et revalidées.

Avant chaque validation de l'enregistreur, une entrée figée dans le checkout
initial contrôle également ce contrat sur l'arbre effectivement rebasé. Ainsi,
un garde modifié concurremment pour tout accepter ne peut pas s'approuver lui-même.

Le budget reste de trois appels à l'enregistreur, soit deux recollectes avec
délais de 2 et 4 secondes. Sa boucle interne de push reste distincte. Le délai
global passe à 40 minutes pour couvrir les acquisitions et validations complètes.
Aucun force-push, fusion de conflit financier ou changement des seuils.

Les exceptions et KeyboardInterrupt enregistrent l'état de la tentative ; tous
les worktrees sont proposés au nettoyage même si une suppression échoue.
Les erreurs de nettoyage sont archivées sans masquer la panne initiale. Un
arrêt brutal du runner ne permet pas de garantir l'exécution de finally.

Les régressions utilisent Git, le garde et l'enregistreur réels avec une source
et un validateur contrôlés. Elles ne prouvent pas une reprise fournisseur en
production. Les validations GitHub, le déploiement et la prochaine collecte
programmée doivent être vérifiés séparément.
