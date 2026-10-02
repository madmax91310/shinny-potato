# Réutilisation de la banque de données — 2 octobre 2026

Les neuf chantiers sont implémentés sur la branche `codex/reuse-data-roadmap`.

1. Banque : consommateurs dérivés du catalogue réel des Duels et des ETF du simulateur de frais ; usages Tweet Midi et Faits marquants des séries, et Cas concrets des indices.
2. Duels facteurs/dividendes : Momentum, Global Dividend Aristocrats, High Dividend, Quality Dividend.
3. Duels défensifs : XEON, obligations EUR 0–1 an, obligations mondiales couvertes EUR, dans le rôle Complément. Sept nouveaux duels comparent un World seul à une allocation mixte ; aucun changement de la règle de trois lignes maximum.
4. Duels sectoriels : financières américaines/mondiales, semi-conducteurs mondiaux, blockchain. Trois nouvelles confrontations ; 38 ETF, 22 duels préparés. Les périodes communes restent explicites ; Quality Dividend exclut le proxy 2020 de l’autre part.
5. Tweet Midi : trois sujets supplémentaires (financières US/mondiales, semi-conducteurs/tech mondiale, présentation blockchain). Les caractéristiques et frais existants sont importés ; le TER IUFS manquant a été vérifié sur le profil et la fiche iShares le 02/10/2026 (0,15 %).
6. Générateur : neuf actifs autrefois absents des options automatiques deviennent accessibles. Généraliste : poches monétaires et obligataires, petites capitalisations et Inde en complément. Thématique : financières, infrastructures, Inde et deux parts obligataires. Les pondérations des slots restent identiques. Les neuf combos modifiés passent la vérification exhaustive ; 9300 générations passent la régression. Le moteur refuse un résultat hors bornes, y compris avant le jitter.
7. Impact des frais : sélection d’ETF UCITS des fiches, TER et source depuis le registre. Même hypothèse de rendement brut pour les deux ; simulation des frais, aucune comparaison des performances réelles. ISIN dans le tweet et l’image ; sélection hypothétique conservée.
8. Faits marquants : 16 faits dérivés des huit historiques mensuels ajustés des actions, sans prix recopiés. Baisse maximale entre clôtures mensuelles et récupération du sommet ; versement unique contre 100 unités de devise chaque mois, mêmes montants versés, argent en attente non rémunéré. Les méthodes et limites figurent dans les textes copiés. Air Liquide exclut la prime de fidélité. Pas de maximum quotidien déduit de clôtures mensuelles.
9. Cas concrets : World + ACWI et World + Europe, poids américains et technologie issus de la dernière photographie datée commune. Pondérations d’indices, pas positions exactes d’ETF ni taux de chevauchement.

Les registres historiques restent des instantanés. Les textes dérivés changent lorsqu’on actualise les données communes ; cette extension n’ajoute pas d’actualisation distante des cours ni de publication automatique sur X.

Validation : `scripts/test-data-reuse.mjs`, audit Duels (500 générations), neuf contrôles exhaustifs du générateur, régression du générateur, audits communs, vérification de Tweet Midi, build et tests navigateur en CI. La fusion et le déploiement requièrent l’accord séparé prévu par `CLAUDE.md`.
