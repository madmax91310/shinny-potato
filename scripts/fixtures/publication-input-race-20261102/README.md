# Conflit réel de publication du2novembre

Le producteur ordinaire41410676250 collecte et valide FTSE/ABTC, puis refuse l’enregistrement après l’actualisation ETF e61cb2e, depuis6f817444. Les JSON avant/après sont les blobs exacts de ces deux révisions, sans correction de valeur.

- Les trois chemins documentaires/configuration ne sont pas des entrées de refresh_purchasing_power, refresh_anniversary_indices, refresh_anniversary_levels, issuer_nav_history ou de leur plan avant acquisition. Ils restent utilisés au build et doivent être régénérés/revalidés.
- Le registre ETF sert deux calendriers explicitement configurés : Copper et Cloud. Leur qualification préserve tous les attributs de la part et les champs inconnus, hormis cinq capacités sans rôle de prix ; les valeurs/conventions/périodes des calendriers restent identiques. Seuls contrôles/digests valides existants peuvent être renouvelés, jamais une date d’observation.
- Le registre indices ne change que les contrôles/digests existants sous facts.source et returns.source. Les capacités de composition (tables, nombres/poids et leur date) ne sont pas des entrées de prix ; identité, provenance, taxonomie, dates/valeurs des rendements et champs inconnus restent comparés exactement.

Les tests rejouent l’enregistrement dans des dépôts isolés, conservent les deux écritures et refusent un contrôle financier échoué, des entrées modifiées et un chemin voisin non qualifié. Ils ne certifient pas un fournisseur et ne modifient aucune donnée de production.
