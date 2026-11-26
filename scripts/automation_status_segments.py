"""Lossless, bounded monitor segments. The Git status commit publishes the whole manifest."""
import base64
from concurrent.futures import ThreadPoolExecutor
import gzip
import hashlib
import json
import re
import urllib.request
import zlib

FORMAT = 'sha256-segments-v1'
MAX_RAW = 8 * 1024 * 1024
MAX_FILE = 4 * 1024 * 1024
TARGET = 1024 * 1024
PAGE = 256
DIRECTORY = 'monitor-segments'
CAPABILITY = 'monitor-segment-storage-capabilities.json'
DIGEST = re.compile(r'[0-9a-f]{64}\Z')
ARCHIVES = {'proofChecks', 'reportEvidenceHistory', 'reportResultHistory',
            'reportQualificationHistory', 'sourceChecks', 'validationChecks', 'stepResults'}
HISTORY = ('active', 'resolved', 'retired', 'events')


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()


def segment_path(digest):
    if not isinstance(digest, str) or not DIGEST.fullmatch(digest):
        raise ValueError('Empreinte de segment invalide')
    return f'{DIRECTORY}/{digest[:2]}/{digest}.json'


def decode_segment(raw, digest):
    segment_path(digest)
    if len(raw) > MAX_FILE:
        raise ValueError('Segment stocké trop volumineux')
    envelope = json.loads(raw)
    if (not isinstance(envelope, dict) or set(envelope) != {'decodedBytes', 'data'}
            or type(envelope['decodedBytes']) is not int or not 0 < envelope['decodedBytes'] <= MAX_RAW):
        raise ValueError('Enveloppe de segment invalide')
    data = base64.b64decode(envelope['data'], validate=True)
    if base64.b64encode(data).decode() != envelope['data']:
        raise ValueError('Base64 du segment invalide')
    decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
    body = decoder.decompress(data, envelope['decodedBytes'] + 1)
    if (not decoder.eof or decoder.unused_data or len(body) != envelope['decodedBytes']
            or hashlib.sha256(body).hexdigest() != digest):
        raise ValueError('Taille ou empreinte du segment incorrecte')
    return json.loads(body)


class Writer:
    def __init__(self, known=()):
        self.files = {}
        self.known = set(known)
        self.visited = set()

    def store(self, body):
        if len(body) > MAX_RAW:
            raise ValueError('Enregistrement individuel trop volumineux')
        digest = hashlib.sha256(body).hexdigest()
        self.visited.add(digest)
        path = segment_path(digest)
        if digest not in self.known and path not in self.files:
            data = base64.b64encode(gzip.compress(body, compresslevel=6, mtime=0)).decode()
            wire = json_bytes({'decodedBytes': len(body), 'data': data})
            if len(wire) > MAX_FILE:
                raise ValueError('Segment stocké trop volumineux')
            self.files[path] = wire
        return digest

    def sequence(self, values):
        pages = []
        parts, size = [], 2
        for value in values:
            data = json_bytes(value)
            if parts and (len(parts) == PAGE or size + len(data) + 1 > TARGET):
                pages.append(self.store(b'[' + b','.join(parts) + b']'))
                parts, size = [], 2
            parts.append(data)
            size += len(data) + 1
        if parts:
            pages.append(self.store(b'[' + b','.join(parts) + b']'))
        depth = 0
        while len(pages) > PAGE:
            pages = [self.store(json_bytes(pages[i:i + PAGE])) for i in range(0, len(pages), PAGE)]
            depth += 1
        return {'depth': depth, 'pages': pages}

    def table(self, value):
        if isinstance(value, dict):
            return {'kind': 'map', **self.sequence(value.items())}
        if isinstance(value, list):
            return {'kind': 'list', **self.sequence(value)}
        return {'kind': 'value', 'value': value}

    def fields(self, value, keys):
        return {key: self.table(value[key]) for key in keys if key in value}


def group_receipts(checks):
    groups = {}
    for identifier, value in checks.items():
        if not isinstance(value, dict) or set(value) != {'proofCheckRef'}:
            raise ValueError('Reçu technique sans référence')
        groups.setdefault(value['proofCheckRef'], []).append(identifier)
    return list(groups.items())


def ungroup_receipts(groups):
    if not isinstance(groups, list):
        raise ValueError('Groupes de reçus invalides')
    result = {}
    for digest, identifiers in groups:
        segment_path(digest)
        if not isinstance(identifiers, list) or not identifiers:
            raise ValueError('Identifiants de reçus invalides')
        for identifier in identifiers:
            if not isinstance(identifier, str) or identifier in result:
                raise ValueError('Identifiant de reçu invalide ou répété')
            result[identifier] = {'proofCheckRef': digest}
    return result


def build_manifest(state, known=()):
    """Input is the normal schema 1 state, with receipts already interned."""
    writer = Writer(known)
    base = {k: v for k, v in state.items()
            if k not in ('workflows', 'monitoring', 'proofCheckRecords', 'reportScopes', 'incidentHistoryArchives')}
    root = {'schemaVersion': 3, 'monitorStorage': FORMAT}
    root['records'] = writer.fields(state, ('proofCheckRecords', 'reportScopes', 'incidentHistoryArchives'))
    root['workflows'] = {}
    public_workflows = {}
    for name, row in state['workflows'].items():
        if not isinstance(row, dict):
            public_workflows[name] = row
            continue
        hot = {k: v for k, v in row.items() if k not in ARCHIVES}
        archive = {k: v for k, v in row.items() if k in ARCHIVES}
        if 'proofChecks' in archive and state.get('proofCheckStorage') == 'sha256-records-v1':
            archive['proofChecks'] = group_receipts(archive['proofChecks'])
        root['workflows'][name] = writer.fields(archive, sorted(archive))
        public = {k: v for k, v in hot.items() if k not in ('attemptedDataIds', 'validatedDataIds')}
        reports = row.get('reportEvidenceHistory')
        if isinstance(reports, list):
            qualified = dict.fromkeys((r.get('file'), r.get('producerContract')) for r in reports
                                     if isinstance(r, dict) and isinstance(r.get('file'), str)
                                     and isinstance(r.get('producerContract'), str)
                                     and r.get('scopeExplicit') and r.get('scopePlanVerified'))
            public['reportEvidenceHistory'] = [
                {'file': file, 'producerContract': contract, 'scopeExplicit': True, 'scopePlanVerified': True}
                for file, contract in qualified]
        public_workflows[name] = public
        base.setdefault('workflowCurrent', {})[name] = hot
    monitor = state['monitoring']
    base['monitoring'] = {k: v for k, v in monitor.items() if k not in HISTORY}
    root['incidentLists'] = {}
    lists = {}
    list_identities = {}

    def pack_incident(row):
        if not isinstance(row, dict):
            return row
        ids = row.get('attemptedDataIds')
        if not isinstance(ids, list) or len(ids) < 4:
            return row
        digest = list_identities.get(id(ids))
        if digest is None:
            digest = hashlib.sha256(json_bytes(ids)).hexdigest()
            list_identities[id(ids)] = digest
        lists.setdefault(digest, ids)
        return {k: v for k, v in row.items() if k != 'attemptedDataIds'} | {'attemptedDataIdsRef': digest}

    episodes = {}
    for key in HISTORY[:-1]:
        if key not in monitor:
            continue
        value = monitor[key]
        if isinstance(value, dict):
            values = {}
            for identity, row in value.items():
                if isinstance(row, dict) and row.get('lastSeenAt') and row['lastSeenAt'] == monitor.get('checkedAt'):
                    row = {k: v for k, v in row.items() if k != 'lastSeenAt'} | {'seenAtMonitorCheck': True}
                values[identity] = pack_incident(row)
        else:
            values = [pack_incident(row) for row in value]
            episodes[key] = {hashlib.sha256(json_bytes(row)).hexdigest(): row for row in values}
        root['incidentLists'][key] = writer.table(list(reversed(values)) if isinstance(values, list) else values)

    def event_rows(event, key):
        result = []
        for row in event[key]:
            packed = pack_incident(row)
            digest = hashlib.sha256(json_bytes(packed)).hexdigest()
            match = episodes.get(key, {}).get(digest)
            result.append([digest] if match == packed else [None, packed])
        return result

    if 'events' in monitor:
        events = [{k: event_rows(event, k) if k in ('resolved', 'retired') else v
                   for k, v in event.items()} for event in monitor['events']]
        root['incidentLists']['events'] = writer.table(events)
    root['incidentLists']['attemptedDataIds'] = writer.table(lists)
    base['workflowOrder'] = list(state['workflows'])
    base['otherWorkflows'] = {name: row for name, row in state['workflows'].items() if not isinstance(row, dict)}
    root['base'] = writer.table(base)
    current = {k: state[k] for k in ('schemaVersion', 'recovery', 'monitorSelf', 'inFlightRuns',
                                    'reportArchiveSchemaVersion', 'reportScopeSchemaVersion') if k in state}
    current.update(workflows=public_workflows, monitoring=base['monitoring'])
    root['current'] = writer.table(current)
    if len(json_bytes(root)) > MAX_FILE:
        raise ValueError('Manifeste du moniteur trop volumineux')
    return root, writer.files, writer.visited


class Reader:
    def __init__(self, load):
        self.load = load
        self.verified = set()

    def segments(self, digests):
        def read(digest):
            return decode_segment(self.load(segment_path(digest)), digest)
        with ThreadPoolExecutor(max_workers=8) as workers:
            for index in range(0, len(digests), 8):
                batch = digests[index:index + 8]
                for digest, value in zip(batch, workers.map(read, batch)):
                    if not isinstance(value, list) or len(value) > PAGE:
                        raise ValueError('Page de segment invalide')
                    self.verified.add(digest)
                    yield value

    def sequence(self, descriptor):
        depth, pages = descriptor['depth'], descriptor['pages']
        if type(depth) is not int or not 0 <= depth <= 8:
            raise ValueError('Profondeur des segments invalide')

        def read(level, digests):
            if not isinstance(digests, list) or len(digests) > PAGE:
                raise ValueError('Index de segments invalide')
            for values in self.segments(digests):
                if level:
                    yield from read(level - 1, values)
                else:
                    yield from values
        return read(depth, pages)

    def table(self, descriptor):
        kind = descriptor['kind']
        if kind == 'value' and set(descriptor) == {'kind', 'value'}:
            return descriptor['value']
        if kind not in ('map', 'list') or set(descriptor) != {'kind', 'depth', 'pages'}:
            raise ValueError('Descripteur de segments invalide')
        values = self.sequence(descriptor)
        if kind == 'list':
            return list(values)
        result = {}
        for pair in values:
            if not isinstance(pair, list) or len(pair) != 2 or not isinstance(pair[0], str) or pair[0] in result:
                raise ValueError('Clé de segment invalide ou répétée')
            result[pair[0]] = pair[1]
        return result


def restore_manifest(manifest, load):
    if set(manifest) != {'schemaVersion', 'monitorStorage', 'records', 'workflows', 'incidentLists', 'base', 'current'} or manifest.get('schemaVersion') != 3 or manifest.get('monitorStorage') != FORMAT:
        raise ValueError('Version des segments du moniteur inconnue')
    reader = Reader(load)
    state = reader.table(manifest['base'])
    names = state.pop('workflowOrder')
    current = state.pop('workflowCurrent', {})
    other = state.pop('otherWorkflows')
    workflows = {}
    for name in names:
        if name in other:
            workflows[name] = other[name]
            continue
        row = current[name]
        for key, desc in manifest['workflows'][name].items():
            value = reader.table(desc)
            row[key] = ungroup_receipts(value) if key == 'proofChecks' and state.get('proofCheckStorage') == 'sha256-records-v1' else value
        workflows[name] = row
    state['workflows'] = workflows
    state.update({key: reader.table(desc) for key, desc in manifest['records'].items()})
    descriptors = manifest['incidentLists']
    lists = reader.table(descriptors['attemptedDataIds'])

    monitor = state['monitoring']

    def restore_incident(row, active=False):
        if not isinstance(row, dict):
            return row
        if 'attemptedDataIdsRef' in row:
            row = dict(row)
            digest = row.pop('attemptedDataIdsRef')
            if digest not in lists or 'attemptedDataIds' in row or not isinstance(lists[digest], list):
                raise ValueError('Périmètre d’incident introuvable')
            row['attemptedDataIds'] = lists[digest]
        if active and 'seenAtMonitorCheck' in row:
            if row['seenAtMonitorCheck'] is not True or 'lastSeenAt' in row or not isinstance(monitor.get('checkedAt'), str):
                raise ValueError('Date du contrôle de l’incident invalide')
            row = {k: v for k, v in row.items() if k != 'seenAtMonitorCheck'} | {'lastSeenAt': monitor['checkedAt']}
        return row

    episodes = {}
    for key in HISTORY[:-1]:
        if key not in descriptors:
            continue
        rows = reader.table(descriptors[key])
        if isinstance(rows, dict):
            monitor[key] = {k: restore_incident(v, active=key == 'active') for k, v in rows.items()}
        else:
            rows.reverse()
            monitor[key] = [restore_incident(v) for v in rows]
            episodes[key] = {hashlib.sha256(json_bytes(raw)).hexdigest(): restored
                             for raw, restored in zip(rows, monitor[key])}
    if 'events' in descriptors:
        events = reader.table(descriptors['events'])
        for event in events:
            for key in ('resolved', 'retired'):
                if key in event:
                    entries = []
                    for ref in event[key]:
                        if len(ref) == 2 and ref[0] is None:
                            entries.append(restore_incident(ref[1]))
                        elif len(ref) == 1 and isinstance(ref[0], str) and ref[0] in episodes.get(key, {}):
                            entries.append(episodes[key][ref[0]])
                        else:
                            raise ValueError('Référence d’épisode invalide')
                    event[key] = entries
        monitor['events'] = events
    reader.table(manifest['current'])
    return state, reader.verified


def readers_ready(repo):
    owner, project = repo.split('/')
    request = urllib.request.Request(f'https://{owner}.github.io/{project}/{CAPABILITY}',
                                     headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read(4097)) == {'schemaVersion': 3, 'monitorStorage': FORMAT}
    except (OSError, ValueError):
        return False
