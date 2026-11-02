import manifest from '../instrument-metadata-fields.json' with {type:'json'};
// Supplemental URLs do not expand a restricted producer's field ownership by
// their mere presence. Each extra field must be explicitly declared.
export function restrictedMetadataRoute(isin,primary,owned,supplemental={}) {
 const extra=supplemental.fields??[],fields=[...new Set([...owned,...extra])];
 if(!owned.length||fields.some(field=>!manifest.owned.includes(field)))throw Error('Unsupported restricted metadata field route');
 if(extra.length&&(!supplemental.urls?.length))throw Error('Supplemental metadata field has no source');
 const urls=[...new Set([primary,...(extra.length?supplemental.urls:[])])];
 for(const value of urls){const url=new URL(value);if(url.protocol!=='https:')throw Error('Metadata source must be HTTPS');if(url.hostname==='www.justetf.com'&&url.searchParams.get('isin')!==isin)throw Error('Supplemental profile identifies another share')}
 return {fields,urls};
}
