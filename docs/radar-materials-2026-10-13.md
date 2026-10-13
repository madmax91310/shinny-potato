# Diagnostic radar #545 — Xtrackers MSCI World Materials

ISIN : IE00BM67HS53. Contrôle du 13 octobre 2026.

## Résultat

Les deux alertes ne constituent pas une preuve de changement économique de
composition. La source DWS présente des répartitions contradictoires pour le
même instantané du 7 octobre, à positions et poids du top dix identiques.
Linde explique arithmétiquement la totalité du transfert Irlande/Royaume-Uni
entre ces deux versions. Le JSON actuel confirme Linde en Irlande ; l'ancien
pays reste une déduction, car les réponses historiques intégrales ne sont pas
archivées. Ne pas publier une rotation de portefeuille sur cette base.

## Observations conservées dans Git

| Commit de `src/data/automated-etf.json` | Date DWS | Irlande | Royaume-Uni | Linde |
|---|---|---:|---:|---:|
| `3a10ab7ced5af6e74c6202f356607cbe25a3252a` | 02/10 | 10,464842 % | 2,628403 % | 7,76587276 % |
| `db614bc97adcde21cbef7995a83b12c3b8dec270` | 07/10 | 2,953832 % | 10,452539 % | 7,83252233 % |
| `6d54847a3e4ae9ed155c86c64fff6931da929516` | 07/10 | 10,786354 % | 2,620017 % | 7,83252233 % |

Empreintes SHA-256 du JSON officiel, calculées avant agrégation :

- 02/10 : `18803d600905b3ed676f552c86ad6196d9b92da5db4b6ed23be08823cb770317`.
- 07/10, variante : `a44766e2a7458994f0ae2d65fbe365aafa3df40bc8c3a10ce5b7b83f794b50dc`.
- 07/10, réponse actuelle : `996d5fc0e61f66cfcbe1361125d9ebd9078408219a1bbf875fcd9c716aa43bc8`.

La fixture `scripts/fixtures/radar-materials-2026-10.json` contient les agrégats,
les dix positions, dates, empreintes et commits. La réponse officielle lue le
13 octobre est conservée intégralement dans
`scripts/fixtures/official-documents/dws-materials-2026-10-07.json` ; son empreinte
reproduit exactement celle du troisième relevé.

Les dix ISIN et poids sont identiques entre les deux versions du 7 octobre.
Plusieurs noms sont néanmoins reformulés, dont LINDE PLC / Linde PLC,
NEWMONT / Newmont Corporation et SHERWIN WILLIAMS / Sherwin-Williams Co.
La fonction `parse_holdings` conserve le pays `column_3`, sans inférence depuis
l'ISIN ni table de pays maison. Les changements de collecteur pendant cette
période concernent notamment les parts de fonds et les encours ; aucune règle
spécifique à Linde ne réattribue son pays.

## Lignes explicatives et limites

Entre les deux réponses du 7 octobre :

- Irlande : +7,832522 points ; Royaume-Uni : −7,832522 points.
- Linde, `IE000S9YS762` : 7,83252233 %, pays actuel DWS « Ireland ».
- Un test déplace uniquement le pays de cette ligne vers « United Kingdom »
  dans une copie synthétique du JSON actuel : il reproduit exactement les
  deux agrégats de la variante. Ce test ne transforme pas cette copie en
  archive officielle et ne prouve pas l'absence de compensations entre des
  positions historiques hors top dix.

Le mouvement du radar entre 02/10 et 07/10 est décomposable ainsi :

- Irlande : +0,321512 point entre les réponses de même type, puis
  −7,832522 points de différence de classification = −7,511010 points.
- Royaume-Uni : −0,008386 point, puis +7,832522 points = +7,824136 points.

Le chiffre exact du Royaume-Uni n'est donc pas +7,825 points : l'arrondi
séparé des poids avant soustraction explique cet écart apparent.

Linde passe de 7,76587276 % à 7,83252233 % entre les deux dates : +0,06664957
point. Les neuf autres grandes positions restent présentes avec des poids
proches. Ces données ne permettent pas d'attribuer tous les petits écarts
nationaux hors top dix, ni de certifier les transactions réalisées.

Autre indice indépendant : le 2 octobre, le Royaume-Uni apparaît aussi à
6,076618 % dans `1973b1dc642b22ff2ebdfda4d6931e97e79a1fe3`, contre 2,628403 %
dans la réponse retenue. La différence de 3,448215 points correspond au poids
de Rio Tinto (`GB0007188757`, 3,44821496 %). Le JSON actuel attribue Rio Tinto à
l'Australie malgré son ISIN GB. Le pays de l'ISIN ne suffit donc pas à définir
une exposition économique ou le pays retenu par le fournisseur.

## Erreur démontrée du radar et correction

La branche `radar-data` archive depuis le 12 octobre 18:34 UTC les contradictions
pour l'Irlande et le Royaume-Uni au 7 octobre. Pourtant les événements
`841938e5f070c84ec014f3ae` et `fb756372a30704ac8cdc09c7` restaient publiables : le
garde-fou retirait seulement les événements à dates avant/après identiques.

La correction invalide rétroactivement tout mouvement dépendant d'un instantané
contradictoire, garde les preuves et identifiants, bloque les relances et
rétablit une base saine à la période suivante, même sous le seuil de 2 points.
Elle ne choisit pas arbitrairement un pays et ne modifie pas les données DWS.
Les alertes sur d'autres champs, produits ou méthodes restent actives.

Validation : suites radar et notifications ; 22 tests des documents sources ;
rejeu de l'état réel `radar-data` retirant les deux événements du flux et des
notifications sans créer de nouveaux signaux.

## Intérêt éditorial

Pas de publication affirmant un transfert de 7,8 % du portefeuille vers le
Royaume-Uni. Un angle pédagogique est pertinent : « Un pays qui gagne huit
points dans un ETF ne signifie pas forcément huit points d'achats ». Expliquer
le rôle des nomenclatures, l'exemple Linde et la distinction entre pays
attribué aux titres et exposition économique des entreprises. Présenter le
pays ancien de Linde comme une attribution déduite, pas une ligne historique
vérifiée. Aucune publication automatique n'est effectuée.

Sources : [issue #545](https://github.com/madmax91310/shinny-potato/issues/545),
[API officielle DWS](https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HS53/holdings),
commits et fixtures ci-dessus.

## Validation en ligne du radar

Le contrôle GitHub général a révélé un blocage indépendant : le flux RSS
particuliers Service Public syndique aussi des articles du portail officiel
`entreprendre.service-public.gouv.fr` (taxe sur les salaires, Urssaf).
Le parseur ignore désormais uniquement les liens HTTPS d'actualités de ce
portail professionnel connu ; les sources autorisées ne sont pas élargies et
les liens inconnus, trompeurs ou avec identifiants continuent à être rejetés.
Un test conserve l'article particuliers du même lot et vérifie ces rejets.
