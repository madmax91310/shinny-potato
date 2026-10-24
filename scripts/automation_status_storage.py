"""Lossless content-addressed storage for shared report scopes.

A large attempted scope belongs to a report. Repeating it in every field proof
made the ordinary monitor exceed GitHub's write envelope. Identities, dates,
errors and historical episodes stay where they were; only identical scopes share
one record in this same status document.
"""
import base64
import hashlib
import json


def scope_key(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def pack_report_scopes(state):
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


def encode_status(state):
    """UTF-8 compact JSON is lossless; omit indentation from this machine payload."""
    body=(json.dumps(state,ensure_ascii=False,separators=(',',':'))+'\n').encode()
    return base64.b64encode(body).decode()
