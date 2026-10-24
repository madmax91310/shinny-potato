"""Retry safe GitHub reads; never replay an uncertain dispatch or notification."""
import http.client
import json
import time
import urllib.error
import urllib.request
from data_automation import retry_delay


def request_json(url, token, method='GET', data=None, opener=urllib.request.urlopen, sleep=time.sleep):
    request=urllib.request.Request(url,method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Authorization':f'Bearer {token}','Accept':'application/vnd.github+json',
                 'User-Agent':'EpargnantLibre-Automation','Content-Type':'application/json'})
    attempts=3 if method=='GET' else 1
    for attempt in range(attempts):
        try:
            with opener(request,timeout=25) as response:
                return json.load(response) if response.status!=204 else None
        except urllib.error.HTTPError as error:
            if error.code not in (408,429,500,502,503,504) or attempt==attempts-1:
                raise
            delay=retry_delay(error,attempt)
        except (urllib.error.URLError,TimeoutError,http.client.IncompleteRead,ConnectionError):
            if attempt==attempts-1:
                raise
            delay=2**attempt
        sleep(delay)


def unseen_completed_runs(candidates, previous):
    """Catch up every missed workflow_run event, without replaying observed reports."""
    old=(previous.get('runId',0),previous.get('attempt',1))
    eligible=[r for r in candidates if r.get('head_branch')=='master'
              and r.get('status')=='completed'
              and r.get('event') in ('push','schedule','workflow_dispatch','workflow_run')
              and r.get('conclusion') not in ('cancelled','skipped','neutral')
              and (r['id'],r.get('run_attempt',1))>old]
    return sorted(eligible,key=lambda r:(r['id'],r.get('run_attempt',1)))
