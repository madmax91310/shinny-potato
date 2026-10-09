# Présentations de SCPI

Route `/presentation-scpi` : Iroko Zen, Remake Live, CORUM Origin, CORUM XL, CORUM Eurion, Transitions Europe (Arkéa REIM) ActivImmo (Alderan) et Épargne Pierre (ATLAND Voisin). La publication est un texte long, modifiable avant copie, avec hook, principaux pays/secteurs, accès, distributions, frais, lecture de l’exposition et CTA. Les répartitions complètes et les documents sont consultables dans les réglages.

## Visuel minéral clair

Les onglets Texte et Image partagent les mêmes observations. Le visuel utilise une illustration décorative, des teintes ivoire et sauge et des titres sérif ; les chiffres, dates et conditions sont dessinés par le code. « Télécharger l’image » exporte exactement cet aperçu en PNG, à 1 600 pixels de large, avec une hauteur adaptée au contenu. Le texte retouché reste conservé au changement d’onglet ; les retouches du texte ne modifient pas les faits du visuel.

Les dates propres aux indicateurs, les conditions et fourchettes des fonds euros, les frais HT et maxima contractuels restent explicites. Les sources et la date du relevé figurent au pied du visuel. Un chargement d’illustration en échec interrompt l’export et permet de réessayer.

## Source unique

`src/data/automated-scpi.json` contient les observations ; `src/data/scpi.js` les partage entre l’outil et la bibliothèque de données. La date de collecte reste distincte des dates publiées. Les graphiques Iroko non datés sont explicitement signalés comme tels, sans reprendre la date d’un autre indicateur.

- Iroko : graphiques et API publics de l’émetteur (identifiant public de lecture découvert depuis son script officiel), page produit pour le ticket d’entrée, note d’information pour les frais et la jouissance.
- Remake : JSON officiel des graphiques et calendriers, bulletin courant découvert depuis la page produit pour les conditions et leur date.
- CORUM : rapports annuels pour les distributions et l’historique des prix au 31 décembre ; notes d’information pour les tarifs. Origin et XL utilisent les répartitions, immeubles, locataires et TOF du bulletin T2 2026, au 30 juin 2026, qualifié visuellement et vérifié par empreinte du PDF ; un nouveau bulletin dessiné exige une qualification. Eurion utilise son dernier bulletin trimestriel extractible. Les commissions de gestion de CORUM XL distinguent la zone euro et le reste du portefeuille.
- Transitions Europe : dernier bulletin trimestriel ou semestriel terminé, découvert sur la page officielle ; note d’information pour les conditions. Le taux de distribution est distinct de la performance globale annuelle et de l’objectif.
- ActivImmo : bulletin trimestriel pour les répartitions, locataires et TOF ; rapport annuel pour les actifs et les distributions ; dernière annexe tarifaire pour le prix actuel et sa date d’effet. Les dates restent distinctes et les dividendes mensuels sont confirmés par le rapport annuel.
- Épargne Pierre : bulletin trimestriel terminé pour les régions françaises, secteurs, actifs, locataires et TOF ; rapport annuel pour les distributions et prix historiques. La division du prix de 208 € à 20,80 € au 1er juillet 2026 multiplie le nombre de parts par dix et ne représente pas une perte de valeur. Le minimum est de 100 parts, soit 2 080 €. La jouissance exceptionnelle de 2026 et le passage aux distributions mensuelles en janvier 2027 suivent leurs dates publiées.
- Les trois distributions annuelles terminées sont distinctes des objectifs, TRI et performances globales. Les taux sont bruts de fiscalité étrangère ; les commissions sur les loyers ne sont pas des frais sur le capital.

## Patrimoine, occupation et prix

Le texte et les réglages affichent chaque indicateur avec sa date et sa source : actifs ou immeubles selon la terminologie publiée, locataires et taux d’occupation financier (TOF). Le TOF ne représente pas l’occupation physique ; les franchises, garanties de loyers et autres conventions publiées sont indiquées. Les baux de Remake ne sont pas convertis en nombre de locataires.

Les prix historiques reprennent les dates effectivement publiées : dates d’observation Iroko, fins d’année CORUM et Transitions Europe, débuts d’année du rapport ActivImmo puis annexe tarifaire courante. Remake reprend les fins d’année 2022–2024 du rapport annuel actuellement lié par l’émetteur, puis le prix du bulletin courant : aucune valeur 2025 n’est inventée. Ces prix de souscription ne représentent pas un rendement ou une valeur de revente garantie. Les frais HT et les maxima contractuels restent explicites.

## Actualisation

`.github/workflows/update-scpi.yml` s’exécute tous les jours à 07:20 UTC et peut être lancé manuellement. Il contrôle les parseurs, collecte les sources, vérifie les consommateurs, construit puis déploie les observations validées. Aucun secret ni paramétrage utilisateur n’est nécessaire.

Une allocation invalide, une période incomplète, une source inaccessible ou un changement de conditions non reconnu conserve toute la fiche précédente. Les autres fiches peuvent être actualisées. L’observation en échec est jointe au workflow et sa conclusion reste en échec ; `Publish automation failures` l’affiche dans « Données à revoir ». Le prochain succès retire l’alerte. Les parseurs ne réparent pas seuls un changement de structure.

Commandes :

```sh
python -m unittest discover -s scripts -p test_scpi.py
python -m unittest discover -s scripts -p test_corum.py
python -m unittest discover -s scripts -p test_extended_scpi.py
python -m unittest discover -s scripts -p test_presentation_expansion.py
python scripts/collect_scpi.py --apply --output scpi-observation.json
node scripts/test-scpi.mjs
npm run build
node scripts/test-scpi-ui.mjs
node scripts/test-presentation-images.mjs
```

Pour ajouter une SCPI, qualifier ses sources et son adaptateur avant d’ajouter une fiche. Les assurances-vie disposent de leur outil distinct ; les placements forestiers restent à qualifier.

## Transition des exercices annuels

La découverte sélectionne le dernier rapport annuel terminé réellement lié sur le site officiel. Le millésime des colonnes doit correspondre au lien ; les dates du patrimoine et des prix restent celles de cet exercice. Aucun millésime n’est déplacé lors du changement d’année.

Du 1er janvier au 30 juin, l’exercice N−2 reste admissible si N−1 n’est pas encore publié : le texte, les réglages et l’image affichent explicitement le millésime attendu. Dès qu’il paraît, les trois années affichées se déplacent automatiquement. À compter du 1er juillet, l’absence de N−1 devient un échec suivi dans Données à revoir, avec conservation de la dernière fiche validée. Une publication découverte mais inaccessible ou invalide reste un échec même pendant cette période d’attente.

Les colonnes doivent être consécutives et ne peuvent pas régresser. La division des parts d’Épargne Pierre garde sa date du 01/07/2026 ; le passage annoncé aux distributions mensuelles intervient le 01/01/2027, et la jouissance temporaire de 2026 cesse selon sa date publiée. Tests : `python -m unittest discover -s scripts -p test_publication_periods.py`.

### Correction de la composition minérale

L’export est une carte carrée de 1600 × 1600 pixels : grand titre, illustration dominante et trois panneaux de chiffres essentiels, conformément à la proposition 1. Le texte conserve le détail des conditions et des sources. Les taux de distribution restent identifiés comme bruts de fiscalité étrangère ; les fonds euros gardent leurs fourchettes et conditions lorsqu’elles s’appliquent.

## Complément du 9 octobre 2026

Voir la [qualification des sources et les limites des bulletins dessinés](presentation-source-reliability.md) et la [roadmap de l’outil unique Présentations](presentations-roadmap.md). Les exports actuels utilisent des logos officiels en relief, des couleurs propres à chaque marque et un format 1600 × 1000.
