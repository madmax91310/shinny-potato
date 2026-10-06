import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { ASSETS } from '../src/data/market-history.js';
const read=path=>JSON.parse(readFileSync(path));
const etf=read('src/data/automated-etf.json'), indices=read('src/data/automated-indices.json'), monthly=read('src/data/automated-monthly.json');
const sources=['etf-pilot.json','amundi-etf.json','ssga-etf.json','additional-etf-sources.json'].flatMap(file=>read(`scripts/${file}`).instruments);
const configured=new Set(sources.filter(s=>s.enabled!==false).map(s=>s.isin));
const instruments=DATA_CATALOG.filter(r=>r.type==='instrument');
const uncovered=instruments.filter(r=>!configured.has(r.id)||!etf[r.id]);
const expected=['Frais','Encours','Rendements calendaires','Pays','Secteurs','Principales positions'];
function fields(r={}) { return [r.characteristics?.terPct !== undefined,r.aum,r.performance,r.countries,r.sectors,r.holdings].map((v,i)=>v?expected[i]:null).filter(Boolean); }
const count=field=>Object.values(etf).filter(r=>field==='ter'?r.characteristics?.terPct!==undefined:r[field]).length;
const rows=[
 '# Automatisation des données — état du 6 octobre 2026','',
 'Rapport fondé sur les collecteurs configurés et les données actives, pas sur les seuls rappels de fraîcheur. Une source inaccessible conserve ses valeurs précédentes et fait échouer le signal de collecte ; les autres données validées peuvent être publiées. Les publications restent conditionnées aux audits et au déploiement.','',
 '## Ce qui fonctionne sans assistant ni saisie manuelle','',
 '| Domaine | Couverture active | Fréquence |','|---|---|---|',
 `| Historiques mensuels des simulateurs | ${Object.keys(ASSETS).length}/${Object.keys(ASSETS).length} séries ; ${Object.keys(monthly).length} nouveaux collecteurs + Bitcoin et or | Marchés : 2, 4, 8 et 16 du mois ; Bitcoin : 2, 4 et 8 ; or : tentatives du 3 au 10 |`,
 `| ETF/ETC/ETP | ${Object.keys(etf).length}/${instruments.length} instruments, au moins un champ | 3 et 16 du mois |`,
 `| Compositions d’indices | ${Object.values(indices).filter(r=>r.facts).length} indices | 3 et 16 du mois |`,
 `| Rendements annuels d’indices | ${Object.values(indices).filter(r=>r.returns).length} indices | 3 et 16 du mois |`,
 '| Inflation | INSEE, prolongement de la série mensuelle 2026+ | 1 et 16 du mois |',
 '| Portefeuilles d’investisseurs | 18 déclarants SEC 13F | Vérification quotidienne ; publication trimestrielle par les déclarants |',
 '| Suivi de fraîcheur | Rapport et rappels GitHub | Hebdomadaire ; ces rappels ne collectent pas les données manuelles |','',
 'Les mois incomplets sont exclus. Les cours ajustés, cours bruts, rendements NET/GROSS et devises restent distincts. Les clôtures Yahoo sont recoupées entre granularités ou fenêtres du même fournisseur ; ce ne sont pas deux fournisseurs indépendants. L’or reste une moyenne mensuelle Banque mondiale. Pour SI=F, Yahoo omet des bougies mensuelles : ces mois sont recoupés avec une seconde requête quotidienne de fin de mois. Les niveaux STOXX viennent de son tableau quotidien officiel.','',
 '## Disponibilité à fiabiliser','',
 'WPEA (IE0002XZSHO1) et SPEA (IE000DQLYVB9) : les pages officielles iShares ont fourni des données validées, mais plusieurs collectes GitHub du 6 octobre 2026 ont ensuite renvoyé HTTP 403. Les connecteurs et tentatives planifiées existent ; leurs dernières valeurs validées sont conservées. Leur accès reste à fiabiliser. Les 139 instruments décrivent donc une couverture configurée et validée au moins une fois, pas 139 accès réussis à chaque exécution.','',
 '## Limites par champ ETF','',
 '| Champ collecté et consommé | Instruments |','|---|---:|',
 ...[['Frais annuels','ter'],['Encours daté','aum'],['Rendements calendaires 2020–2025 de la part','performance'],['Pays','countries'],['Secteurs ou sous-secteurs publiés','sectors'],['Principales positions','holdings']].map(([label,field])=>`| ${label} | ${count(field)} |`),'',
 'Ces couvertures ne s’additionnent pas : plusieurs champs concernent le même instrument. Les 22 expositions Amundi à l’indice suivi recouvrent des parts déjà collectées ; elles ne sont pas 22 fonds supplémentaires. Les compositions d’indice, portefeuilles de fonds et paniers de substitution ne sont jamais assimilés. Les séries de simulation restent limitées à 2020–2025 ; le choix automatique d’une nouvelle fenêtre annuelle n’est pas implémenté.','',
 '## Instruments entièrement hors collecte active','',
 '| ISIN | Instrument | Blocage actuel |','|---|---|---|',
 ...uncovered.map(r=>`| ${r.id} | ${r.name} | ${sources.find(s=>s.isin===r.id)?.qualificationIssue ?? 'Connecteur officiel exact à qualifier ; les données existantes restent manuelles'} |`),'',
 '## Champs restant manuels sur les instruments partiellement couverts','',
 'Les identités, domiciles, modes de réplication, couvertures de change, politiques de distribution, nombres de positions, statuts PEA et cotations ne sont pas raccordés à une actualisation automatique. Les données intermédiaires d’indice/distribution récupérées par certains collecteurs ne suffisent pas : elles ne remplacent pas encore ces registres dans l’application.','',
 '| ISIN | Instrument | Champs courants hors collecte active |','|---|---|---|',
 ...instruments.filter(r=>etf[r.id]).map(r=>`| ${r.id} | ${r.name} | ${expected.filter(f=>!fields(etf[r.id]).includes(f)).join(', ')||'Les six champs sont couverts ; caractéristiques et cotations restent manuelles'} |`),'',
 '« Hors collecte » peut aussi signifier non publié ou non applicable. Une part récente n’a pas six années complètes : ses performances YTD, depuis création et périodes glissantes restent manuelles lorsqu’elles existent. Les proxys de simulation ne sont pas remplacés par une série incomplète. Le monétaire overnight n’a pas de composition actions pertinente ; publier son panier de swap comme exposition économique serait incorrect.','',
 '## Indices avec au moins un bloc restant manuel','',
 '| Indice | Bloc hors collecte active |','|---|---|',
 ...DATA_CATALOG.filter(r=>r.type==='index').filter(r=>!indices[r.id]?.facts||!indices[r.id]?.returns).map(r=>`| ${r.name} (${r.id}) | ${[!indices[r.id]?.facts?'Composition / méthodologie':null,!indices[r.id]?.returns?'Rendements annuels':null].filter(Boolean).join(', ')} |`),'',
 'Russell 1000/2000 : rendements annuels automatisés ; les compositions restent à qualifier dans une publication exploitable avec poids numériques. Les photographies archivées ne changent pas de date. Les quatre séries annuelles de sous-jacents (or, argent, Bitcoin, Ethereum) restent distinctes des historiques mensuels automatisés et ne sont pas automatiquement prolongées dans index-returns.','',
 '## Autres données de l’application encore manuelles','',
 '- Courtiers : tarifs, offres commerciales, conditions, disponibilité des produits et échéances promotionnelles.',
 '- Épargne réglementée : taux Livret A et autres hypothèses/règles de simulation. L’inflation INSEE est automatisée ; elle ne met pas ces règles à jour.',
 '- Fiscalité, plafonds et règles PEA/CTO/assurance-vie ; lexique financier et chiffres réglementaires.',
 '- Les 29 statistiques de ménages : patrimoine, revenus, profils et benchmarks. Pas de connecteur INSEE/Banque de France pour leur révision.',
 '- Rendements et hypothèses de fonds euros et SCPI ; historiques mixtes/proxys, hypothèses de frais et autres scénarios éditoriaux.',
 '- Profils et biographies des investisseurs : seule la déclaration 13F est collectée. Les actifs hors périmètre 13F ne sont pas ajoutés automatiquement.',
 '- Ajout de nouveaux instruments, choix des sources, compatibilité de nouvelles devises/méthodes et remplacement de sources devenues incompatibles.',
 '- Réparation des connecteurs si un émetteur change son schéma, bloque l’accès ou retire une publication : les tâches réessaient et signalent l’échec, mais ne réécrivent pas seules le code.','',
 '## Priorités suivantes','',
 '1. Qualifier les sources des 15 instruments restants et les champs manquants des sources déjà connectées (encours WisdomTree, historiques calendaires HSBC/L&G, expositions des parts synthétiques).',
 '2. Connecter les taux d’épargne réglementée, statistiques de ménages et rendements SCPI/fonds euros à des séries officielles stables.',
 '3. Automatiser les caractéristiques/cotations et le renouvellement annuel des fenêtres de simulation ; maintenir une revue pour les règles fiscales et les offres de courtiers.',
 '', 'Régénération : `npm run report:automation`. Ce rapport décrit une couverture, pas une garantie de disponibilité permanente des émetteurs.',''
];
const output=rows.join('\n');
if(process.argv.includes('--write')) {mkdirSync('docs',{recursive:true});writeFileSync('docs/automation-coverage.md',output);}
else console.log(output);
console.log(process.argv.includes('--write')?`Report written: ${Object.keys(etf).length} instruments; ${uncovered.length} uncovered.`:'');
