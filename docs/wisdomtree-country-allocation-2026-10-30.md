# Pays WisdomTree : date propre et définition qualifiée

Suite du suivi consolidé après #1064 ; aucune convention de performance, position, image ou limite de couverture modifiée.

## Défaut reproduit et correction

Le lecteur attribuait à Country Allocation la date de Product Overview/NAV faute de date dans le titre de ce tableau. La capture réelle `scripts/fixtures/official-documents/wisdomtree-ie-usd-eur-20261023.html.gz` présente les pays Cloud 92,44 % États-Unis, 5,85 % Israël, 1,71 % Canada. Leurs lignes serveur sont datées du **15 octobre**, tandis que le lecteur utilisait le **22 octobre**. Ce dernier n'est pas une date de composition.

Le lecteur confronte maintenant le tableau affiché aux lignes pays du même document, pour la classe exacte, avec libellés, poids, date et définition. L'arrondi décimal à deux chiffres sert uniquement à identifier le tableau affiché, jamais à accepter une divergence financière entre sources. Une date non unique, un changement d'identité ou un flux incomplet produit une erreur individuelle `countries`, sans renouveler le pays conservé ni rejeter les autres champs valides. Aucun retour à la date NAV.

## Secours qualifiés individuellement pour six parts existantes

Deux photographies officielles indépendamment datées, 15 et 23 octobre, rattachent le tableau affiché à **Incorporated Country / ID 6**. Il ne s'agit pas de **Aggregate Country / ID 16**, dont les poids diffèrent.

La capture réelle du 29 octobre, conservée dans `scripts/fixtures/official-documents/wisdomtree-cloud-country-20261029.html.gz`, affiche 92,50 / 5,95 / 1,54 %. Ses lignes serveur du 23 octobre portent exactement **92,5013 / 5,9539 / 1,5448 %**. Elles correspondent sans ajustement aux lignes ID 6 de la réponse API réelle déjà conservée dans `scripts/fixtures/wisdomtree-complete/IE00BJGWQN72.rankings.json.gz`. Classe primaire 3104137, entité API 682577, WCLD LN, USD Acc ; le contrôle documentaire d'ISIN et de devise existant reste obligatoire.

La politique Cloud est inscrite dans le registre commun `wisdomtree-holdings-classes.json`. Le secours ordinaire réutilise la réponse déjà acquise pour top 10/secteurs et le PDF effectivement acquis dans la tentative ; aucune requête supplémentaire ni cache devenu contrôle source. Les pourcentages source sont conservés, sans normalisation. Les cinq autres parts ont ensuite chacune fait l'objet d'une acquisition primaire distincte, le 30 octobre : leur propre tableau affiché correspond uniquement à ID 6, et leurs propres lignes serveur sont exactement égales à leur propre réponse API au 23 octobre. Les captures natives et empreintes de chaque part sont conservées ; aucune admission par analogie. Frais, encours et autres champs ne reçoivent aucun contrôle emprunté.

Les observations déjà enregistrées ne sont pas réécrites rétroactivement. La protection contre une observation plus ancienne et la quarantaine des contradictions à date identique sont conservées. Une ancienne date mal attribuée peut donc nécessiter une preuve de migration distincte avant remplacement ; ce correctif ne la force pas.

## Vérification

Huit régressions dédiées utilisent les deux captures réelles et des mutations isolées : dates NAV/pays distinctes, correspondance primaire/API, définition distincte, mauvais ISIN/devise/classe, ligne absente, poids ou date invalide, ordre des lignes, panne partielle et conservation des autres champs. La huitième confronte séparément les cinq autres pages natives et refuse pour chacune la définition ID 16. Les anciennes suites Fund/Sector et sources émetteurs restent exécutées. Les tests ne constituent pas une preuve de fonctionnement fournisseur depuis GitHub. Collecte ordinaire, enregistrement et publication restent à vérifier après fusion.

Accès : route publique émetteur déjà employée par les collecteurs ; aucune licence de redistribution n'est déduite d'un HTTP réussi.

### Preuves complémentaires par part

| Part | Date pays | Pays publiés | Empreinte HTML primaire | Empreinte réponse API |
|---|---|---:|---|---|
| IE0002Y8CX98 | 2026-10-23 | 14 | `92fdcb0e349ddebac1c7a8c57d412cbde730b7d78dbde0de808e6ae02a5de78a` | `4d6bd523f4d0eee0b85e0d322fd6b93901b0e608b076b5d90c7a423f1a63a16e` |
| IE000W8WMSL2 | 2026-10-23 | 13 | `0e4df25860a1c7f7fb396942d9431d530636f6077e9316a1fedab4cf6e32b555` | `a6d8e1d89cbfa11848f750943f186fda20b7336b312c176cf4a30b0e6b26a2fe` |
| IE00BZ56SW52 | 2026-10-23 | 27 | `441ef01c27ada7efa41bcb66c1e5f577eecb64d0059e8393e20d8bf60a5deae0` | `96f0cca4506395b30023aef53748554878a39e18507d69553772194303179855` |
| IE00BDVPNG13 | 2026-10-23 | 7 | `aca7f052c8409472915bbadd24d8b207bba5a9bf61637108214b9b1978d7bb51` | `a33af63545114be25caa47d870a315a0447b80b9ae2267cdb0d89175a8ae297f` |
| IE00BKLF1R75 | 2026-10-23 | 18 | `fcd2f2cc158c5a93c4f3cfd80d66a556031dd99f3f07545c15ef610a9c9716fd` | `eaa0cb7e2da546de4cb54df7deddfb1f2ad63ff9505e661e01def8b64b4f4d31` |

Les cinq corps HTML sont dans `scripts/fixtures/wisdomtree-complete/<ISIN>.country-primary-20261030.html.gz`. Les réponses API existaient déjà dans le même répertoire ; aucune nouvelle interrogation API pour cette comparaison. Les sommes, petits poids et noms sont conservés sans normalisation. Une future ligne inconnue reste refusée individuellement ; cette qualification ne garantit pas les futures observations.
