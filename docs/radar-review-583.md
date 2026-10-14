# Examen des 32 contradictions — issue #583

Contrôle direct des six API officielles DWS le 14 octobre 2026. État de départ :
32 conflits actifs dans `radar-data`, plus un incident INSEE hors de ce chantier.

## Résultat

- 28 valeurs actuelles reproduisent une proposition contradictoire déjà archivée.
- 2 valeurs sectorielles Industrials reproduisent la valeur initialement retenue.
  Le retour à cette valeur ne suffit pas à lever une contradiction de même période.
- 2 catégories du S&P 500 Equal Weight (Suisse, Bermudes) sont absentes du
  portefeuille intégral du 12 octobre, postérieur au conflit du 7 octobre.
  Leur poids agrégé est nul dans cet instantané. Le radar omettait ces catégories
  et conservait indéfiniment leurs anciennes alertes : défaut corrigé.

Aucune erreur de somme ou différence avec les agrégats de l’application n’a été
constatée lors du recalcul des six réponses. Les empreintes actuelles correspondent
exactement aux données déjà collectées. Aucune valeur financière n’est remplacée.
Les réponses différentes du fournisseur prouvent une variation de la source,
mais leurs anciennes lignes intégrales ne sont pas toutes archivées : on ne peut
pas attribuer avec certitude chacune des 30 révisions à une société ou choisir
une nomenclature historique « correcte ». Ces 30 alertes restent donc ouvertes.
Elles ne constituent pas des mouvements de portefeuille publiables.

## Correction

Le collecteur marque explicitement les agrégations complètes validées. Le radar
ne déduit un zéro d’une catégorie absente que pour une allocation complète de
même actif et méthode, totalisant 99–101 %, avec champs uniques, empreinte source,
date de contrôle et URL cohérentes. Une source absente, partielle, ancienne ou
sans empreinte ne peut pas lever l’alerte. Une omission à la même période reste
une contradiction. Une période ultérieure rétablit l’ancre sans signal de marché.
Les propositions, événements invalidés et preuves historiques sont conservés.

Rejeu des 32 conflits : 30 restent actifs, les deux conflits du 7 octobre sont
résolus sans nouveau signal. Répéter le relevé ne crée aucun événement.
Le rejeu complet de l’état réel fait aussi apparaître quatre contradictions
jusqu’ici invisibles : IA — Irlande 1,055059 % → 0 %, Australie 0,379579 % → 0 %,
Hong Kong 2,423816 % → 0 % ; Materials — Mexique 0,232648 % → 0 %. Elles concernent
le même 12 octobre et restent donc ouvertes. Le total global devient **34 conflits**
(32 − 2 + 4), sans nouveau signal éditorial. Ce total ne signifie pas 34 erreurs.

La prise en compte dans l’issue automatique nécessite l’intégration du correctif
et le passage du radar puis de la surveillance. L’incident INSEE reste indépendant.

## Comparaison exhaustive (poids en %)

| ISIN | Champ | Date disputée | Retenu | Propositions | Date DWS contrôlée | Valeur actuelle |
|---|---|---|---:|---|---|---:|
| IE00BLNMYC90 | countries:Switzerland | 2026-10-07 | 0.803319 | 0.201028 | 2026-10-12 | 0 |
| IE00BLNMYC90 | countries:Bermuda | 2026-10-07 | 0.399295 | 0.198964 | 2026-10-12 | 0 |
| IE00BM67HK77 | countries:United States | 2026-10-12 | 72.969722 | 72.502015, 75.095546 | 2026-10-12 | 75.095546 |
| IE00BM67HK77 | countries:United Kingdom | 2026-10-12 | 4.587828 | 4.801511, 4.098384 | 2026-10-12 | 4.098384 |
| IE00BM67HK77 | countries:Ireland | 2026-10-12 | 1.42599 | 1.680014, 0.030248 | 2026-10-12 | 0.030248 |
| IE00BM67HS53 | countries:United States | 2026-10-12 | 36.631449 | 27.589611, 28.253539 | 2026-10-12 | 28.253539 |
| IE00BM67HS53 | countries:United Kingdom | 2026-10-12 | 5.909139 | 13.699055, 2.660367 | 2026-10-12 | 2.660367 |
| IE00BM67HS53 | countries:Switzerland | 2026-10-12 | 8.47939 | 7.858965, 4.679415 | 2026-10-12 | 4.679415 |
| IE00BM67HS53 | countries:Ireland | 2026-10-12 | 0.99722 | 2.869568, 10.659484 | 2026-10-12 | 10.659484 |
| IE00BM67HV82 | countries:United States | 2026-10-12 | 53.063611 | 52.094215, 56.383883 | 2026-10-12 | 56.383883 |
| IE00BM67HV82 | countries:Ireland | 2026-10-12 | 3.63172 | 4.601116, 0.536859 | 2026-10-12 | 0.536859 |
| IE00BM67HV82 | sectors:Industrials | 2026-10-12 | 99.789849 | 99.609716 | 2026-10-12 | 99.789849 |
| IE00BM67HV82 | sectors:Unassigned | 2026-10-12 | 0.014086 | 0.194219 | 2026-10-12 | 0.014086 |
| IE00BGV5VN51 | countries:United States | 2026-10-12 | 83.354654 | 84.789292 | 2026-10-12 | 84.789292 |
| IE00BGV5VN51 | countries:China | 2026-10-12 | 1.497978 | 3.921795 | 2026-10-12 | 3.921795 |
| IE00BM67HK77 | countries:Switzerland | 2026-10-12 | 9.010917 | 9.500361 | 2026-10-12 | 9.500361 |
| IE00BM67HK77 | countries:Netherlands | 2026-10-12 | 0.341699 | 0.948834 | 2026-10-12 | 0.948834 |
| IE00BM67HK77 | countries:Belgium | 2026-10-12 | 0.981648 | 0.374514 | 2026-10-12 | 0.374514 |
| IE00BM67HK77 | countries:Australia | 2026-10-12 | 0.927999 | 0.197917 | 2026-10-12 | 0.197917 |
| IE00BM67HS53 | countries:Australia | 2026-10-12 | 12.233902 | 18.230945 | 2026-10-12 | 18.230945 |
| IE00BM67HS53 | countries:Canada | 2026-10-12 | 16.222299 | 12.81477 | 2026-10-12 | 12.81477 |
| IE00BM67HS53 | countries:Chile | 2026-10-12 | 0.598619 | 1.181139 | 2026-10-12 | 1.181139 |
| IE00BM67HS53 | countries:Norway | 2026-10-12 | 0.59312 | 0.362198 | 2026-10-12 | 0.362198 |
| IE00BM67HV82 | countries:France | 2026-10-12 | 5.084891 | 6.362716 | 2026-10-12 | 6.362716 |
| IE00BM67HV82 | countries:United Kingdom | 2026-10-12 | 4.07882 | 4.63388 | 2026-10-12 | 4.63388 |
| IE00BM67HV82 | countries:Canada | 2026-10-12 | 2.925078 | 2.523846 | 2026-10-12 | 2.523846 |
| IE00BM67HV82 | countries:Australia | 2026-10-12 | 0.727474 | 0.579495 | 2026-10-12 | 0.579495 |
| IE00BM67HV82 | countries:Netherlands | 2026-10-12 | 1.721183 | 0.443358 | 2026-10-12 | 0.443358 |
| IE00BM67HV82 | countries:Hong Kong | 2026-10-12 | 0.75766 | 0.436861 | 2026-10-12 | 0.436861 |
| IE00BM67HV82 | countries:China | 2026-10-12 | 0.105467 | 0.195007 | 2026-10-12 | 0.195007 |
| IE00BM67HQ30 | countries:United States | 2026-10-12 | 59.401555 | 59.209207 | 2026-10-12 | 59.209207 |
| IE00BM67HQ30 | countries:Canada | 2026-10-12 | 3.214226 | 3.406575 | 2026-10-12 | 3.406575 |

## Preuves reproductibles

Les six JSON complets, les 32 conflits, leurs valeurs comparées et les observations
du S&P 500 Equal Weight sont archivés dans `scripts/fixtures/radar-review-583/`.
Les empreintes correspondent au JSON canonique Python utilisé par le collecteur.

- [IE00BGV5VN51](https://etf.dws.com/api/pdp/en-gb/etf/IE00BGV5VN51/holdings)
- [IE00BLNMYC90](https://etf.dws.com/api/pdp/en-gb/etf/IE00BLNMYC90/holdings)
- [IE00BM67HK77](https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HK77/holdings)
- [IE00BM67HQ30](https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HQ30/holdings)
- [IE00BM67HS53](https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HS53/holdings)
- [IE00BM67HV82](https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HV82/holdings)

Validation : `npm run test:radar`, `python scripts/test_radar_review_583.py`.
