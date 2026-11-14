# Profils d’abonnés — 14 novembre 2026

## Utilisation

Dans `/le-budget-de`, ouvrir **Mes profils d’abonnés**, puis **Nouveau profil d’abonné**. Le bouton **Créer un profil d’abonné** dans le compositeur ouvre le même parcours. Les profils enregistrés se retrouvent dans la section dédiée, avec leurs identifiants de participation stables. **Adapter ce budget** reste disponible pour partir d’un budget existant.

Renseigner le prénom, les lignes de revenus et de dépenses, puis éventuellement les versements dans **Épargne et projets**. Chaque rubrique permet d’ajouter ou de retirer des lignes, jusqu’à 24 par rubrique. Une ligne incomplète bloque la copie et le PNG plutôt que d’exporter un ancien aperçu. Les nouvelles lignes sont vierges : aucun salaire après impôt, loyer ou question n’est supposé.

Le texte automatique utilise les mêmes lignes et calculs en centimes que les deux images. Saisir les questions dans **Questions pour les lecteurs**, une par ligne : elles sont ajoutées au texte, jamais inventées par le générateur ni inscrites sur l’image. Une question vide reste vide. Les questions restent présentes quand les montants changent.

Une modification directe du texte conserve le mode personnalisé et empêche son remplacement automatique. **Rétablir le texte** revient volontairement au texte généré à partir des lignes, en conservant les questions saisies dans le profil. L’avertissement de montants anciens reste actif pour les textes personnalisés.

Les profils sont enregistrés dans ce navigateur. Le panneau **Brouillons et transfert entre appareils** permet leur export/restauration manuelle, avec leurs questions, personnalisations et statuts datés. Il ne s’agit pas d’une synchronisation automatique. Aucun changement de format de sauvegarde (version 4), de migration, de contrôle de stockage ni de statut de publication. La validation des informations par la personne reste indépendante de la déclaration de publication.

## Périmètre

La banque conserve ses 70 profils. Aucun montant ou texte de la banque n’est modifié par cette fonctionnalité. La correction Guillaume de #1272, fusionnée pendant l’intervention, est conservée. Le modèle d’image n° 3, ses regroupements synthétiques et son moteur de hauteur dynamique sont réutilisés sans refonte.

La liste dédiée et l’éditeur sont chargés à la demande ; le seuil de taille de la route reste inchangé.

## Vérifications

- `npm run test:budget` : calculs indépendants EUR/CHF, ajout/retrait, questions manuelles, limites de lignes, personnalisation, sauvegardes et conflits ; suites de migration existantes.
- `npm run build` : contrôles préalables du dépôt, compilation, budgets des routes et manifeste publié, sans augmentation des seuils.
- `scripts/playwright-budget-subscribers.mjs` : création de deux profils, reprise après rechargement, changement de lignes, questions, texte personnalisé, régénération, statut daté, export/import avec conflits et stockage corrompu ; 1440, 390 et 320 px.
- Les tests navigateur comparent les octets du PNG téléchargé avec l’aperçu sélectionné, le texte copié avec le texte généré, et contrôlent les libellés, totaux et limites de chaque mode. Cas de 72 lignes, nom et libellés longs, CHF et déficit.
- Les suites navigateur de portabilité et de complétude existantes couvrent les protections de stockage, anciens brouillons, statuts et alertes de chiffres anciens.

Les captures et PNG natifs de la recette locale sont conservés dans `test-artifacts/budget-subscribers/` (hors dépôt). L’inspection visuelle et la vérification publique sont consignées au compte rendu de livraison.
