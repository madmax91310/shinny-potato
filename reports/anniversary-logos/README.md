# Logos « Il y a X ans » — 116 actifs vérifiés

La correction couvre **116 actifs distincts**. Chaque logo a une source officielle
documentée et un
fichier local ; aucun logo n’est dessiné, généré ou récupéré auprès d’un agrégateur.
Les [sources, variantes et empreintes SHA-256](../../public/asset-art/official-logos/sources.json)
renvoient aux sites des entreprises ou aux CDN qu’ils utilisent pour publier leurs
ressources. Les logos ne sont jamais téléchargés depuis ces sites pendant l’export.

Les entreprises supplémentaires comprennent notamment Qualcomm, Bank of America,
Adobe, Intel, Oracle, Salesforce, IBM, Goldman Sachs, Allianz, AXA, BNP Paribas,
Safran, Hermès, L’Oréal, Nestlé, PepsiCo, Danone, Novartis, Pfizer, Booking Holdings,
Samsung, UBS, HSBC, ING,
Capgemini, Renault, Philips, STMicroelectronics, Coinbase, Cloudflare et Reddit.
La [liste exhaustive](coverage.csv) identifie les 116 logos effectivement intégrés
et le rendu de chaque autre actif. ASML réutilise le fichier officiel déjà présent.

## Fidélité et intégration

Les tracés, couleurs, gradients d’origine et transparence sont conservés. Les
variantes sombres ou colorées appropriées au fond clair sont retenues ; les
variantes blanches illisibles, logos de partenaires, marques de produits et slogans
seuls sont écartés. Les canevas SVG sont ajustés autour de la géométrie complète,
avec une marge, sans retracer, étirer ni découper les marques. Les PNG conservent
leurs octets d’origine et sont plafonnés à leur résolution native.

Trois SVG officiels — Deutsche Börse, BNP Paribas et Danaher — contenaient un
`foreignObject` d’Adobe Illustrator non visible. Hébergé en HTTP, ce bloc empêchait
l’export du canvas dans Chromium. Seules ces métadonnées d’édition ont été retirées.
Les [captures avant/après sont strictement identiques](svg-authoring-cleanup.json).
Le contrôle du registre rejette désormais ces blocs et les dépendances externes.
Les [fins de ligne des fichiers SVG ont aussi été normalisées](svg-packaging-check.json),
avec vérification que tous les éléments et attributs de dessin restent identiques.

L’aperçu et les deux téléchargements partagent toujours le même moteur. Le logo
est chargé avant le rendu ; fichier absent/corrompu → texte propre, puis nouvelle
tentative possible. Les chiffres, calculs, unités, dates, textes et réglages sont
conservés. Les informations de provenance sont séparées du registre d’exécution
compact (environ 8 ko) pour respecter le budget de chargement de l’outil.

## Actifs sans fichier validé

Sur 689 actifs admissibles : **116 logos, 571 remplacements textuels et les deux
illustrations de matières premières (or/argent)**. Broadcom, Amazon, Alphabet,
Netflix, Nike et Disney font notamment partie des actifs restant en texte.
[Liste complète des actifs et du fichier utilisé](coverage.csv).

Cela signifie « aucun fichier officiel exploitable vérifié dans cette correction »,
pas « l’entreprise n’a pas de logo ». Aucun logo d’émetteur ne remplace un indice
ou un fonds. Le minimum de 100 est vérifié sur des actifs admissibles, des fichiers
et des pages officielles distincts ; les variantes d’une marque ne gonflent pas le
compteur.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| `npm run build`, compilation finale et audits de bundles/couverture | Réussis |
| Oxlint et répartition des contrôles CI | Réussis |
| `sync-anniversary-logo-registry.mjs --check` | 116 actifs admissibles, fichiers locaux, sources, empreintes et registre concordants |
| `test-anniversary-art.mjs` | 709 exports réussis : 689 actifs et 20 comparatifs ; chiffres, unités, labels, dimensions, textes longs, repli et reprise |
| Précontrôle HTTP sur le build de production | 116 logos décodés et exportables, sans canvas contaminé |
| `test-anniversary-logos.mjs` | Réussi : 234 aperçus et 468 téléchargements via les deux boutons sur ordinateur et mobile ; logos et commandes de texte identiques |
| Chargement retardé, changement d’actif, réponse obsolète, fichiers absents/corrompus et reprise | Réussis |
| Historiques partagés, textes éditoriaux et indices | Réussis |
| Préservation des autres outils | Les 719 identités de chacun des registres Performance, Néon et Investissement sont identiques à celles d’avant la PR ; masques indépendants du registre anniversaire |

Les contrôles en interface utilisent Chromium 1440 × 1000 et l’émulation iPhone 13,
pas un iPhone physique ni Safari. Ils vérifient les pixels des vrais PNG téléchargés
contre l’aperçu : pixels exacts de la zone du logo et commandes de texte identiques
(contenu, police, taille et position). Les empreintes complètes sont conservées comme
diagnostic : l’anticrénelage du texte peut varier entre deux canvas dans Chromium.
Les proportions, le centrage, les marges et l’absence d’effets ou d’images cassées
sont contrôlés séparément. Les contextes de navigateur sont renouvelés entre les actifs pour
borner la mémoire pendant les centaines de téléchargements. Les comparaisons
utilisent le canvas logiciel de Chromium pour limiter les variations de rendu.

Tous les chemins sont vérifiés sous `/shinny-potato/asset-art/` dans le build destiné
à GitHub Pages. Aucun déploiement n’a été effectué : les nouveaux fichiers ne sont
pas encore vérifiables sur le domaine public. Aucune fusion.

## Exemples visuels

Les cinq planches couvrent les 116 logos à partir des PNG réellement téléchargés
en interface, sans retoucher les marques. Les périodes restent celles de l’outil,
dont le tirage existant est conservé.

![Sélection de PNG téléchargés](examples/downloaded-pngs.png)

PNG originaux : [Nvidia](examples/nvidia.png), [Microsoft](examples/microsoft.png),
[Apple](examples/apple.png). Aperçus : [ordinateur](examples/desktop-preview.png),
[mobile](examples/mobile-preview.png).

[Résultats détaillés et empreintes des PNG](browser-results.json).

Les 116 logos, répartis sur cinq planches :

- [Planche 1](examples/catalogue-01.png)
- [Planche 2](examples/catalogue-02.png)
- [Planche 3](examples/catalogue-03.png)
- [Planche 4](examples/catalogue-04.png)
- [Planche 5](examples/catalogue-05.png)

[Collecte et exemples de ressources écartées](collection-summary.json).
