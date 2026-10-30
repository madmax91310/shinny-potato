# Pays WisdomTree : date propre et définition qualifiée

Suite du suivi consolidé après #1064 ; aucune convention de performance, position, image ou limite de couverture modifiée.

## Défaut reproduit et correction

Le lecteur attribuait à Country Allocation la date de Product Overview/NAV faute de date dans le titre de ce tableau. La capture réelle `scripts/fixtures/official-documents/wisdomtree-ie-usd-eur-20261023.html.gz` présente les pays Cloud 92,44 % États-Unis, 5,85 % Israël, 1,71 % Canada. Leurs lignes serveur sont datées du **15 octobre**, tandis que le lecteur utilisait le **22 octobre**. Ce dernier n'est pas une date de composition.

Le lecteur confronte maintenant le tableau affiché aux lignes pays du même document, pour la classe exacte, avec libellés, poids, date et définition. L'arrondi décimal à deux chiffres sert uniquement à identifier le tableau affiché, jamais à accepter une divergence financière entre sources. Une date non unique, un changement d'identité ou un flux incomplet produit une erreur individuelle `countries`, sans renouveler le pays conservé ni rejeter les autres champs valides. Aucun retour à la date NAV.

## Secours qualifié seulement pour Cloud IE00BJGWQN72

Deux photographies officielles indépendamment datées, 15 et 23 octobre, rattachent le tableau affiché à **Incorporated Country / ID 6**. Il ne s'agit pas de **Aggregate Country / ID 16**, dont les poids diffèrent.

La capture réelle du 29 octobre, conservée dans `scripts/fixtures/official-documents/wisdomtree-cloud-country-20261029.html.gz`, affiche 92,50 / 5,95 / 1,54 %. Ses lignes serveur du 23 octobre portent exactement **92,5013 / 5,9539 / 1,5448 %**. Elles correspondent sans ajustement aux lignes ID 6 de la réponse API réelle déjà conservée dans `scripts/fixtures/wisdomtree-complete/IE00BJGWQN72.rankings.json.gz`. Classe primaire 3104137, entité API 682577, WCLD LN, USD Acc ; le contrôle documentaire d'ISIN et de devise existant reste obligatoire.

La politique est inscrite dans le registre commun `wisdomtree-holdings-classes.json`, uniquement pour cette part. Le secours ordinaire réutilise la réponse déjà acquise pour top 10/secteurs et le PDF effectivement acquis dans la tentative ; aucune requête supplémentaire ni cache devenu contrôle source. Les pourcentages source sont conservés, sans normalisation. Les cinq autres parts ne deviennent pas admissibles à ce secours pays par analogie. Frais, encours et autres champs ne reçoivent aucun contrôle emprunté.

Les observations déjà enregistrées ne sont pas réécrites rétroactivement. La protection contre une observation plus ancienne et la quarantaine des contradictions à date identique sont conservées. Une ancienne date mal attribuée peut donc nécessiter une preuve de migration distincte avant remplacement ; ce correctif ne la force pas.

## Vérification

Sept régressions dédiées utilisent les deux captures réelles et des mutations isolées : dates NAV/pays distinctes, correspondance primaire/API, définition distincte, mauvais ISIN/devise/classe, ligne absente, poids ou date invalide, ordre des lignes, panne partielle et conservation des autres champs. Les anciennes suites Fund/Sector et sources émetteurs restent exécutées. Les tests ne constituent pas une preuve de fonctionnement fournisseur depuis GitHub. Collecte ordinaire, enregistrement et publication restent à vérifier après fusion.

Accès : route publique émetteur déjà employée par les collecteurs ; aucune licence de redistribution n'est déduite d'un HTTP réussi.
