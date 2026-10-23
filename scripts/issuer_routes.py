"""Issuer access routes shared by the Python collectors (scripts/issuer-access-routes.json)."""
import json
import pathlib
import re

ROUTES = json.loads((pathlib.Path(__file__).with_name('issuer-access-routes.json')).read_text())


def vaneck_factsheet_candidates(url):
    """The requested VanEck factsheet first, then the same file on each gate known to
    serve automated clients."""
    name = url.rsplit('/', 1)[1]
    route = ROUTES['vaneck']
    # The browser helper only reads English regional documents: /fr/fr/ is requested as /fr/en/.
    requested = re.sub(r'^(https://www\.vaneck\.com/[a-z]{2})/[a-z]{2}/', r'\1/en/', url)
    regions = route.get('factsheetRegionsByDocument', {}).get(name, route['factsheetRegions'])
    alternatives = [route['factsheet'].format(region=region, name=name) for region in regions]
    return list(dict.fromkeys([requested, *alternatives]))
