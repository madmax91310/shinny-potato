# Automatisation gratuite des données — premier lot

## Inventaire du master au démarrage

| Données | Automatisation actuelle | Source réelle / limite |
|---|---|---|
| Li Lu, Gates Trust, Klarman | Workflow quotidien `update-investor-13f.yml` ; valide puis actualise les JSON ; réutilise Pages | `update-investor-13f.py` utilise l'API publique **FolioFact**, pas directement SEC ni Tracefour. Tracefour est mentionné pour le format de normalisation. Aucun abonnement dans le code ; disponibilité et conditions du fournisseur à recontrôler avant extension. |
| Échéances de revue | Workflow hebdomadaire `review-freshness.yml` | Calcule les échéances selon les données et ouvre des rappels ; ne collecte pas de nouveaux prix. |
| Historiques mensuels Bitcoin et autres actifs | Captures source et audits de cohérence ; pas de collecte planifiée | Bitcoin : 141 clôtures Yahoo `BTC-USD`, janvier 2015 à septembre 2026, `close`, en USD. |
| Encours, positions, caractéristiques ETF | Registres communs, audits et calendrier de revue | Pas de connecteur émetteur planifié. |
| Indices MSCI/STOXX et or | Captures et registres partagés | API ou téléchargement gratuit et automatisé à qualifier séparément ; ne pas supposer une autorisation d'extraction du seul fait qu'un document est public. |

## Ce premier lot

Un socle Python sans dépendance externe collecte du JSON, effectue au maximum trois
tentatives avec délai borné, contrôle les réponses et écrit atomiquement le résultat.
Les réponses HTML, dates manquantes, doublons, nombres invalides et identités de produit
incorrectes font échouer le collecteur. Un échec ne remplace pas un rapport valide.

Le pilote Coinbase vérifie le produit BTC-USD puis récupère six mois calendaires complets
de bougies quotidiennes UTC, en une requête de moins de 300 points attendus. Chaque journée
doit être présente. La clôture du dernier jour de chaque mois est comparée au registre actif,
exporté à l'exécution : aucun prix de référence dupliqué dans le pilote.

Le workflow `probe-bitcoin-monthly.yml` s'exécute le 2 de chaque mois à 06:40 UTC,
manuellement à la demande, et lors des PR qui changent le connecteur. Il n'a que les droits
de lecture du dépôt. Le tableau de comparaison est dans le résumé GitHub ; les réponses
brutes, dates et URLs sont dans un petit artefact JSON conservé 35 jours. Aucun déploiement
Pages, abonnement, clé API, npm install ou service d'IA n'est nécessaire à cette collecte.

**Ce lot automatise la collecte et la comparaison, pas la mise à jour du Bitcoin actif.**
Coinbase est une place de marché ; la série active est celle de Yahoo. Un faible écart de
prix ne prouve pas une identité de méthode et n'autorise jamais un raccord silencieux.
L'intégralité de l'historique actif, des métadonnées et des tweets reste inchangée.
Un défaut d'accès réel reste un échec visible du workflow, pas un succès avec des valeurs fictives.

## Coût et entretien

L'endpoint public Exchange documenté ne nécessite pas d'authentification. Le pilote effectue
deux requêtes par exécution normale. Les limites du fournisseur et sa pérennité restent à
surveiller ; une automatisation gratuite ne garantit pas une disponibilité perpétuelle.
GitHub Actions et les artefacts consomment les quotas existants : pour un dépôt privé,
vérifier l'utilisation et maintenir un budget bloquant tout dépassement. Ce lot ne modifie
aucun réglage de facturation et ne peut pas certifier la facture du compte.

Documentation :
- https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles
- https://docs.cdp.coinbase.com/exchange/rest-api/authentication
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://www.sec.gov/about/developer-resources
- https://www.msci.com/legal/notice-and-disclaimer

## Suite progressive

1. Observer les résultats réels Coinbase et les comparer à Yahoo, sans mélanger les sources.
2. Qualifier une source gratuite homogène pour la série active (accès, méthode, droits,
   profondeur historique). Si elle est différente, prévoir une migration explicitement
   validée de toute la série plutôt qu'un ajout de nouveaux mois d'une autre méthode.
3. Après validation, ajouter le raccord au registre, la provenance par capture et les
   contrôles des consommateurs. Mise à jour seulement à une nouvelle échéance et déploiement
   seulement si le contenu change ; conserver les valeurs actives en cas d'échec.
4. Qualifier un téléchargement structuré chez un seul émetteur d'ETF pour quelques ISIN.
5. Étendre ensuite les investisseurs, après clarification de la dépendance FolioFact/SEC.

## Vérification locale

```bash
python -m unittest discover -s scripts -p 'test_data_automation.py'
node scripts/export-bitcoin-baseline.mjs > /tmp/bitcoin-baseline.json
python scripts/probe_bitcoin_monthly.py --baseline /tmp/bitcoin-baseline.json --output /tmp/bitcoin-observation.json
```

Le deuxième test nécessite l'accès réseau à Coinbase. Dans l'environnement initial,
cette URL renvoie une page HTML de blocage : une exécution GitHub est nécessaire pour
valider la collecte réelle. Les fixtures unitaires sont synthétiques et ne sont jamais
consommées par l'application.
