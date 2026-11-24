import unittest
from datetime import date, timedelta

from exh8_market_history import END, EXPECTED_ACTION_DATES, START, issuer_cash, verify_adjustments


class MarketWindowTests(unittest.TestCase):
    def setUp(self):
        self.cash = issuer_cash()
        self.assertEqual(set(self.cash), EXPECTED_ACTION_DATES)
        start, end = date.fromisoformat(START), date.fromisoformat(END)
        days = [(start+timedelta(days=i)).isoformat() for i in range((end-start).days+1)
                if (start+timedelta(days=i)).weekday() < 5]
        omitted = [x for x in days[1:-1] if x not in self.cash][:len(days)-252]
        self.quotes = {}
        unit = .8
        for day in days:
            if day in omitted:
                continue
            unit /= 1 - self.cash.get(day, 0)/32
            self.quotes[day] = 32, 32*unit

    def test_all_four_events_and_unadjusted_intervals(self):
        checks, maximum = verify_adjustments(self.quotes, self.cash)
        self.assertEqual([v['exDate'] for v in checks], sorted(EXPECTED_ACTION_DATES))
        self.assertLess(maximum, 1e-12)

    def test_unexpected_cash_or_missing_session_keeps_refusal(self):
        with self.assertRaisesRegex(ValueError, 'unexpected market adjustment'):
            changed = {**self.quotes, END: (32, 28)}
            verify_adjustments(changed, self.cash)
        with self.assertRaisesRegex(ValueError, 'daily sessions incomplete'):
            verify_adjustments({d:p for d,p in self.quotes.items() if d != END}, self.cash)
        with self.assertRaisesRegex(ValueError, 'dividend sessions incomplete'):
            verify_adjustments(self.quotes, {})
