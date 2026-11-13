# Trade Republic : huit refus de collecte

État examiné : master `ed8a84ffe66ef1c0a719dbe3719791937e9dedf9`, le 7 novembre 2026. Aucun changement des données de production, aucune fusion, aucun déploiement demandé par cette intervention.

## Réponses effectivement observées

Le [job GitHub du 7 novembre](https://github.com/madmax91310/shinny-potato/actions/runs/42318809266/job/128238041241) rapporte les huit refus. Son résumé exact figure dans `github-collector-excerpt.txt`. Le job de collecte réussit techniquement ; le job report-failures du même run signale les collectes partielles. Un succès technique n’établit donc pas la disponibilité de toutes les preuves.

Les sondes locales utilisent les mêmes en-têtes que `issuer_documents.download` : `User-Agent: EpargnantLibre-Data/1.0`, `Accept-Language: en`. Entre 12:33 et 12:35 UTC, les six URL originales répondent HTTP 302 vers `https://traderepublic.com/support`, qui répond HTTP 404 avec une page d’erreur générique. Les statuts, destinations, tailles et empreintes sont dans `http-receipts.json`.

Les nouvelles routes trouvées par recherche (`/fr-fr/3459`, `/fr-fr/3293`, et `/fr-fr/support?articleId=…`) ne fournissent pas de preuve exploitable dans ces conditions : redirection vers le même 404, ou 404 direct. Les résultats indexés ne sont pas utilisés comme pièces justificatives.

En revanche, l’ajout de **`?web_view=true` à chacune des six URL d’origine** fournit HTTP 200, sans changement d’identifiant, de langue ou de titre. Les six textes après retrait des scripts, styles et éléments de navigation sont **identiques** aux anciennes fixtures du dépôt : comparaison par SHA-256 dans `fixture-comparison.json`. Les corps HTTP ont leurs propres empreintes dans `webview-receipts.json`. L’URL de conversion 319 utilisait déjà ce paramètre et reste accessible.

## Résultat des huit entrées

La collecte ciblée réutilise `collect` et `fetch_content`, les parseurs et le résolveur réels, avec téléchargement public des seules sources Trade Republic. Aucun `--apply`. Les autres courtiers sont exclus de cette sonde, pas déclarés en échec de production. Résultat complet avant/après : `live-tr-qualification.json`. **Aucun refus TR subsistant dans cette sonde locale.** L’exécution GitHub de la PR reste un contrôle distinct.

| Entrée | Article / document | Résultat |
| --- | --- | --- |
| `tr` | 784 + web_view | 1 € par transaction ponctuelle hors plans ; Direct Price distinct, spread et frais tiers possibles |
| `tr_direct` | UUID 835f9deb… + web_view | 2 € = 1 € règlement + 1 € place ; autres coûts possibles |
| `tr_garde_cto` | 719 + web_view | 0 € de garde CTO ; ne prouve pas le tarif PEA |
| `tr_transfer_cto` | 825 + web_view | 0 € facturé par TR pour transfert CTO ; frais tiers possibles ; PEA distinct |
| `tr:profile:dca` | UUID ec74b91a… + web_view | Plans PEA sans frais d’exécution annoncés ; coûts des produits et spread possibles |
| `tr:profile:pme` | Contrat France + découverte PEA rétablie | Source accessible ; disponibilité PEA-PME toujours **non établie**, aucune déduction négative |
| `tr:profile:change` | 414 + web_view et grille 319 | Toujours **partiel** : conversion des revenus et marges par devise ; aucune commission PEA générale déduite |
| `tr:profile:garde` | Contrat France et 719 + web_view | Toujours **partiel** : pas de promotion du tarif de garde CTO en tarif PEA |

Le [contrat France](https://assets.traderepublic.com/assets/files/CA_FR-en-fr.pdf) est accessible (HTTP 200, SHA-256 `310cf0276d224b02c2e6949957c2d021235a8ace4d3c8d3e2842884d59861d32`). Sa section VIII renvoie au barème et/ou à l’application pour les frais : elle ne remplace pas les articles tarifaires. Les sections particulières PEA qualifient les caractéristiques déjà utilisées et les possibilités de transfert, sans justifier de nouveaux montants. Les statuts partiels restent partiels.

## Modifications proposées

- `broker_tariff_extensions.py` : quatre URL tarifaires passent à la vue publique du même article.
- `broker_profile_sources.json` : trois références passent à cette vue (l’article 719 est partagé).
- `broker_profile_discovery.py` : seule la requête exacte `web_view=true` est admise pour un article support TR français identifié ; aucun nouveau domaine n’est autorisé.
- `broker_profile_tr.py` et `collect_broker_tariffs.py` : chaque redirection doit conserver l’identifiant et la langue de l’article ; contrôle du titre H1 unique et du canonical s’il existe. La grille 319 bénéficie aussi du contrôle des redirections, alors que sa requête excluait auparavant la sélection de la politique.
- `test_broker_tariff_tr_identity.py` : sept tests ciblés, dont rejet avant suivi d’une redirection, faux HTTP 200, autre article/pays, requêtes non autorisées, reprise valide et conservation exacte des anciennes valeurs, dates, empreintes et références pour les huit échecs.

Les parseurs financiers restent inchangés. Un échec d’identité, de téléchargement ou de clause conserve les dernières observations qualifiées et leur date ; aucune validation d’un tarif à partir de `/support`.

## Validation

- 74 tests `test_broker_tariff*.py` réussis.
- 14 tests `test_regulatory*.py` réussis.
- Six comparaisons de texte identiques ; huit entrées sans refus TR lors de la sonde locale réelle.

Cette PR doit être présentée au propriétaire et attendre son **approbation explicite avant toute fusion ou tout déploiement**. Ne pas activer de fusion automatique.
