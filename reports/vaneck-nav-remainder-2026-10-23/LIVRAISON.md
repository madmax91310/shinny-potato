# Trois voies NAV VanEck existantes — complément du reliquat79

Base master b0754186d85542379c3185a45493611e872a84b9. PR #892, #895 et corrections concurrentes publiées conservées. Aucun nouvel instrument ni rôle automatique ajouté.

## Admissions démontrées

| Part | Donnée et profondeur conservée | Usage |
|---|---|---|
| IE00BYWQWR46 ESPO | NAV capitalisante USD ; EUR par BCE ; depuis juillet2019 | Calculateur/DCA, Performance depuis, anniversaire, comparaison et classement ; rôle Gaming existant conservé |
| IE000M7V94E1 NUCL | NAV capitalisante USD ; EUR par BCE ; depuis mars2023 | Mêmes outils historiques ; seulement deux années complètes, reste exclu des portefeuilles exigeant trois ans |
| IE000YU9K6K2 JEDI | NAV capitalisante USD ; EUR par BCE ; depuis octobre2022 | Mêmes historiques ; identifiant manuel/Duel déjà publié préservé |

Le collecteur commun vérifie l’ISIN exact, le nom, le ticker de documentation, la devise NAV USD, la capitalisation, le fichier XLSX propre au fonds et sa concordance avec le calendrier annuel PDF. La précision publiée et les tolérances existantes restent inchangées. Aucun indice ni autre part ne remplace l’instrument. Les anciens cours sont conservés dans avant-migration.json.gz et les archives originales des audits.

La qualification fonctionne réellement depuis GitHub Actions : run39991498458, artefact12518415487, trois séries validées, réponses brutes dans github/. Le job global échoue sur le quatrième candidat GDX : cet échec est conservé, et ne doit pas être présenté comme une exécution globalement verte. La première tentative39990973629 échouait faute de dépendance Chromium dans la sonde ; preuve conservée dans github-attempt-1. Le registre actif final ne contient que les trois admissions et bénéficie d’un nouveau contrôle fournisseur dédié.

## Candidat GDX non admis

IE00BQQP9F84 : rendement quotidien officiel2017 11,6563573883%, calendrier PDF11,6%, précision0,1point donc tolérance0,05point dépassée. Aucune modification du seuil ni exclusion opportuniste de2017. Il manque une explication officielle des bornes/conventions2017. La voie NAV candidate reste inactive ; les usages et années déjà qualifiés de l’ancien instrument sont préservés. Ce nouveau blocage est distinct des79cas initiaux.

## Vérification et distinction des conclusions

940 tests Python locaux réussis avec langue OCR française installée ; quatre régressions VanEck couvrent aussi Mining, mauvaise identité/devise/téléchargement, avant-lancement, précision et refus GDX. Les14voies NAV du reliquat passent les contrôles consommateurs. Les identifiants des portefeuilles avant/après et tous les rôles automatiques sont conservés ; NUCL reste absent. 14PNG locaux supplémentaires : trois parts × quatre parcours, comparaison et classement annuel2024–2025, calculEUR, couleurs stables, texte et téléchargement. Les tests de fichiers capturés ne prouvent pas une disponibilité fournisseur ; seules les collectes réseau GitHub sont présentées comme telles.

Après cette migration :24/79cas sur NAV distincte,1WFNS sur cotation réparée,54 anciennes cotations non réparées encore consommées sur33parts. Les14nouvelles voies NAV sécurisent20cas supplémentaires depuis la base initiale, sans expliquer l’ancienne divergence ; avec WFNS15instruments existants sont modifiés. 72preuves quotidiennes et7manquantes ; les79causes ne sont pas déclarées entièrement attribuées. Voir les rapports séparés et leurs valeurs originales inchangées.

La publication effective et les contrôles sur le site servi sont consignés séparément après fusion dans PUBLICATION.md ; ce document de PR ne constitue pas une preuve de mise en ligne.


## Complément après le producteur normal

La CI complète9be6d1a a réussi, mais le producteur mensuel normal39996170288 a ensuite validé661/665séries et refusé quatre PDF VanEck redirigés vers le siteUS. Les observations et dernières valeurs ont été conservées : la sonde dédiée verte ne suffisait pas à démontrer cette voie du producteur normal. La fusion a été suspendue pour corriger ce raccordement.

ESPO/NUCL/JEDI utilisent désormais les API publiques réellement appelées par leurs pages officielles UCITS : code interne dérivé de la page (UCTESPO, UCTNUCL, UCTJEDI), caractéristiques de revenu et de devise, table de cotations donnant uniquement l’ISIN exact, calendrier de la ligne du fonds avec sa devise et son lancement. Un ticker public américain homonyme est explicitement refusé. La convention NAV nette capitalisante reste inchangée. Aucune dépendance au PDF régional n’est utilisée pour ces trois NAV ; les caractéristiques et compositions des autres collecteurs ne sont pas annoncées réparées par ce changement. La sonde utilise désormais le vrai point d’entrée refresh_monthly_history.py --only, le même Ubuntu26.04/Node20 que le producteur planifié, et conserve les preuves complètes sans renouveler un historique inchangé.

Le contrôle du code public du graphique apporte la preuve du format publié : son tooltip concatène directement le Number JavaScript et le signe%. Ainsi2.0 est publié2%, alors que11.6 est publié11.6%. La précision affichée est donc celle déjà retenue pour le PDF, sans changement de seuil. Le collecteur vérifie réellement ce formateur public et mutualise son téléchargement entre les collectes parallèles ; toute modification du formateur entraîne un refus de qualification. Mining peut utiliser la même API exacte une fois cette voie validée par le producteur normal dans GitHub. Le refus GDX2017 reste inchangé. Les observations, erreurs intermédiaires et la preuve de format sont conservées.
