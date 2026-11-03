# Amundi PEA US Tech Screened : raccordement DCA

ISIN FR0013412269, ticker PANX (Euronext Paris EUR). Usage demandé : reproduire un portefeuille comprenant PANX, CW8, ESE, PUST, PAASI, PAEEM, LVMH et BNP Paribas.

La collecte `collect_exposure_expansion.py` utilise le connecteur Amundi existant. Le workflow quotidien `update-exposure-expansion.yml` collecte, valide, conserve les dernières observations en cas d'échec, régénère le catalogue DCA et publie les données validées. Aucun service manuel supplémentaire.

Le contrôle impose l'ISIN, la réplication synthétique et le benchmark exact Solactive ISS ESG US Tech 100 Index. Seules INDEX_COUNTRIES, INDEX_SECTORS et INDEX_TOP10 sont utilisées pour l'exposition économique ; jamais le panier de substitution ni un Nasdaq-100 différent.

Première collecte réelle validée le 29/10/2026 : pays, secteurs et dix principales positions datés du 27/10/2026. Les dix lignes identifiées couvrent 76,968357 % ; elles restent explicitement partielles. Aucune extrapolation des poids restants. La liste de constituants Solactive sans pondérations ne permet pas de calculer un recouvrement exhaustif.

Sources :
- https://www.amundietf.fr/mapi/ProductAPI/getProductsData (requête exacte dans le connecteur ; réponse de composition conservée comme fixture)
- https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0013412269/FRA/FRA/INSTITUTIONNEL/ETF/20260930 (identité, cotation, PEA, domicile et réplication)
- https://www.solactive.com/index/DE000SL0J395/ (identité de l'indice)

Validation locale : collecte réelle ciblée, 7 tests Python, test des 36 références et recherche PANX, suite DCA et build complet réussis. Le test navigateur inclut désormais les huit lignes du portefeuille ; lancement local bloqué par l'environnement Chromium (`socket() failed: Operation not permitted`), à exécuter en CI avant publication.


Reprise mensuelle PANX, 29 octobre19h40 — #1052 est fusionnée (cb9dd28), son catalogue et sa composition sont préservés. Le producteur ordinaire40939814124 qualifie réellement la seule nouvelle partFR0013412269, puis échoue à Validate observations: test-etf-tool-connections ; Duels importe ses nouveaux rendements mais cherche exclusivement une fiche ETF inexistante et appelle getETFArt(undefined). Ce lot possède le raccord explicite à l’illustration technologie déjà vérifiée, sa régression sans fiche et le déclenchement mensuel correspondant. Aucun nouveau seuil, rendement, rôle automatique ou fiche créé ; toute autre identité sans illustration reste refusée. Collecte et publication ordinaires à vérifier après fusion.

