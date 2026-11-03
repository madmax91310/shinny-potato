"""Prove a new source-specific adapter cannot change other metadata call paths."""
import ast
# Independent expected scope: never import a producer before inspecting its AST.
URL = 'https://api.primary.21shares.com/api/product_details/ABTC'
ISIN = 'CH0454664001'

DECODE = '''if url == ABTC_URL:
    if fetch is download:
        body,actual=TRANSPORT.read(url,fetch=download,return_source=True,url_validator=lambda candidate:candidate==ABTC_URL)
    else:body,actual=fetch(url),url
    return decode_document(body,url,actual),actual'''
ROWS = '''if url == ABTC_URL:
    digest=hashlib.sha256(body).hexdigest();isin=source['isin']
    return [r|{'sourceUrl':url,'checkedAt':checked,'sha256':digest,'evidenceId':f"{isin}-{r['mic']}-{r['ticker']}-{r['currency']}"}for r in listing_rows(body,source,url,checked)]'''
PATHS = {'scripts/collect_instrument_metadata.py', 'scripts/twentyone_shares_listing.py',
         'scripts/test_twentyone_shares_listing.py', 'scripts/metadata_listing_evidence_scope.py',
         'scripts/metadata_route_evidence_scope.py', 'scripts/test_metadata_listing_evidence_scope.py',
         'scripts/listing-source-hosts.json', 'src/data/qualified-listings.js'}


def dump(node): return ast.dump(node, include_attributes=False)


def isolated_adapter(base_code, head_code, helper_code):
    try:
        helper = ast.parse(helper_code)
        constants = {}
        for node in helper.body:
            if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                constants[node.targets[0].id] = ast.literal_eval(node.value)
            elif isinstance(node, ast.Import):
                if any(x.name not in {'datetime', 'gzip', 'io', 'json', 'zlib'} for x in node.names): return False
            elif isinstance(node, ast.FunctionDef):
                if node.decorator_list or node.args.defaults or node.args.kw_defaults: return False
            elif not (isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str)):
                return False
        if constants != {'URL': URL, 'ISIN': ISIN, 'MAX_BYTES': 8_000_000}: return False
        hooks = {dump(ast.parse(DECODE).body[0]): 'decode', dump(ast.parse(ROWS).body[0]): 'rows'}
        imports = {dump(ast.parse('from twentyone_shares_listing import URL as ABTC_URL, '+name).body[0])
                   for name in ['decode_document', 'listing_rows']}
        counts = dict(decode=0, rows=0, imports=0, characteristics=0)

        class Strip(ast.NodeTransformer):
            def visit_ImportFrom(self, node):
                if dump(node) in imports:
                    counts['imports'] += 1
                    return None
                return node

            def visit_If(self, node):
                key = hooks.get(dump(node))
                if key:
                    counts[key] += 1
                    return None
                expected = ast.parse('if url == '+repr(URL)+': fields={}').body[0]
                if (dump(node.test) == dump(expected.test) and [dump(x) for x in node.body] == [dump(x) for x in expected.body]
                        and len(node.orelse) == 1 and isinstance(node.orelse[0], ast.If)):
                    counts['characteristics'] += 1
                    return self.visit(node.orelse[0])
                return self.generic_visit(node)

        stripped = Strip().visit(ast.parse(head_code))
        return counts == dict(decode=1, rows=1, imports=2, characteristics=1) and dump(stripped) == dump(ast.parse(base_code))
    except (ValueError, TypeError, SyntaxError):
        return False


def select(before, after, paths, base_code, head_code, helper_code,
           registry_before=None, registry_after=None, consumer_before=None, consumer_after=None):
    if (before != after or not paths or any(p not in PATHS and not p.startswith('scripts/fixtures/21shares-listing-20261102/') for p in paths)
            or not isolated_adapter(base_code, head_code, helper_code)):
        return None
    if 'scripts/listing-source-hosts.json' in paths:
        if (not isinstance(registry_before, dict) or not isinstance(registry_after, dict)
                or registry_after != registry_before | {'hosts': registry_before.get('hosts', []) + ['api.primary.21shares.com']}):
            return None
    if 'src/data/qualified-listings.js' in paths:
        old = 'const officialListingSource='
        if (not isinstance(consumer_before, str) or consumer_before.count(old) != 1
                or consumer_after != consumer_before.replace(old, 'export '+old)):
            return None
    references = [r for r in after['instruments'] if r['isin'] == ISIN]
    if len(references) != 1 or URL not in references[0].get('urls', []): return None
    # The newly admitted issuer origin has only this pre-existing configured route.
    from urllib.parse import urlsplit
    for instrument in after['instruments']:
        for url in instrument.get('urls', []):
            if urlsplit(url).hostname == 'api.primary.21shares.com' and (instrument['isin'] != ISIN or url != URL):
                return None
    return {'mode': 'targeted-field-routes', 'ids': [ISIN],
            'fields': references[0].get('fields', ['distribution','domicile','replicationMethod','pea','currencyHedge','listings']),
            'changedFields': ['listings'],
            'reason': 'Exact pre-existing ABTC route only; remaining collector AST, generated configurations and holdings are identical. Expected scope fixed before network.'}
