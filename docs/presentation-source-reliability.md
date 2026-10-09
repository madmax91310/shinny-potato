# Qualification des sources de présentation — 9 octobre 2026

Les collecteurs partagent une lecture HTTP avec au plus trois tentatives sur les erreurs réseau et les réponses 408/429/500/502/503/504. Les réponses vides, 404 et erreurs de parsing ne sont pas réinterprétées comme des données valides. Le remplacement reste atomique par fiche.

## Linxea Vie

Le lien « conditions générales du contrat » de la page officielle fournit https://www.linxea.com/document/conditions-generales-linxea-vie/. La page 2 des dispositions essentielles indique la garantie des droits exprimés en euros et les frais maximaux de 0,75 % sur Eurossima et Netissima. La garantie annuelle minimale calculée est 100 − 0,75 = 99,25 %, hors garantie optionnelle décès. Elle ne constitue pas une garantie fixe du montant initial sur plusieurs années.

Le parseur vérifie l’identité Linxea Vie / Generali Vie, la clause de garantie, les frais de chaque fonds et leur cohérence avec la page du distributeur. Le fichier de régression `scripts/fixtures/linxea-vie-essential.txt` reprend uniquement les dispositions essentielles de la notice publique consultée le 9 octobre 2026.

## CORUM Origin et XL

Les bulletins T2 2026 liés depuis les pages officielles de documentation n’ont aucune couche de texte extractible, y compris leurs copies d’archive. La page 4 de chaque bulletin a été rendue et vérifiée visuellement ; la période est recoupée avec le bulletin et sa page 3. Les allocations sont exprimées en pourcentage de la valeur du patrimoine. Le TOF comprend les loyers facturés et facturables et les locaux sous franchise de loyer ; il ne devient pas un taux d’occupation physique.

`scripts/corum-quarterly-qualified.json` contient les valeurs qualifiées, l’URL officielle, la période, la page, la date de qualification et le SHA-256 des octets du PDF. Le collecteur découvre le dernier bulletin achevé depuis la page officielle et vérifie l’empreinte avant de réutiliser ces observations. Les pays et secteurs passent ensuite les contrôles communs de somme, valeurs et dates. Les rapports annuels continuent de fournir les distributions et les prix historiques.

Un PDF différent, corrigé ou d’un trimestre suivant déclenche un échec de qualification, conserve l’ensemble de la fiche précédente et rend l’erreur visible dans « Données à revoir ». Cette méthode ne prétend pas automatiser la lecture de nouveaux bulletins dessinés. Pour qualifier une nouvelle publication : vérifier visuellement les pages, leurs dates et leurs périmètres, enregistrer les valeurs et le SHA-256 correspondant, puis lancer les tests et une collecte réelle.

## Signalement

Le workflow de statuts lit les artefacts `scpi-observations` et `insurance-observations`. Les échecs contiennent la fiche concernée et leur cause. Une collecte réussie retire uniquement les erreurs des fiches effectivement récupérées ; l’ancienne valeur conservée après un échec n’est jamais considérée comme une récupération.
