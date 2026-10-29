"""Lossless bounded storage for the existing independent-identifier receipts.

Full responses, their hashes and their original clocks survive; only their
on-disk encoding changes. Browser projections never include this cache.
"""
import base64
import gzip
import io
import json

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
