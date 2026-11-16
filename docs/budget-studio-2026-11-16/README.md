# Budget de… — préparation et publication manuelles

## État requalifié

Départ : 99 profils sur master `5f06f3e`, puis intégration du master courant avant PR. Les références historiques à 70 profils ne décrivent plus la banque. Les PR concurrentes consultées concernent les portefeuilles, les collecteurs et les données ; aucun travail Budget n’a été remplacé. Le public a été ouvert dans Chromium à 390 px et son PNG téléchargé avant modification (code observé `f9a212db5b2ee4702e925441cf12c59cf6c80f10`, données `4266a36fa589d52a3a116bddeafcb9868e836ce3`).

Les statuts de publication appartiennent au stockage du navigateur. Ils ne sont pas une propriété globale de la banque : aucun export du navigateur personnel de l’utilisateur n’a été fourni. La vérification porte sur leur conservation, leur migration et leur indépendance, pas sur une prétendue liste publique des profils déjà publiés.

## Livraison

- Duplication vers un nouvel identifiant : lignes visibles conservées, questions manuelles d’une participation conservées, texte personnalisé copié exactement. Depuis la banque, le nouveau modèle garde ses lignes mais pas son récit ni ses questions ; les anciennes couches éditoriales cachées ne sont pas héritées. Les statuts ne sont jamais copiés.
- Dépenses courantes suggérées facultativement, sans montant proposé, ajout/retrait et déplacement de lignes. Maximum existant de 24 lignes par section inchangé.
- Saisie annuelle : montant annuel distinct, provision mensuelle en centimes, arrondi résiduel affiché. Le texte et tous les rendus utilisent le montant mensuel. Une provision saisie annuellement reste identifiable en synthèse. Les anciennes provisions `annualAmount`/`periodicity` gardent leur fonctionnement.
- File ordonnée, dates prévues facultatives, suggestions renouvelables et déterministes ; exclus des nouvelles suggestions : profils publiés et déjà en file. Les classes de revenus restent propres à chaque devise. La date prévue est indépendante de la date de publication déclarée.
- Relecture du texte exact, des totaux et de l’image sélectionnée. Indications de couverture non bloquantes : ligne présente, enveloppe documentée, provision, prise en charge établie ou périmètre à préciser. Une catégorie vague ne prouve pas la couverture de toutes ses dépenses ; une assurance auto ne prouve pas la couverture santé. Les inconnues ne sont ni des zéros ni des dépenses ajoutées automatiquement.
- Dossier ZIP : `publication.txt` contient le texte courant exact et `image-NN.png` toutes les pages du format choisi. Même jeu de canvases que l’aperçu ; aucun deuxième moteur. Rejet si le profil, le texte ou le format change pendant la préparation. Un texte personnalisé aux anciens chiffres bloque ce dossier jusqu’à vérification explicite ou régénération volontaire. Les actions séparées de copie et PNG restent accessibles.
- Recette publique durable après Pages : `.github/workflows/budget-public-recipe.yml`. Lecture du vrai `build-info.json`, vérification de l’ascendance du code servi, checkout de ce code, UI réelle à 1440/390/320, copie, sauvegarde, file, PNG et ZIP réellement téléchargés. Relecture finale des SHA : un changement de code pendant la recette échoue ; une collecte peut légitimement faire avancer `dataSha`. Un ancien code ne contenant pas cette recette est explicitement signalé comme non couvert, jamais certifié comme validant les nouvelles fonctions.

## Données et audit

99 profils existants : récits et questions relus ; leurs textes réussis et toutes leurs lignes financières sont conservés. Les points historiques (installation de Thomas, marge d’Aïcha, part personnelle de Pauline, provision de Michel, PEL de Guillaume à 45 €) sont déjà corrigés et n’ont pas été réécrits. Aucun nouveau problème chiffré démontré ne justifie de modifier leurs montants.

Deux admissions après examen de huit pistes, sans quota :

| Profil | Situation | Ressources | Dépenses | Versements | Solde |
|---|---|---:|---:|---:|---:|
| Maël, 22 ans | Alternance, mobile et assurance auto payés par les parents, choix livret/PEA/CTO | 1 170 € | 730 € | 400 € déclarés | 40 € |
| David, 25 ans | Alternance, déménagement envisagé, faible réserve liquide, remboursement étudiant à venir | 1 750 € | 1 190 € | 300 € préparés | 260 € |

Sources réellement consultées : fils Reddit et réponses attribuables aux auteurs, respectivement avril et octobre 2026. Pas de revenu, aide, patrimoine, dette nouvelle ou rendement inventé. Dépenses ajoutées : 230 € pour Maël et 740 € pour David. Les aides 220 € restent groupées, les courses/carburant de 250 € ne sont pas doublés. Chez David, 700 € est un plafond de futur loyer, pas le loyer actuel de 450 € ; remplacer l’un par l’autre réduirait la marge à 10 € avant le futur remboursement non chiffré. Pays, enfants et encours non établis restent inconnus.

Les faits, réponses, dates, limites d’accès, créations, justifications et origines des questions sont séparés dans `editorial-profiles-studio-2026-11-16.json` et consultables dans le panneau de vérification. Maël : interrogation source reformulée ; David : deux questions éditoriales liées au déménagement. `candidates.json` donne les deux retenus, le doublon et les reports/rejets précis ; les pistes retraitées trop ambiguës ne deviennent pas artificiellement des budgets de foyer.

`financial-before.json` protège les 99 références financières et les textes avant intervention. `node scripts/audit-budget-studio.mjs` recalcule indépendamment avec des centimes décimaux et BigInt, contrôle les pourcentages et les regroupements, puis écrit l’audit par profil et tous les textes dans `test-artifacts/budget-studio-audit/`. La banque passe à 101 profils ; les 12 déficits restent présents. Cela ne signifie pas que toutes les inconnues essentielles sont résolues.

## Stockage

Espace et sauvegardes version 5, même clé atomique. Les versions 2/3/4 restent importables. La lecture d’un ancien espace ne modifie pas ses octets ; le premier enregistrement valide ajoute seulement les nouvelles dates prévues, initialement absentes. Aucun ancien publié ne reçoit de date inventée. Les anciennes pages v4 refusent un espace v5 plutôt que d’en effacer les nouveaux champs.

Les dates prévues et inversions de l’ordre commun font partie des conflits d’import. Choix explicite entre local et fichier, aperçu des positions et dates, conservation des profils absents du fichier, archivage des octets remplacés et des brouillons en mémoire. Comparaison de l’état lu avant écriture entre onglets, stockage illisible et quota conservent leurs protections. Ce transfert reste manuel, sans synchronisation automatique.

## Validation et limites

Les preuves locales sont conservées dans `test-artifacts/budget-*` et les journaux `/tmp/budget-studio/`. Les reçus navigateur des nouvelles admissions enregistrent chaque PNG téléchargé : 60 fichiers aux trois largeurs, dimensions 1080×1350, données textuelles complètes, bornes et absence de chevauchements. Les 20 rendus à 390 px des deux admissions ont été inspectés visuellement (principale, X, détaillée, synthétique, y compris toutes leurs pages). Les principales tiennent chacune sur une image ; les autres formats gardent les pages de patrimoine/projets existantes. Pas de refonte graphique ni d’export long de secours.

Les tests unitaires couvrent notamment arrondi annuel, regroupements, identité et texte des copies, absence d’héritage éditorial, questions manuelles, sélection sans conversion, file et dates, import et ordre, migration, corruption, concurrence et conservation des personnalisations. La recette studio vérifie aussi que la page 2 sélectionnée correspond au deuxième PNG d’un ZIP de trois pages.

La compilation et les contrôles du dépôt sont exécutés avec les seuils existants. Les fonctions de transfert ont été isolées du code chargé initialement : la route reste sous 721 000 octets de code sans relever le plafond. Les tests historiques continuent de couvrir tous les anciens profils, les trois largeurs, les profils denses et les déficits en CI.

Les sources sont des déclarations publiques, pas une certification indépendante des revenus. Les deux budgets préparés ont une provenance transparente dans l’application ; aucune mention de fabrication n’est ajoutée aux exports et aucun témoignage reçu n’est inventé. Certaines couvertures restent à préciser, en particulier les frais non déclarés des études, les charges exactes des logements et la couverture santé. Aucun message n’est publié sur X.

## Intégration des travaux concurrents et identité publique

Pendant la validation, master a reçu #1362 pour le calendrier puis le correctif `0139168` réduisant son poids. Ce correctif est repris tel quel. L’extraction temporaire du calendrier et son garde de publication devenus inutiles sont retirés : aucun fichier calendrier ni logique d’un autre outil ne diffère du master intégré dans le périmètre final.

Le mécanisme Pages a été relu : le build ordinaire peut exposer seulement `sha` et `builtAt` ; `dataSha` et `lane` sont ajoutés lors d’une composition avec des données plus récentes. La recette accepte cette absence légitime, conserve les métadonnées reçues et la signale comme `not-advertised` dans son reçu. Elle ne fabrique pas un `dataSha` égal au SHA du code. Si un `dataSha` est annoncé, il doit être valide et il est consigné tel quel.
