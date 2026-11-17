# Présentation des investisseurs : densité et série éditoriale

Base : master fd5cbf64986cc171d207d59fe0e5af3dc2582e99, branche isolée `fix/investor-editorial-series`.
Instructions CLAUDE.md et audit du 18 octobre relus ; code, données, médias et rapports des PR #1344, #1348, #1356 et #1359 examinés. Les PR concurrentes #1298, #1253 et #1061 restent intactes. Aucun calendrier, outil Budget/DCA, collecteur, observation financière, sauvegarde ou historique n’est modifié. Les fichiers de projection régénérés pendant le build ne sont pas intégrés à cette PR.

## État des 28 profils et calculs

Le site initial sert le code 77bd0158205833dddb6a129db9f4304ec0e139bb et les données fd5cbf64986cc171d207d59fe0e5af3dc2582e99. Le diff de ces deux commits ne touche pas le code/média investisseurs. Les deux états complets sont conservés dans `reports/investor-series-2026-11-17/before.json` et `after.json` : lignes sources et admissibles, portrait, toutes les positions connues regroupées (identifiants, classes et montants), valeur entière d’Autres, dénominateur entier, poids non arrondi, nombre regroupé, images éditoriales/détaillées et blocage financier. Les pourcentages du tableau ci-dessous sont arrondis uniquement pour sa lecture ; le rapport conserve les montants exacts.

« Autres » désigne exclusivement des positions connues admissibles regroupées. Zéro position admissible inconnue n’est ajoutée. Les options restent séparées dans l’application et dans les exports, avec leur dénominateur original. Les classes ne sont pas fusionnées. Les deux relevés non qualifiés ne reçoivent ni synthèse ni série monétaire ; leurs données et exports détaillés marqués incomplets restent consultables.

| Profil | Positions sources / hors options | Nommées avant → après | Autres avant → après | Portrait après | Compléments éditoriaux |
| --- | ---: | ---: | ---: | --- | ---: |
| morfit | 18 / 18 | 10 → 13 | 13.2646 % → 4.7691 % | nom de remplacement | 1 |
| dorsey | 11 / 11 | 11 → 11 | 0.0000 % → 0.0000 % | nom de remplacement | 0 |
| vinall | 13 / 13 | 8 → 12 | 2.3762 % → 0.0600 % | nom de remplacement | 1 |
| marks | 145 / 138 | 7 → 11 | 59.6700 % → 50.8081 % | photo | 2 |
| watsa | 34 / 34 | 7 → 9 | 17.0958 % → 12.0081 % | photo | 2 |
| gavin-baker | 49 / 46 | 6 → 12 | 33.5220 % → 19.5905 % | nom de remplacement | 2 |
| einhorn | 46 / 46 | 4 → 12 | 65.0934 % → 42.0531 % | nom de remplacement | 2 |
| halvorsen | 90 / 90 | 7 → 13 | 72.3986 % → 57.1703 % | nom de remplacement | 3 |
| gerstner | 20 / 20 | 10 → 14 | 16.7191 % → 5.7052 % | photo | 1 |
| gayner | 145 / 145 | 7 → 13 | 64.9380 % → 50.2032 % | nom de remplacement | 3 |
| tepper | 27 / 25 | 10 → 15 | 18.3882 % → 7.4876 % | photo | 1 |
| ackman | 14 / 14 | 11 → 12 | 1.6291 % → 0.8609 % | photo | 1 |
| berkshire | 29 / 29 | 9 → 14 | 14.7412 % → 3.7878 % | photo | 2 |
| cathie-wood | 182 / 181 | 5 → 8 | 75.6986 % → 65.9905 % | photo | 3 |
| thiel | 8 / 8 | 8 → 8 | 0.0000 % → 0.0000 % | photo | 0 |
| druckenmiller | 95 / 86 | bloqué | bloqué | nom de remplacement | 0 |
| loeb | 43 / 42 | 7 → 15 | 52.4549 % → 22.2137 % | nom de remplacement | 2 |
| aschenbrenner | 26 / 23 | 7 → 10 | 15.4426 % → 7.8986 % | nom de remplacement | 2 |
| li-lu | 8 / 8 | 8 → 8 | 0.0000 % → 0.0000 % | photo | 0 |
| gates-trust | 24 / 24 | 8 → 11 | 8.0336 % → 4.1036 % | photo | 2 |
| klarman | 21 / 21 | bloqué | bloqué | photo prête, inutilisée | 0 |
| terry-smith | 41 / 41 | 6 → 14 | 65.5202 % → 30.8350 % | nom de remplacement | 2 |
| pabrai | 4 / 4 | 4 → 4 | 0.0000 % → 0.0000 % | photo | 0 |
| hohn | 11 / 11 | 8 → 11 | 4.4692 % → 0.0000 % | photo | 0 |
| baker-bros | 84 / 84 | 8 → 12 | 34.1843 % → 21.6068 % | nom de remplacement | 2 |
| icahn | 10 / 10 | 5 → 9 | 3.1512 % → 0.4288 % | photo | 1 |
| laffont | 73 / 73 | 10 → 13 | 44.1043 % → 34.0574 % | nom de remplacement | 2 |
| renaissance | 3151 / 3151 | 3 → 7 | 94.9154 % → 90.5205 % | photo | 3 |

## Cause et correction

La contrainte de déplacement angulaire des pastilles (±0,22 radian) rejetait les petites positions voisines très tôt, indépendamment de la surface disponible. Les noms et montants individuels occupaient ensemble deux à trois lignes. Le moteur conserve le grand donut de 760 px, les noms à 36 px, les pastilles rondes et les angles exacts. Il autorise un déplacement modéré (±0,65 radian), retire les montants individuels de la périphérie (conservés dans le texte, l’application et les détails), et cherche le maximum de positions que les noms, pastilles, couleurs distinctes et trajets de liaison permettent, sans minimum imposé ni plafond de douze. Les noms continuent à envelopper les mots et les classes restent distinctes. Les traits de secteur sont dessinés sous l’ensemble des pastilles, sans repeindre leurs pourcentages. Tout nom éloigné exige un trajet validé qui contourne textes, autres pastilles et autres traits ; un placement sans liaison possible est rejeté. Les trajets sont réservés avant les logos extérieurs. Le solde est explicitement « Autres · N positions ».

Renaissance conserve sept positions dans sa synthèse : forcer douze grandes pastilles dans 13,4 % du cercle produit une association illisible. La série montre les positions suivantes sur trois pages de barres, soit quatre images au total. Les autres séries utilisent uniquement les compléments nécessaires, au maximum quatre images pour X. Les barres portent les poids sur le portefeuille admissible complet ; leur longueur compare les positions de la page, sans masquer le pourcentage exact. La couverture du top douze est calculée à partir des valeurs entières ; elle est affichée sur les pages complémentaires et dans les synthèses dispersées. Les milliers de lignes et centaines d’images de l’archive Renaissance ne deviennent pas un carrousel de publication.

La navigation et le téléchargement de la série restent séparés du ZIP exhaustif. Les boutons PNG utilisent le rendu de la page choisie, partagé avec l’aperçu. Un relevé différent remet la série sur la synthèse. Le détail intégral est chargé à l’affichage pour conserver le budget de route, sans changer son contenu. Les allocations modèles conservent leur rendu.

## Photographies et droits

Quatre représentations auparavant absentes sont activées. Originaux photographiques et détourages sont conservés avec cache par empreinte ; le pipeline u2netp existant produit le masque. L’empreinte de l’original et celle liée au cadrage sont vérifiées avant réutilisation. Aucune génération de visage. Les PNG autonomes contiennent désormais un bloc iTXt UTF-8 avec provenance, auteur, licence et URL de licence, adaptation, attribution d’entité et valeurs de la sélection. Les JSON/ZIP exhaustifs conservent aussi les crédits.

| Profil | Photo et auteur | Licence / identité / adaptation |
| --- | --- | --- |
| Pabrai | [Guy Spier with Mohnish Pabrai](https://commons.wikimedia.org/wiki/File:Guy_Spier_with_Mohnish_Pabrai.jpg), AbrahamAumann | CC0. La personne à gauche est Pabrai ; cadrage [130,480,740,1250] sur l’original 1440×1800, puis détourage. Guy Spier exclu. |
| Li Lu | [LiLuJI1](https://commons.wikimedia.org/wiki/File:LiLuJI1.jpg), Joi / Joichi Ito | CC BY 3.0 choisie parmi les licences proposées. Identification de l’auteur et de sa galerie ; cadrage [1500,650,2650,2634], bras et personne arrière exclus. Crédit dans le PNG et métadonnées. |
| Gates Foundation Trust | [Bill Gates 2023](https://commons.wikimedia.org/wiki/File:Bill_Gates_-_2023_-_P062021-967902_%28cropped%29.jpg), Commission européenne / Lukasz Kobus | CC BY 4.0. Source existante réutilisée, détourage. Bill Gates identifié « trustee », association [officielle au trust](https://www.gatesfoundation.org/about/financials/foundation-trust). Le titre et les avoirs restent ceux du trust, dont les gérants indépendants sont distincts. Aucun logo Gates sans autorisation. |
| Renaissance | [Jim Simons at MSRI](https://commons.wikimedia.org/wiki/File:Jim_Simons_at_MSRI.jpg), Gleuschk | CC BY-SA 3.0 ; détourage sous la même licence. Personne identifiée « Jim Simons · fondateur (1938–2024) », lien historique [documenté par la Simons Foundation](https://www.simonsfoundation.org/news/simons-foundation-co-founder-mathematician-and-investor-jim-simons-dies-at-86/). Ni gestion actuelle ni patrimoine personnel attribués à Simons. |

Les snapshots des descriptions Commons et de l’association Gates sont archivés dans le dossier de preuves. Le registre des portraits et les PNG détourés ne sont consommés que par cet outil et son rafraîchisseur ; aucun registre de logos partagé n’est modifié.

### Recherches et limites conservées

Les recherches du 17 novembre ont croisé noms exacts, photographie, Commons/Flickr et droits de réutilisation. Un site officiel accessible n’accorde pas automatiquement une licence. Les crédits de sites agrégateurs n’ont pas été traités comme des autorisations.

| Profil sans photo activée | Source examinée / motif précis |
| --- | --- |
| Morfit | [ValueAct](https://valueact.com/) et photo NurPhoto #11922520 (Xavier Collin / Image Press Agency). Photo payante à droits gérés ; aucune licence acquise. |
| Dorsey | [Dorsey Asset Management](https://dorseyasset.com/). Portrait officiel, pas de licence ouverte ni d’autorisation établie. |
| Vinall | [RV Capital](https://www.rvcapital.ch/). Portraits et documents officiels, droits de republication photographique non établis. |
| Gavin Baker | [Atreides](https://www.atreidesmgmt.com/) / profil officiel et conférences. Pas de licence photographique ouverte établie. Le fichier Commons « Gavin Baker - 100 0042 (by) » concerne un militant Creative Commons homonyme, écarté. |
| Einhorn | [Cornell Tech](https://tech.cornell.edu/news/david-m-einhorn-president-of-greenlight-capital-joins-the-council-at-cornell-tech/) / Einhorn Collaborative / SKAGEN. Identité plausible mais permission non établie. Le « David Einhorn.jpg » de Commons représente un rabbin du XIXe siècle, écarté. |
| Halvorsen | [Viking Global](https://www.vikingglobal.com/) / conférences. Pas de licence photographique vérifiée ; les résultats du golfeur homonyme sont écartés. |
| Gayner | [Coca-Cola, Thomas Gayner](https://www.coca-colacompany.com/about-us/board-of-directors/thomas-gayner) et Museum of American Finance. Photographies réelles, pas d’autorisation de republication établie. |
| Loeb | [Third Point](https://www.thirdpoint.com/). Droits non établis. Le fichier Commons « Daniel Loeb, Third Point.jpg », CC BY 3.0, est un dessin signé Singh, vérifié visuellement et écarté de la demande photographique. |
| Aschenbrenner | [The Rhine Group](https://www.rhinegroup.eu/members/leopold-aschenbrenner) / podcast Dwarkesh. Aucune licence de la photographie établie. L’ornithologue homonyme est écarté. |
| Terry Smith | [Fundsmith](https://www.fundsmith.co.uk/sef/about-us/). Photo officielle sans permission documentée. Le fichier Commons « Terry Smith.jpg » représente le guitariste, et les photos MNZM un autre homonyme : écartés. |
| Laffont | [Coatue](https://www.coatue.com/) / Milken Institute / photographies de conférences payantes. Aucun cliché réutilisable confirmé ; l’artisan homonyme est écarté. |
| Baker Bros. | [Felix Baker / Stanford](https://news.stanford.edu/stories/2017/08/stanfords-board-trustees-elects-two-new-members). Droits non établis pour la photo ; pas de logo autorisé confirmé. Le nom de l’entité reste la représentation, sans attribuer les avoirs aux frères personnellement. |

Druckenmiller reste aussi sans photo réutilisable validée, en plus de son blocage financier. Le portrait Klarman reste prêt mais inutilisé. Au total, 14 des 26 synthèses financières disponibles ont une photographie, contre 10 auparavant ; 12 gardent un remplacement propre par nom. Les limites de cadrage des anciennes photos, dont le masque de Cathie Wood et celui de Gates, restent celles de photographies réelles, sans reconstruction de visage.

## Vérifications et livraison

Les références de PR, portail GitHub, fusion, déploiement et recette publique sont consignées dans la description de la PR après constat effectif. La compilation ou la fusion seules ne constituent pas une fin de chantier. Aucune publication sur X.
