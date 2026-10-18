"""Issuer access routes shared by the Python collectors (scripts/issuer-access-routes.json)."""
import json
import pathlib

ROUTES = json.loads((pathlib.Path(__file__).with_name('issuer-access-routes.json')).read_text())


def vaneck_factsheet_candidates(url):
    """The requested VanEck factsheet first, then the same file on each gate known to
    serve automated clients."""
    name = url.rsplit('/', 1)[1]
    route = ROUTES['vaneck']
    alternatives = [route['factsheet'].format(region=region, name=name) for region in route['factsheetRegions']]
    return list(dict.fromkeys([url, *alternatives]))
