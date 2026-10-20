"""One incident per field/cause, preserving all contradictory source evidence."""
import json


def unique(rows):
    return list({json.dumps(row, sort_keys=True, ensure_ascii=False): row for row in rows}.values())


def qualification_failures(failures):
    result, by_field = [], {}
    for failure in failures:
        if not failure.get('qualificationRequired'):
            result.append(failure)
            continue
        field = failure['field']
        if field not in by_field:
            incident = {**failure, 'category': 'source-conflict', 'sources': [], 'reasons': []}
            by_field[field] = incident
            result.append(incident)
        incident = by_field[field]
        incident['sources'] = unique([*incident['sources'], *failure.get('sources', [])])
        incident['reasons'] = list(dict.fromkeys([*incident['reasons'], failure['error']]))
        incident['error'] = ' | '.join(incident['reasons'])
    return unique(result)


def report_incidents(errors):
    result = {}
    for error in errors:
        key = error['id']
        if key not in result:
            result[key] = {**error}
        else:
            incident = result[key]
            incident['reasons'] = list(dict.fromkeys([
                *incident.get('reasons', [incident['error']]),
                *error.get('reasons', [error['error']])]))
            incident['error'] = ' | '.join(incident['reasons'])
            incident['sources'] = unique([*incident.get('sources', []), *error.get('sources', [])])
    return list(result.values())
