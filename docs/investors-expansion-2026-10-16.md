# Extension 13F du 16 octobre 2026

Le catalogue passe de 22 à 28 profils, sans modifier les modèles de texte ou d’image.

| Profil | Déclarant raccordé | Usage éditorial |
|---|---|---|
| Mason Morfit | ValueAct Capital Management LP | Gestion engagée auprès des entreprises |
| Pat Dorsey | Dorsey Asset Management LLC | Avantages concurrentiels, portefeuille concentré |
| Robert Vinall | RV Capital GmbH | Approche de propriétaire à long terme |
| Howard Marks | Oaktree Capital Management LP | Périmètre coté d’un gestionnaire connu pour le crédit |
| Prem Watsa | Fairfax Financial Holdings Ltd | Placements d’un groupe d’assurance |
| Gavin Baker | Atreides Management LP | Gestion actions après une carrière chez Fidelity |

Les relevés initiaux proviennent de l’API publique FolioFact, trimestre clos le 30 juin 2026. Le collecteur existant vérifie toutes les pages, le total déclaré, les doublons, les dates et les types de position avant écriture. Les options conservent leur poids dans le dénominateur mais sont exclues des actions présentées. Les profils sont ajoutés au registre de collecte quotidienne et à ses tests de correspondance avec l’interface. L’historique sera archivé lors d’un changement de trimestre ; aucun passé n’est reconstitué.

Les biographies citent les pages institutionnelles dans `src/data/investor-profiles.js`. Les portraits et leurs crédits figurent dans `public/asset-art/investors/sources.json`. Le cadrage de Vinall sélectionne la personne à gauche sur la photographie de RV Capital. Le portrait de Watsa est sous CC BY 3.0 ; les autres proviennent des institutions ou éditeurs crédités et ne sont pas présentés comme des images sous licence libre.

Le 13F décrit les positions déclarées de l’entité : ni patrimoine personnel, ni portefeuille mondial complet, ni totalité du crédit d’Oaktree. Les mouvements sont ceux des quantités déclarées. Aucune performance du gestionnaire n’est déduite des montants du relevé.

Validation : tests du collecteur, audit des 28 profils et compilation locale ; tests navigateur des 28 exports et collecte réelle complète dans les contrôles de la PR avant fusion.
