# Portefeuilles déclarés : composition autour du donut

## Référence et périmètre

La référence Buffett jointe à la demande a été réellement examinée : fond gris uni, nom vert très gras, deuxième ligne noire, anneau dominant, portrait détouré débordant dans l’anneau, logos dans les secteurs, pourcentages circulaires et libellés autour du cercle. Les chiffres du modèle ne sont pas repris.

La branche dédiée `codex/investor-orbit` part de master 8dc5403 et intègre les actualisations concurrentes de master. La fusion eebf3f8 de #1348 et la livraison da07e8b annoncées ont été vérifiées. Les PNG « avant » ont été réellement téléchargés sur le site public ; leur build-info indique f45c20c2852644e10bc16df6437e6bc403dfc13f, avec données 4266a36fa589d52a3a116bddeafcb9868e836ce3. L’ancien rendu est toujours celui à deux colonnes, sans portrait Berkshire et avec petits ovales. La PR concurrente #1356 a été fusionnée sur master pendant la validation. La refonte intègre cette fusion : les deux blocs de tests sont conservés, ainsi que le téléchargement Blob commun aux deux boutons et à l’aperçu, le cache de rendu avec réessai, la pagination par position complète et la devise/unité d’« Autres ».

Aucun relevé financier, collecteur 13F, calcul de qualification, sélection utilisateur ou sauvegarde n’est modifié. Les modèles d’allocation conservent leur autre rendu.

## Composition livrée

Le PNG et l’aperçu utilisent exactement la même image Canvas 1080 × 1350. La police locale Inter est attendue avant le dessin, avec les portraits et logos. Fond #d7d7d7, titre sans empattement très gras, nom vert, ligne « Portefeuille · Tn AAAA » issue de la date réelle, anneau de 760 px de diamètre et 195 px d’épaisseur. Les textes des positions font 36 px et les montants 34 px. La couleur des libellés atteint un contraste de 4,54:1 sur le fond ; les chiffres des pastilles choisissent une encre claire ou sombre selon leur fond.

Les angles viennent des valeurs entières non arrondies et du total de toutes les positions admissibles. Les cercles de pourcentage ont tous le même rayon de 50 px ; leurs positions peuvent s’écarter légèrement des médianes des secteurs pour éviter les collisions, avec une petite liaison vers la part. La taille des cercles ne code pas une seconde quantité.

Le moteur essaie les compositions en fonction du périmètre disponible et des mesures de la police, sans plafond de huit positions. Les cartouches blancs et les colonnes fixes disparaissent. Les noms sont répartis radialement, sans coupure arbitraire des mots ; les classes restent distinctes. Les traits extérieurs contournent les noms, les autres pastilles et les logos extérieurs ; aucun trait ambigu n’est forcé. Les logos gardent leur ratio et leur disposition d’origine. Les variantes monochromes reçoivent une encre lisible, sans carte blanche systématique. Aucune lettre de remplacement M/C/OP n’est dessinée.

Berkshire présente neuf lignes nommées et « Autres » ; Tepper dix lignes nommées et « Autres ». Les montants et poids du solde restent exacts, sans renormalisation des seules lignes montrées. Les détails JSON, CSV et PNG paginés conservent toutes les positions, classes et options du relevé. Le texte copiable partage exactement la sélection de l’image et reste classé par poids décroissant, avec un seul CTA.

Le pied comporte seulement la valeur déclarée, l’éventuel crédit photo obligatoire et « Épargnant libre ». Les sources, avertissements et méthodes restent dans l’application et les exports. La valeur n’est jamais appelée AUM ou patrimoine personnel. L’historique et les outils d’export détaillé sont chargés à leur ouverture ; le budget de route reste inchangé à 725 kB.

## Portraits et logos

Le portrait Buffett préexistant provient du SelectUSA Investment Summit 2015, photographie gouvernementale dans le domaine public. Le lien historique à Berkshire est documenté par la lettre officielle du 22 février 2025, signée Warren E. Buffett, Chairman of the Board. L’image titre explicitement « Berkshire Hathaway » : elle ne prétend ni montrer son patrimoine personnel ni établir qu’il gère les positions à la date du relevé 2026. La note historique reste visible dans l’interface et les crédits exportés. L’exception est limitée à ce profil et vérifie l’identité et la provenance ; elle ne donne pas automatiquement la photo d’un fondateur aux autres entités.

Le détourage automatique utilise le cache existant, avec empreinte du fichier et des métadonnées. Pour Ackman, un masque de sujet vérifié retire les deux personnes en arrière-plan de la source existante ; aucune partie du visage n’est volontairement supprimée. Ce masque est conservé avec la source et réutilisé, sans retouche récurrente.

Moody’s, Chubb Limited, Occidental, Vistra Corp et iShares rejoignent le registre de logos existant, avec alias explicites et identifiants vérifiés. Une variante compacte Google est rattachée à Alphabet seulement pour cet outil, et le symbole Meta complet est extrait du SVG officiel existant pour tenir dans les parts étroites ; les classes Alphabet restent distinctes et les autres outils gardent leur logo par défaut. Chaque nouvel SVG possède sa provenance, sa licence et son empreinte contrôlée.

## Validation locale

- Compilation complète `npm run build` réussie, puis compilation finale Vite et audit des budgets après les corrections visuelles : investisseurs 724,9/725 kB de code, sans relever le seuil.
- Tests purs : proportions, valeurs, somme des poids, regroupement exact, invalidation du cache, 300 et 1 501 petites lignes, classes, noms longs, moins de 0,1 %, actifs et empreintes des nouveaux logos, régression d’un trait traversant le nom Chubb.
- Contrôle Decimal indépendant des 26 déclarations qualifiées et des sélections réellement rendues ; deux conflits d’unités conservés.
- 30 PNG contrôlés par le navigateur : 26 profils réels et quatre cas synthétiques ; bornes et collisions du texte, téléchargement, copie, JSON/CSV/ZIP, panne de source, réessai de génération et repli sans médias. Le ZIP Renaissance conserve les 3 151 positions, réparties sur 526 images détaillées.
- Recette des 28 profils à 1440 et 390 px : 52 PNG téléchargés, rouverts, dimensions exactes, identité des octets avec l’aperçu et entre les deux largeurs ; quatre états incomplets attendus sur les deux largeurs.
- Parcours réel sur la compilation locale : Tepper, PNG, copie, JSON, CSV, ZIP, réessai, conservation du dernier relevé lors d’un HTTP 503, repli sans photo/logo, police chargée et ouverture de l’historique. Portraits vérifiés peints pour Berkshire, Marks, Gerstner, Icahn et Hohn ; avertissement Fundsmith conservé dans le texte et le JSON.
- Navigateur Node 20.20.2 : 28 textes synchronisés, usage mobile et rejet des relevés incomplets.
- Six tests Python du cache et des licences ; audit des 28 profils ; lint ciblé sans avertissement.
- Registre partagé : empreintes et alias contrôlés ; 203 logos décodés et 178 rendus indices/variantes/devises contrôlés, y compris médias absents, corrompus, retardés et réessai.

Les PNG téléchargés ont été examinés visuellement à taille native pour Berkshire et Tepper et à 390 px pour tous les profils exploitables. Les planches de contrôle et les deux comparaisons sont dans [le dossier de preuves](../reports/investor-orbit-2026-11-16/). La compilation seule n’est pas considérée comme une validation graphique.

## Écarts et limites conservés

La composition se rapproche du modèle par la hiérarchie, la taille du donut, le portrait central, les logos directs, les pastilles rondes et le pied allégé. La photographie Buffett est une autre photo réutilisable, sans chapeau ni main levée ; le titre est celui de Berkshire pour rester exact. Les verts du texte sont un peu plus sombres que le modèle pour la lisibilité. Les crédits imposés par certaines photos restent en bas de l’image.

Dix profils exploitables disposent d’un portrait validé. Seize gardent un repli par nom : Morfit, Dorsey, Vinall, Gavin Baker, Einhorn, Halvorsen, Gayner, Loeb, Aschenbrenner, Li Lu, Gates Foundation Trust, Terry Smith, Pabrai, Baker Bros., Laffont et Renaissance. Aucun faux visage n’est généré. Les deux profils incomplets Druckenmiller/Klarman restent sans PNG monétaire. Les logos manquants par position présentée figurent dans `media-coverage.json` ; leur absence ne bloque pas le PNG et n’engendre pas d’initiales isolées.

Sur les portefeuilles extrêmement dispersés, « Autres » reste important : afficher toutes les petites lignes autour de ce cercle produirait une image illisible. Le détail intégral reste disponible dans les exports. Les cas synthétiques inférieurs à 0,1 % affichent une borne explicite, jamais un zéro trompeur.

La collecte existante est préservée ; cette recette ne prétend pas avoir attendu une nouvelle déclaration SEC et observé un cycle trimestriel entier. La récupération et la réutilisation des médias ont été exécutées, ainsi que les parcours à partir des données collectées. Le premier portail Pages a réussi ses 16 contrôles. Après intégration de #1356, le portail doit être rejoué sur la version combinée ; la fusion et les téléchargements publics doivent encore être vérifiés ; les résultats de livraison seront ajoutés à la description de celle-ci. Aucune publication sur X.
