# Collectes iShares, VanEck et S&P — 9 octobre 2026

## iShares EM Local Govt Bond IE00BFZPF546

Le portefeuille BlackRock contient 394 lignes, somme 100,00003 %. Les contrats CNY/USD et IDR/USD de classe Forwards ont des poids −0,00023 % et −0,00027 %. Cette classe est désormais qualifiée comme dérivé signé ; les titres obligataires négatifs, poids non finis et portefeuilles incomplets restent rejetés. Le top dix est constitué uniquement des obligations identifiées, sans renormalisation.

## VanEck

Les huit fonds configurés ont été téléchargés et analysés dans cet environnement (fiches 30/09/2026 et compléments sectoriels), sans erreur. Les replis officiels nl/en et uk/en sont configurés pour chaque document, avec le même nom de fichier. Les redirections HTTP Python sont désormais limitées au domaine HTTPS officiel ; le navigateur conserve ses contrôles plus stricts de région, nom de document et PDF. Un contenu incompatible reste fatal et ne déclenche jamais une substitution.

## S&P Dividend Aristocrats

Les deux réponses numériques officielles actuelles sont accessibles ici : composition au 30/09/2026, Global Quality Income 90 titres et Euro High Yield 40 titres, top dix avec poids. Les tests antérieurs sur GitHub Ubuntu et macOS confirmaient HTTP 403, y compris en session Chromium. Aucun nouveau changement de headers ne prétend résoudre ce blocage.

`sp_public_feed.py` effectue le relais : récupération des réponses exactes officielles, validation intégrale par le lecteur existant puis écriture atomique des deux réponses brutes (base64 et SHA-256), avec heure réelle de récupération. GitHub tente toujours la source directe puis utilise ce relais sur erreur réseau. Une réponse incompatible reçue avec succès reste fatale. Le relais doit dater de moins de 48 heures ; les dates de composition sont contrôlées séparément (75 jours maximum). Une collecte ratée ne change jamais le timestamp. Un relais absent, altéré ou périmé laisse les anciennes observations et produit une erreur dans la chaîne existante Données à revoir.

Le relais exige une tâche quotidienne exécutée dans un environnement ayant accès à S&P, puis publication de `scripts/observations/sp-public-feed.json` via GitHub. La tâche planifiée doit être activée pour que cette voie soit autonome ; un fichier initial seul ne résout pas durablement le blocage. Le code ne nécessite aucune clé S&P ni source tierce. Le workflow S&P valide les deux réponses depuis les runners GitHub et le workflow ETF reçoit les modifications du relais.

Validation locale : tests Forwards, transport régional, contenu incompatible, relais frais/périmé/futur/modifié et écriture atomique, lecteurs S&P, build. Validation des téléchargements réels GitHub via les workflows dédiés de la PR.
