# Identités de cotation VanEck : cinq trous réellement comblés

Les réponses officielles du 29 octobre, y compris les téléchargements « All Holdings » XLSX, omettent cinq ISIN. Le collecteur physique partagé conserve les livres natifs et complète uniquement l'identité d'une ligne si deux requêtes indépendantes OpenFIGI concordent exactement : ticker **avec place composite et devise publiées**, puis ISIN candidat avec les mêmes place/devise. FIGI de cotation, composite FIGI, shareClassFIGI, ticker, marché et type Common Stock doivent tous correspondre, avec un seul ISIN possible. Le nom n'est pas utilisé pour attribuer l'identité. Les candidats sont sourcés dans les livres déjà qualifiés du dépôt ; leurs pondérations ne sont jamais importées.

| Fonds | ISIN du fonds | Identités restituées | Poids natifs concernés |
| --- | --- | --- | --- |
| VanEck Defense | IE000YYE6WK5 | VVX US → US92242T1016 | 0,49 % |
| VanEck Global Mining | IE00BDFBTQ78 | USA CN → CA03062D8035 ; MLX AU → AU000000MLX7 ; SLS CN → CA83419D2014 ; ARU AU → AU000000ARU5 | 0,04 + 0,04 + 0,04 + 0,03 % |

Lecture réelle locale : 44/44 positions identifiées dans Defense et 184/184 dans Global Mining. Les sommes publiées restent respectivement **100,02 % et 99,94 %**, sans renormalisation. Defense conserve donc le refus actuel d'un taux de recouvrement intégral lorsque sa somme publiée excède 100 % ; ce travail n'assouplit aucun seuil et ne prétend pas résoudre cet arrondi.

Le cache existant `security-identifier-observations.json` reçoit les preuves dans un espace `venueTickerObservations`, séparé des clés SEDOL. L'empreinte et la date du livre natif, le fonds et la cotation sont conservés. Un nouveau livre exige un nouveau rapprochement ; si ce renouvellement échoue, une preuve historique encore admissible peut seulement continuer à identifier la même cotation, avec sa date et son empreinte initiales. Une preuve expirée n'est pas utilisée, une cotation ambiguë reste non identifiée, et la panne figure dans `identitySourceFailures`. Aucun poids financier d'un ancien livre n'est mélangé au nouveau.

Même collecte partagée, même workflow ordinaire et archivage des preuves ; aucun nouvel actif, profil ou workflow. Les fixtures compressées conservent les octets natifs des deux livres et les cinq paires de réponses OpenFIGI. Sept tests couvrent les requêtes réelles, les erreurs de place/devise/classe/FIGI, les ambiguïtés, le binding de la source, l'expiration, l'échec de renouvellement et la conservation des poids dans le collecteur. Les résultats GitHub et de publication sont consignés dans la PR après exécution, sans anticiper leur réussite.
