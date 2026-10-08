# Accès officiels et qualification PEA — 8 octobre 2026

La collecte des données économiques et des courtiers utilise désormais macOS 15 sur GitHub. Les essais réels ont isolé un problème d'accès depuis les runners Ubuntu : le rapport ACPR et la brochure Bourse Direct échouent sur Ubuntu 26.04, alors qu'ils sont téléchargés sur macOS. Windows et Ubuntu ARM téléchargent le PDF Banque de France, mais Bourse Direct y expire. Le déploiement Pages conserve son runner existant.

## Accès et preuves

- ACPR : tentative du PDF découvert sur son domaine, puis du même chemin sur `www.banque-france.fr`. L'observation enregistre le domaine ayant réellement servi le fichier. Les deux téléchargements officiels du rapport 2025 ont la même empreinte SHA-256 : `753776e04ee3401c67b52f5bd55fb7a9ad05135fe473eb8693e711391cb3158d`.
- Les catalogues ACPR restent refusés dans les essais GitHub. Le rapport connu n'est réutilisé qu'après un nouveau téléchargement et uniquement pour le dernier millésime annuel complet. Dès que ce millésime devient ancien, une découverte réussie est requise : aucune année nouvelle n'est inventée.
- Bourse Direct : brochure officielle du 6 janvier 2026 téléchargée sur macOS, empreinte PDF `702ca3db2562f59b072d709df2e36bf12f13e5f425930d23fd1a8e30b327161e`. La fixture réelle remplace la seule qualification synthétique : colonnes PEA Euronext, change avec exception autres marchés, garde étrangère annuelle et transfert sortant cotés/non cotés sont lus séparément. Les 25 €/ligne du CTO étranger ne sont pas attribués au PEA.
- Première collecte complète de courtiers sur macOS : huit barèmes et treize sources fiscales validés, aucune panne de source. La construction a ensuite révélé une résolution ambiguë entre `VideoExport.jsx` et `videoExport.js` sur macOS ; les deux imports portent désormais leur extension explicite.

## Conditions PEA

La couverture passe à huit courtiers et 31 champs complémentaires.

- Trade Republic : les transferts entrants et sortants sont revalidés dans l'annexe France du contrat courant. L'entrée d'un PEA contenant des titres non cotés reste refusée. Le mois publié du contrat est conservé sans inventer de jour ; les contrats futurs ou régressifs sont rejetés. La clause ne chiffre pas les frais PEA : aucun zéro n'est déduit des pages CTO.
- Crédit Agricole Île-de-France : la page régionale revalide le transfert entre banques avec conservation de l'antériorité fiscale. Les frais entrants et un remboursement éventuel restent à confirmer auprès de la caisse. Le change boursier reste non établi ; la commission bancaire générale de 0,05 % n'est pas substituée.
- La preuve de gratuité de garde Trade Republic porte sur le CTO. Le tableau et la publication PEA indiquent désormais « À confirmer sur PEA » ; la preuve est partielle. L'ancien lien d'aide 2847 ne répond plus. La grille complète est annoncée dans l'application par l'aide officielle 1577 ; aucun accès connecté ni clé n'est utilisé.

## Vérifications et reste à faire

16 tests économiques et 11 tests courtiers couvrent le miroir officiel, la conservation après panne, les dates, les colonnes PEA/CTO et les clauses de transfert. Le contrat France de 231 pages extrait 2,6 Mo de texte : sa seule URL officielle bénéficie d’une limite de 4 Mo ; les brochures conservent la limite de 2 Mo. Les dépassements sont rejetés et testés. Les consommateurs, le catalogue, la provenance et le build sont vérifiés. Les workflows exécutent également des collectes réelles avant de publier leurs observations.

Restent non qualifiés : découverte annuelle ACPR depuis les catalogues GitHub ; frais de garde et de transfert propres au PEA Trade Republic ; change boursier et conditions financières d'entrée CA Île-de-France. Les caractéristiques peu variables des instruments restent hors des priorités.
