# Présentations de SCPI

Route `/presentation-scpi` : Iroko Zen, Remake Live, CORUM Origin, CORUM XL, CORUM Eurion, Transitions Europe (Arkéa REIM) ActivImmo (Alderan) et Épargne Pierre (ATLAND Voisin). La publication est un texte long, modifiable avant copie, avec hook, principaux pays/secteurs, accès, distributions, frais, lecture de l’exposition et CTA. Les répartitions complètes et les documents sont consultables dans les réglages.

## Visuel minéral clair

Les onglets Texte et Image partagent les mêmes observations. Le visuel utilise une illustration décorative, des teintes ivoire et sauge et des titres sérif ; les chiffres, dates et conditions sont dessinés par le code. « Télécharger l’image » exporte exactement cet aperçu en PNG, à 1 600 pixels de large, avec une hauteur adaptée au contenu. Le texte retouché reste conservé au changement d’onglet ; les retouches du texte ne modifient pas les faits du visuel.

Les dates propres aux indicateurs, les conditions et fourchettes des fonds euros, les frais HT et maxima contractuels restent explicites. Les sources et la date du relevé figurent au pied du visuel. Un chargement d’illustration en échec interrompt l’export et permet de réessayer.

## Source unique

`src/data/automated-scpi.json` contient les observations ; `src/data/scpi.js` les partage entre l’outil et la bibliothèque de données. La date de collecte reste distincte des dates publiées. Les graphiques Iroko non datés sont explicitement signalés comme tels, sans reprendre la date d’un autre indicateur.

- Iroko : graphiques et API publics de l’émetteur (identifiant public de lecture découvert depuis son script officiel), page produit pour le ticket d’entrée, note d’information pour les frais et la jouissance.
- Remake : JSON officiel des graphiques et calendriers, bulletin courant découvert depuis la page produit pour les conditions et leur date.
- CORUM : rapports annuels pour les distributions et l’historique des prix au 31 décembre ; notes d’information pour les tarifs. Origin et XL conservent leurs répartitions annuelles datées : les tableaux des derniers bulletins ne sont pas extractibles de façon fiable. Eurion utilise son dernier bulletin trimestriel extractible pour les répartitions, les immeubles, les locataires et le TOF. Les commissions de gestion de CORUM XL distinguent la zone euro et le reste du portefeuille.
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
