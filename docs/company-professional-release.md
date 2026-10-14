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

## Réception encore à réaliser

Le catalogue existant comporte 26 entreprises ; les 64 nouvelles entrées sont
des candidates, pas des entreprises validées. L'objectif de 60 n'est pas atteint
par une simple inscription dans ce catalogue. Les observations de collecte
locale interrompue ne sont pas utilisées comme données de production.

1. Autoriser l'envoi des modifications vers madmax91310/shinny-potato : la revue
   automatique a rejeté le premier envoi avant création de branche ou de PR.
2. Exécuter le workflow GitHub de qualification et examiner son rapport.
3. Réintégrer uniquement les observations effectivement qualifiées sur runner.
4. Compléter les éventuels manques jusqu'à 60 entreprises complètes.
5. Vérifier navigateur/mobile/exports sur les données finales, puis les budgets
   de bundle ; les tests locaux ne remplacent pas cette réception finale.
6. Fusionner seulement après réussite des contrôles, puis vérifier Pages.

La commande de réception est :

```
node scripts/qualify-company-universe.mjs --require-60 --output=/tmp/company-coverage.json
```

En collecte quotidienne, une régression de couverture est signalée après
publication des observations valides ; elle ne doit pas empêcher leur mise à
jour. Le contrôle PR reste bloquant pour la livraison initiale.
