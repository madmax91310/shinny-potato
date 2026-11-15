# État intermédiaire — 15 novembre 2026, 13:00 UTC

#1312 est fusionnée (`dd9ce9ce`) après réussite complète de 18 jobs de validation. Son build master réussit. Le moniteur ordinaire confirme l’enregistrement des expositions ; les qualifications fournisseur et les anciennes publications restent séparées.

Le contrôle strict de publication détecte que la voie de secours sert encore l’ancien `automated-etf.json` : nouveaux champs `extractionMethod` et `identityNavAsOf` inconnus de l’ancien code. Les chiffres identiques dans un PNG ne prouvent donc pas la publication des nouvelles observations. La projection d’indices est, elle, à jour. Attendre la promotion du code validé et comparer le manifeste aux registres.

Un défaut de recette Budget interrompt la promotion concurrente : PNG encore en préparation à 5 s, mais réellement disponible à 7,112 s, puis 38 profils validés. #1313 attend explicitement la fin du rendu ; aucune maquette, valeur ou règle financière modifiée. Recette locale corrigée réussie, CI encore en cours.

Ces preuves sont intermédiaires : aucune clôture ni automatisation complète annoncée. Même suivi #881 ; rapports finaux à compléter après publication effective.
