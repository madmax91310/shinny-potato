"""Execute the isolated supervision contract matrix and preserve each actual outcome.

These are fault injections into reducers/readers, never production source outages.
Source-level financial qualification remains the responsibility of producer tests.
"""
import csv
import datetime as dt
import io
import json
from pathlib import Path
import unittest
from test_automation_product import ProductContracts
from publish_automation_status import REGISTRY


class Evidence(unittest.TextTestResult):
    def __init__(self, *args):
        super().__init__(*args)
        self.rows = []

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        params = dict(subtest.params)
        workflow, fault = params.get('workflow', ''), params.get('fault', params.get('cause', ''))
        nonapplicable = (fault in ('generation', 'recording', 'publication') and
                        (REGISTRY[workflow].get('validationOnly') or REGISTRY[workflow].get('publishes') is False))
        self.rows.append({'test': test._testMethodName, 'producer': workflow, 'class': fault,
                          'case': str(subtest), 'result': 'non-applicable' if nonapplicable else 'failed' if err else 'passed',
                          'evidence': 'scripts/test_automation_product.py::' + test._testMethodName})

    def addSuccess(self, test):
        super().addSuccess(test)
        self.rows.append({'test': test._testMethodName, 'producer': '', 'class': 'cross-cutting',
                          'case': str(test), 'result': 'passed',
                          'evidence': 'scripts/test_automation_product.py::' + test._testMethodName})


if __name__ == '__main__':
    output = Path('reports/data-review-product-2026-10-24')
    output.mkdir(parents=True, exist_ok=True)
    log = io.StringIO()
    result = unittest.TextTestRunner(stream=log, verbosity=2, resultclass=Evidence).run(
        unittest.defaultTestLoader.loadTestsFromTestCase(ProductContracts))
    (output / 'matrix-test-log.txt').write_text(log.getvalue())
    document = {'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'productionFaultsInjected': False,
                'scope': 'Real supervision reducers/readers with isolated faults; not source transport certification',
                'producers': list(REGISTRY), 'testsRun': result.testsRun, 'successful': result.wasSuccessful(), 'rows': result.rows}
    (output / 'matrice-controles.json').write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n')
    with (output / 'matrice-controles.csv').open('w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['producer', 'class', 'result', 'test', 'case', 'evidence'])
        writer.writeheader()
        writer.writerows(result.rows)
    print(json.dumps({'tests': result.testsRun, 'cases': len(result.rows), 'successful': result.wasSuccessful()}))
    raise SystemExit(not result.wasSuccessful())
