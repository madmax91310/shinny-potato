"""Lossless content-addressed storage for shared report scopes.

A large attempted scope belongs to a report. Repeating it in every field proof
made the ordinary monitor exceed GitHub's write envelope. Identities, dates,
errors and historical episodes stay where they were; only identical scopes share
one record in this same status document.
"""
import base64
import gzip
import hashlib
import json
import zlib

MAX_ARCHIVE_BYTES = 8 * 1024 * 1024


def archive_results(entry):
    """Compress only archived result arrays; all operational clocks stay plain."""
    if 'resultArchive' in entry:
        restore_results(entry)  # Validate an existing archive, never trust its marker.
        return entry
    payload = {k: entry[k] for k in ('successes', 'errors') if k in entry}
    if not payload:
        return entry
    if any(not isinstance(v, list) for v in payload.values()):
        raise ValueError('Résultats historiques invalides')
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    if len(body) < 4096:
        return entry
    if len(body) > MAX_ARCHIVE_BYTES:
        raise ValueError('Résultats historiques au-delà du contrat de lecture')
    return {**{k: v for k, v in entry.items() if k not in payload}, 'resultArchive': {
        'encoding': 'gzip+base64', 'sha256': hashlib.sha256(body).hexdigest(),
        'decodedBytes': len(body), 'counts': {k: len(v) for k, v in payload.items()},
        'data': base64.b64encode(gzip.compress(body, compresslevel=6, mtime=0)).decode()}}


def restore_results(entry):
    archive = entry.get('resultArchive')
    if archive is None:
        return entry
    if any(k in entry for k in ('successes', 'errors')) or not isinstance(archive, dict) or archive.get('encoding') != 'gzip+base64':
        raise ValueError('Encodage des résultats historiques invalide')
    try:
        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
        body = decoder.decompress(base64.b64decode(archive['data'], validate=True), MAX_ARCHIVE_BYTES + 1)
        if len(body) > MAX_ARCHIVE_BYTES or not decoder.eof or decoder.unused_data:
            raise ValueError('Archive historique trop grande ou incomplète')
        payload = json.loads(body)
        if (len(body) != archive.get('decodedBytes') or hashlib.sha256(body).hexdigest() != archive.get('sha256')
                or not isinstance(payload, dict) or not payload or set(payload) - {'successes', 'errors'}
                or any(not isinstance(v, list) for v in payload.values())
                or {k: len(v) for k, v in payload.items()} != archive.get('counts')):
            raise ValueError('Empreinte ou cardinalité de l’archive historique incorrecte')
    except (KeyError, TypeError, zlib.error, ValueError) as error:
        raise ValueError('Archive de résultats historiques illisible') from error
    return {**{k: v for k, v in entry.items() if k != 'resultArchive'}, **payload}


def transform_report_archives(state, transform):
    version = state.get('reportArchiveSchemaVersion', 1)
    if version != 1:
        raise ValueError('Version des archives de rapports inconnue')
    result = dict(state)
    result['workflows'] = {}
    errors = dict(state.get('observerErrors', {}))
    for name, row in state.get('workflows', {}).items():
        if not isinstance(row, dict):
            result['workflows'][name] = row
            continue
        target = dict(row)
        for key in ('reportEvidenceHistory', 'reportResultHistory'):
            if key not in row:continue
            if not isinstance(row[key], list):
                errors[f'archive:{name}:{key}'] = {'cause':'Liste des archives de rapports invalide ; preuve historique non démontrée.'}
                continue
            errors.pop(f'archive:{name}:{key}', None)
            target[key] = []
            for index, entry in enumerate(row[key]):
                error_key = f'archive:{name}:{key}:{index}'
                try:
                    value = transform(entry)
                except (ValueError, TypeError, AttributeError) as error:
                    value = entry  # Preserve the exact evidence, without calling it valid.
                    errors[error_key] = {'cause': 'Archive du rapport non qualifiée : '+str(error)[:250]}
                else:
                    errors.pop(error_key, None)
                target[key].append(value)
        result['workflows'][name] = target
    if errors or 'observerErrors' in state:result['observerErrors'] = errors
    return result


def expand_report_archives(state):
    result = transform_report_archives(state, restore_results)
    result.pop('reportArchiveSchemaVersion', None)
    return result


def scope_key(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def pack_report_scopes(state):
    state = transform_report_archives(state, archive_results)
    if any('resultArchive' in entry for row in state.get('workflows', {}).values()
           for key in ('reportEvidenceHistory', 'reportResultHistory') if isinstance(row, dict) and isinstance(row.get(key, []), list) for entry in row.get(key, []) if isinstance(entry, dict)):
        state['reportArchiveSchemaVersion'] = 1
    registry=dict(state.get('reportScopes',{}))
    if state.get('reportScopeSchemaVersion',1)!=1 or any(not isinstance(v,dict)or scope_key(v)!=k for k,v in registry.items()):
        raise ValueError('Registre des périmètres de preuve invalide')
    def visit(value):
        if isinstance(value,list):return [visit(v)for v in value]
        if not isinstance(value,dict):return value
        proof=bool(value.get('file')and value.get('sha256'))
        scope=value.get('scope')if proof else None
        result={k:visit(v)for k,v in value.items()if not(proof and isinstance(scope,dict)and k=='scope')}
        if isinstance(scope,dict):
            key=scope_key(scope);registry.setdefault(key,scope)
            result['scopeRef']=key
            result['scopeSummary']={**({'kind':scope['kind']}if 'kind'in scope else{}),
                **{k+'Count':len(scope[k])for k in ('expectedIds','requestedIds','networkRequestedIds')if isinstance(scope.get(k),list)}}
        elif proof and value.get('scopeRef')not in (None,*registry.keys()):
            raise ValueError('Périmètre de preuve référencé absent')
        return result
    result=visit({k:v for k,v in state.items()if k not in ('reportScopes','reportScopeSchemaVersion')})
    if registry:result.update(reportScopeSchemaVersion=1,reportScopes=registry)
    return result


def expand_report_scopes(state):
    """Resolve the additive wire contract for consumers requiring the full scope."""
    registry=state.get('reportScopes',{})
    if state.get('reportScopeSchemaVersion',1)!=1 or any(not isinstance(v,dict)or scope_key(v)!=k for k,v in registry.items()):
        raise ValueError('Registre des périmètres de preuve invalide')
    def visit(value):
        if isinstance(value,list):return [visit(v)for v in value]
        if not isinstance(value,dict):return value
        result={k:visit(v)for k,v in value.items()}
        if value.get('file')and value.get('sha256')and value.get('scopeRef'):
            key=result.pop('scopeRef');result.pop('scopeSummary',None)
            if key not in registry:raise ValueError('Périmètre de preuve référencé absent')
            result['scope']=registry[key]
        return result
    return visit({k:v for k,v in state.items()if k not in ('reportScopes','reportScopeSchemaVersion')})


MAX_STATUS_BYTES = 256 * 1024 * 1024
STATUS_TRANSPORT = 'gzip+base64-v1'


def decode_status(state):
    """Restore the bounded wire envelope; legacy reports remain unchanged."""
    if not isinstance(state, dict) or 'monitorStorage' not in state:
        return state
    try:
        if (set(state) != {'schemaVersion', 'monitorStorage', 'decodedBytes', 'sha256', 'data'}
                or state['schemaVersion'] != 2 or state['monitorStorage'] != STATUS_TRANSPORT
                or type(state['decodedBytes']) is not int or not 0 < state['decodedBytes'] <= MAX_STATUS_BYTES):
            raise ValueError('Unknown monitor storage envelope')
        packed = base64.b64decode(state['data'], validate=True)
        if base64.b64encode(packed).decode() != state['data']:
            raise ValueError('Non-canonical base64')
        decoder = zlib.decompressobj(16 + zlib.MAX_WBITS)
        raw = decoder.decompress(packed, state['decodedBytes'] + 1)
        if (not decoder.eof or decoder.unused_data or len(raw) != state['decodedBytes']
                or hashlib.sha256(raw).hexdigest() != state['sha256']):
            raise ValueError('Monitor storage checksum/size mismatch')
        restored = json.loads(raw.decode('utf-8'))
        if not isinstance(restored, dict) or restored.get('schemaVersion') != 1 or 'monitorStorage' in restored:
            raise ValueError('Invalid or nested monitor state')
        return restored
    except (KeyError, TypeError, UnicodeError, zlib.error, ValueError) as error:
        raise ValueError('Transport du moniteur invalide ; aucune preuve réinitialisée') from error


def reader_ready(repo, fetch=None):
    """Only the deployed code may authorize a new wire format, never CI alone."""
    import urllib.request
    owner, project = repo.split('/')
    url = f'https://{owner}.github.io/{project}/monitor-storage-capabilities.json'
    if fetch is None:
        def fetch(url):
            with urllib.request.urlopen(url, timeout=20) as response:
                return json.loads(response.read(4097))
    try:
        return fetch(url) == {'schemaVersion': 1, 'monitorStorage': STATUS_TRANSPORT}
    except (OSError, ValueError, TypeError):
        return False


def encode_status(state, compressed=False):
    """UTF-8 compact JSON is lossless; omit indentation from this machine payload."""
    body=(json.dumps(state,ensure_ascii=False,separators=(',',':'))+'\n').encode()
    if compressed:
        if len(body) > MAX_STATUS_BYTES or state.get('schemaVersion') != 1 or 'monitorStorage' in state:
            raise ValueError('État du moniteur hors contrat de transport ; historique conservé')
        envelope = {'schemaVersion': 2, 'monitorStorage': STATUS_TRANSPORT,
                    'decodedBytes': len(body), 'sha256': hashlib.sha256(body).hexdigest(),
                    'data': base64.b64encode(gzip.compress(body, compresslevel=6, mtime=0)).decode()}
        body = (json.dumps(envelope, separators=(',', ':')) + '\n').encode()
    return base64.b64encode(body).decode()
