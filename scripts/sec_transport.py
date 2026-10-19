"""SEC fair-access pacing shared by concurrent company collectors.

A 403 opens a short circuit instead of multiplying refused requests. No mirror,
invented contact or browser impersonation is used to bypass access restrictions.
"""
import os
import threading
import time
import urllib.error
from urllib.parse import urlparse

_lock = threading.Lock()
_next_request = 0.0
_blocked_until = 0.0
INTERVAL = 0.25  # at most four starts/second across this Python process
COOLDOWN = 300


def is_sec(url):
    return urlparse(url).hostname in ('data.sec.gov', 'www.sec.gov', 'sec.gov')


def user_agent():
    configured = os.environ.get('SEC_USER_AGENT', '').strip()
    if configured and ('\n' in configured or '\r' in configured or len(configured) > 300):
        raise ValueError('Invalid SEC_USER_AGENT configuration')
    return configured or 'EpargnantLibre/1.0 https://github.com/madmax91310/shinny-potato'


def before_request(url, clock=time.monotonic, sleep=time.sleep):
    if not is_sec(url):
        return
    global _next_request
    with _lock:
        current = clock()
        if current < _blocked_until:
            raise urllib.error.HTTPError(url, 403,
                'SEC access cooldown; previous refusal retained. Configure a genuine operator contact in SEC_USER_AGENT.', None, None)
        delay = max(0, _next_request-current)
        _next_request = max(current, _next_request) + INTERVAL
        # Keep the lock while waiting: no concurrent worker can pass its slot.
        if delay:
            sleep(delay)


def refused(url, clock=time.monotonic):
    if is_sec(url):
        global _blocked_until
        with _lock:
            _blocked_until = clock() + COOLDOWN
