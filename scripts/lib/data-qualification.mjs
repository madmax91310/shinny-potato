import RULES from '../data-qualification-rules.json' with {type:'json'}

const roles=new Map(RULES.groups.flatMap(group=>group.paths.map(path=>[path.startsWith('src/')?path:`src/data/${path}`,{role:group.role,reason:group.reason,reviewedAt:RULES.reviewedAt}])));
export function registryQualification(registry){
 const reviewed=roles.get(registry.path);
 if(reviewed)return reviewed;
 if(registry.mode==='scheduled-output'||registry.mode==='event-output')return {role:'collector-output',reason:'Sortie explicitement publiée par un collecteur ; les erreurs et preuves restent propres à chaque champ.'};
 if(registry.mode==='mixed-or-derived')return {role:'mixed-or-derived',reason:'Consomme des collectes et peut conserver des valeurs de secours. Le raccordement se vérifie au niveau du champ.'};
 return {role:'unclassified',reason:'Nouveau module à qualifier ; aucune automatisation ni exemption déduite de son nom.'};
}
const FIELD_KEYS={'Frais annuels (%)':'ter','Encours':'aum','Éligibilité PEA':'pea','Caractéristiques':null};
export function fieldQualification(field,record){
 const label=field.label, registry=field.registry;
 if(registry==='src/data/simulation-proxies.js'||label.startsWith('Historique de simulation'))return {kind:'simulation',reason:'Proxy de simulation identifié ; aucune attribution de son rendement à la part exacte.'};
 if(registry==='src/data/instrument-aum-observations.js'||(label.startsWith('Photographie ·')||label.startsWith('Archive performance ·'))||record.name?.endsWith(' · archive'))return {kind:'archive',reason:'Photographie historique conservée à sa date et dans son périmètre ; ne pas la renouveler avec la date du build.'};
 if(label==='Définition'||label==='Activité')return {kind:'editorial',reason:'Texte éditorial ; les paramètres chiffrés variables sont suivis séparément.'};
 if(label==='Identité')return {kind:'reference',reason:'Identité de l’instrument ; changement uniquement sur preuve liée à cet identifiant.'};
 if(registry==='src/data/automated-practical-sheets.json')return {kind:'reference',reason:'Document officiel surveillé ; une modification du texte peut nécessiter une revue de son interprétation.'};
 if(label==='Rendements glissants à qualifier'||label.includes('À compléter')||label.includes('à confirmer')||label==='Disponibilité de la performance')return {kind:'unavailable',reason:'Absence ou conflit explicite ; conserver le motif, sans transformer une absence en zéro.'};
 if(['src/data/instrument-returns.js','src/data/instrument-comparator-returns.js','src/data/index-returns.js','src/data/market-history.js'].includes(registry)||/^(Historique annuel|Historique de dette nette|Cash et indicateurs de décision|Bilan et capitaux propres|Rendements|Taux de distribution annuels)/.test(label))return {kind:'history',reason:'Historique ou calendrier financier ; ajouter les périodes publiées et conserver les conventions de la série.'};
 if(registry==='src/data/instrument-performance-review.js'&&label.startsWith('Performance '))return {kind:'live',reason:'Rendement glissant encore issu d’un relevé manuel ; vérifier la part exacte et raccorder la publication courante.'};
 if(label.startsWith('Recoupement externe ·'))return {kind:'live',manual:true,reason:'Condition de courtage corroborée manuellement par des sources externes, avec échéance de revue ; pas de renouvellement automatique établi.'};
 const liveRegistries=['economic-data','insurance','presentation-actors','scpi','companies','household-statistics','etf-ter','instrument-pea','instrument-aum','instrument-listings','automated-etf','instrument-facts','qualified-exposure-metrics','index-facts','automated-indices','broker-tariffs','regulatory-data'];
 if(liveRegistries.some(name=>registry===`src/data/${name}.js`))return {kind:'live',reason:'Observation financière ou condition courante ; renouvellement avec source et date propres.'};
 return {kind:'unclassified',reason:'Nature du champ à qualifier explicitement avant tout raccordement.'};
}
export function coverageKey(field,record){
 if(record.type==='instrument')return FIELD_KEYS[field.label]??(field.label.startsWith('Cotation ')?'listings':null);
 if(record.type==='series'&&record.id.startsWith('history:'))return 'monthly';
 return null;
}
export function qualifyCoverage(row,{record={},holdingStatus,holdingSource,metadataStatus}={}){
 const observationState=row.state;
 let actionState=observationState, reason=row.reason??row.diagnostic?.reason??null;
 if(row.field==='pea'&&(metadataStatus?.errors??[]).some(e=>e.field==='pea'&&e.qualificationRequired)){
  actionState='source-conflict';reason='Déclarations PEA contradictoires : clarification explicite nécessaire.';
 }
 if(row.field==='completeHoldings'){
  // These are equity look-through requirements, not a claim that a bond portfolio
  // or a swap has no securities. Preserve the original coverage state alongside it.
  const text=`${record.name??row.name} ${record.characteristics?.replicationMethod??''}`;
  const commodity=/\bET[CPN]\b|commodity|physical (?:gold|silver|bitcoin|palladium|platinum)|ethereum staking|brent crude|wti crude|natural gas|wisdomtree coffee|wisdomtree cocoa|wisdomtree wheat|wisdomtree copper/i.test(text);
  if(!row.present&&(/\bbonds?\b|\bibonds\b|treasury|govt|overnight|court terme/i.test(text)||commodity)){
   actionState='outside-equity-scope';reason='Le contrôle porte sur les positions actions utilisées pour les recoupements DCA ; ce support nécessite son propre périmètre obligataire, monétaire ou matières premières.';
  }else if(!row.present&&/synthe|synthé|swap|indirect|hybrid/i.test(text)){
   actionState='tracked-index-needed';reason='Raccorder les constituants de l’indice économique exact ; le panier de substitution du fonds ne convient pas.';
  }else if(holdingStatus?.status==='failed'){
   actionState=/Fund-of-funds/.test(holdingStatus.error??'')?'lookthrough-needed':'collection-error';
   reason=holdingStatus.error;
  }else if(!row.present&&!holdingSource){actionState='connector-needed';reason='Source de positions intégrales et contrôle de l’identité du fonds à raccorder.';}
 }
 if(row.diagnostic?.code==='retained-source-failure'&&actionState==='current')actionState='collection-error';
 const passive=['current','archived','not-applicable','outside-equity-scope','waiting-first-year'];
 const actions={
  'connector-needed':'Découvrir et qualifier le téléchargement intégral de l’émetteur, puis raccorder la collecte quotidienne.',
  'tracked-index-needed':'Qualifier une composition complète de l’indice suivi, distincte du portefeuille de substitution.',
  'lookthrough-needed':'Qualifier les fonds détenus et leur transparisation ; conserver la dernière observation valide avec sa date.',
  'collection-error':'Réparer la lecture de la source ou qualifier une source de secours ; ne pas renouveler la date de la valeur conservée.',
  'source-conflict':'Obtenir une clarification ou un accord documenté des sources avant publication du champ.',
  'manual':'Qualifier une source explicite et raccorder le champ au collecteur.',
  'not-published':'Surveiller la source et compléter uniquement lorsqu’une valeur du bon périmètre est publiée.',
  'undated-observation':'Qualifier la date de photographie dans le document officiel.',
  'undated-check':'Recollecter et enregistrer une preuve de contrôle ; ne pas déduire cette date de la génération.',
  'check-overdue':'Renouveler le contrôle via le collecteur et examiner son dernier échec.',
  'waiting-first-year':'Attendre la publication de la première année civile complète.',
  'unqualified':'Qualifier l’identité ou le périmètre exact auprès de la source.',
  'missing':'Raccorder la source et le champ nécessaires au consommateur.',
  'publication-old':'Vérifier la nouvelle publication attendue dans le calendrier de la source.',
 };
 return {...row,observationState,actionState,reason,
  requiresAction:!passive.includes(actionState),
  priority:actionState==='source-conflict'?1:actionState==='collection-error'||actionState==='check-overdue'?2:passive.includes(actionState)?null:3,
  lastAttemptAt:holdingStatus?.checkedAt??row.lastAttempt??null,
  lastSuccessAt:holdingStatus?.lastSuccessAt??row.checkedAt??null,
  configuredSourceUrls:[...new Set([holdingSource?.url,holdingSource?.sourceUrl,...(row.sourceUrls??[])].filter(Boolean))],
  nextAction:actions[actionState]??(passive.includes(actionState)?'Conserver le statut et surveiller les prochaines publications.':'Qualifier la cause et le raccordement dans le rapport détaillé.')};
}
