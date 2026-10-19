# Fiabilité et reprise des collectes

La surveillance s'exécute toutes les quinze minutes et après les collectes. Elle
enregistre son plan dans `automation-status/automation-status.json` avant toute
demande de relance. Chaque relance est un `workflow_dispatch` sur `master` : les
collecteurs relisent les entrées récentes, collectent, valident puis enregistrent.
Le refus de rebaser des observations non revalidées reste en place.

Une erreur de transport transitoire, un échec d'enregistrement ou un collecteur
silencieux peut être repris. Les délais sont de 15 minutes après l'échec, puis
une heure et quatre heures après les demandes précédentes, au maximum trois
demandes par collecteur sur 24 heures et deux par passage du moniteur. Le budget
ne se réinitialise pas quand le numéro d'exécution ou l'incident change. Une
exécution en cours ou plus récente que le bilan empêche une relance concurrente.
Les horaires GitHub peuvent retarder un passage ; les dates sont des échéances
minimales et non une garantie d'exécution à la seconde.

Les contradictions, identités manquantes, refus permanents 403 et changements de
clauses restent visibles. Ils ne déclenchent pas une boucle de relances. Les
collectes programmées continuent lorsque le budget de reprises est épuisé.
L'intégration à la demande, les répétitions et le déploiement sont exclus.
Une configuration sans première exécution ne se lance pas implicitement.

L'écran « Données à revoir » affiche l'attente, la demande de reprise, l'exécution
déjà détectée ou le budget épuisé. Cela ne change jamais un échec en succès.
Le journal `recovery` conserve les dates, causes, exécutions d'origine, résultats
des demandes et derniers succès de collecte. Une réponse POST perdue consomme
sa réservation ; elle n'est pas répétée immédiatement.

## Sources

- SEC : démarrages espacés de 250 ms par processus, `Retry-After` respecté pour
  les erreurs transitoires et circuit de cinq minutes après un refus 403.
  Le contact technique fourni par l’opérateur est utilisé par défaut ; la
  variable de dépôt `SEC_USER_AGENT` permet de remplacer cette identité. Cela ne garantit
  pas que la SEC autorise l'adresse IP du runner. Les replis conservent leurs
  dates et leurs limites, notamment les trimestres non renouvelés.
- Change TWD : la même série officielle FRED DEXTAUS reste croisée avec la BCE
  à dates concordantes. Le téléchargement dispose de 60 secondes par opération
  réseau et au maximum quatre essais. Les validations de couverture et de
  périodes terminées restent obligatoires ; la dernière valeur valide est
  conservée en cas d'échec.
- DWS : les pays et secteurs doivent correspondre exactement en date, portée,
  méthode, source, complétude et poids. Un changement des seules métadonnées du
  document brut conserve les deux empreintes et archive le nouveau corps brut.
  La vérification désigne alors `same-qualified-allocations`, sans affirmer une
  identité des fichiers ni qualifier les positions individuelles. Le mécanisme
  de résolution des contradictions continue d'exiger l'empreinte exacte des
  observations actives et sa stabilité pendant quatre heures.
- Métadonnées : chaque champ conserve séparément la tentative, le dernier
  succès, les URL et les erreurs de source. Une tentative ne renouvelle pas une
  preuve PEA ni une cotation absente. Les anciennes preuves manuelles expirées
  restent dans la couverture des champs ; leur raccordement exige une source
  exacte effectivement observable.

## Validation

Tests de politique de reprise (budgets, concurrence, interruptions, exclusions),
transport SEC, téléchargement lent, diagnostic des preuves, vérification DWS,
tests des statuts existants et parcours Chromium mobile/bureau du suivi des
reprises. La publication passe par le portail normal de build et de validation.
