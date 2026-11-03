# Cotations Invesco — 29 octobre 2026

L'incident `funds:etf-issuer-IE000L2SA8K5` du producteur non obligataire provient d'une réponse `{}` de l'API anglaise des cotations. À 21:34 UTC, la même route officielle française publie cinq cotations de la part exacte ; la page produit et l'API d'identité confirment séparément ISIN, devise USD, UCITS et lancement du 10 juillet 2023.

Le producteur tente l'API anglaise, puis uniquement sa variante française lorsque la première ne fournit pas de cotations qualifiées. Le parseur commun vérifie hôte, HTTPS, locale autorisée, ISIN de l'URL, paramètres, places, tickers et devises. Les pence restent GBX. Le producteur non obligataire conserve son périmètre USD/EUR ; aucune NAV indicative n'est importée comme clôture. Chaque tentative et la source réellement validée sont conservées. Deux échecs restent un échec ; aucun cache ne renouvelle la preuve.

Le générateur des sources de métadonnées déclare également la route française. Celle-ci n'est pas confondue avec l'API des caractéristiques. Les données financières, les contrôles de performance, les périodes, les illustrations et les exigences de composition restent inchangés.

Preuve initiale locale : réponse française de 2 472 octets, SHA256 `e3911bd659b5dd01fd2176ea15fc0cd7f4b088e949956be79abbb74596fcb8f4`. Réponse anglaise vide : SHA256 `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`. Les fixtures conservent ces faits. Une recette locale ne démontre ni acquisition GitHub, ni enregistrement, ni publication ; ces étapes restent à établir par les producteurs ordinaires et les consommateurs publics.
