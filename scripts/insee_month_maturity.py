"""Keep official flash estimates separate from closed monthly histories."""
from data_automation import reject


def pending_price_month(date, now, *, value, quality, observation_status):
    if date != now.date().replace(day=1):
        return None
    if quality != 'P':
        reject('Unexpected definitive price observation for an incomplete month')
    return {'month': date.strftime('%Y-%m'), 'value': value, 'quality': quality,
            'observationStatus': observation_status,
            'reason': 'official-provisional-incomplete-calendar-month',
            'includedInActiveHistory': False}
