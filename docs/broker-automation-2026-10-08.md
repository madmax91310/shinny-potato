# Automatisation des courtiers — 8 octobre 2026

La collecte quotidienne étend les deux barèmes existants à XTB, Saxo, Crédit Agricole Île-de-France, Interactive Brokers France et Trade Republic. Les observations qualifiées alimentent les tableaux, les publications, les preuves et le catalogue de données.

| Courtier | Champs collectés | Périmètre et limites |
|---|---|---|
| BoursoBank | Découverte, change, transfert sortant, remboursement entrant | Actions Euronext ; change exprimé en points de cours, pas en pourcentage ; premier transfert total et justificatif dans les trois mois |
| Fortuneo | Starter, change, garde, transfert sortant, remboursement entrant | Premier ordre mensuel sous le seuil ; anciens tarifs distincts ; frais de change intermédiaire conservés ; plafonds de remboursement selon l’encours |
| XTB | Ordres OMI, change, garde, transfert sortant | Volume cumulé tous comptes ; minimum de commission non appliqué au PEA ; garde sur l’excédent du portefeuille ; tarif de sortie PEA distinct du CTO |
| Saxo | Classic Euronext, change, garde, transfert sortant, offres PEA et ETF Amundi | Colonne Classic ; exception de garde non cotée ; périodes et conditions propres aux deux offres ; restriction de transfert de six mois conservée |
| Crédit Agricole Île-de-France | Initial/Integral PEA, abonnement et exemptions, garde, transfert sortant | Caisse régionale précise ; colonne PEA à droite, pas le forfait CTO à 0,99 € ; change boursier encore non établi |
| Interactive Brokers | France dégressif, fixe SmartRouting et routage direct ; change général, garde et frais de transfert annoncés pour le PEA | Premier palier et minima propres aux trois modes ; frais de marché possibles ; disponibilité du change sur PEA non confirmée, preuve partielle conservée |
| Trade Republic | Frais externes des transactions ponctuelles hors plans | Article d’aide public non daté ; Direct Price conserve un tarif distinct et n’est pas certifié par cette collecte |
| Bourse Direct | Connecteur et test de structure préparés | Téléchargements officiels testés en HTTP 502 ; aucune observation automatisée ajoutée. Les valeurs éditoriales et leurs sources restent disponibles |

## Collecte et conservation

La brochure XTB porte la date du 30 septembre 2026 malgré son URL contenant `052026`. Les documents datés ne peuvent régresser ou porter une date future. Les pages non datées restent non datées : la date de consultation ne devient pas une date de publication.

Une panne conserve la dernière observation qualifiée du courtier et de chaque champ indépendant. Les compléments sont traités séparément : l’échec d’une offre ne supprime pas un barème réussi. Les valeurs conservées ne sont pas comptées comme de nouvelles collectes réussies. En PR, les validations bloquent sur les erreurs de code ou de données, tandis que les pannes de sources sont exposées dans le résumé de collecte. En production, une collecte incomplète reste un échec surveillé. Le workflow joint les observations et échecs à son artefact, publie les données réussies et expose les erreurs via le suivi existant des automatisations.

Les offres Saxo sont exclues des textes à partir du lendemain de leur échéance ; elles n’apparaissent pas avant leur date de début. Le calendrier de revue reprend leurs échéances propres. Une restriction de transfert applicable aux positions déjà achetées reste décrite après la fin d’une promotion.

## Vérifications

Tests de parseurs sur les brochures officielles capturées et un extrait HTML de la table France IBKR : bonnes colonnes et marchés, exemption de minimum PEA XTB, garde XTB à 0,02 % et non 2 %, dates, modification d’un taux et conservation après panne. La fixture Bourse Direct est synthétique et teste seulement la structure attendue ; elle ne constitue pas une collecte réussie.

Collecte réelle : sept barèmes et 20 champs complémentaires réussis ; seul Bourse Direct échoue en HTTP 502.

Tests des consommateurs pour les sept courtiers, tous les compléments et l’expiration des offres. Audits des preuves, de la provenance, du catalogue et du calendrier. Les contrôles navigateur couvrent les sept tableaux et publications ainsi que le format mobile ; ils sont exécutés dans la CI de déploiement.

## Reste à faire

- Rétablir un téléchargement officiel exploitable de Bourse Direct et qualifier réellement son connecteur avant d’ajouter une observation automatisée.
- Qualifier Direct Price, garde et transferts Trade Republic ; change boursier Crédit Agricole Île-de-France.
- Étendre la collecte aux conditions de transfert entrant Saxo/XTB/Crédit Agricole et aux autres offres, avec leur portée et leurs justificatifs.
- Les conditions PEA/PEA-PME/Jeune, IFU, cash et disponibilité des investissements programmés restent suivies dans les preuves éditoriales. Elles ne sont pas recertifiées par une brochure de frais.

Les autres chantiers de la roadmap générale restent distincts : ACPR, PEE/PER et fiscalité immobilière, QYLD distribuant, compositions exactes de trois indices et historiques des parts récentes.
