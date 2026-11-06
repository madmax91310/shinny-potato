"""Withhold unverified quoted-price windows after declared corporate actions.

No split is financially qualified by Yahoo metadata alone. No observed price or
return level is changed. Official operations and provider detections are separate.
"""
import argparse
import copy
import datetime as dt
import gzip
import hashlib
import json
import pathlib
from urllib.parse import quote, urlencode
from zoneinfo import ZoneInfo
from data_automation import get_json, number, write_json_atomic

ROOT=pathlib.Path(__file__).resolve().parents[1]

def probe_url(config,now):
    start=dt.datetime.strptime(config['periodStart'],'%Y-%m').replace(tzinfo=dt.timezone.utc)
    return 'https://query2.finance.yahoo.com/v8/finance/chart/'+quote(config['symbol'],safe='')+'?'+urlencode({
        'period1':int(start.timestamp()),'period2':int(now.timestamp()),'interval':'1mo','events':'splits'})


def qualify(config,result,now,fetch=None,probe=None,source_url=None):
    if not config.get('collectAnniversary') or config.get('parser')!='yahoo' or result.get('splitAdjustmentEvidence'):
        return result  # BNKE has independently qualified actual historical quote units.
    url=source_url or probe_url(config,now)
    body=probe if probe is not None else (fetch or get_json)(url)
    chart=body.get('chart',{})
    if chart.get('error')or len(chart.get('result')or[])!=1:raise ValueError('Corporate-action probe failed')
    data=chart['result'][0];meta=data['meta']
    if (meta.get('symbol'),meta.get('currency'),meta.get('dataGranularity'))!=(config['symbol'],config['currency'],'1mo'):
        raise ValueError('Wrong corporate-action probe identity/currency/frequency')
    zone=ZoneInfo(meta['exchangeTimezoneName'])
    if config.get('timezone')and config['timezone']!=str(zone):raise ValueError('Corporate-action probe timezone changed')
    events=[]
    for row in data.get('events',{}).get('splits',{}).values():
        day=dt.datetime.fromtimestamp(number(row['date']),dt.timezone.utc).astimezone(zone).date().isoformat()
        numerator,denominator=number(row['numerator']),number(row['denominator'])
        if day>now.date().isoformat()or numerator==denominator:continue
        events.append(dict(exDate=day,numerator=numerator,denominator=denominator,
                           ratio=numerator/denominator,corporateActionValidation='provider-declaration-only',sourceUrl=url))
    official=result.get('splitComparisonEvidence')
    if official:
        # This is a proven operation, but a comparison-only proof does not
        # reconstruct the prices actually quoted before that operation.
        events.append({k:official[k]for k in ['exDate','ratio','sourceUrl','sha256']}|
                      {'corporateActionValidation':'official-operation; historical-quote-unconfirmed'})
    if not events:return result
    events.sort(key=lambda row:row['exDate'])
    latest=events[-1]
    excluded=[row['date'][:7]for row in result['proofRows']if row['date']<latest['exDate']]
    if not excluded:return result
    result=copy.deepcopy(result)
    digest=hashlib.sha256(json.dumps(body,sort_keys=True,allow_nan=False).encode()).hexdigest()
    result['anniversaryExcludedMonths']=sorted(set(result.get('anniversaryExcludedMonths',[])+excluded))
    result['anniversaryExclusionReason']=(config['symbol']+' : prix historique réellement coté non certifié avant le '+latest['exDate'].split('-')[2]+'/'+latest['exDate'].split('-')[1]+'/'+latest['exDate'].split('-')[0]+
        ' ; le cours fourni est susceptible d’être ajusté d’une opération sur titres. Les déclarations fournisseur ne qualifient pas une opération officielle ni un cours d’époque. Les mois récents vérifiables et les rendements restent disponibles.')
    result['anniversaryPriceReview']={'checkedAt':now.date().isoformat(),'sourceUrl':url,'sha256':digest,
        'events':events,'excludedMonths':excluded,'historicalQuoteValidation':False,
        'method':'Declared/proven corporate action investigated; quoted-price units unconfirmed before latest event. No observed value modified; no ratio applied.'}
    result['sourceUrls']=list(dict.fromkeys(result.get('sourceUrls',[])+[url]))
    if 'rawResponse'in result:result['rawResponse']['anniversaryPriceUnitProbe']={'url':url,'response':body}
    return result


def retain_prior_review(previous,result):
    """A missing/older provider declaration cannot certify old quote units."""
    old=(previous or {}).get('anniversaryPriceReview')
    new=result.get('anniversaryPriceReview')
    if not old:return result
    latest=lambda p:max(e['exDate']for e in p['events'])
    if new and latest(new)>=latest(old):return result
    result=copy.deepcopy(result)
    retained=copy.deepcopy(old)
    retained['excludedMonths']=[r['date'][:7]for r in result['proofRows']if r['date']<latest(old)]
    retained['retainedFromPriorObservation']=previous['responseSha256']
    result['anniversaryPriceReview']=retained
    result['anniversaryExcludedMonths']=sorted(set(result.get('anniversaryExcludedMonths',[])+retained['excludedMonths']))
    result['anniversaryExclusionReason']=previous['anniversaryExclusionReason']
    result['sourceUrls']=list(dict.fromkeys(result.get('sourceUrls',[])+[old['sourceUrl']]))
    if 'rawResponse'in result:result['rawResponse']['retainedAnniversaryPriceReview']=old
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probe-dir',type=pathlib.Path,required=True,help='Actual archived provider responses and receipts; never relabelled as a fresh source check')
    parser.add_argument('--apply',action='store_true');parser.add_argument('--output',type=pathlib.Path,required=True)
    args=parser.parse_args();now=dt.datetime.now(dt.timezone.utc)
    configs={r['id']:r for file in ['monthly-automation.json','non-bond-monthly-sources.json']for r in json.loads((ROOT/'scripts'/file).read_text())['series']}
    files=['automated-monthly.json','automated-etf-monthly.json','non-bond-monthly-records.json']
    registries={f:json.loads((ROOT/'src/data'/f).read_text())for f in files}
    owners={id:f for f,records in registries.items()for id in records}
    evidence_files=['monthly-lifestrategy.json','monthly-automated-round4.json','monthly-automated.json','non-bond-monthly-active.json']
    evidence={};eowners={};contents={}
    for f in evidence_files:
        contents[f]=json.loads((ROOT/'scripts/source-snapshots'/f).read_text())
        for id,r in contents[f].items():evidence[id]=r;eowners[id]=f
    receipts={r['id']:r for r in json.loads((args.probe_dir/'results.json').read_text())}
    rows=[]
    for id,receipt in receipts.items():
        if receipt['status']!='observed':rows.append({'id':id,'status':'unavailable','reason':receipt.get('reason')});continue
        previous=registries[owners[id]][id];proof=evidence[id]
        if proof['responseSha256']!=previous['responseSha256']:raise ValueError('Snapshot proof differs from published observation: '+id)
        body=json.loads(gzip.decompress((args.probe_dir/(receipt['sha256']+'.json.gz')).read_bytes()))
        result=qualify(configs[id],{**previous,'proofRows':proof['proofRows']},now,probe=body,source_url=receipt['url'])
        if 'anniversaryPriceReview'not in result:continue
        # The original price observation and its control date stay unchanged.
        assert result['points']==previous['points']and result['anniversaryPoints']==previous['anniversaryPoints']
        assert result['checkedAt']==previous['checkedAt']and result['responseSha256']==previous['responseSha256']
        result.pop('proofRows');registries[owners[id]][id]=result
        contents[eowners[id]][id]={**proof,**{key:result[key]for key in ['anniversaryExcludedMonths','anniversaryExclusionReason','anniversaryPriceReview','sourceUrls']}}
        rows.append({'id':id,'status':'quoted-price-window-unconfirmed','excludedMonths':result['anniversaryExcludedMonths'],
            'sourceCheckedAt':result['checkedAt'],'reviewCheckedAt':result['anniversaryPriceReview']['checkedAt'],'events':result['anniversaryPriceReview']['events'],
            'numericObservationsChanged':False,'reason':result['anniversaryExclusionReason']})
    if args.apply:
        for f,r in registries.items():write_json_atomic(ROOT/'src/data'/f,r)
        for f,r in contents.items():write_json_atomic(ROOT/'scripts/source-snapshots'/f,r)
    write_json_atomic(args.output,{'checkedAt':now.isoformat(),'sourceScope':len(receipts),'series':rows})
    print('Price unit review:',len(rows),'windows investigated; no numerical observation changed')

if __name__=='__main__':main()
