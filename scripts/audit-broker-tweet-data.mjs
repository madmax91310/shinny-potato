// Audit the observations actually used by the tweet, including the manual
// fallback and independently dated transfer/offer observations.
import { producerContract } from './producer-result-contract.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { BROKER_TARIFFS, brokerProfile } from '../src/data/broker-tariffs.js';
import { BROKERS } from '../src/pages/broker-comparator/data.js';
import { brokerShortCopy } from '../src/pages/broker-comparator/shortCopy.js';
import { buildBrokerTweet } from '../src/pages/broker-comparator/lib.js';

const FIELDS = ['frais','change','garde','dca','pea','pme','jeune','ifu','cash','transfert','boursomarkets'];
const isoToday = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris'}).format(new Date());
const days = (a,b) => Math.floor((Date.parse(a)-Date.parse(b))/86400000);

export function auditBrokerTweetData(observations = BROKER_TARIFFS, today = isoToday(), failures = {}) {
  const cells = [], offers = [], errors = [];
  for (const broker of BROKERS) {
    const id = broker.id, o = observations[id], profile = brokerProfile(id, observations, today);
    if (!o) { errors.push(`${id}: observation absente`); continue; }
    const fields = o.fields ?? {};
    for (const field of FIELDS) {
      let records = [], status;
      if (field === 'boursomarkets' && id !== 'bourso') status = 'sans objet';
      else if (field === 'frais') { records = [o]; status = 'confirmé'; }
      else if (field === 'transfert') {
        records = [profile.entrant ?? fields.entrant, fields.sortant].filter(Boolean);
        status = records.length === 2 && records.every(r => r.status === 'confirmé' || r.values?.fee != null || r.values?.maximum != null || r.values?.available === 0) ? 'confirmé' : 'partiel';
      } else {
        records = [profile[field] ?? fields[field]].filter(Boolean);
        status = records[0]?.status ?? (records.length ? 'confirmé' : 'non établi');
      }
      const checkedAt = records.map(r => r.checkedAt).filter(Boolean).sort()[0] ?? null;
      const manual = records.some(r => r.reviewed);
      const stale = records.some(r => !r.checkedAt || r.checkedAt > today || (r.reviewed ? r.reviewUntil < today : days(today,r.checkedAt) > 7));
      const sources = [...new Set(records.flatMap(r => r.refs?.length ? r.refs.map(ref => ref.sourceUrl) : [r.sourceUrl]).filter(Boolean))];
      if (status !== 'sans objet' && (!records.length || !sources.length || !checkedAt)) errors.push(`${id}:${field}: preuve ou date absente`);
      if (records.some(r => !r.checkedAt || !(r.sourceUrl || r.refs?.some(ref=>ref.sourceUrl)))) errors.push(`${id}:${field}: observation composante sans preuve ou date`);
      cells.push({broker:id, field, status, sourceMode:status==='sans objet' ? 'sans objet' : manual ? 'recoupement manuel' : 'collecte officielle', checkedAt, stale, sources});
    }
    for (const [field, record] of Object.entries(fields).filter(([key]) => key.startsWith('offer') || key==='minimumOrder')) {
      if (!record.sourceUrl || !record.checkedAt) errors.push(`${id}:${field}: preuve absente`);
      const active = (!record.start || record.start <= today) && (!record.until || record.until >= today);
      offers.push({broker:id,field,active,checkedAt:record.checkedAt,start:record.start??null,until:record.until??null,values:record.values,source:record.sourceUrl});
    }
  }
  const tweets = [];
  for (let a=0;a<BROKERS.length;a++) for (let b=a+1;b<BROKERS.length;b++) {
    const selected=[BROKERS[a],BROKERS[b]], text=buildBrokerTweet(selected,observations,today);
    if (/undefined|\bNaN\b/.test(text)) errors.push(`${selected.map(b=>b.id).join('/')}: valeur invalide dans le tweet`);
    tweets.push({brokers:selected.map(b=>b.id),text});
  }
  const published = Object.fromEntries(BROKERS.filter(b=>observations[b.id]).map(b=>[b.id,brokerShortCopy(b.id,observations,today)]));
  const count = key => cells.reduce((totals,row) => ({...totals,[row[key]]:(totals[row[key]]??0)+1}),{});
  return {checkedAt:today,summary:{brokers:BROKERS.length,cells:cells.length,tweets:tweets.length,status:count('status'),sources:count('sourceMode'),stale:cells.filter(c=>c.stale).length},cells,offers,collectionFailures:failures,published,tweets,errors};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2), arg=name=>args.includes(name)?args[args.indexOf(name)+1]:undefined;
  const contract=producerContract('broker-tweet-validation','broker-tweet-observation',BROKERS.flatMap(b=>FIELDS.map(field=>({id:'broker-tweet:'+b.id+':'+field,instrument:b.id,fields:[field],selected:true}))))
  const output=arg('--output'); if(output)contract.start(output);
  const file=arg('--observation'), collection=file?JSON.parse(readFileSync(file,'utf8')):null;
  let report=auditBrokerTweetData(collection?.observations?.brokers ?? BROKER_TARIFFS,arg('--today')??isoToday(),collection?.failures??{});
  const successes=[], errors=[];
  for(const cell of report.cells){
    const id='broker-tweet:'+cell.broker+':'+cell.field, failures=report.errors.filter(e=>e.startsWith(cell.broker+':'+cell.field+':'));
    if(failures.length)errors.push({id,error:failures.join(' ; '),phase:'validation',sourceAttempted:false});
    else successes.push({id,phase:'validation',sourceAttempted:false,validatedAt:report.checkedAt});
  }
  report=contract.finish({...report,contractResults:{successes,errors}});
  if (output) writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({summary:report.summary,offers:report.offers,collectionFailures:report.collectionFailures,errors:report.errors},null,2));
  if (report.errors.length) process.exitCode=1;
}
