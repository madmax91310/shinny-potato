"""Lossless storage for repeated histories of active monitoring incidents."""
import base64
import gzip
import hashlib
import json
import urllib.request
import zlib

STORAGE = 'gzip-sha256-incidents-v1'
MAX_RECORD = 8 * 1024 * 1024
MAX_HISTORY = 128 * 1024 * 1024


def pack_incident_history(state):
    monitoring = state.get('monitoring', {})
    active = monitoring.get('active', {})
    packed, archives = {}, {}
    total = 0
    for key, incident in active.items():
        observations = incident.get('observations')
        if not isinstance(observations, list):
            packed[key] = incident
            continue
        body = json.dumps(observations, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()
        if len(body) < 4096 or len(body) > MAX_RECORD:
            packed[key] = incident
            continue
        digest = hashlib.sha256(body).hexdigest()
        if digest not in archives:
            total += len(body)
            if total > MAX_HISTORY:
                raise ValueError('Historique des incidents au-delà du contrat de lecture')
            archives[digest] = {
                'decodedBytes': len(body),
                'data': base64.b64encode(gzip.compress(body, compresslevel=6, mtime=0)).decode(),
            }
        packed[key] = {**{k: v for k, v in incident.items() if k != 'observations'},
                       'observationHistoryRef': digest}
    if not archives:
        return state
    return {**state, 'monitoring': {**monitoring, 'active': packed},
            'incidentHistoryStorage': STORAGE, 'incidentHistoryArchives': archives}


def expand_incident_history(state):
    if not isinstance(state, dict):
        return state
    if not ({'incidentHistoryStorage', 'incidentHistoryArchives'} & state.keys()):
        return state
    archives = state.get('incidentHistoryArchives')
    monitoring = state.get('monitoring')
    if (state.get('incidentHistoryStorage') != STORAGE or not isinstance(archives, dict)
            or not isinstance(monitoring, dict) or not isinstance(monitoring.get('active'), dict)):
        raise ValueError('Registre des historiques d’incidents incorrect')
    records, used = {}, set()
    total = 0
    for digest, archive in archives.items():
        if not isinstance(archive, dict) or set(archive) != {'decodedBytes', 'data'}:
            raise ValueError('Archive d’incident incorrecte')
        length = archive['decodedBytes']
        payload = archive['data']
        if (type(length) is not int or not 0 < length <= MAX_RECORD
                or not isinstance(payload, str) or len(payload) > 2 * MAX_RECORD):
            raise ValueError('Archive d’incident hors contrat')
        total += length
        if total > MAX_HISTORY:
            raise ValueError('Historique des incidents au-delà du contrat de lecture')
        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
        raw = decoder.decompress(base64.b64decode(payload, validate=True), length + 1)
        if (not decoder.eof or decoder.unused_data or len(raw) != length
                or hashlib.sha256(raw).hexdigest() != digest):
            raise ValueError('Empreinte ou taille de l’historique incorrecte')
        observations = json.loads(raw)
        if not isinstance(observations, list) or any(not isinstance(x, dict) for x in observations):
            raise ValueError('Observations d’incident incorrectes')
        records[digest] = observations
    active = {}
    for key, incident in monitoring['active'].items():
        if not isinstance(incident, dict):
            raise ValueError('Incident incorrect')
        if 'observationHistoryRef' not in incident:
            active[key] = incident
            continue
        digest = incident['observationHistoryRef']
        if not isinstance(digest, str) or digest not in records or 'observations' in incident:
            raise ValueError('Référence d’historique d’incident incorrecte')
        used.add(digest)
        active[key] = {**{k: v for k, v in incident.items() if k != 'observationHistoryRef'},
                       'observations': records[digest]}
    if used != records.keys():
        raise ValueError('Historique d’incident sans référence')
    return {**{k: v for k, v in state.items() if k not in ('incidentHistoryStorage', 'incidentHistoryArchives')},
            'monitoring': {**monitoring, 'active': active}}


def incident_history_reader_ready(repo):
    owner, project = repo.split('/')
    url = f'https://{owner}.github.io/{project}/monitor-incident-history-capabilities.json'
    try:
        request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read(4097)) == {'schemaVersion': 1, 'incidentHistoryStorage': STORAGE}
    except (OSError, ValueError):
        return False
