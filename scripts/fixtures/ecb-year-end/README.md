# Dernière référence BCE de l’année — contrôle du 15 novembre 2026

Le collecteur acceptait un taux daté de moins de sept jours avant le 1er janvier. Une réponse arrêtée au 30 décembre pouvait donc être considérée comme définitive alors que le 31 était une séance TARGET. Le test reproduit ce défaut sans modifier de donnée de production.

La BCE publie ses références chaque jour ouvré sauf les jours de fermeture TARGET :
https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html

Le calcul porte seulement sur la fin de décembre : samedi/dimanche, Noël et 26 décembre. Deux fermetures historiques exceptionnelles du 31 décembre sont explicitement documentées :
- 1999 : https://www.ecb.europa.eu/press/pr/date/1999/html/pr990331.en.html
- 2001 : https://www.ecb.europa.eu/press/pr/date/2000/html/pr000525_2.en.html

`source-evidence.json` contient les empreintes et extraits réellement téléchargés. L’historique XML courant passe le contrôle pour les 27 années 1999–2025, sans modifier aucun taux ni aucune borne déjà publiée.

La fixture XML existante `../official-documents/remaining-aum/ecb-eurusd.xml` reste la régression financière. Les mutations du test restent en mémoire : décembre incomplet, week-end, fermetures exceptionnelles, 1er janvier 2027, réponse définitive et répétition. Aucune performance ou donnée 2026 n’est créée dans les registres.

Le producteur ETF ordinaire consulte la BCE chaque jour à 07:10 UTC. Une borne absente provoque toujours un échec explicite et conserve le fichier précédent ; le passage suivant réessaie. Le contrôle local ne prouve ni le passage GitHub ni le cron de janvier 2027. La preuve réelle de décembre 2026 reste à acquérir.
