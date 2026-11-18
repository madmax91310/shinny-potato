# Synthèses investisseurs allégées — 18 novembre 2026

Départ sur master `f7de1cee`, puis intégration des PR concurrentes #1384 et #1385 avant compilation finale. Le site servait encore le code #1380 (`5bca0be7`) avec des données plus récentes. Les cinq PNG publics puis les cinq PNG de master ont été réellement téléchargés et ouverts avant modification. Aucune nouvelle capture jointe n’a été retrouvée dans les fichiers accessibles ; aucune comparaison avec cette pièce jointe n’est revendiquée.

## Composition

La synthèse conserve le format 1080×1350, le gris clair, Inter, le grand titre vert, la période réelle, le donut épais et proportionnel, le portrait et les pastilles contrastées. Les noms passent de 36 à 40 px. Le budget de densité dépend de la largeur mesurée des noms et de l’espace autour des pastilles ; il ne limite ni les données ni les exports. La mise en page peut retenir moins de noms lorsque la lisibilité l’exige.

« Principales positions », montants individuels, badges centraux de couverture, mentions d’illustration, compteur après « Autres » et pagination de la synthèse sont retirés. Les associations reposent sur les couleurs distinctes et les noms proches des pastilles ; les rares traits nécessaires sont droits, discrets et limités à 66 px. Aucun trait coudé ni petit logo extérieur n’est ajouté. Le pied comporte valeur déclarée et signature, avec une seule ligne de crédit lorsque nécessaire.

Le nom exact de l’entité reste le titre. L’association historique de la personne photographiée, les sources et le périmètre déclaré restent dans l’interface, le JSON et les métadonnées du PNG. Les valeurs, la couverture et le nombre exact de positions connues regroupées restent consultables. Les compléments conservent montants, couverture des douze premières, titres et navigation ; leur point de départ suit exactement la sélection de la synthèse. L’archive exhaustive reste distincte.

| Profil | Noms avant → après | Autres avant → après | Montants individuels avant → après |
| --- | --- | --- | --- |
| Berkshire | 13 → 8 | 4,78 % → 17,34 % | 4 → 0 |
| Tepper | 15 → 10 | 8,30 % → 19,59 % | 6 → 0 |
| Gates | 12 → 8 | 4,40 % → 9,45 % | 4 → 0 |
| Cathie Wood | 8 → 8 | 65,99 % → 65,99 % | 3 → 0 |
| Renaissance | 7 → 7 | 90,52 % → 90,52 % | 2 → 0 |

Les poids ci-dessus sont calculés depuis les valeurs entières et le total admissible complet, puis arrondis pour ce tableau. Chaque angle reste proportionnel au poids réel. Les positions sont sélectionnées par valeur décroissante ; le solde comprend exactement les positions restantes, sans fusion de classes ni renormalisation. Les données financières, options, qualifications et blocages Druckenmiller/Klarman ne sont pas modifiés.

## Crédits

Les photographies et leurs sources établies sont réutilisées sans changement. Les conditions CC BY 2.0, CC BY/SA 3.0 et CC BY/SA 4.0 prévoient une attribution adaptée au support : [CC BY 2.0, §4](https://creativecommons.org/licenses/by/2.0/legalcode), [CC BY-SA 3.0, §4](https://creativecommons.org/licenses/by-sa/3.0/legalcode), [CC BY 4.0, §3](https://creativecommons.org/licenses/by/4.0/legalcode.en), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en). La ligne visible auteur/licence est conservée pour les photos CC BY, à 28 px ; le crédit Gates est composé en « Commission européenne / Lukasz Kobus ». L’auteur intégral, le titre, les liens source/licence, le détourage et l’empreinte d’origine restent dans chaque PNG autonome et dans le JSON. Les médias CC0/domaine public n’ajoutent pas de ligne obligatoire. Aucun crédit requis n’est supprimé au profit d’un support facultatif.

## Recette

Compilation complète réussie, budget inchangé : 724,8/725 kB. Tests de calcul et de mise en page, 30 rendus valides et deux refus financiers ; vérification des bornes, collisions et annotations interdites. Sur la compilation finale : 56 parcours réels ordinateur/mobile, 134 PNG de publication, aperçu et deux téléchargements identiques, navigation et ZIP ; 56 contrôles copie/JSON/CSV, conservation des données lors d’un 503, réessai Canvas, historique et médias absents. Vérification indépendante des valeurs, dénominateurs, regroupements et CRC des ZIP des 28 profils. Archive Renaissance : 3151 lignes, 526 PNG, CRC valide. Les huit allocations modèles du moteur commun restent identiques octet pour octet.

Les cinq PNG finaux ont été ouverts en natif et à 390 px. Les 26 synthèses admissibles ont été balayées sur planches, puis les compléments Renaissance et Berkshire ouverts individuellement. Les 26 PNG de synthèse téléchargés depuis la compilation sont identiques à ceux du rendu instrumenté. Preuves : `reports/investor-simple-summary-2026-11-18/` (avant/après, fichiers PNG, planches, métadonnées et contrôles indépendants).

Le premier portail CI a détecté un champ historique `verdict` manquant dans la nouvelle fiche Vanguard de #1384. Ce seul champ est complété par la première phrase déjà présente dans son intérêt éditorial, sans nouvelle donnée. Le texte publié, les faits et le PNG de cette fiche restent identiques : `vanguard-contract-compatibility.json` en conserve la preuve. Le contrôle n’est pas affaibli. L’alerte séparée de collecte anniversaire conserve ses deux échecs de source et ses dernières observations validées.

Les contrôles CI, la fusion et la version réellement servie seront consignés dans la PR après constat. Les rendus des autres outils, les données financières, les collecteurs et les budgets restent inchangés. Aucune publication sur X.
