# Portefeuilles IA

Outil `/portefeuilles-ia`. Les échanges avec les IA et les décisions sont exclusivement manuels. Aucun SDK IA, appel à un modèle, secret, courtier, ordre réel, publication X ou génération d’image par IA.

## Audit de l’existant (21 octobre 2026)

Instructions lues : `CLAUDE.md` et sa référence `docs/claude/audit-application-2026-10-18.md`. L’application est une SPA React/Vite publiée sur GitHub Pages, sans backend d’écriture authentifié.

| Brique | Constat / réutilisation |
| --- | --- |
| Identités | `instruments.js`, `instrument-listings.js`, `equity-history-links.json` : identité ISIN, part et cotation exacte ; projection dédiée `ai-portfolio-universe.mjs`. Aucun changement de sélection dans les anciens outils. |
| Accès sources | `market_transport.chart_response`, `data_automation.get_json`, `issuer_documents.download`, écriture JSON atomique. Les deux hôtes officiels Yahoo servent la même requête, sans substitution d’instrument. |
| Séries | `refresh_monthly_history.yahoo_chart` valide identité, type, devise, granularité et fuseau. Le collecteur mensuel utilise des bougies quotidiennes, puis ne conserve que les dernières séances mensuelles : ces points ne suffisent pas pour le suivi quotidien. Les collecteurs ETF lancés chaque jour peuvent collecter des calendriers annuels : cadence du job ≠ fréquence des observations. |
| Change | `collect_annual_fx.py` connaît le document BCE quotidien mais n’en conserve que décembre par année ; `monthly-fx.json` et `calendar-fx.js` couvrent d’autres conventions. Nouvelle conservation quotidienne du même document officiel, sans modifier les anciens résultats. |
| Calculs | Les simulateurs et classements n’archivent pas les décisions ni leurs exécutions futures ; moteur comptable isolé, partagé entre CLI et prévisualisation. |
| Exports | Réutilisation du téléchargement PNG commun ; modèles Canvas codés reprenant les couleurs papier/vert/doré d’Épargnant Libre. Aucun appel externe pour texte ou image. |
| Publication | `commit-validated-data.sh`, registre des producteurs validés, supervision existante et publication avec code validé. Chemins de données propres à ce nouvel outil. |

Les résultats de collecte conservent séparément `attemptedAt`, `retrievedAt`, dates de séances, SHA-256 et calendrier avec fermetures UTC. Le bilan affiche son arrêté réel, indépendant de la date de génération.

## Sources quotidiennes validées en réseau

Collecte du 21 octobre 2026, réponses réellement téléchargées et contrôlées, données enregistrées dans `data/ai-portfolios/market.json` et le dossier public. Chaque série compte plus de 60 vraies clôtures sur sa fenêtre initiale, avec contrôle de toutes les séances attendues ; aucune interpolation.

| Instrument / cotation | Source quotidienne | Résultat |
| --- | --- | --- |
| IE00B4L5Y983 · SWDA · ETFP · EUR · Europe/Rome | Yahoo `SWDA.MI`, ETF iShares Core MSCI World UCITS Acc | Qualifié, référence initiale exacte ; clôtures jusqu’au 21/10 dans cette collecte du soir. |
| IE00B5BMR087 · CSPX · XLON · USD · Europe/London | Yahoo `CSPX.L`, iShares Core S&P 500 UCITS | Qualifié, clôtures jusqu’au 21/10. |
| IE00BKM4GZ66 · EMIM · XAMS · EUR · Europe/Amsterdam | Yahoo `EMIM.AS`, iShares Core MSCI EM IMI UCITS | Qualifié, clôtures jusqu’au 21/10. |
| US0378331005 · AAPL · XNAS · USD · America/New_York | Yahoo `AAPL`, identité du registre actions commun, place NMS vérifiée dans la réponse | Qualifié, clôtures achevées jusqu’au 20/10, marché américain du 21/10 pas encore qualifiable lors de la collecte. |
| US5949181045 · MSFT · XNAS · USD · America/New_York | Yahoo `MSFT`, même contrôle de place | Qualifié, clôtures jusqu’au 20/10. |
| IE00B53SZB19 · CNDX · XAMS · EUR | Symbole du registre actuel, réponse HTTP 404 | Indisponible ; exclu de l’univers initial, visible avec sa raison. Aucune substitution par une autre place ou part. Retest explicite possible. |
| EUR/USD, EUR/GBP, EUR/CHF | XML historique officiel BCE `eurofxref-hist.xml` | Validé, taux de référence quotidiens jusqu’au 21/10. Pas des changes de clôture. |

Les dates ci-dessus documentent la recette ; l’état courant est dans l’application. Le collecteur normal ne reteste que l’univers des compétitions, ou l’univers par défaut lorsqu’il n’y a aucune compétition. `--qualify-all` reteste les candidats exclus. Une collecte sans actualisation depuis le délai de supervision (36 heures, registre commun des workflows) est signalée périmée et bloque les nouvelles décisions ; les anciens bilans restent datés. L’admission exige au moins 20 clôtures, une série complète sur toutes les séances attendues et une dernière collecte réussie. Aucun actif arbitraire n’est automatiquement admis : étendre la projection nécessite une identité, une cotation, un calendrier et une vraie qualification quotidienne. Yahoo n’a pas de SLA et peut limiter ses réponses ; la couverture reste bornée aux cotations qualifiées.

## Comptabilité et dates

- Rendement total ajusté, unités synthétiques fractionnaires, **jamais présentées comme des actions négociables**. À la première séance d’ancrage : 100 unités monétaires de cotation par unité synthétique. Ensuite : `prix synthétique(t) = 100 × adjusted(t) / adjusted(ancrage)`.
- Le ratio à ancrage fixe annule les réajustements multiplicatifs historiques courants de Yahoo après dividende ou division. Pas de revenu ni de quantité d’actions ajoutés séparément. Les cours bruts sont conservés comme preuve, sans servir à simuler l’achat d’une véritable action.
- Chaque exécution archive la quantité synthétique, le prix synthétique en devise de cotation, le prix converti, les vrais cours bruts, les changes et dates utilisés, frais et mouvements. Unités et exécutions passées restent figées lors d’une correction source. Les nouvelles valorisations de ces unités sont comparées aux anciennes et leurs effets archivés.
- Liquidités dans la devise commune, non rémunérées, aucune marge, aucun apport après lancement. Frais configurables en points de base du montant de chaque achat et vente, déduits des liquidités ; une cible est calculée sur la valeur après frais par résolution de l’équation de financement.
- Résultat d’une ligne : valeur restante − achats cumulés + ventes cumulées. Contribution : ce résultat / capital initial, en points ; les lignes entièrement cédées restent comptées. Somme des résultats de lignes − frais = gain total. Ce n’est pas le rendement d’un lot ni un rendement annualisé.
- Aucun rééquilibrage automatique. La limite de poids s’applique aux achats ; une dérive par le marché est signalée et peut être conservée. Un portefeuille totalement liquide est autorisé ; sinon minimum et maximum de lignes s’appliquent.
- Enregistrement CLI horodaté par le serveur, jamais par une date proposée par le navigateur. Exécution à la première séance commune de **tout l’univers configuré**, strictement après le jour UTC d’enregistrement et au plus tôt à la date de lancement. Les allocations initiales et le World partagent la date fixée au lancement. Leur date antérieure était provisoire ; le passage à la date définitive est audité.
- Une décision mensuelle signifie un enregistrement par mois UTC, conservation comprise. La date originale de décision reste archivée et n’autorise pas un cours passé. Le modèle déclaré doit être renseigné avant lancement.
- Les calendriers `exchange-calendars==4.13.2` couvrent Milan, Londres, Amsterdam et les séances américaines communes NYSE/Nasdaq, avec leurs jours fériés, clôtures anticipées et fuseaux. Au moins deux heures après la fermeture sont nécessaires pour retenir une nouvelle bougie.
- Le suivi publie par prudence l’arrêté de la veille UTC. Les bilans hebdomadaires comparent vendredi à vendredi, disponibles le samedi après fermeture de tous les marchés. Première semaine partielle comparée au capital initial. Le mois est comparé à la fin du mois précédent ou au capital initial si le lancement est plus récent.
- Un marché fermé conserve sa dernière vraie clôture. Le change est le taux de référence BCE de l’arrêté ou du dernier jour TARGET attendu, même si le marché de l’actif est fermé. Aucune séance ni variation n’est inventée. Une clôture de séance attendue ou un change attendu absent bloque la valorisation ; une opération attend la date initialement prévue, sans basculer sur un cours ultérieur plus favorable.
- La référence reçoit le même capital à la même clôture initiale, dans le même modèle synthétique et avec la même convention de frais.

## Enregistrement durable

Fichiers de référence :

- `data/ai-portfolios/book.json` : compétitions, configurations, règles versionnées, décisions, exécutions et audit.
- `data/ai-portfolios/market.json` : observations quotidiennes, changes, calendriers, provenances et corrections de sources.
- `data/ai-portfolios/state.json` : arrêtés quotidiens et hebdomadaires, historique des révisions de valorisation.
- `public/data/ai-portfolios/snapshot.json` : projection complète chargée à la demande dans l’interface, également exportable pour sauvegarde.

Le navigateur n’est pas un serveur GitHub. **Préparer une demande n’enregistre rien dans le dépôt.** Aucun jeton n’est demandé ou conservé dans le frontend. Les brouillons restent dans la mémoire de l’écran ; télécharger la demande avant de quitter. Les modifications éditoriales n’affectent jamais les fichiers financiers.

1. Créer la configuration en Gestion, préparer et télécharger la demande JSON.
2. Dans une copie à jour du dépôt, avec Node 24, importer :

   ```sh
   node scripts/ai-portfolios.mjs import /chemin/demande-portefeuilles-ia.json
   ```

3. Examiner les modifications de `data/ai-portfolios/` et `public/data/ai-portfolios/`, les committer et les pousser sur la branche publiée (ou fusionner la PR correspondante). Recharger le dépôt dans l’interface et vérifier sa révision.
4. Enregistrer de la même façon une décision initiale pour chaque participant, puis la demande de lancement. Aucune allocation n’est fournie par défaut. Les instructions à copier préparent les échanges que l’utilisateur mène lui-même.

L’import exige la révision exacte du dossier et un identifiant unique. Une demande périmée ou rejouée est refusée sans modifier les fichiers. Le CLI ne prend jamais une quantité, un statut exécuté ou une date d’enregistrement fournis par le navigateur pour argent comptant. Un dossier sauvegardé peut être restauré en rétablissant ses fichiers JSON dans une branche Git et en revoyant le diff : il ne remplace pas silencieusement le livre via le navigateur.

Après lancement : capital, devise, date, identité des participants, univers et référence figés. Minimum, maximum, poids, fréquence et frais peuvent évoluer avec un motif ; chaque décision conserve les règles lors de son enregistrement. Une décision non exécutée peut être annulée avec motif. Une exécution se corrige par un mouvement compensateur futur justifié, jamais par effacement. La configuration pré-lancement se modifie après annulation des décisions préparées si nécessaire.

Les réponses originales facultatives sont **publiques** si importées dans ce dépôt public ; l’interface le précise. Elles peuvent être omises.

## Automatisation et reprise

`update-ai-portfolios.yml`, 05:20 et 09:20 UTC chaque jour, reprise manuelle possible :

1. Tests comptables et de parseurs.
2. Collecte exacte des instruments nécessaires et changes BCE ; une panne conserve les données précédentes de sa source et n’efface pas les autres succès.
3. Exécution unique des opérations enregistrées lorsque leur clôture déterminée est disponible.
4. Calcul des valorisations quotidiennes et bilans des vendredis achevés.
5. Build, commit isolé des chemins propres à l’outil, publication par le mécanisme existant de données validées.
6. Artefact d’observations, job d’échec distinct et supervision existante si une source nécessaire échoue.

Le calendrier est prolongé à chaque collecte ; le téléchargement complet depuis l’ancrage permet le rattrapage et la détection des corrections. Pas de collecte par participant, ni de requête pour chaque portefeuille. La reprise réutilise les identifiants et statuts des décisions et n’exécute pas deux fois une opération. Le modèle ajusté ne crédite aucun revenu distinct à doubler.

Installation locale pour une nouvelle collecte :

```sh
npm ci
python3 -m pip install -r scripts/ai-portfolios-requirements.txt
python3 scripts/collect_ai_portfolios.py
node scripts/ai-portfolios.mjs refresh
```

Aucun secret financier ni service additionnel nécessaire. Les permissions GitHub Actions `contents: write` et Pages sont nécessaires à la publication, déjà utilisées par les autres collecteurs. Les horaires GitHub sont indicatifs et une panne Yahoo/BCE ou un workflow bloqué peut retarder les résultats : l’interface conserve les raisons et dates réelles.

## Recette

- `npm run test:ai-portfolios` : allocation, dérive, conversion historique, achats/ventes/cibles, conservation, frais, référence, calendrier, semaine partielle, absence d’effet rétroactif, reprise, corrections et persistance avec aller-retour du CLI dans un dossier temporaire.
- Parseurs : dividendes et divisions via normalisation à ancrage, refus de données incohérentes, contrôle des jours fériés, trous quotidiens, change périmé et conservation des dernières données lors d’une panne.
- `npm run test:ai-portfolios:browser` : vraie navigation Chromium, état avant lancement, configuration, demande JSON réellement importée par CLI dans un dossier isolé, classement, conservation, retouche éditoriale sans effet financier, blocage des exports incomplets, PNG classement/focus/courbes et vues mobile 390 px / ordinateur 1440 px.
- Les données de démonstration des tests sont exclusivement injectées dans le navigateur et les répertoires temporaires. Le livre livré contient zéro compétition et zéro décision.
- Build, lint et contrôles des identités/cotations, contrats de supervision et producteur de publication exécutés. Les mises en page PNG sont inspectées visuellement ; leur taille est également vérifiée dans le navigateur.
