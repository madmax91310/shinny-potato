# Reprise des alertes et renouvellements — 19 octobre 2026

Base : ef9632a2a044621c5f7d23de52e832f510a72f51. Périmètre demandé : actualiser/trier les alertes et corriger les collectes restantes. La branche de #799 n'est pas modifiée.

## Diagnostic vérifié

L'état automation-status, révision 136, contrôlé à 01:26 UTC, comporte 234 incidents : 185 signalements de données d'entreprises, 41 contrôles PEA/cotations, un ancien échec mensuel, six publications anciennes non rapprochées et une automatisation sans exécution documentée. Un incident n'est pas nécessairement une valeur fausse.

Le run mensuel 39163451913 a validé et enregistré les autres séries, mais le taux croisé TWD a expiré. Le moniteur 39168760984 n'a pas enregistré ce run : monthly-observation.json pèse 523 898 629 octets, au-delà de son enveloppe de 8 Mo. Le moniteur conserve ainsi le run mensuel 39137179979, plus ancien. Les six alertes de publication n'ont pas de reçu : elles ne sont pas effacées sans comparaison des octets ou preuve d'ascendance d'un instantané complet.

## Corrections

- Le rapport mensuel exporté contient uniquement l'identifiant, le statut, la cause, la période et l'empreinte de réponse. Les séries, preuves et contrôles restent dans les registres habituels ; aucun seuil de lecture n'est augmenté.
- Un rapport illisible produit un incident propre, puis la lecture continue pour les autres rapports. Sa lecture réussie retire uniquement cet incident.
- Les cotations officielles sans symbole Reuters restent documentées sans inventer de symbole de collecte. Ajout des libellés exacts SIX Swiss Ex, Bolsa Mexicana De Valores, Cboe Europe et Santiago Stock Exchange.
- Lecture du tableau Vanguard dont la place figure au-dessus de la ligne devise/ticker. Amsterdam nécessite le libellé isolé et le RIC .AS.
- Les documents multi-instruments ne qualifient une cotation que si l'ISIN exact figure dans sa propre ligne. Les caractéristiques ambiguës restent refusées.
- Les tables complémentaires sont réunies sans écraser les preuves de chaque ligne ; une contradiction de symbole reste bloquante.
- Lecture des mentions explicites PEA allemandes et françaises longues. L'absence de mention n'est jamais convertie en non-éligibilité.

## Reprise réelle

Le 19 octobre, le change BCE/TWD a été repris et les 333 mois recomposés avec succès. Quarante instruments signalés ont fait l'objet d'une collecte ciblée, puis les nouveaux parseurs ont été rejoués sur les documents effectivement téléchargés ce jour, avec empreintes conservées. Aucune date n'est renouvelée sans observation de son champ.

À date du 19 octobre et sur cet instantané, le rapport régénéré compte 34 statuts PEA au contrôle récent (17 en retard), et 229 instruments dont toutes les cotations documentées sont récentes (13 en retard). Ce décompte n'est pas directement soustractible de l'issue du 18 octobre : de nouvelles échéances ont franchi leur limite pendant la nuit. Les 16 instruments sans cotation et 207 statuts PEA non documentés restent distincts des retards.

## Limites conservées

Les 30 retards PEA/cotations restants exigent une source exacte publiant le champ, une correction supplémentaire de lecture ou une confirmation de la cotation historique. Les prévisions/comptes d'entreprises restent hors du lot 1–2 ; ils ne sont pas déclarés réparés. QYLD conserve sa limite d'identité multi-parts. Les publications anciennes sans reçu doivent être rapprochées par le moniteur avant de disparaître. La finalisation de #799 est confiée à l'autre conversation.

## Validation et livraison

Tests ciblés Python du suivi et des nouveaux cas, collecte mensuelle et métadonnées ; audit des preuves des cotations ; cohérence du change ; consommateurs mensuels et raccordements ; compilation avec budgets. Le navigateur local ne peut pas être installé (archive Chromium tronquée) : le portail navigateur GitHub reste obligatoire avant fusion. Le statut de fusion/publication est à contrôler sur la PR et build-info.json, pas déduit de ce document.
