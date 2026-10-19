"""Keep successful evidence dates across failed collection attempts."""


def holdings_status(previous, retained, fresh, error, now):
    success = (now.isoformat() if fresh is not None else retained.get('checkedAt')
               or previous.get('lastSuccessAt')
               or (previous.get('checkedAt') if previous.get('status') == 'validated' else None))
    return {'checkedAt': now.isoformat(), 'lastSuccessAt': success,
            'status': 'failed' if error else 'validated',
            'asOf': (fresh if fresh is not None else retained).get('asOf'),
            **({'error': error} if error else {})}
