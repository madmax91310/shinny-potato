"""Keep successful evidence dates across failed collection attempts."""


def holdings_status(previous, retained, fresh, error, now):
    partial = fresh is not None and fresh.get('sourcePartial') is True
    if fresh is not None and not partial:
        success = now.isoformat()
    elif partial or retained.get('sourcePartial'):
        success = (previous.get('lastSuccessAt')
                   or (retained.get('checkedAt') if not retained.get('sourcePartial') else None))
    else:
        success = (retained.get('checkedAt') or previous.get('lastSuccessAt')
                   or (previous.get('checkedAt') if previous.get('status') == 'validated' else None))
    if partial:
        error = error or fresh.get('partialSourceError') or 'Source partielle : valeurs de positions non qualifiées'
    return {'checkedAt': now.isoformat(), 'lastSuccessAt': success,
            'status': 'failed' if error else 'validated',
            'asOf': (fresh if fresh is not None else retained).get('asOf'),
            **({'error': error} if error else {}),
            **({'lastPartialSuccessAt': now.isoformat()} if partial else
               {'lastPartialSuccessAt': previous['lastPartialSuccessAt']} if previous.get('lastPartialSuccessAt') else {})}
