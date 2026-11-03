"""Lossless bounded storage for the existing independent-identifier receipts.

Full responses, their hashes and their original clocks survive; only their
on-disk encoding changes. Browser projections never include this cache.
"""
import base64
import gzip
import io
import json
import datetime as dt

LIMIT=8_000_000


def expand_observation(record):
    if 'responseGzipBase64' not in record:return record
    encoded=record['responseGzipBase64']
    if 'response' in record or not isinstance(encoded,str) or len(encoded)>LIMIT:
        raise ValueError('Ambiguous or oversized identifier cache')
    try:
        packed=base64.b64decode(encoded,validate=True)
        with gzip.GzipFile(fileobj=io.BytesIO(packed)) as stream:
            raw=stream.read(LIMIT+1)
        if len(raw)>LIMIT:raise ValueError('Oversized expanded identifier receipt')
        response=json.loads(raw)
        if not isinstance(response,list):raise ValueError('Invalid identifier receipt')
    except (OSError,EOFError,ValueError) as error:
        raise ValueError('Invalid compressed identifier receipt') from error
    return {**{k:v for k,v in record.items() if k!='responseGzipBase64'},'response':response}


def compact_observation(record):
    expanded=expand_observation(record)
    raw=json.dumps(expanded['response'],ensure_ascii=False,separators=(',',':')).encode()
    if len(raw)>LIMIT:raise ValueError('Oversized identifier receipt')
    return {**{k:v for k,v in expanded.items() if k!='response'},
            'responseGzipBase64':base64.b64encode(gzip.compress(raw,mtime=0)).decode()}


def lookup_key(job):
    return (job['idType'],job['idValue'],job.get('exchCode'),job.get('includeUnlistedEquities',False))


def recent_lookup_keys(observations,now,positive_days,negative_days):
    """A negative lookup must not suppress ordinary recovery for a full year."""
    result=set()
    for evidence in observations:
        age=(now-dt.datetime.fromisoformat(evidence['checkedAt'])).total_seconds()/86400
        for job,reply in zip(evidence['request'],evidence['response']):
            if 0<=age<=(positive_days if reply.get('data') else negative_days):result.add(lookup_key(job))
    return result
