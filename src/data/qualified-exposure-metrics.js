import base from './qualified-exposure-etfs.json' with {type:'json'};
import expansion from './non-bond-qualified-records.json' with {type:'json'};
export const QUALIFIED_METRICS = Object.fromEntries(Object.values({...base,...expansion}).map(r=>[r.isin,r.metrics ?? {}]));
