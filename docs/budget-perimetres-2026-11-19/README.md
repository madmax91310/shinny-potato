# Relecture des périmètres de 101 budgets

Revue du 19 novembre 2026 sur `8ee5effd`. Point de départ et repères antérieurs dans [l’audit de la PR #1394](../budget-vraisemblance-2026-11-19/README.md). La [matrice](matrice.csv) donne les postes, les chiffres avant et après, le périmètre et le résultat du contrôle navigateur pour chaque profil. Les [données essentielles manquantes](non-prets.md) restent dans le suivi éditorial. L’état de publication relève des statuts existants.
Le bilan compte 99 profils prêts, dont 51 corrigés et vérifiés et 48 cohérents dans leur périmètre. Deux profils restent non prêts. Le texte de 26 profils et le PNG de 51 profils ont changé.

Les verdicts portent sur les chiffres et la période effectivement présentés. Un mois documenté peut être cohérent même si le mois suivant est inconnu. Un paiement observé garde son périmètre même quand une comparaison au marché est impossible. Les dépenses regroupées sont comptées une seule fois. Les équivalents sur douze mois montrent un ordre de grandeur sous réserve de reconduction.

## Changements de calcul et cas sensibles

| Profil | Résultat |
| --- | --- |
| Apolline | Le scénario de base prend le salaire prévu de 1 184,78 €. Le loyer est pris en charge par les parents. Les 100 € d’aide figurent en variante, après vérification de la dépense de logement restant à charge. Avec les versements prévus, le reste passe de 124,78 à 24,78 €. [PNG](apolline.png) |
| Zoé | Le relevé publié indique 287 € de loyer CROUS après APL et environ 30 € de courses par semaine, soit 130 € sur un mois moyen. Les 100 € des parents restent une recette distincte. Le solde du mois de stage passe de −163,97 à +219,03 €. Sans le stage, à dépenses et aides égales, il manquerait environ 440 €. [PNG](zoe.png) |
| Patrice | La provision éditoriale de 70 €/mois, soit 840 €/an, couvre l’entretien courant de la maison dans ce budget. Elle est distincte du crédit, des impôts et de l’assurance. Le déficit passe de 100 à 170 €. [PNG](patrice.png) |
| Adrien | Le CDI junior en cybersécurité, la résidence française, l’emploi au Luxembourg, le revenu net après impôt et les trajets sans voiture sont confirmés par le témoignage. Les 40 € restent une enveloppe de préparation faute de tarif et de fréquence. Les 450 € réservés pour le prêt sont déjà mis de côté. Le reste de 130 € est celui du plan. [PNG](adrien.png) |
| Thomas à Paris | Le graphique d’origine porte 525,18 € de loyer, repris à 525 € dans le relevé arrondi. Ni surface, ni bail, ni partage ne sont établis. Les 67 € de stationnement regroupent 57 € de location et 10 € au travail. Dans le projet d’achat du parking, seuls 57 € disparaîtraient. [PNG](thomas-a-paris.png) |
| Noémie | 3 500 € nets encaissés, 200 € de titres-restaurant et 200 € de courses payées sur le compte sont trois lignes de périmètre distinct. Le repère Hays est en brut annuel et ne confirme ni le brut ni le régime fiscal du profil de référence. |
| Djamila | 900 € d’habillement sur douze mois. Sans pension et avec le versement de 20 €, le manque de 890 € par mois épuise exactement la réserve hypothétique de 2 670 € en trois mois. Le retrait est distinct des revenus. |
| Morgane | La moyenne de 2 400 € couvre quatre mois à 5 760 € et huit à 720 €. Les 12 000 € dédiés financent 11 920 € de sortie nette sur les huit mois creux avec 500 € de versements. Il reste 80 € dans cette poche et les 6 000 € de sécurité sont séparés. [PNG](morgane.png) |
| Timéo | Le bandeau identifie le budget type suisse en CHF. La participation prévue au logement et aux repas laisse un déficit de 5 CHF. Une nouvelle provision de 100 CHF pour le permis demanderait 105 CHF d’économies. [PNG](timeo.png) |

## Sources et portée de la relecture

- Fiches d’origine et éléments archivés relus pour les 55 exceptions. Les postes des 46 fiches initialement validées ont été revérifiés à partir du relevé conservé ou du scénario de la banque. La colonne « contrôle de ce chantier » documente la décision pour chaque fiche.
- Sources publiques relues directement le 19/11/2026 pour le trajet d’Adrien, les 60 € de charges de Mathieu, la projection d’Apolline, le revenu de Benoît, l’achat du logement d’Axel et le graphique de Thomas à Paris. [Adrien](https://community.finary.com/t/39359/1) · [Mathieu](https://community.finary.com/t/32236/1) · [Apolline](https://community.finary.com/t/40101/1) · [Benoît](https://community.finary.com/t/23767/1) · [Axel](https://community.finary.com/t/34498/1) · [Thomas](https://community.finary.com/t/32675/1)
- Article de référence de Zoé relu le 19/11/2026 pour le loyer après aides, les courses hebdomadaires et la contribution parentale. [Aufeminin](https://www.aufeminin.com/societe/dossiers/gerer-son-budget/je-vais-voir-mes-applis-bancaires-tous-les-jours-dans-les-comptes-de-nina-24-ans-etudiante-boursiere-2668147.html)
- Conditions d’Action Logement, tarification transfrontalière et repères de loyers annoncés du Luxembourg relus le 19/11/2026. Les études de salaires, les prix au m² en France, les repères suisses et les paniers de consommation sont les sources datées documentées dans la PR #1394. Les statistiques brutes demeurent des comparateurs de contexte. Les déclarations de revenu net ne sont pas converties en brut. [Action Logement](https://www.actionlogement.fr/faq/aide-mobili-jeune) · [Mobiliteit](https://www.mobiliteit.lu/fr/billets/billets-transfrontaliers/) · [Observatoire de l’habitat](https://logement.public.lu/fr/publications/observatoire/loyers-annonces-en-2025-dans-l-aire-fonctionnelle-du-luxembourg.html) · [Repères repris de #1394](../budget-vraisemblance-2026-11-19/sources.md)

## Contrôles exécutés pour ce chantier

- Calcul indépendant en centimes des recettes encaissées, dépenses, versements et reste pour les 101 fiches. Les déficits passent de 12 à 11. Zoé passe de −163,97 € à +219,03 € pendant le stage après correction du loyer et des courses. Le déficit de Patrice s’accroît du montant de la provision.
- Tests Budget et build, puis Chromium avec une fenêtre de 390 px. Comparaison du texte affiché au presse-papiers, vérification de l’export unique de 1 080 × 1 350 et des octets de l’aperçu pour les 101 profils.
- Exports modifiés ouverts à 390 px. Les empreintes de la PR #1394 servent uniquement à identifier les PNG modifiés. Les valeurs d’export et de copie de la nouvelle matrice viennent des tests de ce chantier.
- Recette réelle du Studio vérifiant aussi texte personnalisé, dates, file de publication et PNG exporté dans le ZIP.
