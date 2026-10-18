# Corrections de l’audit des données automatisées — 18 octobre 2026

Périmètre : collecte → validation → enregistrement → génération des registres partagés → application → publication. Les corrections intègrent le travail de routage de la PR #791 et les autres changements déjà fusionnés sur master. Aucune observation synthétique n’est publiée.

| Point | Traitement et preuve |
| --- | --- |
| A01 — change TWD | Relance indépendante de la source FRED, même si la BCE est à jour. 333 mois réels collectés ; provenance et dates conservées. Arrondi décimal identique en Python et JavaScript. Une panne conserve les valeurs précédentes et son alerte. |
| A02 — collecte mensuelle | Installation de Poppler, inclusion du contrôle des cotations dans le résultat de collecte et rapports structurés. Les cinq cotations ciblées ont été relues et validées auprès des émetteurs. |
| A03 — surveillance | Rapports mensuels, devises, cotations et entreprises lus par champ. Échec de validation distinct d’un échec de collecte. Une ancienne exécution terminant tard ne peut pas rétablir un état obsolète. |
| A04 — publication | Reçu des fichiers du commit demandé, manifeste des octets réellement compilés et comparaison avec le site publié. La preuve peut lever un blocage de déploiement ; elle ne supprime pas un incident de source. Migration des anciennes preuves uniquement depuis le SHA exact du checkout de déploiement. |
| A05 — fraîcheur des historiques | La fin de période réelle détermine l’âge de la donnée ; le jour du contrôle reste distinct. Les dates absentes, impossibles ou futures ne sont pas considérées récentes. |
| A06 — couverture | Comptages par ISIN et par champ, sans assimiler une fiche existante à une couverture complète. Après la collecte DWS : 242 ISIN avec cotations qualifiées, 762 cotations. |
| A07 — métadonnées | Identité DWS limitée à la section officielle de la part, sans confusion avec les liens vers d’autres parts. Dix-huit parts relues, dix nouvelles identités de cotation. Les champs jamais observés déclenchent une demande de qualification après le délai existant. |
| A08 — ETF actifs | CSPX relu avec succès auprès de l’émetteur. Les corrections Xtrackers déjà présentes sont conservées. Les nouvelles observations fusionnées sur master pendant l’intervention sont également conservées. |
| A09 — historiques manquants | Dix historiques DWS supplémentaires qualifiés après 24 contrôles de cotation réussis : 664 historiques automatiques au total, dont 235 ETF. Les 17 absences de cotation et les 30 historiques trop courts restent explicites. |
| A10 — expositions | Les dix premières positions des parts Invesco All-World Acc/Dist proviennent du PDF exact, avec date et empreinte. Elles ne sont pas présentées comme un portefeuille complet. La nouvelle lecture QYLD confirme des contradictions entre positions : ces données restent non qualifiées. |
| A11 — entreprises | Relance réelle Teradyne : comptes, cours et trésorerie récupérés ; prévisions non qualifiées conservées comme lacune. Un identifiant de collecte inconnu échoue explicitement. Les rapports différencient les champs réellement renouvelés des replis et des échecs. |
| A12 — PEL | Huit générations de taux tirées du document DILA F16140, avec bornes de dates et provenance. Le simulateur consomme ce registre ; une ouverture future ou invalide est rejetée. Aucun taux de prêt n’est utilisé comme taux de rémunération. |
| A13 — produits | Périodes des fonds euros, années de rendement, dates d’effet tarifaires et fiches archivées distinguées. Une relecture ne rajeunit pas une ancienne observation. |
| A14 — courtiers | Les six dossiers partiels et les validations manuelles encore valables restent visibles. Les clauses absentes des documents officiels ne sont pas inventées ni marquées automatiquement complètes. |
| A15 — répétition | Scénarios du mois suivant et du changement d’année sur six familles de séries ; propagation aux calculateurs, classements, statistiques et anniversaires. Un marqueur interdit l’enregistrement des données synthétiques par le script de publication. |

## Vérifications

- Construction complète et contrôles des registres communs, des cotations, des devises, des expositions et des consommateurs mensuels.
- Contrôles ciblés des pannes, reprises, dates, identités de parts, frontières annuelles et preuves de publication.
- 774 tests Python lors de la première campagne ; les trois erreurs locales concernaient uniquement le dictionnaire OCR français absent de l’environnement, installé avant relance des tests concernés.
- Répétition isolée du mois suivant et du changement d’année, sans publication des valeurs simulées.
- Tests Chromium réels des routes et des interactions ; validation finale et déploiement tracés dans la PR #798.

## Limites conservées volontairement

Une correction technique ne crée pas une publication officielle manquante. Les historiques trop courts, les cotations non documentées, les contradictions QYLD, les prévisions Teradyne et certaines clauses contractuelles restent des lacunes identifiées. Aucune baisse des exigences d’identité, de devise, de durée minimale ou de qualité n’a été utilisée pour les masquer.
