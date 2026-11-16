# Compléments investisseurs — 16 novembre 2026

Branche `codex/investor-completion`, worktree dédié, base `8895d8e`. Les PR ouvertes ont été examinées ; aucun autre chantier investisseurs n’était ouvert. Aucun collecteur parallèle ni nouvelle application.

## Sources et chiffres

Fundsmith est désormais générable à partir de la table SEC complète : 41 titres/classes, 13 648 923 682 USD, au 30 juin 2026. Le CIK du dossier et celui de la déclaration signée concordent ; le nom légal correspond à l’entité attendue. La somme des lignes, le total de couverture et le nombre de lignes sont contrôlés. Le fournisseur affiche 18 167 841 425 USD : cet écart reste dans les métadonnées et est signalé dans l’application, le PNG, le post et les exports. Aucune valeur fournisseur ne comble, ne redimensionne ni ne remplace une ligne SEC. Ce choix explicite de source primaire ne signifie pas que le fournisseur a corrigé son flux.

Druckenmiller et Klarman restent bloqués. Les tableaux et couvertures SEC consultés, leur version HTML et le flux fournisseur présentent toujours un conflit d’un facteur 1 000. Les formulaires affichent une convention en dollars ; aucune preuve ne permet une conversion arbitraire. Leurs fichiers antérieurs sont conservés. Les conflits d’unités possibles restent bloquants, même si le tableau se réconcilie avec sa propre couverture.

Collecte réelle : 26 déclarations qualifiées, 2 refus. Calculs indépendants en Decimal : sous-lignes, identités/classes, valeurs, poids et « Autres ». Les plans des 28 gestionnaires sont inchangés ; le collecteur requalifié ne lit toujours aucun des chemins indépendants autorisés par le garde-fou.

## Médias

Quatre portraits photographiques réutilisables ajoutés : Howard Marks, Brad Gerstner, Carl Icahn et Christopher Hohn. Association personne/fichier revue et épinglée, vérifiée contre Wikidata P18 ; licence, auteur, provenance et empreinte Commons conservés. Originaux et détourages sont mis en cache ; ETag pour les métadonnées et téléchargement de l’original seulement si son empreinte change. Le cadrage de Gerstner retire une seconde personne et est lié à l’empreinte de la photo. Une modification d’identité/licence entraîne les initiales ; une panne réseau peut conserver le dernier portrait vérifié. Aucune photo ressemblante inventée.

L’examen a écarté des homonymes et un dessin présenté dans une association P18 de Pabrai ; le portrait « Terry Smith MNZM » n’a pas été attribué au fondateur de Fundsmith. Les sources sans droits/identité suffisants restent aux initiales. Le catalogue comporte 10 détourages prêts, dont celui de Klarman inutilisé tant que ses montants ne sont pas qualifiés.

Sept logos ajoutés au registre partagé : Berkshire Hathaway, Marriott International, Stryker Corporation, Elevance Health, Genuine Parts, Restaurant Brands International et Uber. Identités par CUSIP/ISIN, provenance et empreintes conservées. Le logiciel homonyme Stryker n’a pas été utilisé. Les classes Berkshire restent distinctes. Les mots des logos très larges peuvent être répartis sur deux lignes à un espace transparent, sans couper de lettre ni déformer le tracé. Le cadre optique d’Uber est resserré sans changer son dessin.

## Reprise après concurrence

Le workflow existant appelle toujours le même enregistreur isolé et le même garde-fou. Si l’écriture est refusée et que master a évolué, la collecte, les médias et la validation sont refaits depuis master dans un worktree temporaire. Trois tentatives maximum ; pas de force-push, pas d’élargissement des exemptions financières, pas de résolution automatique de conflit de données. Une erreur financière sans évolution de master ne déclenche pas de nouvelle tentative. Les sorties et le signal d’échec partiel viennent de la dernière acquisition validée. Les rapports de tentative restent archivés.

Le job dispose de 45 minutes pour les reprises ; chaque acquisition conserve sa fenêtre de validation de 30 minutes. Les autres automatisations et la file de publication sont conservées.

## Validation avant PR

- 49 tests Python, dont une vraie course Git avec un autre écrivain DCA, refus initial, recollecte contrôlée dans un checkout neuf, validation et enregistrement sans écrasement.
- 20 contrats de workflows ; enregistreur commun et périmètre de sortie maintenus.
- Build complet réussi, 54 fichiers publics vérifiés ; route investisseurs 723,5/725 kB, sans relever le budget.
- 30 PNG : 26 réels et 4 synthétiques. Bornes et collisions, noms longs, petites parts, médias absents, dernier relevé conservé, copie et téléchargement à 1440/390, erreurs et réessais.
- Exports complets Renaissance : 3 151 lignes et 485 PNG ; calculs indépendants sur les 26 relevés qualifiés.
- Registre partagé : 203 sociétés / 560 apparitions, contrôle des empreintes réussi ; vérifications du consommateur des fiches d’indices exécutées.

Exemples : [Fundsmith](../reports/investor-completion-2026-11-16/terry-smith.png), [Gerstner](../reports/investor-completion-2026-11-16/gerstner.png), [Hohn](../reports/investor-completion-2026-11-16/hohn.png), [Tepper](../reports/investor-completion-2026-11-16/tepper.png). La publication et le parcours public seront consignés dans la PR après vérification. Aucune publication sur X.
