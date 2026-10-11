# Cinq ajouts à Présentation ETF — 11 octobre 2026

Ajoute uniquement les cinq dernières propositions validées : Amundi PEA Luxe Monde (FR001400S9V0), Xtrackers Artificial Intelligence & Big Data (IE00BGV5VN51), VanEck S&P Global Mining (IE00BDFBTQ78), SPDR Euro Dividend Aristocrats (IE00B5M1WJ87) et WisdomTree Global Quality Dividend Growth USD Acc (IE00BZ56SW52).

## Raccordement

Les cinq parts disposent déjà de collecteurs actifs dans la collecte quotidienne des émetteurs. Les fiches utilisent les registres communs pour les frais, encours et performances annuelles de la part exacte. Les pays, secteurs et premières positions restent dans les observations partagées ; leur ajout ne crée pas de rubrique supplémentaire dans le tweet. Aucun historique mensuel ou prix quotidien n’est nécessaire pour ces cinq fiches. Le marqueur presentationOnly conserve ces ajouts dans cet outil ; l’audit continue à exiger la cohérence des anciennes fiches et du Générateur, et refuse de raccorder une fiche seule au Générateur.

Les caractéristiques structurelles et les cotations sont relues séparément et conservées avec leurs sources. Le champ exposition décrit le périmètre suivi sans figer de nombre de titres ni assimiler les dix premières positions à un portefeuille complet. Luxe PEA reprend la composition économique de son indice déjà qualifiée, pas le panier de substitution visible dans l’API de son fonds synthétique.

Luxe PEA conserve uniquement 2025 comme année complète publiée. Les performances sont celles des parts, en EUR pour Luxe PEA et Euro Dividend Aristocrats, en USD pour les trois autres. La devise de cotation ne transforme pas la devise des rendements.

## Sources relues

- Luxe : API officielle Amundi, identité FR001400S9V0, réplication indirecte, capitalisation, rendement 2025 et encours relus en direct ; cotation MLUX Paris et devise EUR recoupées par Euronext.
- IA : API officielle DWS, part 1C, réplication physique intégrale, revenus capitalisés et tableau Borsa Italiana EUR / XAIX IM.
- Mining : fiche VanEck septembre 2026, IE00BDFBTQ78, revenus réinvestis, réplication physique intégrale, indice S&P Global Mining Reduced Coal, Borsa Italiana EUR / GDIG.
- Euro Dividend Aristocrats : page officielle State Street du 11 octobre, IE00B5M1WJ87, distribution semestrielle, réplication physique, PEA confirmé et EUDV Paris EUR.
- Quality Dividend Growth : fiche WisdomTree de la part IE00BZ56SW52 au 31 août 2026, capitalisation, réplication physique intégrale, PEA explicitement exclu et GGRA Paris EUR.

## Validation

Audits des cotations et preuves, caractéristiques, catalogue de données, performances exactes et passage à une nouvelle année ; compilation et budgets de routes réussis. Contrôle des tweets générés pour les cinq parts. L’exécution locale de Chromium est bloquée par le runtime (socket interdite) ; les 114 exports et leurs limites de texte sont vérifiés par le test navigateur existant dans GitHub Actions avant publication.
