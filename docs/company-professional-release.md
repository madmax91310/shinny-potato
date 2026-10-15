# Réception de la version professionnelle

La promesse est un parcours de valorisation : données réelles, scénarios
automatiques explicables, objectifs à 1/3/5 ans, hypothèses modifiables,
lecture inverse du cours, sensibilités et publication X cohérente.

## Préparé dans cette branche

- Collecteur SEC indépendant pour 64 nouvelles candidates, identités CIK
  rapprochées de la liste officielle SEC. Aucun chiffre financier saisi.
- Qualification automatique avant activation ; candidates exclues du catalogue
  publié et des observations embarquées dans le navigateur.
- Sauvegarde après chaque entreprise, dates conservées en cas d'échec,
  refus des conflits, des régressions et des bases d'actions non qualifiées.
- Contrat unique de complétude et contrôle explicite du minimum de 60.
- Lecture inverse du multiple de sortie et grille de sensibilité.
- Valeur actuelle des flux et reverse DCF pour la méthode FCF, avec convention
  de distribution des flux après intérêts et distinction du prix futur.
- PER annuel GAAP explicitement daté lorsqu'aucun TTM vérifié n'existe.
- FCF/action publié affichable indépendamment de l'éligibilité à une projection.
- Reformulation du texte de valorisation ; chiffres et squelette conservés.
- Partition des observations au build, sans relâcher les budgets existants.

## Définition de « complète »

`companyCompleteness` exige des comptes récents, au moins quatre exercices
comparables, les composantes annuelles OCF/investissements/FCF/actions diluées,
un PER publié comparable, un FCF/action qualifié, les estimations de BPA et
les multiples ajustés sourcés, un vrai historique de cours, une activité et un
point de vigilance, et des scénarios finis à chaque horizon pour au moins une
méthode adaptée. Les prévisions restent conditionnelles.

La dette et la trésorerie ne sont pas inventées lorsqu'elles manquent. Le modèle
FCF après intérêts ne procède pas à une seconde déduction de dette et n'est
pas un modèle FCFF de valeur d'entreprise. Les banques et assurances ne sont
pas ajoutées avec cette méthode générique.

## Réception de la première livraison

Le jeu préparé le 14 octobre 2026 contient 75 entreprises actives, dont 60
satisfont le contrat complet. Les 15 dossiers historiques encore partiels
conservent leurs réserves ; ils ne sont pas comptés dans ce seuil.
49 entreprises nouvellement qualifiées rejoignent les 26 dossiers existants.
Les autres candidates restent exclues du catalogue publié.

Les comptes proviennent de la SEC ou, en cas d'échec, des tableaux annuels
visibles de Stock Analysis / S&P Global. Ce second cas est explicitement
indiqué. Les comptes trimestriels, la dette et la trésorerie manquants ne sont
pas inventés. Les montants attribuables aux actionnaires sont rapprochés du
BPA et des actions diluées, dans la limite des arrondis affichés.

Les dossiers sont chargés à la demande. Les comparables utilisent une
projection des mêmes observations ; les données de suivi sont compactées sans
perte. Les budgets JavaScript restent inchangés.

La qualification des données et les tests locaux passent. La réception GitHub,
la fusion et la vérification du déploiement restent des étapes de livraison.
La seconde livraison doit ajouter 50 entreprises complètes supplémentaires.

La commande de réception est :

```
node scripts/qualify-company-universe.mjs --require-60 --output=/tmp/company-coverage.json
```

En collecte quotidienne, une régression de couverture est signalée après
publication des observations valides ; elle ne doit pas empêcher leur mise à
jour. Le contrôle PR reste bloquant pour la livraison initiale.

## Seconde livraison

Voir [la réception finale](company-final-release.md) : 50 entreprises supplémentaires, compléments historiques et seuil de 110 dossiers complets. Commande courante : `node scripts/qualify-company-universe.mjs --minimum=110`. Les limites résiduelles sont recensées séparément.
